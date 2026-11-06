// Pass di sessione firmato (HMAC). Lo rilascia api/login.js dopo aver controllato le credenziali sul server;
// le altre funzioni (sponsor) lo verificano senza fidarsi di nulla che arrivi dal browser.
// Variabile su Vercel: SESSION_SECRET (una frase lunga inventata da te, almeno 24 caratteri).
const crypto = require('crypto');
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

module.exports = {firma, verifica, verificaCambio, daRichiesta};
