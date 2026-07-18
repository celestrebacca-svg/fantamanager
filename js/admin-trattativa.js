// ===== ADMIN TRATTATIVA DIRETTA =====
// Non è più un form parallelo: l'admin sceglie quale squadra "impersonare"
// e quale giocatore di un'altra squadra trattare, poi si apre l'IDENTICO
// form che usano i partecipanti normalmente (bonus.js: apriNuovaTrattativa),
// con tutte le funzionalità già esistenti (scambio N-per-M, prestito,
// rate, bonus, contro-riscatto, condizioni obbligo...).
// L'unica differenza: quando l'admin preme "Invia", la trattativa viene
// eseguita subito (vedi hook in bonus.js/inviaTrattativa), invece di
// restare in attesa di approvazione.

function apriAdminTrattativa(){
  if(!adminLoggato) return;
  document.getElementById('modal-admin-trattativa').classList.add('open');
  renderAdminTratSelezione();
}

function renderAdminTratSelezione(){
  const body=document.getElementById('admin-trat-body');
  if(!body) return;
  body.innerHTML=`
    <div style="font-size:12px;color:var(--testo-dim);margin-bottom:16px;line-height:1.6">
      Scegli quale squadra propone la trattativa, poi cerca il giocatore di un'altra squadra che vuoi trattare.
      Si aprirà lo stesso identico form usato dai partecipanti (scambio anche con più giocatori per lato, prestito,
      rate, bonus, contro-riscatto...) — l'unica differenza è che qui viene eseguita subito, senza bisogno di approvazione.
    </div>
    <div class="form-group">
      <label class="form-label">⬅️ Squadra Proponente</label>
      <select class="form-select" id="at-sq-proponente" onchange="document.getElementById('at-search-giocatore').value='';document.getElementById('at-lista-giocatore').style.display='none'">
        <option value="">— Seleziona —</option>
        ${squadreDB.map(s=>`<option value="${s.id}">${s.nome_squadra||s.nome}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">⚽ Cerca giocatore da trattare (di un'altra squadra)</label>
      <input class="form-input" type="text" id="at-search-giocatore" placeholder="Scrivi il nome..." oninput="adminTratCercaGiocatore(this.value)">
      <div id="at-lista-giocatore" class="giocatori-search-list" style="display:none"></div>
    </div>`;
}

function adminTratCercaGiocatore(val){
  const lista=document.getElementById('at-lista-giocatore');
  const sqProp=document.getElementById('at-sq-proponente').value;
  if(val.length<2){ lista.style.display='none'; return; }
  if(!sqProp){
    lista.innerHTML='<div style="padding:10px;font-size:12px;color:var(--testo-dim)">Seleziona prima la squadra proponente</div>';
    lista.style.display='block';
    return;
  }
  const risultati=giocatoriDB
    .filter(g=>g.nome.toLowerCase().includes(val.toLowerCase())&&String(g.squadra_id)!==String(sqProp))
    .slice(0,15);
  if(!risultati.length){
    lista.innerHTML='<div style="padding:10px;font-size:12px;color:var(--testo-dim)">Nessun giocatore trovato</div>';
    lista.style.display='block';
    return;
  }
  lista.innerHTML=risultati.map(g=>{
    const sq=squadreDB.find(s=>s.id===g.squadra_id);
    return `<div class="giocatore-search-item" onclick="adminTratAvviaTrattativa(${g.id})">
      <div class="gsi-avatar">${g.foto_url?`<img src="${g.foto_url}">`:iniziali(g.nome)}</div>
      <div class="gsi-info">
        <div class="gsi-nome">${g.nome}</div>
        <div class="gsi-sub">${sq?(sq.nome_squadra||sq.nome):'—'} • ${g.ruolo}</div>
      </div>
    </div>`;
  }).join('');
  lista.style.display='block';
}

function adminTratAvviaTrattativa(gId){
  const sqPropId=document.getElementById('at-sq-proponente').value;
  const sqProp=squadreDB.find(s=>s.id===sqPropId);
  const giocatore=giocatoriDB.find(g=>g.id===gId);
  if(!sqProp||!giocatore){ showToast('❌ Dati mancanti','error'); return; }

  // Impersona la squadra proponente: il form normale legge sempre utenteLoggato
  _utenteLoggatoBackupAdmin=utenteLoggato;
  utenteLoggato=sqProp;
  adminModalitaDirettaTrattativa=true;

  document.getElementById('modal-admin-trattativa').classList.remove('open');
  apriNuovaTrattativa(giocatore);
}
