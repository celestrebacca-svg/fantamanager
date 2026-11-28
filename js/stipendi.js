// api/stipendi.js — legge uno screenshot di Capology e restituisce nome + stipendio netto annuo.
// Solo per l'admin. Usa Gemini (chiave GEMINI_API_KEY, già su Vercel). Facoltativo: GEMINI_MODEL.
// Richiede anche SESSION_SECRET (lo stesso di api/sponsor.js e api/login.js).
const crypto = require('crypto');

// ---------- sessione (pass firmato rilasciato da api/login.js): identica a quella di api/sponsor.js ----------
function leggiSessione(req){
  const k = process.env.SESSION_SECRET;
  if(!k || k.length < 24) throw new Error('SESSION_SECRET mancante o troppo corto su Vercel');
  try{
    const h = String((req.headers && (req.headers.authorization || req.headers.Authorization)) || '').replace(/^Bearer\s+/i, '');
    if(h.length > 2000) return null;
    const [b, s] = h.split('.'); if(!b || !s) return null;
    const atteso = Buffer.from(crypto.createHmac('sha256', k).update(b).digest('base64url')), dato = Buffer.from(s);
    if(atteso.length !== dato.length || !crypto.timingSafeEqual(atteso, dato)) return null;
    const p = JSON.parse(Buffer.from(b, 'base64url').toString());
    if(!p || p.pur || typeof p.exp !== 'number' || p.exp < Date.now() || !p.sq) return null;
    return p;
  }catch(_){ return null; }
}

const PROMPT = `Questa è uno screenshot della pagina Capology con la tabella "Contratti" di una squadra di calcio.
Per ogni calciatore leggi:
- il nome (colonna PROPRIETARIO);
- il valore della colonna "TASSO FISSO NETTO ANNUO (EUR)": è la seconda colonna sotto "STIPENDIO FISSO STIMATO".
Regole:
- Usa SOLO quella colonna. Ignora il prezzo a settimana, i bonus, i totali e le altre colonne.
- Salta le righe senza valore (trattino "-") e quelle con stato INATTIVO.
- Converti il valore in un numero intero in euro (esempio: "6.000.000 €" diventa 6000000, "€ 437.500" diventa 437500).
- Non inventare niente: se non leggi bene un nome o un valore, salta la riga.
- Se in alto è attivo il tasto GROSSO invece di RETE, scrivi "lordo" nel campo modo. Se la valuta non è EUR, scrivila nel campo valuta.
Rispondi SOLO con JSON, senza altro testo, in questa forma:
{"modo":"rete","valuta":"EUR","righe":[{"nome":"Kenan Yildiz","stipendio":6000000}]}
Usa "rete" se è attivo RETE, "lordo" se è attivo GROSSO, "sconosciuto" se non lo vedi.`;

function estraiJson(t){
  const s = String(t || '').replace(/```json|```/g, '').trim();
  try { return JSON.parse(s); } catch(_){}
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if(a >= 0 && b > a) { try { return JSON.parse(s.slice(a, b + 1)); } catch(_){} }
  return null;
}

function pulisci(j){
  const out = { modo: 'sconosciuto', valuta: 'EUR', righe: [] };
  if(!j || typeof j !== 'object') return out;
  if(['rete', 'lordo', 'sconosciuto'].includes(j.modo)) out.modo = j.modo;
  if(typeof j.valuta === 'string') out.valuta = j.valuta.slice(0, 12).toUpperCase();
  const visti = new Set();
  (Array.isArray(j.righe) ? j.righe : []).forEach(r => {
    if(!r || typeof r.nome !== 'string') return;
    const nome = r.nome.replace(/\s+/g, ' ').trim().slice(0, 60);
    const st = Math.round(Number(r.stipendio));
    if(!nome || !isFinite(st) || st <= 0 || st > 500000000) return;
    const k = nome.toLowerCase();
    if(visti.has(k)) return; visti.add(k);
    out.righe.push({ nome, stipendio: st });
  });
  return out;
}

async function chiamaGemini(model, mime, dati){
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': String(process.env.GEMINI_API_KEY || '').trim() },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: PROMPT }, { inlineData: { mimeType: mime, data: dati } }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 8000, responseMimeType: 'application/json' }
    })
  });
  if(!r.ok){
    let d = ''; try { const e = await r.json(); d = (e.error && (e.error.message || e.error)) || ''; } catch(_){}
    const err = new Error(model + ' ' + r.status + (d ? ': ' + String(d).slice(0, 120) : '')); err.status = r.status; throw err;
  }
  const j = await r.json();
  return ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).map(p => p.text || '').join('');
}

module.exports = async (req, res) => {
  if(req.method !== 'POST') return res.status(405).json({ ok: false, error: 'metodo non consentito' });
  let sess;
  try { sess = leggiSessione(req); } catch(e){ return res.status(500).json({ ok: false, error: 'Server non configurato: ' + e.message }); }
  if(!sess) return res.status(401).json({ ok: false, error: 'Sessione scaduta: esci e rientra' });
  if(!sess.adm) return res.status(403).json({ ok: false, error: 'Solo l\'admin può caricare gli stipendi' });
  if(!String(process.env.GEMINI_API_KEY || '').trim()) return res.status(500).json({ ok: false, error: 'Manca GEMINI_API_KEY su Vercel' });
  try{
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(body.immagine || ''));
    if(!m) return res.status(400).json({ ok: false, error: 'Immagine non valida' });
    if(m[2].length > 4200000) return res.status(413).json({ ok: false, error: 'Immagine troppo grande' });
    const modelli = [(process.env.GEMINI_MODEL || '').trim(), 'gemini-2.5-flash', 'gemini-2.0-flash'].filter((x, i, a) => x && a.indexOf(x) === i);
    let ultimo;
    for(const mod of modelli){
      try{
        const testo = await chiamaGemini(mod, m[1], m[2]);
        const out = pulisci(estraiJson(testo));
        if(!out.righe.length && out.modo === 'sconosciuto') throw new Error('Non trovo nessuno stipendio in questa immagine');
        return res.status(200).json({ ok: true, ...out });
      }catch(e){ ultimo = e; if(e.status === 400 || e.status === 403) break; }
    }
    throw ultimo;
  }catch(e){
    console.error('stipendi', e && e.message);
    const msg = String((e && e.message) || '');
    if(/Non trovo/.test(msg)) return res.status(422).json({ ok: false, error: msg });
    if(/429/.test(msg)) return res.status(429).json({ ok: false, error: 'Limite gratuito raggiunto: riprova tra un minuto' });
    return res.status(500).json({ ok: false, error: 'Lettura non riuscita, riprova' });
  }
};
module.exports._test = { pulisci, estraiJson };
