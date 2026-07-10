// ===== ADMIN TRATTATIVA DIRETTA =====
// Permette all'admin di creare e confermare trattative immediatamente
// senza approvazione, per conto di qualsiasi squadra.
// Supporta: scambio N giocatori per M giocatori, ognuno con il proprio
// tipo di contratto (titolo definitivo / prestito / diritto / obbligo),
// contro-riscatto, % rivendita, conguaglio rateizzabile con rate REALI
// (pagate automaticamente alla scadenza tramite controllaRateScadute in
// bilancio.js), e bonus condizionali (solo annotazione testuale per ora).

let adminTratGiocatoriCedente = [];    // array di id giocatore, dalla cedente → vanno all'acquirente
let adminTratGiocatoriAcquirente = []; // array di id giocatore, dall'acquirente → vanno alla cedente
let adminTratRateList = [];            // [{importo, data}] rate del conguaglio

function apriAdminTrattativa() {
  if (!adminLoggato) return;
  adminTratGiocatoriCedente = [];
  adminTratGiocatoriAcquirente = [];
  adminTratRateList = [];
  document.getElementById('modal-admin-trattativa').classList.add('open');
  renderAdminTratStep1();
}

function renderAdminTratStep1() {
  const body = document.getElementById('admin-trat-body');
  const sqOptions = squadreDB.map(s =>
    `<option value="${s.id}">${s.nome_squadra||s.nome}</option>`
  ).join('');

  body.innerHTML = `
    <div style="font-size:12px;color:var(--testo-dim);margin-bottom:16px">
      Crea uno scambio diretto tra due squadre (anche N contro M giocatori) e confermalo immediatamente.
      Ogni giocatore selezionato ha il proprio tipo di contratto configurabile.
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
      <div class="form-group">
        <label class="form-label">⬅️ Squadra Cedente</label>
        <select class="form-select" id="at-sq-cedente" onchange="adminTratCambiaSquadra('ced')">
          <option value="">— Seleziona —</option>
          ${sqOptions}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">➡️ Squadra Acquirente</label>
        <select class="form-select" id="at-sq-acquirente" onchange="adminTratCambiaSquadra('acq')">
          <option value="">— Seleziona —</option>
          ${sqOptions}
        </select>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">⚽ Giocatori dalla Cedente (vanno all'Acquirente)</label>
      <input class="form-input" type="text" id="at-search-ced" placeholder="Scrivi il nome..." oninput="adminTratCerca(this.value,'ced')">
      <div id="at-lista-ced" class="giocatori-search-list" style="display:none"></div>
      <div id="at-cards-ced" style="margin-top:8px"></div>
    </div>

    <div class="form-group">
      <label class="form-label">⚽ Giocatori dall'Acquirente (vanno alla Cedente, opzionale)</label>
      <input class="form-input" type="text" id="at-search-acq" placeholder="Scrivi il nome..." oninput="adminTratCerca(this.value,'acq')">
      <div id="at-lista-acq" class="giocatori-search-list" style="display:none"></div>
      <div id="at-cards-acq" style="margin-top:8px"></div>
    </div>

    <div style="background:var(--grigio-scuro);border-radius:10px;padding:12px;margin-bottom:14px">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:1px;color:var(--oro);margin-bottom:8px">💰 CONGUAGLIO (opzionale)</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px">
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Importo Totale (FM)</label>
          <input class="form-input" type="text" id="at-conguaglio" placeholder="Es. 80M" oninput="adminTratAggiornaImmediato()">
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Chi paga</label>
          <select class="form-select" id="at-conguaglio-direzione">
            <option value="acq_paga">Acquirente paga Cedente</option>
            <option value="ced_paga">Cedente paga Acquirente</option>
          </select>
        </div>
      </div>
      <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;margin-bottom:8px">
        <input type="checkbox" id="at-rateizza-chk" onchange="adminTratToggleRateizza()"> Rateizza il pagamento
      </label>
      <div id="at-rate-box" style="display:none">
        <div id="at-rate-lista"></div>
        <button type="button" onclick="adminTratAggiungiRata()" style="background:none;border:1px dashed var(--grigio-chiaro);color:var(--testo-dim);font-size:11px;padding:6px 10px;border-radius:6px;cursor:pointer;width:100%;margin-top:4px">➕ Aggiungi rata</button>
        <div id="at-immediato-info" style="font-size:11px;color:var(--testo-dim);margin-top:8px"></div>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">🎯 Bonus condizionali (solo annotazione, non ancora automatici)</label>
      <textarea class="form-input" id="at-bonus-note" rows="2" placeholder="Es. +2M se il giocatore segna 10 gol in stagione" style="resize:vertical"></textarea>
    </div>

    <div class="form-group">
      <label class="form-label">📝 Note (opzionale)</label>
      <input class="form-input" type="text" id="at-note" placeholder="Condizioni particolari...">
    </div>

    <button id="btn-at-conferma" onclick="adminTratConferma()"
      style="width:100%;background:var(--oro);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:2px;padding:13px;border-radius:10px;border:none;cursor:pointer;margin-top:8px">
      ⚡ CONFERMA TRATTATIVA
    </button>`;
}

