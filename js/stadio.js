// ===== STADIO =====

function getStadioLevel(capienza){
  if(capienza>=80000) return {level:8,nome:'Catedral del Calcio',emoji:'⭐',colore:'#FFD700'};
  if(capienza>=70000) return {level:7,nome:'Stadio di Lusso',emoji:'💎',colore:'#E5C100'};
  if(capienza>=60000) return {level:6,nome:'Impianto Europeo',emoji:'🌟',colore:'#C0A000'};
  if(capienza>=50000) return {level:5,nome:'Stadium Moderno',emoji:'🏆',colore:'#00FF87'};
  if(capienza>=40000) return {level:4,nome:'Quattro Tribune',emoji:'🔵',colore:'#4FC3F7'};
  if(capienza>=30000) return {level:3,nome:'Anello Superiore',emoji:'🟢',colore:'#81C784'};
  if(capienza>=20000) return {level:2,nome:'Tribuna Coperta',emoji:'🟡',colore:'#FFF176'};
  return {level:1,nome:'Stadio Base',emoji:'⚪',colore:'#9E9E9E'};
}

function getPercentualeRiempimento(piazzamento){
  if(piazzamento<=3) return 100;
  if(piazzamento<=5) return 95;
  if(piazzamento<=7) return 90;
  if(piazzamento<=9) return 85;
  if(piazzamento<=11) return 80;
  return 75;
}

// Foto reali (Copilot) per ciascun livello stadio 1-8. Se un livello non è
// presente qui, si torna automaticamente all'SVG disegnato a mano.
const IMMAGINI_STADI={
  1:'img/stadi/stadio_1.jpg',
  2:'img/stadi/stadio_2.jpg',
  3:'img/stadi/stadio_3.jpg',
  4:'img/stadi/stadio_4.jpg',
  5:'img/stadi/stadio_5.jpg',
  6:'img/stadi/stadio_6.jpg',
  7:'img/stadi/stadio_7.jpg',
  8:'img/stadi/stadio_8.jpg',
};

function disegnaStadio(capienza){
  const level=getStadioLevel(capienza);
  if(IMMAGINI_STADI[level.level]){
    return `<img src="${IMMAGINI_STADI[level.level]}" style="width:100%;max-width:320px;height:160px;object-fit:cover;border-radius:8px;display:block;margin:0 auto">`;
  }
  return disegnaStadioSvg(capienza);
}

