// ===== MAGLIETTE & STORE =====

const MAGLIE_SPECIALI=['n7','n9','n10','portiere','capitano'];
const MAGLIE_LABEL={n7:'Numero 7',n9:'Numero 9',n10:'Numero 10',portiere:'Portiere',capitano:'Capitano'};
const MAGLIE_EMOJI={n7:'7️⃣',n9:'9️⃣',n10:'🔟',portiere:'🧤',capitano:'©️'};

function isFinestaMagliette(){
  const oggi=new Date();
  const anno=oggi.getFullYear();
  // Finestra 1: 1 luglio - 5 settembre
  const f1start=new Date(anno,6,1); // 1 luglio
  const f1end=new Date(anno,8,5,23,59,59); // 5 settembre
  // Finestra 2: 1 gennaio - 10 febbraio
  const f2start=new Date(anno,0,1);
  const f2end=new Date(anno,1,10,23,59,59);
  return (oggi>=f1start&&oggi<=f1end)||(oggi>=f2start&&oggi<=f2end);
}

function getStoreLevel(capienza){
  if(capienza>=80000) return {level:7,nome:'Empire Store',emoji:'⭐',guadagno:7000000};
  if(capienza>=70000) return {level:6,nome:'Store Internazionale',emoji:'🌍',guadagno:6000000};
  if(capienza>=60000) return {level:5,nome:'Store + Outlet',emoji:'🏙️',guadagno:5000000};
  if(capienza>=50000) return {level:4,nome:'Megastore',emoji:'🏢',guadagno:4000000};
  if(capienza>=40000) return {level:3,nome:'Flagship Store',emoji:'🏬',guadagno:3000000};
  if(capienza>=30000) return {level:2,nome:'Store Ufficiale',emoji:'🏪',guadagno:2000000};
  if(capienza>=20000) return {level:1,nome:'Negozio Base',emoji:'⛺',guadagno:1000000};
  return {level:0,nome:'Banchetto',emoji:'🛖',guadagno:0};
}

function disegnaMaglia(giocatore,numero,upgradeKit,coloreSquadra='#1a237e'){
  const nome=giocatore?giocatore.toUpperCase():'???';
  const numDisplay=numero||'?';
  const sfondo=coloreSquadra;
  
  if(upgradeKit){
    // Kit completo: maglia + pantaloni + calzettoni
    return `<svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:160px">
      <!-- Maglia -->
      <path d="M20,30 L5,55 L25,60 L25,110 L95,110 L95,60 L115,55 L100,30 L80,20 Q60,35 40,20 Z" fill="${sfondo}" stroke="gold" stroke-width="1.5"/>
      <path d="M40,20 Q60,35 80,20 L80,30 Q60,42 40,30 Z" fill="gold" opacity="0.6"/>
      <!-- Numero -->
      <text x="60" y="85" text-anchor="middle" font-family="'Bebas Neue',sans-serif" font-size="28" fill="white" stroke="gold" stroke-width="0.5">${numDisplay}</text>
      <!-- Nome -->
      <text x="60" y="105" text-anchor="middle" font-family="'Bebas Neue',sans-serif" font-size="9" fill="gold" letter-spacing="1">${nome.length>10?nome.substring(0,10)+'...':nome}</text>
      <!-- Pantaloni -->
      <rect x="30" y="112" width="25" height="30" rx="3" fill="${sfondo}" stroke="gold" stroke-width="1"/>
      <rect x="65" y="112" width="25" height="30" rx="3" fill="${sfondo}" stroke="gold" stroke-width="1"/>
      <!-- Calzettoni -->
      <rect x="30" y="144" width="25" height="12" rx="2" fill="white" stroke="gold" stroke-width="0.5"/>
      <rect x="65" y="144" width="25" height="12" rx="2" fill="white" stroke="gold" stroke-width="0.5"/>
      <!-- Badge KIT -->
      <rect x="2" y="2" width="28" height="12" rx="6" fill="gold"/>
      <text x="16" y="11" text-anchor="middle" font-family="'Bebas Neue',sans-serif" font-size="7" fill="black">KIT</text>
    </svg>`;
  } else {
    // Singola maglia
    return `<svg viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:130px">
      <path d="M20,30 L5,55 L25,60 L25,110 L95,110 L95,60 L115,55 L100,30 L80,20 Q60,35 40,20 Z" fill="${sfondo}" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
      <path d="M40,20 Q60,35 80,20 L80,30 Q60,42 40,30 Z" fill="rgba(255,255,255,0.2)"/>
      <text x="60" y="80" text-anchor="middle" font-family="'Bebas Neue',sans-serif" font-size="28" fill="white" stroke="rgba(255,255,255,0.5)" stroke-width="0.5">${numDisplay}</text>
      <text x="60" y="100" text-anchor="middle" font-family="'Bebas Neue',sans-serif" font-size="9" fill="rgba(255,255,255,0.8)" letter-spacing="1">${nome.length>10?nome.substring(0,10)+'...':nome}</text>
    </svg>`;
  }
}

