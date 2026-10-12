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

// --- Serie/striscie 5-10-15: soglie per ciascun tipo di serie ---
const GS_SOGLIE_SERIE = {
  vittorie:         { campo: "vittorie_fila",         soglie_campo: "soglie_premiate_vittorie",
    5: { soldi: 3500000, tifosi: 120, nome: "5 vittorie di fila" },
    10: { soldi: 8500000, tifosi: 240, nome: "10 vittorie di fila" },
    15: { soldi: 15000000, tifosi: 360, nome: "15 vittorie di fila" } },
  sconfitte:        { campo: "sconfitte_fila",        soglie_campo: "soglie_premiate_sconfitte",
    5: { soldi: 1500000, tifosi: -30, nome: "5 sconfitte di fila" },
    10: { soldi: 4000000, tifosi: -50, nome: "10 sconfitte di fila" },
    15: { soldi: 9500000, tifosi: -70, nome: "15 sconfitte di fila" } },
  senza_sconfitta:  { campo: "senza_sconfitta_fila",  soglie_campo: "soglie_premiate_senza_sconfitta",
    5: { soldi: 1000000, tifosi: 80, nome: "5 giornate senza sconfitta" },
    10: { soldi: 3500000, tifosi: 160, nome: "10 giornate senza sconfitta" },
    15: { soldi: 8000000, tifosi: 240, nome: "15 giornate senza sconfitta" } },
  senza_vittoria:   { campo: "senza_vittoria_fila",   soglie_campo: "soglie_premiate_senza_vittoria",
    5: { soldi: 500000, tifosi: -20, nome: "5 giornate senza vittoria" },
    10: { soldi: 3000000, tifosi: -40, nome: "10 giornate senza vittoria" },
    15: { soldi: 7000000, tifosi: -60, nome: "15 giornate senza vittoria" } },
};

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
  maglia_gol_assist:     { nome: "Maglia 7/9/10 — gol o assist",   soldi: 100000,  tifosi: 10 },
  capitano_gol_assist:   { nome: "Capitano — gol o assist",        soldi: 200000,  tifosi: 20 },
  capitano_sufficienza:  { nome: "Capitano — voto 6 o più",        soldi: 150000,  tifosi: 10 },
  vittoria_allenatore:   { nome: "Vittoria allenatore",            soldi: 1000000, tifosi: 40 },
  sconfitta_allenatore:  { nome: "Sconfitta allenatore",           soldi: -500000, tifosi: -10 },
  // --- Stagionali (si sbloccano quando i totali di stagione raggiungono la soglia) ---
  gol30_1:               { nome: "30 gol dei calciatori — 1ª squadra",  soldi: 5000000, tifosi: 120 },
  gol30_2:               { nome: "30 gol dei calciatori — 2ª squadra",  soldi: 3500000, tifosi: 80 },
  gol30_3:               { nome: "30 gol dei calciatori — 3ª squadra",  soldi: 2000000, tifosi: 50 },
  assist20_1:            { nome: "20 assist dei calciatori — 1ª squadra", soldi: 3500000, tifosi: 100 },
  assist20_2:            { nome: "20 assist dei calciatori — 2ª squadra", soldi: 2000000, tifosi: 70 },
  assist20_3:            { nome: "20 assist dei calciatori — 3ª squadra", soldi: 1000000, tifosi: 50 },
  fantagol50:            { nome: "Prima squadra a 50 fantagol",    soldi: 5000000, tifosi: 130 },
  fantagol20:            { nome: "Ogni 20 fantagol",               soldi: 1000000, tifosi: 35 },
};
// NOTA: vittoria/sconfitta allenatore scattano dalla tab "Allenatore": l'admin incolla i
// risultati reali di Serie A (una partita per riga) e vengono abbinati alla squadra reale
// assegnata a ogni allenatore. Nessuna API, nessuna immagine.
// I numeri di maglia 7/9/10 vengono letti da squadre.maglie (gestiti in magliette.js), NON da una
// tabella separata; il capitano/vice capitano viene letto direttamente dal simbolo Ⓒ/Ⓥ del file voti
// (e' la scelta settimanale di formazione, diversa dalla maglia fissa di squadre.maglie.capitano).

// --- Allenatore: squadre reali di Serie A assegnabili a ogni allenatore (stagione 2026/27) ---
const GS_SQUADRE_SERIE_A = [
  "Atalanta", "Bologna", "Cagliari", "Como", "Fiorentina", "Frosinone", "Genoa", "Inter",
  "Juventus", "Lazio", "Lecce", "Milan", "Monza", "Napoli", "Parma", "Roma", "Sassuolo",
  "Torino", "Udinese", "Venezia",
];

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

// Il nome fantasy (es. "Hood FC") puo' stare in squadre.nome_squadra oppure in
// squadre.nome a seconda di come e' popolato il record: controllo entrambi,
// stessa precedenza gia' usata in squadra.js (nome_squadra || nome).
function gsTrovaSquadra(nomeFantasy) {
  return squadreDB.find(s => (s.nome_squadra || s.nome) === nomeFantasy);
}

// ============================================================
// 2) CALCOLO SPONSOR SETTIMANALI
// ============================================================
function gsConta(valore, peso) {
  const v = typeof valore === "number" ? valore : 0;
  return v ? Math.round(v / peso) : 0;
}

