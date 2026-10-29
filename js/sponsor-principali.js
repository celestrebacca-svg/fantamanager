// ===== SPONSOR PRINCIPALI — schermata =====
// I dati nascosti e le decisioni stanno sul server (api/sponsor.js): qui si mostra solo ciò che il server manda.
// Dipende da: squadreDB, utenteLoggato, adminLoggato, SESSIONE_TOKEN (da auth.js), showToast (già nell'app)
// Soldi in FM "interi" (come budget e costi: 1M = 1000000).

const SP_SLOT = {
  principale: {label:'Principale',    emoji:'🏆'},
  food:       {label:'Food',          emoji:'🍔'},
  merch:      {label:'Merchandising', emoji:'👕'}
};
const spEsc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const spFmt = n => (n/1e6).toLocaleString('it-IT',{maximumFractionDigits:2})+'M';
const spNum = n => Math.round(n).toLocaleString('it-IT');
const spAnni = n => n === 1 ? 'un anno' : n + ' anni';
const spPacchetto = p => `${spFmt(p.fm)} l'anno + ${spNum(p.tifosi||0)} tifosi e ${spNum(p.follower||0)} follower l'anno`;

const SP = {sqId:null, tab:'principale', sponsorId:null, dati:null, chat:{}, attesa:false, errore:'', pending:''};

// ---------- comunicazione con il server ----------
async function spApi(azione, extra){
  const r = await fetch('/api/sponsor', {method:'POST',
    headers:{'Content-Type':'application/json', 'Authorization':'Bearer ' + (typeof SESSIONE_TOKEN !== 'undefined' && SESSIONE_TOKEN ? SESSIONE_TOKEN : '')},
    body:JSON.stringify({azione, squadra_id: adminLoggato ? SP.sqId : undefined, ...extra})});
  const j = await r.json().catch(() => ({ok:false, error:'Risposta non valida dal server'}));
  if(!j.ok){ const e = new Error(j.error || 'Errore'); e.sessione = (j.sessione === false); throw e; }
  return j;
}
function spErr(e){ SP.errore = '❌ ' + (e.sessione ? 'Sessione scaduta: esci e rientra nell\'app.' : e.message); }
// applica la risposta del server (stato completo degli sponsor di questa squadra)
function spApplica(j){ SP.dati = j; if(j.chat && j.sponsor_id) SP.chat[j.sponsor_id] = j.chat; }

function spSq(){ return squadreDB.find(s => String(s.id) === String(SP.sqId)); }
// una trattativa aperta blocca le altre finché non si accetta, si rifiuta o lo sponsor si ritira (il server lo fa rispettare)
const spInCorso = () => SP.dati && SP.dati.sponsors.find(x => x.stato === 'in_trattativa');

async function spCarica(){
  SP.chat = {};
  try { spApplica(await spApi('carica')); SP.errore = ''; }
  catch(e){ SP.dati = null; spErr(e); }
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
  if(adminLoggato){ if(!SP.sqId) SP.sqId = squadreDB[0].id; } else { SP.sqId = utenteLoggato.id; }
  SP.sponsorId = null; SP.errore = ''; SP.attesa = false; SP.pending = '';
  await spCarica();
  spRender();
}
async function spCambiaSquadra(id){ SP.sqId = id; SP.sponsorId = null; SP.errore = ''; SP.attesa = false; SP.pending = ''; await spCarica(); spRender(); }

function spRender(){
  const body = document.getElementById('sp-body');
  const sel = adminLoggato ? `<div class="form-group"><label class="form-label">Squadra (test admin)</label>
    <select class="form-select" onchange="spCambiaSquadra(this.value)">${squadreDB.map(s=>`<option value="${s.id}" ${String(s.id)===String(SP.sqId)?'selected':''}>${s.nome}</option>`).join('')}</select></div>` : '';
  let html = sel;
  if(!SP.dati) html += `<div style="color:#ff6b6b;font-size:13px;padding:10px 0">${spEsc(SP.errore || 'Impossibile caricare gli sponsor')}</div><button onclick="spCambiaSquadra(SP.sqId)" style="cursor:pointer">Riprova</button>`;
  else if(!SP.dati.presentato) html += spHtmlForm();
  else if(SP.sponsorId) html += spHtmlTrattativa();
  else html += spHtmlLista();
  body.innerHTML = html;
  const ch = document.getElementById('sp-chat'); if(ch) ch.scrollTop = ch.scrollHeight;
}