function adminTratCambiaSquadra(lato) {
  if (lato === 'ced') adminTratGiocatoriCedente = [];
  else adminTratGiocatoriAcquirente = [];
  adminTratRenderCards('ced');
  adminTratRenderCards('acq');
}

function adminTratCerca(val, lato) {
  const lista = document.getElementById(`at-lista-${lato}`);
  if (val.length < 2) { lista.style.display = 'none'; return; }
  const sqId = document.getElementById(lato === 'ced' ? 'at-sq-cedente' : 'at-sq-acquirente').value;
  if (!sqId) { lista.innerHTML = '<div style="padding:10px;font-size:12px;color:var(--testo-dim)">Seleziona prima la squadra</div>'; lista.style.display = 'block'; return; }
  const giaSelezionati = lato === 'ced' ? adminTratGiocatoriCedente : adminTratGiocatoriAcquirente;
  const risultati = giocatoriDB
    .filter(g => g.nome.toLowerCase().includes(val.toLowerCase()) &&
      String(g.squadra_id) === String(sqId) &&
      !giaSelezionati.includes(g.id))
    .slice(0, 15);
  if (!risultati.length) { lista.innerHTML = '<div style="padding:10px;font-size:12px;color:var(--testo-dim)">Nessun giocatore trovato</div>'; lista.style.display = 'block'; return; }
  lista.innerHTML = risultati.map(g => `
    <div class="giocatore-search-item" onclick="adminTratAggiungiGiocatore(${g.id},'${lato}')">
      <div class="gsi-avatar">${g.foto_url ? `<img src="${g.foto_url}">` : iniziali(g.nome)}</div>
      <div class="gsi-info">
        <div class="gsi-nome">${g.nome}</div>
        <div class="gsi-sub">${g.ruolo} • Quotazione: ${g.quotazione ? g.quotazione+'M€' : '—'}</div>
      </div>
    </div>`).join('');
  lista.style.display = 'block';
}

function adminTratAggiungiGiocatore(gId, lato) {
  const arr = lato === 'ced' ? adminTratGiocatoriCedente : adminTratGiocatoriAcquirente;
  if (!arr.includes(gId)) arr.push(gId);
  document.getElementById(`at-search-${lato}`).value = '';
  document.getElementById(`at-lista-${lato}`).style.display = 'none';
  adminTratRenderCards(lato);
}

function adminTratRimuoviGiocatore(gId, lato) {
  if (lato === 'ced') adminTratGiocatoriCedente = adminTratGiocatoriCedente.filter(id => id !== gId);
  else adminTratGiocatoriAcquirente = adminTratGiocatoriAcquirente.filter(id => id !== gId);
  adminTratRenderCards(lato);
}