// Foto reali (Copilot) per ciascun livello store 0-7. Se un livello non è
// presente qui, si torna automaticamente all'SVG disegnato a mano.
const IMMAGINI_STORE={
  0:'img/store/store_0.jpg',
  1:'img/store/store_1.jpg',
  2:'img/store/store_2.jpg',
  3:'img/store/store_3.jpg',
  4:'img/store/store_4.jpg',
  5:'img/store/store_5.jpg',
  6:'img/store/store_6.jpg',
  7:'img/store/store_7.jpg',
};

function disegnaStore(capienza){
  const store=getStoreLevel(capienza);
  if(IMMAGINI_STORE[store.level]){
    return `<img src="${IMMAGINI_STORE[store.level]}" style="width:100%;max-width:320px;height:140px;object-fit:cover;border-radius:8px;display:block;margin:0 auto">`;
  }
  return disegnaStoreSvg(capienza);
}

function disegnaStoreSvg(capienza){
  const store=getStoreLevel(capienza);
  const colore=['#9E9E9E','#FFF176','#81C784','#4FC3F7','#00FF87','#C0A000','#E5C100','#FFD700'][store.level];
  const w=320,h=140;

  let svg=`<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:140px">`;
  
  // Livello 0: banchetto
  svg+=`<rect x="100" y="80" width="120" height="40" rx="4" fill="${colore}33" stroke="${colore}" stroke-width="1.5"/>
    <line x1="80" y1="80" x2="240" y2="80" stroke="${colore}" stroke-width="2"/>
    <line x1="90" y1="60" x2="90" y2="80" stroke="${colore}" stroke-width="1.5"/>
    <line x1="230" y1="60" x2="230" y2="80" stroke="${colore}" stroke-width="1.5"/>
    <path d="M80,60 Q160,40 240,60" fill="${colore}44" stroke="${colore}" stroke-width="1.5"/>`;

  if(store.level>=1){
    svg+=`<rect x="80" y="50" width="160" height="70" rx="6" fill="${colore}22" stroke="${colore}" stroke-width="1.5"/>
      <rect x="100" y="90" width="35" height="30" rx="3" fill="${colore}44" stroke="${colore}" stroke-width="1"/>
      <rect x="145" y="90" width="30" height="30" rx="3" fill="${colore}44" stroke="${colore}" stroke-width="1"/>
      <rect x="185" y="90" width="35" height="30" rx="3" fill="${colore}44" stroke="${colore}" stroke-width="1"/>`;
  }
  if(store.level>=2){
    svg+=`<rect x="60" y="30" width="200" height="90" rx="8" fill="${colore}22" stroke="${colore}" stroke-width="2"/>
      <text x="160" y="50" text-anchor="middle" font-family="'Bebas Neue',sans-serif" font-size="12" fill="${colore}" letter-spacing="2">STORE UFFICIALE</text>`;
  }
  if(store.level>=3){
    svg+=`<rect x="40" y="20" width="240" height="100" rx="10" fill="${colore}22" stroke="${colore}" stroke-width="2"/>
      <line x1="40" y1="35" x2="280" y2="35" stroke="${colore}88" stroke-width="1"/>
      <circle cx="50" cy="28" r="5" fill="${colore}"/>
      <circle cx="270" cy="28" r="5" fill="${colore}"/>`;
  }
  if(store.level>=4){
    svg+=`<rect x="20" y="10" width="280" height="115" rx="12" fill="${colore}22" stroke="${colore}" stroke-width="2.5"/>
      <rect x="20" y="10" width="280" height="20" rx="12" fill="${colore}44"/>
      <text x="160" y="24" text-anchor="middle" font-family="'Bebas Neue',sans-serif" font-size="11" fill="black" letter-spacing="3">MEGASTORE</text>`;
  }
  if(store.level>=5){
    svg+=`<line x1="20" y1="8" x2="20" y2="125" stroke="${colore}" stroke-width="3"/>
      <line x1="300" y1="8" x2="300" y2="125" stroke="${colore}" stroke-width="3"/>
      <path d="M20,8 Q160,-5 300,8" fill="${colore}33" stroke="${colore}" stroke-width="2"/>`;
  }
  if(store.level>=6){
    svg+=`<circle cx="160" cy="5" r="8" fill="${colore}"/>
      <circle cx="60" cy="12" r="5" fill="${colore}" opacity="0.7"/>
      <circle cx="260" cy="12" r="5" fill="${colore}" opacity="0.7"/>`;
  }
  if(store.level>=7){
    svg+=`<text x="160" y="135" text-anchor="middle" font-family="'Bebas Neue',sans-serif" font-size="10" fill="${colore}" letter-spacing="3">EMPIRE STORE</text>
      <circle cx="160" cy="0" r="6" fill="${colore}"/>
      <line x1="155" y1="0" x2="165" y2="0" stroke="black" stroke-width="1"/>
      <line x1="160" y1="-5" x2="160" y2="5" stroke="black" stroke-width="1"/>`;
  }

  svg+='</svg>';
  return svg;
}

