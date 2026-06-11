// ===== SCHEDA GIOCATORE =====
let giocatoreModificaDaScheda=null;
function apriModificaDaScheda(){
  if(!giocatoreSchedaAttiva) return;
  document.getElementById('modal-giocatore').classList.remove('open');
  apriModificaGiocatore();
  setTimeout(()=>selezionaGiocatoreAdmin(giocatoreSchedaAttiva.id),150);
}

function apriTrattativaDaScheda(){
  if(!giocatoreSchedaAttiva) return;
  document.getElementById('modal-giocatore').classList.remove('open');
  apriNuovaTrattativa(giocatoreSchedaAttiva);
}

function apriGiocatoreConTrattativa(gId){
  apriGiocatore(gId);
  // mostra bottone trattativa dopo che il modal è aperto
  setTimeout(()=>{
    const btn=document.getElementById('mg-trattativa-btn');
    if(btn) btn.style.display='block';
  },50);
}

function apriGiocatore(gId){
  const g=giocatoriDB.find(x=>x.id===gId);
  if(!g) return;
  giocatoreSchedaAttiva=g;
  const sq=squadreDB.find(s=>s.id===g.squadra_id);
  document.getElementById('mg-title').textContent=g.nome.toUpperCase();
  // Bottone modifica: visibile SOLO se admin
  const editBtn=document.getElementById('mg-edit-btn');
  if(editBtn) editBtn.style.display=adminLoggato?'block':'none';
  // Bottone trattativa: nascosto di default, apriGiocatoreConTrattativa lo mostra
  const tratBtn=document.getElementById('mg-trattativa-btn');
  if(tratBtn) tratBtn.style.display='none';
  const coloreC={'Titolo Definitivo':'var(--verde)','Titolo Definitivo con Clausola Recompra':'var(--argento)','Prestito Secco':'var(--blu)','Prestito con Diritto di Riscatto':'var(--oro)','Prestito con Obbligo di Riscatto':'var(--rosso)'}[g.contratto]||'var(--verde)';
  document.getElementById('mg-body').innerHTML=`
    <div class="player-hero">
      <div class="player-photo">${g.foto_url?`<img src="${g.foto_url}">`:iniziali(g.nome)}</div>
      <div>
        <div class="player-nome">${g.nome}</div>
        <div class="player-tags">
          <span class="g-ruolo ${ruoloColor(g.ruolo)}" style="font-size:12px;padding:3px 8px">${ruoloNome(g.ruolo)}</span>
          ${g.badge==='C'?'<span class="g-badge badge-c">CAPITANO</span>':''}
          ${g.badge==='V'?'<span class="g-badge badge-v">VICE CAP.</span>':''}
          ${g.badge==='P'?'<span class="g-badge badge-p">IN PRESTITO</span>':''}
          ${g.promosso?'<span class="g-badge badge-prom">PROMOSSO</span>':''}
        </div>
        <div style="font-family:'Space Mono',monospace;font-size:11px;color:var(--testo-dim)">Maglia #<span style="color:var(--verde);font-weight:700;font-size:14px">${g.maglia||'—'}</span></div>
      </div>
    </div>
    <div class="player-section">
      <div class="player-section-title">📋 Anagrafica</div>
      <div class="player-grid">
        <div class="player-info-item"><div class="pii-label">Età</div><div class="pii-val">${g.eta?g.eta+' anni':'—'}</div></div>
        <div class="player-info-item"><div class="pii-label">Data Nascita</div><div class="pii-val" style="font-size:11px">${g.data_nascita||'—'}</div></div>
        <div class="player-info-item"><div class="pii-label">Squadra Fantasy</div><div class="pii-val" style="font-size:11px">${sq?sq.nome:'—'}</div></div>
        <div class="player-info-item"><div class="pii-label">Club Attuale</div><div class="pii-val" style="font-size:11px;color:var(--blu)">${g.club_reale||'—'}</div></div>
      </div>
    </div>
    <div class="player-section">
      <div class="player-section-title">💰 Valori di Mercato</div>
      <div class="player-grid">
        <div class="player-info-item" style="border-left:3px solid var(--oro)"><div class="pii-label">Quotazione TM</div><div class="pii-val oro" style="font-size:20px;font-weight:700">${g.quotazione?g.quotazione+'M€':'—'}</div></div>
        <div class="player-info-item" style="border-left:3px solid var(--verde)"><div class="pii-label">Stipendio Netto</div><div class="pii-val verde" style="font-size:20px;font-weight:700">${g.stipendio?g.stipendio+'M€':'—'}</div></div>
      </div>
    </div>
    <div class="player-section">
      <div class="player-section-title">📄 Contratto</div>
      <div class="contratto-box" style="border-left-color:${coloreC}">
        <div class="contratto-tipo" style="color:${coloreC}">${g.contratto||'—'}</div>
        ${g.scadenza?`<div class="contratto-row"><span class="label">Scadenza</span><span class="val" style="color:var(--rosso)">${g.scadenza}</span></div>`:''}
        ${g.squadra_propr?`<div class="contratto-row"><span class="label">Proprietario</span><span class="val">${g.squadra_propr}</span></div>`:''}
        ${g.riscatto?`<div class="contratto-row"><span class="label">Riscatto</span><span class="val" style="color:var(--oro)">${fmtNum(g.riscatto)} FM</span></div>`:''}
        ${g.clausola?`<div class="contratto-row"><span class="label">Clausola recompra</span><span class="val" style="color:var(--argento)">${fmtNum(g.clausola)} FM</span></div>`:''}
        ${g.rivendita?`<div class="contratto-row"><span class="label">% Futura rivendita</span><span class="val" style="color:var(--verde)">${g.rivendita}%</span></div>`:''}
      </div>
    </div>
    <div class="player-section" style="border-bottom:none">
      <div class="player-section-title">⚽ Statistiche</div>
      <div class="stats-row">
        <div class="stat-box"><div class="stat-box-val">${g.gol||0}</div><div class="stat-box-label">Gol</div></div>
        <div class="stat-box"><div class="stat-box-val">${g.assist||0}</div><div class="stat-box-label">Assist</div></div>
        <div class="stat-box"><div class="stat-box-val">${g.mv||'—'}</div><div class="stat-box-label">Media V.</div></div>
        <div class="stat-box"><div class="stat-box-val">${g.presenze||0}</div><div class="stat-box-label">Presenze</div></div>
      </div>
    </div>`;
  document.getElementById('modal-giocatore').classList.add('open');
}
