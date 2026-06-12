// ===== FORMAZIONE =====
let formazioniDB={},formazioneSqIdAttiva=null,formazioneSlots={},formazioneModuloCorrente='4-3-3';
const MODULI={'4-3-3':{P:[[50,90]],D:[[15,70],[37,70],[63,70],[85,70]],C:[[25,48],[50,48],[75,48]],A:[[20,22],[50,22],[80,22]]},'4-4-2':{P:[[50,90]],D:[[15,70],[37,70],[63,70],[85,70]],C:[[15,48],[38,48],[62,48],[85,48]],A:[[33,22],[67,22]]},'4-2-3-1':{P:[[50,90]],D:[[15,70],[37,70],[63,70],[85,70]],C:[[35,58],[65,58],[18,38],[50,38],[82,38]],A:[[50,16]]},'3-5-2':{P:[[50,90]],D:[[25,72],[50,72],[75,72]],C:[[10,52],[30,52],[50,52],[70,52],[90,52]],A:[[33,22],[67,22]]},'3-4-3':{P:[[50,90]],D:[[25,72],[50,72],[75,72]],C:[[15,50],[38,50],[62,50],[85,50]],A:[[20,22],[50,22],[80,22]]},'5-3-2':{P:[[50,90]],D:[[10,70],[28,70],[50,70],[72,70],[90,70]],C:[[25,48],[50,48],[75,48]],A:[[33,22],[67,22]]}};

async function caricaFormazione(sqId){
  if(formazioniDB[sqId]!==undefined) return formazioniDB[sqId];
  try{const{data}=await sb.from('formazioni').select('*').eq('squadra_id',sqId).single();formazioniDB[sqId]=data||null;}catch(e){formazioniDB[sqId]=null;}
  return formazioniDB[sqId];
}

