// ===== MUSEO =====
function renderMuseo(){
  document.getElementById('museo-grid').innerHTML=squadreDB.map(sq=>{
    const trofei=sq.trofei||[];
    const perComp={};
    trofei.forEach(t=>{if(!perComp[t.compId])perComp[t.compId]=[];perComp[t.compId].push(t);});
    const rendita=Object.entries(perComp).reduce((tot,[cid,arr])=>{
      const comp=competizioni.find(c=>c.id===cid);
      if(!comp||!comp.museo) return tot;
      // Somma fm per ogni trofeo (può avere fm diverso per posizione)
      const fmTot=arr.reduce((s,t)=>s+(t.fmMuseo||comp.museo.fm),0);
      return tot+fmTot*getMolt(arr.length);
    },0);
    const logoHtml=sq.logo_url?`<img src="${sq.logo_url}">`:(sq.avatar||'⚽');
    return `<div class="museo-card" onclick="apriMuseoSquadra('${sq.id}')">
      <div class="museo-card-header">
        <div class="museo-avatar" style="background:${sq.avatar_bg||'#333'}">${logoHtml}</div>
        <div class="museo-sq-nome">${sq.nome}</div>
        <div class="museo-trofei-count">🏆 ${trofei.length}</div>
      </div>
      <div class="museo-card-body">
        ${trofei.length===0?'<div style="color:var(--testo-dim);font-size:12px">Nessun trofeo ancora</div>':`<div class="trofei-list">${trofei.map(t=>`<span class="trofeo-badge">🏆 ${t.coppa} ${t.anno}</span>`).join('')}</div>`}
        <div class="museo-rendita"><span class="museo-rendita-label">Rendita annua</span><span class="museo-rendita-val">${rendita.toFixed(1)}M</span></div>
      </div>
    </div>`;
  }).join('');
}

function apriMuseoSquadra(sqId){
  const sq=squadreDB.find(s=>s.id===sqId);
  const trofei=sq.trofei||[];
  const perComp={};
  trofei.forEach(t=>{if(!perComp[t.compId])perComp[t.compId]=[];perComp[t.compId].push(t);});
  const rendita=Object.entries(perComp).reduce((tot,[cid,arr])=>{
    const comp=competizioni.find(c=>c.id===cid);
    if(!comp||!comp.museo) return tot;
    const fmTot=arr.reduce((s,t)=>s+(t.fmMuseo||comp.museo.fm),0);
    return tot+fmTot*getMolt(arr.length);
  },0);
  document.getElementById('mm-title').textContent=sq.nome+' — MUSEO';
  document.getElementById('mm-body').innerHTML=`
    <div style="padding:14px 20px;background:var(--grigio-scuro);border-bottom:1px solid var(--grigio-chiaro);display:flex;gap:20px;">
      <div><div style="font-size:10px;color:var(--testo-dim)">TROFEI</div><div style="font-family:'Space Mono',monospace;font-size:22px;font-weight:700;color:var(--oro)">${trofei.length}</div></div>
      <div><div style="font-size:10px;color:var(--testo-dim)">RENDITA</div><div style="font-family:'Space Mono',monospace;font-size:18px;font-weight:700;color:var(--verde)">${rendita.toFixed(1)}M FM</div></div>
    </div>
    ${adminLoggato?`<div style="padding:8px 16px 0"><button onclick="apriModificaTrofei('${sqId}')" class="btn-primary" style="width:100%">✏️ MODIFICA TROFEI</button></div>`:''}
    <div style="padding:16px 20px">
      ${trofei.length===0?'<div style="color:var(--testo-dim);font-size:14px;text-align:center;padding:20px 0">Nessun trofeo ancora 🏆</div>':
        Object.entries(perComp).map(([cid,arr])=>{
          const comp=competizioni.find(c=>c.id===cid);
          const molt=getMolt(arr.length);
          const rendC=comp&&comp.museo?comp.museo.fm*molt:0;
          return `<div style="background:var(--grigio-scuro);border-radius:10px;padding:14px;margin-bottom:10px;border-left:3px solid var(--oro)">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <div style="font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--oro)">${comp?comp.icon:''} ${comp?comp.nome:cid}</div>
              <span style="font-family:'Space Mono',monospace;font-size:11px;color:var(--verde)">${rendC.toFixed(1)}M/anno</span>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">${arr.map(t=>`<span class="trofeo-badge">🏆 ${t.posLabel?t.posLabel+' ':''} ${t.anno}</span>`).join('')}</div>
            <div style="font-size:11px;color:var(--testo-dim)">${arr.length} vittorie • ×${molt}</div>
          </div>`;
        }).join('')}
    </div>`;
  // Pulsante modifica trofei per admin — iniettato nel mm-body
  document.getElementById('modal-museo').classList.add('open');
}

