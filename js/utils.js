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
