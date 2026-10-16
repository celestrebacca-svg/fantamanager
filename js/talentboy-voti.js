// ===== TALENT BOY UNDER 23 — LETTORE VOTI (file .xlsx dei voti di giornata) =====
// Solo admin. Legge il foglio "Fantacalcio" del file voti, trova il voto di OGNI giocatore schierato nella
// formazione U23 di quella giornata (formazioni_u23_giornata), calcola il fantavoto e salva in talentboy_voti.
// Abbinamenti nome-file -> giocatore: salvati UNA volta in talentboy_mappa_nomi (non si richiedono più).
// Richiede: formazione.js (GIORNATA_INIZIO_U23), talentboy.js (talentboyCalendario), sb, squadreDB, giocatoriDB.

// Pesi del fantavoto (gli stessi della lega principale). Nel file l'assist è una sola colonna: ogni assist vale 1.
// Il "gol" per il capocannoniere = gol + rigori segnati. Porta inviolata: +1 al portiere con voto e 0 gol subiti.
const TBV_PESI = { gol: 3, rigSegnato: 3, rigSbagliato: -3, rigParato: 3, autogol: -2, golSubito: -1, assist: 1, amm: -0.5, esp: -1, inviolata: 1 };

let tbv = { giornata: null, righe: [], titolari: [], mappa: {}, titoloGiornata: null, inCorso: false };