async function renderFormazione(sqId,editMode=false){
  formazioneSqIdAttiva=sqId;
  const c=document.getElementById('formazione-content');
  if(!c) return;
  c.innerHTML='<div class="loading"><div class="loading-spinner"></div></div>';
  const f=await caricaFormazione(sqId);
  const giocatori=giocatoriDB.filter(g=>g.squadra_id===sqId&&g.lista==='principale');
  const modulo=editMode?formazioneModuloCorrente:(f?.modulo||'4-3-3');
  formazioneModuloCorrente=modulo;
  const mapT={};
  (f?.titolari||[]).forEach(t=>mapT[t.slot]=t.gid);
  if(editMode) Object.entries(formazioneSlots).forEach(([s,g])=>mapT[s]=g);
  const slots=[];
  ['P','D','C','A'].forEach(r=>(MODULI[modulo][r]||[]).forEach(([x,y],i)=>slots.push({slot:`${r}_${i}`,ruolo:r,x,y})));
  const talento=f?.talento_id?giocatoriDB.find(g=>g.id===f.talento_id):null;
  const btn=document.getElementById('btn-edit-formazione');
  if(btn){btn.textContent=editMode?'✕ Annulla':'✏️ MODIFICA';btn.onclick=editMode?()=>renderFormazione(sqId,false):()=>attivaEditFormazione();}
  const rc={'P':'#FFD700','D':'#4d9fff','C':'#00e68a','A':'#ff5c5c'};
  const rcCss={'P':'var(--oro)','D':'var(--blu)','C':'var(--verde)','A':'var(--rosso)'};
  c.innerHTML=`
    ${editMode?`<div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap"><span style="font-size:12px;color:var(--testo-dim);align-self:center">Modulo:</span>${Object.keys(MODULI).map(m=>`<button onclick="cambiaModuloFormazione('${m}')" style="font-size:12px;font-family:'Bebas Neue',sans-serif;padding:5px 11px;border-radius:6px;cursor:pointer;border:1px solid ${m===modulo?'var(--verde)':'var(--grigio-chiaro)'};background:${m===modulo?'rgba(0,255,135,0.15)':'var(--grigio)'};color:${m===modulo?'var(--verde)':'var(--testo)'}">${m}</button>`).join('')}</div>`:''}
    <div style="position:relative;width:100%;max-width:360px;margin:0 auto 14px">
      <svg viewBox="0 0 100 105" style="width:100%;border-radius:10px;display:block" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="105" fill="#2a5e2a"/>${[0,1,2,3,4].map(i=>`<rect x="0" y="${i*21}" width="100" height="10.5" fill="${i%2?'#2d652d':'#2a5e2a'}"/>`).join('')}
        <rect x="1" y="1" width="98" height="98" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="0.5"/>
        <line x1="1" y1="50" x2="99" y2="50" stroke="rgba(255,255,255,0.4)" stroke-width="0.4"/>
        <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.4"/>
        <rect x="21" y="1" width="58" height="16" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="0.4"/>
        <rect x="21" y="83" width="58" height="16" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="0.4"/>
      </svg>
      ${slots.map(s=>{
        const g=mapT[s.slot]?giocatoriDB.find(x=>x.id===mapT[s.slot]):null;
        if(editMode){const cand=giocatori.filter(gg=>gg.ruolo===s.ruolo);return `<div style="position:absolute;left:${s.x}%;top:${s.y}%;transform:translate(-50%,-50%);z-index:2;display:flex;flex-direction:column;align-items:center;gap:1px"><div style="width:26px;height:26px;border-radius:50%;background:${rc[s.ruolo]};border:2px solid white;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:700;color:#000">${g?.foto_url?`<img src="${g.foto_url}" style="width:100%;height:100%;object-fit:cover">`:g?iniziali(g.nome):'?'}</div><select onchange="assegnaSlot('${s.slot}',this.value)" style="font-size:6px;background:rgba(0,0,0,0.85);color:white;border:1px solid ${rc[s.ruolo]};border-radius:3px;padding:1px;max-width:44px"><option value="">—</option>${cand.map(gg=>`<option value="${gg.id}" ${mapT[s.slot]===gg.id?'selected':''}>${gg.nome.split(' ').pop()}</option>`).join('')}</select></div>`;}
        return `<div style="position:absolute;left:${s.x}%;top:${s.y}%;transform:translate(-50%,-50%);z-index:2;text-align:center" ${g?`onclick="apriGiocatore(${g.id})" style="cursor:pointer"`:''}><div style="width:${g?'28':'20'}px;height:${g?'28':'20'}px;border-radius:50%;background:${g?rc[s.ruolo]:'rgba(255,255,255,0.1)'};border:2px solid ${g?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.2)'};overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:700;color:#000;margin:0 auto">${g?.foto_url?`<img src="${g.foto_url}" style="width:100%;height:100%;object-fit:cover">`:g?iniziali(g.nome):''}</div>${g?`<div style="font-size:6px;color:white;text-shadow:0 1px 3px rgba(0,0,0,1);max-width:36px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px">${g.nome.split(' ').pop()}</div>`:''}</div>`;
      }).join('')}
    </div>
    <div style="text-align:center;font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--verde);letter-spacing:3px;margin-bottom:12px">${modulo}</div>
    <div style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:10px;overflow:hidden;margin-bottom:12px">
      <div style="background:var(--grigio-scuro);padding:8px 14px;font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:1px;border-bottom:1px solid var(--grigio-chiaro)">📋 11 TITOLARI</div>
      ${slots.map((s,i)=>{const g=mapT[s.slot]?giocatoriDB.find(x=>x.id===mapT[s.slot]):null;return `<div style="display:flex;align-items:center;gap:8px;padding:5px 14px;border-bottom:1px solid var(--grigio-chiaro);font-size:12px"><span style="font-size:9px;color:var(--testo-dim);width:14px">${i+1}</span><span style="font-size:9px;color:${rcCss[s.ruolo]};background:${rcCss[s.ruolo]}22;padding:2px 5px;border-radius:3px;flex-shrink:0;font-weight:700">${s.ruolo}</span>${g?`<div style="width:20px;height:20px;border-radius:50%;overflow:hidden;background:var(--grigio-chiaro);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:700">${g.foto_url?`<img src="${g.foto_url}" style="width:100%;height:100%;object-fit:cover">`:iniziali(g.nome)}</div><span style="font-weight:600;flex:1">${g.nome}</span>${g.maglia?`<span style="font-size:10px;color:var(--testo-dim)">#${g.maglia}</span>`:''}`:`<span style="color:var(--testo-dim);font-style:italic;font-size:11px">— non assegnato —</span>`}</div>`;}).join('')}
    </div>
    <div style="background:var(--grigio);border:1px solid rgba(255,215,0,0.2);border-radius:10px;overflow:hidden;margin-bottom:14px">
      <div style="background:var(--grigio-scuro);padding:8px 14px;font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:1px;color:var(--oro);border-bottom:1px solid var(--grigio-chiaro)">⭐ MIGLIOR TALENTO IN PROSPETTIVA</div>
      <div style="padding:14px">${editMode?`<div class="form-group"><label class="form-label">Seleziona talento</label><select class="form-select" id="form-talento-select"><option value="">— Nessuno —</option>${giocatori.map(g=>`<option value="${g.id}" ${f?.talento_id===g.id?'selected':''}>${g.nome} (${g.ruolo})${g.eta?' • '+g.eta+'a':''}</option>`).join('')}</select></div><div class="form-group"><label class="form-label">Nota</label><textarea id="form-talento-nota" style="width:100%;background:var(--grigio-scuro);border:1px solid var(--grigio-chiaro);border-radius:8px;padding:10px;color:var(--testo);font-size:13px;resize:vertical;outline:none;min-height:70px">${f?.talento_nota||''}</textarea></div>`:`${talento?`<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><div style="width:46px;height:46px;border-radius:50%;overflow:hidden;background:var(--grigio-chiaro);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid var(--oro)">${talento.foto_url?`<img src="${talento.foto_url}" style="width:100%;height:100%;object-fit:cover">`:iniziali(talento.nome)}</div><div><div style="font-family:'Bebas Neue',sans-serif;font-size:16px">${talento.nome}</div><div style="display:flex;gap:5px;align-items:center;margin-top:2px"><span class="g-ruolo ${ruoloColor(talento.ruolo)}" style="font-size:10px">${talento.ruolo}</span>${talento.eta?`<span style="font-size:11px;color:var(--testo-dim)">${talento.eta}a</span>`:''}${talento.quotazione?`<span style="font-size:11px;color:var(--oro)">${talento.quotazione}M€</span>`:''}</div></div></div>${f?.talento_nota?`<div style="font-size:13px;color:var(--testo-dim);line-height:1.6;font-style:italic;border-left:3px solid var(--oro);padding-left:10px">"${f.talento_nota}"</div>`:''}`:`<div style="text-align:center;color:var(--testo-dim);font-size:13px;padding:8px">Nessun talento selezionato</div>`}`}</div>
    </div>
    ${editMode?`<button onclick="salvaFormazione('${sqId}')" style="width:100%;background:var(--verde);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:18px;padding:12px;border-radius:10px;border:none;cursor:pointer;margin-bottom:8px">💾 SALVA FORMAZIONE</button>`:''}
  `;
}

function attivaEditFormazione(){
  const f=formazioniDB[formazioneSqIdAttiva];
  formazioneModuloCorrente=f?.modulo||'4-3-3';
  formazioneSlots={};
  if(f?.titolari) f.titolari.forEach(t=>{formazioneSlots[t.slot]=t.gid;});
  renderFormazione(formazioneSqIdAttiva,true);
}
function cambiaModuloFormazione(m){
  document.querySelectorAll('[onchange^="assegnaSlot"]').forEach(sel=>{const match=sel.getAttribute('onchange').match(/'([^']+)'/);if(match)formazioneSlots[match[1]]=parseInt(sel.value)||null;});
  formazioneModuloCorrente=m;renderFormazione(formazioneSqIdAttiva,true);
}
function assegnaSlot(slot,gIdStr){formazioneSlots[slot]=parseInt(gIdStr)||null;}

async function salvaFormazione(sqId){
  document.querySelectorAll('[onchange^="assegnaSlot"]').forEach(sel=>{const match=sel.getAttribute('onchange').match(/'([^']+)'/);if(match)formazioneSlots[match[1]]=parseInt(sel.value)||null;});
  const titolari=Object.entries(formazioneSlots).filter(([,g])=>g).map(([slot,gid])=>({slot,gid}));
  const talentoId=parseInt(document.getElementById('form-talento-select')?.value)||null;
  const talentNota=document.getElementById('form-talento-nota')?.value?.trim()||'';
  const payload={squadra_id:sqId,modulo:formazioneModuloCorrente,titolari,talento_id:talentoId,talento_nota:talentNota};
  try{
    const{error}=await sb.from('formazioni').upsert(payload,{onConflict:'squadra_id'});
    if(error) throw error;
    formazioniDB[sqId]=payload;
    showToast('✅ Formazione salvata!');
    renderFormazione(sqId,false);
  }catch(e){showToast('❌ '+e.message,'error');}
}


// Formatta importo in milioni FM (es. 5.000.000 → 5,00 M FM)
function fmtM(val){
  const n=parseFloat(val)||0;
  if(Math.abs(n)>=1000000) return (n/1000000).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2})+' M FM';
  if(Math.abs(n)>=1000) return (n/1000).toLocaleString('it-IT',{minimumFractionDigits:0,maximumFractionDigits:1})+' K FM';
  return n.toLocaleString('it-IT')+' FM';
}

function renderBilancioSquadra(sqId, isProprietario=false){
  const sq=squadreDB.find(s=>s.id===sqId);
  const c=document.getElementById('bilancio-inline-content');
  if(!sq||!c) return;

  // ===== STAGIONE UFFICIALE: 1 Luglio 2026 → 30 Giugno 2027 =====
  // Prima stagione ufficiale è 2026/27. Ogni anno si aggiorna automaticamente.
  const oggi=new Date();
  // Determina stagione corrente in base alla data
  let annoInizio, annoFine;
  if(oggi>=new Date('2026-07-01')){
    // Siamo nella stagione 2026/27 o successive
    const anno=oggi.getFullYear();
    annoInizio=oggi.getMonth()>=6?anno:anno-1; // >= luglio
    annoFine=annoInizio+1;
  } else {
    // Prima del 1 luglio 2026 → mostriamo proiezione per 2026/27
    annoInizio=2026;
    annoFine=2027;
  }
  const labelStagione=`${annoInizio}/${String(annoFine).slice(-2)}`;
  const dataApertura=new Date(`${annoInizio}-07-01`);
  const dataChiusura=new Date(`${annoFine}-06-30`);
  const dataMuseo=new Date(`${annoFine}-07-02`);
  const dataGennaio=new Date(`${annoFine}-01-01`); // mercato invernale

  const oggi2=new Date();
  const giorniAllaChiusura=Math.max(0,Math.ceil((dataChiusura-oggi2)/(1000*60*60*24)));
  const stagioneAperta=oggi2>=dataApertura;

  const giocatori=giocatoriDB.filter(g=>g.squadra_id===sqId);

  // ===== STIPENDI stagione ufficiale =====
  // Regole:
  // - Primavera: €0
  // - Promosso primo anno: €0 (campo promosso=true)
  // - In prestito fuori Serie A: €0
  // - Arrivato a gennaio (mercato invernale): 50% stipendio
  // - Tutto il resto: stipendio intero

  let totStipendi=0;
  const righeStipendi=[];

  // Allenatore — sempre intero
  const stipAllStr=(sq.stip_all||'0').toString().replace('M','').replace(',','.');
  const stipAll=parseFloat(stipAllStr)||0;
  if(stipAll>0){
    totStipendi+=stipAll;
    righeStipendi.push({
      nome:'⚽ All. '+(sq.allenatore||'—'),
      ruolo:'—', stip:stipAll, nota:'Intero', color:'var(--oro)'
    });
  }

  giocatori.forEach(g=>{
    if(!g.lista||g.lista==='svincolato'||g.lista==='primavera') return;
    if(g.promosso) return; // primo anno promosso = €0
    const stip=parseFloat(g.stipendio)||0;
    if(stip===0) return;

    // Calcola quota stipendio
    let quota=stip;
    let nota='Intero';
    let color='';

    // In prestito fuori serie A (badge P, ma con club fuori serie A) → 0
    // Semplificazione: se contratto=Prestito Secco e squadra_propr=diversa → pagano 50% (accordo tipico)
    if(g.contratto&&g.contratto.includes('Prestito')){
      if(g.contratto==='Prestito Secco'){
        // Prestito secco: chi lo ha paga stipendio al proprietario, noi non paghiamo
        return; // €0 per questa squadra
      }
      nota='Prestito';
    }

    totStipendi+=quota;
    righeStipendi.push({nome:g.nome, ruolo:g.ruolo, stip:quota, nota, color});
  });

  // ===== ENTRATE stimate stagione =====
  // Museo — accreditato il 2 Luglio
  const trofei=sq.trofei||[];
  const perComp={};
  trofei.forEach(t=>{if(!perComp[t.compId])perComp[t.compId]=[];perComp[t.compId].push(t);});
  const renditaMuseo=Object.entries(perComp).reduce((tot,[cid,arr])=>{
    const comp=competizioni.find(cc=>cc.id===cid);
    return comp&&comp.museo?tot+comp.museo.fm*getMolt(arr.length):tot;
  },0);

  // Stadio — tifosi × 80€ × gare casalinghe stimate (11 campionato + coppe)
  const tifosi=sq.tifosi||0;
  const gareStimate=11; // ~11 gare casalinghe di campionato
  const entrateTifosi=tifosi*80*gareStimate;

  // Mercato — acquisti/cessioni (completate + rate future approvate)
  let totAcquisti=0, totCessioni=0;
  trattativeDB.filter(t=>t.stato==='completata'||t.stato==='approvata').forEach(t=>{
    const sqPaga=t.squadra_offerente_id||t.squadra_cedente_id; // offerente paga sempre
    const sqIncassa=t.squadra_ricevente_id||t.squadra_acquirente_id; // ricevente incassa
    const isPagante=sqPaga===sqId;
    const isIncassante=sqIncassa===sqId;
    if(!isPagante&&!isIncassante) return;

    // Importo base: già avvenuto se completata O approvata (giocatore già trasferito)
    const imp=parseFloat(t.importo)||0;
    if(imp>0){
      if(isPagante) totAcquisti+=imp;
      else if(isIncassante) totCessioni+=imp;
    }

    // Rate di questa stagione (data <= 30 giugno stagione corrente)
    if(t.rate&&t.rate.length){
      t.rate.forEach(r=>{
        if(r.pagata) return;
        const imp=parseFloat(r.importo)||0;
        if(imp<=0) return;
        if(!r.data) return;
        const dataRata=new Date(r.data);
        if(dataRata>dataChiusura) return; // rata di stagione futura, non contarla
        if(isPagante) totAcquisti+=imp;
        else if(isIncassante) totCessioni+=imp;
      });
    }
  });

  // ===== PROIEZIONE BUDGET a fine stagione =====
  const budget=parseFloat(sq.budget)||0;
  const totEntrateM=renditaMuseo*1000000+entrateTifosi+totCessioni;
  const totUsciteM=totStipendi*1000000+totAcquisti;
  // Budget proiettato = budget attuale + entrate - uscite (stipendi pagati il 30 giugno)
  const budgetProiettato=budget+totEntrateM-totUsciteM;
  const inAttivo=budget>=0;
  const proiezioneOk=budgetProiettato>=0;

  c.innerHTML=`
    <!-- HEADER STAGIONE -->
    <div style="background:rgba(0,255,135,0.05);border:1px solid rgba(0,255,135,0.2);border-radius:12px;padding:12px 16px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <div>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--verde);letter-spacing:1px">📅 STAGIONE ${labelStagione}</div>
        <div style="font-size:11px;color:var(--testo-dim)">
          ${stagioneAperta?`Aperta dal ${dataApertura.toLocaleDateString('it-IT')}`:'⏳ Inizia il 1 Luglio 2026'}
           • Chiusura <strong style="color:var(--oro)">30 Giugno ${annoFine}</strong>
          ${giorniAllaChiusura>0?` (${giorniAllaChiusura} giorni)`:''}
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-size:10px;color:var(--testo-dim)">STIPENDI pagati il 30 Giugno ${annoFine}</div>
        <div style="font-size:10px;color:var(--testo-dim)">MUSEO accreditato il 2 Luglio ${annoFine}</div>
      </div>
    </div>

    <!-- RIEPILOGO PUBBLICO -->
    <div style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:12px;overflow:hidden;margin-bottom:12px">
      <div style="background:var(--grigio-scuro);padding:10px 16px;border-bottom:1px solid var(--grigio-chiaro);display:flex;justify-content:space-between;align-items:center">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:1px;color:var(--testo-dim)">💰 SITUAZIONE FINANZIARIA</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--grigio-chiaro)">
        <div style="background:var(--grigio-scuro);padding:14px;text-align:center">
          <div style="font-size:9px;color:var(--testo-dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Budget Attuale</div>
          <div style="font-family:'Space Mono',monospace;font-size:16px;font-weight:700;color:${inAttivo?'var(--verde)':'var(--rosso)'}">${fmtM(budget)}</div>
          <div style="font-size:9px;color:var(--testo-dim);margin-top:2px">${inAttivo?'✅ In attivo':'⚠️ In passivo'}</div>
        </div>
        <div style="background:var(--grigio-scuro);padding:14px;text-align:center">
          <div style="font-size:9px;color:var(--testo-dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Proiezione 30/06/${annoFine}</div>
          <div style="font-family:'Space Mono',monospace;font-size:16px;font-weight:700;color:${proiezioneOk?'var(--verde)':'var(--rosso)'}">${fmtM(budgetProiettato)}</div>
          <div style="font-size:9px;color:${proiezioneOk?'var(--verde)':'var(--rosso)'};margin-top:2px">${proiezioneOk?'✅ Sarà in attivo':'⚠️ ATTENZIONE: sarà in passivo'}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--grigio-chiaro)">
        <div style="background:var(--grigio-scuro);padding:10px;text-align:center">
          <div style="font-size:9px;color:var(--testo-dim);margin-bottom:2px">Entrate Est.</div>
          <div style="font-family:'Space Mono',monospace;font-size:12px;color:var(--verde)">+${fmtM(totEntrateM)}</div>
        </div>
        <div style="background:var(--grigio-scuro);padding:10px;text-align:center">
          <div style="font-size:9px;color:var(--testo-dim);margin-bottom:2px">Uscite Est.</div>
          <div style="font-family:'Space Mono',monospace;font-size:12px;color:var(--rosso)">-${fmtM(totUsciteM)}</div>
        </div>
        <div style="background:var(--grigio-scuro);padding:10px;text-align:center">
          <div style="font-size:9px;color:var(--testo-dim);margin-bottom:2px">Tifosi</div>
          <div style="font-family:'Space Mono',monospace;font-size:12px;color:var(--blu)">${tifosi.toLocaleString('it-IT')}</div>
        </div>
      </div>
      ${!isProprietario?'<div style="padding:8px 14px;font-size:11px;color:var(--testo-dim);text-align:center;border-top:1px solid var(--grigio-chiaro)">🔒 Dettaglio visibile solo al proprietario</div>':''}
    </div>

    ${isProprietario?`
    <!-- STIPENDI DA PAGARE 30 GIUGNO -->
    <div style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:12px;overflow:hidden;margin-bottom:12px">
      <div style="background:var(--grigio-scuro);padding:12px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--grigio-chiaro)">
        <div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--rosso);letter-spacing:1px">💸 STIPENDI — 30 GIU ${annoFine}</div>
          <div style="font-size:10px;color:var(--testo-dim)">Pagati a fine stagione ${labelStagione}</div>
        </div>
        <div style="font-family:'Space Mono',monospace;font-size:14px;color:var(--rosso);font-weight:700">-${fmtM(totStipendi*1000000)}</div>
      </div>
      <div style="padding:8px 14px">
        ${righeStipendi.length===0?'<div style="font-size:12px;color:var(--testo-dim);padding:6px 0">Nessuno stipendio da pagare</div>':
          righeStipendi.map(r=>`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--grigio-chiaro);font-size:12px">
            <div style="flex:1;min-width:0">
              <span style="color:${r.color||'var(--testo)'}">${r.nome}</span>
              ${r.ruolo!=='—'?`<span class="g-ruolo ${ruoloColor(r.ruolo)}" style="font-size:9px;margin-left:4px">${r.ruolo}</span>`:''}
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
              ${r.nota!=='Intero'?`<span style="font-size:10px;color:var(--testo-dim)">${r.nota}</span>`:''}
              <span style="font-family:'Space Mono',monospace;color:var(--rosso)">-${fmtM(r.stip*1000000)}</span>
            </div>
          </div>`).join('')}
        <div style="padding:8px 0 2px;font-size:10px;color:var(--testo-dim);line-height:1.6">
          ℹ️ <strong>Primavera</strong>: €0 sempre •
          <strong>Promosso 1° anno</strong>: €0 •
          <strong>Prestito secco uscente</strong>: €0 •
          <strong>Arrivati a Gennaio</strong>: 50% stipendio
        </div>
      </div>
    </div>

    <!-- ENTRATE STIMATE -->
    <div style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:12px;overflow:hidden;margin-bottom:12px">
      <div style="background:var(--grigio-scuro);padding:12px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--grigio-chiaro)">
        <div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--verde);letter-spacing:1px">📈 ENTRATE STIMATE ${labelStagione}</div>
        </div>
        <div style="font-family:'Space Mono',monospace;font-size:14px;color:var(--verde);font-weight:700">+${fmtM(totEntrateM)}</div>
      </div>
      <div style="padding:8px 14px">
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--grigio-chiaro);font-size:12px">
          <div>
            <span>🏛️ Rendita Museo</span>
            <span style="font-size:10px;color:var(--testo-dim);margin-left:6px">accreditata il 2 Luglio ${annoFine}</span>
          </div>
          <span style="font-family:'Space Mono',monospace;color:var(--verde)">+${fmtM(renditaMuseo*1000000)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--grigio-chiaro);font-size:12px">
          <div>
            <span>🏟️ Stadio</span>
            <span style="font-size:10px;color:var(--testo-dim);margin-left:6px">${tifosi.toLocaleString()} tifosi × 80€ × ${gareStimate} gare</span>
          </div>
          <span style="font-family:'Space Mono',monospace;color:var(--verde)">+${fmtM(entrateTifosi)}</span>
        </div>
        ${totCessioni?`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--grigio-chiaro);font-size:12px">
          <span>🔄 Cessioni completate</span>
          <span style="font-family:'Space Mono',monospace;color:var(--verde)">+${fmtM(totCessioni)}</span>
        </div>`:''}
        ${totAcquisti?`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--grigio-chiaro);font-size:12px">
          <span>🛒 Acquisti completati</span>
          <span style="font-family:'Space Mono',monospace;color:var(--rosso)">-${fmtM(totAcquisti)}</span>
        </div>`:''}
        <div style="font-size:10px;color:var(--testo-dim);margin-top:6px">
          ℹ️ Sponsor settimanali e premi competizioni aggiunti dall'admin durante la stagione
        </div>
      </div>
    </div>

    <!-- RATE IN SCADENZA -->
    <div style="background:var(--grigio);border:1px solid rgba(255,215,0,0.2);border-radius:12px;overflow:hidden;margin-bottom:12px">
      <div style="background:var(--grigio-scuro);padding:12px 16px;border-bottom:1px solid var(--grigio-chiaro)">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--oro);letter-spacing:1px">💳 RATE IN SCADENZA</div>
      </div>
      <div style="padding:8px 14px">${calcolaRateBilancio(sqId)}</div>
    </div>

    <!-- STORICO -->
    <div style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:12px;overflow:hidden;margin-bottom:12px">
      <div style="background:var(--grigio-scuro);padding:12px 16px;border-bottom:1px solid var(--grigio-chiaro)">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--blu);letter-spacing:1px">📋 STORICO MOVIMENTI</div>
      </div>
      <div id="storico-movimenti-${sqId}" style="padding:8px 14px"><div class="loading"><div class="loading-spinner"></div></div></div>
    </div>

    ${adminLoggato?`<button onclick="apriNuovaVoceBilancio('${sqId}')" style="width:100%;background:rgba(255,215,0,0.1);border:1px solid rgba(255,215,0,0.3);color:var(--oro);font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1px;padding:12px;border-radius:10px;cursor:pointer;margin-bottom:16px">➕ AGGIUNGI VOCE (Sponsor, Premio, ecc.)</button>`:''}
    `:''}
  `;

  if(isProprietario) caricaStoricoMovimenti(sqId);
}

function calcolaRateBilancio(sqId){
  const rate=[];
  trattativeDB.forEach(t=>{
    const sqPagaT=t.squadra_offerente_id||t.squadra_cedente_id;
    const sqIncassaT=t.squadra_ricevente_id||t.squadra_acquirente_id;
    if((sqPagaT===sqId||sqIncassaT===sqId)&&t.rate&&t.rate.length){
      t.rate.forEach((r,i)=>{
        if(!r.pagata&&r.data&&r.importo){
          const scad=new Date(r.data);
          const isAcquirente=sqPagaT===sqId; // offerente paga sempre
          rate.push({
            trattativa:(()=>{const g=giocatoriDB.find(x=>x.id==t.giocatore_id);return g?g.nome:(t.giocatore_nome||'—');})(),
            data:r.data,
            importo:parseFloat(r.importo),
            tipo:isAcquirente?'uscita':'entrata',
            scaduta:scad<new Date(),
            idx:i,
            tid:t.id,
          });
        }
      });
    }
  });
  if(!rate.length) return '<div style="font-size:12px;color:var(--testo-dim);padding:4px 0">Nessuna rata in scadenza</div>';
  return rate.sort((a,b)=>new Date(a.data)-new Date(b.data)).map(r=>`
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--grigio-chiaro);font-size:12px">
      <div>
        <div style="font-weight:600">${r.trattativa}</div>
        <div style="font-size:10px;color:${r.scaduta?'var(--rosso)':'var(--testo-dim)'}">📅 ${r.data}${r.scaduta?' ⚠️ SCADUTA':''}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-family:'Space Mono',monospace;color:${r.tipo==='uscita'?'var(--rosso)':'var(--verde)'}">${r.tipo==='uscita'?'-':'+'}${fmtM(r.importo)}</span>
        ${adminLoggato?`<button onclick="marcaRataBilancio(${r.tid},${r.idx})" style="font-size:10px;background:rgba(0,255,135,0.1);border:1px solid rgba(0,255,135,0.3);color:var(--verde);padding:3px 8px;border-radius:4px;cursor:pointer">✓ Pagata</button>`:''}
      </div>
    </div>`).join('');
}

async function marcaRataBilancio(tid,idx){
  const t=trattativeDB.find(x=>x.id===tid);
  if(!t||!t.rate) return;
  try{
    const rate=[...t.rate];
    rate[idx]={...rate[idx],pagata:true};
    const{error}=await sb.from('trattative').update({rate}).eq('id',tid);
    if(!error){
      const i=trattativeDB.findIndex(x=>x.id===tid);
      if(i>=0) trattativeDB[i].rate=rate;
      showToast('💳 Rata segnata come pagata!');
      renderBilancioSquadra(bilancioSquadraAttiva);
    }
  }catch(e){showToast('❌ Errore','error');}
}

function apriNuovaVoceBilancio(sqId){
  document.getElementById('bilancio-voce-body').innerHTML=`
    <div class="form-group"><label class="form-label">Tipo</label>
      <select class="form-select" id="voce-tipo">
        <option value="entrata">📈 Entrata</option>
        <option value="uscita">📉 Uscita</option>
      </select>
    </div>
    <div class="form-group"><label class="form-label">Descrizione</label>
      <input class="form-input" type="text" id="voce-desc" placeholder="Es. Premio Coppa Italia, Bonus sponsor...">
    </div>
    <div class="form-group"><label class="form-label">Importo (FM)</label>
      <input class="form-input" type="number" id="voce-importo" placeholder="Es. 5000000" step="100000">
    </div>
    <div class="form-group"><label class="form-label">Data</label>
      <input class="form-input" type="date" id="voce-data" value="${new Date().toISOString().split('T')[0]}">
    </div>
    <button onclick="salvaVoceBilancio('${sqId}')" class="btn-primary">💾 AGGIUNGI</button>`;
  document.getElementById('modal-bilancio-voce').classList.add('open');
}

async function caricaStoricoMovimenti(sqId){
  const el=document.getElementById(`storico-movimenti-${sqId}`);
  if(!el) return;
  try{
    const{data,error}=await sb.from('movimenti_budget')
      .select('*').eq('squadra_id',sqId)
      .order('created_at',{ascending:false}).limit(50);
    if(error||!data||!data.length){
      el.innerHTML='<div style="font-size:12px;color:var(--testo-dim);padding:8px 0">Nessun movimento registrato ancora</div>';
      return;
    }
    el.innerHTML=data.map(m=>{
      const pos=parseFloat(m.importo)>0||m.tipo==='entrata';
      const importo=Math.abs(parseFloat(m.importo)||0);
      return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--grigio-chiaro);font-size:12px">
        <div style="width:28px;height:28px;border-radius:6px;background:${pos?'rgba(0,255,135,0.1)':'rgba(255,68,68,0.1)'};display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0">${pos?'📈':'📉'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m.descrizione||'—'}</div>
          <div style="font-size:10px;color:var(--testo-dim)">📅 ${new Date(m.created_at).toLocaleDateString('it-IT')}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-family:'Space Mono',monospace;font-size:12px;font-weight:700;color:${pos?'var(--verde)':'var(--rosso)'}">${pos?'+':'-'}${fmtBudget(importo)}</div>
          ${m.saldo_dopo!=null?`<div style="font-size:9px;color:var(--testo-dim)">→ ${fmtBudget(m.saldo_dopo)}</div>`:''}
        </div>
      </div>`;
    }).join('');
  }catch(e){
    el.innerHTML='<div style="font-size:12px;color:var(--testo-dim)">Storico non disponibile</div>';
  }
}

