const SUPABASE_URL = 'https://fithrsazeeawjzpfoowg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpdGhyc2F6ZWVhd2p6cGZvb3dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NTg0MjUsImV4cCI6MjA5MTQzNDQyNX0.gRI7mjgahc7qEittJWVDEBqGttY1BuJOL3t_DY3BBbg';
const RAPIDAPI_KEY = '73e7e8737bmsh406835bcadaa067p1fde41jsnd72004371828';
const ADMIN_PWD = 'Ultimo96!';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let adminLoggato = false;
let utenteLoggato = null; // squadra dell'utente loggato
// Stagione corrente unificata: usata da bilancio, competizioni, risiko e storico giocatori.
// Il valore reale viene caricato dal DB (tabella impostazioni) in carica-dati.js;
// questo è solo il fallback iniziale prima che il caricamento finisca.
let STAGIONE_CORRENTE = '2025/26';
let squadreDB = [], giocatoriDB = [], tifosi_logDB = [], trattativeDB = [];
let immaginiConfigDB = {}; // chiave -> url, caricato da tabella immagini_config
let domandeCustomDB = []; // domande intervista aggiunte da admin (oltre a quelle predefinite in social.js)
let squadraAttiva = null, tabAttivoSq = 'principale', ricercaSq = '';
let giocatoreInModifica = null, giocatoreInFoto = null, squadraInLogo = null, squadraInPres = null, squadraInEmail = null;
let fotoScelta = null, logoScelto = null;
let giocatoreSchedaAttiva = null;
let trattativaGiocatoreTarget = null;
let filtroTrattative = 'tutte';
let rateList = [];
