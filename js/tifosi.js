// ===== TIFOSI =====
function renderTifosi(){
  const sorted=[...squadreDB].sort((a,b)=>(b.tifosi||0)-(a.tifosi||0));
  const max=Math.max(...sorted.map(s=>s.tifosi||0))||1;
  document.getElementById('tifosi-grid').innerHTML=sorted.map((sq,i)=>{
    const rc=['rank-1','rank-2','rank-3'][i]||'rank-other';
    const pct=Math.round(((sq.tifosi||0)/max)*100)||2;
    const log=tifosi_logDB.filter(l=>l.squadra_id===sq.id);
    const ultimo=log[0];
    const logoHtml=sq.logo_url?`<img src="${sq.logo_url}" style="width:26px;height:26px;object-fit:contain;border-radius:4px">`:`<span style="font-family:'Bebas Neue',sans-serif;font-size:11px;color:var(--nero)">${sq.avatar||'⚽'}</span>`;
    return `<div class="tifosi-card" onclick="apriStoricoTifosi('${sq.id}')">
      <div class="tifosi-card-header">
        <div class="tifosi-rank ${rc}">${i+1}</div>
        <div style="width:26px;height:26px;border-radius:6px;background:${sq.avatar_bg||'#333'};display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">${logoHtml}</div>
        <div class="tifosi-sq-nome">${sq.nome}</div>
        <div class="tifosi-numero">${(sq.tifosi||0).toLocaleString('it-IT')}</div>
      </div>
      <div class="tifosi-card-body">
        <div class="tifosi-bar-wrap"><div class="tifosi-bar" style="width:${pct}%"></div></div>
        <div class="tifosi-last">Ultimo: <span>${ultimo?ultimo.motivo:'—'}</span></div>
      </div>
      <div class="tifosi-card-footer"><span>👤 ${sq.owner_name||'—'}</span><span style="color:var(--verde)">80€/tifoso</span>${adminLoggato?`<button onclick="event.stopPropagation();apriModificaTifosi('${sq.id}')" style="background:rgba(255,215,0,0.15);border:1px solid rgba(255,215,0,0.4);color:var(--oro);font-size:11px;padding:3px 8px;border-radius:6px;cursor:pointer">✏️</button>`:''}</div>
    </div>`;
  }).join('');
}

function apriStoricoTifosi(sqId){
  const sq=squadreDB.find(s=>s.id===sqId);
  document.getElementById('mt-title').textContent=sq.nome+' — TIFOSI';
  const log=tifosi_logDB.filter(l=>l.squadra_id===sqId);
  document.getElementById('mt-body').innerHTML=`
    <div style="padding:14px 20px;background:var(--grigio-scuro);border-bottom:1px solid var(--grigio-chiaro);display:flex;gap:20px;flex-wrap:wrap;">
      <div><div style="font-size:10px;color:var(--testo-dim)">TIFOSI</div><div style="font-family:'Space Mono',monospace;font-size:20px;font-weight:700;color:var(--blu)">${(sq.tifosi||0).toLocaleString('it-IT')}</div></div>
      <div><div style="font-size:10px;color:var(--testo-dim)">INCASSO MAX/PARTITA</div><div style="font-family:'Space Mono',monospace;font-size:16px;font-weight:700;color:var(--verde)">${((sq.tifosi||0)*80).toLocaleString('it-IT')}€</div></div>
    </div>
    ${log.length===0?'<div class="empty">Nessun movimento</div>':log.map(l=>`
      <div class="log-item">
        <div class="log-icon ${l.positivo?'pos':'neg'}">${l.positivo?'📈':'📉'}</div>
        <div class="log-info"><div class="log-motivo">${l.motivo}</div><div class="log-data">📅 ${new Date(l.data_log||l.created_at).toLocaleDateString('it-IT')}</div></div>
        <div class="log-val ${l.positivo?'pos':'neg'}">${l.positivo?'+':''}${l.valore}</div>
      </div>`).join('')}`;
  document.getElementById('modal-tifosi').classList.add('open');
}