function adminTratRenderCards(lato) {
  const arr = lato === 'ced' ? adminTratGiocatoriCedente : adminTratGiocatoriAcquirente;
  const container = document.getElementById(`at-cards-${lato}`);
  if (!container) return;
  container.innerHTML = arr.map(gId => {
    const g = giocatoriDB.find(x => x.id === gId);
    if (!g) return '';
    return `
    <div style="background:var(--grigio-scuro);border:1px solid var(--grigio-chiaro);border-radius:10px;padding:10px;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <div class="gsi-avatar" style="width:28px;height:28px;font-size:9px">${g.foto_url ? `<img src="${g.foto_url}">` : iniziali(g.nome)}</div>
        <div style="flex:1;font-size:12px;font-weight:600">${g.nome} <span style="color:var(--testo-dim);font-weight:400">(${g.ruolo})</span></div>
        <button onclick="adminTratRimuoviGiocatore(${gId},'${lato}')" style="background:none;border:none;color:var(--testo-dim);cursor:pointer;font-size:14px">✕</button>
      </div>
      <select class="form-select" id="at-${lato}-tipo-${gId}" onchange="adminTratAggiornaSubcampi(${gId},'${lato}')" style="margin-bottom:6px;font-size:12px">
        <option value="Titolo Definitivo">💰 Titolo Definitivo</option>
        <option value="Prestito Secco">🔄 Prestito Secco</option>
        <option value="Prestito con Diritto di Riscatto">🔄 Prestito con Diritto di Riscatto</option>
        <option value="Prestito con Obbligo di Riscatto">🔄 Prestito con Obbligo di Riscatto</option>
      </select>
      <div id="at-${lato}-sub-${gId}"></div>
      <label style="display:flex;align-items:center;gap:6px;font-size:11px;cursor:pointer;margin:6px 0">
        <input type="checkbox" id="at-${lato}-recompra-chk-${gId}" onchange="adminTratToggleRecompra(${gId},'${lato}')"> Contro-riscatto (diritto di recompera per la cedente originale)
      </label>
      <div id="at-${lato}-recompra-${gId}" style="display:none"></div>
      <input class="form-input" type="number" id="at-${lato}-rivendita-${gId}" min="0" max="50" step="0.5" placeholder="% Futura Rivendita (opzionale)" style="font-size:11px;padding:7px">
    </div>`;
  }).join('');
  arr.forEach(gId => adminTratAggiornaSubcampi(gId, lato));
}

function adminTratAggiornaSubcampi(gId, lato) {
  const tipo = document.getElementById(`at-${lato}-tipo-${gId}`)?.value || 'Titolo Definitivo';
  const isPrestito = tipo.includes('Prestito');
  const hasRiscatto = tipo.includes('Diritto') || tipo.includes('Obbligo');
  const sub = document.getElementById(`at-${lato}-sub-${gId}`);
  if (!sub) return;
  let html = '';
  if (isPrestito) {
    html += `<div class="form-group" style="margin-bottom:6px">
      <label class="form-label" style="font-size:10px">📅 Scadenza Prestito</label>
      <input class="form-input" type="date" id="at-${lato}-scadenza-prestito-${gId}" style="font-size:11px;padding:7px">
    </div>`;
  }
  if (hasRiscatto) {
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px">
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label" style="font-size:10px">🔑 Importo Riscatto</label>
        <input class="form-input" type="text" id="at-${lato}-riscatto-imp-${gId}" placeholder="Es. 15M" style="font-size:11px;padding:7px">
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label" style="font-size:10px">⏰ Scadenza Riscatto</label>
        <input class="form-input" type="date" id="at-${lato}-riscatto-scad-${gId}" style="font-size:11px;padding:7px">
      </div>
    </div>`;
  }
  sub.innerHTML = html;
}

function adminTratToggleRecompra(gId, lato) {
  const chk = document.getElementById(`at-${lato}-recompra-chk-${gId}`);
  const box = document.getElementById(`at-${lato}-recompra-${gId}`);
  if (!chk || !box) return;
  if (chk.checked) {
    box.style.display = 'block';
    box.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px">
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label" style="font-size:10px">🔄 Importo Contro-riscatto</label>
        <input class="form-input" type="text" id="at-${lato}-recompra-imp-${gId}" placeholder="Es. 20M" style="font-size:11px;padding:7px">
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label" style="font-size:10px">⏰ Scadenza Contro-riscatto</label>
        <input class="form-input" type="date" id="at-${lato}-recompra-scad-${gId}" style="font-size:11px;padding:7px">
      </div>
    </div>`;
  } else {
    box.style.display = 'none';
    box.innerHTML = '';
  }
}

function adminTratToggleRateizza() {
  const chk = document.getElementById('at-rateizza-chk');
  const box = document.getElementById('at-rate-box');
  box.style.display = chk.checked ? 'block' : 'none';
  if (chk.checked && !adminTratRateList.length) adminTratRateList.push({ importo: '', data: '' });
  adminTratRenderRateLista();
}

function adminTratAggiungiRata() {
  adminTratRateList.push({ importo: '', data: '' });
  adminTratRenderRateLista();
}