async function salvaVoceBilancio(sqId){
  const tipo=document.getElementById('voce-tipo').value;
  const desc=document.getElementById('voce-desc').value||'Voce manuale';
  const importo=parseFloat(document.getElementById('voce-importo').value)||0;
  if(!importo){showToast('❌ Inserisci un importo','error');return;}
  const sq=squadreDB.find(s=>s.id===sqId);
  if(!sq) return;
  const nuovoBudget=tipo==='entrata'?sq.budget+importo:sq.budget-importo;
  try{
    const{error}=await sb.from('squadre').update({budget:nuovoBudget}).eq('id',sqId);
    if(!error){
      const idx=squadreDB.findIndex(s=>s.id===sqId);
      if(idx>=0) squadreDB[idx].budget=nuovoBudget;
      // Log in movimenti_budget
      await sb.from('movimenti_budget').insert({
        squadra_id:sqId,importo:tipo==='entrata'?importo:-importo,
        tipo,descrizione:desc,saldo_prima:sq.budget,saldo_dopo:nuovoBudget
      });
      showToast(`✅ ${tipo==='entrata'?'+':'−'}${fmtBudget(importo)} aggiunto al bilancio!`);
      document.getElementById('modal-bilancio-voce').classList.remove('open');
      renderBilancioSquadra(sqId);
    }
  }catch(e){showToast('❌ Errore: '+e.message,'error');}
}
let classificaDB=[];

