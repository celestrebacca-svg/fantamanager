// ===== SPONSOR PRINCIPALI — PEZZO 1: motore + schermata di prova =====
// Dipende da: sb, squadreDB, utenteLoggato, adminLoggato, showToast (già nell'app)
// Soldi in FM "interi" (come budget e costi: 1M = 1000000). Nessun accredito al budget in questo pezzo.

const SP_DIM = ['visibilita','crescita','vittorie','solidita','commerciale','vivaio','collaborazione','costi'];

const SP_SLOT = {
  principale: {label:'Principale',     emoji:'🏆', mediana:50e6, sigma:0.65, min:8e6,  max:320e6, n:[90,120], boost:{}},
  food:       {label:'Food',           emoji:'🍔', mediana:12e6, sigma:0.6,  min:2e6,  max:60e6, n:[25,40],  boost:{commerciale:3}},
  merch:      {label:'Merchandising',  emoji:'👕', mediana:12e6, sigma:0.6,  min:2e6,  max:60e6, n:[25,40],  boost:{vittorie:2.5, commerciale:1.5}}
};

// gen = quanto cede a ogni rilancio, paz = pazienza iniziale (min-max), ap = apertura rispetto al tetto
const SP_CARATTERI = {
  generoso:   {gen:0.60, paz:[5,7], ap:0.55},
  prudente:   {gen:0.40, paz:[4,5], ap:0.45},
  orgoglioso: {gen:0.30, paz:[3,4], ap:0.50},
  tirchio:    {gen:0.35, paz:[4,6], ap:0.35},
  ambizioso:  {gen:0.50, paz:[4,5], ap:0.50}
};

const SP_NOMI = {
  principale: {
    pre:['Aurora','Nexus','Vertex','Helios','Titan','Orion','Zenith','Atlas','Vulcan','Nova','Apex','Kronos','Pegaso','Lumen','Boreal','Cobalto','Meridian','Altair','Sirio','Fenice','Delta','Omega','Stellar','Monolith','Aquila','Borea','Cirrus','Dorado','Eclipse','Falco'],
    suf:['Group','Holding','Telecom','Energia','Motors','Bank','Media','Assicurazioni','Airlines','Tech','Costruzioni','Pharma','Streaming','Gaming','Logistica','Sports','Capital','Industries']
  },
  food: {
    pre:['Casa','Forno','Tavola','Gusto','Sapore','Bar','Pizza','Dolce','Birra','Caffè','Gelato','Panino','Trattoria','Fresco','Bibita','Spuntino','Griglia','Mulino','Orto','Frutteto'],
    suf:['Rossi','Italia','Express','Gourmet','Bevande','Snack','Foods','del Borgo','Bros','Co.','Premium','Fresh']
  },
  merch: {
    pre:['Maglieria','Tessile','Trofeo','Storia','Stile','Collezione','Atelier','Ricamo','Gloria','Vintage','Tifoso','Curva','Sartoria','Bandiera','Emblema','Cimelio','Archivio','Epoca','Blasone','Sciarpa'],
    suf:['Sport','Store','Moda','Heritage','Club','Italia','Design','Outlet','Co.','Antica','Gold','Originals']
  }
};