// ---------- presentazione ----------
function spHtmlForm(){
  const b = SP.dati.base;
  const err = SP.errore ? `<div style="color:#ff6b6b;font-size:12px;margin-bottom:8px">${spEsc(SP.errore)}</div>` : '';
  return `<div style="font-size:13px;margin-bottom:8px">Presentati agli sponsor <b>con parole tue</b>, come in un vero incontro. Hai <b>una sola occasione per stagione</b>.</div>
    <div style="font-size:12px;color:var(--testo-dim);margin-bottom:10px;line-height:1.5">Racconta: dove vuole arrivare il club e quanto può restare competitivo negli anni, <b>obiettivi con numeri e tempi</b> nei vari settori, cosa offri in visibilità e cosa hai in più degli altri, <b>quanto costa</b> realizzare le idee e quanto ci metti tu, quanto sei disposto ad ascoltare lo sponsor, dove investi sul mercato (nomi sicuri, giovani o entrambi) con un bilancio sano. <b>Conta anche come ti poni e come spieghi le cose</b>: modo di scrivere, chiarezza, rispetto per chi hai davanti. Frasi vuote e promesse irrealistiche ti fanno perdere credibilità.</div>
    <div style="font-size:11px;color:var(--testo-dim);margin-bottom:6px">Dati reali del club: ${spNum(b.tifosi)} tifosi · ${spNum(b.followers)} follower · fast food liv. ${b.fastfood} · stadio ${spNum(b.capienza)} posti · ${b.trofei} trofei · budget ${spFmt(b.budget)}</div>
    <textarea id="sp-testo" class="form-input" rows="10" maxlength="3000" style="width:100%;resize:vertical" placeholder="Buongiorno, siamo un club..." oninput="document.getElementById('sp-cont').textContent=this.value.length+' / 3000 (minimo 150)'"></textarea>
    <div id="sp-cont" style="font-size:11px;color:var(--testo-dim);text-align:right">0 / 3000 (minimo 150)</div>${err}
    <button class="btn-primary" id="sp-btn-pres" style="width:100%;margin-top:10px" onclick="spPresentaAI()">📣 PRESENTA IL PROGETTO</button>
`;
}
async function spPresentaAI(){
  const testo = document.getElementById('sp-testo').value.trim();
  if(testo.length < 150){ SP.errore = '❌ Scrivi di più: minimo 150 caratteri'; showToast('❌ Scrivi di più: minimo 150 caratteri','error'); spRender(); document.getElementById('sp-testo').value = testo; return; }
  if(!confirm('Confermi di presentare il progetto agli sponsor? Si fa una sola volta per stagione e non si può modificare.')) return;
  const btn = document.getElementById('sp-btn-pres');
  if(btn){ btn.disabled = true; btn.textContent = '⏳ Gli sponsor stanno leggendo…'; }
  try { spApplica(await spApi('presenta', {testo})); SP.errore = ''; spRender(); }
  catch(e){ spErr(e); spRender(); const t = document.getElementById('sp-testo'); if(t) t.value = testo; }
}

async function spAzzera(){
  if(!adminLoggato || !confirm('Azzerare presentazione e sponsor di questa squadra? (i contratti firmati restano)')) return;
  try { spApplica(await spApi('azzera')); SP.errore = ''; SP.sponsorId = null; SP.chat = {}; } catch(e){ spErr(e); }
  spRender();
}

