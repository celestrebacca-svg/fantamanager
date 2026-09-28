// ===== GESTIONE ROSA UNIFICATA (Principale / Marginale / Primavera) =====
// Dipende da: giocatoriDB, squadreDB, LIMITI_ROSE_ATTIVI, sb, showToast, iniziali,
// squadraAttiva, renderRosa, tabAttivoSq (già presenti nel progetto).
// Uso: apriGestioneRosa(squadraId)  -> apre la schermata a tutto schermo.
//
// Interazione:
//  - TAP su un giocatore = selezionato; TAP su un altro giocatore di un'altra lista = SCAMBIO;
//    TAP su una casella vuota (o sull'intestazione di una lista) = SPOSTA lì.
//  - TRASCINAMENTO: tieni premuto ~0,3s un giocatore e trascinalo (dito o mouse).

const GR_LISTE=[
  {k:'principale',label:'🟢 Principale',max:25},
  {k:'marginale', label:'🟡 Marginale', max:14},
  {k:'primavera', label:'🔵 Primavera', max:15}
];
let grSquadraId=null;
let grSelId=null;
let grBusy=false;
let grDrag=null;

function grInjectStyle(){
  if(document.getElementById('gr-style')) return;
  const st=document.createElement('style');
  st.id='gr-style';
  st.textContent=`
  #gr-overlay{position:fixed;inset:0;z-index:9999;background:var(--nero,#0b0b0b);color:var(--testo,#eee);display:none;flex-direction:column}
  #gr-overlay.open{display:flex}
  .gr-top{display:flex;gap:8px;align-items:center;padding:10px 12px;border-bottom:1px solid var(--grigio-chiaro,#333);flex-shrink:0}
  .gr-top select{flex:1;min-width:0;background:var(--grigio-medio,#222);color:var(--testo,#eee);border:1px solid var(--grigio-chiaro,#333);border-radius:8px;padding:8px;font-size:14px}
  .gr-close{background:var(--rosso,#c0392b);color:#fff;border:none;border-radius:8px;padding:8px 14px;font-size:14px;cursor:pointer}
  .gr-hint{font-size:11px;color:var(--testo-dim,#999);padding:6px 12px;flex-shrink:0}
  .gr-body{flex:1;overflow-y:auto;padding:8px 10px 40px;-webkit-overflow-scrolling:touch}
  .gr-sec{margin-bottom:14px;border:1px solid var(--grigio-chiaro,#333);border-radius:10px;overflow:hidden}
  .gr-sec-h{display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:var(--grigio-medio,#222);font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1px}
  .gr-sec-h .gr-cnt{font-size:13px;font-family:inherit}
  .gr-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:8px}
  .gr-cell{min-height:56px;border-radius:8px;border:1px solid var(--grigio-chiaro,#333);background:var(--grigio-medio,#222);display:flex;align-items:center;gap:6px;padding:4px 6px;position:relative;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;cursor:pointer;overflow:hidden}
  .gr-cell.gr-empty{border-style:dashed;background:transparent;justify-content:center;color:var(--testo-dim,#777);font-size:18px}
  .gr-cell.gr-sel{outline:2px solid var(--verde,#2ecc71);background:rgba(46,204,113,.15)}
  .gr-cell.gr-target{outline:2px dashed #f1c40f;background:rgba(241,196,15,.15)}
  .gr-cell.gr-dragging{opacity:.35}
  .gr-av{width:30px;height:30px;border-radius:50%;background:var(--grigio-chiaro,#333);display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;overflow:hidden}
  .gr-av img{width:100%;height:100%;object-fit:cover}
  .gr-nm{font-size:11px;line-height:1.15;min-width:0}
  .gr-nm b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .gr-nm span{color:var(--testo-dim,#999);font-size:10px}
  .gr-ghost{position:fixed;z-index:10000;pointer-events:none;width:110px;opacity:.9;box-shadow:0 6px 18px rgba(0,0,0,.6)}
  .gr-sec.gr-target .gr-sec-h{background:rgba(241,196,15,.25)}
  `;
  document.head.appendChild(st);
}