// ===== MODIFICA TIFOSI (solo admin) =====
function apriModificaTifosi(sqId){
  let m=document.getElementById('modal-modifica-tifosi-sq');
  if(!m){
    m=document.createElement('div');
    m.id='modal-modifica-tifosi-sq';
    m.className='modal-overlay';
    m.innerHTML=`<div class="modal-content" style="max-width:380px">
      <div class="modal-header">
        <h2 class="modal-title">👥 MODIFICA TIFOSI</h2>
        <button class="modal-close" onclick="document.getElementById('modal-modifica-tifosi-sq').classList.remove('open')">✕</button>
      </div>
      <div class="modal-body" id="modifica-tifosi-sq-body"></div>
    </div>`;
    document.body.appendChild(m);
  }
  const sq=squadreDB.find(s=>s.id===sqId);
  document.getElementById('modifica-tifosi-sq-body').innerHTML=`
    <div class="form-group">
      <label class="form-label">Squadra</label>
      <div style="font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--oro)">${sq.nome}</div>
    </div>
    <div class="form-group">
      <label class="form-label">Tifosi attuali</label>
      <div style="font-family:'Space Mono',monospace;font-size:20px;color:var(--blu)">${(sq.tifosi||0).toLocaleString('it-IT')}</div>
    </div>
    <div class="form-group">
      <label class="form-label">Tipo modifica</label>
      <select class="form-select" id="mod-tifosi-tipo">
        <option value="aggiungi">➕ Aggiungi tifosi</option>
        <option value="rimuovi">➖ Rimuovi tifosi</option>
        <option value="imposta">🎯 Imposta valore esatto</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Quantità</label>
      <input class="form-input" type="number" id="mod-tifosi-valore" placeholder="Es. 1000" min="0">
    </div>
    <div class="form-group">
      <label class="form-label">Motivo (per storico)</label>
      <input class="form-input" type="text" id="mod-tifosi-motivo" placeholder="Es. Premio campionato, Sponsor...">
    </div>
    <button onclick="salvaTifosi('${sqId}')" class="btn-primary" style="width:100%;margin-top:8px">💾 SALVA</button>
  `;
  m.classList.add('open');
}

async function salvaTifosi(sqId){
  const sq=squadreDB.find(s=>s.id===sqId);
  const tipo=document.getElementById('mod-tifosi-tipo').value;
  const valore=parseInt(document.getElementById('mod-tifosi-valore').value)||0;
  const motivo=document.getElementById('mod-tifosi-motivo').value.trim()||'Modifica admin';
  if(valore<=0){showToast('❌ Inserisci un valore valido','error');return;}

  const tifosiAttuali=sq.tifosi||0;
  let nuoviTifosi=tifosiAttuali;
  let delta=0;
  let positivo=true;

  if(tipo==='aggiungi'){nuoviTifosi=tifosiAttuali+valore;delta=valore;positivo=true;}
  else if(tipo==='rimuovi'){nuoviTifosi=Math.max(0,tifosiAttuali-valore);delta=-valore;positivo=false;}
  else if(tipo==='imposta'){delta=valore-tifosiAttuali;positivo=delta>=0;nuoviTifosi=valore;}

  try{
    const{error}=await sb.from('squadre').update({tifosi:nuoviTifosi}).eq('id',sqId);
    if(error) throw error;
    // Log nel tifosi_log
    await sb.from('tifosi_log').insert({
      squadra_id:sqId,
      valore:delta,
      motivo,
      positivo,
      data_log:new Date().toISOString()
    });
    // Aggiorna DB locale
    const idx=squadreDB.findIndex(s=>s.id===sqId);
    if(idx>=0) squadreDB[idx].tifosi=nuoviTifosi;
    // Aggiorna log locale
    tifosi_logDB.unshift({squadra_id:sqId,valore:delta,motivo,positivo,data_log:new Date().toISOString(),created_at:new Date().toISOString()});
    document.getElementById('modal-modifica-tifosi-sq').classList.remove('open');
    showToast(`✅ Tifosi aggiornati: ${nuoviTifosi.toLocaleString('it-IT')}`);
    renderTifosi();
  }catch(e){showToast('❌ Errore: '+e.message,'error');}
}
