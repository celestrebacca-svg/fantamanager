// ===== SPONSOR ANNUALI (fine stagione) — PEZZO 1: calcolo e anteprima, SOLA LETTURA =====
// Scheda "Sponsor annuali" dentro Tabelle. Legge solo giornate_import: non scrive niente, non muove budget.
// Si può provare in qualsiasi momento (anche a metà stagione): i premi veri valgono dopo la giornata 38.
// Accredito (solo dopo la giornata 38): i FM vanno in bilancio_pending (li eroga apriNuovoBilancio()),
// i tifosi si aggiornano subito sulla squadra. Una sola volta per stagione, annullabile finché il nuovo bilancio non è aperto.
//
// Pari merito: tutti i pari merito prendono lo STESSO premio e la posizione dopo continua senza buchi
// (1°, 1°, poi 2°, poi 3°: non esiste un "3°" saltato).
// Richiede: gestione-sponsor.js (gsAssicuraSquadre, gsConta, GS_PESO, gsPulisciNome), sb, squadreDB.

const SA_MIN_PRESENZE = 20;
const SA_GIORNATE_STAGIONE = 38;

// podio = [[soldi, tifosi], ...] per 1°, 2°, 3°. "unico" = un solo premio (1° posto).
const SA_PREMI = [
  // ---- squadre ----
  { id: "gol_campo", gruppo: "Squadre", titolo: "Calciatori con più gol in campo", ent: "squadra", val: s => s.golCampo, ordine: "desc", zero: false, podio: [[6500000, 250], [4500000, 200], [3000000, 150]] },
  { id: "gol_panchina", gruppo: "Squadre", titolo: "Calciatori con più gol in panchina", ent: "squadra", val: s => s.golPanchina, ordine: "desc", zero: false, podio: [[3500000, 80], [2500000, 50], [1500000, 30]] },
  { id: "assist_campo", gruppo: "Squadre", titolo: "Calciatori con più assist in campo", ent: "squadra", val: s => s.assistCampo, ordine: "desc", zero: false, podio: [[6000000, 220], [4000000, 180], [3000000, 130]] },
  { id: "meno_gol", gruppo: "Squadre", titolo: "Squadra con meno gol", ent: "squadra", val: s => s.golCampo, ordine: "asc", zero: true, podio: [[1500000, 0], [1000000, 0]] },
  { id: "meno_assist", gruppo: "Squadre", titolo: "Squadra con meno assist", ent: "squadra", val: s => s.assistCampo, ordine: "asc", zero: true, podio: [[1500000, 0], [1000000, 0]] },
  { id: "fantagol_subiti", gruppo: "Squadre", titolo: "Squadra che subisce più fantagol", ent: "squadra", val: s => s.fantagolSubiti, ordine: "desc", zero: false, podio: [[4500000, 100], [3000000, 80], [1500000, 70]] },
  { id: "fantagol_fatti", gruppo: "Squadre", titolo: "Squadra che fa più fantagol", ent: "squadra", val: s => s.fantagolFatti, ordine: "desc", zero: false, podio: [[5000000, 300]] },
  { id: "magic", gruppo: "Squadre", titolo: "Squadra più magic punti", ent: "squadra", val: s => s.magic, ordine: "desc", zero: false, dec: 1, podio: [[7000000, 300], [5000000, 230], [3000000, 180]] },
  { id: "fair_play", gruppo: "Squadre", titolo: "Premio fair play (meno ammonizioni)", ent: "squadra", val: s => s.ammonizioni, ordine: "asc", zero: true, podio: [[4000000, 60]] },
  { id: "capitano_suff", gruppo: "Squadre", titolo: "Capitano con più sufficienze (voto 6 o più)", ent: "squadra", val: s => s.sufficienzeCapitano, ordine: "desc", zero: false, podio: [[6000000, 200], [4000000, 100], [2000000, 50]] },
  // ---- giocatori ----
  { id: "portiere_subiti", gruppo: "Giocatori", titolo: "Portiere con più gol subiti", ent: "giocatore", filtro: p => p.ruolo === "P", val: p => p.golSubiti, ordine: "desc", zero: false, podio: [[2000000, -10], [1500000, 0]] },
  { id: "giocatore_gol", gruppo: "Giocatori", titolo: "Giocatore con più gol", ent: "giocatore", val: p => p.gol, ordine: "desc", zero: false, podio: [[3500000, 160], [2500000, 110], [2000000, 60]] },
  { id: "giocatore_assist", gruppo: "Giocatori", titolo: "Giocatore con più assist", ent: "giocatore", val: p => p.assist, ordine: "desc", zero: false, podio: [[3500000, 160], [2500000, 110], [2000000, 60]] },
  { id: "pallone_oro", gruppo: "Giocatori", titolo: "Pallone d'oro (media voto, min. 20 presenze)", ent: "giocatore", filtro: p => p.presenze >= SA_MIN_PRESENZE, val: p => p.media, ordine: "desc", zero: false, dec: 2, podio: [[12000000, 350]] },
  { id: "miglior_attaccante", gruppo: "Giocatori", titolo: "Miglior attaccante (media voto, min. 20 presenze)", ent: "giocatore", filtro: p => p.ruolo === "A" && p.presenze >= SA_MIN_PRESENZE, val: p => p.media, ordine: "desc", zero: false, dec: 2, podio: [[6000000, 250], [3000000, 150], [1000000, 100]] },
  { id: "miglior_centrocampista", gruppo: "Giocatori", titolo: "Miglior centrocampista (media voto, min. 20 presenze)", ent: "giocatore", filtro: p => p.ruolo === "C" && p.presenze >= SA_MIN_PRESENZE, val: p => p.media, ordine: "desc", zero: false, dec: 2, podio: [[8000000, 250], [6500000, 150], [5000000, 100]] },
  { id: "miglior_difensore", gruppo: "Giocatori", titolo: "Miglior difensore (media voto, min. 20 presenze)", ent: "giocatore", filtro: p => p.ruolo === "D" && p.presenze >= SA_MIN_PRESENZE, val: p => p.media, ordine: "desc", zero: false, dec: 2, podio: [[8000000, 250], [6000000, 150], [3500000, 100]] },
  { id: "miglior_portiere", gruppo: "Giocatori", titolo: "Miglior portiere (media voto, min. 20 presenze)", ent: "giocatore", filtro: p => p.ruolo === "P" && p.presenze >= SA_MIN_PRESENZE, val: p => p.media, ordine: "desc", zero: false, dec: 2, podio: [[8000000, 250], [5000000, 150], [2500000, 100]] },
  { id: "difensore_ga", gruppo: "Giocatori", titolo: "Difensore con più gol e assist", ent: "giocatore", filtro: p => p.ruolo === "D", val: p => p.gol + p.assist, ordine: "desc", zero: false, podio: [[5000000, 50], [3000000, 30], [1000000, 10]] },
  { id: "centrocampista_ga", gruppo: "Giocatori", titolo: "Centrocampista con più gol e assist", ent: "giocatore", filtro: p => p.ruolo === "C", val: p => p.gol + p.assist, ordine: "desc", zero: false, podio: [[6500000, 50], [4000000, 30], [3000000, 10]] },
  { id: "attaccante_ga", gruppo: "Giocatori", titolo: "Attaccante con più gol e assist", ent: "giocatore", filtro: p => p.ruolo === "A", val: p => p.gol + p.assist, ordine: "desc", zero: false, podio: [[3000000, 30], [1500000, 15], [600000, 5]] },
  // ---- maglie 7 / 9 / 10 (podi separati, il numero di maglia è quello indossato nelle singole giornate) ----
  { id: "n7_assist", gruppo: "Maglie", titolo: "Miglior numero 7 per assist", ent: "maglia", num: 7, val: p => p.assist, ordine: "desc", zero: false, podio: [[8000000, 200], [5000000, 100], [2500000, 50]] },
  { id: "n10_assist", gruppo: "Maglie", titolo: "Miglior numero 10 per assist", ent: "maglia", num: 10, val: p => p.assist, ordine: "desc", zero: false, podio: [[8000000, 200], [5000000, 100], [2500000, 50]] },
  { id: "n9_gol", gruppo: "Maglie", titolo: "Miglior numero 9 per gol", ent: "maglia", num: 9, val: p => p.gol, ordine: "desc", zero: false, podio: [[8000000, 200], [5000000, 100], [2500000, 50]] },
  { id: "n7_mv", gruppo: "Maglie", titolo: "Miglior numero 7 per media voto (min. 20 presenze)", ent: "maglia", num: 7, filtro: p => p.presenze >= SA_MIN_PRESENZE, val: p => p.media, ordine: "desc", zero: false, dec: 2, podio: [[7000000, 350], [5000000, 200], [3500000, 80]] },
  { id: "n9_mv", gruppo: "Maglie", titolo: "Miglior numero 9 per media voto (min. 20 presenze)", ent: "maglia", num: 9, filtro: p => p.presenze >= SA_MIN_PRESENZE, val: p => p.media, ordine: "desc", zero: false, dec: 2, podio: [[7000000, 350], [5000000, 200], [3500000, 80]] },
  { id: "n10_mv", gruppo: "Maglie", titolo: "Miglior numero 10 per media voto (min. 20 presenze)", ent: "maglia", num: 10, filtro: p => p.presenze >= SA_MIN_PRESENZE, val: p => p.media, ordine: "desc", zero: false, dec: 2, podio: [[7000000, 350], [5000000, 200], [3500000, 80]] },
];