// ---------- utilità ----------
let SP_R = Math.random; // durante la generazione del pool diventa un generatore con seme (pool uguale a ogni apertura, senza salvarlo)
function spHash(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
function spMulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const spRnd = (a,b) => a + SP_R()*(b-a);
const spInt = (a,b) => Math.floor(spRnd(a,b+1));
const spPick = arr => arr[Math.floor(SP_R()*arr.length)];
const spClamp = (x,a=0,b=1) => Math.max(a,Math.min(b,x));
const spEsc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function spRandn(){ let u=0,v=0; while(!u) u=SP_R(); while(!v) v=SP_R(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
const spFmt = n => (n/1e6).toLocaleString('it-IT',{maximumFractionDigits:2})+'M';
// clima del mercato sponsor: cambia ogni stagione, uguale per tutte le squadre (±12% sui budget)
function spClima(stagione){ return 0.88 + 0.24*spMulberry(spHash('clima|'+stagione))(); }
function spStagione(){ return (typeof STAGIONE_CORRENTE!=='undefined' && STAGIONE_CORRENTE) ? STAGIONE_CORRENTE : '2026/27'; }

// ---------- 1) valutazione del progetto ----------
// crescita annua → credibilità (≤25%/anno = ok, ≥100%/anno = impossibile)
function spRealismoCrescita(yearly){ return spClamp(1 - Math.max(0, yearly-0.25)/0.75); }

function spBase(sq){
  return {
    tifosi: sq.tifosi||0,
    followers: sq.social_followers||0,
    fastfood: sq.fastfood_livello||0,
    capienza: sq.capienza_stadio||0,
    trofei: (sq.trofei||[]).length,
    budget: sq.budget||0
  };
}

// valuta ogni obiettivo: realismo (0-1) e ambizione (0-1)
function spValutaObiettivo(o, base, d){
  let realismo=1, ambizione=0;
  const crescita = (ratio) => Math.pow(Math.max(ratio,0.0001), 1/d) - 1;
  if(o.tipo==='tifosi_pct'){
    const y = crescita(1 + o.target/100);
    realismo = spRealismoCrescita(y); ambizione = spClamp(y/0.5);
  } else if(o.tipo==='follower'){
    const y = crescita(o.target/Math.max(base.followers,1));
    realismo = spRealismoCrescita(y); ambizione = spClamp(y/0.5);
  } else if(o.tipo==='stadio'){
    const y = crescita(o.target/Math.max(base.capienza,1));
    realismo = spRealismoCrescita(y); ambizione = spClamp(y/0.5);
  } else if(o.tipo==='fastfood'){
    const perAnno = (o.target-base.fastfood)/d;
    if(perAnno<=0){ realismo=0.2; ambizione=0; }
    else { realismo = spClamp(1-(perAnno-1)/1.5); ambizione = spClamp(perAnno/1.5); }
  } else if(o.tipo==='trofei'){
    const perAnno = o.target/d;
    realismo = spClamp(1-(perAnno-0.4)/0.6); ambizione = spClamp(perAnno/0.8);
  } else if(o.tipo==='budget_min'){
    const tgt = o.target*1e6; // il budget minimo è espresso in milioni
    realismo = tgt<=base.budget ? 1 : spClamp(1-(tgt-base.budget)/Math.max(base.budget,1e6));
    ambizione = 0.3;
  }
  return {realismo, ambizione};
}

// progetto = {strategia:'subito'|'equilibrata'|'futuro', durata:3-5, obiettivi:[{tipo,target}], canali:[...]}
function spValutaProgetto(p, sq){
  const base = spBase(sq), d = p.durata||5;
  const val = p.obiettivi.map(o => ({o, ...spValutaObiettivo(o, base, d)}));
  const cred = val.length ? val.reduce((s,x)=>s+x.realismo,0)/val.length : 0.2;
  const di = tipi => val.filter(x=>tipi.includes(x.o.tipo));
  // un obiettivo irrealistico non dà credito di ambizione
  const media = arr => arr.length ? arr.reduce((s,x)=>s+x.ambizione*x.realismo,0)/arr.length : 0;
  const canali = p.canali||[];
  const v = {
    visibilita: spClamp(canali.length/6*0.6 + (di(['follower']).length?0.4:0)),
    crescita:   spClamp(media(di(['tifosi_pct','follower','stadio']))*1.3),
    vittorie:   spClamp(di(['trofei']).length ? 0.5+0.5*media(di(['trofei'])) : 0),
    solidita:   spClamp(cred*0.7 + (di(['budget_min']).length?0.3:0)),
    commerciale:spClamp((di(['fastfood']).length?0.5:0)+(di(['stadio']).length?0.3:0)+(canali.includes('maglia')?0.2:0)),
    vivaio:     spClamp((p.strategia==='futuro'?0.7:p.strategia==='equilibrata'?0.35:0)+(canali.includes('under23')?0.3:0)),
    collaborazione: 0.4,  // il modulo non può misurarlo: solo la presentazione scritta
    costi: 0.4
  };
  return {v, cred, dettaglio:val};
}

// ---------- 2) generazione pool ----------
function spGeneraPool(sq, slot, progettoVal, stagione, seedStr){
  SP_R = spMulberry(spHash(String(seedStr||Math.random())+'|'+slot));
  try { return spGeneraPoolInterno(sq, slot, progettoVal, stagione); } finally { SP_R = Math.random; }
}
function spGeneraPoolInterno(sq, slot, progettoVal, stagione){
  const S = SP_SLOT[slot];
  const n = spInt(S.n[0], S.n[1]);
  const nomiUsati = new Set();
  const righe = [];
  for(let i=0;i<n;i++){
    let nome, tent=0;
    do { nome = spPick(SP_NOMI[slot].pre)+' '+spPick(SP_NOMI[slot].suf); tent++; if(tent>20) nome += ' '+spInt(2,99); } while(nomiUsati.has(nome));
    nomiUsati.add(nome);
    const carattere = spPick(Object.keys(SP_CARATTERI));
    const C = SP_CARATTERI[carattere];
    // impegno totale: molti sponsor medio-bassi, pochi medio-alti, rarissimi altissimi (coda lunga) + clima di stagione
    let impegno = S.mediana*Math.exp(S.sigma*spRandn());
    if(SP_R() < 0.03) impegno *= 1.6;                                   // il "mega sponsor": raro
    impegno = spClamp(impegno*spClima(stagione), S.min, S.max);
    const budget_totale = Math.round(impegno);
    const r0 = SP_R(); const orizzonte = r0<0.25 ? 3 : r0<0.50 ? 4 : 5;   // su quanti anni ragiona (nascosto): chi ragiona su 3 anni spende di più all'anno
    const extra_totale = Math.round(impegno*spRnd(0.3,1.0));            // quanto può aggiungere SE gli proponi le idee giuste (clausole, contenuti): lo useremo nel pezzo successivo
    let pesi = {}, tot=0;
    SP_DIM.forEach(d => { pesi[d] = (SP_R()**2+0.05)*(S.boost[d]||1); tot+=pesi[d]; });
    SP_DIM.forEach(d => pesi[d] = +(pesi[d]/tot).toFixed(4));
    const sens = {tono:SP_R(), orig:SP_R(), ego:SP_R()}; // quanto badano a stile, originalità, egocentrismo
    righe.push({id:slot+'-'+i, squadra_id:sq.id, stagione, slot, nome, carattere, budget_totale, orizzonte, extra_totale, pesi, sens, rumore:spRnd(-0.06,0.06),
                pazienza: spInt(C.paz[0],C.paz[1])});
  }
  // tier = posizione del budget nel pool (0 = povero, 1 = ricchissimo)
  const ordinati = [...righe].sort((a,b)=>a.budget_totale-b.budget_totale);
  ordinati.forEach((r,i)=>{ r.tier = i/Math.max(ordinati.length-1,1); });
  righe.forEach(r => {
    r.soglia = +(0.12 + 0.85*Math.pow(r.tier,1.1) + r.rumore).toFixed(4);
    const mix = SP_DIM.reduce((s,d)=>s+r.pesi[d]*(progettoVal.v[d]||0),0);
    const tr = progettoVal.tratti || {tono:0.5, altruismo:0.5, orig:0.5};
    const stile = 0.25*(r.sens.tono*(tr.tono-0.5) + r.sens.orig*(tr.orig-0.5) + r.sens.ego*(tr.altruismo-0.5));
    r.score = +Math.max(0, mix*(0.25+0.75*Math.pow(progettoVal.cred,1.5)) + stile).toFixed(4);
  });
  // almeno 1 sponsor per slot si fa sempre avanti: il più "facile"
  const facile = righe.reduce((m,r)=> (r.soglia-r.score < m.soglia-m.score)? r : m, righe[0]);
  righe.forEach(r => {
    const diff = r.score - r.soglia;
    r.interesse = diff>=0.20 ? 'molto' : diff>=0.05 ? 'interessato' : (diff>=0 || r===facile) ? 'tiepido' : 'nessuno';
    r.stato = r.interesse==='nessuno' ? 'ritirato' : 'disponibile';
    const margine = spClamp(diff,0,0.4)/0.4;
    r.techo_annuo = Math.round(r.budget_totale/r.orizzonte*(0.9+0.5*margine));
    r.offerta_annua = Math.round(r.techo_annuo*SP_CARATTERI[r.carattere].ap);
    r.durata = progettoVal.durata;
    delete r.tier; delete r.rumore;
  });
  return righe;
}

// ---------- 3) trattativa ----------
const SP_FRASI = {
  accettato:[
    'Mi sembra un accordo giusto per entrambi. Prepariamo il contratto.',
    'Va bene, ci stiamo. Stringiamoci la mano.'
  ],
  controproposta:[
    'Faccio uno sforzo e salgo a {x} l\'anno. Più di così diventa difficile.',
    'Ci siamo avvicinati. La mia proposta ora è {x} l\'anno.',
    'Ho rivisto i numeri con il mio consiglio: {x} l\'anno.'
  ],
  dura:[
    'Così mi chiede di comprare il club, non di sponsorizzarlo. Le offro {x} l\'anno.',
    'Siamo lontani dalla mia idea di investimento. Posso arrivare a {x} l\'anno.'
  ],
  ultima:[
    'Questa è la mia ultima proposta: {x} l\'anno. Non ho altro margine.'
  ],
  ritirato:[
    'Credo che non siamo sulla stessa lunghezza d\'onda. Preferisco ritirarmi. Buona fortuna.',
    'Ho pazienza, ma non infinita. Cerco altrove, arrivederci.'
  ]
};

function spTratta(sp, richiesta){
  const C = SP_CARATTERI[sp.carattere];
  let offerta = sp.offerta_annua, techo = sp.techo_annuo, paz = sp.pazienza;
  const frase = (k,x) => spPick(SP_FRASI[k]).replace('{x}', spFmt(x));
  if(richiesta <= offerta*1.001){
    return {esito:'accettato', offerta:Math.round(richiesta), pazienza:paz, msg:frase('accettato')};
  }
  let nuova, costo;
  if(richiesta <= techo){
    nuova = offerta + (richiesta-offerta)*C.gen;
    costo = (richiesta-offerta)/offerta > 0.5 ? 2 : 1;
  } else {
    nuova = offerta + (techo-offerta)*C.gen*0.5;
    costo = richiesta > techo*1.6 ? 3 : 2;
  }
  nuova = Math.min(Math.round(nuova), techo);
  paz -= costo;
  if(paz <= 0) return {esito:'ritirato', offerta, pazienza:0, msg:frase('ritirato')};
  if(richiesta <= nuova*1.03) return {esito:'accettato', offerta:Math.round(richiesta), pazienza:paz, msg:frase('accettato')};
  const ultima = nuova >= techo*0.995 || paz <= 1;
  return {esito:'controproposta', offerta:nuova, pazienza:paz,
          msg: frase(ultima?'ultima':(richiesta>techo?'dura':'controproposta'), nuova)};
}

// ---------- 4) obiettivi e contratto ----------
const SP_OBIETTIVI_SLOT = {
  principale: null, // tutti
  food:  ['fastfood','stadio','tifosi_pct'],
  merch: ['trofei','follower','tifosi_pct']
};
const SP_TIPI = {
  tifosi_pct:{label:'Crescita tifosi (%)',  def:100},
  follower:  {label:'Follower da raggiungere', def:50000},
  fastfood:  {label:'Fast food livello',     def:4},
  stadio:    {label:'Stadio (posti)',        def:40000},
  trofei:    {label:'Trofei da vincere',     def:2},
  budget_min:{label:'Budget minimo (M)',     def:10}
};

function spObiettiviPerSlot(obiettivi, slot){
  const ok = SP_OBIETTIVI_SLOT[slot];
  return ok ? obiettivi.filter(o=>ok.includes(o.tipo)) : obiettivi;
}

// obiettivo → target assoluto confrontabile con i dati della squadra
function spTargetAssoluto(o, base){
  switch(o.tipo){
    case 'tifosi_pct': return Math.round(base.tifosi*(1+o.target/100));
    case 'follower':   return o.target;
    case 'fastfood':   return o.target;
    case 'stadio':     return o.target;
    case 'trofei':     return base.trofei + o.target;
    case 'budget_min': return o.target*1e6;
  }
  return o.target;
}
function spValoreAttuale(o, sq){
  switch(o.tipo){
    case 'tifosi_pct': return sq.tifosi||0;
    case 'follower':   return sq.social_followers||0;
    case 'fastfood':   return sq.fastfood_livello||0;
    case 'stadio':     return sq.capienza_stadio||0;
    case 'trofei':     return (sq.trofei||[]).length;
    case 'budget_min': return sq.budget||0;
  }
  return 0;
}

// verdetto a fine contratto: tutti ok → rinnovo con aumento; metà o meno → decade
function spControllaContratto(sq, c){
  const base = c.base||{};
  const righe = (c.obiettivi||[]).map(o => {
    const target = spTargetAssoluto(o, base);
    const attuale = spValoreAttuale(o, sq);
    return {tipo:o.tipo, label:SP_TIPI[o.tipo]?.label||o.tipo, target, attuale, ok: attuale>=target};
  });
  const nOk = righe.filter(r=>r.ok).length;
  const quota = righe.length ? nOk/righe.length : 0;
  let verdetto, nota;
  if(righe.length && nOk===righe.length){ verdetto='rinnovo'; nota='Tutti gli obiettivi raggiunti: rinnovo con cifra più alta.'; }
  else if(quota>0.5){ verdetto='rinnovo_ridotto'; nota='Buona parte raggiunta: rinnovo ma con cifra ridotta.'; }
  else { verdetto='decade'; nota='Obiettivi in gran parte mancati: il contratto decade.'; }
  return {righe, nOk, totale:righe.length, verdetto, nota};
}

// ---------- 5) schermata di prova ----------
const SP = {modo:'testo', sqId:null, tab:'principale', sponsorId:null, sponsors:[], progetto:null, contratti:[], log:{}};

function spSq(){ return squadreDB.find(s=>s.id===SP.sqId); }

async function spCarica(){
  const st = spStagione(), sq = spSq();
  const [a,b,c] = await Promise.all([
    sb.from('sp_progetti').select('*').eq('squadra_id',SP.sqId).eq('stagione',st).maybeSingle(),
    sb.from('sp_trattative').select('*').eq('squadra_id',SP.sqId).eq('stagione',st),
    sb.from('sp_contratti').select('*').eq('squadra_id',SP.sqId).order('created_at',{ascending:false})
  ]);
  SP.progetto = a.data || null;
  SP.contratti = c.data || [];
  SP.sponsors = [];
  if(SP.progetto){
    // il pool NON è salvato: si rigenera identico dal seme e dai valori congelati alla presentazione
    const pr = SP.progetto.progetto, val = pr.val;
    Object.keys(SP_SLOT).forEach(slot => {
      SP.sponsors = SP.sponsors.concat(spGeneraPool(sq, slot, {v:val.v, cred:val.cred, tratti:val.tratti, durata:pr.durata}, st, pr.seed));
    });
    (b.data||[]).forEach(o => {
      const s = SP.sponsors.find(x=>x.id===o.key);
      if(s) Object.assign(s, {stato:o.stato, offerta_annua:o.offerta_annua, pazienza:o.pazienza, round:o.round});
    });
  }
}
async function spSalvaTrattativa(sp){
  const r = await sb.from('sp_trattative').upsert({squadra_id:SP.sqId, stagione:spStagione(), key:sp.id,
    stato:sp.stato, offerta_annua:sp.offerta_annua, pazienza:sp.pazienza, round:sp.round||0});
  if(r.error) showToast('❌ Errore: '+r.error.message,'error');
}

function spModal(){
  let m = document.getElementById('modal-sp');
  if(!m){
    m = document.createElement('div');
    m.id = 'modal-sp'; m.className = 'modal-overlay';
    m.onclick = e => { if(e.target===m) m.classList.remove('open'); };
    m.innerHTML = `<div class="modal" style="max-width:520px">
      <div class="modal-header"><h2 class="modal-title">🤝 SPONSOR PRINCIPALI</h2>
      <button class="modal-close" onclick="document.getElementById('modal-sp').classList.remove('open')">✕</button></div>
      <div id="sp-body" style="padding:14px 16px 20px"></div></div>`;
    document.body.appendChild(m);
  }
  m.classList.add('open');
}

async function apriSponsorPrincipali(){
  spModal();
  document.getElementById('sp-body').innerHTML = '<div style="padding:30px;text-align:center;color:var(--testo-dim)">Caricamento…</div>';
  if(adminLoggato){
    if(!SP.sqId) SP.sqId = squadreDB[0].id;
  } else {
    SP.sqId = utenteLoggato.id;
  }
  SP.sponsorId = null;
  await spCarica();
  spRender();
}

async function spCambiaSquadra(id){ SP.sqId=id; SP.sponsorId=null; await spCarica(); spRender(); }

function spRender(){
  const body = document.getElementById('sp-body');
  const sq = spSq();
  const sel = adminLoggato ? `<div class="form-group"><label class="form-label">Squadra (test admin)</label>
    <select class="form-select" onchange="spCambiaSquadra(this.value)">${squadreDB.map(s=>`<option value="${s.id}" ${s.id===SP.sqId?'selected':''}>${s.nome}</option>`).join('')}</select></div>` : '';
  let html = sel;
  if(!SP.progetto) html += spHtmlForm(sq);
  else if(SP.sponsorId) html += spHtmlTrattativa();
  else html += spHtmlLista(sq);
  body.innerHTML = html;
}

function spHtmlForm(sq){
  if(SP.modo==='modulo') return spHtmlModulo(sq);
  const b = spBase(sq);
  return `<div style="font-size:13px;margin-bottom:8px">Presentati agli sponsor <b>con parole tue</b>, come in un vero incontro. Hai <b>una sola occasione per stagione</b>.</div>
    <div style="font-size:12px;color:var(--testo-dim);margin-bottom:10px;line-height:1.5">Racconta: dove vuole arrivare il club e quanto può restare competitivo negli anni, <b>obiettivi con numeri e tempi</b> nei vari settori, cosa offri in visibilità e cosa hai in più degli altri, <b>quanto costa</b> realizzare le idee e quanto ci metti tu, quanto sei disposto ad ascoltare lo sponsor, dove investi sul mercato (nomi sicuri, giovani o entrambi) con un bilancio sano. <b>Conta anche come ti poni e come spieghi le cose</b>: modo di scrivere, chiarezza, rispetto per chi hai davanti. Frasi vuote e promesse irrealistiche ti fanno perdere credibilità.</div>
    <div style="font-size:11px;color:var(--testo-dim);margin-bottom:6px">Dati reali del club: ${b.tifosi.toLocaleString('it-IT')} tifosi · ${b.followers.toLocaleString('it-IT')} follower · fast food liv. ${b.fastfood} · stadio ${b.capienza.toLocaleString('it-IT')} posti · ${b.trofei} trofei · budget ${spFmt(b.budget)}</div>
    <textarea id="sp-testo" class="form-input" rows="10" maxlength="3000" style="width:100%;resize:vertical" placeholder="Buongiorno, siamo un club..." oninput="document.getElementById('sp-cont').textContent=this.value.length+' / 3000 (minimo 150)'"></textarea>
    <div id="sp-cont" style="font-size:11px;color:var(--testo-dim);text-align:right">0 / 3000 (minimo 150)</div>
    <button class="btn-primary" id="sp-btn-pres" style="width:100%;margin-top:10px" onclick="spPresentaAI()">📣 PRESENTA IL PROGETTO</button>
    <button onclick="SP.modo='modulo';spRender()" style="margin-top:10px;font-size:11px;cursor:pointer">Preferisco il modulo guidato</button>`;
}

async function spPresentaAI(){
  const sq = spSq();
  const testo = document.getElementById('sp-testo').value.trim();
  if(testo.length < 150){ showToast('❌ Scrivi di più: minimo 150 caratteri','error'); return; }
  if(!confirm('Confermi di presentare il progetto agli sponsor? Si fa una sola volta per stagione e non si può modificare.')) return;
  const btn = document.getElementById('sp-btn-pres');
  btn.disabled = true; btn.textContent = '⏳ Gli sponsor stanno leggendo…';
  const b = spBase(sq);
  let ai;
  try{
    const r = await fetch('/api/sponsor-ai', {method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({testo, dati:{tifosi:b.tifosi, followers:b.followers, fastfood:b.fastfood, capienza:b.capienza, trofei:b.trofei, budget:b.budget}})});
    const j = await r.json();
    if(!j.ok) throw new Error(j.error||'errore');
    ai = j.valutazione;
  }catch(e){
    showToast('❌ '+e.message+'. Puoi usare il modulo guidato.','error');
    btn.disabled = false; btn.textContent = '📣 PRESENTA IL PROGETTO'; return;
  }
  if(!ai.obiettivi.length){
    showToast('❌ Nel testo non ci sono obiettivi con numeri (es. "50.000 follower in 3 anni"). Aggiungili e riprova: non hai ancora usato la tua occasione.','error');
    btn.disabled = false; btn.textContent = '📣 PRESENTA IL PROGETTO'; return;
  }
  // l'AI non decide da sola: il codice controlla realismo e coerenza con i numeri dichiarati
  const d = ai.durata;
  const vals = ai.obiettivi.map(o => spValutaObiettivo(o, b, d));
  const realismoCodice = vals.reduce((s,x)=>s+x.realismo,0)/vals.length;
  // conta soprattutto come è scritto il testo (70% giudizio AI); i numeri veri pesano il 30%, ma promesse assurde (realismo<0.2) hanno un tetto
  let cred = (0.7*ai.credibilita + 0.3*realismoCodice) * (0.6 + 0.4*ai.specificita);
  if(realismoCodice < 0.2) cred = Math.min(cred, 0.35);
  // fattori nascosti (lato codice): ripetizioni, prolissità, stile generale, reputazione storica
  const parole = (testo.toLowerCase().match(/\p{L}+/gu) || []);
  if(parole.length > 60 && new Set(parole).size/parole.length < 0.40) cred *= 0.8;      // testo ripetitivo/gonfiato
  if(testo.length > 2200 && ai.specificita < 0.6) cred *= 0.9;                         // tanto testo, poca sostanza
  const t = ai.tratti;
  cred *= 0.92 + 0.16*((t.tono + t.chiarezza + t.apertura)/3);                          // cura generale della scrittura
  const chiusi = SP.contratti.filter(c=>c.stato==='concluso').length, falliti = SP.contratti.filter(c=>c.stato==='decaduto').length;
  cred += Math.min(0.10, chiusi*0.04) - Math.min(0.15, falliti*0.06);                   // reputazione con gli sponsor passati
  cred = spClamp(cred);
  const ha = tipi => ai.obiettivi.some(o=>tipi.includes(o.tipo));
  const v = Object.assign({}, ai.dimensioni);
  if(!ha(['tifosi_pct','follower','stadio'])) v.crescita = Math.min(v.crescita, 0.4);
  if(!ha(['trofei'])) v.vittorie = Math.min(v.vittorie, 0.4);
  if(!ha(['fastfood','stadio']) && !ai.canali.includes('maglia')) v.commerciale = Math.min(v.commerciale, 0.4);
  if(!ha(['budget_min'])) v.solidita = Math.min(v.solidita, 0.7);
  const progetto = {strategia:ai.strategia, durata:d, obiettivi:ai.obiettivi, canali:ai.canali, testo,
    feedback:{forti:ai.punti_forti, deboli:ai.punti_deboli}, seed:Math.floor(Math.random()*1e9),
    val:{v, cred:+cred.toFixed(3), tratti:{tono:t.tono, altruismo:1-t.egocentrismo, orig:t.originalita}}};
  const r1 = await sb.from('sp_progetti').upsert({squadra_id:sq.id, stagione:spStagione(), progetto, credibilita:progetto.val.cred});
  if(r1.error){ showToast('❌ Errore: '+r1.error.message,'error'); btn.disabled=false; btn.textContent='📣 PRESENTA IL PROGETTO'; return; }
  await spCarica(); spRender();
}

function spHtmlModulo(sq){
  const b = spBase(sq);
  const righe = Object.entries(SP_TIPI).map(([k,t])=>{
    const attuale = {tifosi_pct:`ora ${b.tifosi.toLocaleString('it-IT')} tifosi`, follower:`ora ${b.followers.toLocaleString('it-IT')}`,
      fastfood:`ora livello ${b.fastfood}`, stadio:`ora ${b.capienza.toLocaleString('it-IT')} posti`, trofei:`ora ${b.trofei} trofei`,
      budget_min:`budget ora ${spFmt(b.budget)}`}[k];
    return `<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
      <input type="checkbox" id="spo-${k}"><label for="spo-${k}" style="flex:1;font-size:13px">${t.label}<br><span style="font-size:10px;color:var(--testo-dim)">${attuale}</span></label>
      <input class="form-input" type="number" id="spv-${k}" value="${t.def}" style="width:110px"></div>`;
  }).join('');
  const canali = [['maglia','Sponsor sulla maglia'],['stadio','Cartelloni stadio'],['museo','Spazio nel museo'],['social','Tag sui social'],['canale','Canale video/interviste'],['under23','Partite/interviste Under 23']]
    .map(([k,l])=>`<label style="display:block;font-size:13px;margin-bottom:4px"><input type="checkbox" id="spc-${k}"> ${l}</label>`).join('');
  return `<button onclick="SP.modo='testo';spRender()" style="margin-bottom:8px;cursor:pointer">← Torna alla presentazione scritta</button>
    <div style="font-size:12px;color:var(--testo-dim);margin-bottom:10px">Modulo guidato (alternativa): obiettivi realistici fanno guadagnare credibilità.</div>
    <div class="form-group"><label class="form-label">Strategia</label>
      <select class="form-select" id="sp-strategia"><option value="equilibrata">Equilibrata</option><option value="subito">Tutto e subito (ingaggi pesanti)</option><option value="futuro">Costruire per il futuro (giovani)</option></select></div>
    <div class="form-group"><label class="form-label">Durata desiderata (anni)</label>
      <select class="form-select" id="sp-durata"><option>3</option><option>4</option><option selected>5</option></select></div>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:14px;color:var(--oro);margin:10px 0 6px">OBIETTIVI</div>${righe}
    <div style="font-family:'Bebas Neue',sans-serif;font-size:14px;color:var(--oro);margin:10px 0 6px">VISIBILITÀ CHE OFFRI</div>${canali}
    <button class="btn-primary" style="width:100%;margin-top:12px" onclick="spPresenta()">📣 PRESENTA IL PROGETTO</button>`;
}

async function spPresenta(){
  const sq = spSq();
  const obiettivi = Object.keys(SP_TIPI).filter(k=>document.getElementById('spo-'+k).checked)
    .map(k=>({tipo:k, target:parseFloat(document.getElementById('spv-'+k).value)||0}));
  const canali = ['maglia','stadio','museo','social','canale','under23'].filter(k=>document.getElementById('spc-'+k).checked);
  if(!obiettivi.length){ showToast('❌ Scegli almeno un obiettivo','error'); return; }
  if(!confirm('Confermi di presentare il progetto agli sponsor? Si fa una sola volta per stagione e non si può modificare.')) return;
  const progetto = {strategia:document.getElementById('sp-strategia').value, durata:parseInt(document.getElementById('sp-durata').value), obiettivi, canali};
  const val = spValutaProgetto(progetto, sq);
  progetto.seed = Math.floor(Math.random()*1e9);          // seme del pool
  progetto.val = {v:val.v, cred:+val.cred.toFixed(3)};    // valori congelati: il pool non cambia se poi cambiano i tuoi dati
  const st = spStagione();
  const r1 = await sb.from('sp_progetti').upsert({squadra_id:sq.id, stagione:st, progetto, credibilita:progetto.val.cred});
  if(r1.error){ showToast('❌ Errore: '+r1.error.message,'error'); return; }
  await spCarica(); spRender();
}

async function spAzzera(){
  if(!confirm('Azzerare presentazione e sponsor di questa squadra? (i contratti firmati restano)')) return;
  const st = spStagione();
  await sb.from('sp_trattative').delete().eq('squadra_id',SP.sqId).eq('stagione',st);
  await sb.from('sp_progetti').delete().eq('squadra_id',SP.sqId).eq('stagione',st);
  await spCarica(); spRender();
}

function spHtmlLista(sq){
  const firmati = {}; SP.contratti.filter(c=>c.stato==='attivo').forEach(c=>firmati[c.slot]=c);
  const tabs = Object.entries(SP_SLOT).map(([k,s])=>{
    const n = SP.sponsors.filter(x=>x.slot===k && x.interesse!=='nessuno').length;
    return `<button onclick="SP.tab='${k}';spRender()" style="flex:1;padding:8px;border-radius:8px;border:1px solid ${SP.tab===k?'gold':'#444'};background:${SP.tab===k?'rgba(255,215,0,0.15)':'transparent'};color:${SP.tab===k?'gold':'#aaa'};cursor:pointer">${s.emoji} ${s.label} (${n})</button>`;
  }).join('');
  const slot = SP.tab;
  let corpo;
  if(firmati[slot]){
    corpo = `<div style="padding:14px;text-align:center;color:var(--verde)">✅ Slot già firmato con <b>${firmati[slot].nome_sponsor}</b></div>`;
  } else {
    const lista = SP.sponsors.filter(x=>x.slot===slot && x.interesse!=='nessuno')
      .sort((a,b)=>({molto:0,interessato:1,tiepido:2}[a.interesse]-{molto:0,interessato:1,tiepido:2}[b.interesse]));
    const scartati = SP.sponsors.filter(x=>x.slot===slot && x.interesse==='nessuno').length;
    const attivi = lista.filter(x=>x.stato==='disponibile'||x.stato==='in_trattativa');
    corpo = `<div style="font-size:12px;color:var(--testo-dim);margin:8px 0">${lista.length} sponsor si sono fatti avanti · ${scartati} non interessati · ${lista.length-attivi.length} ritirati</div>`
      + attivi.map(x=>`<div onclick="spApri('${x.id}')" style="display:flex;justify-content:space-between;align-items:center;padding:10px;margin-bottom:6px;background:var(--grigio-scuro);border-radius:8px;cursor:pointer">
          <span>${x.nome}</span><span style="font-size:11px;color:${x.interesse==='molto'?'var(--verde)':x.interesse==='interessato'?'var(--oro)':'var(--testo-dim)'}">${x.interesse==='molto'?'molto interessato':x.interesse}</span></div>`).join('');
  }
  const contratti = SP.contratti.length ? `<div style="font-family:'Bebas Neue',sans-serif;font-size:14px;color:var(--oro);margin:16px 0 6px">CONTRATTI</div>`
    + SP.contratti.map(c=>`<div style="padding:10px;margin-bottom:6px;background:var(--grigio-scuro);border-radius:8px;font-size:12px">
        <b>${c.nome_sponsor}</b> (${SP_SLOT[c.slot]?.label}) · ${spFmt(c.fisso_annuo)}/anno × ${c.durata} anni · ${c.stato}
        <button onclick="spVerifica('${c.id}')" style="float:right;font-size:11px;cursor:pointer">🔍 Controlla obiettivi</button>
        <div id="spv-res-${c.id}"></div></div>`).join('') : '';
  const admin = adminLoggato ? `<button onclick="spAzzera()" style="margin-top:14px;font-size:11px;cursor:pointer">🔄 Azzera presentazione (TEST)</button>` : '';
  const fb = adminLoggato && SP.progetto && SP.progetto.progetto && SP.progetto.progetto.feedback; // solo admin: i giocatori non vedono gli errori
  const feed = fb && (fb.forti.length||fb.deboli.length) ? `<div style="font-size:12px;background:var(--grigio-scuro);border-radius:8px;padding:10px;margin-bottom:10px;line-height:1.5">
      <b>Valutazione AI (solo admin)</b>${fb.forti.map(x=>`<div>✅ ${spEsc(x)}</div>`).join('')}${fb.deboli.map(x=>`<div>⚠️ ${spEsc(x)}</div>`).join('')}</div>` : '';
  return `${feed}<div style="display:flex;gap:6px;margin-bottom:6px">${tabs}</div>${corpo}${contratti}${admin}`;
}

function spApri(id){ SP.sponsorId=id; spRender(); }
function spIndietro(){ SP.sponsorId=null; spRender(); }

function spHtmlTrattativa(){
  const sp = SP.sponsors.find(x=>x.id===SP.sponsorId);
  const aperta = (sp.round||0) > 0;   // finché non si è parlato non mostra nessuna cifra
  const log = SP.log[sp.id] || (SP.log[sp.id] = [{chi:'sponsor', t: aperta
    ? `Riprendiamo da dove eravamo: la mia ultima proposta è ${spFmt(sp.offerta_annua)} l'anno.`
    : `Buongiorno. Ho letto il vostro progetto e la zona ${SP_SLOT[sp.slot].label} mi interessa. Prima di parlare di cifre voglio capire cosa vi aspettate da una collaborazione di ${sp.durata} anni: quanto chiedete, e perché?`}]);
  const chat = log.map(m=>`<div style="margin-bottom:8px;text-align:${m.chi==='tu'?'right':'left'}"><span style="display:inline-block;padding:8px 12px;border-radius:12px;max-width:85%;font-size:13px;background:${m.chi==='tu'?'rgba(255,215,0,0.15)':'var(--grigio-scuro)'}">${m.t}</span></div>`).join('');
  const chiuso = sp.stato==='ritirato'||sp.stato==='firmato';
  return `<button onclick="spIndietro()" style="margin-bottom:8px;cursor:pointer">← Lista sponsor</button>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--oro)">${SP_SLOT[sp.slot].emoji} ${sp.nome}</div>
    <div style="font-size:12px;color:var(--testo-dim);margin-bottom:10px">${aperta ? `Ultima offerta: <b>${spFmt(sp.offerta_annua)}</b>/anno · ${sp.durata} anni = <b>${spFmt(sp.offerta_annua*sp.durata)}</b> totali` : `Durata proposta: ${sp.durata} anni · nessuna offerta ancora sul tavolo`}</div>
    <div style="max-height:260px;overflow:auto;margin-bottom:10px">${chat}</div>
    ${chiuso ? `<div style="text-align:center;color:var(--testo-dim)">Trattativa chiusa</div>` : `
    <div style="display:flex;gap:8px;margin-bottom:8px">
      <input class="form-input" type="number" step="0.1" id="sp-richiesta" placeholder="La tua richiesta in M/anno (es. 10.5)" style="flex:1">
      <button class="btn-primary" onclick="spRilancia()">${aperta?'Rilancia':'Proponi'}</button></div>
    ${aperta ? `<button class="btn-primary" style="width:100%;margin-bottom:6px" onclick="spFirma(${sp.offerta_annua})">✅ ACCETTO ${spFmt(sp.offerta_annua)}/anno (${spFmt(sp.offerta_annua*sp.durata)} totali)</button>` : ''}
    <button onclick="spAbbandona()" style="width:100%;cursor:pointer">🚪 Abbandona la trattativa</button>`}`;
}

async function spRilancia(){
  const sp = SP.sponsors.find(x=>x.id===SP.sponsorId);
  const r = parseFloat(document.getElementById('sp-richiesta').value);
  if(!r || r<=0){ showToast('❌ Inserisci una cifra','error'); return; }
  const richiesta = Math.round(r*1e6);
  const log = SP.log[sp.id];
  log.push({chi:'tu', t:`Chiedo ${spFmt(richiesta)} l'anno.`});
  const res = spTratta(sp, richiesta);
  log.push({chi:'sponsor', t:res.msg});
  const upd = {offerta_annua:res.offerta, pazienza:res.pazienza, round:(sp.round||0)+1, stato: res.esito==='ritirato'?'ritirato':'in_trattativa'};
  Object.assign(sp, upd);
  await spSalvaTrattativa(sp);
  if(res.esito==='accettato'){ await spFirma(res.offerta); return; }
  spRender();
}

async function spAbbandona(){
  const sp = SP.sponsors.find(x=>x.id===SP.sponsorId);
  if(!confirm('Abbandonando, questo sponsor non tornerà più. Confermi?')) return;
  sp.stato='ritirato'; await spSalvaTrattativa(sp);
  SP.sponsorId=null; spRender();
}

async function spFirma(fisso){
  const sp = SP.sponsors.find(x=>x.id===SP.sponsorId);
  const sq = spSq();
  if(SP.contratti.some(c=>c.slot===sp.slot && c.stato==='attivo')){ showToast('❌ Slot già firmato','error'); return; }
  const base = spBase(sq);
  const contratto = {squadra_id:sq.id, sponsor_key:sp.id, slot:sp.slot, nome_sponsor:sp.nome, durata:sp.durata, fisso_annuo:fisso,
    anno_inizio:spStagione(), obiettivi:spObiettiviPerSlot(SP.progetto.progetto.obiettivi, sp.slot), base};
  const r = await sb.from('sp_contratti').insert(contratto);
  if(r.error){ showToast('❌ Errore: '+r.error.message,'error'); return; }
  sp.stato='firmato'; await spSalvaTrattativa(sp);
  showToast('✍️ Contratto firmato con '+sp.nome);
  SP.sponsorId=null; await spCarica(); spRender();
}

async function spVerifica(id){
  const c = SP.contratti.find(x=>x.id===id);
  const res = spControllaContratto(spSq(), c);
  const box = document.getElementById('spv-res-'+id);
  box.innerHTML = `<div style="margin-top:8px;clear:both">` + res.righe.map(r=>`<div>${r.ok?'✅':'❌'} ${r.label}: ${r.attuale.toLocaleString('it-IT')} / ${r.target.toLocaleString('it-IT')}</div>`).join('')
    + `<div style="margin-top:4px;color:var(--oro)">${res.nota}</div></div>`;
}

// pulsante di prova solo per admin (rimuovere quando si integra nel menu)
if(typeof document!=='undefined'){
  setInterval(()=>{
    if(typeof adminLoggato!=='undefined' && adminLoggato && !document.getElementById('sp-test-btn')){
      const b=document.createElement('button');
      b.id='sp-test-btn'; b.textContent='🤝 Sponsor principali (TEST)';
      b.style.cssText='position:fixed;bottom:80px;right:12px;z-index:9999;padding:10px 14px;border-radius:20px;border:1px solid gold;background:#111;color:gold;cursor:pointer;font-size:12px';
      b.onclick=apriSponsorPrincipali;
      document.body.appendChild(b);
    }
  },2000);
}