function grEnsureOverlay(){
  grInjectStyle();
  let o=document.getElementById('gr-overlay');
  if(o) return o;
  o=document.createElement('div');
  o.id='gr-overlay';
  o.innerHTML=`
    <div class="gr-top">
      <select id="gr-squadra" onchange="grCambiaSquadra(this.value)"></select>
      <button class="gr-close" onclick="chiudiGestioneRosa()">✕ Chiudi</button>
    </div>
    <div class="gr-hint">Tocca un giocatore e poi la destinazione (scambio o casella vuota), oppure tienilo premuto e trascinalo.</div>
    <div class="gr-body" id="gr-body"></div>`;
  document.body.appendChild(o);
  return o;
}

function apriGestioneRosa(squadraId){
  const o=grEnsureOverlay();
  let id=squadraId;
  if(!id && typeof squadraAttiva!=='undefined' && squadraAttiva){
    id=(typeof squadraAttiva==='object')?squadraAttiva.id:squadraAttiva;
  }
  if(!id && squadreDB.length) id=squadreDB[0].id;
  grSquadraId=id;
  grSelId=null;
  document.getElementById('gr-squadra').innerHTML=squadreDB.map(s=>
    `<option value="${s.id}" ${String(s.id)===String(id)?'selected':''}>${s.nome} (${s.owner_name})</option>`).join('');
  o.classList.add('open');
  grRender();
}

function chiudiGestioneRosa(){
  const o=document.getElementById('gr-overlay');
  if(o) o.classList.remove('open');
  grSelId=null;
  if(typeof squadraAttiva!=='undefined' && squadraAttiva && typeof renderRosa==='function'){
    try{ renderRosa(tabAttivoSq); }catch(e){}
  }
}

function grCambiaSquadra(id){
  const s=squadreDB.find(x=>String(x.id)===String(id));
  grSquadraId=s?s.id:id;
  grSelId=null;
  grRender();
}

// Ordine per ruolo: Portieri, Difensori, Centrocampisti, Attaccanti.
// Riconosce sia 'P/D/C/A' sia 'Portiere/Difensore/...' (guarda la prima lettera).
const GR_RUOLI={P:{ord:0,col:'#f39c12'},D:{ord:1,col:'#3498db'},C:{ord:2,col:'#2ecc71'},A:{ord:3,col:'#e74c3c'}};
function grRuoloKey(g){
  const k=String(g.ruolo||'').trim().charAt(0).toUpperCase();
  return GR_RUOLI[k]?k:null;
}
function grGiocatori(lista){
  return giocatoriDB
    .filter(g=>String(g.squadra_id)===String(grSquadraId)&&g.lista===lista)
    .sort((a,b)=>{
      const ka=grRuoloKey(a),kb=grRuoloKey(b);
      const oa=ka?GR_RUOLI[ka].ord:9,ob=kb?GR_RUOLI[kb].ord:9;
      return oa-ob||(a.nome||'').localeCompare(b.nome||'');
    });
}

function grRender(){
  const body=document.getElementById('gr-body');
  if(!body) return;
  body.innerHTML=GR_LISTE.map(L=>{
    const gs=grGiocatori(L.k);
    const cap=L.max;
    const cells=Math.max(cap,gs.length+(LIMITI_ROSE_ATTIVI?0:1));
    let html='';
    gs.forEach(g=>{
      const rk=grRuoloKey(g);
      html+=`<div class="gr-cell ${String(g.id)===String(grSelId)?'gr-sel':''}" data-gid="${g.id}" data-lista="${L.k}" style="border-left:4px solid ${rk?GR_RUOLI[rk].col:'var(--grigio-chiaro,#333)'}">
        <div class="gr-av">${g.foto_url?`<img src="${g.foto_url}" draggable="false">`:iniziali(g.nome)}</div>
        <div class="gr-nm"><b>${g.nome}</b><span>${g.ruolo||''}</span></div></div>`;
    });
    for(let i=gs.length;i<cells;i++){
      html+=`<div class="gr-cell gr-empty" data-lista="${L.k}" data-empty="1">+</div>`;
    }
    const over=LIMITI_ROSE_ATTIVI&&gs.length>cap;
    const cnt=LIMITI_ROSE_ATTIVI
      ?`<span class="gr-cnt" style="color:${gs.length>=cap?'var(--rosso,#e74c3c)':'var(--verde,#2ecc71)'}">${gs.length}/${cap}${over?' ⚠️':''}</span>`
      :`<span class="gr-cnt" style="color:var(--testo-dim,#999)">${gs.length} (nessun limite)</span>`;
    return `<div class="gr-sec" data-lista="${L.k}" data-sec="1">
      <div class="gr-sec-h" data-lista="${L.k}" data-sechead="1"><span>${L.label}</span>${cnt}</div>
      <div class="gr-grid">${html}</div></div>`;
  }).join('');
  grBindEvents(body);
}