function saPulisciNomeVisibile(n) { return String(n || "").replace(/[ⒸⓋ]/g, "").replace(/\s+/g, " ").trim(); }
function saEsc(t) { return String(t).replace(/[<>&"]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c])); }
function saFmtM(x) { const n = Number(x) || 0; return (n < 0 ? "-" : "") + (Math.abs(n) / 1e6).toLocaleString("it-IT", { maximumFractionDigits: 2 }) + "M"; }

// Somma tutto quello che serve dalle giornate importate.
function saAggrega(righe, squadre) {
  const sq = {}, gioc = {}, maglia = { 7: {}, 9: {}, 10: {} };
  const nomeSq = id => { const s = squadre.find(x => String(x.id) === String(id)); return s ? (s.nome_squadra || s.nome) : String(id); };
  squadre.forEach(s => {
    sq[s.id] = { id: s.id, nome: s.nome_squadra || s.nome, golCampo: 0, golPanchina: 0, assistCampo: 0, fantagolFatti: 0, fantagolSubiti: 0, magic: 0, ammonizioni: 0, sufficienzeCapitano: 0, giornate: 0 };
  });
  const nuovo = (store, key, g, sqId) => {
    if (!store[key]) store[key] = { key, nome: saPulisciNomeVisibile(g.nome), squadraId: sqId, squadra: nomeSq(sqId), ruolo: String(g.ruolo || "").trim().toUpperCase().charAt(0), gol: 0, assist: 0, golSubiti: 0, presenze: 0, sommaVoti: 0 };
    return store[key];
  };

  for (const r of righe) {
    const s = sq[r.squadra_id];
    if (!s) continue;
    s.giornate++;
    s.magic += Number(r.totale) || 0;
    const m = /^(\d+)-(\d+)$/.exec(String(r.risultato || "").trim());
    if (m) {
      const fatti = parseInt(r.casa_o_trasferta === "casa" ? m[1] : m[2]);
      const subiti = parseInt(r.casa_o_trasferta === "casa" ? m[2] : m[1]);
      s.fantagolFatti += fatti; s.fantagolSubiti += subiti;
    }
    const lista = r.giocatori || [];
    for (const g of lista) {
      const gol = gsConta(g.gol, GS_PESO.gol);
      const assist = gsConta(g.assist, GS_PESO.assistStd) + gsConta(g.assistSoft, GS_PESO.assistSoft) + gsConta(g.assistGold, GS_PESO.assistGold);
      if (g.cartellino === "giallo") s.ammonizioni++;
      if (!g.haContato) { s.golPanchina += gol; continue; } // non ha contato nel punteggio
      s.golCampo += gol; s.assistCampo += assist;
      const key = `${r.squadra_id}|${gsPulisciNome(g.nome)}`;
      const p = nuovo(gioc, key, g, r.squadra_id);
      p.gol += gol; p.assist += assist;
      if (g.ruolo) p.ruolo = String(g.ruolo).trim().toUpperCase().charAt(0);
      if (p.ruolo === "P" && typeof g.golSubiti === "number") p.golSubiti += Math.abs(g.golSubiti);
      const haVoto = typeof g.voto === "number";
      if (haVoto) { p.presenze++; p.sommaVoti += g.voto; }
      const num = Number(g.maglia);
      if ([7, 9, 10].includes(num)) {
        const q = nuovo(maglia[num], key, g, r.squadra_id);
        q.gol += gol; q.assist += assist;
        if (haVoto) { q.presenze++; q.sommaVoti += g.voto; }
      }
    }
    // capitano della giornata (Ⓒ); se non ha contato, il vice (Ⓥ): stessa regola degli sponsor settimanali
    const cap = lista.find(g => g.capitano && g.haContato) || lista.find(g => g.viceCapitano && g.haContato);
    if (cap && typeof cap.voto === "number" && cap.voto >= 6) s.sufficienzeCapitano++;
  }
  const finisci = o => Object.values(o).forEach(p => { p.media = p.presenze ? p.sommaVoti / p.presenze : 0; });
  finisci(gioc); finisci(maglia[7]); finisci(maglia[9]); finisci(maglia[10]);
  return { sq: Object.values(sq), gioc: Object.values(gioc), maglia };
}

// Classifica con pari merito alla pari e posizioni senza buchi (1,1,2,3...).
function saClassifica(entita, premio) {
  const arrot = v => Math.round(v * 1e6) / 1e6;
  const lista = entita.filter(e => !premio.filtro || premio.filtro(e))
    .map(e => ({ e, v: arrot(premio.val(e)) }))
    .filter(x => premio.zero || x.v > 0);
  lista.sort((a, b) => premio.ordine === "asc" ? a.v - b.v : b.v - a.v);
  let pos = 0, prec = null;
  for (const x of lista) { if (prec === null || x.v !== prec) { pos++; prec = x.v; } x.pos = pos; }
  return lista.filter(x => x.pos <= premio.podio.length)
    .map(x => ({ pos: x.pos, valore: x.v, ent: x.e, soldi: premio.podio[x.pos - 1][0], tifosi: premio.podio[x.pos - 1][1] }));
}

function p_nome(premio, v) { return premio.ent === "squadra" ? "" : ` (${v.ent.nome})`; }

function saCalcola(righe, squadre) {
  const agg = saAggrega(righe, squadre);
  const risultati = SA_PREMI.map(p => {
    const entita = p.ent === "squadra" ? agg.sq : p.ent === "giocatore" ? agg.gioc : Object.values(agg.maglia[p.num]);
    return { premio: p, vincitori: saClassifica(entita, p) };
  });
  const perSquadra = {}, vociSquadra = {};
  agg.sq.forEach(s => { perSquadra[s.id] = { id: s.id, nome: s.nome, soldi: 0, tifosi: 0, voci: 0 }; vociSquadra[s.id] = []; });
  for (const r of risultati) for (const v of r.vincitori) {
    const id = v.ent.squadraId !== undefined ? v.ent.squadraId : v.ent.id;
    if (!perSquadra[id]) continue;
    perSquadra[id].soldi += v.soldi; perSquadra[id].tifosi += v.tifosi; perSquadra[id].voci++;
    vociSquadra[id].push({ testo: `${r.premio.titolo}${p_nome(r.premio, v)} ${v.pos}°: ${saFmtM(v.soldi)}${v.tifosi ? " / " + (v.tifosi > 0 ? "+" : "") + v.tifosi + " tifosi" : ""}`, soldi: v.soldi, tifosi: v.tifosi });
  }
  const giornate = new Set(righe.map(r => r.giornata)).size;
  return { risultati, perSquadra: Object.values(perSquadra).sort((a, b) => b.soldi - a.soldi), vociSquadra, giornate };
}

// ---- schermata ----
function saNomeEnt(p, v) {
  return p.ent === "squadra" ? saEsc(v.ent.nome) : `${saEsc(v.ent.nome)} <small>(${saEsc(v.ent.squadra)})</small>`;
}
function saFmtVal(p, x) { return p.dec ? Number(x).toLocaleString("it-IT", { minimumFractionDigits: p.dec, maximumFractionDigits: p.dec }) : String(x); }

function saHtml(res) {
  const nota = res.giornate < SA_GIORNATE_STAGIONE
    ? `Calcolo <b>provvisorio</b> su ${res.giornate} giornat${res.giornate === 1 ? "a" : "e"} importat${res.giornate === 1 ? "a" : "e"}: i premi veri si assegnano dopo la giornata ${SA_GIORNATE_STAGIONE}.`
    : `Calcolo su tutte le ${res.giornate} giornate.`;
  const gia = res.gia || [];
  const fatte = new Set(gia.map(p => String(p.squadra_id)));
  const dovute = res.perSquadra.filter(s => s.voci > 0);
  const mancanti = dovute.filter(s => !fatte.has(String(s.id)));
  const erogati = gia.some(p => p.erogato);
  const annulla = gia.length && !erogati ? `<br><button class="gs-btn" style="margin-top:8px" onclick="saAnnullaAccredito()">↩️ Annulla accredito</button>` : "";
  let azione;
  if (gia.length && !mancanti.length) {
    azione = `<div style="background:rgba(0,255,135,0.1);border:1px solid var(--verde,#0f8);border-radius:8px;padding:10px;font-size:12px;margin:8px 0">✅ Già accreditati per la stagione ${saEsc(saStagione())} (${gia.length} squadre).${erogati ? " Il nuovo bilancio è già aperto: non si può annullare." : ""}${annulla}</div>`;
  } else if (res.giornate >= SA_GIORNATE_STAGIONE) {
    const tot = mancanti.reduce((a, s) => a + s.soldi, 0);
    azione = `${gia.length ? `<div style="background:rgba(255,215,0,0.1);border:1px solid var(--oro,#fd0);border-radius:8px;padding:10px;font-size:12px;margin:8px 0">⚠️ Accredito incompleto: fatte ${gia.length} squadre, ne mancano ${mancanti.length}.${annulla}</div>` : ""}
      <button class="gs-btn" style="width:100%;margin:8px 0" onclick="saAccredita()">✅ ${gia.length ? "COMPLETA L'ACCREDITO" : "ACCREDITA SPONSOR ANNUALI"} (${saFmtM(tot)})</button>
      <div style="font-size:11px;color:var(--testo-dim,#999)">I FM vanno tra quelli da erogare e arrivano con "Apri nuovo bilancio". I tifosi si aggiornano subito.</div>`;
  } else {
    azione = `<div style="font-size:12px;color:var(--testo-dim,#999);margin:8px 0">L'accredito si sblocca dopo la giornata ${SA_GIORNATE_STAGIONE}.</div>`;
  }
  let html = `<div class="gs-warn" style="margin:8px 0">${nota} ${res.giornate >= SA_GIORNATE_STAGIONE ? "" : "Sola lettura: nessun soldo viene mosso."}</div>` + azione;
  html += `<h3>Totale per squadra</h3><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">
    <tr style="text-align:left"><th>Squadra</th><th>Premi</th><th>Fantamilioni</th><th>Tifosi</th></tr>` +
    res.perSquadra.map(s => `<tr style="border-top:1px solid var(--grigio-chiaro,#333)"><td>${saEsc(s.nome)}</td><td>${s.voci}</td><td>${saFmtM(s.soldi)}</td><td>${s.tifosi > 0 ? "+" : ""}${s.tifosi}</td></tr>`).join("") +
    `</table></div>`;
  let gruppo = "";
  for (const r of res.risultati) {
    const p = r.premio;
    if (p.gruppo !== gruppo) { gruppo = p.gruppo; html += `<h3 style="margin-top:16px">${saEsc(gruppo)}</h3>`; }
    const corpo = r.vincitori.length
      ? r.vincitori.map(v => `<div style="display:flex;justify-content:space-between;gap:8px;padding:3px 0;font-size:12px"><span>${v.pos}° ${saNomeEnt(p, v)} — <b>${saFmtVal(p, v.valore)}</b></span><span style="white-space:nowrap">${saFmtM(v.soldi)} / ${v.tifosi > 0 ? "+" : ""}${v.tifosi}</span></div>`).join("")
      : `<div style="font-size:12px;color:var(--testo-dim,#999);padding:3px 0">Nessuno qualificato per ora</div>`;
    const primo = r.vincitori.filter(v => v.pos === 1).map(v => p.ent === "squadra" ? v.ent.nome : v.ent.nome).join(", ");
    html += `<details style="background:var(--grigio,#1a1a1a);border-radius:8px;padding:8px 10px;margin-bottom:6px"><summary style="cursor:pointer;font-size:13px"><b>${saEsc(p.titolo)}</b>${primo ? " — " + saEsc(primo) : ""}</summary>${corpo}</details>`;
  }
  return html;
}

async function gsRenderAnnuali(body) {
  body.innerHTML = `<div style="border:2px dashed var(--grigio-chiaro,#333);border-radius:14px;padding:16px;text-align:center">
      <div style="margin-bottom:10px">Premi di fine stagione calcolati dalle giornate importate. Puoi provarli anche adesso: sono solo un'anteprima.</div>
      <button class="gs-btn" onclick="saCalcolaOra()">🏆 Calcola sponsor annuali</button></div>
    <div id="sa-esito"></div><div id="sa-pannello" style="margin-top:12px"></div>`;
}

async function saCalcolaOra(mantieniEsito) {
  const esito = document.getElementById("sa-esito"), pan = document.getElementById("sa-pannello");
  const msg = (t, err) => { if (esito) esito.innerHTML = `<div class="gs-warn" style="margin:8px 0"><b>${saEsc(t)}</b></div>`; if (err) { try { showToast(t, "error"); } catch (_) {} } };
  if (!mantieniEsito) msg("⏳ Leggo le giornate importate...");
  try {
    await gsAssicuraSquadre();
    const data = await saCaricaGiornate();
    if (!data.length) { msg("Nessuna giornata importata: non c'è ancora niente da calcolare."); return; }
    const res = saCalcola(data, squadreDB);
    res.gia = await saLeggiAccrediti();
    if (esito && !mantieniEsito) esito.innerHTML = "";
    if (pan) pan.innerHTML = saHtml(res);
  } catch (e) { msg("❌ " + e.message, true); }
}


// ================= ACCREDITO (dopo la giornata 38) =================
let saInCorso = false;
const saStagione = () => (typeof STAGIONE_CORRENTE !== "undefined" ? STAGIONE_CORRENTE : "");

function saMsg(t, err) {
  const e = document.getElementById("sa-esito");
  if (e) e.innerHTML = `<div class="gs-warn" style="margin:8px 0"><b>${saEsc(t)}</b></div>`;
  if (err) { try { showToast(t, "error"); } catch (_) {} }
}

async function saCaricaGiornate() {
  const { data, error } = await sb.from("giornate_import").select("giornata,squadra_id,totale,risultato,casa_o_trasferta,giocatori");
  if (error) throw error;
  return data || [];
}

// Movimenti "Sponsor annuali" già presenti in bilancio_pending per la stagione corrente
async function saLeggiAccrediti() {
  const { data, error } = await sb.from("bilancio_pending").select("id,squadra_id,importo,erogato")
    .eq("stagione", saStagione()).like("descrizione", "Sponsor annuali%");
  if (error) throw error;
  return data || [];
}

async function saAccredita() {
  if (saInCorso) return;
  saInCorso = true;
  try {
    await gsAssicuraSquadre();
    const res = saCalcola(await saCaricaGiornate(), squadreDB); // ricalcolo al momento, non mi fido della schermata
    const st = saStagione();
    if (res.giornate < SA_GIORNATE_STAGIONE) { saMsg(`❌ L'accredito si sblocca dopo la giornata ${SA_GIORNATE_STAGIONE} (ora ${res.giornate} importate)`, true); return; }
    const fatte = new Set((await saLeggiAccrediti()).map(p => String(p.squadra_id)));
    const dovute = res.perSquadra.filter(s => s.voci > 0);
    if (!dovute.length) { saMsg("Nessun premio da accreditare"); return; }
    const squadre = dovute.filter(s => !fatte.has(String(s.id))); // le squadre già accreditate non si toccano
    if (!squadre.length) { saMsg(`❌ Gli sponsor annuali ${st} risultano già accreditati a tutte le squadre: non li ripeto`, true); return; }
    const totSoldi = squadre.reduce((a, s) => a + s.soldi, 0);
    if (!confirm(`Accredito gli sponsor annuali ${st}?\n\n${squadre.length} squadre${fatte.size ? " (le altre " + fatte.size + " sono già fatte)" : ""}, ${saFmtM(totSoldi)} di FM nel nuovo bilancio.\nI tifosi si aggiornano subito.`)) return;

    saMsg("⏳ Accredito in corso: non chiudere la pagina...");
    const falliti = [];
    let fatti = 0;
    for (const s of squadre) {
      const voci = res.vociSquadra[s.id] || [];
      let pend = null, vecchiTifosi = null, tifosiApplicati = 0;
      try {
        // 1) FM tra quelli da erogare (li paga apriNuovoBilancio)
        const riga = { squadra_id: s.id, importo: s.soldi, tipo: "sponsor_annuale", descrizione: `Sponsor annuali ${st} (${s.voci} premi)`, stagione: st, erogato: false };
        let ins = await sb.from("bilancio_pending").insert(riga).select().single();
        if (ins.error) ins = await sb.from("bilancio_pending").insert({ ...riga, tipo: "competizione" }).select().single();
        if (ins.error || !ins.data) throw new Error("movimento in attesa non scritto");
        pend = ins.data;

        // 2) tifosi subito (mai sotto zero)
        if (s.tifosi !== 0) {
          const { data: sq, error: e1 } = await sb.from("squadre").select("tifosi").eq("id", s.id).single();
          if (e1 || !sq) throw new Error("tifosi non letti");
          vecchiTifosi = Number(sq.tifosi) || 0;
          const nuovo = Math.max(0, vecchiTifosi + s.tifosi);
          const { data: agg, error: e2 } = await sb.from("squadre").update({ tifosi: nuovo }).eq("id", s.id).select("id");
          if (e2 || !agg || agg.length !== 1) throw new Error("tifosi non aggiornati");
          tifosiApplicati = nuovo - vecchiTifosi;
        }

        // 3) traccia nel log sponsor (soldi 0: i FM passano dal bilancio in attesa)
        const { data: lg, error: e3 } = await sb.from("sponsor_eventi").insert({
          giornata: 0, squadra_id: s.id, tipo_sponsor: "annuale_stagione", nome_sponsor: `Sponsor annuali ${st}`, soldi: 0, tifosi: tifosiApplicati,
          dettaglio: voci.map(v => v.testo).join(" • ") + ` — FM ${saFmtM(s.soldi)} nel nuovo bilancio`,
        }).select("id");
        if (e3 || !lg || !lg.length) throw new Error("log non scritto");

        if (typeof bilancePending !== "undefined") bilancePending.push(pend);
        fatti++;
      } catch (e) {
        // niente a metà: rimetto i tifosi e tolgo il movimento
        try { if (vecchiTifosi !== null) await sb.from("squadre").update({ tifosi: vecchiTifosi }).eq("id", s.id); } catch (_) {}
        try { if (pend) await sb.from("bilancio_pending").delete().eq("id", pend.id); } catch (_) {}
        falliti.push(`${s.nome}: ${e.message}`);
      }
    }
    if (typeof gsRinfrescaSquadre === "function") await gsRinfrescaSquadre();
    if (falliti.length) {
      alert("Queste squadre NON sono state accreditate (e non hanno lasciato tracce):\n\n" + falliti.join("\n") + "\n\nPremi di nuovo il bottone: le squadre già fatte non verranno ripetute.");
      saMsg(`⚠️ Accreditate ${fatti} squadre su ${squadre.length}. Riprova per le altre.`, true);
    } else {
      saMsg(`✅ Sponsor annuali ${st} accreditati a ${fatti} squadre. I FM arrivano con "Apri nuovo bilancio".`);
    }
    await saCalcolaOra(true);
  } catch (e) {
    saMsg("❌ " + e.message, true);
  } finally {
    saInCorso = false;
  }
}

// Annulla l'accredito finché il nuovo bilancio non è stato aperto
async function saAnnullaAccredito() {
  if (saInCorso) return;
  saInCorso = true;
  try {
    const st = saStagione();
    const gia = await saLeggiAccrediti();
    if (!gia.length) { saMsg("Non c'è nessun accredito da annullare"); return; }
    if (gia.some(p => p.erogato)) { saMsg("❌ Il nuovo bilancio è già aperto: i FM sono stati erogati e da qui non si annulla", true); return; }
    if (!confirm(`Annullo gli sponsor annuali ${st}?\n\nTolgo i FM in attesa di ${gia.length} squadre e rimetto a posto i tifosi.`)) return;

    const { data: logs, error } = await sb.from("sponsor_eventi").select("id,squadra_id,tifosi")
      .eq("giornata", 0).eq("tipo_sponsor", "annuale_stagione").eq("nome_sponsor", `Sponsor annuali ${st}`);
    if (error) throw error;
    const falliti = [];
    for (const p of gia) {
      const lg = (logs || []).find(l => String(l.squadra_id) === String(p.squadra_id));
      try {
        if (lg) {
          let vecchi = null;
          if (Number(lg.tifosi)) {
            const { data: sq, error: e1 } = await sb.from("squadre").select("tifosi").eq("id", p.squadra_id).single();
            if (e1 || !sq) throw new Error("tifosi non letti");
            vecchi = Number(sq.tifosi) || 0;
            const { data: agg, error: e2 } = await sb.from("squadre").update({ tifosi: Math.max(0, vecchi - Number(lg.tifosi)) }).eq("id", p.squadra_id).select("id");
            if (e2 || !agg || agg.length !== 1) throw new Error("tifosi non rimessi a posto");
          }
          const { error: e3 } = await sb.from("sponsor_eventi").delete().eq("id", lg.id);
          if (e3) {
            if (vecchi !== null) await sb.from("squadre").update({ tifosi: vecchi }).eq("id", p.squadra_id);
            throw new Error("log non cancellato");
          }
        }
        const { error: e4 } = await sb.from("bilancio_pending").delete().eq("id", p.id);
        if (e4) throw new Error("movimento in attesa non cancellato (controlla nel bilancio: il log e i tifosi sono già a posto)");
        if (typeof bilancePending !== "undefined") { const i = bilancePending.findIndex(x => x.id === p.id); if (i >= 0) bilancePending.splice(i, 1); }
      } catch (e) { falliti.push(`${(squadreDB.find(s => String(s.id) === String(p.squadra_id)) || {}).nome || p.squadra_id}: ${e.message}`); }
    }
    if (typeof gsRinfrescaSquadre === "function") await gsRinfrescaSquadre();
    if (falliti.length) { alert("Alcune squadre non sono state annullate:\n\n" + falliti.join("\n")); saMsg("⚠️ Annullamento parziale: riprova", true); }
    else saMsg(`✅ Accredito sponsor annuali ${st} annullato`);
    await saCalcolaOra(true);
  } catch (e) {
    saMsg("❌ " + e.message, true);
  } finally {
    saInCorso = false;
  }
}
