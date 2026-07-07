
// ===== STORICO GIOCATORE =====
// Registra un evento nella carriera di un giocatore (trasferimento, prestito,
// riscatto, rientro, modifica admin...). Non blocca mai il flusso chiamante:
// se il log fallisce, viene solo segnalato in console.
async function logStoricoGiocatore(giocatoreId, evento, dettagli){
  dettagli=dettagli||{};
  try{
    await sb.from('storico_giocatore').insert([{
      giocatore_id: parseInt(giocatoreId),
      stagione: STAGIONE_CORRENTE,
      evento: evento,
      squadra_da: dettagli.squadra_da||null,
      squadra_a: dettagli.squadra_a||null,
      numero_maglia: dettagli.numero_maglia!=null?dettagli.numero_maglia:null,
      tipo_contratto: dettagli.tipo_contratto||null,
      importo: dettagli.importo||null,
      note: dettagli.note||null,
    }]);
  }catch(e){ console.warn('Log storico giocatore:', e.message); }
}

// Calcola la stagione successiva da una stringa "2025/26" → "2026/27"
function prossimaStagione(s){
  const m=String(s||'').match(/^(\d{4})\/(\d{2})$/);
  if(!m) return s;
  const y1=parseInt(m[1],10)+1;
  const y2=parseInt(m[2],10)+1;
  return `${y1}/${String(y2).padStart(2,'0')}`;
}

// Converte input M in valore numerico: "5" → 5000000, "5.5" → 5500000, "5000000" → 5000000
function parseM(val) {
  if (!val && val !== 0) return 0;
  const str = String(val).trim().replace(',', '.').replace(/[mM]\s*$/, '').trim();
  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  if (num >= 1000) return Math.round(num);
  return Math.round(num * 1000000);
}
const competizioni=[
  {id:'campionato',nome:'CAMPIONATO',icon:'⚽',tipo:'campionato',premi:[{pos:'1° posto',euro:null,fm:'Automatico'}],museo:{fm:2.5,label:'2.5M (1°) • 0.8M (2°) • 0.3M (3°)'}},
  {id:'coppa_italia',nome:'COPPA ITALIA',icon:'🇮🇹',tipo:'coppa',premi:[{pos:'Vincitore',euro:'30€',fm:null}],museo:{fm:0.7,label:'0.7M annui'}},
  {id:'champions',nome:'CHAMPIONS LEAGUE',icon:'⭐',tipo:'coppa',premi:[{pos:'1° posto',euro:'50€',fm:null},{pos:'2° posto',euro:'10€',fm:null}],museo:{fm:1.5,label:'1.5M annui'}},
  {id:'europa',nome:'EUROPA LEAGUE',icon:'🌍',tipo:'coppa',premi:[{pos:'1° posto',euro:'20€',fm:null}],museo:{fm:0.7,label:'0.7M annui'}},
  {id:'coglioni',nome:'COPPA DEI COGLIONI',icon:'🤡',tipo:'speciale',premi:[{pos:'Punteggio più basso',euro:'10€',fm:null}],museo:{fm:0.2,label:'0.2M annui'}},
  {id:'coopmeiners',nome:'COOPMEINERS',icon:'🔥',tipo:'coppa',premi:[{pos:'1° posto',euro:'35€',fm:null},{pos:'2° posto',euro:'10€',fm:null}],museo:{fm:1.0,label:'1M annui'}},
  {id:'formula1',nome:'FORMULA 1',icon:'🏎️',tipo:'coppa',premi:[{pos:'1° posto',euro:'50€',fm:null},{pos:'2° posto',euro:'20€',fm:null}],museo:{fm:1.8,label:'1.8M annui'}},
  {id:'coppa_tua',nome:'COPPA TUA',icon:'🏅',tipo:'coppa',premi:[{pos:'Vincitore',euro:null,fm:null}],museo:{fm:0.6,label:'0.6M annui'}},
  {id:'konami',nome:'COPPA KONAMI',icon:'🎮',tipo:'coppa',premi:[{pos:'Vincitore',euro:null,fm:null}],museo:{fm:0.5,label:'0.5M annui'}},
  {id:'crediti',nome:'COPPA CREDITI',icon:'💳',tipo:'coppa',premi:[{pos:'Vincitore',euro:null,fm:null}],museo:{fm:0.7,label:'0.7M annui'}},
  {id:'talent',nome:'TALENT BOY',icon:'🌟',tipo:'speciale',premi:[{pos:'Vincitore',euro:null,fm:null}],museo:{fm:1.0,label:'1M annui'}},
  {id:'eroi',nome:'COPPA DEGLI EROI',icon:'🦸',tipo:'coppa',premi:[{pos:'Vincitore',euro:null,fm:null}],museo:{fm:1.0,label:'1M annui'}},
  {id:'miglior_g',nome:'MIGLIOR PUNTEGGIO GIORNATA',icon:'📈',tipo:'speciale',premi:[{pos:'Ogni giornata',euro:'5€',fm:null}],museo:null},
  {id:'miglior_a',nome:'PUNTEGGIO PIÙ ALTO ANNO',icon:'🥇',tipo:'speciale',premi:[{pos:'Fine stagione',euro:'25€',fm:null}],museo:null},
];

function fmtBudget(n){return new Intl.NumberFormat('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n||0)+' FM';}
function fmtNum(n){return new Intl.NumberFormat('it-IT').format(n||0);}
function ruoloColor(r){return{P:'ruolo-p',D:'ruolo-d',C:'ruolo-c',A:'ruolo-a'}[r]||'';}
function ruoloNome(r){return{P:'Portiere',D:'Difensore',C:'Centrocampista',A:'Attaccante'}[r]||r;}
function getMolt(n){return[0,1,2.5,4,5,7][Math.min(n,5)]||0;}
function iniziali(nome){return(nome||'??').replace(/[^a-zA-Z ]/g,'').split(' ').map(p=>p[0]||'').join('').substring(0,2).toUpperCase()||'??';}

let _toastTimer=null;
function showToast(msg,tipo){
  const t=document.getElementById('toast');
  if(!t) return;
  t.textContent=msg;
  t.classList.toggle('error',tipo==='error');
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer=setTimeout(()=>t.classList.remove('show'),2800);
}

// ===== PARSER IMPORTO FM (es. 5M, 1.5M, 500K) =====
function parseFM(val){
  if(!val) return 0;
  const s=String(val).trim().replace(',','.');
  const m=s.match(/^([0-9.]+)\s*([MKmk]?)$/);
  if(!m) return parseFloat(s)||0;
  const n=parseFloat(m[1])||0;
  const u=m[2].toUpperCase();
  if(u==='M') return Math.round(n*1000000);
  if(u==='K') return Math.round(n*1000);
  return n;
}