function renderMagliette(sqId){
  const sq=squadreDB.find(s=>s.id===sqId)||utenteLoggato;
  if(!sq) return '<div class="empty">Nessuna squadra</div>';

  const maglie=sq.maglie||{n7:null,n9:null,n10:null,portiere:null,capitano:null,upgrade_kit:false};
  const upgradeKit=maglie.upgrade_kit||false;
  const isOwner=(utenteLoggato&&utenteLoggato.id===sq.id)||adminLoggato;
  const finestra=isFinestaMagliette()||adminLoggato;
  const capienza=sq.capienza_stadio||10000;
  const store=getStoreLevel(capienza);
  const budget=sq.budget||0;
  const puoUpgrade=!upgradeKit&&budget>=60000000;

  return `
    <!-- HEADER MAGLIETTE -->
    <div style="background:var(--grigio-scuro);border:1px solid rgba(255,215,0,0.2);border-radius:12px;padding:16px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--oro);letter-spacing:1px">👕 MAGLIETTE UFFICIALI</div>
        ${upgradeKit?'<span style="background:gold;color:black;font-family:\'Bebas Neue\',sans-serif;font-size:11px;padding:3px 8px;border-radius:10px;letter-spacing:1px">⭐ KIT COMPLETO</span>':''}
      </div>
      ${!finestra&&isOwner?`<div style="background:rgba(255,68,68,0.1);border:1px solid rgba(255,68,68,0.3);border-radius:8px;padding:8px;font-size:11px;color:var(--rosso);text-align:center">🔒 Modifica disponibile: 1 lug–5 set / 1 gen–10 feb</div>`:''}
      
      <!-- GRIGLIA MAGLIE -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px">
        ${['n7','n9','n10'].map(key=>{
          const g=maglie[key];
          const giocatore=g?giocatoriDB.find(x=>x.id==g):null;
          const numMap={n7:'7',n9:'9',n10:'10'};
          return `<div style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:10px;padding:8px;text-align:center">
            <div style="font-size:10px;color:var(--testo-dim);margin-bottom:4px">${MAGLIE_EMOJI[key]} ${MAGLIE_LABEL[key]}</div>
            ${disegnaMaglia(giocatore?giocatore.nome:'',numMap[key],upgradeKit)}
            <div style="font-size:10px;color:var(--testo-dim);margin-top:4px">${giocatore?giocatore.nome:'Non assegnata'}</div>
            ${finestra&&isOwner?`<button onclick="apriAssegnaMaglia('${sqId}','${key}')" style="margin-top:4px;background:rgba(255,215,0,0.1);border:1px solid rgba(255,215,0,0.3);color:var(--oro);font-size:10px;padding:3px 8px;border-radius:6px;cursor:pointer">✏️</button>`:''}
          </div>`;
        }).join('')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">
        ${['portiere','capitano'].map(key=>{
          const g=maglie[key];
          const giocatore=g?giocatoriDB.find(x=>x.id==g):null;
          const numMap={portiere:'P',capitano:'C'};
          return `<div style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:10px;padding:8px;text-align:center">
            <div style="font-size:10px;color:var(--testo-dim);margin-bottom:4px">${MAGLIE_EMOJI[key]} ${MAGLIE_LABEL[key]}</div>
            ${disegnaMaglia(giocatore?giocatore.nome:'',numMap[key],upgradeKit)}
            <div style="font-size:10px;color:var(--testo-dim);margin-top:4px">${giocatore?giocatore.nome:'Non assegnata'}</div>
            ${finestra&&isOwner?`<button onclick="apriAssegnaMaglia('${sqId}','${key}')" style="margin-top:4px;background:rgba(255,215,0,0.1);border:1px solid rgba(255,215,0,0.3);color:var(--oro);font-size:10px;padding:3px 8px;border-radius:6px;cursor:pointer">✏️</button>`:''}
          </div>`;
        }).join('')}
      </div>

      <!-- UPGRADE KIT -->
      ${isOwner&&!upgradeKit?`
      <div style="margin-top:14px;background:rgba(255,215,0,0.05);border:1px solid rgba(255,215,0,0.2);border-radius:10px;padding:12px">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:14px;color:var(--oro);margin-bottom:6px">⭐ UPGRADE KIT COMPLETO — 60M FM</div>
        <div style="font-size:11px;color:var(--testo-dim);margin-bottom:8px">Singola maglia → Kit completo (maglia + pantaloni + calzettoni). Percentuali vendita aumentate. Permanente.</div>
        <button onclick="acquistaUpgradeKit('${sqId}')" style="width:100%;padding:10px;border-radius:8px;border:1px solid gold;background:rgba(255,215,0,0.15);color:gold;font-family:'Bebas Neue',sans-serif;font-size:14px;cursor:pointer;${!puoUpgrade?'opacity:0.4;pointer-events:none':''}">
          ${puoUpgrade?'🛒 ACQUISTA UPGRADE (60M FM)':'💸 Budget insufficiente (servono 60M FM)'}
        </button>
      </div>`:''}
    </div>

    <!-- STORE -->
    <div style="background:var(--grigio-scuro);border:1px solid var(--grigio-chiaro);border-radius:12px;padding:16px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--oro);letter-spacing:1px">${store.emoji} ${store.nome}</div>
        <div style="font-family:'Space Mono',monospace;font-size:13px;color:var(--verde)">+${fmtM(store.guadagno)}/anno</div>
      </div>
      <div style="margin-bottom:10px">${disegnaStore(capienza)}</div>
      <!-- Livelli store -->
      <div style="font-size:11px;color:var(--testo-dim);margin-bottom:6px">PROSSIMI LIVELLI</div>
      ${[{c:20000,n:'Negozio Base ⛺',g:'1M'},{c:30000,n:'Store Ufficiale 🏪',g:'2M'},{c:40000,n:'Flagship Store 🏬',g:'3M'},{c:50000,n:'Megastore 🏢',g:'4M'},{c:60000,n:'Store+Outlet 🏙️',g:'5M'},{c:70000,n:'Internazionale 🌍',g:'6M'},{c:80000,n:'Empire Store ⭐',g:'7M'}].map(l=>`
        <div style="display:flex;align-items:center;gap:8px;padding:3px 0;opacity:${capienza>=l.c?1:0.4}">
          <span style="font-size:10px;color:${capienza>=l.c?'var(--verde)':'var(--testo-dim)'}">${capienza>=l.c?'✓':'○'}</span>
          <span style="flex:1;font-size:11px;color:var(--testo-dim)">${l.n} — ${l.c.toLocaleString('it-IT')} posti</span>
          <span style="font-size:11px;color:var(--verde)">+${l.g}</span>
        </div>`).join('')}
    </div>
  `;
}

