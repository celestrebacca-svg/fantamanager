// ===== RUOTA DELLA FORTUNA =====
// Una volta ogni 7 giorni ogni squadra gira la ruota: 8 spicchi, premio in TIFOSI aggiunto subito alla squadra.
// L'estrazione e il timer dei 7 giorni li gestisce il database (funzioni ruota_stato / ruota_gira in ruota.sql):
// l'animazione parte solo DOPO che il database ha già deciso il premio, quindi non si può barare.
// Richiede: ruota.sql eseguito su Supabase, sb, utenteLoggato.

let ruStato = null;     // { premi, ultimo, prossimo, storico }
let ruOffset = 0;       // differenza tra ora del server e ora del telefono/pc (il timer segue il server)
let ruTimer = null;
let ruInGiro = false;
let ruRotazione = 0;    // gradi accumulati dalla ruota
const RU_DURATA_MS = 5000;
const RU_COLORI = ["#e6b800", "#1f8f5f", "#2f6fd6", "#c0392b", "#8e44ad", "#d35400", "#16a085", "#7f8c8d"];

function ruEsc(t) { return String(t).replace(/[<>&"]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c])); }

// Angolo (in gradi, in senso orario dall'alto) del centro dello spicchio i (0 = primo)
function ruCentro(i, n) { return (i + 0.5) * (360 / n); }

// Di quanto girare per fermare lo spicchio i sotto la freccia: giri completi + il tratto che serve
function ruDelta(rotazioneAttuale, i, n, scostamento) {
  const a = ruCentro(i, n) + (scostamento || 0);
  const target = (360 - (a % 360)) % 360;
  const attuale = ((rotazioneAttuale % 360) + 360) % 360;
  return 360 * 5 + ((target - attuale + 360) % 360);
}

function ruFmtTempo(sec) {
  sec = Math.max(0, Math.floor(sec));
  const g = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  const p = x => String(x).padStart(2, "0");
  return (g ? g + "g " : "") + `${p(h)}:${p(m)}:${p(s)}`;
}

function ruSvg(premi) {
  const n = premi.length, R = 140, C = 150, pol = (ang, r) => [C + r * Math.sin(ang * Math.PI / 180), C - r * Math.cos(ang * Math.PI / 180)];
  let out = `<svg viewBox="0 0 300 300" width="100%" height="100%"><circle cx="150" cy="150" r="146" fill="#111" stroke="#ffd700" stroke-width="4"/>`;
  for (let i = 0; i < n; i++) {
    const a0 = i * 360 / n, a1 = (i + 1) * 360 / n, p0 = pol(a0, R), p1 = pol(a1, R);
    const colore = RU_COLORI[i % RU_COLORI.length];
    out += `<path d="M ${C} ${C} L ${p0[0].toFixed(2)} ${p0[1].toFixed(2)} A ${R} ${R} 0 0 1 ${p1[0].toFixed(2)} ${p1[1].toFixed(2)} Z" fill="${colore}" stroke="#111" stroke-width="2"/>`;
    out += `<text x="${C}" y="${C - 92}" text-anchor="middle" font-family="Bebas Neue, sans-serif" font-size="30" font-weight="700" fill="${i % RU_COLORI.length === 0 ? "#111" : "#fff"}" transform="rotate(${ruCentro(i, n)} ${C} ${C})">${ruEsc(premi[i])}</text>`;
  }
  out += `<circle cx="150" cy="150" r="22" fill="#111" stroke="#ffd700" stroke-width="3"/><text x="150" y="158" text-anchor="middle" font-size="22">👥</text></svg>`;
  return out;
}

function ruMsg(html, colore) {
  const e = document.getElementById("ru-msg");
  if (e) e.innerHTML = html ? `<div style="font-size:13px;color:${colore || "var(--testo)"}">${html}</div>` : "";
}

async function ruCaricaStato() {
  const { data, error } = await sb.rpc("ruota_stato", { p_squadra: String(utenteLoggato.id) });
  if (error) throw error;
  ruOffset = new Date(data.ora).getTime() - Date.now();
  ruStato = { premi: data.premi, ultimo: data.ultimo, prossimo: data.prossimo ? new Date(data.prossimo).getTime() : null, storico: data.storico || [] };
}

function ruErrore(e) {
  const m = String((e && e.message) || e || "");
  const t = /TROPPO_PRESTO:(\d+)/.exec(m);
  if (t) return { troppoPresto: parseInt(t[1]) };
  if (/Could not find the function|PGRST202|does not exist/i.test(m)) return { testo: "La ruota non è ancora attiva: va eseguito il file ruota.sql su Supabase." };
  return { testo: m || "Errore sconosciuto" };
}

function ruAggiorna() {
  const btn = document.getElementById("ru-btn"), info = document.getElementById("ru-timer");
  if (!btn || !ruStato) return;
  const ora = Date.now() + ruOffset;
  const libero = !ruStato.prossimo || ora >= ruStato.prossimo;
  btn.disabled = ruInGiro || !libero;
  btn.style.opacity = btn.disabled ? "0.5" : "1";
  btn.textContent = ruInGiro ? "🎡 Gira..." : libero ? "🎡 GIRA LA RUOTA!" : "⏳ Non ancora";
  if (info) info.innerHTML = libero ? "✅ Puoi girare adesso!" : `Prossimo giro tra <b style="color:var(--oro)">${ruFmtTempo((ruStato.prossimo - ora) / 1000)}</b>`;
}

function ruStorico() {
  const e = document.getElementById("ru-storico");
  if (!e || !ruStato) return;
  e.innerHTML = ruStato.storico.length
    ? `<div style="font-size:11px;color:var(--testo-dim);margin-bottom:4px">Ultimi giri</div>` + ruStato.storico.map(s => `<div style="font-size:12px">+${ruEsc(s.premio)} tifosi <span style="color:var(--testo-dim)">• ${new Date(s.girato_il).toLocaleDateString("it-IT")}</span></div>`).join("")
    : "";
}

async function apriRuota() {
  if (typeof utenteLoggato === "undefined" || !utenteLoggato) { try { showToast("❌ Devi essere loggato per girare la ruota", "error"); } catch (_) {} return; }
  let m = document.getElementById("modal-ruota");
  if (!m) {
    m = document.createElement("div");
    m.id = "modal-ruota";
    m.className = "modal-overlay";
    m.innerHTML = `<div class="modal-content" style="max-width:380px">
      <div class="modal-header"><h2 class="modal-title">🎡 RUOTA DELLA FORTUNA</h2><button class="modal-close" onclick="chiudiRuota()">✕</button></div>
      <div class="modal-body" style="text-align:center">
        <div style="font-size:12px;color:var(--testo-dim);margin-bottom:10px">Un giro a settimana: il premio sono tifosi, e arrivano subito alla tua squadra.</div>
        <div style="position:relative;width:280px;max-width:100%;aspect-ratio:1;margin:0 auto 14px">
          <div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);z-index:2;width:0;height:0;border-left:12px solid transparent;border-right:12px solid transparent;border-top:24px solid #fff;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.6))"></div>
          <div id="ru-disco" style="width:100%;height:100%"></div>
        </div>
        <div id="ru-timer" style="font-size:13px;margin-bottom:10px"></div>
        <button id="ru-btn" onclick="ruGira()" style="width:100%;padding:12px;border-radius:8px;border:none;background:var(--verde);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:1px;cursor:pointer">🎡 GIRA LA RUOTA!</button>
        <div id="ru-msg" style="margin-top:12px;min-height:20px"></div>
        <div id="ru-storico" style="margin-top:10px;text-align:left"></div>
      </div></div>`;
    document.body.appendChild(m);
  }
  m.classList.add("open");
  ruMsg("⏳ Carico la ruota...");
  try {
    await ruCaricaStato();
    const disco = document.getElementById("ru-disco");
    disco.style.transition = "none";
    disco.style.transform = `rotate(${ruRotazione}deg)`;
    disco.innerHTML = ruSvg(ruStato.premi);
    ruMsg("");
    ruStorico();
    ruAggiorna();
    if (ruTimer) clearInterval(ruTimer);
    ruTimer = setInterval(ruAggiorna, 1000);
  } catch (e) {
    const r = ruErrore(e);
    ruMsg("❌ " + ruEsc(r.testo || "Errore"), "var(--rosso)");
    const btn = document.getElementById("ru-btn"); if (btn) btn.disabled = true;
  }
}

function chiudiRuota() {
  if (ruInGiro) return; // il giro si conclude prima di poter chiudere
  if (ruTimer) { clearInterval(ruTimer); ruTimer = null; }
  const m = document.getElementById("modal-ruota");
  if (m) m.classList.remove("open");
}

// Dopo la vincita riallineo i tifosi mostrati nell'app
async function ruAggiornaTifosiLocali() {
  try {
    const { data } = await sb.from("squadre").select("tifosi").eq("id", utenteLoggato.id).single();
    if (!data) return;
    utenteLoggato.tifosi = data.tifosi;
    const loc = (typeof squadreDB !== "undefined" ? squadreDB : []).find(s => String(s.id) === String(utenteLoggato.id));
    if (loc) loc.tifosi = data.tifosi;
  } catch (_) { /* basta ricaricare la pagina */ }
}

async function ruGira() {
  if (ruInGiro || !ruStato) return;
  if (ruStato.prossimo && Date.now() + ruOffset < ruStato.prossimo) { ruMsg("⏳ Non è ancora passata una settimana dall'ultimo giro.", "var(--oro)"); ruAggiorna(); return; }
  ruInGiro = true;
  ruMsg("");
  ruAggiorna();
  try {
    // 1) il database controlla i 7 giorni, estrae il premio e aggiunge i tifosi
    const { data, error } = await sb.rpc("ruota_gira", { p_squadra: String(utenteLoggato.id) });
    if (error) {
      const r = ruErrore(error);
      if (r.troppoPresto !== undefined) {
        ruStato.prossimo = Date.now() + ruOffset + r.troppoPresto * 1000;
        ruMsg("⏳ Hai già girato questa settimana: torna più tardi.", "var(--oro)");
      } else ruMsg("❌ " + ruEsc(r.testo), "var(--rosso)");
      return;
    }
    ruOffset = new Date(data.ora).getTime() - Date.now();
    // 2) solo adesso parte l'animazione, verso lo spicchio già estratto
    const i = data.spicchio - 1, n = ruStato.premi.length;
    const jitter = (Math.random() - 0.5) * (360 / n) * 0.6; // resta dentro lo spicchio
    ruRotazione += ruDelta(ruRotazione, i, n, jitter);
    const disco = document.getElementById("ru-disco");
    if (disco) {
      disco.style.transition = `transform ${RU_DURATA_MS}ms cubic-bezier(0.12, 0.6, 0.1, 1)`;
      disco.style.transform = `rotate(${ruRotazione}deg)`;
    }
    await new Promise(r => setTimeout(r, RU_DURATA_MS + 200));
    ruStato.ultimo = data.ora;
    ruStato.prossimo = new Date(data.prossimo).getTime();
    ruStato.storico.unshift({ premio: data.premio, girato_il: data.ora });
    ruStato.storico = ruStato.storico.slice(0, 5);
    ruMsg(`🎉 Hai vinto <b style="color:var(--verde);font-size:20px">+${ruEsc(data.premio)} tifosi</b>!`);
    ruStorico();
    await ruAggiornaTifosiLocali();
    if (typeof showToast === "function") { try { showToast(`🎡 +${data.premio} tifosi!`); } catch (_) {} }
  } catch (e) {
    ruMsg("❌ " + ruEsc(ruErrore(e).testo || "Errore"), "var(--rosso)");
  } finally {
    ruInGiro = false;
    ruAggiorna();
  }
}