// ---------- lista ----------
function spHtmlLista(){
  const D = SP.dati;
  const firmati = {}; D.contratti.filter(c=>c.stato==='attivo').forEach(c=>firmati[c.slot]=c);
  const corso = spInCorso();
  const banner = corso ? `<div onclick="spApri('${corso.id}')" style="padding:10px;margin-bottom:8px;background:rgba(0,200,80,0.12);border:1px solid var(--verde);border-radius:8px;cursor:pointer;font-size:13px">🟢 Trattativa in corso con <b>${spEsc(corso.nome)}</b> (${SP_SLOT[corso.slot].label}) · tocca per riprendere<div style="font-size:11px;color:var(--testo-dim);margin-top:3px">Si tratta con uno sponsor per volta: chiudi questa trattativa (accetta o abbandona) per parlare con un altro.</div></div>` : '';
  const err = SP.errore ? `<div style="color:#ff6b6b;font-size:12px;margin-bottom:8px">${spEsc(SP.errore)}</div>` : '';
  const tabs = Object.entries(SP_SLOT).map(([k,s])=>{
    const n = D.sponsors.filter(x=>x.slot===k).length;
    return `<button onclick="SP.tab='${k}';SP.errore='';spRender()" style="flex:1;padding:8px;border-radius:8px;border:1px solid ${SP.tab===k?'gold':'#444'};background:${SP.tab===k?'rgba(255,215,0,0.15)':'transparent'};color:${SP.tab===k?'gold':'#aaa'};cursor:pointer">${s.emoji} ${s.label} (${n})</button>`;
  }).join('');
  const slot = SP.tab;
  let corpo;
  if(firmati[slot]){
    corpo = `<div style="padding:14px;text-align:center;color:var(--verde)">✅ Slot già firmato con <b>${spEsc(firmati[slot].nome_sponsor)}</b></div>`;
  } else {
    const ord = {molto:0, interessato:1, tiepido:2};
    const lista = D.sponsors.filter(x=>x.slot===slot).sort((a,b)=>ord[a.interesse]-ord[b.interesse]);
    const attivi = lista.filter(x=>x.stato==='disponibile'||x.stato==='in_trattativa');
    corpo = `<div style="font-size:12px;color:var(--testo-dim);margin:8px 0">${lista.length} sponsor si sono fatti avanti · ${D.scartati[slot]||0} non interessati · ${lista.length-attivi.length} ritirati</div>`
      + attivi.map(x=>`<div onclick="spApri('${x.id}')" style="display:flex;justify-content:space-between;align-items:center;padding:10px;margin-bottom:6px;background:var(--grigio-scuro);border-radius:8px;cursor:pointer;opacity:${corso&&corso.id!==x.id?0.45:1}">
          <span>${x.stato==='in_trattativa'?'🟢 ':''}${spEsc(x.nome)}</span><span style="font-size:11px;color:${x.interesse==='molto'?'var(--verde)':x.interesse==='interessato'?'var(--oro)':'var(--testo-dim)'}">${x.interesse==='molto'?'molto interessato':x.interesse}</span></div>`).join('');
  }
  const contratti = D.contratti.length ? `<div style="font-family:'Bebas Neue',sans-serif;font-size:14px;color:var(--oro);margin:16px 0 6px">CONTRATTI</div>`
    + D.contratti.map(c=>`<div style="padding:10px;margin-bottom:6px;background:var(--grigio-scuro);border-radius:8px;font-size:12px">
        <b>${spEsc(c.nome_sponsor)}</b> (${SP_SLOT[c.slot]?.label}) · ${spFmt(c.fisso_annuo)}/anno × ${spAnni(c.durata)}${(c.tifosi_annui||c.follower_annui) ? ` · +${spNum(c.tifosi_annui||0)} tifosi e +${spNum(c.follower_annui||0)} follower/anno` : ''} · ${spEsc(c.stato)}
        <button onclick="spVerifica('${c.id}')" style="float:right;font-size:11px;cursor:pointer">🔍 Controlla obiettivi</button>
        ${(c.idee&&c.idee.length) ? `<div style="margin-top:6px;clear:both;color:var(--testo-dim)">💡 Idee concordate: ${spEsc(c.idee.map(i=>i.titolo).join(' · '))}</div>` : ''}
        <div id="spv-res-${c.id}"></div></div>`).join('') : '';
  const admin = adminLoggato ? `<button onclick="spAzzera()" style="margin-top:14px;font-size:11px;cursor:pointer">🔄 Azzera presentazione (TEST)</button>` : '';
  const fb = D.feedback;           // il server lo manda solo all'admin: i giocatori non vedono gli errori della presentazione
  const feed = fb && (fb.forti.length||fb.deboli.length) ? `<div style="font-size:12px;background:var(--grigio-scuro);border-radius:8px;padding:10px;margin-bottom:10px;line-height:1.5">
      <b>Valutazione AI (solo admin)</b>${fb.forti.map(x=>`<div>✅ ${spEsc(x)}</div>`).join('')}${fb.deboli.map(x=>`<div>⚠️ ${spEsc(x)}</div>`).join('')}</div>` : '';
  return `${feed}${err}${banner}<div style="display:flex;gap:6px;margin-bottom:6px">${tabs}</div>${corpo}${contratti}${admin}`;
}

