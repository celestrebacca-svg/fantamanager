// ===== ENTRATE STADIO DI GIORNATA =====
// Anteprima + accredito al budget + registro nel log sponsor (sponsor_eventi).
// Richiede (già nell'app): stadio.js, fastfood.js, gestione-sponsor.js, entrate-giornata.js.
//
// Come si usa: apriAnteprimaStadio() -> scegli la giornata -> controlli i numeri -> CONFERMA E ACCREDITA.
//
// Maglie 7/9/10: nessuna scelta da fare qui, uso il numero di maglia già salvato dall'import sponsor.
// Portiere e capitano: stesso ordine dello sponsor (scelta fatta ora -> abbinamento salvato -> nome uguale/simile).
//   Se nessun nome combacia compare un menu: scegli il giocatore nel file oppure "Non ha giocato".
//   Una scelta di giocatore si salva in mappa_nomi_voti (la stessa tabella dello sponsor) e dalla prossima giornata è automatica.
//   "Non ha giocato" vale solo per quella giornata.
//
// Sicurezze:
//  - non si accredita finché ci sono giocatori "da scegliere"
//  - ogni incasso è una riga in sponsor_eventi (tipo "stadio_..."): una giornata si accredita UNA sola volta
//  - se il budget non si aggiorna, la riga del log viene tolta subito (niente soldi a metà)
//  - "Annulla giornata" di gestione-sponsor.js storna anche questi incassi (cancella gli eventi di quella giornata)

const ES_TIPI = ["stadio_biglietteria", "stadio_fastfood", "stadio_magliette"];
const ES_RUOLI = [["portiere", "Portiere"], ["capitano", "Capitano"]];
let esInCorso = false;
let esScelte = {};  // "giornata|squadra|ruolo" -> { tipo: "nessuno" } | { tipo: "file", nome }
let esCache = null; // dati della giornata aperta, per non rileggere il database a ogni scelta

async function esCaricaGiornate() {
  const { data, error } = await sb.from("giornate_import")
    .select("giornata,squadra_id,totale,risultato,casa_o_trasferta,avversario_id,giocatori");
  if (error) throw error;
  return data || [];
}

// Squadre lette FRESCHE dal database: dopo un import sponsor tifosi e budget cambiano, la copia in memoria può essere vecchia.
async function esCaricaSquadre() {
  const { data, error } = await sb.from("squadre")
    .select("id,nome,tifosi,budget,capienza_stadio,fastfood_livello,social_followers,maglie,piazzamento");
  if (error) throw error;
  return data || [];
}

// Nomi dei giocatori con maglia portiere/capitano (gsAssicuraGiocatoriMaglie legge solo 7/9/10)
async function esAssicuraNomi(squadre) {
  const ids = new Set();
  for (const sq of squadre) {
    const m = gsMaglieSquadra(sq) || {};
    for (const k of ["portiere", "capitano"]) if (m[k]) ids.add(String(m[k]));
  }
  const mancanti = [...ids].filter(id => !gsNomeGiocatoreById(id));
  if (!mancanti.length) return;
  const { data } = await sb.from("giocatori").select("id,nome").in("id", mancanti);
  for (const g of data || []) gsGiocatoriCache[String(g.id)] = g.nome;
}

// Classifica PRIMA della giornata N, dalle giornate importate: 3 vittoria, 1 pareggio, 0 sconfitta.
// Vince chi ha il punteggio totale più alto (come competizioni.js). A parità di punti: Magic punti totale.
function esClassificaPrima(righe, N, squadre) {
  const st = {};
  squadre.forEach(s => { st[s.id] = { id: s.id, punti: 0, magic: 0, giocate: 0 }; });
  const passate = righe.filter(r => r.giornata < N);
  for (const r of passate) {
    const mio = st[r.squadra_id];
    if (!mio) continue;
    const a = Number(r.totale) || 0;
    mio.magic += a;
    const avv = passate.find(x => x.giornata === r.giornata && x.squadra_id === r.avversario_id);
    if (!avv) continue;
    const b = Number(avv.totale) || 0;
    mio.giocate++;
    mio.punti += a > b ? 3 : a === b ? 1 : 0;
  }
  const lista = Object.values(st).sort((x, y) => y.punti - x.punti || y.magic - x.magic);
  lista.forEach((s, i) => { s.posizione = i + 1; });
  return lista;
}

