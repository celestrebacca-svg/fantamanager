// Edge Function Supabase: legge uno screenshot dei risultati di Serie A con un modello a visione
// e restituisce le partite in formato strutturato. La chiave resta qui sul server, mai nel sito.
//
// Deploy (da terminale, nella cartella del progetto):
//   supabase functions deploy leggi-risultati-screenshot
//   supabase secrets set ANTHROPIC_API_KEY=la_tua_chiave
//
// Facoltativo: cambiare modello senza toccare il codice
//   supabase secrets set ANTHROPIC_MODEL=nome-modello
//
// Chiamata dal sito: sb.functions.invoke("leggi-risultati-screenshot", { body: { image_base64, media_type } })

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-5-5";
const TIPI_AMMESSI = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BASE64_CHARS = 7_000_000; // circa 5 MB di immagine

const PROMPT = `Questa immagine e' uno screenshot dei risultati di una giornata di Serie A.
Estrai tutte le partite visibili.

Rispondi SOLO con JSON valido, senza testo prima o dopo e senza backtick, in questo formato:
{"giornata": <numero intero o null>, "partite": [{"casa": "<squadra di casa>", "trasferta": "<squadra in trasferta>", "gol_casa": <intero o null>, "gol_trasferta": <intero o null>}]}

Regole:
- Scrivi i nomi delle squadre come compaiono nell'immagine.
- I gol sono il punteggio mostrato tra le due squadre.
- Se la partita non e' ancora giocata (c'e' un orario al posto del punteggio) metti null nei due campi gol.
- "giornata" e' il numero della giornata indicato nell'immagine (es. "Giornata 1" -> 1), altrimenti null.
- Non inventare partite che non si vedono. Ignora date e orari.`;

function risposta(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function interoONull(v: unknown): number | null {
  return Number.isInteger(v) ? (v as number) : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return risposta({ error: "Usa il metodo POST" }, 405);

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return risposta({ error: "ANTHROPIC_API_KEY non configurata sul server" }, 500);

    const { image_base64, media_type } = await req.json();
    if (typeof image_base64 !== "string" || !image_base64) {
      return risposta({ error: "Immagine mancante" }, 400);
    }
    if (!TIPI_AMMESSI.includes(media_type)) {
      return risposta({ error: "Formato immagine non supportato" }, 400);
    }
    if (image_base64.length > MAX_BASE64_CHARS) {
      return risposta({ error: "Immagine troppo pesante" }, 413);
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type, data: image_base64 } },
            { type: "text", text: PROMPT },
          ],
        }],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return risposta({ error: data?.error?.message ?? `Errore dal servizio di lettura (${res.status})` }, 502);
    }

    const testo: string = (data.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("");
    const inizio = testo.indexOf("{");
    const fine = testo.lastIndexOf("}");
    if (inizio === -1 || fine === -1) return risposta({ error: "Risposta non leggibile, riprova" }, 502);

    const letto = JSON.parse(testo.slice(inizio, fine + 1));
    const partite = (Array.isArray(letto.partite) ? letto.partite : []).map((p: Record<string, unknown>) => ({
      casa: String(p.casa ?? ""),
      trasferta: String(p.trasferta ?? ""),
      gol_casa: interoONull(p.gol_casa),
      gol_trasferta: interoONull(p.gol_trasferta),
    }));

    return risposta({ giornata: interoONull(letto.giornata), partite });
  } catch (e) {
    return risposta({ error: String(e) }, 500);
  }
});
