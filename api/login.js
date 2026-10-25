// Funzione Vercel: login e scelta delle credenziali. Tutto si controlla SUL SERVER (nel database ci sono solo hash).
//   azione "login"   : email o username + password  -> sessione; se è il primo accesso -> pass temporaneo per scegliere le credenziali
//   azione "imposta" : pass temporaneo + username + password scelti dalla squadra -> sessione
// Variabili su Vercel (Settings > Environment Variables):
//   SUPABASE_URL                 (es. https://xxxx.supabase.co)
//   SUPABASE_SERVICE_ROLE_KEY    (Supabase > Project Settings > API > service_role: segreta, mai nel codice della pagina)
//   SESSION_SECRET               (frase lunga inventata da te, almeno 24 caratteri)
const crypto = require('crypto');

// ---- pass di sessione firmato (HMAC): dopo il login le altre funzioni del server lo verificano senza fidarsi del browser ----
const DURATA_MS = 12 * 60 * 60 * 1000;   // il pass di sessione vale 12 ore
const DURATA_CAMBIO_MS = 15 * 60 * 1000; // il pass per scegliere le credenziali vale 15 minuti

function chiave(){
  const k = process.env.SESSION_SECRET;
  if(!k || k.length < 24) throw new Error('SESSION_SECRET mancante o troppo corto su Vercel');
  return k;
}
const hmac = (b) => crypto.createHmac('sha256', chiave()).update(b).digest('base64url');

// scopo 'cambio' = pass temporaneo che permette SOLO di scegliere username e password; senza scopo = sessione normale
function firma(payload, scopo){
  const dur = scopo === 'cambio' ? DURATA_CAMBIO_MS : DURATA_MS;
  const b = Buffer.from(JSON.stringify({...payload, ...(scopo ? {pur: scopo} : {}), exp: Date.now() + dur})).toString('base64url');
  return b + '.' + hmac(b);
}
function leggi(token){
  try{
    if(typeof token !== 'string' || token.length > 2000) return null;
    const [b, s] = token.split('.');
    if(!b || !s) return null;
    const atteso = Buffer.from(hmac(b)), dato = Buffer.from(s);
    if(atteso.length !== dato.length || !crypto.timingSafeEqual(atteso, dato)) return null;
    const p = JSON.parse(Buffer.from(b, 'base64url').toString());
    if(!p || typeof p.exp !== 'number' || p.exp < Date.now() || !p.sq) return null;
    return p;
  }catch(_){ return null; }
}
// sessione normale: {sq, adm, exp}. Un pass temporaneo NON vale come sessione.
function verifica(token){ const p = leggi(token); return p && !p.pur ? p : null; }
// pass temporaneo per scegliere le credenziali: {sq, pur:'cambio', exp}
function verificaCambio(token){ const p = leggi(token); return p && p.pur === 'cambio' ? p : null; }
// legge la sessione dall'intestazione "Authorization: Bearer ..."
const daRichiesta = (req) => verifica(String((req.headers && (req.headers.authorization || req.headers.Authorization)) || '').replace(/^Bearer\s+/i, ''));


// ---- login ----
const pausa = (ms) => new Promise(r => setTimeout(r, ms));
// accetta l'indirizzo di Supabase anche se è stato copiato con parti in più (es. /rest/v1/) o senza https://
function indirizzoBase(u){
  let s = String(u || '').trim();
  if(s && !/^https?:\/\//i.test(s)) s = 'https://' + s;
  try { return new URL(s).origin; } catch(_){ return ''; }
}

async function rpc(url, key, nome, args){
  const r = await fetch(url + '/rest/v1/rpc/' + nome, {
    method:'POST',
    headers:{'Content-Type':'application/json', apikey:key, ...(key.startsWith('eyJ') ? {Authorization:'Bearer ' + key} : {})},   // chiave classica (JWT) o nuova chiave "secret": vanno bene entrambe
    body: JSON.stringify(args)
  });
  let dati = null; try { dati = await r.json(); } catch(_){}
  return {ok:r.ok, stato:r.status, dati};
}

module.exports = async (req, res) => {
  if(req.method !== 'POST') return res.status(405).json({ok:false, error:'metodo non consentito'});
  const url = indirizzoBase(process.env.SUPABASE_URL), key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if(!url || !key || !process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 24)
    return res.status(500).json({ok:false, error:'Login non configurato: mancano variabili su Vercel'});
  try{
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const password = String(body.password || '').slice(0, 100);

    if(body.azione === 'imposta'){
      const p = verificaCambio(body.token);
      if(!p) return res.status(401).json({ok:false, error:'Il tempo per scegliere le credenziali è scaduto: rifai il login'});
      const r = await rpc(url, key, 'imposta_credenziali', {p_squadra:String(p.sq), p_username:String(body.username || '').slice(0, 60), p_password:password});
      if(!r.ok){
        const msg = r.dati && typeof r.dati.message === 'string' && r.dati.code === 'P0001' ? r.dati.message : 'Impossibile salvare le credenziali, riprova';
        return res.status(400).json({ok:false, error:msg});
      }
      return res.status(200).json({ok:true, squadra_id:String(p.sq), admin:false, token:firma({sq:String(p.sq), adm:false})});
    }

    // login: email oppure username
    const ident = String(body.email || body.username || '').trim().toLowerCase().slice(0, 200);
    if(!ident || !password) return res.status(400).json({ok:false, error:'Inserisci email (o username) e password'});
    const r = await rpc(url, key, 'verifica_accesso', {p_ident:ident, p_password:password});
    if(!r.ok){                                                // mostra il motivo (senza segreti) per capire cosa non va
      const det = r.dati && (r.dati.message || r.dati.error || r.dati.hint || r.dati.msg);
      console.error('verifica_accesso fallita', r.stato, JSON.stringify(r.dati));
      return res.status(502).json({ok:false, error:'Errore di connessione al database (codice ' + r.stato + (det ? ': ' + String(det).slice(0, 140) : '') + ')'});
    }
    if(!Array.isArray(r.dati) || !r.dati.length){
      await pausa(600);                                       // rallenta chi prova a indovinare
      return res.status(401).json({ok:false, error:'Email/username o password non corretti'});
    }
    const {squadra_id, admin, da_cambiare} = r.dati[0];
    if(da_cambiare && !admin)                                  // primo accesso: deve scegliere le sue credenziali
      return res.status(200).json({ok:true, primo:true, squadra_id:String(squadra_id), token_cambio:firma({sq:String(squadra_id)}, 'cambio')});
    return res.status(200).json({ok:true, squadra_id:String(squadra_id), admin:!!admin, token:firma({sq:String(squadra_id), adm:!!admin})});
  }catch(e){
    return res.status(500).json({ok:false, error:'Errore: ' + e.message});
  }
};
module.exports._sessione = {firma, verifica, verificaCambio, daRichiesta};   // usato dalle altre funzioni del server