function esConteggi(g) {
  return {
    gol: gsConta(g.gol, GS_PESO.gol),
    assist: gsConta(g.assist, GS_PESO.assistStd) + gsConta(g.assistSoft, GS_PESO.assistSoft) + gsConta(g.assistGold, GS_PESO.assistGold),
  };
}

// Trova portiere o capitano di una squadra nel file della giornata (ordine come nello sponsor).
// stato: ok | nongiocato | daScegliere | errore | nonassegnata
function esRisolviRuolo(N, sq, giocatori, ruolo, etichetta) {
  const m = gsMaglieSquadra(sq) || {};
  const id = m[ruolo];
  const base = { ruolo, etichetta, giocatoreId: id || null, nomeRosa: null, gi: null, stato: "nonassegnata", fonte: "", testo: "", valore: "", daSalvare: null };
  if (!id) return base;
  base.nomeRosa = gsNomeGiocatoreById(id) || null;

  const sc = esScelte[`${N}|${sq.id}|${ruolo}`];
  if (sc) {
    if (sc.tipo === "nessuno") {
      return { ...base, stato: "nongiocato", fonte: "scelta", valore: "nessuno", testo: `${etichetta}${base.nomeRosa ? " (" + base.nomeRosa + ")" : ""}: confermato non ha giocato, nessuna vendita` };
    }
    const idx = giocatori.findIndex(g => g.nome === sc.nome);
    if (idx >= 0) {
      const pulito = String(giocatori[idx].nome).replace(/[ⒸⓋ]/g, "").trim();
      return { ...base, stato: "ok", fonte: "scelta", gi: giocatori[idx], valore: String(idx),
        daSalvare: { giocatoreId: id, nomeVoti: pulito }, testo: `${etichetta}: scelto a mano "${pulito}" (si ricorda dalla prossima giornata)` };
    }
  }
  if (!base.nomeRosa) {
    return { ...base, stato: "errore", testo: `${etichetta}: il giocatore assegnato (id ${id}) non è nell'elenco giocatori: scegli chi è nel file` };
  }
  const salvato = gsMappaNomi[String(id)];
  if (salvato) {
    const pul = gsPulisciNome(salvato);
    const gi = giocatori.find(g => gsPulisciNome(g.nome) === pul);
    if (gi) return { ...base, stato: "ok", fonte: "salvato", gi };
    return { ...base, stato: "nongiocato", fonte: "salvato", testo: `${etichetta} (${base.nomeRosa}): non schierato in questa giornata, nessuna vendita` };
  }
  const t = gsTrovaGiocatoreFile(giocatori, base.nomeRosa);
  if (t.gi) return { ...base, stato: "ok", fonte: "nome", gi: t.gi };
  return { ...base, stato: "daScegliere", testo: `${etichetta} (${base.nomeRosa}): nessun nome combacia, scegli chi è nel file oppure conferma che non ha giocato` };
}

// Eventi delle magliette di una squadra in una giornata, letti dal file voti già salvato.
function esEventiMaglie(sq, giocatori, N) {
  const lista = giocatori || [];
  const note = [];  // avvisi veri
  const info = [];  // situazioni normali: non in campo, infortunato, non scelto
  const eventi = { n7: { gol: 0, assist: 0 }, n9: { gol: 0, assist: 0 }, n10: { gol: 0, assist: 0 }, portiere: { cleansheet: 0 } };

  for (const g of lista) {
    const num = Number(g.maglia); // numero di maglia di QUELLA giornata, già deciso dall'import sponsor
    if (!g.haContato || ![7, 9, 10].includes(num)) continue;
    const c = esConteggi(g);
    eventi["n" + num].gol += c.gol;
    eventi["n" + num].assist += c.assist;
  }

  const sel = ES_RUOLI.map(([ruolo, etichetta]) => esRisolviRuolo(N, sq, lista, ruolo, etichetta));
  const por = sel[0], cap = sel[1];
  if (por.gi && por.gi.haContato && !por.gi.golSubiti) eventi.portiere.cleansheet = 1; // ha giocato senza gol subiti
  let capitanoVoto = null;
  if (cap.gi && cap.gi.haContato && typeof cap.gi.voto === "number") capitanoVoto = cap.gi.voto;

  for (const s of sel) {
    if (s.gi && !s.gi.haContato) info.push(`${s.etichetta} (${s.gi.nome}) non ha contato (panchina o senza voto): nessuna vendita`);
    else if (s.stato === "nongiocato") info.push(s.testo);
  }
  return { eventi, capitanoVoto, note, info, sel };
}

