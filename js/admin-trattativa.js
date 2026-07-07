// ===== ADMIN TRATTATIVA DIRETTA =====
// Permette all'admin di creare e confermare trattative immediatamente
// senza approvazione, per conto di qualsiasi squadra.

let adminTratGiocatoreId = null;
let adminTratGiocatoriScambio = []; // giocatori che sqCedente offre in scambio

function apriAdminTrattativa() {
  if (!adminLoggato) return;
  adminTratGiocatoreId = null;
  adminTratGiocatoriScambio = [];
  document.getElementById('modal-admin-trattativa').classList.add('open');
  renderAdminTratStep1();
}

function renderAdminTratStep1() {
  const body = document.getElementById('admin-trat-body');
  const sqOptions = squadreDB.map(s =>
    `<option value="${s.id}">${s.nome}</option>`
  ).join('');

  body.innerHTML = `
    <div style="font-size:12px;color:var(--testo-dim);margin-bottom:16px">
      Crea una trattativa diretta tra due squadre e confermala immediatamente. Tutto verrà registrato nello storico movimenti.
    </div>

    <!-- SQUADRE -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
      <div class="form-group">
        <label class="form-label">⬅️ Squadra Cedente</label>
        <select class="form-select" id="at-sq-cedente" onchange="adminTratAggiornaCedente()">
          <option value="">— Seleziona —</option>
          ${sqOptions}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">➡️ Squadra Acquirente</label>
        <select class="form-select" id="at-sq-acquirente" onchange="adminTratAggiornaAcquirente()">
          <option value="">— Seleziona —</option>
          ${sqOptions}
        </select>
      </div>
    </div>

    <!-- TIPO OPERAZIONE -->
    <div class="form-group">
      <label class="form-label">📋 Tipo Operazione</label>
      <select class="form-select" id="at-tipo" onchange="adminTratAggiornaCampi()">
        <option value="Titolo Definitivo">💰 Titolo Definitivo</option>
        <option value="Prestito Secco">🔄 Prestito Secco</option>
        <option value="Prestito con Diritto di Riscatto">🔄 Prestito con Diritto di Riscatto</option>
        <option value="Prestito con Obbligo di Riscatto">🔄 Prestito con Obbligo di Riscatto</option>
        <option value="Scambio">🔁 Scambio</option>
        <option value="Scambio con Conguaglio">🔁 Scambio con Conguaglio</option>
      </select>
    </div>

    <!-- GIOCATORE CEDUTO -->
    <div class="form-group">
      <label class="form-label">⚽ Giocatore Ceduto (dalla Cedente)</label>
      <input class="form-input" type="text" id="at-search-giocatore"
        placeholder="Scrivi il nome..." oninput="adminTratCercaGiocatore(this.value)">
      <div id="at-lista-giocatori" class="giocatori-search-list" style="display:none"></div>
      <div id="at-giocatore-selezionato" style="display:none;margin-top:8px;background:var(--grigio-scuro);border-radius:8px;padding:10px;display:flex;align-items:center;gap:10px">
        <div id="at-g-avatar" class="gc-avatar" style="width:36px;height:36px;font-size:11px"></div>
        <div style="flex:1">
          <div id="at-g-nome" style="font-size:13px;font-weight:600"></div>
          <div id="at-g-info" style="font-size:11px;color:var(--testo-dim)"></div>
        </div>
        <button onclick="adminTratDeselezionaGiocatore()" style="background:none;border:none;color:var(--testo-dim);cursor:pointer;font-size:14px">✕</button>
      </div>
    </div>

    <!-- CAMPI DINAMICI -->
    <div id="at-campi-dinamici"></div>

    <!-- PULSANTE CONFERMA -->
    <button id="btn-at-conferma" onclick="adminTratConferma()"
      style="width:100%;background:var(--oro);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:2px;padding:13px;border-radius:10px;border:none;cursor:pointer;margin-top:8px">
      ⚡ CONFERMA TRATTATIVA
    </button>`;

  adminTratAggiornaCampi();
}