async function spApri(id){
  const att = spInCorso();
  if(att && att.id !== id){                      // una trattativa per volta
    SP.errore = `Hai già una trattativa aperta con ${att.nome}: chiudila (accetta o abbandona) prima di parlare con un altro sponsor.`;
    SP.tab = att.slot; spRender(); return;
  }
  SP.errore = ''; SP.attesa = false; SP.pending = '';
  try { const j = await spApi('dettaglio', {sponsor_id:id}); SP.chat[id] = j.chat; SP.sponsorId = id; }
  catch(e){ spErr(e); }
  spRender();
}
function spIndietro(){ SP.sponsorId = null; SP.errore = ''; SP.attesa = false; SP.pending = ''; spRender(); }

// ---------- trattativa in chat ----------
function spBolla(m){
  if(m.chi==='card') return `<div style="margin:6px 0;text-align:center"><span style="display:inline-block;padding:6px 10px;border:1px dashed var(--oro);border-radius:8px;font-size:12px;color:var(--oro)">${spEsc(m.t)}</span></div>`;
  const tu = m.chi==='tu';
  return `<div style="margin-bottom:8px;text-align:${tu?'right':'left'}"><span style="display:inline-block;padding:8px 12px;border-radius:12px;max-width:85%;font-size:13px;text-align:left;background:${tu?'rgba(255,215,0,0.15)':'var(--grigio-scuro)'}">${spEsc(m.t)}</span></div>`;
}

function spHtmlTrattativa(){
  const sp = SP.dati.sponsors.find(x=>x.id===SP.sponsorId);
  const pk = sp.offerta;               // visibile solo dopo che lo sponsor ha fatto un'offerta
  const log = SP.chat[sp.id] || [];
  const chat = log.map(spBolla).join('')
    + (SP.pending ? spBolla({chi:'tu', t:SP.pending}) : '')
    + (SP.attesa ? `<div style="margin-bottom:8px"><span style="display:inline-block;padding:8px 12px;border-radius:12px;font-size:13px;background:var(--grigio-scuro);color:var(--testo-dim)">✍️ ${spEsc(sp.nome)} sta scrivendo…</span></div>` : '');
  const chiuso = sp.stato==='ritirato'||sp.stato==='firmato';
  const occ = SP.attesa ? 'disabled' : '';
  const riepilogo = pk
    ? `Offerta sul tavolo: <b>${spFmt(pk.fm)}</b>/anno · ${spAnni(sp.durata)} = <b>${spFmt(pk.fm*sp.durata)}</b> totali<br>📣 Visibilità: <b>+${spNum(pk.tifosi)}</b> tifosi e <b>+${spNum(pk.follower)}</b> follower l'anno (${spNum(pk.tifosi*sp.durata)} tifosi e ${spNum(pk.follower*sp.durata)} follower in ${spAnni(sp.durata)})`
    : `Durata proposta: ${spAnni(sp.durata)} · nessuna offerta ancora sul tavolo`;
  const idee = sp.idee.length ? `<br>💡 Idee sul tavolo: ${spEsc(sp.idee.join(' · '))}` : '';
  const err = SP.errore ? `<div style="color:#ff6b6b;font-size:12px;margin-bottom:8px">${spEsc(SP.errore)}</div>` : '';
  const form = `<textarea id="sp-msg" class="form-input" rows="2" maxlength="500" ${occ} placeholder="Scrivi allo sponsor…" style="width:100%;resize:none" onkeydown="if(event.key==='Enter'&&!event.shiftKey&&window.innerWidth>700){event.preventDefault();spInvia()}"></textarea>
    <button class="btn-primary" style="width:100%;margin:6px 0 8px" ${occ} onclick="spInvia()">Invia</button>`;
  return `<button onclick="spIndietro()" style="margin-bottom:8px;cursor:pointer">← Lista sponsor</button>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--oro)">${SP_SLOT[sp.slot].emoji} ${spEsc(sp.nome)}</div>
    <div style="font-size:12px;color:var(--testo-dim);margin-bottom:10px;line-height:1.5">${riepilogo}${idee}</div>
    <div id="sp-chat" style="max-height:300px;overflow:auto;margin-bottom:10px">${chat}</div>${err}
    ${chiuso ? `<div style="text-align:center;color:var(--testo-dim);margin-bottom:8px">Trattativa chiusa</div>` : `
    ${form}
    ${pk ? `<button class="btn-primary" style="width:100%;margin-bottom:6px" ${occ} onclick="spFirma()">✅ ACCETTO: ${spFmt(pk.fm)}/anno + ${spNum(pk.tifosi)} tifosi e ${spNum(pk.follower)} follower l'anno</button>` : ''}
    <button onclick="spAbbandona()" ${occ} style="width:100%;cursor:pointer">🚪 Abbandona la trattativa</button>`}
    ${adminLoggato ? `<button onclick="spResetTrattativa()" ${occ} style="width:100%;margin-top:10px;font-size:11px;cursor:pointer">🔄 Reset trattativa (solo admin)</button>` : ''}`;
}

