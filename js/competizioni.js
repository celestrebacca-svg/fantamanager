// ===== COMPETIZIONI =====
function renderCompetizioni(){
  document.getElementById('comp-grid').innerHTML=competizioni.map(c=>`
    <div class="comp-card">
      <div class="comp-header"><div class="comp-icon">${c.icon}</div><div class="comp-nome">${c.nome}</div><span class="comp-tipo tipo-${c.tipo}">${c.tipo}</span></div>
      <div class="comp-body">
        ${c.premi.map(p=>`
          <div class="comp-premio-row">
            <span class="comp-premio-label">${p.pos}</span>
            <div style="display:flex;gap:8px">
              ${p.euro?`<span class="comp-premio-val euro">💶 ${p.euro}</span>`:''}
              ${p.fm?`<span class="comp-premio-val">💰 ${p.fm}</span>`:''}
              ${!p.euro&&!p.fm?'<span style="color:var(--testo-dim);font-size:11px">Da definire</span>':''}
            </div>
          </div>`).join('')}
        ${c.museo?`<div class="comp-museo"><span class="comp-museo-label">🏛️ Museo</span><span class="comp-museo-val">${c.museo.label}</span></div>`:''}
      </div>
    </div>`).join('');
}