function adminTratAggiornaCedente() {
  // Reset giocatore se cambio cedente
  adminTratGiocatoreId = null;
  adminTratGiocatoriScambio = [];
  const el = document.getElementById('at-giocatore-selezionato');
  const search = document.getElementById('at-search-giocatore');
  if (el) el.style.display = 'none';
  if (search) { search.value = ''; search.style.display = 'block'; }
  const lista = document.getElementById('at-lista-giocatori');
  if (lista) { lista.innerHTML = ''; lista.style.display = 'none'; }
  adminTratAggiornaCampi();
}

function adminTratAggiornaAcquirente() {
  adminTratAggiornaCampi();
}

function adminTratCercaGiocatore(val) {
  const lista = document.getElementById('at-lista-giocatori');
  if (val.length < 2) { lista.style.display = 'none'; return; }
  const sqCedId = document.getElementById('at-sq-cedente').value;
  const risultati = giocatoriDB
    .filter(g => g.nome.toLowerCase().includes(val.toLowerCase()) &&
      (!sqCedId || String(g.squadra_id) === String(sqCedId)))
    .slice(0, 15);
  if (!risultati.length) { lista.innerHTML = '<div style="padding:10px;font-size:12px;color:var(--testo-dim)">Nessun giocatore trovato</div>'; lista.style.display = 'block'; return; }
  lista.innerHTML = risultati.map(g => {
    const sq = squadreDB.find(s => s.id === g.squadra_id);
    return `<div class="giocatore-search-item" onclick="adminTratSelezionaGiocatore(${g.id})">
      <div class="gsi-avatar">${g.foto_url ? `<img src="${g.foto_url}">` : iniziali(g.nome)}</div>
      <div class="gsi-info">
        <div class="gsi-nome">${g.nome}</div>
        <div class="gsi-sub">${sq ? sq.nome : '—'} • ${g.ruolo}</div>
      </div>
    </div>`;
  }).join('');
  lista.style.display = 'block';
}