// Calcola una giornata già importata. Non scrive niente. usaCache = true: non rilegge i dati (solo dopo una scelta nel menu).
async function esAnteprima(N, usaCache) {
  let dati;
  if (usaCache && esCache && esCache.N === N) dati = esCache;
  else {
    const [righe, squadre] = await Promise.all([esCaricaGiornate(), esCaricaSquadre()]);
    await esAssicuraNomi(squadre);
    await gsCaricaMappaNomi();
    dati = esCache = { N, righe, squadre };
  }
  const { righe, squadre } = dati;
  const delN = righe.filter(r => r.giornata === N);
  if (!delN.length) throw new Error(`La giornata ${N} non risulta ancora importata`);

  const { data: gia, error: eG } = await sb.from("sponsor_eventi").select("id,tipo_sponsor").eq("giornata", N).like("tipo_sponsor", "stadio_%");
  if (eG) throw eG;

  const classifica = esClassificaPrima(righe, N, squadre);
  const haStorico = righe.some(r => r.giornata < N);
  const posDi = sq => haStorico ? (classifica.find(s => s.id === sq.id) || {}).posizione : (sq.piazzamento || 12);

  const out = [];
  for (const r of delN) {
    const sq = squadre.find(s => s.id === r.squadra_id);
    if (!sq) continue;
    const kit = !!((gsMaglieSquadra(sq) || {}).upgrade_kit);
    const ev = esEventiMaglie(sq, r.giocatori, N);
    const mag = calcMaglieGiornata({
      eventi: ev.eventi, capitanoVoto: ev.capitanoVoto, kit,
      tifosi: sq.tifosi || 0, follower: sq.social_followers || 0, primaGiornata: N === 1,
    });
    let stadio = null;
    if (r.casa_o_trasferta === "casa") {
      const pos = posDi(sq);
      const b = calcBiglietteriaPartita(sq.tifosi, sq.capienza_stadio, pos);
      stadio = { posizione: pos, paganti: b.paganti, biglietteria: b.incasso, fastFood: calcFastFoodPartita(sq.fastfood_livello || 0, b.paganti) };
    }
    out.push({
      id: sq.id, squadra: sq.nome, casa: !!stadio, stadio, magliette: mag, note: ev.note, info: ev.info, sel: ev.sel,
      file: (r.giocatori || []).map((g, i) => ({ idx: i, nome: g.nome, ruolo: g.ruolo })),
      totale: (stadio ? stadio.biglietteria + stadio.fastFood : 0) + mag.incasso,
    });
  }
  const daScegliere = out.reduce((n, r) => n + r.sel.filter(s => s.stato === "daScegliere" || s.stato === "errore").length, 0);
  return { giornata: N, haStorico, classifica, gia: (gia || []).length, daScegliere, righe: out };
}

// Righe da scrivere nel log sponsor (solo importi diversi da zero)
function esEventiDaRegistrare(res) {
  const ev = [];
  for (const r of res.righe) {
    const s = r.stadio, m = r.magliette;
    if (s && s.biglietteria > 0) ev.push({ id: r.id, squadra: r.squadra, tipo: "stadio_biglietteria", nome: "Stadio — Biglietteria", soldi: s.biglietteria,
      dettaglio: `${s.paganti} paganti × ${ES_PREZZO_BIGLIETTO} FM (${s.posizione}° in classifica)` });
    if (s && s.fastFood > 0) ev.push({ id: r.id, squadra: r.squadra, tipo: "stadio_fastfood", nome: "Stadio — Fast food", soldi: s.fastFood,
      dettaglio: `${s.paganti} paganti, fast food incasso partita` });
    if (m.incasso > 0) ev.push({ id: r.id, squadra: r.squadra, tipo: "stadio_magliette", nome: "Stadio — Magliette", soldi: m.incasso,
      dettaglio: `${m.pctTifosi.toFixed(2)}% tifosi (${m.venduteTifosi}) + ${m.pctFollower.toFixed(2)}% follower (${m.venduteFollower})` });
  }
  return ev;
}

