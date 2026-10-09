// Edge Function Supabase: proxy server-side verso football-data.org.
// Serve per due motivi:
//  1) football-data.org blocca le chiamate dirette dal browser (CORS) - da un server va bene.
//  2) la chiave API resta nascosta qui, non e' mai visibile nel codice del sito.
//
// Deploy (da terminale, nella cartella del progetto):
//   supabase functions deploy risultati-serie-a
//   supabase secrets set FOOTBALL_DATA_API_KEY=87e59ca42baf4e4daa4057c803ecfc5a
//
// Chiamata dal sito: /functions/v1/risultati-serie-a?matchday=1

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const url = new URL(req.url);
    const matchday = url.searchParams.get("matchday");
    if (!matchday) {
      return new Response(JSON.stringify({ error: "Parametro 'matchday' mancante" }), {
        status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("FOOTBALL_DATA_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "FOOTBALL_DATA_API_KEY non configurata sul server" }), {
        status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(`https://api.football-data.org/v4/competitions/SA/matches?matchday=${matchday}`, {
      headers: { "X-Auth-Token": apiKey },
    });
    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: res.status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
