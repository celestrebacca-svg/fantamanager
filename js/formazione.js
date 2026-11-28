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


// ===== FORMAZIONE UNDER 23 =====
// Stessa meccanica della formazione principale, ma il pool giocatori include
// Principale + Marginale + Primavera, filtrato per età massima 23 anni
// (calcolata al 1° settembre della stagione corrente, vedi eleggibileU23 in utils.js).
// Moduli Under 23: quelli della formazione principale + moduli con più difensori/centrocampisti (e un solo attaccante)
const MODULI_U23={...MODULI,
  '5-4-1':{P:[[50,90]],D:[[10,70],[28,70],[50,70],[72,70],[90,70]],C:[[15,48],[38,48],[62,48],[85,48]],A:[[50,22]]},
  '6-3-1':{P:[[50,90]],D:[[8,70],[24,70],[40,70],[60,70],[76,70],[92,70]],C:[[25,48],[50,48],[75,48]],A:[[50,22]]},
  '3-6-1':{P:[[50,90]],D:[[25,72],[50,72],[75,72]],C:[[8,50],[24,50],[40,50],[60,50],[76,50],[92,50]],A:[[50,22]]},
  '4-5-1':{P:[[50,90]],D:[[15,70],[37,70],[63,70],[85,70]],C:[[10,48],[30,48],[50,48],[70,48],[90,48]],A:[[50,22]]}
};
// Slot esistenti per un modulo (es. D_0..D_4): serve a non portarsi dietro slot di un altro modulo
function slotValidiU23(modulo){
  const set=new Set(),M=MODULI_U23[modulo]||{};
  ['P','D','C','A'].forEach(r=>(M[r]||[]).forEach((_,i)=>set.add(`${r}_${i}`)));
  return set;
}

let formazioniU23DB={},formazioneU23SqIdAttiva=null,formazioneU23Slots={},formazioneU23ModuloCorrente='4-3-3',formazioneU23ContainerAttivo='formazione-u23-content',formazioneU23Panchina=[],formazioneU23Giornata=null;
const GIORNATA_INIZIO_U23=7; // la Coppa Under 23 parte dalla 7ª giornata

// Giornata selezionata: di default la prima non ancora giocata (dalla 7ª in poi)
function formazioneU23GiornataCorrente(){
  if(formazioneU23Giornata) return formazioneU23Giornata;
  let g=GIORNATA_INIZIO_U23;
  try{
    if(typeof talentboyCalendario!=='undefined'&&talentboyCalendario.length){
      const prossime=talentboyCalendario.filter(m=>!m.giocata&&m.giornata>=GIORNATA_INIZIO_U23).map(m=>m.giornata);
      if(prossime.length) g=Math.min(...prossime);
    }
  }catch(e){}
  formazioneU23Giornata=g;
  return g;
}

// Formazione di UNA squadra per UNA giornata (tabella formazioni_u23_giornata)
async function caricaFormazioneU23(sqId,giornata){
  const g=giornata||formazioneU23GiornataCorrente();
  const key=sqId+'_'+g;
  if(formazioniU23DB[key]!==undefined) return formazioniU23DB[key];
  try{
    const{data}=await sb.from('formazioni_u23_giornata').select('*').eq('squadra_id',sqId).eq('giornata',g).limit(1);
    formazioniU23DB[key]=(data&&data[0])||null;
  }catch(e){formazioniU23DB[key]=null;}
  return formazioniU23DB[key];
}

// Punto di partenza per una giornata ancora vuota: ultima formazione salvata
// prima di quella giornata, altrimenti la vecchia formazione unica (formazioni_u23)
async function formazionePrecedenteU23(sqId,g){
  try{
    const{data}=await sb.from('formazioni_u23_giornata').select('*').eq('squadra_id',sqId).lt('giornata',g).order('giornata',{ascending:false}).limit(1);
    if(data&&data[0]) return data[0];
  }catch(e){}
  try{
    const{data}=await sb.from('formazioni_u23').select('*').eq('squadra_id',sqId).limit(1);
    return (data&&data[0])||null;
  }catch(e){return null;}
}