// Scelta fatta nel menu di portiere/capitano ("" = annulla la scelta, "nessuno" = non ha giocato, numero = giocatore del file)
async function esScegli(N, sqId, ruolo, valore) {
  const key = `${N}|${sqId}|${ruolo}`;
  if (valore === "") delete esScelte[key];
  else if (valore === "nessuno") esScelte[key] = { tipo: "nessuno" };
  else {
    const r = esCache && esCache.righe.find(x => x.giornata === N && String(x.squadra_id) === String(sqId));
    const g = r && (r.giocatori || [])[parseInt(valore)];
    if (!g) return;
    esScelte[key] = { tipo: "file", nome: g.nome };
  }
  try { esMostra(await esAnteprima(N, true)); }
  catch (e) { esAvviso("❌ " + e.message, "error"); }
}

// ACCREDITO AL BUDGET (dopo conferma). Ricalcola tutto al momento, non si fida della schermata.
async function esConferma(N) {
  if (esInCorso) return;
  esInCorso = true;
  try {
    const res = await esAnteprima(N);
    if (res.gia > 0) { esAvviso(`❌ Giornata ${N}: incassi stadio già accreditati, non li ripeto`, "error"); return; }
    if (res.daScegliere > 0) { esAvviso(`❌ Prima scegli i ${res.daScegliere} giocatori da confermare (menu in alto)`, "error"); esMostra(res); return; }
    const eventi = esEventiDaRegistrare(res);
    if (!eventi.length) { esAvviso("Niente da accreditare per questa giornata"); return; }
    const tot = eventi.reduce((s, e) => s + e.soldi, 0);
    if (!confirm(`Accredito gli incassi stadio della giornata ${N}?\n\n${eventi.length} voci, totale ${fmtM(tot)} sul budget delle squadre.`)) return;

    const falliti = [];
    for (const e of eventi) {
      const { data: ins, error: e1 } = await sb.from("sponsor_eventi").insert({
        giornata: N, squadra_id: e.id, tipo_sponsor: e.tipo, nome_sponsor: e.nome, soldi: e.soldi, tifosi: 0, dettaglio: e.dettaglio,
      }).select("id");
      if (e1 || !ins || !ins.length) { falliti.push(`${e.squadra}: ${e.nome} (log non scritto)`); continue; }

      const { data: sqd, error: e2 } = await sb.from("squadre").select("budget").eq("id", e.id).single();
      let nuovo = null, ok = !e2;
      if (ok) {
        nuovo = gsSommaBudget(sqd && sqd.budget, e.soldi);
        const { data: agg, error: e3 } = await sb.from("squadre").update({ budget: nuovo }).eq("id", e.id).select("id");
        ok = !e3 && agg && agg.length === 1;
      }
      if (!ok) {
        await sb.from("sponsor_eventi").delete().eq("id", ins[0].id); // niente riga di log senza soldi
        falliti.push(`${e.squadra}: ${e.nome} (budget non aggiornato)`);
        continue;
      }
      const loc = squadreDB.find(s => s.id === e.id);
      if (loc) loc.budget = nuovo;
      if (typeof utenteLoggato !== "undefined" && utenteLoggato && utenteLoggato.id === e.id) utenteLoggato.budget = nuovo;
    }

    // Ricordo i giocatori scelti a mano (come fa lo sponsor): dalla prossima giornata sono automatici
    const daSalvare = res.righe.flatMap(r => r.sel.filter(s => s.daSalvare).map(s => s.daSalvare));
    let avvisoMappa = "";
    if (daSalvare.length) {
      try { await gsSalvaMappaNomi(daSalvare); }
      catch (err) { avvisoMappa = " (attenzione: gli abbinamenti scelti non sono stati salvati: " + err.message + ")"; }
    }
    for (const k of Object.keys(esScelte)) if (k.startsWith(N + "|")) delete esScelte[k];

    if (falliti.length) {
      alert("Alcune voci NON sono state accreditate (e non hanno lasciato tracce):\n\n" + falliti.join("\n") + "\n\nNon rifare tutta la giornata: contattami con questo elenco.");
      esAvviso("⚠️ Accredito parziale", "error");
    } else {
      esAvviso(`✅ Giornata ${N}: ${eventi.length} incassi stadio accreditati${avvisoMappa}`, avvisoMappa ? "error" : undefined);
    }
    esMostra(await esAnteprima(N));
  } catch (e) {
    esAvviso("❌ " + e.message, "error");
  } finally {
    esInCorso = false;
  }
}