// ---------- Logica spostamento / scambio ----------
function grTrovaGiocatore(id){ return giocatoriDB.find(x=>String(x.id)===String(id)); }

async function grEsegui(gIdSorgente,targetEl){
  if(grBusy||!targetEl) return;
  const src=grTrovaGiocatore(gIdSorgente);
  if(!src) return;
  const listaDest=targetEl.dataset.lista;
  if(!listaDest) return;
  const tgtId=targetEl.dataset.gid;
  if(tgtId && String(tgtId)===String(src.id)){ grSelId=null; grRender(); return; }

  // Bersaglio = altro giocatore -> SCAMBIO (o solo cambio selezione se stessa lista)
  if(tgtId){
    const tgt=grTrovaGiocatore(tgtId);
    if(!tgt) return;
    if(tgt.lista===src.lista){ grSelId=tgt.id; grRender(); return; }
    await grSalva([
      {g:src,lista:tgt.lista},
      {g:tgt,lista:src.lista}
    ],`🔁 ${src.nome} ⇄ ${tgt.nome}`);
    return;
  }
  // Bersaglio = casella vuota / intestazione -> SPOSTA
  if(src.lista===listaDest){ grSelId=null; grRender(); return; }
  if(LIMITI_ROSE_ATTIVI){
    const L=GR_LISTE.find(x=>x.k===listaDest);
    const n=grGiocatori(listaDest).length;
    if(L&&n>=L.max){ showToast(`❌ Rosa ${listaDest} piena (max ${L.max})!`,'error'); return; }
  }
  await grSalva([{g:src,lista:listaDest}],`✅ ${src.nome} → ${listaDest}`);
}

async function grSalva(modifiche,msgOk){
  grBusy=true;
  const vecchi=modifiche.map(m=>({id:m.g.id,lista:m.g.lista}));
  // aggiornamento ottimistico
  modifiche.forEach(m=>{ const i=giocatoriDB.findIndex(x=>x.id===m.g.id); if(i>=0) giocatoriDB[i]={...giocatoriDB[i],lista:m.lista}; });
  grSelId=null; grRender();
  try{
    const res=await Promise.all(modifiche.map(m=>
      sb.from('giocatori').update({lista:m.lista}).eq('id',m.g.id).select()));
    for(const r of res){
      if(r.error) throw r.error;
      if(!r.data||r.data.length===0) throw new Error('nessuna riga aggiornata (controlla RLS sulla tabella giocatori)');
    }
    showToast(msgOk);
  }catch(e){
    // ripristino locale + prova a ripristinare anche il DB dei successi parziali
    vecchi.forEach(v=>{ const i=giocatoriDB.findIndex(x=>x.id===v.id); if(i>=0) giocatoriDB[i]={...giocatoriDB[i],lista:v.lista}; });
    try{ await Promise.all(vecchi.map(v=>sb.from('giocatori').update({lista:v.lista}).eq('id',v.id))); }catch(_){}
    grRender();
    showToast('❌ Spostamento non salvato: '+e.message,'error');
  }
  grBusy=false;
}

// ---------- Eventi: tap + long-press drag ----------
function grBindEvents(body){
  body.onpointerdown=grPointerDown;
}

function grTargetAt(x,y){
  const el=document.elementFromPoint(x,y);
  if(!el) return null;
  return el.closest('.gr-cell')||el.closest('[data-sechead]')||el.closest('.gr-grid')&&el.closest('.gr-sec');
}

function grClearTargets(){
  document.querySelectorAll('.gr-target').forEach(e=>e.classList.remove('gr-target'));
}