function gsCalcolaSponsor(partite, risoluzioniMaglie) {
  risoluzioniMaglie = risoluzioniMaglie || {}; // chiave "pIdx_lato_numero" -> indice in blocco.giocatori, o "nessuno"
  const eventi = [];
  const totali = {}; // nomeSquadraVero -> {soldi, tifosi}
  const incerti = [];
  const maglieAvvisate = new Set(); // una sola segnalazione per squadra
  const daRisolvere = []; // maglie 7/9/10 senza corrispondenza esatta, in attesa di scelta manuale
  const squadreTotali = [];
  const tuttiGiocatori = [];

  function aggiungi(squadra, chiave, dettaglio) {
    const s = GS_SPONSOR[chiave];
    if (!totali[squadra]) totali[squadra] = { soldi: 0, tifosi: 0 };
    totali[squadra].soldi += s.soldi;
    totali[squadra].tifosi += s.tifosi;
    eventi.push({ squadra, tipo: chiave, nome: s.nome, soldi: s.soldi, tifosi: s.tifosi, dettaglio });
  }

  for (let pIdx = 0; pIdx < partite.length; pIdx++) {
    const p = partite[pIdx];
    const casa = gsNomeVero(p.casa), trasf = gsNomeVero(p.trasferta);
    const m = /^(\d+)-(\d+)$/.exec(String(p.risultato || "").trim());
    const risultatoOk = !!m;
    const gCasa = risultatoOk ? parseInt(m[1]) : null;
    const gTrasf = risultatoOk ? parseInt(m[2]) : null;
    const isDerby = gsEDerby(casa, trasf);

    for (const [lato, nomeSq, blocco] of [["casa", casa, p.squadraCasa], ["trasferta", trasf, p.squadraTrasferta]]) {
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

      // --- Maglia 7/9/10: bonus se chi la indossa ha fatto gol o assist ---
      const sqReale = (typeof squadreDB !== "undefined") ? gsTrovaSquadra(nomeSq) : null;
      const maglie = sqReale && sqReale.maglie ? sqReale.maglie : null;
      if (!sqReale) {
        if (!maglieAvvisate.has("?" + nomeSq)) { maglieAvvisate.add("?" + nomeSq); incerti.push(`[${nomeSq}] squadra non trovata nell'app: bonus maglia 7/9/10 non calcolato`); }
      } else if (!maglie || !(maglie.n7 || maglie.n9 || maglie.n10)) {
        if (!maglieAvvisate.has(nomeSq)) { maglieAvvisate.add(nomeSq); incerti.push(`[${nomeSq}] numeri di maglia 7/9/10 non ancora impostati: nessun bonus maglia calcolato`); }
      } else if (typeof giocatoriDB === "undefined" || !giocatoriDB || !giocatoriDB.length) {
        if (!maglieAvvisate.has("g" + nomeSq)) { maglieAvvisate.add("g" + nomeSq); incerti.push(`[${nomeSq}] elenco giocatori non caricato: bonus maglia 7/9/10 non calcolato`); }
      }
      if (maglie) {
        for (const [key, numero] of [["n7", "7"], ["n9", "9"], ["n10", "10"]]) {
          const giocatoreId = maglie[key];
          if (!giocatoreId) continue;
          const giocatoreVero = (typeof giocatoriDB !== "undefined") ? giocatoriDB.find(g => String(g.id) === String(giocatoreId)) : null;
          if (!giocatoreVero) continue;

          const chiaveRisoluzione = `${pIdx}_${lato}_${numero}`;
          let nelFile = blocco.giocatori.find(gi => gi.nome === giocatoreVero.nome);
          let fonte = "nome esatto";

          if (!nelFile && Object.prototype.hasOwnProperty.call(risoluzioniMaglie, chiaveRisoluzione)) {
            const scelta = risoluzioniMaglie[chiaveRisoluzione];
            if (scelta !== "nessuno") {
              nelFile = blocco.giocatori[parseInt(scelta)];
              fonte = "scelto a mano";
            } else {
              fonte = "confermato: non ha giocato";
            }
          }

          if (!nelFile) {
            if (fonte !== "confermato: non ha giocato") {
              daRisolvere.push({
                chiave: chiaveRisoluzione, squadra: nomeSq, numero,
                giocatoreVeroNome: giocatoreVero.nome,
                opzioni: blocco.giocatori.map((gi, idx) => ({ idx, nome: gi.nome })),
              });
            }
            continue;
          }
          if (!nelFile.haContato) continue;
          const nGolM = gsConta(nelFile.gol, GS_PESO.gol);
          const nAssistM = gsConta(nelFile.assist, GS_PESO.assistStd) + gsConta(nelFile.assistSoft, GS_PESO.assistSoft) + gsConta(nelFile.assistGold, GS_PESO.assistGold);
          if (nGolM > 0 || nAssistM > 0) {
            const nota = fonte === "scelto a mano" ? ` [abbinato a mano a "${nelFile.nome}"]` : "";
            aggiungi(nomeSq, "maglia_gol_assist", `Maglia ${numero} — ${giocatoreVero.nome} (${nGolM} gol, ${nAssistM} assist)${nota}`);
          }
        }
      }

      // --- Capitano/vice capitano della giornata (simbolo Ⓒ/Ⓥ nel file voti) ---
      let capGiornata = blocco.giocatori.find(gi => gi.capitano && gi.haContato);
      if (!capGiornata) capGiornata = blocco.giocatori.find(gi => gi.viceCapitano && gi.haContato);
      if (capGiornata) {
        const nomeCapPulito = capGiornata.nome.replace(/[ⒸⓋ]/g, "").trim();
        const nGolC = gsConta(capGiornata.gol, GS_PESO.gol);
        const nAssistC = gsConta(capGiornata.assist, GS_PESO.assistStd) + gsConta(capGiornata.assistSoft, GS_PESO.assistSoft) + gsConta(capGiornata.assistGold, GS_PESO.assistGold);
        if (nGolC > 0 || nAssistC > 0) {
          aggiungi(nomeSq, "capitano_gol_assist", `${nomeCapPulito} (${nGolC} gol, ${nAssistC} assist)`);
        }
        if (typeof capGiornata.voto === "number" && capGiornata.voto >= 6) {
          aggiungi(nomeSq, "capitano_sufficienza", `${nomeCapPulito} (voto ${capGiornata.voto})`);
        }
      }
    }

    if (risultatoOk) {
      // risultato e' "gol_casa-gol_trasferta". "Vittoria in trasferta" e "Sconfitta in
      // casa" sono LO STESSO evento (la trasferta vince <=> la casa perde in casa):
      // quando succede, scattano ENTRAMBI insieme, non uno al posto dell'altro.
      if (gTrasf > gCasa) {
        // la squadra in trasferta ha segnato piu' gol: vince la trasferta, perde la casa
        aggiungi(trasf, "vittoria_trasferta", `${trasf} vince in trasferta ${p.risultato}`);
        aggiungi(casa, "sconfitta_casa_tifosi", `${casa} perde in casa ${p.risultato}`);
        if (isDerby) aggiungi(trasf, "vittoria_derby", `${trasf} vince il derby ${p.risultato}`);
        if (isDerby) aggiungi(casa, "sconfitta_derby", `${casa} perde il derby ${p.risultato}`);
      } else if (gCasa > gTrasf) {
        // la squadra di casa ha segnato piu' gol: vince la casa.
        // Questa tabella sponsor non ha un bonus per "vittoria in casa" ne' un malus
        // per "sconfitta in trasferta" - scatta solo il derby, se la partita lo e'.
        if (isDerby) aggiungi(casa, "vittoria_derby", `${casa} vince il derby ${p.risultato}`);
        if (isDerby) aggiungi(trasf, "sconfitta_derby", `${trasf} perde il derby ${p.risultato}`);
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

  return { eventi, totali, incerti, daRisolvere };
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
// 2quater) ALLENATORE: risultati reali Serie A incollati come testo
// ============================================================
function gsNormalizzaNomeSquadra(nome) {
  return String(nome || "").toLowerCase()
    .replace(/\bfc\b|\bac\b|\bssc\b|\bus\b|\bcalcio\b/g, "")
    .replace(/[^a-z]/g, "").trim();
}

function gsEsc(t) {
  return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Correzione automatica dei nomi: porta il nome letto al nome ufficiale della lista (o null).
function gsNomeUfficiale(nomeLetto) {
  const n = gsNormalizzaNomeSquadra(nomeLetto);
  if (!n) return null;
  const esatto = GS_SQUADRE_SERIE_A.find(t => gsNormalizzaNomeSquadra(t) === n);
  if (esatto) return esatto;
  // Sigle tipo INT, VEN, ROM: conta solo l'inizio del nome, e solo se e' una scelta unica.
  const inizio = GS_SQUADRE_SERIE_A.filter(t => {
    const u = gsNormalizzaNomeSquadra(t);
    return u.startsWith(n) || n.startsWith(u);
  });
  if (inizio.length === 1) return inizio[0];
  const dentro = GS_SQUADRE_SERIE_A.filter(t => {
    const u = gsNormalizzaNomeSquadra(t);
    return n.includes(u) || u.includes(n);
  });
  return dentro.length === 1 ? dentro[0] : null;
}

// Controlli automatici sulle partite lette. "gravi" = problemi che meritano una seconda lettura.
function gsControllaPartite(data) {
  const avvisi = [];
  let gravi = false;
  const viste = new Set();
  const partite = [];
  for (const p of (data && data.partite) || []) {
    const casa = gsNomeUfficiale(p.casa), trasf = gsNomeUfficiale(p.trasferta);
    if (!casa || !trasf) {
      avvisi.push(`Nome squadra non riconosciuto: "${!casa ? p.casa : p.trasferta}"`);
      gravi = true; continue;
    }
    if (!Number.isInteger(p.gol_casa) || !Number.isInteger(p.gol_trasferta)) {
      avvisi.push(`${casa} - ${trasf}: non ancora giocata o punteggio non leggibile, saltata`);
      continue;
    }
    if (p.gol_casa < 0 || p.gol_trasferta < 0 || p.gol_casa > 15 || p.gol_trasferta > 15) {
      avvisi.push(`${casa} ${p.gol_casa}-${p.gol_trasferta} ${trasf}: punteggio improbabile, saltata`);
      gravi = true; continue;
    }
    if (viste.has(casa) || viste.has(trasf)) {
      avvisi.push(`${casa} o ${trasf} compaiono in piu' di una partita, saltata`);
      gravi = true; continue;
    }
    viste.add(casa); viste.add(trasf);
    partite.push({ casa, trasf, gCasa: p.gol_casa, gTrasf: p.gol_trasferta });
  }
  if (partite.length !== 10) {
    avvisi.push(`Ho letto ${partite.length} partite valide su 10: controlla di aver incollato tutte le partite.`);
  }
  const risultati = []; // {nome, esito, dettaglio}
  for (const m of partite) {
    const dettaglio = `${m.casa} ${m.gCasa}-${m.gTrasf} ${m.trasf}`;
    if (m.gCasa > m.gTrasf) { risultati.push({ nome: m.casa, esito: "vittoria", dettaglio }); risultati.push({ nome: m.trasf, esito: "sconfitta", dettaglio }); }
    else if (m.gTrasf > m.gCasa) { risultati.push({ nome: m.trasf, esito: "vittoria", dettaglio }); risultati.push({ nome: m.casa, esito: "sconfitta", dettaglio }); }
    else { risultati.push({ nome: m.casa, esito: "pareggio", dettaglio }); risultati.push({ nome: m.trasf, esito: "pareggio", dettaglio }); }
  }
  const giornata = Number.isInteger(data && data.giornata) ? data.giornata : null;
  return { giornata, partite, risultati, avvisi, gravi };
}

// Legge il testo incollato: una partita per riga, es. "Inter 4-1 Monza" (vanno bene anche "Inter 4 1 Monza" e le sigle INT, MON...).
function gsLeggiTesto(testo) {
  const partite = [], nonCapite = [];
  let giornata = null;
  for (const riga of String(testo || "").split(/\r?\n/)) {
    const r = riga.trim();
    if (!r) continue;
    const m = r.match(/^(.*?[A-Za-z\u00C0-\u00FF])\s+(\d{1,2})\s*[-\u2013\u2014:]?\s*(\d{1,2})\s+([A-Za-z\u00C0-\u00FF].*)$/);
    if (m) { partite.push({ casa: m[1].trim(), trasferta: m[4].trim(), gol_casa: parseInt(m[2]), gol_trasferta: parseInt(m[3]) }); continue; }
    const g = r.match(/giornata\s*(\d{1,2})/i);
    if (g) { giornata = parseInt(g[1]); continue; }
    nonCapite.push(r);
  }
  const esito = gsControllaPartite({ giornata, partite });
  nonCapite.forEach(r => esito.avvisi.push(`Riga non capita, saltata: "${r}"`));
  return esito;
}

function gsCalcolaAllenatore(risultatiSerieA) {
  const eventi = [];
  const nonTrovate = [];
  const senzaAllenatore = [];
  const riepilogo = [];
  for (const sq of squadreDB) {
    const allenatore = sq.allenatore;
    if (!allenatore) { senzaAllenatore.push(sq.nome_squadra || sq.nome); riepilogo.push({ squadra: sq.nome_squadra || sq.nome, allenatore: "NESSUNO", esito: "-" }); continue; }
    const norm = gsNormalizzaNomeSquadra(allenatore);
    const match = risultatiSerieA.find(r => gsNormalizzaNomeSquadra(r.nome) === norm);
    riepilogo.push({ squadra: sq.nome_squadra || sq.nome, allenatore, esito: match ? match.esito : "nessun risultato" });
    if (!match) { nonTrovate.push(`[${sq.nome}] allenatore "${allenatore}": nessun risultato per questa squadra (non giocava? partita mancante nel testo?)`); continue; }
    if (match.esito === "pareggio") continue; // nessun bonus/malus sul pareggio
    const tipo = match.esito === "vittoria" ? "vittoria_allenatore" : "sconfitta_allenatore";
    const premio = GS_SPONSOR[tipo];
    eventi.push({ squadra: sq.nome, tipo,
      nome: premio.nome, soldi: premio.soldi, tifosi: premio.tifosi,
      dettaglio: `${allenatore}: ${match.dettaglio}` });
  }
  if (senzaAllenatore.length) {
    nonTrovate.unshift(`Squadre senza allenatore assegnato: ${senzaAllenatore.join(", ")}. Sceglilo nel riquadro "Modifica allenatore e stipendio" qui sotto e premi Salva.`);
  }
  return { eventi, nonTrovate, riepilogo };
}

// ============================================================
// 3) INTERFACCIA: overlay "Tabelle"
// ============================================================
let gsFileCorrente = null;
let gsPartiteLette = null;
let gsGiornataNum = null;
let gsRisoluzioniMaglie = {}; // si azzera a ogni nuovo file caricato

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
  .gs-tabs{display:flex;gap:6px;padding:0 12px 8px;flex-shrink:0;overflow-x:auto;-webkit-overflow-scrolling:touch}
  .gs-tab{flex-shrink:0}
  .gs-scroll-tbl{overflow-x:auto;-webkit-overflow-scrolling:touch;margin-bottom:16px}
  .gs-scroll-tbl table.gs-tbl{margin-bottom:0;min-width:560px}
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
      <button class="gs-tab" data-tab="obiettivi" onclick="gsMostraTab('obiettivi')">Obiettivi stagione</button>
      <button class="gs-tab" data-tab="allenatore" onclick="gsMostraTab('allenatore')">Allenatore</button>
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
  else if (tab === "allenatore") gsRenderAllenatore(body);
  else if (tab === "obiettivi") gsRenderObiettivi(body);
}

// Se l'elenco squadre dell'app e' vuoto (non ancora caricato in questa schermata), lo carico dal database.
async function gsAssicuraSquadre() {
  if (typeof squadreDB !== "undefined" && squadreDB && squadreDB.length) return;
  const { data, error } = await sb.from("squadre").select("*");
  if (error) throw error;
  if (typeof squadreDB !== "undefined" && Array.isArray(squadreDB)) squadreDB.push(...(data || []));
  else window.squadreDB = data || [];
}

function gsRenderAllenatoriAdmin(body) {
  body.innerHTML = `
    <p>Nome della squadra reale di Serie A (es. "Juventus", "Inter") e stipendio dell'allenatore in milioni (minimo 1M), per ogni squadra. Salva una squadra alla volta.</p>
    <div class="gs-scroll-tbl"><table class="gs-tbl"><tr><th>Squadra</th><th>Allenatore (squadra reale)</th><th>Stipendio (M)</th><th></th></tr>
    ${squadreDB.map(sq => `
      <tr>
        <td><input type="text" id="gs-sq-nome-${sq.id}" value="${(sq.nome_squadra || sq.nome || "").replace(/"/g, "&quot;")}"
            style="width:100%;padding:5px;border-radius:6px;border:1px solid var(--grigio-chiaro,#333);background:var(--grigio-medio,#222);color:#eee"></td>
        <td><select id="gs-all-nome-${sq.id}"
            style="width:100%;padding:5px;border-radius:6px;border:1px solid var(--grigio-chiaro,#333);background:var(--grigio-medio,#222);color:#eee">
            <option value="">— nessuna —</option>
            ${GS_SQUADRE_SERIE_A.map(t => `<option value="${t}" ${sq.allenatore === t ? "selected" : ""}>${t}</option>`).join("")}
          </select></td>
        <td><div style="display:flex;align-items:center;gap:4px">
          <input type="number" min="1" step="0.1" id="gs-all-stip-${sq.id}" value="${sq.stip_all || ""}" placeholder="1"
            style="width:70px;padding:5px;border-radius:6px;border:1px solid var(--grigio-chiaro,#333);background:var(--grigio-medio,#222);color:#eee">
          <b>M</b></div></td>
        <td><button class="gs-btn" style="padding:5px 10px;font-size:12px" onclick="gsSalvaAllenatoreAdmin('${sq.id}')">💾</button></td>
      </tr>`).join("")}
    </table></div>`;
}

async function gsSalvaAllenatoreAdmin(sqId) {
  const sq = squadreDB.find(s => String(s.id) === String(sqId));
  const nomeSquadra = document.getElementById(`gs-sq-nome-${sqId}`).value.trim();
  const allenatore = document.getElementById(`gs-all-nome-${sqId}`).value.trim();
  const stipRaw = document.getElementById(`gs-all-stip-${sqId}`).value;
  const stip = stipRaw === "" ? null : parseFloat(stipRaw);
  if (!nomeSquadra) { showToast("❌ Il nome squadra non può essere vuoto", "error"); return; }
  if (stip !== null && !(stip >= 1)) { showToast("❌ Lo stipendio minimo di un allenatore è 1M", "error"); return; }
  try {
    await sb.from("squadre").update({
      nome: nomeSquadra, nome_squadra: nomeSquadra,
      allenatore: allenatore || null, stip_all: stip,
    }).eq("id", sqId);
    if (sq) { sq.nome = nomeSquadra; sq.nome_squadra = nomeSquadra; sq.allenatore = allenatore || null; sq.stip_all = stip; }
    showToast(`✅ ${nomeSquadra} salvata`);
    gsRenderAllenatoriAdmin(document.getElementById("gs-allenatori-admin-box")); // riaggiorna la tabella coi nomi nuovi
  } catch (e) {
    showToast("❌ Errore: " + e.message, "error");
  }
}

let gsAllenatoreEventi = null, gsAllenatoreGiornata = null;

async function gsRenderAllenatore(body) {
  body.innerHTML = "Carico le squadre...";
  try { await gsAssicuraSquadre(); }
  catch (e) { body.innerHTML = "Errore nel caricare le squadre: " + gsEsc(e.message); return; }
  const adminBlock = (typeof adminLoggato !== "undefined" && adminLoggato) ? `
    <details style="margin-top:22px">
      <summary style="cursor:pointer;color:var(--oro,#f1c40f);font-weight:bold">✏️ Modifica allenatore e stipendio di ogni squadra</summary>
      <div id="gs-allenatori-admin-box" style="margin-top:10px"></div>
    </details>` : "";
  body.innerHTML = `
    <p>Incolla qui i risultati reali della giornata di Serie A, una partita per riga (es. <b>Inter 4-1 Monza</b>). Vanno bene anche le sigle (INT, MON...). Il numero di giornata puoi scriverlo qui sotto oppure aggiungere una riga "Giornata 1".</p>
    <input type="number" id="gs-all-giornata" placeholder="N. giornata" style="width:200px;padding:6px;border-radius:6px;border:1px solid var(--grigio-chiaro,#333);background:var(--grigio-medio,#222);color:#eee;margin-bottom:10px">
    <textarea id="gs-all-testo" rows="11" placeholder="Inter 4-1 Monza&#10;Udinese 1-1 Como&#10;Genoa 0-2 Napoli&#10;..." style="display:block;width:100%;box-sizing:border-box;padding:8px;border-radius:6px;border:1px solid var(--grigio-chiaro,#333);background:var(--grigio-medio,#222);color:#eee;margin-bottom:10px"></textarea>
    <button class="gs-btn" onclick="gsCaricaAllenatore()">⚽ Controlla risultati</button>
    <div style="opacity:.5;font-size:12px;margin-top:6px">lettore risultati v4.4</div>
    <div id="gs-all-risultato" style="margin-top:14px"></div>
    ${adminBlock}`;
  if (typeof adminLoggato !== "undefined" && adminLoggato) {
    gsRenderAllenatoriAdmin(document.getElementById("gs-allenatori-admin-box"));
  }
}

async function gsCaricaAllenatore() {
  const testo = document.getElementById("gs-all-testo").value;
  if (!testo.trim()) { showToast("❌ Incolla i risultati della giornata", "error"); return; }
  const div = document.getElementById("gs-all-risultato");
  div.innerHTML = "Controllo i risultati...";
  try {
    await gsAssicuraSquadre();
    const lett = gsLeggiTesto(testo);
    const manuale = parseInt(document.getElementById("gs-all-giornata").value);
    const num = manuale || lett.giornata;
    if (!num) { div.innerHTML = "Scrivi il numero di giornata nel campo e riprova."; return; }
    gsAllenatoreGiornata = num;
    const avvisi = [...lett.avvisi];
    if (manuale && lett.giornata && manuale !== lett.giornata) {
      avvisi.push(`Hai scritto giornata ${manuale} ma nel testo leggo giornata ${lett.giornata}: controlla.`);
    }
    const { eventi, nonTrovate, riepilogo } = gsCalcolaAllenatore(lett.risultati);

    // Non assegno due volte lo stesso bonus/malus alla stessa squadra nella stessa giornata.
    const { data: gia, error } = await sb.from("sponsor_eventi").select("squadra_id,tipo_sponsor")
      .eq("giornata", num).in("tipo_sponsor", ["vittoria_allenatore", "sconfitta_allenatore"]);
    if (error) throw error;
    const giaSet = new Set((gia || []).map(r => `${r.squadra_id}|${r.tipo_sponsor}`));
    const daAssegnare = [], giaAssegnati = [];
    for (const e of eventi) {
      const sq = gsTrovaSquadra(e.squadra);
      (sq && giaSet.has(`${sq.id}|${e.tipo}`) ? giaAssegnati : daAssegnare).push(e);
    }
    gsAllenatoreEventi = daAssegnare;

    let html = `<h3>Serie A — giornata ${num}</h3>`;
    html += `<details open><summary>Partite lette (${lett.partite.length})</summary><p style="line-height:1.6">${
      lett.partite.map(m => `${gsEsc(m.casa)} ${m.gCasa}-${m.gTrasf} ${gsEsc(m.trasf)}`).join("<br>")}</p></details>`;
    html += `<details open><summary>Allenatori nell'app (${riepilogo.length} squadre)</summary><p style="line-height:1.6">${
      riepilogo.length ? riepilogo.map(r => `${gsEsc(r.squadra)} → ${gsEsc(r.allenatore)}: ${gsEsc(r.esito)}`).join("<br>")
        : "Non trovo nessuna squadra caricata nell'app."}</p></details>`;
    const tuttiAvvisi = [...avvisi, ...nonTrovate];
    if (tuttiAvvisi.length) {
      html += `<div class="gs-warn"><b>⚠️ Da controllare:</b><br>${tuttiAvvisi.map(gsEsc).join("<br>")}</div>`;
    }
    if (giaAssegnati.length) {
      html += `<div class="gs-warn">Già assegnati per questa giornata (non li ripeto): ${giaAssegnati.map(e => gsEsc(e.squadra)).join(", ")}</div>`;
    }
    if (!daAssegnare.length) {
      html += `<p>Nessun bonus/malus allenatore da assegnare per questa giornata.</p>`;
    } else {
      html += `<div class="gs-scroll-tbl"><table class="gs-tbl"><tr><th>Squadra</th><th>Sponsor</th><th>Dettaglio</th><th>FM</th><th>Tifosi</th></tr>`;
      for (const e of daAssegnare) {
        html += `<tr><td>${gsEsc(e.squadra)}</td><td>${gsEsc(e.nome)}</td><td>${gsEsc(e.dettaglio)}</td>
          <td class="${e.soldi >= 0 ? "gs-pos" : "gs-neg"}">${e.soldi.toLocaleString("it-IT")}</td>
          <td class="${e.tifosi >= 0 ? "gs-pos" : "gs-neg"}">${e.tifosi}</td></tr>`;
      }
      html += `</table></div><button class="gs-btn" onclick="gsConfermaAllenatore()">✅ Confermo, assegna</button>`;
    }
    div.innerHTML = html;
  } catch (e) {
    div.innerHTML = "Errore: " + gsEsc(e.message);
  }
}

async function gsConfermaAllenatore() {
  if (!gsAllenatoreEventi) return;
  try {
    for (const e of gsAllenatoreEventi) {
      const sq = gsTrovaSquadra(e.squadra);
      if (!sq) continue;
      await sb.from("sponsor_eventi").insert({
        giornata: gsAllenatoreGiornata, squadra_id: sq.id, tipo_sponsor: e.tipo,
        nome_sponsor: e.nome, soldi: e.soldi, tifosi: e.tifosi, dettaglio: e.dettaglio,
      });
      const { data } = await sb.from("squadre").select("bilancio,tifosi").eq("id", sq.id).single();
      await sb.from("squadre").update({
        bilancio: (data?.bilancio || 0) + e.soldi,
        tifosi: (data?.tifosi || 0) + e.tifosi,
      }).eq("id", sq.id);
    }
    showToast(`✅ Bonus allenatore assegnati: ${gsAllenatoreEventi.length}`);
    gsMostraTab("log");
  } catch (e) {
    showToast("❌ Errore: " + e.message, "error");
  }
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
  html += `<div class="gs-scroll-tbl"><table class="gs-tbl"><tr><th>Pos.</th><th>Squadra</th><th>Punti</th><th>V</th><th>P</th><th>S</th><th>Fantapunti tot.</th><th>Premio</th><th></th></tr>`;
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
  html += `</table></div>`;
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
  gsRisoluzioniMaglie = {}; // nuovo file = si riparte da zero con gli abbinamenti
  try {
    await gsAssicuraSquadre(); // l'elenco squadre serve per le maglie 7/9/10
    const buf = await gsFileCorrente.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array", cellStyles: true });
    gsPartiteLette = gsParsaGiornata(wb);
    try { gsStagionali = { eventi: await gsCalcolaStagionali(giornataNum, gsPartiteLette), errore: null }; }
    catch (e) { gsStagionali = { eventi: [], errore: e.message }; }
    gsRenderAnteprima();
  } catch (e) {
    showToast("❌ Errore lettura file: " + e.message, "error");
  }
}

function gsRisolviMaglia(chiave, valore) {
  gsRisoluzioniMaglie[chiave] = valore;
  gsRenderAnteprima();
}

function gsRenderAnteprima() {
  const div = document.getElementById("gs-anteprima");
  const calc = gsCalcolaSponsor(gsPartiteLette, gsRisoluzioniMaglie);
  const { incerti, daRisolvere } = calc;
  const stag = gsStagionali || { eventi: [], errore: null };
  if (stag.errore) incerti.push("Sponsor stagionali (30 gol, 20 assist, fantagol) non calcolati: " + stag.errore);
  const { eventi, totali } = gsUnisciStagionali(calc, stag.eventi);
  let html = `<h3>Giornata ${gsGiornataNum} — ${gsPartiteLette.length} partite lette</h3>`;
  html += `<p>Controlla sotto cosa ha letto l'app. Se qualcosa non torna (un voto, un giocatore che non doveva/doveva contare, un cartellino), <b>correggilo prima di confermare</b> — dopo la conferma i soldi vengono assegnati.</p>`;
  if (daRisolvere.length) {
    html += `<div class="gs-warn"><b>👕 Maglie da confermare:</b> il nome in rosa non combacia esatto con quello nel file voti — cerca e scegli tu chi è.<br>`;
    for (const d of daRisolvere) {
      html += `<div style="margin-top:8px">[${d.squadra}] Maglia ${d.numero} — in rosa è "<b>${d.giocatoreVeroNome}</b>", nel file è:
        <select onchange="gsRisolviMaglia('${d.chiave}', this.value)">
          <option value="">— scegli —</option>
          ${d.opzioni.map(o => `<option value="${o.idx}">${o.nome}</option>`).join("")}
          <option value="nessuno">— non ha giocato / nessuna corrispondenza —</option>
        </select></div>`;
    }
    html += `</div>`;
  }
  if (incerti.length) {
    html += `<div class="gs-warn"><b>⚠️ Da controllare a mano (non ancora calcolato):</b><br>${incerti.map(i => i.replace(/</g, "&lt;")).join("<br>")}</div>`;
  }
  html += `<div class="gs-scroll-tbl"><table class="gs-tbl"><tr><th>Squadra</th><th>Sponsor</th><th>Dettaglio</th><th>FM</th><th>Tifosi</th></tr>`;
  for (const e of eventi) {
    html += `<tr><td>${e.squadra}</td><td>${e.nome}</td><td>${e.dettaglio}</td>
      <td class="${e.soldi >= 0 ? "gs-pos" : "gs-neg"}">${e.soldi.toLocaleString("it-IT")}</td>
      <td class="${e.tifosi >= 0 ? "gs-pos" : "gs-neg"}">${e.tifosi}</td></tr>`;
  }
  html += `</table></div><h3>Totale per squadra</h3><div class="gs-scroll-tbl"><table class="gs-tbl"><tr><th>Squadra</th><th>FM</th><th>Tifosi</th></tr>`;
  for (const [sq, v] of Object.entries(totali).sort((a, b) => b[1].soldi - a[1].soldi)) {
    html += `<tr><td>${sq}</td><td class="${v.soldi >= 0 ? "gs-pos" : "gs-neg"}">${v.soldi.toLocaleString("it-IT")}</td>
      <td class="${v.tifosi >= 0 ? "gs-pos" : "gs-neg"}">${v.tifosi}</td></tr>`;
  }
  html += `</table></div><button class="gs-btn" onclick="gsConfermaESalva()">✅ Confermo, salva e assegna</button>`;
  div.innerHTML = html;
}

async function gsConfermaESalva() {
  if (!gsPartiteLette) return;
  const calc = gsCalcolaSponsor(gsPartiteLette, gsRisoluzioniMaglie);
  let stagEventi = [];
  try { stagEventi = await gsCalcolaStagionali(gsGiornataNum, gsPartiteLette); }
  catch (e) { showToast("❌ Errore sponsor stagionali: " + e.message, "error"); return; }
  const { eventi, totali } = gsUnisciStagionali(calc, stagEventi);
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
    // 3) aggiorna le serie (vittorie/sconfitte di fila ecc.) e premia le soglie 5/10/15
    const bonusSerie = await gsAggiornaSerie(gsPartiteLette);

    showToast(`✅ Giornata ${gsGiornataNum} salvata: ${eventi.length + bonusSerie} sponsor assegnati`);
    gsMostraTab("log");
  } catch (e) {
    showToast("❌ Errore salvataggio: " + e.message, "error");
  }
}

// ============================================================
// 2quinquies) SPONSOR STAGIONALI: 30 gol, 20 assist, 50 fantagol, ogni 20 fantagol
// Si calcolano sui totali di tutta la stagione: giornate gia' salvate (giornate_import) + quella che stai importando.
// Contano solo i calciatori che hanno contato (come per gli altri sponsor). Fantagol = gol segnati nella partita di lega.
// ============================================================
let gsStagionali = null;

function gsTotaliGiornataSquadra(giocatori, risultato, lato) {
  let gol = 0, assist = 0;
  for (const gi of giocatori || []) {
    if (!gi.haContato) continue;
    gol += gsConta(gi.gol, GS_PESO.gol);
    assist += gsConta(gi.assist, GS_PESO.assistStd)
      + gsConta(gi.assistSoft, GS_PESO.assistSoft)
      + gsConta(gi.assistGold, GS_PESO.assistGold);
  }
  const m = /^(\d+)-(\d+)$/.exec(String(risultato || "").trim());
  const fantagol = m ? parseInt(lato === "casa" ? m[1] : m[2]) : 0;
  return { gol, assist, fantagol };
}

async function gsCalcolaStagionali(giornataNum, partite) {
  const { data: righe, error } = await sb.from("giornate_import")
    .select("giornata,squadra_id,risultato,casa_o_trasferta,giocatori").lt("giornata", giornataNum);
  if (error) throw error;
  const vuoto = () => ({ gol: 0, assist: 0, fantagol: 0 });
  const somma = (o, id, t) => { if (!o[id]) o[id] = vuoto(); o[id].gol += t.gol; o[id].assist += t.assist; o[id].fantagol += t.fantagol; };
  const prima = {}, dopo = {}, nomi = {};
  for (const r of righe || []) somma(prima, r.squadra_id, gsTotaliGiornataSquadra(r.giocatori, r.risultato, r.casa_o_trasferta));
  for (const id of Object.keys(prima)) dopo[id] = { ...prima[id] };
  for (const p of partite) {
    for (const [lato, nomeFile, blocco] of [["casa", p.casa, p.squadraCasa], ["trasferta", p.trasferta, p.squadraTrasferta]]) {
      const sq = squadreDB.find(s => s.nome === gsNomeVero(nomeFile));
      if (!sq) continue;
      nomi[sq.id] = sq.nome;
      if (!prima[sq.id]) prima[sq.id] = vuoto();
      if (!dopo[sq.id]) dopo[sq.id] = { ...prima[sq.id] };
      somma(dopo, sq.id, gsTotaliGiornataSquadra(blocco.giocatori, p.risultato, lato));
    }
  }

  const tipi = ["gol30_1", "gol30_2", "gol30_3", "assist20_1", "assist20_2", "assist20_3", "fantagol50", "fantagol20"];
  const { data: gia, error: e2 } = await sb.from("sponsor_eventi").select("squadra_id,tipo_sponsor,dettaglio").in("tipo_sponsor", tipi);
  if (e2) throw e2;
  const eventi = [];
  const aggiungi = (id, tipo, dettaglio) => {
    const sp = GS_SPONSOR[tipo];
    eventi.push({ squadra: nomi[id], tipo, nome: sp.nome, soldi: sp.soldi, tifosi: sp.tifosi, dettaglio });
  };
  const ids = Object.keys(nomi);

  // Podio 1a/2a/3a squadra che raggiunge la soglia. A parita' nella stessa giornata: ex aequo, stessa posizione.
  function podio(prefisso, campo, soglia, etichetta) {
    const premiate = new Set((gia || []).filter(g => g.tipo_sponsor.startsWith(prefisso)).map(g => String(g.squadra_id)));
    const giaOltre = Object.keys(prima).filter(id => prima[id][campo] >= soglia).length;
    let pos = Math.max(premiate.size, giaOltre) + 1;
    const arrivate = ids.filter(id => !premiate.has(String(id)) && prima[id][campo] < soglia && dopo[id][campo] >= soglia)
      .sort((a, b) => dopo[b][campo] - dopo[a][campo]);
    let i = 0;
    while (i < arrivate.length && pos <= 3) {
      const tot = dopo[arrivate[i]][campo];
      const gruppo = arrivate.filter(id => dopo[id][campo] === tot);
      for (const id of gruppo) {
        aggiungi(id, prefisso + pos, `${tot} ${etichetta}${gruppo.length > 1 ? " (ex aequo)" : ""}: ${pos}ª squadra a quota ${soglia}`);
      }
      pos += gruppo.length; i += gruppo.length;
    }
  }
  podio("gol30_", "gol", 30, "gol");
  podio("assist20_", "assist", 20, "assist");

  // Prima squadra a 50 fantagol (una sola, salvo ex aequo nella stessa giornata)
  const gia50 = (gia || []).some(g => g.tipo_sponsor === "fantagol50");
  const qualcunoOltre50 = Object.keys(prima).some(id => prima[id].fantagol >= 50);
  if (!gia50 && !qualcunoOltre50) {
    const arr = ids.filter(id => prima[id].fantagol < 50 && dopo[id].fantagol >= 50);
    if (arr.length) {
      const max = Math.max(...arr.map(id => dopo[id].fantagol));
      const gruppo = arr.filter(id => dopo[id].fantagol === max);
      for (const id of gruppo) aggiungi(id, "fantagol50", `${max} fantagol${gruppo.length > 1 ? " (ex aequo)" : ""}: prima squadra a quota 50`);
    }
  }

  // Ogni 20 fantagol: ogni squadra, a ogni multiplo di 20 raggiunto (20, 40, 60...)
  const premi20 = new Set((gia || []).filter(g => g.tipo_sponsor === "fantagol20").map(g => `${g.squadra_id}|${g.dettaglio}`));
  for (const id of ids) {
    for (let k = Math.floor(prima[id].fantagol / 20) + 1; k <= Math.floor(dopo[id].fantagol / 20); k++) {
      const det = `${k * 20} fantagol raggiunti`;
      if (!premi20.has(`${id}|${det}`)) aggiungi(id, "fantagol20", det);
    }
  }
  return eventi;
}

function gsUnisciStagionali(calc, stag) {
  const eventi = [...calc.eventi, ...stag];
  const totali = {};
  for (const [k, v] of Object.entries(calc.totali)) totali[k] = { ...v };
  for (const e of stag) {
    if (!totali[e.squadra]) totali[e.squadra] = { soldi: 0, tifosi: 0 };
    totali[e.squadra].soldi += e.soldi;
    totali[e.squadra].tifosi += e.tifosi;
  }
  return { eventi, totali };
}

// ============================================================
// 2sexies) OBIETTIVI STAGIONE: quanto manca a ogni squadra per sbloccare gli sponsor stagionali
// ============================================================
async function gsRenderObiettivi(body) {
  body.innerHTML = "Carico i totali di stagione...";
  try {
    await gsAssicuraSquadre();
    const { data: righe, error } = await sb.from("giornate_import")
      .select("giornata,squadra_id,risultato,casa_o_trasferta,giocatori");
    if (error) throw error;
    const tot = {}, giornate = new Set();
    for (const r of righe || []) {
      giornate.add(r.giornata);
      const t = gsTotaliGiornataSquadra(r.giocatori, r.risultato, r.casa_o_trasferta);
      if (!tot[r.squadra_id]) tot[r.squadra_id] = { gol: 0, assist: 0, fantagol: 0 };
      tot[r.squadra_id].gol += t.gol; tot[r.squadra_id].assist += t.assist; tot[r.squadra_id].fantagol += t.fantagol;
    }
    const elenco = squadreDB.map(sq => ({ id: sq.id, nome: sq.nome_squadra || sq.nome, ...(tot[sq.id] || { gol: 0, assist: 0, fantagol: 0 }) }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "it"));
    const oltre = (campo, soglia) => elenco.filter(e => e[campo] >= soglia);
    const liberiGol = Math.max(0, 3 - oltre("gol", 30).length);
    const liberiAssist = Math.max(0, 3 - oltre("assist", 20).length);
    const primoFg50 = elenco.filter(e => e.fantagol >= 50).sort((a, b) => b.fantagol - a.fantagol)[0];

    const cella = (v, soglia, liberi) => {
      if (v >= soglia) return `<b class="gs-pos">✅ ${v}</b>`;
      if (!liberi) return `${v}<br><small>(posti esauriti)</small>`;
      return `<b>${v}</b> / ${soglia}<br><small>mancano ${soglia - v}</small>`;
    };
    let html = `<h3>Totali dopo ${giornate.size} giornat${giornate.size === 1 ? "a" : "e"}</h3>
      <p style="line-height:1.6">
      <b>30 gol</b> dei calciatori: posti liberi ${liberiGol} su 3<br>
      <b>20 assist</b> dei calciatori: posti liberi ${liberiAssist} su 3<br>
      <b>50 fantagol</b>: ${primoFg50 ? "già conquistato da " + gsEsc(primoFg50.nome) : "ancora libero"}<br>
      <b>Ogni 20 fantagol</b>: bonus per tutti, a ogni traguardo (20, 40, 60...)</p>
      <div class="gs-scroll-tbl"><table class="gs-tbl"><tr><th>Squadra</th><th>Gol</th><th>Assist</th><th>Fantagol</th></tr>`;
    for (const e of elenco) {
      const prossimo = (Math.floor(e.fantagol / 20) + 1) * 20;
      let fg = `<b>${e.fantagol}</b>`;
      if (!primoFg50 && e.fantagol < 50) fg += `<br><small>prima a 50: mancano ${50 - e.fantagol}</small>`;
      fg += `<br><small>bonus a ${prossimo}: mancano ${prossimo - e.fantagol}</small>`;
      html += `<tr><td>${gsEsc(e.nome)}</td><td>${cella(e.gol, 30, liberiGol)}</td><td>${cella(e.assist, 20, liberiAssist)}</td><td>${fg}</td></tr>`;
    }
    html += `</table></div>`;

    // --- Serie in corso (vittorie/sconfitte di fila, senza sconfitta, senza vittoria) ---
    const { data: serie, error: e2 } = await sb.from("serie_squadre").select("*");
    if (e2) throw e2;
    const perId = Object.fromEntries((serie || []).map(r => [String(r.squadra_id), r]));
    const cellaSerie = (v) => {
      const prossima = [5, 10, 15].find(x => x > v);
      if (!prossima) return `<b class="gs-pos">✅ ${v}</b><br><small>massimo raggiunto</small>`;
      return `<b>${v}</b><br><small>mancano ${prossima - v} per ${prossima}</small>`;
    };
    html += `<h3 style="margin-top:22px">Serie in corso</h3>
      <p style="line-height:1.5"><small>Ogni serie riparte da 0 quando si interrompe. Un pareggio azzera vittorie e sconfitte di fila, ma non "senza sconfitta" né "senza vittoria".</small></p>
      <div class="gs-scroll-tbl"><table class="gs-tbl"><tr><th>Squadra</th><th>Vittorie di fila</th><th>Sconfitte di fila</th><th>Senza sconfitta</th><th>Senza vittoria</th></tr>`;
    for (const e of elenco) {
      const r = perId[String(e.id)] || {};
      html += `<tr><td>${gsEsc(e.nome)}</td><td>${cellaSerie(r.vittorie_fila || 0)}</td><td>${cellaSerie(r.sconfitte_fila || 0)}</td>
        <td>${cellaSerie(r.senza_sconfitta_fila || 0)}</td><td>${cellaSerie(r.senza_vittoria_fila || 0)}</td></tr>`;
    }
    html += `</table></div>`;
    body.innerHTML = html;
  } catch (e) {
    body.innerHTML = "Errore nel caricare i totali: " + gsEsc(e.message);
  }
}

// ============================================================
// 2ter) SERIE / STRISCE: vittorie, sconfitte, senza sconfitta, senza vittoria (soglie 5-10-15)
// ============================================================
function gsEsitoSquadra(risultato, lato) {
  const m = /^(\d+)-(\d+)$/.exec(String(risultato || "").trim());
  if (!m) return null;
  const gCasa = parseInt(m[1]), gTrasf = parseInt(m[2]);
  const gMia = lato === "casa" ? gCasa : gTrasf;
  const gAvv = lato === "casa" ? gTrasf : gCasa;
  if (gMia > gAvv) return "vittoria";
  if (gMia < gAvv) return "sconfitta";
  return "pareggio";
}

async function gsAggiornaSerie(partite) {
  let bonusAssegnati = 0;
  for (const p of partite) {
    for (const [lato, nomeFile] of [["casa", p.casa], ["trasferta", p.trasferta]]) {
      const nomeVero = gsNomeVero(nomeFile);
      const sq = squadreDB.find(s => s.nome === nomeVero);
      if (!sq) continue;
      const esito = gsEsitoSquadra(p.risultato, lato);
      if (!esito) continue;
      bonusAssegnati += await gsAggiornaSerieSquadra(sq, esito);
    }
  }
  return bonusAssegnati;
}

async function gsAggiornaSerieSquadra(sq, esito) {
  const { data: riga } = await sb.from("serie_squadre").select("*").eq("squadra_id", sq.id).maybeSingle();
  const stato = riga || {
    squadra_id: sq.id, vittorie_fila: 0, sconfitte_fila: 0,
    senza_sconfitta_fila: 0, senza_vittoria_fila: 0,
    soglie_premiate_vittorie: [], soglie_premiate_sconfitte: [],
    soglie_premiate_senza_sconfitta: [], soglie_premiate_senza_vittoria: [],
  };

  // Aggiorno i 4 contatori in base all'esito. Un contatore che si azzera
  // riparte anche con le soglie azzerate (puo' essere ri-premiato in una nuova serie).
  if (esito === "vittoria") {
    stato.vittorie_fila++;
    stato.sconfitte_fila = 0; stato.soglie_premiate_sconfitte = [];
    stato.senza_sconfitta_fila++;
    stato.senza_vittoria_fila = 0; stato.soglie_premiate_senza_vittoria = [];
  } else if (esito === "sconfitta") {
    stato.sconfitte_fila++;
    stato.vittorie_fila = 0; stato.soglie_premiate_vittorie = [];
    stato.senza_vittoria_fila++;
    stato.senza_sconfitta_fila = 0; stato.soglie_premiate_senza_sconfitta = [];
  } else { // pareggio: non interrompe "senza sconfitta" ne' "senza vittoria", ma ferma le serie pure
    stato.vittorie_fila = 0; stato.soglie_premiate_vittorie = [];
    stato.sconfitte_fila = 0; stato.soglie_premiate_sconfitte = [];
    stato.senza_sconfitta_fila++;
    stato.senza_vittoria_fila++;
  }

  let bonusAssegnati = 0;
  for (const [tipo, cfg] of Object.entries(GS_SOGLIE_SERIE)) {
    const valore = stato[cfg.campo];
    const premiate = stato[cfg.soglie_campo];
    for (const soglia of [5, 10, 15]) {
      if (valore >= soglia && !premiate.includes(soglia)) {
        const premio = cfg[soglia];
        await sb.from("sponsor_eventi").insert({
          giornata: gsGiornataNum, squadra_id: sq.id, tipo_sponsor: `serie_${tipo}_${soglia}`,
          nome_sponsor: premio.nome, soldi: premio.soldi, tifosi: premio.tifosi,
          dettaglio: `${sq.nome}: ${valore} di fila`,
        });
        const { data: sqDati } = await sb.from("squadre").select("bilancio,tifosi").eq("id", sq.id).single();
        await sb.from("squadre").update({
          bilancio: (sqDati?.bilancio || 0) + premio.soldi,
          tifosi: (sqDati?.tifosi || 0) + premio.tifosi,
        }).eq("id", sq.id);
        premiate.push(soglia);
        bonusAssegnati++;
      }
    }
  }

  await sb.from("serie_squadre").upsert(stato, { onConflict: "squadra_id" });
  return bonusAssegnati;
}

async function gsRenderLog(body) {
  body.innerHTML = "Carico...";
  const { data, error } = await sb.from("sponsor_eventi").select("*").order("giornata", { ascending: false }).order("id", { ascending: false }).limit(200);
  if (error) { body.innerHTML = "Errore: " + error.message; return; }
  const squadrePerId = Object.fromEntries(squadreDB.map(s => [s.id, s.nome]));
  let html = `<div class="gs-scroll-tbl"><table class="gs-tbl"><tr><th>Giornata</th><th>Squadra</th><th>Sponsor</th><th>Dettaglio</th><th>FM</th><th>Tifosi</th></tr>`;
  for (const e of (data || [])) {
    html += `<tr><td>${e.giornata}</td><td>${squadrePerId[e.squadra_id] || "?"}</td><td>${e.nome_sponsor}</td><td>${e.dettaglio || ""}</td>
      <td class="${e.soldi >= 0 ? "gs-pos" : "gs-neg"}">${Number(e.soldi).toLocaleString("it-IT")}</td>
      <td class="${e.tifosi >= 0 ? "gs-pos" : "gs-neg"}">${e.tifosi}</td></tr>`;
  }
  html += `</table></div>`;
  body.innerHTML = html || "Nessuno sponsor ancora registrato.";
}

function gsRenderTabellaStatica(body) {
  let html = `<div class="gs-scroll-tbl"><table class="gs-tbl"><tr><th>Bonus</th><th>Soldi</th><th>Tifosi</th></tr>`;
  for (const s of Object.values(GS_SPONSOR)) {
    html += `<tr><td>${s.nome}</td>
      <td class="${s.soldi >= 0 ? "gs-pos" : "gs-neg"}">${(s.soldi / 1000000).toLocaleString("it-IT")} M</td>
      <td class="${s.tifosi >= 0 ? "gs-pos" : "gs-neg"}">${s.tifosi}</td></tr>`;
  }
  html += `</table></div>`;
  body.innerHTML = html;
}