function disegnaStadioSvg(capienza){
  const level=getStadioLevel(capienza);
  const pct=Math.min(capienza/80000,1);
  const colore=level.colore;

  // SVG stadio che cresce con il livello
  const w=320, h=160;
  const cx=w/2, cy=h*0.6;

  // Base sempre presente
  let svgContent=`
    <!-- Campo verde -->
    <ellipse cx="${cx}" cy="${cy+10}" rx="${60+pct*60}" ry="${20+pct*15}" fill="#2d5a27" stroke="#3d7a37" stroke-width="1"/>
    <ellipse cx="${cx}" cy="${cy+10}" rx="${30+pct*30}" ry="${10+pct*7}" fill="none" stroke="#3d7a37" stroke-width="1" stroke-dasharray="4,2"/>
    <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy+20}" stroke="#3d7a37" stroke-width="1"/>

    <!-- Tribuna principale (sempre) -->
    <path d="M${cx-80-pct*60},${cy+5} Q${cx},${cy-30-pct*40} ${cx+80+pct*60},${cy+5}" fill="none" stroke="${colore}" stroke-width="${2+pct*2}"/>
    <path d="M${cx-70-pct*50},${cy+8} Q${cx},${cy-20-pct*30} ${cx+70+pct*50},${cy+8}" fill="${colore}22" stroke="${colore}55" stroke-width="1"/>
  `;

  // Livello 2+: tribuna laterale sinistra
  if(capienza>=20000) svgContent+=`
    <path d="M${cx-90-pct*50},${cy-20} L${cx-80-pct*40},${cy+5} L${cx-60-pct*20},${cy}" fill="${colore}33" stroke="${colore}" stroke-width="1.5"/>
    <path d="M${cx+90+pct*50},${cy-20} L${cx+80+pct*40},${cy+5} L${cx+60+pct*20},${cy}" fill="${colore}33" stroke="${colore}" stroke-width="1.5"/>
  `;

  // Livello 3+: anello superiore
  if(capienza>=30000) svgContent+=`
    <path d="M${cx-100-pct*40},${cy-10} Q${cx},${cy-60-pct*30} ${cx+100+pct*40},${cy-10}" fill="none" stroke="${colore}88" stroke-width="1.5" stroke-dasharray="6,3"/>
  `;

  // Livello 4+: quattro tribune chiuse
  if(capienza>=40000) svgContent+=`
    <path d="M${cx-85-pct*35},${cy+5} L${cx-95-pct*45},${cy-30} L${cx-80-pct*30},${cy-25} L${cx-70-pct*20},${cy+3}" fill="${colore}22" stroke="${colore}66" stroke-width="1"/>
    <path d="M${cx+85+pct*35},${cy+5} L${cx+95+pct*45},${cy-30} L${cx+80+pct*30},${cy-25} L${cx+70+pct*20},${cy+3}" fill="${colore}22" stroke="${colore}66" stroke-width="1"/>
  `;

  // Livello 5+: torri illuminazione
  if(capienza>=50000) svgContent+=`
    <line x1="${cx-110}" y1="${cy+10}" x2="${cx-105}" y2="${cy-50}" stroke="${colore}" stroke-width="2"/>
    <circle cx="${cx-105}" cy="${cy-50}" r="4" fill="${colore}"/>
    <line x1="${cx+110}" y1="${cy+10}" x2="${cx+105}" y2="${cy-50}" stroke="${colore}" stroke-width="2"/>
    <circle cx="${cx+105}" cy="${cy-50}" r="4" fill="${colore}"/>
  `;

  // Livello 6+: strutture esterne
  if(capienza>=60000) svgContent+=`
    <rect x="${cx-130}" y="${cy-10}" width="15" height="30" rx="3" fill="${colore}33" stroke="${colore}55" stroke-width="1"/>
    <rect x="${cx+115}" y="${cy-10}" width="15" height="30" rx="3" fill="${colore}33" stroke="${colore}55" stroke-width="1"/>
    <path d="M${cx-120},${cy-60} Q${cx},${cy-100} ${cx+120},${cy-60}" fill="none" stroke="${colore}44" stroke-width="2"/>
  `;

  // Livello 7+: tetto
  if(capienza>=70000) svgContent+=`
    <path d="M${cx-130},${cy-15} Q${cx},${cy-90} ${cx+130},${cy-15}" fill="${colore}11" stroke="${colore}" stroke-width="2"/>
    <path d="M${cx-120},${cy-10} Q${cx},${cy-80} ${cx+120},${cy-10}" fill="${colore}22" stroke="${colore}88" stroke-width="1"/>
  `;

  // Livello 8: stelle/effetti speciali
  if(capienza>=80000) svgContent+=`
    <circle cx="${cx}" cy="${cy-100}" r="8" fill="${colore}" opacity="0.8"/>
    <circle cx="${cx-40}" cy="${cy-80}" r="4" fill="${colore}" opacity="0.5"/>
    <circle cx="${cx+40}" cy="${cy-80}" r="4" fill="${colore}" opacity="0.5"/>
    <text x="${cx}" y="${cy+35}" text-anchor="middle" font-family="'Bebas Neue',sans-serif" font-size="11" fill="${colore}" letter-spacing="2">CATEDRAL DEL CALCIO</text>
  `;

  // Tifosi piccoli in tribuna
  const numTifosiDots=Math.min(Math.floor(pct*20),20);
  for(let i=0;i<numTifosiDots;i++){
    const angle=(i/numTifosiDots)*Math.PI;
    const rx=65+pct*55, ry=22+pct*18;
    const px=cx+rx*Math.cos(Math.PI-angle);
    const py=(cy+5)-ry*Math.sin(angle)*0.6;
    svgContent+=`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="2" fill="${colore}88"/>`;
  }

  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:180px">${svgContent}</svg>`;
}

function getBonusMuseo(capienza){
  // +10% ogni 10.000 posti sopra i 10.000 base
  const extra=Math.max(0,capienza-10000);
  return Math.floor(extra/10000)*10;
}