// ===== MODIFICA TROFEI (solo admin) =====
function apriModificaTrofei(sqId){
  const sq=squadreDB.find(s=>s.id===sqId);
  if(!sq) return;
  let m=document.getElementById('modal-modifica-trofei');
  if(!m){
    m=document.createElement('div');
    m.id='modal-modifica-trofei';
    m.className='modal-overlay';
    m.innerHTML=`<div class="modal-content" style="max-width:480px">
      <div class="modal-header">
        <h2 class="modal-title">🏆 MODIFICA TROFEI</h2>
        <button class="modal-close" onclick="document.getElementById('modal-modifica-trofei').classList.remove('open')">✕</button>
      </div>
      <div class="modal-body" id="modifica-trofei-body"></div>
    </div>`;
    document.body.appendChild(m);
  }

  const trofei=sq.trofei||[];
  document.getElementById('modifica-trofei-body').innerHTML=`
    <div style="margin-bottom:16px">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:14px;color:var(--testo-dim);margin-bottom:8px">TROFEI ATTUALI</div>
      <div id="lista-trofei-edit" style="display:flex;flex-wrap:wrap;gap:6px;min-height:32px;margin-bottom:12px">
        ${trofei.map((t,i)=>`<span style="background:rgba(255,215,0,0.15);border:1px solid rgba(255,215,0,0.3);color:var(--oro);padding:4px 10px;border-radius:20px;font-size:12px;display:flex;align-items:center;gap:6px">
          🏆 ${t.coppa} ${t.anno}
          <span onclick="rimuoviTrofeo('${sqId}',${i})" style="cursor:pointer;color:var(--rosso);font-weight:700">✕</span>
        </span>`).join('')||'<span style="color:var(--testo-dim);font-size:12px">Nessun trofeo</span>'}
      </div>
    </div>
    <div style="border-top:1px solid var(--grigio-chiaro);padding-top:16px">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:14px;color:var(--testo-dim);margin-bottom:10px">AGGIUNGI TROFEO</div>
      <div class="form-group">
        <label class="form-label">Competizione</label>
        <select class="form-select" id="trofeo-comp" onchange="aggiornaPosizioni()">
          ${(competizioni||[]).filter(c=>c.museo).map(c=>`<option value="${c.id}">${c.icon||'🏆'} ${c.nome}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" id="campo-posizione">
        <label class="form-label">Posizione</label>
        <select class="form-select" id="trofeo-posto">
          <option value="1">🥇 1° posto</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Anno</label>
        <input class="form-input" type="text" id="trofeo-anno" placeholder="Es. 2026/27">
      </div>
      <button onclick="aggiungiTrofeo('${sqId}')" class="btn-primary" style="width:100%">➕ AGGIUNGI TROFEO</button>
    </div>
  `;
  m.classList.add('open');
}

function aggiornaPosizioni(){
  const compId=document.getElementById('trofeo-comp')?.value;
  const comp=(competizioni||[]).find(c=>c.id===compId);
  const sel=document.getElementById('trofeo-posto');
  const campo=document.getElementById('campo-posizione');
  if(!sel||!comp) return;
  // Campionato ha posti multipli, altri hanno solo vincitore
  if(compId==='campionato'){
    campo.style.display='block';
    sel.innerHTML=`
      <option value="1">🥇 1° posto (2.5M)</option>
      <option value="2">🥈 2° posto (0.8M)</option>
      <option value="3">🥉 3° posto (0.3M)</option>`;
  } else {
    campo.style.display='none';
    sel.innerHTML='<option value="1">🏆 Vincitore</option>';
  }
}

async function aggiungiTrofeo(sqId){
  const sq=squadreDB.find(s=>s.id===sqId);
  if(!sq) return;
  const compId=document.getElementById('trofeo-comp').value;
  const anno=document.getElementById('trofeo-anno').value.trim();
  if(!anno){showToast('❌ Inserisci anno','error');return;}
  const comp=competizioni.find(c=>c.id===compId);
  const posto=parseInt(document.getElementById('trofeo-posto')?.value)||1;
  // FM diverso per posizione nel campionato
  let fmMuseo=comp&&comp.museo?comp.museo.fm:0;
  if(compId==='campionato'){
    if(posto===1) fmMuseo=2.5;
    else if(posto===2) fmMuseo=0.8;
    else if(posto===3) fmMuseo=0.3;
  }
  const posLabel=compId==='campionato'?['','1°','2°','3°'][posto]||'1°':'Vincitore';
  const trofei=[...(sq.trofei||[]),{compId,coppa:comp?comp.nome:compId,anno,posto,posLabel,fmMuseo}];
  const{error}=await sb.from('squadre').update({trofei}).eq('id',sqId);
  if(error){showToast('❌ Errore: '+error.message,'error');return;}
  const idx=squadreDB.findIndex(s=>s.id===sqId);
  if(idx>=0) squadreDB[idx].trofei=trofei;
  showToast('🏆 Trofeo aggiunto!');
  apriModificaTrofei(sqId);
  renderMuseo();
}

async function rimuoviTrofeo(sqId,idx){
  const sq=squadreDB.find(s=>s.id===sqId);
  if(!sq) return;
  const trofei=[...(sq.trofei||[])];
  trofei.splice(idx,1);
  const{error}=await sb.from('squadre').update({trofei}).eq('id',sqId);
  if(error){showToast('❌ Errore: '+error.message,'error');return;}
  const sIdx=squadreDB.findIndex(s=>s.id===sqId);
  if(sIdx>=0) squadreDB[sIdx].trofei=trofei;
  showToast('🗑️ Trofeo rimosso');
  apriModificaTrofei(sqId);
  renderMuseo();
}