function adminTratSelezionaGiocatore(gId) {
  const g = giocatoriDB.find(x => x.id === gId);
  if (!g) return;
  adminTratGiocatoreId = gId;

  const sq = squadreDB.find(s => s.id === g.squadra_id);
  document.getElementById('at-search-giocatore').style.display = 'none';
  document.getElementById('at-lista-giocatori').style.display = 'none';

  const sel = document.getElementById('at-giocatore-selezionato');
  sel.style.display = 'flex';
  document.getElementById('at-g-avatar').innerHTML = g.foto_url
    ? `<img src="${g.foto_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
    : iniziali(g.nome);
  document.getElementById('at-g-nome').textContent = g.nome;
  document.getElementById('at-g-info').textContent = `${g.ruolo} • ${sq ? sq.nome : '—'} • Quotazione: ${g.quotazione ? g.quotazione + 'M€' : '—'}`;

  adminTratAggiornaCampi();
}

function adminTratDeselezionaGiocatore() {
  adminTratGiocatoreId = null;
  document.getElementById('at-giocatore-selezionato').style.display = 'none';
  const search = document.getElementById('at-search-giocatore');
  search.style.display = 'block';
  search.value = '';
  document.getElementById('at-lista-giocatori').style.display = 'none';
}

function adminTratAggiornaCampi() {
  const tipo = document.getElementById('at-tipo')?.value || 'Titolo Definitivo';
  const isPrestito = tipo.includes('Prestito');
  const isScambio = tipo.includes('Scambio');
  const hasDiritto = tipo.includes('Diritto');
  const hasObbligo = tipo.includes('Obbligo');
  const hasConguaglio = tipo.includes('Conguaglio');
  const sqAcqId = document.getElementById('at-sq-acquirente')?.value || '';

  let html = '';

  // IMPORTO (non per scambio puro)
  if (!isScambio || hasConguaglio) {
    const label = isPrestito ? '💰 Cifra Prestito (FM)' : isScambio ? '💰 Conguaglio (FM)' : '💰 Importo (FM)';
    html += `
      <div class="form-group">
        <label class="form-label">${label}</label>
        <input class="form-input" type="text" id="at-importo" placeholder="Es. 10M, 7.5M, 0">
      </div>`;
  }

  // SCADENZA PRESTITO
  if (isPrestito) {
    html += `
      <div class="form-group">
        <label class="form-label">📅 Scadenza Prestito</label>
        <input class="form-input" type="date" id="at-scadenza-prestito">
      </div>`;
  }

  // IMPORTO RISCATTO
  if (hasDiritto || hasObbligo) {
    html += `
      <div class="form-group">
        <label class="form-label">🔑 Importo Riscatto (FM)</label>
        <input class="form-input" type="text" id="at-importo-riscatto" placeholder="Es. 15M">
      </div>
      <div class="form-group">
        <label class="form-label">⏰ Scadenza Riscatto</label>
        <input class="form-input" type="date" id="at-scadenza-riscatto">
      </div>`;
  }

  // GIOCATORI IN SCAMBIO (dalla squadra acquirente)
  if (isScambio && sqAcqId) {
    const gAcq = giocatoriDB.filter(g => String(g.squadra_id) === String(sqAcqId));
    html += `
      <div class="form-group">
        <label class="form-label">🔁 Giocatori Offerti dall'Acquirente (in scambio)</label>
        <div style="max-height:200px;overflow-y:auto;border:1px solid var(--grigio-chiaro);border-radius:8px">
          ${gAcq.length ? gAcq.map(g => `
            <label style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-bottom:1px solid var(--grigio-chiaro);cursor:pointer;font-size:12px">
              <input type="checkbox" value="${g.id}" onchange="adminTratToggleScambio(${g.id})" style="width:15px;height:15px">
              <div class="gsi-avatar" style="width:28px;height:28px;font-size:9px">${g.foto_url ? `<img src="${g.foto_url}">` : iniziali(g.nome)}</div>
              <div><div style="font-weight:600">${g.nome}</div><div style="color:var(--testo-dim)">${g.ruolo}</div></div>
            </label>`).join('')
            : '<div style="padding:10px;font-size:12px;color:var(--testo-dim)">Nessun giocatore in questa squadra</div>'}
        </div>
      </div>`;
  }

  // % RIVENDITA
  html += `
    <div class="form-group">
      <label class="form-label">% Futura Rivendita (opzionale)</label>
      <input class="form-input" type="number" id="at-rivendita" min="0" max="50" step="0.5" placeholder="Es. 10">
    </div>`;

  // NOTE
  html += `
    <div class="form-group">
      <label class="form-label">📝 Note (opzionale)</label>
      <input class="form-input" type="text" id="at-note" placeholder="Condizioni particolari...">
    </div>`;

  const container = document.getElementById('at-campi-dinamici');
  if (container) container.innerHTML = html;
}

function adminTratToggleScambio(gId) {
  const idx = adminTratGiocatoriScambio.indexOf(gId);
  if (idx >= 0) adminTratGiocatoriScambio.splice(idx, 1);
  else adminTratGiocatoriScambio.push(gId);
}

function adminTratParseFM(val) {
  if (!val) return 0;
  const str = String(val).trim().toUpperCase().replace('M', '');
  const num = parseFloat(str);
  if (isNaN(num) || num < 0) return 0;
  return num <= 1000 ? num * 1000000 : num;
}

async function adminTratConferma() {
  if (!adminLoggato) return;

  const sqCedId = document.getElementById('at-sq-cedente').value;
  const sqAcqId = document.getElementById('at-sq-acquirente').value;
  const tipo = document.getElementById('at-tipo').value;

  if (!sqCedId || !sqAcqId) { showToast('❌ Seleziona entrambe le squadre', 'error'); return; }
  if (sqCedId === sqAcqId) { showToast('❌ Le squadre devono essere diverse', 'error'); return; }
  if (!adminTratGiocatoreId) { showToast('❌ Seleziona il giocatore ceduto', 'error'); return; }

  const importoEl = document.getElementById('at-importo');
  const importo = importoEl ? adminTratParseFM(importoEl.value) : 0;
  const importoRiscattoEl = document.getElementById('at-importo-riscatto');
  const importoRiscatto = importoRiscattoEl ? adminTratParseFM(importoRiscattoEl.value) : 0;
  const scadenzaPrestitoEl = document.getElementById('at-scadenza-prestito');
  const scadenzaRiscattoEl = document.getElementById('at-scadenza-riscatto');
  const rivenditaEl = document.getElementById('at-rivendita');
  const noteEl = document.getElementById('at-note');

  const sqCed = squadreDB.find(s => s.id === sqCedId);
  const sqAcq = squadreDB.find(s => s.id === sqAcqId);
  const g = giocatoriDB.find(x => x.id === adminTratGiocatoreId);

  const importoStr = importo > 0 ? ` • ${fmtBudget(importo)}` : '';
  const scambioStr = adminTratGiocatoriScambio.length > 0
    ? ` + ${adminTratGiocatoriScambio.length} giocatore/i in scambio` : '';

  if (!confirm(`⚡ CONFERMA TRATTATIVA\n\n${tipo}\n${sqCed.nome} → ${sqAcq.nome}\nGiocatore: ${g.nome}${importoStr}${scambioStr}\n\nL'operazione verrà eseguita immediatamente. Confermi?`)) return;

  const btn = document.getElementById('btn-at-conferma');
  btn.disabled = true; btn.textContent = 'Elaborazione...';

  try {
    // 1. Inserisci trattativa nel DB con stato=approvata
    const nuovaTrattativa = {
      squadra_offerente_id: sqAcqId,   // chi acquista = offerente
      squadra_ricevente_id: sqCedId,   // chi cede = ricevente
      squadra_cedente_id: sqCedId,
      squadra_acquirente_id: sqAcqId,
      giocatore_id: adminTratGiocatoreId,
      tipo,
      importo: importo || null,
      importo_riscatto: importoRiscatto || null,
      scadenza_prestito: scadenzaPrestitoEl?.value || null,
      scadenza_riscatto: scadenzaRiscattoEl?.value || null,
      percentuale_rivendita: rivenditaEl?.value ? parseFloat(rivenditaEl.value) : null,
      giocatori_cambio_ids: adminTratGiocatoriScambio.length ? adminTratGiocatoriScambio : null,
      note: noteEl?.value?.trim() || null,
      stato: 'approvata',
      approvata_da: 'admin',
      approvata_at: new Date().toISOString(),
    };

    const { data: tData, error: tErr } = await sb.from('trattative').insert(nuovaTrattativa).select().single();
    if (tErr) throw tErr;
    trattativeDB.push(tData);

    // 2-4. Sposta giocatore/i, aggiorna contratto/badge/riscatto e budget:
    // usa SEMPRE eseguiTrasferimento() di mercato.js, la stessa funzione
    // usata per le trattative approvate normalmente. Evita di duplicare
    // la logica qui (era la causa del bug prestiti sulle card giocatore).
    const ok = await eseguiTrasferimento(tData);
    if (!ok) throw new Error('Trasferimento fallito');

    showToast(`✅ Trattativa confermata! ${g.nome} → ${sqAcq.nome}${importo > 0 ? ' • ' + fmtBudget(importo) : ''}`);
    document.getElementById('modal-admin-trattativa').classList.remove('open');
    if (squadraAttiva) renderRosa(tabAttivoSq);
    renderTrattative();

  } catch (e) {
    showToast('❌ Errore: ' + e.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = '⚡ CONFERMA TRATTATIVA';
  }
}
