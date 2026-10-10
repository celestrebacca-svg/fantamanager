// Funzione serverless di Vercel: fa da tramite verso football-data.org.
// Serve per due motivi:
//  1) football-data.org blocca le chiamate dirette dal browser (CORS) - da un server va bene.
//  2) la chiave API resta nascosta qui, non e' mai visibile nel codice del sito.
//
// Nessun comando da lanciare: basta che questo file stia in /api/risultati-serie-a.js
// nel repository. Vercel lo pubblica in automatico a ogni git push, raggiungibile su:
//   https://fantamanager-pearl.vercel.app/api/risultati-serie-a?matchday=1
//
// IMPORTANTE: su vercel.com, nel progetto -> Settings -> Environment Variables,
// aggiungi una variabile chiamata FOOTBALL_DATA_API_KEY con il valore della chiave
// (87e59ca42baf4e4daa4057c803ecfc5a), poi fai un redeploy. Senza quella variabile
// la funzione risponde con un errore chiaro invece di esporre la chiave nel codice.

export default async function handler(req, res) {
  const { matchday } = req.query;
  if (!matchday) {
    return res.status(400).json({ error: "Parametro 'matchday' mancante" });
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "FOOTBALL_DATA_API_KEY non configurata su Vercel (Settings -> Environment Variables)" });
  }

  try {
    const r = await fetch(`https://api.football-data.org/v4/competitions/SA/matches?matchday=${matchday}`, {
      headers: { "X-Auth-Token": apiKey },
    });
    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
