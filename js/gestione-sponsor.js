// ===== TABELLE: SPONSOR SETTIMANALI =====
// Dipende da: sb, squadreDB, showToast, STAGIONE_CORRENTE (gia' presenti nel progetto)
// Richiede la libreria SheetJS (xlsx.full.min.js) caricata PRIMA di questo file.

// --- Mappatura nomi squadra: nome nel file voti importato -> nome vero in Fantamanager Gold ---
// Da aggiornare se l'app di origine dei voti cambia i nomi placeholder.
const GS_MAPPATURA_SQUADRE = {
  "Trump olino": "Mjolnir",
  "Goat United Fc": "Goat United",
  "Athenion": "Athenion FC",
  "Aston Birra": "Olympion",
  "Complimenti per la vittoria": "Blasphemion",
  "HOOD FC": "Hood FC",
  "Cremonegre": "Helborn",
  "Hadysposizione": "Valdyr FC",
  "THE CALYPSO BOYS": "Anonymous FC",
  "Yildizocuppati": "Leonidas",
  "HELLAS MADONNA": "Venomstrike FC",
  "PERSEUS FC": "Perseus FC",
};

// --- Derby fissi della lega (per il bonus vittoria/sconfitta derby) ---
const GS_DERBY = [
  ["Hood FC", "Perseus FC"],
  ["Venomstrike FC", "Goat United"],
  ["Anonymous FC", "Valdyr FC"],
  ["Athenion FC", "Olympion"],
  ["Mjolnir", "Blasphemion"],
  ["Helborn", "Leonidas"],
];
function gsEDerby(a, b) {
  return GS_DERBY.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

// --- Tabella sponsor settimanali (identica al riferimento dell'admin) ---
const GS_SPONSOR = {
  tripletta_gol:         { nome: "Tripletta in campo",             soldi: 2500000,  tifosi: 100 },
  tripletta_assist:      { nome: "Tripletta assist in campo",      soldi: 3500000,  tifosi: 90 },
  doppietta_gol:         { nome: "Doppietta in campo",             soldi: 600000,   tifosi: 50 },
  doppietta_assist:      { nome: "Doppietta assist",               soldi: 800000,   tifosi: 40 },
  vittoria_derby:        { nome: "Vittoria derby",                 soldi: 300000,   tifosi: 70 },
  sconfitta_derby:       { nome: "Sconfitta derby",                soldi: -300000,  tifosi: -50 },
  punteggio_sotto60:     { nome: "Punteggio minore a 60",          soldi: -500000,  tifosi: -15 },
  punteggio_sopra80:     { nome: "Punteggio + di 80",              soldi: 500000,   tifosi: 40 },
  punteggio_sopra90:     { nome: "Punteggio = o + di 90",          soldi: 1500000,  tifosi: 70 },
  vittoria_trasferta:    { nome: "Vittoria in trasferta",          soldi: 150000,   tifosi: 15 },
  sconfitta_casa_tifosi: { nome: "Sconfitta davanti ai propri tifosi", soldi: -150000, tifosi: -15 },
  espulsione:            { nome: "Espulsione calciatore in campo", soldi: -300000,  tifosi: -30 },
  mvp_voto:              { nome: "Miglior giocatore di giornata (voto senza bonus)", soldi: 700000, tifosi: 60 },
  mvp_fantavoto:         { nome: "Miglior giocatore di giornata (con i bonus)",      soldi: 500000, tifosi: 60 },
  peggiore_voto:         { nome: "Peggior giocatore di giornata (voto senza malus, con portieri)", soldi: -500000, tifosi: -30 },
  peggiore_fantavoto:    { nome: "Peggior giocatore di giornata (con i malus, senza portieri)",    soldi: -350000, tifosi: -20 },
  punteggio_top_sett:    { nome: "Punteggio più alto settimanale", soldi: 350000,   tifosi: 30 },
  punteggio_basso_sett:  { nome: "Punteggio più basso settimanale", soldi: -200000, tifosi: -10 },
};
// NOTA: vittoria/sconfitta allenatore e bonus maglia 7/9/10 non sono ancora qui:
// richiedono rispettivamente il collegamento a football-data.org e l'assegnazione
// manuale dei numeri di maglia (squadre.maglia_7/9/10_giocatore_id) - prossimo passo.

// Pesi confermati per leggere conteggi reali dalle colonne-punti del file voti
const GS_PESO = { gol: 3, assistStd: 1, assistSoft: 0.5, assistGold: 1.5 };
const GS_COLORE_AMMONIZIONE = "FFFACC15"; // confermato (giallo)

// --- Tabella 5 giornate: mini-classifica che si ripete ogni 5 giornate (1-5, 6-10, 11-15, ...) ---
const GS_TABELLA5 = [
  { pos: 1, soldi: 2000000, tifosi: 90 },
  { pos: 2, soldi: 1500000, tifosi: 80 },
  { pos: 3, soldi: 1200000, tifosi: 65 },
  { pos: 4, soldi: 1000000, tifosi: 60 },
  { pos: 5, soldi: 800000, tifosi: 50 },
  { pos: 6, soldi: 600000, tifosi: 40 },
  { pos: 7, soldi: 400000, tifosi: 30 },
  { pos: 8, soldi: 200000, tifosi: 20 },
  { pos: 9, soldi: 100000, tifosi: 10 },
  { pos: 10, soldi: 50000, tifosi: 5 },
  { pos: 11, soldi: -100000, tifosi: 0 },
  { pos: 12, soldi: -200000, tifosi: -15 },
];

// ============================================================
// 1) LETTURA DEL FILE XLSX
// ============================================================
function gsVal(ws, r, c) {
  const addr = XLSX.utils.encode_cell({ r: r - 1, c: c - 1 });
  const cell = ws[addr];
  if (!cell) return null;
  const v = cell.v;
  // SheetJS a volte restituisce stringa vuota per celle vuote (openpyxl dava None):
  // tratto "" come assenza di valore, altrimenti i blocchi non si fermano al punto giusto.
  if (v === undefined || v === "") return null;
  return v;
}
function gsFillColor(ws, r, c) {
  const addr = XLSX.utils.encode_cell({ r: r - 1, c: c - 1 });
  const cell = ws[addr];
  try {
    const rgb = cell && cell.s && cell.s.fgColor && cell.s.fgColor.rgb;
    return rgb ? ("FF" + rgb.slice(-6)).toUpperCase() : null;
  } catch (e) { return null; }
}
function gsTestoGrigio(ws, r, c) {
  const addr = XLSX.utils.encode_cell({ r: r - 1, c: c - 1 });
  const cell = ws[addr];
  try {
    const rgb = cell && cell.s && cell.s.color && cell.s.color.rgb;
    if (!rgb) return null; // stile non leggibile: non sappiamo dire, lasciamo decidere all'admin
    return ("FF" + rgb.slice(-6)).toUpperCase() === "00A0A7B1" || rgb.toUpperCase().endsWith("A0A7B1");
  } catch (e) { return null; }
}

function gsLeggiBloccoSquadra(ws, maxRow, r0, baseCol) {
  const modulo = gsVal(ws, r0, baseCol + 1);
  const totale = gsVal(ws, r0, baseCol + 5);
  let r = r0 + 3; // salta "Voti|Bonus e Malus" + "Ruolo|Calciatore|..."
  const giocatori = [];
  let sezione = "titolare";
  let trovatoModificatori = false;
  while (r <= maxRow) {
    const c0 = gsVal(ws, r, baseCol);
    if (c0 === "Panchina") { sezione = "panchina"; r++; continue; }
    if (c0 === "Modificatori") { trovatoModificatori = true; break; }
    const nome = gsVal(ws, r, baseCol + 1);
    if (nome === null && c0 === null) { r++; continue; }
    if (nome === null) {
      // nessuna sezione Modificatori per questa squadra: la riga corrente
      // e' gia' l'intestazione della prossima partita, non consumarla
      return { modulo, totale, giocatori, modificatori: {}, rigaFine: r - 1 };
    }
    const grigio = gsTestoGrigio(ws, r, baseCol + 1);
    giocatori.push({
      ruolo: c0, nome, squadraReale: gsVal(ws, r, baseCol + 3),
      voto: gsVal(ws, r, baseCol + 4), fantavoto: gsVal(ws, r, baseCol + 5),
      gol: gsVal(ws, r, baseCol + 6), assist: gsVal(ws, r, baseCol + 12),
      assistSoft: gsVal(ws, r, baseCol + 13), assistGold: gsVal(ws, r, baseCol + 14),
      sezione, haContato: grigio === null ? true : !grigio,
      cartellinoColore: gsFillColor(ws, r, baseCol + 2),
      capitano: String(nome).includes("Ⓒ"), viceCapitano: String(nome).includes("Ⓥ"),
    });
    r++;
  }
  let modificatori = {};
  if (trovatoModificatori) {
    r++;
    while (r <= maxRow) {
      const label = gsVal(ws, r, baseCol);
      if (label === null) break;
      modificatori[label] = gsVal(ws, r, baseCol + 5);
      r++;
    }
  }
  return { modulo, totale, giocatori, modificatori, rigaFine: r };
}

function gsParsaGiornata(workbook) {
  const ws = workbook.Sheets[workbook.SheetNames[0]];
  const ref = ws["!ref"];
  const range = XLSX.utils.decode_range(ref);
  const maxRow = range.e.r + 1;
  const partite = [];
  let r = 5;
  while (r <= maxRow) {
    const sxNome = gsVal(ws, r, 1);
    const risultato = gsVal(ws, r, 17);
    const dxNome = gsVal(ws, r, 18);
    if (sxNome && dxNome && risultato) {
      const rModulo = r + 2;
      const sx = gsLeggiBloccoSquadra(ws, maxRow, rModulo, 1);
      const dx = gsLeggiBloccoSquadra(ws, maxRow, rModulo, 18);
      partite.push({ casa: sxNome, trasferta: dxNome, risultato, squadraCasa: sx, squadraTrasferta: dx });
      r = Math.max(sx.rigaFine, dx.rigaFine) + 1;
    } else {
      r++;
    }
  }
  return partite;
}

function gsNomeVero(nomeFile) {
  return GS_MAPPATURA_SQUADRE[nomeFile] || nomeFile;
}

// ============================================================
// 2) CALCOLO SPONSOR SETTIMANALI
// ============================================================
function gsConta(valore, peso) {
  const v = typeof valore === "number" ? valore : 0;
  return v ? Math.round(v / peso) : 0;
}

function gsCalcolaSponsor(partite) {
  const eventi = [];
  const totali = {}; // nomeSquadraVero -> {soldi, tifosi}
  const incerti = [];
  const squadreTotali = [];
  const tuttiGiocatori = [];

  function aggiungi(squadra, chiave, dettaglio) {
    const s = GS_SPONSOR[chiave];
    if (!totali[squadra]) totali[squadra] = { soldi: 0, tifosi: 0 };
    totali[squadra].soldi += s.soldi;
    totali[squadra].tifosi += s.tifosi;
    eventi.push({ squadra, tipo: chiave, nome: s.nome, soldi: s.soldi, tifosi: s.tifosi, dettaglio });
  }

  for (const p of partite) {
    const casa = gsNomeVero(p.casa), trasf = gsNomeVero(p.trasferta);
    const m = /^(\d+)-(\d+)$/.exec(String(p.risultato || "").trim());
    const risultatoOk = !!m;
    const gCasa = risultatoOk ? parseInt(m[1]) : null;
    const gTrasf = risultatoOk ? parseInt(m[2]) : null;
    const isDerby = gsEDerby(casa, trasf);

    for (const [nomeSq, blocco] of [[casa, p.squadraCasa], [trasf, p.squadraTrasferta]]) {
      const totale = blocco.totale;
      if (typeof totale === "number") {
        squadreTotali.push([nomeSq, totale]);
        if (totale < 60) aggiungi(nomeSq, "punteggio_sotto60", `Punteggio ${totale}`);
        else if (totale >= 90) aggiungi(nomeSq, "punteggio_sopra90", `Punteggio ${totale}`);
        else if (totale > 80) aggiungi(nomeSq, "punteggio_sopra80", `Punteggio ${totale}`);
      }
      for (const gi of blocco.giocatori) {
        if (!gi.haContato) continue;
        tuttiGiocatori.push({ ...gi, squadra: nomeSq });
        const nGol = gsConta(gi.gol, GS_PESO.gol);
        const nAssist = gsConta(gi.assist, GS_PESO.assistStd)
          + gsConta(gi.assistSoft, GS_PESO.assistSoft)
          + gsConta(gi.assistGold, GS_PESO.assistGold);
        if (nGol >= 3) aggiungi(nomeSq, "tripletta_gol", `${gi.nome} (${nGol} gol)`);
        else if (nGol === 2) aggiungi(nomeSq, "doppietta_gol", `${gi.nome} (${nGol} gol)`);
        if (nAssist >= 3) aggiungi(nomeSq, "tripletta_assist", `${gi.nome} (${nAssist} assist)`);
        else if (nAssist === 2) aggiungi(nomeSq, "doppietta_assist", `${gi.nome} (${nAssist} assist)`);
        if (gi.cartellinoColore && gi.cartellinoColore !== GS_COLORE_AMMONIZIONE) {
          incerti.push(`[${nomeSq}] ${gi.nome}: colore cartellino ${gi.cartellinoColore} non riconosciuto -> verificare se e' espulsione (rosso)`);
        }
      }
    }

    if (risultatoOk) {
      if (gCasa > gTrasf) {
        aggiungi(trasf, "vittoria_trasferta", `${trasf} vince in trasferta ${p.risultato}`);
        if (isDerby) aggiungi(trasf, "vittoria_derby", `${trasf} vince il derby ${p.risultato}`);
        if (isDerby) aggiungi(casa, "sconfitta_derby", `${casa} perde il derby ${p.risultato}`);
      } else if (gTrasf > gCasa) {
        aggiungi(casa, "sconfitta_casa_tifosi", `${casa} perde in casa ${p.risultato}`);
        if (isDerby) aggiungi(casa, "sconfitta_derby", `${casa} perde il derby ${p.risultato}`);
        if (isDerby) aggiungi(trasf, "vittoria_derby", `${trasf} vince il derby ${p.risultato}`);
      }
    }
  }

  function tuttiAlValoreEstremo(lista, chiave, fnEstremo) {
    if (!lista.length) return [];
    const estremo = fnEstremo(lista.map(x => x[chiave]));
    return lista.filter(x => x[chiave] === estremo);
  }

  const conVoto = tuttiGiocatori.filter(g => typeof g.voto === "number");
  const conFv = tuttiGiocatori.filter(g => typeof g.fantavoto === "number");
  const conFvNoPortieri = conFv.filter(g => g.ruolo !== "P");

  for (const g of tuttiAlValoreEstremo(conVoto, "voto", a => Math.max(...a)))
    aggiungi(g.squadra, "mvp_voto", `${g.nome} (voto ${g.voto})`);
  for (const g of tuttiAlValoreEstremo(conVoto, "voto", a => Math.min(...a)))
    aggiungi(g.squadra, "peggiore_voto", `${g.nome} (voto ${g.voto})`);
  for (const g of tuttiAlValoreEstremo(conFv, "fantavoto", a => Math.max(...a)))
    aggiungi(g.squadra, "mvp_fantavoto", `${g.nome} (fantavoto ${g.fantavoto})`);
  for (const g of tuttiAlValoreEstremo(conFvNoPortieri, "fantavoto", a => Math.min(...a)))
    aggiungi(g.squadra, "peggiore_fantavoto", `${g.nome} (fantavoto ${g.fantavoto})`);

  if (squadreTotali.length) {
    const valori = squadreTotali.map(x => x[1]);
    const topVal = Math.max(...valori), lowVal = Math.min(...valori);
    for (const [sq, v] of squadreTotali) {
      if (v === topVal) aggiungi(sq, "punteggio_top_sett", `Punteggio ${v} (il più alto della giornata)`);
      if (v === lowVal) aggiungi(sq, "punteggio_basso_sett", `Punteggio ${v} (il più basso della giornata)`);
    }
  }

  return { eventi, totali, incerti };
}

// ============================================================
// 2bis) TABELLA 5 GIORNATE (si ripete ogni finestra di 5: 1-5, 6-10, 11-15, ...)
// ============================================================
function gsFinestra5(numGiornata) {
  // Dato un numero di giornata, ritorna [inizio, fine] della finestra da 5 a cui appartiene.
  const fine = Math.ceil(numGiornata / 5) * 5;
  return [fine - 4, fine];
}

async function gsCalcolaClassifica5(inizio, fine) {
  const { data, error } = await sb.from("giornate_import").select("*")
    .gte("giornata", inizio).lte("giornata", fine);
  if (error) throw error;
  const perSquadra = {}; // squadra_id -> {punti, fantapunti, v,p,s}
  for (const riga of data) {
    const id = riga.squadra_id;
    if (!perSquadra[id]) perSquadra[id] = { squadra_id: id, punti: 0, fantapunti: 0, v: 0, p: 0, s: 0, giornateTrovate: 0 };
    const st = perSquadra[id];
    st.giornateTrovate++;
    if (typeof riga.totale === "number") st.fantapunti += riga.totale;
    const m = /^(\d+)-(\d+)$/.exec(String(riga.risultato || "").trim());
    if (!m) continue;
    const gFatti = riga.casa_o_trasferta === "casa" ? parseInt(m[1]) : parseInt(m[2]);
    const gSubiti = riga.casa_o_trasferta === "casa" ? parseInt(m[2]) : parseInt(m[1]);
    if (gFatti > gSubiti) { st.punti += 3; st.v++; }
    else if (gFatti === gSubiti) { st.punti += 1; st.p++; }
    else { st.s++; }
  }
  const lista = Object.values(perSquadra);
  // Ordine: punti classifica, a pari merito chi ha piu' punti fantacalcio totali nella finestra
  lista.sort((a, b) => b.punti - a.punti || b.fantapunti - a.fantapunti);
  return lista;
}

async function gsPosizioniGiaPagateT5(fine) {
  // Ritorna un Set con i numeri di posizione (1-12) gia' pagati per questa finestra,
  // controllando una posizione alla volta (non l'intera finestra in blocco).
  const { data, error } = await sb.from("sponsor_eventi").select("tipo_sponsor")
    .eq("giornata", fine).like("tipo_sponsor", "tabella5_pos%");
  if (error) throw error;
  const set = new Set();
  for (const r of (data || [])) {
    const m = /^tabella5_pos(\d+)$/.exec(r.tipo_sponsor);
    if (m) set.add(parseInt(m[1]));
  }
  return set;
}

// ============================================================
// 3) INTERFACCIA: overlay "Tabelle"
// ============================================================
let gsFileCorrente = null;
let gsPartiteLette = null;
let gsGiornataNum = null;

function gsInjectStyle() {
  if (document.getElementById("gs-style")) return;
  const st = document.createElement("style");
  st.id = "gs-style";
  st.textContent = `
  #gs-overlay{position:fixed;inset:0;z-index:9999;background:var(--nero,#0b0b0b);color:var(--testo,#eee);display:none;flex-direction:column}
  #gs-overlay.open{display:flex}
  .gs-top{display:flex;gap:8px;align-items:center;padding:10px 12px;border-bottom:1px solid var(--grigio-chiaro,#333);flex-shrink:0}
  .gs-top h2{flex:1;font-family:'Bebas Neue',sans-serif;letter-spacing:1px;font-size:20px;margin:0}
  .gs-close{background:var(--rosso,#c0392b);color:#fff;border:none;border-radius:8px;padding:8px 14px;cursor:pointer}
  .gs-body{flex:1;overflow-y:auto;padding:10px 12px 40px}
  .gs-tabs{display:flex;gap:6px;padding:0 12px 8px;flex-shrink:0}
  .gs-tab{background:var(--grigio-medio,#222);border:1px solid var(--grigio-chiaro,#333);color:var(--testo,#eee);border-radius:8px;padding:6px 12px;font-size:13px;cursor:pointer}
  .gs-tab.active{background:var(--oro,#f1c40f);color:#111;font-weight:bold}
  table.gs-tbl{width:100%;border-collapse:collapse;font-size:12.5px;margin-bottom:16px}
  table.gs-tbl th{background:var(--grigio-medio,#222);text-align:left;padding:6px 8px;position:sticky;top:0}
  table.gs-tbl td{padding:5px 8px;border-bottom:1px solid var(--grigio-chiaro,#2a2a2a)}
  .gs-pos{color:var(--verde,#2ecc71)} .gs-neg{color:var(--rosso,#e74c3c)}
  .gs-upload{border:2px dashed var(--grigio-chiaro,#333);border-radius:10px;padding:20px;text-align:center;margin-bottom:16px}
  .gs-btn{background:var(--oro,#f1c40f);color:#111;border:none;border-radius:8px;padding:10px 18px;font-weight:bold;cursor:pointer}
  .gs-warn{background:rgba(241,196,15,.12);border:1px solid var(--oro,#f1c40f);border-radius:8px;padding:8px 10px;font-size:12px;margin-bottom:10px}
  `;
  document.head.appendChild(st);
}

function gsEnsureOverlay() {
  gsInjectStyle();
  let o = document.getElementById("gs-overlay");
  if (o) return o;
  o = document.createElement("div");
  o.id = "gs-overlay";
  o.innerHTML = `
    <div class="gs-top"><h2>📜 Tabelle</h2><button class="gs-close" onclick="chiudiTabelle()">✕ Chiudi</button></div>
    <div class="gs-tabs">
      <button class="gs-tab active" data-tab="import" onclick="gsMostraTab('import')">Importa giornata</button>
      <button class="gs-tab" data-tab="log" onclick="gsMostraTab('log')">Sponsor sbloccati</button>
      <button class="gs-tab" data-tab="tabella" onclick="gsMostraTab('tabella')">Tabella sponsor</button>
      <button class="gs-tab" data-tab="tabella5" onclick="gsMostraTab('tabella5')">Tabella 5 giornate</button>
    </div>
    <div class="gs-body" id="gs-body"></div>`;
  document.body.appendChild(o);
  return o;
}

function apriTabelle() {
  gsEnsureOverlay().classList.add("open");
  gsMostraTab("import");
}
function chiudiTabelle() {
  const o = document.getElementById("gs-overlay");
  if (o) o.classList.remove("open");
}

function gsMostraTab(tab) {
  document.querySelectorAll(".gs-tab").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  const body = document.getElementById("gs-body");
  if (tab === "import") gsRenderImport(body);
  else if (tab === "log") gsRenderLog(body);
  else if (tab === "tabella") gsRenderTabellaStatica(body);
  else if (tab === "tabella5") gsRenderTabella5(body);
}

async function gsRenderTabella5(body) {
  body.innerHTML = `
    <p>Inserisci l'ultima giornata giocata: calcolo la finestra di 5 a cui appartiene e la classifica di quella finestra.</p>
    <input type="number" id="gs-t5-giornata" placeholder="Ultima giornata giocata" style="width:160px;padding:6px;border-radius:6px;border:1px solid var(--grigio-chiaro,#333);background:var(--grigio-medio,#222);color:#eee;margin-bottom:10px">
    <button class="gs-btn" onclick="gsCalcolaEMostraT5()">📊 Calcola classifica</button>
    <div id="gs-t5-risultato" style="margin-top:14px"></div>`;
}

let gsT5Lista = null, gsT5Inizio = null, gsT5Fine = null, gsT5Pagate = null;

async function gsCalcolaEMostraT5() {
  const num = parseInt(document.getElementById("gs-t5-giornata").value);
  if (!num) { showToast("❌ Inserisci un numero di giornata", "error"); return; }
  const [inizio, fine] = gsFinestra5(num);
  gsT5Inizio = inizio; gsT5Fine = fine;
  const div = document.getElementById("gs-t5-risultato");
  div.innerHTML = "Calcolo...";
  try {
    gsT5Lista = await gsCalcolaClassifica5(inizio, fine);
    gsT5Pagate = await gsPosizioniGiaPagateT5(fine);
    gsRenderRigheT5();
  } catch (e) {
    div.innerHTML = "Errore: " + e.message;
  }
}

function gsRenderRigheT5() {
  const div = document.getElementById("gs-t5-risultato");
  const squadrePerId = Object.fromEntries(squadreDB.map(s => [s.id, s.nome]));
  let html = `<h3>Finestra giornate ${gsT5Inizio}-${gsT5Fine}</h3>`;
  if (gsT5Lista.length < 12) {
    html += `<div class="gs-warn">⚠️ Ho trovato dati per solo ${gsT5Lista.length} squadre su 12 in questa finestra — controlla di aver importato tutte le giornate prima di pagare.</div>`;
  }
  html += `<table class="gs-tbl"><tr><th>Pos.</th><th>Squadra</th><th>Punti</th><th>V</th><th>P</th><th>S</th><th>Fantapunti tot.</th><th>Premio</th><th></th></tr>`;
  gsT5Lista.forEach((st, i) => {
    const pos = i + 1;
    const premio = GS_TABELLA5[Math.min(i, GS_TABELLA5.length - 1)];
    const pagata = gsT5Pagate.has(pos);
    html += `<tr><td>${pos}°</td><td>${squadrePerId[st.squadra_id] || "?"}</td><td>${st.punti}</td>
      <td>${st.v}</td><td>${st.p}</td><td>${st.s}</td><td>${st.fantapunti.toFixed(1)}</td>
      <td class="${premio.soldi >= 0 ? "gs-pos" : "gs-neg"}">${(premio.soldi / 1000000).toLocaleString("it-IT")}M / ${premio.tifosi}T</td>
      <td>${pagata
        ? `<span style="color:var(--testo-dim,#999)">✅ Già pagata</span>`
        : `<button class="gs-btn" style="padding:5px 10px;font-size:12px" onclick="gsPagaPosizioneT5(${pos})">💰 Paga</button>`}</td></tr>`;
  });
  html += `</table>`;
  div.innerHTML = html;
}

async function gsPagaPosizioneT5(pos) {
  if (!gsT5Lista) return;
  // Ricontrollo al volo (non fidandomi solo dello stato in memoria) prima di pagare,
  // nel caso qualcun altro abbia gia' pagato questa posizione nel frattempo.
  const pagateOra = await gsPosizioniGiaPagateT5(gsT5Fine);
  if (pagateOra.has(pos)) {
    showToast(`⚠️ Posizione ${pos}° già pagata`, "error");
    gsT5Pagate = pagateOra;
    gsRenderRigheT5();
    return;
  }
  const st = gsT5Lista[pos - 1];
  const premio = GS_TABELLA5[Math.min(pos - 1, GS_TABELLA5.length - 1)];
  try {
    await sb.from("sponsor_eventi").insert({
      giornata: gsT5Fine, squadra_id: st.squadra_id,
      tipo_sponsor: `tabella5_pos${pos}`,
      nome_sponsor: `Tabella 5 giornate (${gsT5Inizio}-${gsT5Fine}) — ${pos}° posto`,
      soldi: premio.soldi, tifosi: premio.tifosi,
      dettaglio: `${st.punti} punti, ${st.fantapunti.toFixed(1)} fantapunti totali`,
    });
    const { data } = await sb.from("squadre").select("bilancio,tifosi").eq("id", st.squadra_id).single();
    await sb.from("squadre").update({
      bilancio: (data?.bilancio || 0) + premio.soldi,
      tifosi: (data?.tifosi || 0) + premio.tifosi,
    }).eq("id", st.squadra_id);
    gsT5Pagate.add(pos);
    showToast(`✅ ${pos}° posto pagato`);
    gsRenderRigheT5();
  } catch (e) {
    showToast("❌ Errore: " + e.message, "error");
  }
}

function gsRenderImport(body) {
  body.innerHTML = `
    <div class="gs-upload">
      <p>Carica il file .xlsx della giornata (esportato dall'app voti)</p>
      <input type="number" id="gs-giornata-num" placeholder="N. giornata" style="width:100px;padding:6px;border-radius:6px;border:1px solid var(--grigio-chiaro,#333);background:var(--grigio-medio,#222);color:#eee;margin-bottom:10px">
      <br>
      <input type="file" id="gs-file-input" accept=".xlsx">
      <br><br>
      <button class="gs-btn" onclick="gsLeggiFile()">📖 Leggi file</button>
    </div>
    <div id="gs-anteprima"></div>`;
}

async function gsLeggiFile() {
  const input = document.getElementById("gs-file-input");
  const giornataNum = parseInt(document.getElementById("gs-giornata-num").value);
  if (!giornataNum) { showToast("❌ Inserisci il numero di giornata", "error"); return; }
  if (!input.files.length) { showToast("❌ Scegli un file .xlsx", "error"); return; }
  gsFileCorrente = input.files[0];
  gsGiornataNum = giornataNum;
  try {
    const buf = await gsFileCorrente.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array", cellStyles: true });
    gsPartiteLette = gsParsaGiornata(wb);
    gsRenderAnteprima();
  } catch (e) {
    showToast("❌ Errore lettura file: " + e.message, "error");
  }
}

function gsRenderAnteprima() {
  const div = document.getElementById("gs-anteprima");
  const { eventi, totali, incerti } = gsCalcolaSponsor(gsPartiteLette);
  let html = `<h3>Giornata ${gsGiornataNum} — ${gsPartiteLette.length} partite lette</h3>`;
  html += `<p>Controlla sotto cosa ha letto l'app. Se qualcosa non torna (un voto, un giocatore che non doveva/doveva contare, un cartellino), <b>correggilo prima di confermare</b> — dopo la conferma i soldi vengono assegnati.</p>`;
  if (incerti.length) {
    html += `<div class="gs-warn"><b>⚠️ Da controllare a mano (non ancora calcolato):</b><br>${incerti.map(i => i.replace(/</g, "&lt;")).join("<br>")}</div>`;
  }
  html += `<table class="gs-tbl"><tr><th>Squadra</th><th>Sponsor</th><th>Dettaglio</th><th>FM</th><th>Tifosi</th></tr>`;
  for (const e of eventi) {
    html += `<tr><td>${e.squadra}</td><td>${e.nome}</td><td>${e.dettaglio}</td>
      <td class="${e.soldi >= 0 ? "gs-pos" : "gs-neg"}">${e.soldi.toLocaleString("it-IT")}</td>
      <td class="${e.tifosi >= 0 ? "gs-pos" : "gs-neg"}">${e.tifosi}</td></tr>`;
  }
  html += `</table><h3>Totale per squadra</h3><table class="gs-tbl"><tr><th>Squadra</th><th>FM</th><th>Tifosi</th></tr>`;
  for (const [sq, v] of Object.entries(totali).sort((a, b) => b[1].soldi - a[1].soldi)) {
    html += `<tr><td>${sq}</td><td class="${v.soldi >= 0 ? "gs-pos" : "gs-neg"}">${v.soldi.toLocaleString("it-IT")}</td>
      <td class="${v.tifosi >= 0 ? "gs-pos" : "gs-neg"}">${v.tifosi}</td></tr>`;
  }
  html += `</table><button class="gs-btn" onclick="gsConfermaESalva()">✅ Confermo, salva e assegna</button>`;
  div.innerHTML = html;
}

async function gsConfermaESalva() {
  if (!gsPartiteLette) return;
  const { eventi, totali } = gsCalcolaSponsor(gsPartiteLette);
  try {
    // 1) salva i dati grezzi della giornata
    for (const p of gsPartiteLette) {
      for (const [lato, nomeFile, blocco, avvFile] of [
        ["casa", p.casa, p.squadraCasa, p.trasferta],
        ["trasferta", p.trasferta, p.squadraTrasferta, p.casa],
      ]) {
        const nomeVero = gsNomeVero(nomeFile);
        const sq = squadreDB.find(s => s.nome === nomeVero);
        const avv = squadreDB.find(s => s.nome === gsNomeVero(avvFile));
        if (!sq) { console.warn("Squadra non trovata:", nomeVero); continue; }
        await sb.from("giornate_import").upsert({
          giornata: gsGiornataNum, squadra_id: sq.id, totale: blocco.totale, modulo: blocco.modulo,
          risultato: p.risultato, casa_o_trasferta: lato, avversario_id: avv ? avv.id : null,
          giocatori: blocco.giocatori, confermato_il: new Date().toISOString(),
        }, { onConflict: "giornata,squadra_id" });
      }
    }
    // 2) salva il log sponsor + aggiorna bilancio di ogni squadra
    for (const e of eventi) {
      const sq = squadreDB.find(s => s.nome === e.squadra);
      if (!sq) continue;
      await sb.from("sponsor_eventi").insert({
        giornata: gsGiornataNum, squadra_id: sq.id, tipo_sponsor: e.tipo,
        nome_sponsor: e.nome, soldi: e.soldi, tifosi: e.tifosi, dettaglio: e.dettaglio,
      });
    }
    for (const [nomeSq, v] of Object.entries(totali)) {
      const sq = squadreDB.find(s => s.nome === nomeSq);
      if (!sq) continue;
      const { data } = await sb.from("squadre").select("bilancio,tifosi").eq("id", sq.id).single();
      await sb.from("squadre").update({
        bilancio: (data?.bilancio || 0) + v.soldi,
        tifosi: (data?.tifosi || 0) + v.tifosi,
      }).eq("id", sq.id);
    }
    showToast(`✅ Giornata ${gsGiornataNum} salvata: ${eventi.length} sponsor assegnati`);
    gsMostraTab("log");
  } catch (e) {
    showToast("❌ Errore salvataggio: " + e.message, "error");
  }
}

async function gsRenderLog(body) {
  body.innerHTML = "Carico...";
  const { data, error } = await sb.from("sponsor_eventi").select("*").order("giornata", { ascending: false }).order("id", { ascending: false }).limit(200);
  if (error) { body.innerHTML = "Errore: " + error.message; return; }
  const squadrePerId = Object.fromEntries(squadreDB.map(s => [s.id, s.nome]));
  let html = `<table class="gs-tbl"><tr><th>Giornata</th><th>Squadra</th><th>Sponsor</th><th>Dettaglio</th><th>FM</th><th>Tifosi</th></tr>`;
  for (const e of (data || [])) {
    html += `<tr><td>${e.giornata}</td><td>${squadrePerId[e.squadra_id] || "?"}</td><td>${e.nome_sponsor}</td><td>${e.dettaglio || ""}</td>
      <td class="${e.soldi >= 0 ? "gs-pos" : "gs-neg"}">${Number(e.soldi).toLocaleString("it-IT")}</td>
      <td class="${e.tifosi >= 0 ? "gs-pos" : "gs-neg"}">${e.tifosi}</td></tr>`;
  }
  html += `</table>`;
  body.innerHTML = html || "Nessuno sponsor ancora registrato.";
}

function gsRenderTabellaStatica(body) {
  let html = `<table class="gs-tbl"><tr><th>Bonus</th><th>Soldi</th><th>Tifosi</th></tr>`;
  for (const s of Object.values(GS_SPONSOR)) {
    html += `<tr><td>${s.nome}</td>
      <td class="${s.soldi >= 0 ? "gs-pos" : "gs-neg"}">${(s.soldi / 1000000).toLocaleString("it-IT")} M</td>
      <td class="${s.tifosi >= 0 ? "gs-pos" : "gs-neg"}">${s.tifosi}</td></tr>`;
  }
  html += `</table><p style="font-size:12px;color:var(--testo-dim,#999)">Vittoria/sconfitta allenatore e bonus maglia 7/9/10 in arrivo.</p>`;
  body.innerHTML = html;
}