async function spInvia(){
  if(SP.attesa) return;
  const sp = SP.dati && SP.dati.sponsors.find(x=>x.id===SP.sponsorId);
  if(!sp || sp.stato==='ritirato' || sp.stato==='firmato') return;
  const el = document.getElementById('sp-msg'); if(!el) return;
  const testo = (el.value||'').trim();
  if(testo.length < 2) return;
  SP.pending = testo; SP.attesa = true; SP.errore = ''; spRender();
  let j;
  try { j = await spApi('chat', {sponsor_id:sp.id, messaggio:testo}); }
  catch(e){                                          // niente è cambiato: il messaggio torna nella casella
    SP.pending = ''; SP.attesa = false; spErr(e); spRender();
    const e2 = document.getElementById('sp-msg'); if(e2) e2.value = testo;
    return;
  }
  SP.pending = ''; SP.attesa = false; spApplica(j); spRender();
  // azioni del giocatore lette dall'AI: chiedono sempre conferma
  const nuovo = SP.dati.sponsors.find(x=>x.id===sp.id);
  if(j.giocatore === 'accetta_offerta' && nuovo && nuovo.offerta && nuovo.stato === 'in_trattativa'){
    if(confirm('Confermi di firmare con ' + nuovo.nome + '?\n' + spPacchetto(nuovo.offerta) + ' per ' + spAnni(nuovo.durata) + '.')) await spFirma();
  } else if(j.giocatore === 'abbandona' && nuovo && nuovo.stato === 'in_trattativa'){
    await spAbbandona();
  }
}

// solo admin: la trattativa con questo sponsor torna come all'inizio (chat, offerta, pazienza, idee)
async function spResetTrattativa(){
  if(!adminLoggato || SP.attesa) return;
  const sp = SP.dati.sponsors.find(x=>x.id===SP.sponsorId); if(!sp) return;
  if(!confirm('Reset di questa trattativa: chat, offerta, pazienza e idee tornano come all\'inizio. Confermi?')) return;
  try { spApplica(await spApi('reset', {sponsor_id:sp.id})); SP.errore = ''; delete SP.chat[sp.id]; const d = await spApi('dettaglio', {sponsor_id:sp.id}); SP.chat[sp.id] = d.chat; }
  catch(e){ spErr(e); }
  spRender();
}

async function spAbbandona(){
  const sp = SP.dati && SP.dati.sponsors.find(x=>x.id===SP.sponsorId);
  if(!sp || SP.attesa) return;
  if(!confirm('Abbandonando, questo sponsor non tornerà più. Confermi?')) return;
  try { spApplica(await spApi('abbandona', {sponsor_id:sp.id})); SP.sponsorId = null; SP.errore = ''; }
  catch(e){ spErr(e); }
  spRender();
}

async function spFirma(){
  const sp = SP.dati && SP.dati.sponsors.find(x=>x.id===SP.sponsorId);
  if(!sp || SP.attesa) return;
  try { const j = await spApi('firma', {sponsor_id:sp.id}); spApplica(j); showToast('✍️ Contratto firmato con ' + j.firmato); SP.sponsorId = null; SP.errore = ''; }
  catch(e){ spErr(e); }
  spRender();
}

async function spVerifica(id){
  const box = document.getElementById('spv-res-'+id);
  try {
    const res = (await spApi('verifica', {contratto_id:id})).verifica;
    box.innerHTML = `<div style="margin-top:8px;clear:both">` + res.righe.map(r=>`<div>${r.ok?'✅':'❌'} ${spEsc(r.label)}: ${spNum(r.attuale)} / ${spNum(r.target)}</div>`).join('')
      + `<div style="margin-top:4px;color:var(--oro)">${spEsc(res.nota)}</div></div>`;
  } catch(e){ box.innerHTML = `<div style="color:#ff6b6b;margin-top:6px">${spEsc(e.message)}</div>`; }
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
