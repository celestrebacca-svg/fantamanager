// ===== FAST FOOD =====

const FF_LIVELLI = [
  {livello:0, nome:'Non costruito', emoji:'🚫', pct:0, spesa:0, costo:0, descrizione:''},
  {livello:1, nome:'Banchetto', emoji:'🛖', pct:0.05, spesa:2, costo:300000, descrizione:'Solo da bere'},
  {livello:2, nome:'Chioschetto', emoji:'⛺', pct:0.08, spesa:3.5, costo:600000, descrizione:'Bere e snack'},
  {livello:3, nome:'Fast Food Base', emoji:'🏪', pct:0.10, spesa:6, costo:1000000, descrizione:'Bere, snack e panino scadente'},
  {livello:4, nome:'Fast Food Plus', emoji:'🏬', pct:0.13, spesa:8, costo:2000000, descrizione:'Bere, snack, caramelle e panini vari'},
  {livello:5, nome:'Food Court', emoji:'🏢', pct:0.18, spesa:10, costo:3500000, descrizione:'Servizio veloce, pizza, dolci'},
  {livello:6, nome:'Food Village', emoji:'🏙️', pct:0.25, spesa:10, costo:5000000, descrizione:'+ Biglietti sconto negozi'},
  {livello:7, nome:'Premium Food', emoji:'🌟', pct:0.30, spesa:11, costo:8000000, descrizione:'+ Biglietti omaggio prossima partita'},
  {livello:8, nome:'VIP Food Experience', emoji:'⭐', pct:0.35, spesa:12, costo:10000000, descrizione:'+ Magliette autografate e foto calciatori'}
];

function calcGuadagnoFF(livello, paganti){
  const ff=FF_LIVELLI[livello]||FF_LIVELLI[0];
  if(ff.pct===0) return 0;
  const clienti=Math.floor(paganti*ff.pct);
  return clienti*ff.spesa*19; // 19 partite casa
}