async function renderStadio(){
  const container=document.getElementById('stadio-content');
  if(!container) return;

  // Prendo la mia squadra SEMPRE da squadreDB per avere i dati aggiornati
  const sqBase=utenteLoggato;
  if(!sqBase){container.innerHTML='<div class="empty">Accedi per vedere il tuo stadio</div>';return;}
  const sq=squadreDB.find(s=>s.id===sqBase.id)||sqBase;

  // Dati stadio
  const capienza=sq.capienza_stadio||10000;
  const ampliamenti=sq.ampliamenti_stadio||0;
  const piazzamento=sq.piazzamento||12;
  const tifosi=sq.tifosi||0;
  const level=getStadioLevel(capienza);
  const pctRiempimento=getPercentualeRiempimento(piazzamento);
  const paganti=Math.floor(Math.min(tifosi,capienza)*pctRiempimento/100);
  const entrateBiglietteria=paganti*80*19;
  const bonusMuseo=getBonusMuseo(capienza);
  const capienzaMax=80000;
  const puoAmpliare=capienza<capienzaMax;
  const costoAmpliamento=3500000;
  const budgetSufficiente=(sq.budget||0)>=costoAmpliamento;

  // Calcola rendita museo con bonus stadio
  const renditaMuseoBase=Object.entries(
    (sq.trofei||[]).reduce((acc,t)=>{acc[t.compId]=(acc[t.compId]||[]);acc[t.compId].push(t);return acc;},{})
  ).reduce((tot,[cid,arr])=>{
    const comp=competizioni.find(c=>c.id===cid);
    if(!comp||!comp.museo) return tot;
    const fmTot=arr.reduce((s,t)=>s+(t.fmMuseo||comp.museo.fm),0);
    return tot+fmTot*getMolt(arr.length);
  },0);
  const renditaMuseoConBonus=renditaMuseoBase*(1+bonusMuseo/100);

  container.innerHTML=`
    <!-- HEADER -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:24px;color:var(--oro);letter-spacing:2px">${sq.nome_squadra||sq.nome}</div>
        <div style="font-size:12px;color:var(--testo-dim)">Stadio di proprietà</div>
      </div>
      <div style="text-align:right">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:16px;color:${level.colore}">${level.emoji} ${level.nome}</div>
        <div style="font-size:11px;color:var(--testo-dim)">Livello ${level.level}/8</div>
      </div>
    </div>

    <!-- GRAFICA STADIO -->
    <div class="stadio-visual">
      <div class="stadio-level-badge">${level.emoji} ${capienza.toLocaleString('it-IT')} posti</div>
      <div class="stadio-svg-wrap">${disegnaStadio(capienza)}</div>
      <!-- Barra progressione -->
      <div style="padding:10px 16px;background:var(--grigio-scuro);border-top:1px solid var(--grigio-chiaro)">
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--testo-dim);margin-bottom:4px">
          <span>10.000</span><span>${capienza.toLocaleString('it-IT')} / 80.000 posti</span>
        </div>
        <div style="background:var(--grigio-medio);border-radius:4px;height:6px">
          <div style="width:${((capienza-10000)/70000*100).toFixed(1)}%;height:100%;border-radius:4px;background:linear-gradient(90deg,${level.colore}88,${level.colore})"></div>
        </div>
      </div>
    </div>

    <!-- INFO GRID -->
    <div class="stadio-info-grid">
      <div class="stadio-info-card">
        <div class="stadio-info-label">👥 Tifosi</div>
        <div class="stadio-info-val">${tifosi.toLocaleString('it-IT')}</div>
        <div class="stadio-info-sub">Capienza: ${capienza.toLocaleString('it-IT')}</div>
      </div>
      <div class="stadio-info-card">
        <div class="stadio-info-label">📍 Piazzamento</div>
        <div class="stadio-info-val">${piazzamento}°</div>
        <div class="stadio-info-sub">Riempimento: ${pctRiempimento}%</div>
      </div>
      <div class="stadio-info-card">
        <div class="stadio-info-label">🎫 Paganti/partita</div>
        <div class="stadio-info-val">${paganti.toLocaleString('it-IT')}</div>
        <div class="stadio-info-sub">80 FM × 19 partite</div>
      </div>
      <div class="stadio-info-card">
        <div class="stadio-info-label">🏛️ Bonus Museo</div>
        <div class="stadio-info-val">+${bonusMuseo}%</div>
        <div class="stadio-info-sub">+10% ogni 10K posti</div>
      </div>
    </div>

    <!-- ENTRATE -->
    <div class="stadio-entrate-box">
      <div class="stadio-entrate-title">💰 ENTRATE STAGIONALI</div>
      <div class="stadio-entrate-row">
        <span>Biglietteria (${paganti.toLocaleString('it-IT')} × 80 × 19)</span>
        <span style="color:var(--verde)">${fmtM(entrateBiglietteria)}</span>
      </div>
      <div class="stadio-entrate-row">
        <span>Rendita Museo (base)</span>
        <span style="color:var(--oro)">${fmtM(renditaMuseoBase*1000000)}</span>
      </div>
      ${bonusMuseo>0?`<div class="stadio-entrate-row">
        <span>Bonus Museo stadio (+${bonusMuseo}%)</span>
        <span style="color:var(--verde)">+${fmtM((renditaMuseoConBonus-renditaMuseoBase)*1000000)}</span>
      </div>`:''}
      <div class="stadio-entrate-row">
        <span>🛍️ Store</span>
        <span style="color:var(--verde)">${fmtM(getStoreLevel(capienza).guadagno)}</span>
      </div>
      <div class="stadio-entrate-row">
        <span>🍔 Fast Food</span>
        <span style="color:var(--verde)">${fmtM(calcGuadagnoFF(sq.fastfood_livello||0,paganti))}</span>
      </div>
      <div class="stadio-entrate-row">
        <span>🏟️ TOTALE ANNUO STIMATO</span>
        <span>${fmtM(entrateBiglietteria+renditaMuseoConBonus*1000000+getStoreLevel(capienza).guadagno+calcGuadagnoFF(sq.fastfood_livello||0,paganti))}</span>
      </div>
    </div>

    <!-- AMPLIAMENTO -->
    ${puoAmpliare?`
    <div class="stadio-amplia-box">
      <div class="stadio-amplia-title">🔨 AMPLIA LO STADIO</div>
      <div class="stadio-amplia-row"><span>Capienza attuale</span><strong>${capienza.toLocaleString('it-IT')} posti</strong></div>
      <div class="stadio-amplia-row"><span>Dopo ampliamento</span><strong>${(capienza+2000).toLocaleString('it-IT')} posti</strong></div>
      <div class="stadio-amplia-row"><span>Costo</span><strong style="color:var(--rosso)">3,50 M FM</strong></div>
      <div class="stadio-amplia-row"><span>Ampliamenti totali</span><strong>${ampliamenti}</strong></div>
      <div class="stadio-amplia-row"><span>Il tuo budget</span><strong style="color:${budgetSufficiente?'var(--verde)':'var(--rosso)'}">${fmtM(sq.budget||0)}</strong></div>
      ${(utenteLoggato&&utenteLoggato.id===sq.id)||adminLoggato?`
        <button onclick="ampliaStadio('${sq.id}')" class="btn-primary" style="width:100%;margin-top:12px;${!budgetSufficiente?'opacity:0.5;pointer-events:none':''}"
          ${!budgetSufficiente?'disabled':''}>
          🏗️ AMPLIA (+2.000 posti — 3,5M FM)
        </button>
        ${!budgetSufficiente?'<div style="text-align:center;font-size:12px;color:var(--rosso);margin-top:6px">Budget insufficiente</div>':''}
      `:''}
    </div>`:`
    <div class="stadio-amplia-box" style="text-align:center">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--oro)">⭐ STADIO AL MASSIMO</div>
      <div style="font-size:13px;color:var(--testo-dim);margin-top:6px">80.000 posti — Capienza massima raggiunta</div>
    </div>`}

    <!-- PROSSIMO LIVELLO -->
    ${puoAmpliare?`
    <div style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:12px;padding:14px;margin-bottom:16px">
      <div style="font-size:12px;color:var(--testo-dim);margin-bottom:8px">LIVELLI STADIO</div>
      ${[10000,20000,30000,40000,50000,60000,70000,80000].map(c=>{
        const l=getStadioLevel(c);
        const raggiunto=capienza>=c;
        return `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;opacity:${raggiunto?1:0.4}">
          <span style="font-size:14px">${l.emoji}</span>
          <span style="flex:1;font-size:12px;color:${raggiunto?l.colore:'var(--testo-dim)'}">${l.nome}</span>
          <span style="font-size:11px;color:var(--testo-dim)">${c.toLocaleString('it-IT')} posti</span>
          ${raggiunto?'<span style="color:var(--verde);font-size:11px">✓</span>':''}
        </div>`;
      }).join('')}
    </div>`:''}

    <!-- ACCORDION MAGLIETTE -->
    <div style="border:1px solid var(--grigio-chiaro);border-radius:12px;overflow:hidden;margin-bottom:12px">
      <div onclick="toggleAccordion('acc-magliette')" style="background:var(--grigio-scuro);padding:14px 16px;cursor:pointer;display:flex;justify-content:space-between;align-items:center">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--oro);letter-spacing:1px">👕 MAGLIETTE & STORE</div>
        <span id="acc-magliette-arrow" style="color:var(--oro);font-size:18px">▼</span>
      </div>
      <div id="acc-magliette" style="display:block">
        ${renderMagliette(sq.id)}
      </div>
    </div>

    <!-- ACCORDION MUSEO -->
    <div style="border:1px solid var(--grigio-chiaro);border-radius:12px;overflow:hidden;margin-bottom:12px">
      <div onclick="toggleAccordion('acc-museo')" style="background:var(--grigio-scuro);padding:14px 16px;cursor:pointer;display:flex;justify-content:space-between;align-items:center">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--oro);letter-spacing:1px">🏛️ MUSEO DEI TROFEI</div>
        <span id="acc-museo-arrow" style="color:var(--oro);font-size:18px">▼</span>
      </div>
      <div id="acc-museo" style="display:block;padding:12px">
        ${renderMuseoStadio(sq)}
      </div>
    </div>

    <!-- ACCORDION FAST FOOD -->
    <div style="border:1px solid var(--grigio-chiaro);border-radius:12px;overflow:hidden;margin-bottom:12px">
      <div onclick="toggleAccordion('acc-fastfood')" style="background:var(--grigio-scuro);padding:14px 16px;cursor:pointer;display:flex;justify-content:space-between;align-items:center">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--oro);letter-spacing:1px">🍔 FAST FOOD</div>
        <span id="acc-fastfood-arrow" style="color:var(--oro);font-size:18px">▼</span>
      </div>
      <div id="acc-fastfood" style="display:block;padding:12px">
        ${renderFastFood(sq)}
      </div>
    </div>
  `;
}