async function apriAssegnaMaglia(sqId,key){
  const sq=squadreDB.find(s=>s.id===sqId)||utenteLoggato;
  const giocatori=(sq?giocatoriDB.filter(g=>g.squadra_id===sq.id):[]).sort((a,b)=>a.nome.localeCompare(b.nome));

  let m=document.getElementById('modal-assegna-maglia');
  if(!m){
    m=document.createElement('div');
    m.id='modal-assegna-maglia';
    m.className='modal-overlay';
    m.innerHTML=`<div class="modal-content" style="max-width:380px">
      <div class="modal-header">
        <h2 class="modal-title" id="assegna-maglia-title">👕 ASSEGNA MAGLIA</h2>
        <button class="modal-close" onclick="document.getElementById('modal-assegna-maglia').classList.remove('open')">✕</button>
      </div>
      <div class="modal-body" id="assegna-maglia-body"></div>
    </div>`;
    document.body.appendChild(m);
  }

  document.getElementById('assegna-maglia-title').textContent=`${MAGLIE_EMOJI[key]} ${MAGLIE_LABEL[key]}`;
  document.getElementById('assegna-maglia-body').innerHTML=`
    <div class="form-group">
      <label class="form-label">Seleziona giocatore</label>
      <select class="form-select" id="maglia-giocatore-select">
        <option value="">— Nessuno —</option>
        ${giocatori.map(g=>`<option value="${g.id}">${g.nome} (${g.ruolo})</option>`).join('')}
      </select>
    </div>
    <button onclick="salvaAssegnazioneMaglia('${sqId}','${key}')" class="btn-primary" style="width:100%;margin-top:8px">💾 SALVA</button>
  `;

  // Pre-seleziona giocatore attuale
  const maglie=sq.maglie||{};
  const sel=document.getElementById('maglia-giocatore-select');
  if(sel&&maglie[key]) sel.value=maglie[key];

  m.classList.add('open');
}