const tbvGI = () => (typeof GIORNATA_INIZIO_U23 !== "undefined" ? GIORNATA_INIZIO_U23 : 7);
const tbvStagione = () => (typeof STAGIONE_CORRENTE !== "undefined" ? STAGIONE_CORRENTE : "");
function tbvEsc(t) { return String(t == null ? "" : t).replace(/[<>&"]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c])); }
function tbvNum(n) { const x = Number(n); return Number.isFinite(x) ? x : 0; }
function tbvFmt(x) { return x == null ? "—" : Number(x).toLocaleString("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 2 }); }
function tbvMsg(t, err) {
  const e = document.getElementById("tbv-esito");
  if (e) e.innerHTML = `<div style="background:${err ? "rgba(255,92,92,0.12)" : "rgba(0,255,135,0.1)"};border:1px solid ${err ? "var(--rosso,#f55)" : "var(--verde,#0f8)"};border-radius:8px;padding:10px;font-size:12px;margin:8px 0"><b>${tbvEsc(t)}</b></div>`;
  try { showToast(t, err ? "error" : undefined); } catch (_) {}
}

// ---------- nomi ----------
function tbvNorm(s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function tbvTokens(nome) { return String(nome || "").trim().split(/\s+/).map(p => ({ t: tbvNorm(p), ab: p.endsWith(".") })).filter(x => x.t); }
const tbvChiave = r => tbvNorm(r.nome) + "|" + r.ruolo;

// punteggio di somiglianza tra il nome nel file (es. "Paz N.") e il nome del giocatore in app
function tbvPunteggio(nomeFile, nomeDb) {
  const ft = tbvTokens(nomeFile), dt = tbvTokens(nomeDb).map(x => x.t);
  if (!ft.length || !dt.length) return 0;
  const ftt = ft.map(x => x.t);
  if (ftt.join(" ") === dt.join(" ")) return 100;
  const usati = new Set();
  const ok = ft.every(f => {
    const i = dt.findIndex((d, k) => !usati.has(k) && (d === f.t || (f.ab && d.startsWith(f.t))));
    if (i < 0) return false;
    usati.add(i); return true;
  });
  if (ok) return 80 + Math.min(ft.length, 9);
  if (dt.every(d => ftt.includes(d))) return 70; // in app c'è solo il cognome
  return 0;
}
// abbinamento automatico: solo se UNO solo è il migliore e ha lo stesso ruolo; altrimenti si chiede
function tbvCerca(nomeDb, ruolo, righe) {
  const sc = righe.map((r, i) => ({ i, s: tbvPunteggio(r.nome, nomeDb) })).filter(x => x.s >= 70 && righe[x.i].ruolo === ruolo);
  if (!sc.length) return null;
  sc.sort((a, b) => b.s - a.s);
  if (sc.length > 1 && sc[1].s === sc[0].s) return null;
  return sc[0].i;
}

// ---------- fantavoto ----------
function tbvFantavoto(r) {
  if (typeof r.voto !== "number") return null; // "6*" = senza voto
  let f = r.voto + TBV_PESI.gol * r.gf + TBV_PESI.rigSegnato * r.rf + TBV_PESI.rigSbagliato * r.rs + TBV_PESI.rigParato * r.rp
    + TBV_PESI.autogol * r.au + TBV_PESI.assist * r.ass + TBV_PESI.amm * r.amm + TBV_PESI.esp * r.esp;
  if (r.ruolo === "P") { f += TBV_PESI.golSubito * r.gs; if (r.gs === 0) f += TBV_PESI.inviolata; }
  return Math.round(f * 100) / 100;
}

// ---------- lettura file ----------
async function tbvCaricaXlsx() {
  if (typeof XLSX !== "undefined") return;
  await new Promise((ok, ko) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload = ok; s.onerror = () => ko(new Error("Libreria Excel non caricata (controlla la connessione)"));
    document.head.appendChild(s);
  });
}

function tbvLeggiFile(buf) {
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets["Fantacalcio"] || wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  const m = /(\d+)\D{0,3}giornata/i.exec(String((rows[0] || [])[0] || ""));
  const righe = [];
  let team = "";
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (typeof r[0] === "string" && r[0] !== "Cod." && rows[i + 1] && rows[i + 1][0] === "Cod.") { team = r[0].trim(); continue; }
    const ruolo = String(r[1] == null ? "" : r[1]).trim().toUpperCase();
    if (typeof r[0] !== "number" || !["P", "D", "C", "A"].includes(ruolo)) continue; // salta anche gli allenatori (ALL)
    righe.push({
      team, ruolo, nome: String(r[2] || "").trim(),
      voto: typeof r[3] === "number" ? r[3] : null, // "6*" o altro testo = senza voto
      gf: tbvNum(r[4]), gs: tbvNum(r[5]), rp: tbvNum(r[6]), rs: tbvNum(r[7]), rf: tbvNum(r[8]),
      au: tbvNum(r[9]), amm: tbvNum(r[10]), esp: tbvNum(r[11]), ass: tbvNum(r[12]),
    });
  }
  return { righe, giornataFile: m ? parseInt(m[1]) : null };
}

// ---------- schermata ----------
function renderImportVotiTalentboy(containerId) {
  const c = document.getElementById(containerId);
  if (!c || typeof adminLoggato === "undefined" || !adminLoggato) return;
  const cal = typeof talentboyCalendario !== "undefined" ? talentboyCalendario : [];
  const prossime = cal.filter(m => !m.giocata && m.giornata >= tbvGI()).map(m => m.giornata);
  const def = prossime.length ? Math.min(...prossime) : tbvGI();
  const opts = Array.from({ length: 38 - tbvGI() + 1 }, (_, i) => tbvGI() + i).map(n => `<option value="${n}" ${n === def ? "selected" : ""}>${n}ª giornata</option>`).join("");
  c.innerHTML = `
    <div style="font-family:'Bebas Neue',sans-serif;font-size:20px;color:var(--oro);letter-spacing:1px;margin-bottom:12px">📥 IMPORTA VOTI GIORNATA (ADMIN)</div>
    <div style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:10px;padding:12px">
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px">
        <select id="tbv-giornata" style="background:var(--grigio-scuro);color:var(--testo);border:1px solid var(--grigio-chiaro);border-radius:6px;padding:6px 10px;font-size:12px">${opts}</select>
        <input type="file" id="tbv-file" accept=".xlsx,.xls" style="font-size:12px;max-width:100%">
      </div>
      <button onclick="tbvLeggi()" style="width:100%;background:var(--verde);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:16px;padding:10px;border-radius:8px;border:none;cursor:pointer">📖 LEGGI FILE E CALCOLA</button>
      <div style="font-size:11px;color:var(--testo-dim);margin-top:8px">Conta solo chi è schierato titolare nella giornata scelta. "6*" = senza voto (0 punti, non conta come presenza). Non salva niente finché non confermi.</div>
    </div>
    <div id="tbv-esito"></div><div id="tbv-anteprima"></div>`;
}

async function tbvLeggi() {
  if (tbv.inCorso) return;
  const g = parseInt(document.getElementById("tbv-giornata").value);
  const f = document.getElementById("tbv-file").files[0];
  if (!f) { tbvMsg("Scegli prima il file .xlsx dei voti", true); return; }
  tbv.inCorso = true;
  try {
    tbvMsg("⏳ Leggo il file...");
    await tbvCaricaXlsx();
    const { righe, giornataFile } = tbvLeggiFile(await f.arrayBuffer());
    if (!righe.length) throw new Error("Nel file non ho trovato giocatori: è il file voti giusto?");
    if (giornataFile && giornataFile !== g && !confirm(`Attenzione: il file è della ${giornataFile}ª giornata, ma hai scelto la ${g}ª.\n\nContinuare comunque?`)) { tbvMsg("Operazione annullata"); return; }

    const { data: forms, error: e1 } = await sb.from("formazioni_u23_giornata").select("squadra_id,giornata,titolari").eq("giornata", g);
    if (e1) throw new Error("formazioni non lette: " + e1.message);
    const { data: mappaDb, error: e2 } = await sb.from("talentboy_mappa_nomi").select("giocatore_id,chiave");
    if (e2) throw new Error("tabella talentboy_mappa_nomi mancante: esegui prima talentboy_voti.sql su Supabase (" + e2.message + ")");
    const mappa = {};
    (mappaDb || []).forEach(m => { mappa[String(m.giocatore_id)] = m.chiave; });

    const titolari = [];
    for (const fo of forms || []) {
      for (const t of fo.titolari || []) {
        const gi = giocatoriDB.find(x => x.id === t.gid);
        if (!gi) continue;
        const ruolo = String(gi.ruolo || t.slot.charAt(0)).trim().toUpperCase().charAt(0);
        const x = { sqId: fo.squadra_id, gid: gi.id, nome: gi.nome, ruolo, riga: null, stato: "da_abbinare", cambiando: false };
        if (mappa[String(gi.id)]) {
          const idx = righe.map((r, i) => i).filter(i => tbvChiave(righe[i]) === mappa[String(gi.id)]);
          if (idx.length === 1) { x.riga = idx[0]; x.stato = "salvato"; }
          else if (idx.length === 0) x.stato = "assente"; // abbinato in passato ma questa settimana non è nel file
        } else {
          const a = tbvCerca(gi.nome, ruolo, righe);
          if (a !== null) { x.riga = a; x.stato = "auto"; }
        }
        titolari.push(x);
      }
    }
    tbv = { giornata: g, righe, titolari, mappa, titoloGiornata: giornataFile, inCorso: true };
    if (!titolari.length) { tbvMsg(`Nessuna formazione U23 salvata per la ${g}ª giornata: inseriscile prima`, true); document.getElementById("tbv-anteprima").innerHTML = ""; return; }
    const da = titolari.filter(t => t.stato === "da_abbinare").length;
    tbvMsg(da ? `📋 Letti ${righe.length} giocatori. Da abbinare a mano: ${da}` : `✅ Letti ${righe.length} giocatori, tutti abbinati. Controlla e conferma.`);
    tbvRender();
  } catch (e) { tbvMsg("❌ " + e.message, true); }
  finally { tbv.inCorso = false; }
}

function tbvSelect(i, t) {
  const stessi = [], altri = [];
  tbv.righe.forEach((r, k) => (r.ruolo === t.ruolo ? stessi : altri).push({ r, k }));
  const ord = (a, b) => a.r.nome.localeCompare(b.r.nome);
  const opt = x => `<option value="${x.k}" ${t.riga === x.k ? "selected" : ""}>${tbvEsc(x.r.nome)} (${tbvEsc(x.r.team)})${x.r.voto == null ? " · s.v." : ""}</option>`;
  return `<select onchange="tbvScegli(${i},this.value)" style="width:100%;font-size:11px;padding:5px;background:var(--grigio-scuro);color:var(--testo);border:1px solid var(--oro,#fd0);border-radius:6px">
    <option value="">— scegli chi è nel file —</option>
    <option value="nogioca" ${t.stato === "non_giocato" ? "selected" : ""}>Non ha giocato (senza voto)</option>
    <optgroup label="Stesso ruolo (${tbvEsc(t.ruolo)})">${stessi.sort(ord).map(opt).join("")}</optgroup>
    <optgroup label="Altri ruoli">${altri.sort(ord).map(opt).join("")}</optgroup></select>`;
}

function tbvScegli(i, v) {
  const t = tbv.titolari[i];
  if (!t || v === "") return;
  if (v === "nogioca") { t.riga = null; t.stato = "non_giocato"; }
  else { t.riga = parseInt(v); t.stato = "manuale"; }
  t.cambiando = false;
  tbvRender();
}
function tbvCambia(i) { tbv.titolari[i].cambiando = true; tbvRender(); }

function tbvRender() {
  const c = document.getElementById("tbv-anteprima");
  if (!c) return;
  const sqNome = id => { const s = squadreDB.find(x => String(x.id) === String(id)); return s ? (s.nome_squadra || s.nome) : String(id); };
  const ordRuolo = { P: 0, D: 1, C: 2, A: 3 };
  const tot = {};
  tbv.titolari.forEach(t => {
    const r = t.riga !== null ? tbv.righe[t.riga] : null;
    t._fv = r ? tbvFantavoto(r) : null;
    const k = String(t.sqId);
    if (!tot[k]) tot[k] = { tot: 0, n: 0, conVoto: 0 };
    tot[k].n++; tot[k].tot += t._fv || 0; if (t._fv !== null) tot[k].conVoto++;
  });
  const totDi = id => Math.round(((tot[String(id)] || { tot: 0 }).tot) * 100) / 100;

  const riga = t => {
    const i = tbv.titolari.indexOf(t);
    const r = t.riga !== null ? tbv.righe[t.riga] : null;
    const colRuolo = { P: "var(--oro)", D: "var(--blu)", C: "var(--verde)", A: "var(--rosso)" }[t.ruolo] || "var(--testo)";
    const badge = `<span style="font-size:9px;color:${colRuolo};background:rgba(255,255,255,0.06);padding:2px 5px;border-radius:3px;font-weight:700;flex-shrink:0">${tbvEsc(t.ruolo)}</span>`;
    if (t.stato === "da_abbinare" || t.cambiando) {
      return `<div style="padding:6px 10px;border-top:1px solid var(--grigio-chiaro)"><div style="display:flex;gap:6px;align-items:center;margin-bottom:4px;font-size:12px">${badge}<b>${tbvEsc(t.nome)}</b><span style="color:var(--oro,#fd0);font-size:10px">da abbinare</span></div>${tbvSelect(i, t)}</div>`;
    }
    let info = "";
    if (r && t._fv !== null) {
      const b = [];
      if (r.gf + r.rf) b.push(`⚽${r.gf + r.rf}`); if (r.ass) b.push(`🅰️${r.ass}`); if (r.amm) b.push("🟨"); if (r.esp) b.push("🟥");
      if (r.au) b.push(`aut${r.au}`); if (r.rs) b.push(`rig.sb${r.rs}`); if (r.rp) b.push(`rig.par${r.rp}`);
      if (r.ruolo === "P") b.push(r.gs ? `gs${r.gs}` : "inviol.");
      info = `<span style="font-size:10px;color:var(--testo-dim)">voto ${tbvFmt(r.voto)} ${b.join(" ")}</span>`;
    } else if (r) info = `<span style="font-size:10px;color:var(--testo-dim)">senza voto (${tbvEsc(r.team)})</span>`;
    else info = `<span style="font-size:10px;color:var(--testo-dim)">${t.stato === "assente" ? "non è nel file" : "non ha giocato"}</span>`;
    const abb = r ? `<div style="font-size:10px;color:var(--testo-dim)">file: ${tbvEsc(r.nome)} (${tbvEsc(r.team)}) ${t.stato === "auto" ? "· riconosciuto da solo" : t.stato === "manuale" ? "· scelto da te" : ""}</div>` : "";
    return `<div style="padding:6px 10px;border-top:1px solid var(--grigio-chiaro);display:flex;gap:8px;align-items:center;font-size:12px">
      ${badge}<div style="flex:1;min-width:0"><div><b>${tbvEsc(t.nome)}</b> ${info}</div>${abb}</div>
      <b style="min-width:38px;text-align:right">${tbvFmt(t._fv)}</b>
      <button onclick="tbvCambia(${i})" title="Cambia abbinamento" style="background:none;border:none;color:var(--testo-dim);cursor:pointer;font-size:13px">✏️</button></div>`;
  };

  const blocco = sid => {
    const lista = tbv.titolari.filter(t => String(t.sqId) === String(sid)).sort((a, b) => ordRuolo[a.ruolo] - ordRuolo[b.ruolo]);
    return `<div style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:10px;overflow:hidden;margin-bottom:8px">
      <div style="background:var(--grigio-scuro);padding:8px 10px;display:flex;justify-content:space-between;font-size:13px"><b>${tbvEsc(sqNome(sid))}</b><span>${lista.length}/11 schierati · <b style="color:var(--oro)">${tbvFmt(totDi(sid))}</b></span></div>
      ${lista.length ? lista.map(riga).join("") : `<div style="padding:10px;font-size:12px;color:var(--testo-dim);font-style:italic">Formazione non inserita</div>`}</div>`;
  };

  const cal = (typeof talentboyCalendario !== "undefined" ? talentboyCalendario : []).filter(m => m.giornata === tbv.giornata);
  let html = "";
  const mostrate = new Set();
  for (const m of cal) {
    mostrate.add(String(m.squadra_casa_id)); mostrate.add(String(m.squadra_ospite_id));
    const a = totDi(m.squadra_casa_id), b = totDi(m.squadra_ospite_id), d = Math.round(Math.abs(a - b) * 100) / 100;
    const esito = d >= 3 ? `Vince <b>${tbvEsc(sqNome(a > b ? m.squadra_casa_id : m.squadra_ospite_id))}</b> (scarto ${tbvFmt(d)})` : `Pareggio (scarto ${tbvFmt(d)}, sotto i 3 punti)`;
    html += `<div style="margin:14px 0 6px;font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:1px;color:var(--blu)">${tbvEsc(sqNome(m.squadra_casa_id))} ${tbvFmt(a)} - ${tbvFmt(b)} ${tbvEsc(sqNome(m.squadra_ospite_id))}</div>
      <div style="font-size:11px;color:var(--testo-dim);margin-bottom:6px">${esito} · solo anteprima, il risultato in calendario non viene ancora scritto</div>
      ${blocco(m.squadra_casa_id)}${blocco(m.squadra_ospite_id)}`;
  }
  const altre = [...new Set(tbv.titolari.map(t => String(t.sqId)))].filter(s => !mostrate.has(s));
  if (altre.length) html += `<div style="margin:14px 0 6px;font-size:12px;color:var(--testo-dim)">${cal.length ? "Altre squadre" : "Squadre (nessuna partita in calendario per questa giornata)"}</div>` + altre.map(blocco).join("");

  const da = tbv.titolari.filter(t => t.stato === "da_abbinare").length;
  html += `<button onclick="tbvConferma()" ${da ? "disabled" : ""} style="width:100%;margin-top:10px;background:${da ? "var(--grigio-chiaro)" : "var(--verde)"};color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:18px;padding:12px;border-radius:10px;border:none;cursor:${da ? "not-allowed" : "pointer"}">
    ${da ? `ABBINA ANCORA ${da} GIOCATORI` : `💾 CONFERMA E SALVA ${tbv.giornata}ª GIORNATA`}</button>`;
  c.innerHTML = html;
}

async function tbvConferma() {
  if (tbv.inCorso) return;
  if (tbv.titolari.some(t => t.stato === "da_abbinare")) { tbvMsg("Abbina prima tutti i giocatori evidenziati", true); return; }
  if (!confirm(`Salvo i voti Under 23 della ${tbv.giornata}ª giornata?\n\nSe esistono già, vengono sostituiti.`)) return;
  tbv.inCorso = true;
  try {
    const st = tbvStagione(), g = tbv.giornata;
    const righe = tbv.titolari.map(t => {
      const r = t.riga !== null ? tbv.righe[t.riga] : null;
      const fv = r ? tbvFantavoto(r) : null;
      const ok = fv !== null; // gol/assist contano solo se ha il voto
      return {
        stagione: st, giornata: g, squadra_id: String(t.sqId), giocatore_id: t.gid, nome: t.nome, ruolo: t.ruolo,
        voto: ok ? r.voto : null, fantavoto: fv, gol: ok ? r.gf + r.rf : 0, assist: ok ? r.ass : 0,
        dettaglio: r ? { file: r.nome, team: r.team, gf: r.gf, gs: r.gs, rp: r.rp, rs: r.rs, rf: r.rf, au: r.au, amm: r.amm, esp: r.esp, ass: r.ass } : null,
      };
    });
    const { error: e0 } = await sb.from("talentboy_voti").delete().eq("stagione", st).eq("giornata", g);
    if (e0) throw new Error("vecchi voti non cancellati: " + e0.message);
    const { error: e1 } = await sb.from("talentboy_voti").insert(righe);
    if (e1) throw new Error("voti non salvati (riprova, il file è ancora caricato): " + e1.message);

    // abbinamenti nuovi (automatici o scelti a mano): da ora in poi non si chiedono più
    const nuovi = tbv.titolari.filter(t => (t.stato === "auto" || t.stato === "manuale") && t.riga !== null)
      .map(t => ({ giocatore_id: t.gid, chiave: tbvChiave(tbv.righe[t.riga]) }));
    if (nuovi.length) {
      const { error: e2 } = await sb.from("talentboy_mappa_nomi").upsert(nuovi, { onConflict: "giocatore_id" });
      if (e2) { tbvMsg("⚠️ Voti salvati, ma gli abbinamenti non sono stati ricordati: " + e2.message, true); return; }
    }
    tbvMsg(`✅ Voti Under 23 della ${g}ª giornata salvati (${righe.length} giocatori). Abbinamenti ricordati: ${nuovi.length}`);
    document.getElementById("tbv-anteprima").innerHTML = "";
  } catch (e) { tbvMsg("❌ " + e.message, true); }
  finally { tbv.inCorso = false; }
}