function adminTratRenderRateLista() {
  const box = document.getElementById('at-rate-lista');
  if (!box) return;
  box.innerHTML = adminTratRateList.map((r, i) => `
    <div style="display:flex;gap:6px;margin-bottom:6px;align-items:center">
      <span style="font-size:10px;color:var(--testo-dim);width:40px;flex-shrink:0">Rata ${i+1}</span>
      <input class="form-input" type="text" value="${r.importo}" oninput="adminTratRateList[${i}].importo=this.value;adminTratAggiornaImmediato()" placeholder="Es. 15M" style="flex:1;padding:7px;font-size:11px">
      <input class="form-input" type="date" value="${r.data}" oninput="adminTratRateList[${i}].data=this.value" style="flex:1;padding:7px;font-size:11px">
      <button type="button" onclick="adminTratRateList.splice(${i},1);adminTratRenderRateLista()" style="background:rgba(255,68,68,0.15);border:none;color:var(--rosso);border-radius:6px;padding:7px 9px;cursor:pointer;flex-shrink:0">✕</button>
    </div>`).join('');
  adminTratAggiornaImmediato();
}

function adminTratAggiornaImmediato() {
  const info = document.getElementById('at-immediato-info');
  if (!info) return;
  const totale = adminTratParseFM(document.getElementById('at-conguaglio')?.value);
  const sommaRate = adminTratRateList.reduce((s, r) => s + (adminTratParseFM(r.importo) || 0), 0);
  const immediato = totale - sommaRate;
  info.textContent = `Da pagare subito: ${fmtNum(Math.max(0, immediato))} FM` + (immediato < 0 ? ' ⚠️ le rate superano il totale!' : '');
  info.style.color = immediato < 0 ? 'var(--rosso)' : 'var(--testo-dim)';
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
  if (!sqCedId || !sqAcqId) { showToast('❌ Seleziona entrambe le squadre', 'error'); return; }
  if (sqCedId === sqAcqId) { showToast('❌ Le squadre devono essere diverse', 'error'); return; }
  if (!adminTratGiocatoriCedente.length && !adminTratGiocatoriAcquirente.length) { showToast('❌ Seleziona almeno un giocatore', 'error'); return; }

  const sqCed = squadreDB.find(s => s.id === sqCedId);
  const sqAcq = squadreDB.find(s => s.id === sqAcqId);
  const noteGenerali = document.getElementById('at-note').value.trim();
  const bonusNote = document.getElementById('at-bonus-note').value.trim();

  const btn = document.getElementById('btn-at-conferma');
  btn.disabled = true; btn.textContent = 'Conferma in corso...';

  try {
    const configs = [];
    for (const gId of adminTratGiocatoriCedente) configs.push(adminTratLeggiConfig(gId, 'ced', sqCedId, sqAcqId));
    for (const gId of adminTratGiocatoriAcquirente) configs.push(adminTratLeggiConfig(gId, 'acq', sqAcqId, sqCedId));

    const nomiGiocatori = configs.map(c => giocatoriDB.find(g => g.id === c.giocatore_id)?.nome).filter(Boolean).join(', ');
    let noteRiepilogo = noteGenerali;
    if (bonusNote) noteRiepilogo = (noteRiepilogo ? noteRiepilogo + ' | ' : '') + '🎯 Bonus: ' + bonusNote;

    const riepilogo = {
      tipo: configs.length > 1 ? 'Scambio Multiplo' : (configs[0]?.tipo || 'Titolo Definitivo'),
      stato: 'approvata',
      squadra_cedente_id: sqCedId,
      squadra_acquirente_id: sqAcqId,
      giocatori_ids: configs.map(c => c.giocatore_id),
      note: (noteRiepilogo ? noteRiepilogo + ' | ' : '') + '👥 Coinvolti: ' + nomiGiocatori,
    };
    const { data: rData, error: rErr } = await sb.from('trattative').insert(riepilogo).select().single();
    if (rErr) throw rErr;
    trattativeDB.push(rData);

    for (const cfg of configs) {
      const { data: pData, error: pErr } = await sb.from('trattative').insert({
        giocatore_id: cfg.giocatore_id,
        squadra_cedente_id: cfg.squadra_cedente_id,
        squadra_acquirente_id: cfg.squadra_acquirente_id,
        tipo: cfg.tipo,
        importo: 0,
        scadenza_prestito: cfg.scadenza_prestito,
        importo_riscatto: cfg.importo_riscatto,
        scadenza_riscatto: cfg.scadenza_riscatto,
        importo_recompra: cfg.importo_recompra,
        scadenza_recompra: cfg.scadenza_recompra,
        percentuale_rivendita: cfg.percentuale_rivendita,
        stato: 'approvata',
      }).select().single();
      if (pErr) throw pErr;
      trattativeDB.push(pData);
      const ok = await eseguiTrasferimento(pData);
      if (!ok) throw new Error(`Trasferimento fallito per ${giocatoriDB.find(g=>g.id===cfg.giocatore_id)?.nome||cfg.giocatore_id}`);
    }

    const totaleConguaglio = adminTratParseFM(document.getElementById('at-conguaglio').value);
    if (totaleConguaglio > 0) {
      const direzione = document.getElementById('at-conguaglio-direzione').value;
      const sqDebitrice = direzione === 'acq_paga' ? sqAcq : sqCed;
      const sqCreditrice = direzione === 'acq_paga' ? sqCed : sqAcq;
      const rateizza = document.getElementById('at-rateizza-chk').checked;
      const rateValide = rateizza ? adminTratRateList.filter(r => r.importo && r.data) : [];
      const sommaRate = rateValide.reduce((s, r) => s + adminTratParseFM(r.importo), 0);
      const immediato = totaleConguaglio - sommaRate;

      if (immediato > 0) {
        const nuovoDeb = (sqDebitrice.budget || 0) - immediato;
        const nuovoCred = (sqCreditrice.budget || 0) + immediato;
        await sb.from('squadre').update({ budget: nuovoDeb }).eq('id', sqDebitrice.id);
        await sb.from('squadre').update({ budget: nuovoCred }).eq('id', sqCreditrice.id);
        sqDebitrice.budget = nuovoDeb; sqCreditrice.budget = nuovoCred;
      }

      for (const r of rateValide) {
        const importoRata = adminTratParseFM(r.importo);
        const { data: rd, error: rErr2 } = await sb.from('rate_mercato').insert({
          descrizione: `Conguaglio scambio: ${nomiGiocatori}`,
          squadra_debitrice_id: sqDebitrice.id,
          squadra_creditrice_id: sqCreditrice.id,
          importo: importoRata,
          data_scadenza: r.data,
          pagata: false,
          stagione: STAGIONE_CORRENTE,
        }).select().single();
        if (rErr2) throw rErr2;
        if (typeof rateMercato !== 'undefined') rateMercato.push(rd);
      }
    }

    showToast(`✅ Trattativa confermata! ${configs.length} giocatori coinvolti${totaleConguaglio>0?' • '+fmtNum(totaleConguaglio)+' FM':''}`);
    document.getElementById('modal-admin-trattativa').classList.remove('open');
    if (typeof renderTrattative === 'function') renderTrattative();
  } catch (e) {
    showToast('❌ Errore: ' + e.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = '⚡ CONFERMA TRATTATIVA';
  }
}

function adminTratLeggiConfig(gId, lato, sqCedenteReale, sqAcquirenteReale) {
  const tipo = document.getElementById(`at-${lato}-tipo-${gId}`)?.value || 'Titolo Definitivo';
  const scadPrestito = document.getElementById(`at-${lato}-scadenza-prestito-${gId}`)?.value || null;
  const riscattoImp = adminTratParseFM(document.getElementById(`at-${lato}-riscatto-imp-${gId}`)?.value) || null;
  const riscattoScad = document.getElementById(`at-${lato}-riscatto-scad-${gId}`)?.value || null;
  const recompraChk = document.getElementById(`at-${lato}-recompra-chk-${gId}`)?.checked;
  const recompraImp = recompraChk ? (adminTratParseFM(document.getElementById(`at-${lato}-recompra-imp-${gId}`)?.value) || null) : null;
  const recompraScad = recompraChk ? (document.getElementById(`at-${lato}-recompra-scad-${gId}`)?.value || null) : null;
  const rivendita = parseFloat(document.getElementById(`at-${lato}-rivendita-${gId}`)?.value) || null;
  return {
    giocatore_id: gId,
    squadra_cedente_id: sqCedenteReale,
    squadra_acquirente_id: sqAcquirenteReale,
    tipo,
    scadenza_prestito: scadPrestito,
    importo_riscatto: riscattoImp,
    scadenza_riscatto: riscattoScad,
    importo_recompra: recompraImp,
    scadenza_recompra: recompraScad,
    percentuale_rivendita: rivendita,
  };
}