async function salvaAssegnazioneMaglia(sqId,key){
  const sq=squadreDB.find(s=>s.id===sqId)||utenteLoggato;
  const gId=document.getElementById('maglia-giocatore-select').value||null;
  const maglie={...(sq.maglie||{n7:null,n9:null,n10:null,portiere:null,capitano:null,upgrade_kit:false})};
  maglie[key]=gId?parseInt(gId):null;

  try{
    const{error}=await sb.from('squadre').update({maglie}).eq('id',sqId);
    if(error) throw error;
    const idx=squadreDB.findIndex(s=>s.id===sqId);
    if(idx>=0) squadreDB[idx].maglie=maglie;
    if(utenteLoggato&&utenteLoggato.id===sqId) utenteLoggato.maglie=maglie;
    document.getElementById('modal-assegna-maglia').classList.remove('open');
    showToast(`✅ ${MAGLIE_LABEL[key]} assegnata!`);
    renderStadio();
  }catch(e){showToast('❌ Errore: '+e.message,'error');}
}

async function acquistaUpgradeKit(sqId){
  const sq=squadreDB.find(s=>s.id===sqId)||utenteLoggato;
  if(!sq||(sq.budget||0)<60000000){showToast('❌ Budget insufficiente','error');return;}
  if(sq.maglie?.upgrade_kit){showToast('⚠️ Upgrade già acquistato','error');return;}

  try{
    const maglie={...(sq.maglie||{}),upgrade_kit:true};
    const nuovoBudget=(sq.budget||0)-60000000;
    const{error}=await sb.from('squadre').update({maglie,budget:nuovoBudget}).eq('id',sqId);
    if(error) throw error;
    const idx=squadreDB.findIndex(s=>s.id===sqId);
    if(idx>=0){squadreDB[idx].maglie=maglie;squadreDB[idx].budget=nuovoBudget;}
    if(utenteLoggato&&utenteLoggato.id===sqId){utenteLoggato.maglie=maglie;utenteLoggato.budget=nuovoBudget;}
    showToast('⭐ Upgrade Kit acquistato! Ora hai il kit completo!');
    renderStadio();
  }catch(e){showToast('❌ Errore: '+e.message,'error');}
}