function grPointerDown(ev){
  if(grBusy) return;
  const cell=ev.target.closest('.gr-cell');
  const head=ev.target.closest('[data-sechead]');
  const startX=ev.clientX,startY=ev.clientY;
  const isMouse=ev.pointerType==='mouse';
  const gid=cell&&cell.dataset.gid;

  // pointerdown su una casella vuota / intestazione: gestito come tap in pointerup
  let dragging=false,timer=null,moved=false;

  const beginDrag=()=>{
    if(!gid) return;
    dragging=true;
    grDrag={gid,el:cell};
    cell.classList.add('gr-dragging');
    const g=cell.cloneNode(true);
    g.classList.remove('gr-dragging','gr-sel');
    g.classList.add('gr-ghost');
    g.style.left=(startX-55)+'px';g.style.top=(startY-28)+'px';
    document.body.appendChild(g);
    grDrag.ghost=g;
    if(navigator.vibrate) try{navigator.vibrate(15);}catch(_){}
  };

  if(gid){
    if(!isMouse) timer=setTimeout(beginDrag,300);
  }

  const onMove=e=>{
    const dx=e.clientX-startX,dy=e.clientY-startY;
    if(!dragging){
      if(Math.hypot(dx,dy)>8){
        moved=true;
        if(isMouse&&gid) beginDrag(); else clearTimeout(timer); // touch: movimento prima del long-press = scroll
      }
      return;
    }
    grDrag.ghost.style.left=(e.clientX-55)+'px';
    grDrag.ghost.style.top=(e.clientY-28)+'px';
    grClearTargets();
    const t=grTargetAt(e.clientX,e.clientY);
    if(t) t.classList.add('gr-target');
  };
  const blockScroll=e=>{ if(dragging) e.preventDefault(); };

  const cleanup=()=>{
    clearTimeout(timer);
    document.removeEventListener('pointermove',onMove);
    document.removeEventListener('pointerup',onUp);
    document.removeEventListener('pointercancel',onCancel);
    document.removeEventListener('touchmove',blockScroll);
    if(grDrag){ if(grDrag.ghost) grDrag.ghost.remove(); if(grDrag.el) grDrag.el.classList.remove('gr-dragging'); }
    grClearTargets();
  };
  const onCancel=()=>{ cleanup(); grDrag=null; };
  const onUp=e=>{
    const wasDragging=dragging;
    const dragGid=grDrag&&grDrag.gid;
    const t=wasDragging?grTargetAt(e.clientX,e.clientY):null;
    cleanup(); grDrag=null;
    if(wasDragging){
      if(t) grEsegui(dragGid,resolveTarget(t));
      return;
    }
    if(moved) return; // era uno scroll
    // TAP
    if(gid && !grSelId){ grSelId=gid; grRender(); return; }
    if(grSelId){
      const tgt=cell||head;
      if(tgt) grEsegui(grSelId,resolveTarget(tgt));
      return;
    }
  };
  function resolveTarget(t){
    // intestazione o contenitore sezione -> tratta come "sposta in quella lista"
    if(t.classList.contains('gr-sec')||t.dataset.sechead) return {dataset:{lista:t.dataset.lista}};
    return t;
  }

  document.addEventListener('pointermove',onMove);
  document.addEventListener('pointerup',onUp);
  document.addEventListener('pointercancel',onCancel);
  document.addEventListener('touchmove',blockScroll,{passive:false});
}

// ---------- Pulsante "GESTIONE ROSE" visibile solo all'admin ----------
// Segue la visibilità del pulsante ADMIN nell'header (che il login mostra solo all'admin).
(function grSincronizzaPulsante(){
  function sync(){
    const h=document.getElementById('admin-btn-header');
    const b=document.getElementById('btn-gestione-rose');
    if(!h||!b) return;
    b.style.display=(getComputedStyle(h).display==='none')?'none':'inline-block';
  }
  function avvia(){
    sync();
    const h=document.getElementById('admin-btn-header');
    if(h) new MutationObserver(sync).observe(h,{attributes:true,attributeFilter:['style','class']});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',avvia); else avvia();
})();
