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
      <div class="tifosi-card-footer"><span>👤 ${sq.owner_name||'—'}</span><span style="color:var(--verde)">80€/tifoso</span></div>
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