function toggleAccordion(id){
  const el=document.getElementById(id);
  const arrow=document.getElementById(id+'-arrow');
  if(!el) return;
  const isOpen=el.style.display!=='none';
  el.style.display=isOpen?'none':'block';
  if(arrow) arrow.textContent=isOpen?'▶':'▼';
}

async function ampliaStadio(sqId){
  const sq=squadreDB.find(s=>s.id===sqId);
  if(!sq) return;
  const capienza=sq.capienza_stadio||10000;
  if(capienza>=80000){showToast('⚠️ Capienza massima raggiunta (80.000)','error');return;}
  if((sq.budget||0)<3500000){showToast('❌ Budget insufficiente (servono 3,5M FM)','error');return;}

  try{
    const nuovaCapienza=capienza+2000;
    const nuoviBudget=(sq.budget||0)-3500000;
    const nuoviAmpliamenti=(sq.ampliamenti_stadio||0)+1;

    const{error}=await sb.from('squadre').update({
      capienza_stadio:nuovaCapienza,
      budget:nuoviBudget,
      ampliamenti_stadio:nuoviAmpliamenti
    }).eq('id',sqId);
    if(error) throw error;

    // Aggiorna DB locale
    const idx=squadreDB.findIndex(s=>s.id===sqId);
    if(idx>=0){
      squadreDB[idx].capienza_stadio=nuovaCapienza;
      squadreDB[idx].budget=nuoviBudget;
      squadreDB[idx].ampliamenti_stadio=nuoviAmpliamenti;
    }
    if(utenteLoggato&&utenteLoggato.id===sqId){
      utenteLoggato.capienza_stadio=nuovaCapienza;
      utenteLoggato.budget=nuoviBudget;
      utenteLoggato.ampliamenti_stadio=nuoviAmpliamenti;
    }

    const level=getStadioLevel(nuovaCapienza);
    showToast(`✅ Stadio ampliato! ${nuovaCapienza.toLocaleString('it-IT')} posti ${level.emoji}`);
    renderStadio();
  }catch(e){showToast('❌ Errore: '+e.message,'error');}
}
