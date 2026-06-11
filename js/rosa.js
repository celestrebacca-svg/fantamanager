// ===== ROSA =====
function renderRosa(tipo){
  tabAttivoSq=tipo;
  const ordineRuolo={P:0,D:1,C:2,A:3};
  const nomeRuolo={P:'PORTIERI',D:'DIFENSORI',C:'CENTROCAMPISTI',A:'ATTACCANTI'};
  const lista=giocatoriDB.filter(g=>g.squadra_id===squadraAttiva.id&&g.lista===tipo)
    .sort((a,b)=>(ordineRuolo[a.ruolo]??9)-(ordineRuolo[b.ruolo]??9)||a.nome.localeCompare(b.nome));
  const c=document.getElementById('rosa-lista');
  if(!lista.length){c.innerHTML='<div class="empty">Nessun giocatore</div>';return;}
  const isMia=utenteLoggato&&squadraAttiva.id===utenteLoggato.id;
  const isAvversaria=utenteLoggato&&squadraAttiva.id!==utenteLoggato.id;
  let html='';
  let ruoloCorrente=null;
  lista.forEach(g=>{
    if(g.ruolo!==ruoloCorrente){
      ruoloCorrente=g.ruolo;
      html+=`<div class="ruolo-header">${nomeRuolo[g.ruolo]||g.ruolo}</div>`;
    }
    const clickFn=isAvversaria?`apriGiocatoreConTrattativa(${g.id})`:`apriGiocatore(${g.id})`;
    html+=`<div class="giocatore-card${isAvversaria?' avversario':''}" onclick="${clickFn}">
      <div class="gc-avatar">${g.foto_url?`<img src="${g.foto_url}">`:iniziali(g.nome)}</div>
      <div class="gc-info">
        <div class="gc-nome">${g.nome}</div>
        <div class="gc-sub">
          <span class="g-ruolo ${ruoloColor(g.ruolo)}">${g.ruolo}</span>
          <span class="gc-maglia">#${g.maglia||'—'}</span>
          ${g.badge==='C'?'<span class="g-badge badge-c">C</span>':''}
          ${g.badge==='V'?'<span class="g-badge badge-v">V</span>':''}
          ${g.badge==='P'?'<span class="g-badge badge-p">P</span>':''}
          ${g.promosso?'<span class="g-badge badge-prom">PROM</span>':''}
        </div>
      </div>
    </div>`;
  });
  c.innerHTML=html;
}

function switchTabSq(tipo,el){
  document.querySelectorAll('.rosa-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  renderRosa(tipo);
}