function cambiaGiornataFormazioneU23(g){
  formazioneU23Giornata=parseInt(g)||GIORNATA_INIZIO_U23;
  renderFormazioneU23(formazioneU23SqIdAttiva,false,formazioneU23ContainerAttivo);
}

function poolU23(sqId){
  return giocatoriDB.filter(g=>g.squadra_id===sqId&&['principale','marginale','primavera'].includes(g.lista)&&eleggibileU23(g.data_nascita,g.eta));
}

async function renderFormazioneU23(sqId,editMode=false,containerId='formazione-u23-content'){
  formazioneU23SqIdAttiva=sqId;
  formazioneU23ContainerAttivo=containerId;
  const c=document.getElementById(containerId);
  if(!c) return;
  if(!editMode) c.innerHTML='<div class="loading"><div class="loading-spinner"></div></div>';
  const giornataU23=formazioneU23GiornataCorrente();
  const f=await caricaFormazioneU23(sqId,giornataU23);
  const giocatori=poolU23(sqId);
  const modulo=editMode?formazioneU23ModuloCorrente:(f?.modulo||'4-3-3');
  formazioneU23ModuloCorrente=modulo;
  const mapT={};
  if(editMode) Object.entries(formazioneU23Slots).forEach(([s,g])=>{if(g) mapT[s]=g;});
  else (f?.titolari||[]).forEach(t=>mapT[t.slot]=t.gid);
  const slots=[];
  ['P','D','C','A'].forEach(r=>(MODULI_U23[modulo][r]||[]).forEach(([x,y],i)=>slots.push({slot:`${r}_${i}`,ruolo:r,x,y})));
  const btn=document.getElementById('btn-edit-formazione-u23');
  if(btn){btn.textContent=editMode?'✕ Annulla':'✏️ MODIFICA';btn.onclick=editMode?()=>renderFormazioneU23(sqId,false):()=>attivaEditFormazioneU23();}
  const rc={'P':'#FFD700','D':'#4d9fff','C':'#00e68a','A':'#ff5c5c'};
  const rcCss={'P':'var(--oro)','D':'var(--blu)','C':'var(--verde)','A':'var(--rosso)'};
  c.innerHTML=`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap">
      <span style="font-size:12px;color:var(--testo-dim)">Giornata:</span>
      <select onchange="cambiaGiornataFormazioneU23(this.value)" ${editMode?'disabled':''} style="background:var(--grigio-scuro);color:var(--testo);border:1px solid var(--grigio-chiaro);border-radius:6px;padding:6px 10px;font-size:12px">
        ${Array.from({length:38-GIORNATA_INIZIO_U23+1},(_,i)=>GIORNATA_INIZIO_U23+i).map(n=>`<option value="${n}" ${n===giornataU23?'selected':''}>${n}ª giornata</option>`).join('')}
      </select>
      ${!f&&!editMode?`<span style="font-size:11px;color:var(--testo-dim);font-style:italic">Formazione non ancora inserita per la ${giornataU23}ª giornata</span>`:''}
    </div>
    <div style="font-size:11px;color:var(--testo-dim);margin-bottom:10px">
      🌱 Solo giocatori Principale/Marginale/Primavera con massimo 23 anni al 1° settembre ${STAGIONE_CORRENTE?.split('/')[0]||''} (${giocatori.length} eleggibili).
    </div>
    ${editMode?`<div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap"><span style="font-size:12px;color:var(--testo-dim);align-self:center">Modulo:</span>${Object.keys(MODULI_U23).map(m=>`<button onclick="cambiaModuloFormazioneU23('${m}')" style="font-size:12px;font-family:'Bebas Neue',sans-serif;padding:5px 11px;border-radius:6px;cursor:pointer;border:1px solid ${m===modulo?'var(--verde)':'var(--grigio-chiaro)'};background:${m===modulo?'rgba(0,255,135,0.15)':'var(--grigio)'};color:${m===modulo?'var(--verde)':'var(--testo)'}">${m}</button>`).join('')}</div>`:''}
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
        if(editMode){const usatiAltrove=new Set([...slots.filter(x=>x.slot!==s.slot).map(x=>mapT[x.slot]).filter(Boolean),...formazioneU23Panchina]);const cand=giocatori.filter(gg=>gg.ruolo===s.ruolo&&(!usatiAltrove.has(gg.id)||gg.id===mapT[s.slot]));return `<div style="position:absolute;left:${s.x}%;top:${s.y}%;transform:translate(-50%,-50%);z-index:2;display:flex;flex-direction:column;align-items:center;gap:1px"><div style="width:26px;height:26px;border-radius:50%;background:${rc[s.ruolo]};border:2px solid white;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:700;color:#000">${g?.foto_url?`<img src="${g.foto_url}" style="width:100%;height:100%;object-fit:cover">`:g?iniziali(g.nome):'?'}</div><select onchange="assegnaSlotU23('${s.slot}',this.value)" style="font-size:6px;background:rgba(0,0,0,0.85);color:white;border:1px solid ${rc[s.ruolo]};border-radius:3px;padding:1px;max-width:44px"><option value="">—</option>${cand.map(gg=>`<option value="${gg.id}" ${mapT[s.slot]===gg.id?'selected':''}>${gg.nome.split(' ').pop()}</option>`).join('')}</select></div>`;}
        return `<div style="position:absolute;left:${s.x}%;top:${s.y}%;transform:translate(-50%,-50%);z-index:2;text-align:center" ${g?`onclick="apriGiocatore(${g.id})" style="cursor:pointer"`:''}><div style="width:${g?'28':'20'}px;height:${g?'28':'20'}px;border-radius:50%;background:${g?rc[s.ruolo]:'rgba(255,255,255,0.1)'};border:2px solid ${g?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.2)'};overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:700;color:#000;margin:0 auto">${g?.foto_url?`<img src="${g.foto_url}" style="width:100%;height:100%;object-fit:cover">`:g?iniziali(g.nome):''}</div>${g?`<div style="font-size:6px;color:white;text-shadow:0 1px 3px rgba(0,0,0,1);max-width:36px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px">${g.nome.split(' ').pop()}</div>`:''}</div>`;
      }).join('')}
    </div>
    <div style="text-align:center;font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--verde);letter-spacing:3px;margin-bottom:12px">${modulo}</div>
    <div style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:10px;overflow:hidden;margin-bottom:12px">
      <div style="background:var(--grigio-scuro);padding:8px 14px;font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:1px;border-bottom:1px solid var(--grigio-chiaro)">📋 TITOLARI U23 (${slots.filter(s=>mapT[s.slot]).length}/11)</div>
      ${slots.map((s,i)=>{const g=mapT[s.slot]?giocatoriDB.find(x=>x.id===mapT[s.slot]):null;return `<div style="display:flex;align-items:center;gap:8px;padding:5px 14px;border-bottom:1px solid var(--grigio-chiaro);font-size:12px"><span style="font-size:9px;color:var(--testo-dim);width:14px">${i+1}</span><span style="font-size:9px;color:${rcCss[s.ruolo]};background:${rcCss[s.ruolo]}22;padding:2px 5px;border-radius:3px;flex-shrink:0;font-weight:700">${s.ruolo}</span>${g?`<div style="width:20px;height:20px;border-radius:50%;overflow:hidden;background:var(--grigio-chiaro);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:700">${g.foto_url?`<img src="${g.foto_url}" style="width:100%;height:100%;object-fit:cover">`:iniziali(g.nome)}</div><span style="font-weight:600;flex:1">${g.nome}</span>${g.eta?`<span style="font-size:10px;color:var(--testo-dim)">${g.eta}a</span>`:''}`:`<span style="color:var(--testo-dim);font-style:italic;font-size:11px">— non assegnato —</span>`}</div>`;}).join('')}
    </div>
    ${(()=>{
      const panch=editMode?formazioneU23Panchina:(f?.panchina||[]);
      const usatiTitolari=slots.map(s=>mapT[s.slot]).filter(Boolean);
      const disponibiliPanchina=giocatori.filter(g=>!usatiTitolari.includes(g.id)&&!panch.includes(g.id));
      return `<div style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:10px;overflow:hidden;margin-bottom:12px">
        <div style="background:var(--grigio-scuro);padding:8px 14px;font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:1px;border-bottom:1px solid var(--grigio-chiaro);display:flex;justify-content:space-between">
          <span>🪑 PANCHINA (${panch.length}/10)</span>
        </div>
        ${panch.map(gid=>{
          const g=giocatoriDB.find(x=>x.id===gid);
          if(!g) return '';
          return `<div style="display:flex;align-items:center;gap:8px;padding:5px 14px;border-bottom:1px solid var(--grigio-chiaro);font-size:12px">
            <span style="font-size:9px;color:${rcCss[g.ruolo]};background:${rcCss[g.ruolo]}22;padding:2px 5px;border-radius:3px;flex-shrink:0;font-weight:700">${g.ruolo}</span>
            <div style="width:20px;height:20px;border-radius:50%;overflow:hidden;background:var(--grigio-chiaro);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:700">${g.foto_url?`<img src="${g.foto_url}" style="width:100%;height:100%;object-fit:cover">`:iniziali(g.nome)}</div>
            <span style="font-weight:600;flex:1">${g.nome}</span>
            ${editMode?`<button onclick="rimuoviPanchinaU23(${g.id})" style="background:none;border:none;color:var(--rosso);cursor:pointer;font-size:14px">✕</button>`:(g.eta?`<span style="font-size:10px;color:var(--testo-dim)">${g.eta}a</span>`:'')}
          </div>`;
        }).join('')}
        ${editMode&&panch.length<10?`<div style="padding:8px 14px">
          <select onchange="aggiungiPanchinaU23(this.value);this.value=''" style="width:100%;font-size:12px;padding:6px;background:var(--grigio-scuro);color:var(--testo);border:1px solid var(--grigio-chiaro);border-radius:6px">
            <option value="">➕ Aggiungi in panchina...</option>
            ${disponibiliPanchina.map(g=>`<option value="${g.id}">${g.nome} (${g.ruolo})</option>`).join('')}
          </select>
        </div>`:''}
        ${panch.length===0&&!editMode?'<div style="padding:14px;text-align:center;color:var(--testo-dim);font-size:12px;font-style:italic">Nessuna riserva in panchina</div>':''}
      </div>`;
    })()}
    ${editMode?`<button onclick="salvaFormazioneU23('${sqId}')" style="width:100%;background:var(--verde);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:18px;padding:12px;border-radius:10px;border:none;cursor:pointer;margin-bottom:8px">💾 SALVA FORMAZIONE U23</button>`:''}
  `;
}

async function attivaEditFormazioneU23(){
  const g=formazioneU23GiornataCorrente();
  let f=await caricaFormazioneU23(formazioneU23SqIdAttiva,g);
  if(!f) f=await formazionePrecedenteU23(formazioneU23SqIdAttiva,g); // parte dall'ultima formazione, poi la modifichi
  formazioneU23ModuloCorrente=f?.modulo||'4-3-3';
  formazioneU23Slots={};
  formazioneU23Panchina=[...(f?.panchina||[])];
  if(f?.titolari) f.titolari.forEach(t=>{formazioneU23Slots[t.slot]=t.gid;});
  renderFormazioneU23(formazioneU23SqIdAttiva,true,formazioneU23ContainerAttivo);
}
function aggiungiPanchinaU23(gIdStr){
  const gId=parseInt(gIdStr);
  if(!gId||formazioneU23Panchina.includes(gId)||formazioneU23Panchina.length>=10) return;
  formazioneU23Panchina.push(gId);
  renderFormazioneU23(formazioneU23SqIdAttiva,true,formazioneU23ContainerAttivo);
}
function rimuoviPanchinaU23(gId){
  formazioneU23Panchina=formazioneU23Panchina.filter(id=>id!==gId);
  renderFormazioneU23(formazioneU23SqIdAttiva,true,formazioneU23ContainerAttivo);
}
function cambiaModuloFormazioneU23(m){
  document.querySelectorAll('[onchange^="assegnaSlotU23"]').forEach(sel=>{const match=sel.getAttribute('onchange').match(/'([^']+)'/);if(match)formazioneU23Slots[match[1]]=parseInt(sel.value)||null;});
  formazioneU23ModuloCorrente=m;
  const ok=slotValidiU23(m);Object.keys(formazioneU23Slots).forEach(k=>{if(!ok.has(k)) delete formazioneU23Slots[k];});
  renderFormazioneU23(formazioneU23SqIdAttiva,true,formazioneU23ContainerAttivo);
}
function assegnaSlotU23(slot,gIdStr){
  formazioneU23Slots[slot]=parseInt(gIdStr)||null;
  renderFormazioneU23(formazioneU23SqIdAttiva,true,formazioneU23ContainerAttivo); // ridisegna: il giocatore scelto sparisce dagli altri menu
}

async function salvaFormazioneU23(sqId){
  document.querySelectorAll('[onchange^="assegnaSlotU23"]').forEach(sel=>{const match=sel.getAttribute('onchange').match(/'([^']+)'/);if(match)formazioneU23Slots[match[1]]=parseInt(sel.value)||null;});
  const okSlot=slotValidiU23(formazioneU23ModuloCorrente);
  const titolari=Object.entries(formazioneU23Slots).filter(([s,g])=>g&&okSlot.has(s)).map(([slot,gid])=>({slot,gid}));
  const tuttiId=[...titolari.map(t=>t.gid),...formazioneU23Panchina];
  if(new Set(tuttiId).size!==tuttiId.length){showToast('❌ Un giocatore è inserito più di una volta','error');return;}
  // Verifica che tutti i titolari/panchinari assegnati siano ancora eleggibili (età)
  const pool=poolU23(sqId).map(g=>g.id);
  const nonEleggibili=titolari.filter(t=>!pool.includes(t.gid));
  if(nonEleggibili.length){showToast('❌ Uno o più giocatori schierati non sono più eleggibili U23','error');return;}
  const panchinaNonEleggibile=formazioneU23Panchina.filter(gid=>!pool.includes(gid));
  if(panchinaNonEleggibile.length){showToast('❌ Uno o più giocatori in panchina non sono più eleggibili U23','error');return;}
  const giornataU23=formazioneU23GiornataCorrente();
  const payload={squadra_id:sqId,giornata:giornataU23,modulo:formazioneU23ModuloCorrente,titolari,panchina:formazioneU23Panchina};
  try{
    const{error}=await sb.from('formazioni_u23_giornata').upsert(payload,{onConflict:'squadra_id,giornata'});
    if(error) throw error;
    formazioniU23DB[sqId+'_'+giornataU23]=payload;
    showToast(`✅ Formazione Under 23 salvata per la ${giornataU23}ª giornata!`);
    renderFormazioneU23(sqId,false,formazioneU23ContainerAttivo);
  }catch(e){showToast('❌ '+e.message,'error');}
}
function fmtM(val){
  const n=parseFloat(val)||0;
  if(Math.abs(n)>=1000000) return (n/1000000).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2})+' M FM';
  if(Math.abs(n)>=1000) return (n/1000).toLocaleString('it-IT',{minimumFractionDigits:0,maximumFractionDigits:1})+' K FM';
  return n.toLocaleString('it-IT')+' FM';
}

// (Il vecchio bilancio della squadra è stato tolto: ora c'è solo la pagina Bilancio, file bilancio.js)

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
