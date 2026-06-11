// ===== MUSEO =====
function renderMuseo(){
  document.getElementById('museo-grid').innerHTML=squadreDB.map(sq=>{
    const trofei=sq.trofei||[];
    const perComp={};
    trofei.forEach(t=>{if(!perComp[t.compId])perComp[t.compId]=[];perComp[t.compId].push(t);});
    const rendita=Object.entries(perComp).reduce((tot,[cid,arr])=>{
      const comp=competizioni.find(c=>c.id===cid);
      return comp&&comp.museo?tot+comp.museo.fm*getMolt(arr.length):tot;
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
    return comp&&comp.museo?tot+comp.museo.fm*getMolt(arr.length):tot;
  },0);
  document.getElementById('mm-title').textContent=sq.nome+' — MUSEO';
  document.getElementById('mm-body').innerHTML=`
    <div style="padding:14px 20px;background:var(--grigio-scuro);border-bottom:1px solid var(--grigio-chiaro);display:flex;gap:20px;">
      <div><div style="font-size:10px;color:var(--testo-dim)">TROFEI</div><div style="font-family:'Space Mono',monospace;font-size:22px;font-weight:700;color:var(--oro)">${trofei.length}</div></div>
      <div><div style="font-size:10px;color:var(--testo-dim)">RENDITA</div><div style="font-family:'Space Mono',monospace;font-size:18px;font-weight:700;color:var(--verde)">${rendita.toFixed(1)}M FM</div></div>
    </div>
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
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">${arr.map(t=>`<span class="trofeo-badge">🏆 ${t.anno}</span>`).join('')}</div>
            <div style="font-size:11px;color:var(--testo-dim)">${arr.length} vittorie • ×${molt}</div>
          </div>`;
        }).join('')}
    </div>`;
  document.getElementById('modal-museo').classList.add('open');
}