// ---- Schermata ----
// Messaggio scritto nel pannello (il toast da solo può restare nascosto dietro la finestra Tabelle)
function esAvviso(msg, tipo) {
  const e = document.getElementById("es-esito");
  if (e) e.innerHTML = `<div class="gs-warn" style="margin:8px 0"><b>${esEsc(msg)}</b></div>`;
  try { showToast(msg, tipo); } catch (_) {}
}

function esEsc(t) { return String(t).replace(/[<>&"]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c])); }

function esMenuScelta(N, r, s) {
  const haP = r.file.some(f => /^P/i.test(String(f.ruolo || "")));
  const opz = r.file.filter(f => s.ruolo !== "portiere" || !haP || /^P/i.test(String(f.ruolo || "")));
  const bisogno = s.stato === "daScegliere" || s.stato === "errore";
  return `<div style="margin-top:4px;padding:6px;border-radius:6px;border:1px solid ${bisogno ? "var(--oro)" : "var(--grigio-chiaro)"}">
    <div style="font-size:11px;color:${bisogno ? "var(--oro)" : "var(--testo-dim)"};margin-bottom:4px">${bisogno ? "👉 " : ""}${esEsc(s.testo)}</div>
    <select onchange="esScegli(${N},'${r.id}','${s.ruolo}',this.value)" style="width:100%;padding:6px;border-radius:6px;background:var(--grigio-scuro);color:var(--testo);border:1px solid var(--grigio-chiaro);font-size:12px">
      <option value="">— scegli —</option>
      <option value="nessuno" ${s.valore === "nessuno" ? "selected" : ""}>❌ Non ha giocato</option>
      ${opz.map(f => `<option value="${f.idx}" ${s.valore === String(f.idx) ? "selected" : ""}>${esEsc(f.nome)}${f.ruolo ? " (" + esEsc(f.ruolo) + ")" : ""}</option>`).join("")}
    </select></div>`;
}

function esRiga(r, res) {
  const s = r.stadio, m = r.magliette;
  const modificabile = res.gia === 0;
  const menu = modificabile
    ? r.sel.filter(x => x.stato === "daScegliere" || x.stato === "errore" || x.fonte === "scelta").map(x => esMenuScelta(res.giornata, r, x)).join("")
    : "";
  const infoRighe = r.info.filter(t => !(modificabile && r.sel.some(x => x.fonte === "scelta" && x.testo === t)));
  return `<div style="background:var(--grigio);border-radius:8px;padding:10px;margin-bottom:8px;font-size:12px">
    <div style="display:flex;justify-content:space-between;font-weight:700"><span>${r.casa ? "🏠" : "✈️"} ${esEsc(r.squadra)}</span><span style="color:var(--verde)">${fmtM(r.totale)}</span></div>
    ${s ? `<div style="color:var(--testo-dim)">${s.posizione}° • ${s.paganti.toLocaleString("it-IT")} paganti • biglietteria ${fmtM(s.biglietteria)} • fast food ${fmtM(s.fastFood)}</div>` : `<div style="color:var(--testo-dim)">In trasferta: nessun incasso stadio</div>`}
    <div style="color:var(--testo-dim)">Magliette: ${m.pctTifosi.toFixed(2)}% tifosi (${m.venduteTifosi.toLocaleString("it-IT")}) + ${m.pctFollower.toFixed(2)}% follower (${m.venduteFollower.toLocaleString("it-IT")}) = ${fmtM(m.incasso)}</div>
    ${infoRighe.map(n => `<div style="color:var(--testo-dim)">ℹ️ ${esEsc(n)}</div>`).join("")}
    ${r.note.map(n => `<div style="color:var(--rosso)">⚠️ ${esEsc(n)}</div>`).join("")}
    ${menu}
  </div>`;
}

function esHtml(res) {
  // prima le squadre che richiedono una scelta, poi quelle in casa
  const peso = r => (r.sel.some(x => x.stato === "daScegliere" || x.stato === "errore") ? 2 : 0) + (r.casa ? 1 : 0);
  const righe = [...res.righe].sort((a, b) => peso(b) - peso(a));
  const tot = righe.reduce((s, r) => s + r.totale, 0);
  const avvisi = righe.reduce((n, r) => n + r.note.length, 0);
  let azione;
  if (res.gia > 0) {
    azione = `<div style="background:rgba(0,255,135,0.1);border:1px solid var(--verde);border-radius:8px;padding:10px;text-align:center;font-size:12px;margin-bottom:10px">✅ Incassi già accreditati (${res.gia} voci nel log sponsor)</div>`;
  } else if (res.daScegliere > 0) {
    azione = `<div style="background:rgba(255,215,0,0.1);border:1px solid var(--oro);border-radius:8px;padding:10px;text-align:center;font-size:12px;margin-bottom:10px;color:var(--oro)">⚠️ Prima scegli ${res.daScegliere} giocatori (menu qui sotto): poi potrai accreditare</div>`;
  } else {
    azione = `<button onclick="esConferma(${res.giornata})" style="width:100%;padding:12px;border-radius:8px;border:none;background:var(--verde);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1px;cursor:pointer;margin-bottom:10px">✅ CONFERMA E ACCREDITA (${fmtM(tot)})</button>
       ${avvisi ? `<div style="font-size:11px;color:var(--rosso);margin-bottom:8px">Ci sono ${avvisi} avvisi: controllali prima di accreditare.</div>` : ""}`;
  }
  return azione +
    (res.haStorico ? "" : `<div style="font-size:11px;color:var(--testo-dim);margin-bottom:8px">Nessuna giornata precedente: uso il piazzamento salvato.</div>`) +
    righe.map(r => esRiga(r, res)).join("");
}

function esMostra(res) {
  const html = esHtml(res);
  const pan = document.getElementById("es-pannello"); // scheda "Entrate stadio" dentro Tabelle
  if (pan) {
    pan.innerHTML = `<div style="font-weight:700;margin:6px 0 10px">🏟️ STADIO — GIORNATA ${res.giornata}</div>` + html;
    return;
  }
  let m = document.getElementById("modal-es-anteprima");
  if (!m) {
    m = document.createElement("div");
    m.id = "modal-es-anteprima";
    m.className = "modal-overlay";
    m.innerHTML = `<div class="modal-content" style="max-width:420px">
      <div class="modal-header"><h2 class="modal-title" id="es-titolo"></h2>
      <button class="modal-close" onclick="document.getElementById('modal-es-anteprima').classList.remove('open')">✕</button></div>
      <div class="modal-body" id="es-body"></div></div>`;
    document.body.appendChild(m);
  }
  document.getElementById("es-titolo").textContent = `🏟️ STADIO — GIORNATA ${res.giornata}`;
  document.getElementById("es-body").innerHTML = html;
  m.classList.add("open");
}

// Scheda "🏟️ Entrate stadio" nella finestra Tabelle (la chiama gsMostraTab di gestione-sponsor.js)
function gsRenderStadio(body) {
  body.innerHTML = `
    <div style="border:2px dashed var(--grigio-chiaro,#333);border-radius:14px;padding:16px;text-align:center">
      <div style="margin-bottom:10px">Calcola e accredita gli incassi dello stadio di una giornata <b>già importata</b>: biglietteria e fast food (chi gioca in casa), magliette (tutte le squadre).</div>
      <input type="number" id="es-num" placeholder="N. giornata" style="width:100px;padding:6px;border-radius:6px;border:1px solid var(--grigio-chiaro,#333);background:var(--grigio-medio,#222);color:#eee;margin-bottom:10px">
      <br><button class="gs-btn" onclick="esCalcolaDaPannello()">🏟️ Calcola giornata</button>
    </div>
    <div id="es-esito"></div>
    <div id="es-pannello" style="margin-top:12px"></div>`;
}

async function esCalcolaDaPannello() {
  const N = parseInt((document.getElementById("es-num") || {}).value);
  if (!N) { esAvviso("❌ Inserisci il numero della giornata", "error"); return; }
  const e = document.getElementById("es-esito");
  if (e) e.innerHTML = `<div class="gs-warn" style="margin:8px 0">⏳ Calcolo la giornata ${N}...</div>`;
  try {
    esMostra(await esAnteprima(N));
    if (e) e.innerHTML = "";
  } catch (err) { esAvviso("❌ " + err.message, "error"); }
}

async function apriAnteprimaStadio() {
  if (typeof apriTabelle === "function" && typeof gsMostraTab === "function") { apriTabelle(); gsMostraTab("stadio"); return; }
  const N = parseInt(prompt("Numero giornata da calcolare:"));
  if (!N) return;
  try { esMostra(await esAnteprima(N)); }
  catch (e) { esAvviso("❌ " + e.message, "error"); }
}