function disegnaFastFood(livello){
  const ff=FF_LIVELLI[livello]||FF_LIVELLI[0];
  const colori=['#555','#8D6E63','#FF8F00','#F57F17','#E53935','#C62828','#880E4F','#4A148C','#1A237E'];
  const colore=colori[livello]||'#555';
  const w=320, h=120;

  if(livello===0) return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:120px">
    <text x="160" y="65" text-anchor="middle" font-family="'Bebas Neue',sans-serif" font-size="16" fill="#555" letter-spacing="2">NON COSTRUITO</text>
    <rect x="100" y="75" width="120" height="3" rx="1" fill="#333"/>
  </svg>`;

  let svg=`<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:120px">`;

  // Base terreno
  svg+=`<rect x="0" y="95" width="${w}" height="25" fill="#1a1a1a"/>`;

  // Livello 1: banchetto
  svg+=`<rect x="110" y="70" width="100" height="25" rx="2" fill="${colore}44" stroke="${colore}" stroke-width="1.5"/>
    <line x1="100" y1="70" x2="220" y2="70" stroke="${colore}" stroke-width="2"/>
    <line x1="115" y1="50" x2="115" y2="70" stroke="${colore}" stroke-width="1.5"/>
    <line x1="205" y1="50" x2="205" y2="70" stroke="${colore}" stroke-width="1.5"/>
    <path d="M105,50 Q160,35 215,50" fill="${colore}44" stroke="${colore}" stroke-width="1.5"/>`;

  if(livello>=2) svg+=`
    <rect x="90" y="45" width="140" height="50" rx="4" fill="${colore}22" stroke="${colore}" stroke-width="1.5"/>
    <rect x="105" y="75" width="25" height="20" rx="2" fill="${colore}44"/>
    <rect x="147" y="75" width="25" height="20" rx="2" fill="${colore}44"/>
    <rect x="189" y="75" width="25" height="20" rx="2" fill="${colore}44"/>`;

  if(livello>=3) svg+=`
    <rect x="75" y="35" width="170" height="60" rx="6" fill="${colore}22" stroke="${colore}" stroke-width="2"/>
    <text x="160" y="52" text-anchor="middle" font-family="'Bebas Neue',sans-serif" font-size="10" fill="${colore}" letter-spacing="2">FAST FOOD</text>
    <rect x="85" y="55" width="20" height="15" rx="2" fill="${colore}55"/>
    <rect x="110" y="55" width="20" height="15" rx="2" fill="${colore}55"/>
    <rect x="190" y="55" width="20" height="15" rx="2" fill="${colore}55"/>
    <rect x="215" y="55" width="20" height="15" rx="2" fill="${colore}55"/>`;

  if(livello>=4) svg+=`
    <rect x="60" y="25" width="200" height="70" rx="8" fill="${colore}22" stroke="${colore}" stroke-width="2"/>
    <rect x="60" y="25" width="200" height="18" rx="8" fill="${colore}55"/>
    <text x="160" y="38" text-anchor="middle" font-family="'Bebas Neue',sans-serif" font-size="10" fill="white" letter-spacing="2">${ff.nome.toUpperCase()}</text>`;

  if(livello>=5) svg+=`
    <line x1="60" y1="23" x2="60" y2="95" stroke="${colore}" stroke-width="2"/>
    <line x1="260" y1="23" x2="260" y2="95" stroke="${colore}" stroke-width="2"/>
    <path d="M55,23 Q160,8 265,23" fill="${colore}33" stroke="${colore}" stroke-width="1.5"/>`;

  if(livello>=6) svg+=`
    <circle cx="60" cy="20" r="5" fill="${colore}"/>
    <circle cx="260" cy="20" r="5" fill="${colore}"/>
    <rect x="145" y="5" width="30" height="15" rx="4" fill="${colore}"/>
    <text x="160" y="16" text-anchor="middle" font-family="'Bebas Neue',sans-serif" font-size="8" fill="white">MENU</text>`;

  if(livello>=7) svg+=`
    <circle cx="40" cy="50" r="12" fill="${colore}22" stroke="${colore}" stroke-width="1.5"/>
    <circle cx="280" cy="50" r="12" fill="${colore}22" stroke="${colore}" stroke-width="1.5"/>
    <text x="40" y="54" text-anchor="middle" font-size="10">🍔</text>
    <text x="280" y="54" text-anchor="middle" font-size="10">🍕</text>`;

  if(livello>=8) svg+=`
    <rect x="0" y="88" width="${w}" height="7" fill="${colore}33"/>
    <text x="160" y="110" text-anchor="middle" font-family="'Bebas Neue',sans-serif" font-size="9" fill="${colore}" letter-spacing="3">VIP FOOD EXPERIENCE</text>
    <circle cx="160" cy="3" r="5" fill="${colore}"/>`;

  svg+='</svg>';
  return svg;
}

