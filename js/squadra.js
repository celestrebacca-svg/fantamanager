// ===== PAGINA SQUADRA =====
function apriSquadra(id){
  squadraAttiva=squadreDB.find(s=>s.id===id);
  tabAttivoSq='principale';
  document.getElementById('lista-squadre').style.display='none';
  document.getElementById('pagina-squadra').style.display='block';
  const sq=squadraAttiva;
  const presidenti=sq.presidenti||[];
  const gTot=giocatoriDB.filter(g=>g.squadra_id===id);
  const logoHtml=sq.logo_url?`<img src="${sq.logo_url}" style="width:140px;height:140px;object-fit:contain">`:`<span style="font-family:'Bebas Neue',sans-serif;font-size:60px;color:var(--testo)">${sq.avatar||'⚽'}</span>`;
  const nomeDisplay=sq.nome_squadra||sq.nome;
  document.getElementById('sq-hero').innerHTML=`
    <div class="squadra-hero-banner" style="background:#000;min-height:180px;display:flex;align-items:center;justify-content:center">
      <div style="display:flex;align-items:center;justify-content:center;gap:24px;padding:24px">
        <div onclick="zoomImmagine('${sq.logo_url||''}')" style="width:150px;height:150px;background:#111;border-radius:20px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.15);overflow:hidden;flex-shrink:0;cursor:${sq.logo_url?'zoom-in':'default'}">${logoHtml}</div>
        ${sq.maglia_url?`<div onclick="zoomImmagine('${sq.maglia_url}')" style="width:120px;height:150px;background:#111;border-radius:20px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.15);overflow:hidden;flex-shrink:0;cursor:zoom-in"><img src="${sq.maglia_url}" style="width:110px;height:140px;object-fit:contain"></div>`:''}
      </div>
    </div>
    <div class="squadra-hero-body">
      <div class="squadra-hero-nome">${nomeDisplay}</div>
      <div class="squadra-hero-all">⚽ All.: <span>${sq.allenatore||'—'}</span> &nbsp;|&nbsp; Stipendio: <span>${sq.stip_all||'—'}</span></div>
      <div class="presidenti-title">👑 PRESIDENZA</div>
      <div class="presidenti-row">${presidenti.length?presidenti.map(p=>`
        <div class="presidente-card">
          <div class="presidente-foto">${p.foto?`<img src="${p.foto}">`:(p.nome||'P').charAt(0).toUpperCase()}</div>
          <div><div class="presidente-nome">${p.nome||'—'}</div><div class="presidente-ruolo">👑 Presidente</div></div>
        </div>`).join(''):'<div style="color:var(--testo-dim);font-size:13px">—</div>'}
      </div>
    </div>
    <div class="squadra-stats-bar">
      <div class="squadra-stat-item"><div class="squadra-stat-label">Budget</div><div class="squadra-stat-val" style="color:var(--verde);font-size:10px">${fmtBudget(sq.budget)}</div></div>
      <div class="squadra-stat-item"><div class="squadra-stat-label">Tifosi</div><div class="squadra-stat-val" style="color:var(--blu)">${(sq.tifosi||0).toLocaleString('it-IT')}</div></div>
      <div class="squadra-stat-item"><div class="squadra-stat-label">Giocatori</div><div class="squadra-stat-val">${gTot.length}</div></div>
      <div class="squadra-stat-item"><div class="squadra-stat-label">Trofei</div><div class="squadra-stat-val" style="color:var(--oro)">${(sq.trofei||[]).length}</div></div>
    </div>`;
  const princ=giocatoriDB.filter(g=>g.squadra_id===id&&g.lista==='principale');
  const marg=giocatoriDB.filter(g=>g.squadra_id===id&&g.lista==='marginale');
  const prim=giocatoriDB.filter(g=>g.squadra_id===id&&g.lista==='primavera');
  document.getElementById('cnt-princ').textContent=princ.length;
  document.getElementById('cnt-marg').textContent=marg.length;
  document.getElementById('cnt-prim').textContent=prim.length;
  document.querySelectorAll('.rosa-tab').forEach(t=>t.classList.remove('active'));
  document.querySelector('.rosa-tab').classList.add('active');
  renderRosa('principale');

  // Formazione — visibile a tutti
  const formazioneDiv=document.getElementById('formazione-squadra-inline');
  const editBtnWrap=document.getElementById('formazione-edit-btn-wrap');
  if(formazioneDiv){
    formazioneDiv.style.display='block';
    const puoModificare=(utenteLoggato&&utenteLoggato.id===id)||adminLoggato;
    if(editBtnWrap) editBtnWrap.style.display=puoModificare?'block':'none';
    renderFormazione(id, false);
  }

  // Bilancio: tutti lo vedono, ma lo storico solo al proprietario/admin
  const bilancioDiv=document.getElementById('bilancio-squadra-inline');
  if(bilancioDiv){
    bilancioDiv.style.display='block';
    bilancioSquadraAttiva=id;
    const isProprietario=(utenteLoggato&&utenteLoggato.id===id)||adminLoggato;
    renderBilancioSquadra(id, isProprietario);
  }

  window.scrollTo(0,0);
}

function tornaLista(){
  squadraAttiva=null;
  document.getElementById('lista-squadre').style.display='block';
  document.getElementById('pagina-squadra').style.display='none';
}