async function renderClassifica(){
  const c=document.getElementById('classifica-container');
  try{
    const{data}=await sb.from('classifica').select('*').order('posizione');
    if(data&&data.length) classificaDB=data;
    else costruisciClassificaBase();
  }catch(e){costruisciClassificaBase();}
  renderTabellaClassifica();
}

function costruisciClassificaBase(){
  classificaDB=squadreDB.map((sq,i)=>({squadra_id:sq.id,posizione:i+1,punti:0,giocate:0,vinte:0,pareggiate:0,perse:0,gol_fatti:0,gol_subiti:0}));
}

function renderTabellaClassifica(){
  const c=document.getElementById('classifica-container');
  if(!c||!classificaDB.length){if(c)c.innerHTML='<div class="empty">Nessuna classifica disponibile</div>';return;}
  c.innerHTML=`
    <div style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:14px;overflow:hidden">
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:var(--grigio-scuro);border-bottom:2px solid var(--verde)">
              <th style="padding:12px 10px;text-align:left;font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:1px;color:var(--testo-dim);width:36px">#</th>
              <th style="padding:12px 10px;text-align:left;font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:1px;color:var(--testo-dim)">SQUADRA</th>
              <th style="padding:12px 6px;text-align:center;font-size:11px;color:var(--testo-dim)">G</th>
              <th style="padding:12px 6px;text-align:center;font-size:11px;color:var(--verde)">V</th>
              <th style="padding:12px 6px;text-align:center;font-size:11px;color:var(--oro)">P</th>
              <th style="padding:12px 6px;text-align:center;font-size:11px;color:var(--rosso)">S</th>
              <th style="padding:12px 6px;text-align:center;font-size:11px;color:var(--testo-dim)">GF</th>
              <th style="padding:12px 6px;text-align:center;font-size:11px;color:var(--testo-dim)">GS</th>
              <th style="padding:12px 6px;text-align:center;font-size:11px;color:var(--testo-dim)">DR</th>
              <th style="padding:12px 10px;text-align:center;font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--verde)">PTS</th>
            </tr>
          </thead>
          <tbody>
            ${classificaDB.map((row,i)=>{
              const sq=squadreDB.find(s=>s.id===row.squadra_id);
              if(!sq) return '';
              const dr=(row.gol_fatti||0)-(row.gol_subiti||0);
              const pos=i+1;
              const posColor=pos<=4?'var(--blu)':pos<=6?'var(--verde)':pos>=11?'var(--rosso)':'var(--testo-dim)';
              const isMia=utenteLoggato&&sq.id===utenteLoggato.id;
              const logo=sq.logo_url?`<img src="${sq.logo_url}" style="width:22px;height:22px;object-fit:contain;border-radius:3px">`:`<div style="width:22px;height:22px;border-radius:50%;background:${sq.avatar_bg};display:flex;align-items:center;justify-content:center;font-size:9px;font-family:'Bebas Neue',sans-serif;color:var(--nero)">${sq.avatar}</div>`;
              return `<tr style="border-bottom:1px solid var(--grigio-chiaro);background:${isMia?'rgba(0,255,135,0.04)':''}" onmouseover="this.style.background='var(--grigio-medio)'" onmouseout="this.style.background='${isMia?'rgba(0,255,135,0.04)':''}'">
                <td style="padding:10px;font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:${posColor}">${pos}</td>
                <td style="padding:10px"><div style="display:flex;align-items:center;gap:8px">${logo}<div><div style="font-weight:600;font-size:12px">${sq.nome}</div><div style="font-size:10px;color:var(--testo-dim)">👤 ${sq.owner_name}</div></div></div></td>
                <td style="padding:10px 6px;text-align:center;color:var(--testo-dim)">${row.giocate||0}</td>
                <td style="padding:10px 6px;text-align:center;color:var(--verde)">${row.vinte||0}</td>
                <td style="padding:10px 6px;text-align:center;color:var(--oro)">${row.pareggiate||0}</td>
                <td style="padding:10px 6px;text-align:center;color:var(--rosso)">${row.perse||0}</td>
                <td style="padding:10px 6px;text-align:center">${row.gol_fatti||0}</td>
                <td style="padding:10px 6px;text-align:center">${row.gol_subiti||0}</td>
                <td style="padding:10px 6px;text-align:center;color:${dr>0?'var(--verde)':dr<0?'var(--rosso)':'var(--testo-dim)'}">${dr>0?'+':''}${dr}</td>
                <td style="padding:10px;text-align:center;font-family:'Bebas Neue',sans-serif;font-size:20px;color:var(--verde)">${row.punti||0}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      ${adminLoggato?`<div style="padding:12px 16px;border-top:1px solid var(--grigio-chiaro)"><button onclick="apriModificaClassifica()" style="background:rgba(255,215,0,0.1);border:1px solid rgba(255,215,0,0.3);color:var(--oro);font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:1px;padding:8px 16px;border-radius:8px;cursor:pointer">✏️ AGGIORNA CLASSIFICA</button></div>`:''}
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;font-size:11px;color:var(--testo-dim)">
      <span>🟦 <span style="color:var(--blu)">Top 4</span> = Champions</span>
      <span>🟩 <span style="color:var(--verde)">5-6</span> = Europa</span>
      <span>🟥 <span style="color:var(--rosso)">11-12</span> = Penalità</span>
    </div>`;
}

async function apriModificaClassifica(){
  document.getElementById('mg-title').textContent='AGGIORNA CLASSIFICA';
  document.getElementById('mg-edit-btn').style.display='none';
  document.getElementById('mg-trattativa-btn').style.display='none';
  document.getElementById('mg-body').innerHTML=`
    <div style="padding:10px 14px;background:var(--grigio-scuro);border-bottom:1px solid var(--grigio-chiaro)">
      <div style="display:grid;grid-template-columns:28px 1fr 40px 40px 40px 40px 40px 50px;gap:4px;font-size:10px;font-weight:700;letter-spacing:1px;color:var(--testo-dim)">
        <span>#</span><span>SQUADRA</span><span style="text-align:center">V</span><span style="text-align:center">P</span><span style="text-align:center">S</span><span style="text-align:center">GF</span><span style="text-align:center">GS</span><span style="text-align:center;color:var(--verde)">PTS</span>
      </div>
    </div>
    <div style="padding:8px 14px">
      ${classificaDB.map((row,i)=>{
        const sq=squadreDB.find(s=>s.id===row.squadra_id);
        if(!sq) return '';
        return `<div style="display:grid;grid-template-columns:28px 1fr 40px 40px 40px 40px 40px 50px;gap:4px;align-items:center;padding:6px 0;border-bottom:1px solid var(--grigio-chiaro)">
          <span style="font-family:'Space Mono',monospace;font-size:11px;color:var(--testo-dim)">${i+1}</span>
          <span style="font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${sq.owner_name}</span>
          ${['v','p','s','gf','gs'].map(f=>`<input type="number" id="cl-${f}-${i}" value="${{v:row.vinte,p:row.pareggiate,s:row.perse,gf:row.gol_fatti,gs:row.gol_subiti}[f]||0}" min="0" style="background:var(--grigio-scuro);border:1px solid var(--grigio-chiaro);border-radius:4px;padding:4px 2px;color:var(--testo);font-size:11px;text-align:center;width:100%">`).join('')}
          <input type="number" id="cl-pt-${i}" value="${row.punti||0}" min="0" style="background:var(--grigio-scuro);border:1px solid rgba(0,255,135,0.3);border-radius:4px;padding:4px 2px;color:var(--verde);font-size:12px;text-align:center;width:100%;font-weight:700">
        </div>`;
      }).join('')}
    </div>
    <div style="padding:12px 14px;border-top:1px solid var(--grigio-chiaro)">
      <button onclick="salvaClassifica()" style="width:100%;background:var(--verde);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:18px;padding:12px;border-radius:10px;border:none;cursor:pointer">💾 SALVA CLASSIFICA</button>
    </div>`;
  document.getElementById('modal-giocatore').classList.add('open');
}

async function salvaClassifica(){
  const aggiornamenti=classificaDB.map((row,i)=>{
    const v=parseInt(document.getElementById(`cl-v-${i}`)?.value)||0;
    const p=parseInt(document.getElementById(`cl-p-${i}`)?.value)||0;
    const s=parseInt(document.getElementById(`cl-s-${i}`)?.value)||0;
    const gf=parseInt(document.getElementById(`cl-gf-${i}`)?.value)||0;
    const gs=parseInt(document.getElementById(`cl-gs-${i}`)?.value)||0;
    const pt=parseInt(document.getElementById(`cl-pt-${i}`)?.value)||0;
    return{...row,vinte:v,pareggiate:p,perse:s,gol_fatti:gf,gol_subiti:gs,punti:pt,giocate:v+p+s,posizione:i+1};
  });
  try{
    for(const r of aggiornamenti){
      await sb.from('classifica').upsert({squadra_id:r.squadra_id,posizione:r.posizione,punti:r.punti,giocate:r.giocate,vinte:r.vinte,pareggiate:r.pareggiate,perse:r.perse,gol_fatti:r.gol_fatti,gol_subiti:r.gol_subiti},{onConflict:'squadra_id'});
    }
    classificaDB=aggiornamenti;
    showToast('✅ Classifica salvata!');
    document.getElementById('modal-giocatore').classList.remove('open');
    renderTabellaClassifica();
  }catch(e){
    classificaDB=aggiornamenti;
    showToast('⚠️ Salvato — crea tabella classifica su Supabase se non esiste');
    document.getElementById('modal-giocatore').classList.remove('open');
    renderTabellaClassifica();
  }
}

async function aggiornaFotoTutti(){
  if(!adminLoggato){showToast('❌ Non sei admin!');return;}
  showToast('🖼️ Avvio aggiornamento foto...');
  let aggiornati=0,errori=0;
  for(const g of giocatoriDB){
    if(g.foto_url) continue;
    try{
      const res=await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(g.nome)}`);
      const data=await res.json();
      const players=data?.player||[];
      if(!players.length){errori++;continue;}
      const fotoUrl=players[0].strThumb||players[0].strCutout||null;
      if(!fotoUrl){errori++;continue;}
      const{error}=await sb.from('giocatori').update({foto_url:fotoUrl}).eq('id',g.id);
      if(!error){const idx=giocatoriDB.findIndex(x=>x.id===g.id);if(idx>=0)giocatoriDB[idx].foto_url=fotoUrl;aggiornati++;}
      else errori++;
    }catch(e){errori++;}
    await new Promise(r=>setTimeout(r,200));
  }
  showToast(`📸 Foto: ${aggiornati} • Non trovate: ${errori}`);
  if(squadraAttiva) renderRosa(tabAttivoSq);
}