function renderFastFood(sq){
  const livello=sq.fastfood_livello||0;
  const ff=FF_LIVELLI[livello]||FF_LIVELLI[0];
  const ffNext=FF_LIVELLI[livello+1]||null;
  const paganti=Math.floor(Math.min(sq.tifosi||0, sq.capienza_stadio||10000)*getPercentualeRiempimento(sq.piazzamento||12)/100);
  const guadagno=calcGuadagnoFF(livello, paganti);
  const budget=sq.budget||0;
  const isOwner=(utenteLoggato&&utenteLoggato.id===sq.id)||adminLoggato;
  const puoCostruire=ffNext&&budget>=ffNext.costo;

  return `
    <div style="background:var(--grigio-scuro);border:1px solid var(--grigio-chiaro);border-radius:12px;padding:16px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--oro);letter-spacing:1px">${ff.emoji} ${livello===0?'FAST FOOD':ff.nome}</div>
        ${livello>0?`<div style="font-family:'Space Mono',monospace;font-size:13px;color:var(--verde)">+${fmtM(guadagno)}/anno</div>`:''}
      </div>
      
      <div style="margin-bottom:12px">${disegnaFastFood(livello)}</div>
      
      ${livello>0?`
      <div style="background:var(--grigio);border-radius:8px;padding:10px;margin-bottom:12px">
        <div style="font-size:11px;color:var(--testo-dim);margin-bottom:6px">DETTAGLIO GUADAGNO</div>
        <div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0"><span style="color:var(--testo-dim)">Clienti per partita</span><span>${Math.floor(paganti*ff.pct).toLocaleString('it-IT')} (${(ff.pct*100).toFixed(0)}% di ${paganti.toLocaleString('it-IT')})</span></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0"><span style="color:var(--testo-dim)">Spesa media</span><span>${ff.spesa} FM/persona</span></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0"><span style="color:var(--testo-dim)">Partite in casa</span><span>× 19</span></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;border-top:1px solid var(--grigio-chiaro);margin-top:4px;padding-top:4px"><span style="color:var(--verde);font-weight:700">Totale stagionale</span><span style="color:var(--verde);font-weight:700">${fmtM(guadagno)}</span></div>
        <div style="font-size:11px;color:var(--testo-dim);margin-top:4px">🍽️ ${ff.descrizione}</div>
      </div>`:''}

      ${isOwner&&ffNext?`
      <div style="background:rgba(255,215,0,0.05);border:1px solid rgba(255,215,0,0.2);border-radius:10px;padding:12px">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:14px;color:var(--oro);margin-bottom:6px">
          ${livello===0?'🏗️ COSTRUISCI FAST FOOD':'⬆️ MIGLIORA: '+ffNext.nome+' '+ffNext.emoji}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span style="color:var(--testo-dim)">Costo</span><span style="color:var(--rosso)">${fmtM(ffNext.costo)}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px"><span style="color:var(--testo-dim)">Guadagno nuovo livello</span><span style="color:var(--verde)">+${fmtM(calcGuadagnoFF(ffNext.livello, paganti))}/anno</span></div>
        <button onclick="upgradeFF('${sq.id}')" style="width:100%;padding:10px;border-radius:8px;border:1px solid ${puoCostruire?'gold':'#555'};background:${puoCostruire?'rgba(255,215,0,0.15)':'rgba(255,255,255,0.05)'};color:${puoCostruire?'gold':'#555'};font-family:'Bebas Neue',sans-serif;font-size:14px;cursor:${puoCostruire?'pointer':'not-allowed'}">
          ${puoCostruire?(livello===0?'🏗️ COSTRUISCI ('+fmtM(ffNext.costo)+')':'⬆️ MIGLIORA ('+fmtM(ffNext.costo)+')'):'💸 Budget insufficiente'}
        </button>
      </div>`:''}
      
      ${livello===8?`<div style="text-align:center;padding:10px;font-family:'Bebas Neue',sans-serif;font-size:14px;color:var(--oro)">⭐ LIVELLO MASSIMO RAGGIUNTO</div>`:''}
      
      <!-- Barra progressione livelli -->
      <div style="margin-top:12px">
        <div style="display:flex;gap:3px">
          ${FF_LIVELLI.slice(1).map((l,i)=>`<div style="flex:1;height:4px;border-radius:2px;background:${livello>i?'var(--oro)':'var(--grigio-chiaro)'}"></div>`).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--testo-dim);margin-top:3px">
          <span>Lv1</span><span>Lv${livello>0?livello:'-'}</span><span>Lv8</span>
        </div>
      </div>
    </div>
  `;
}

async function upgradeFF(sqId){
  const sq=squadreDB.find(s=>s.id===sqId)||utenteLoggato;
  if(!sq) return;
  const livelloAttuale=sq.fastfood_livello||0;
  if(livelloAttuale>=8){showToast('⭐ Livello massimo raggiunto','error');return;}
  const ffNext=FF_LIVELLI[livelloAttuale+1];
  if((sq.budget||0)<ffNext.costo){showToast('❌ Budget insufficiente','error');return;}

  try{
    const nuovoLivello=livelloAttuale+1;
    const nuovoBudget=(sq.budget||0)-ffNext.costo;
    const{error}=await sb.from('squadre').update({fastfood_livello:nuovoLivello,budget:nuovoBudget}).eq('id',sqId);
    if(error) throw error;
    const idx=squadreDB.findIndex(s=>s.id===sqId);
    if(idx>=0){squadreDB[idx].fastfood_livello=nuovoLivello;squadreDB[idx].budget=nuovoBudget;}
    if(utenteLoggato&&utenteLoggato.id===sqId){utenteLoggato.fastfood_livello=nuovoLivello;utenteLoggato.budget=nuovoBudget;}
    showToast(`✅ Fast Food migliorato: ${ffNext.nome} ${ffNext.emoji}`);
    renderStadio();
  }catch(e){showToast('❌ Errore: '+e.message,'error');}
}
