// ===== COPPE SVG MUSEO =====

// IMMAGINI_TROFEI e getTipoTrofeo vivono in utils.js (carica sempre per primo).

// Renderizza un trofeo-foto piccolo e orizzontale, con effetto "opaco/rovinato"
// ai livelli bassi del museo che diventa via via più lucido e con glow ai livelli alti.
function disegnaCoppaImg(url,anno,livelloMuseo){
  const lux=Math.min(livelloMuseo,7);
  const grayscale=Math.max(0,45-lux*6.5);   // 45% a livello 0 → 0% a livello 7
  const sepiaPct=Math.max(0,25-lux*3.5);    // patina che sparisce col livello
  const bright=(0.72+lux*0.045).toFixed(2); // 0.72 → 1.03
  const satur=(0.55+lux*0.065).toFixed(2);  // 0.55 → 1.0
  const glow=lux>=5?'drop-shadow(0 0 6px rgba(255,215,0,0.55))':lux>=3?'drop-shadow(0 0 3px rgba(255,215,0,0.25))':'none';
  return `<div style="width:56px;height:44px;display:flex;align-items:center;justify-content:center;overflow:hidden">
    <img src="${url}" loading="lazy" style="max-width:100%;max-height:100%;object-fit:contain;filter:grayscale(${grayscale}%) sepia(${sepiaPct}%) brightness(${bright}) saturate(${satur}) ${glow}">
  </div>
  <div style="font-family:'Bebas Neue',sans-serif;font-size:9px;color:${lux>=3?'#DAA520':'#777'};text-align:center;margin-top:1px">${anno}</div>`;
}

function disegnaCoppa(tipo, anno, livelloMuseo){
  // Se c'è una foto reale per questo tipo, usa quella
  if(IMMAGINI_TROFEI[tipo]) return disegnaCoppaImg(IMMAGINI_TROFEI[tipo],anno,livelloMuseo);

  // Museo migliora con lo stadio: 0=base, 7=lusso
  const lux=Math.min(livelloMuseo,7);
  const glow=lux>=3;
  const lucente=lux>=5;
  const lusso=lux>=7;
  
  const w=80, h=100;

  switch(tipo){
    case 'campionato_1':
      return disegnaCampionato1(w,h,anno,glow,lucente,lusso);
    case 'campionato_2':
      return disegnaMedaglia(w,h,anno,'#C0C0C0','#A8A8A8',glow,lucente);
    case 'campionato_3':
      return disegnaMedaglia(w,h,anno,'#CD7F32','#A0522D',glow,lucente);
    case 'champions':
      return disegnaChampions(w,h,anno,glow,lucente,lusso);
    case 'europa_league':
      return disegnaEuropaLeague(w,h,anno,glow,lucente);
    case 'formula_1':
      return disegnaFormula1(w,h,anno,glow,lucente);
    case 'coppa_coglioni':
      return disegnaCoglioni(w,h,anno);
    case 'coppa_italia':
      return disegnaCoppaItalia(w,h,anno,glow,lucente);
    default:
      return disegnaGenerico(w,h,anno,tipo,glow,lucente);
  }
}

function disegnaCampionato1(w,h,anno,glow,lucente,lusso){
  const oro=lusso?'#FFD700':lucente?'#DAA520':'#B8860B';
  const filt=glow?`<filter id="glow1"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`:'';
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:70px;height:90px">
    ${filt}
    <g filter="${glow?'url(#glow1)':''}">
    <!-- Base -->
    <rect x="22" y="82" width="36" height="6" rx="2" fill="${oro}"/>
    <rect x="27" y="76" width="26" height="8" rx="1" fill="${oro}88"/>
    <!-- Corpo coppa -->
    <path d="M30,30 Q20,45 25,65 L55,65 Q60,45 50,30 Z" fill="${oro}" stroke="${lusso?'#FFF8DC':''}${lusso?' stroke-width=0.5':''}"/>
    <!-- Apertura coppa -->
    <ellipse cx="40" cy="30" rx="12" ry="4" fill="${oro}cc"/>
    <!-- Manici -->
    <path d="M30,40 Q15,42 18,55 Q22,60 25,58" fill="none" stroke="${oro}" stroke-width="3" stroke-linecap="round"/>
    <path d="M50,40 Q65,42 62,55 Q58,60 55,58" fill="none" stroke="${oro}" stroke-width="3" stroke-linecap="round"/>
    <!-- Stella sopra -->
    ${lusso?`<text x="40" y="22" text-anchor="middle" font-size="10">⭐</text>`:''}
    <!-- Brillantini -->
    ${lucente?`<circle cx="35" cy="48" r="1.5" fill="white" opacity="0.7"/>
    <circle cx="45" cy="42" r="1" fill="white" opacity="0.5"/>
    <circle cx="42" cy="56" r="1" fill="white" opacity="0.6"/>`:''}
    <!-- Anno -->
    <text x="40" y="96" text-anchor="middle" font-family="'Bebas Neue',sans-serif" font-size="8" fill="${oro}">${anno}</text>
    </g>
  </svg>`;
}

function disegnaMedaglia(w,h,anno,colore,coloreScuro,glow,lucente){
  const filt=glow?`<filter id="glowM"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`:'';
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:70px;height:90px">
    ${filt}
    <g filter="${glow?'url(#glowM)':''}">
    <!-- Nastro -->
    <path d="M30,10 L40,10 L45,35 L35,38 L25,35 Z" fill="${colore}88" stroke="${coloreScuro}" stroke-width="0.5"/>
    <line x1="35" y1="10" x2="35" y2="38" stroke="${coloreScuro}" stroke-width="0.5"/>
    <!-- Medaglia -->
    <circle cx="40" cy="60" r="22" fill="${colore}" stroke="${coloreScuro}" stroke-width="1.5"/>
    <circle cx="40" cy="60" r="17" fill="none" stroke="${coloreScuro}" stroke-width="1"/>
    ${lucente?`<circle cx="33" cy="53" r="3" fill="white" opacity="0.4"/>`:''}
    <!-- Numero sul podio -->
    <text x="40" y="65" text-anchor="middle" font-family="'Bebas Neue',sans-serif" font-size="18" fill="${coloreScuro}">${colore==='#C0C0C0'?'2':'3'}</text>
    <!-- Anno -->
    <text x="40" y="96" text-anchor="middle" font-family="'Bebas Neue',sans-serif" font-size="8" fill="${colore}">${anno}</text>
    </g>
  </svg>`;
}

function disegnaChampions(w,h,anno,glow,lucente,lusso){
  const colore=lusso?'#FFD700':lucente?'#DAA520':'#C0A000';
  const filt=glow?`<filter id="glowC"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`:'';
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:70px;height:90px">
    ${filt}
    <g filter="${glow?'url(#glowC)':''}">
    <!-- Base -->
    <rect x="22" y="82" width="36" height="5" rx="2" fill="${colore}"/>
    <rect x="28" y="76" width="24" height="7" rx="1" fill="${colore}88"/>
    <!-- Corpo -->
    <path d="M32,32 Q22,48 26,68 L54,68 Q58,48 48,32 Z" fill="${colore}"/>
    <!-- Orecchie grandi stile Champions -->
    <path d="M32,35 Q12,30 10,45 Q12,58 26,55" fill="none" stroke="${colore}" stroke-width="5" stroke-linecap="round"/>
    <path d="M48,35 Q68,30 70,45 Q68,58 54,55" fill="none" stroke="${colore}" stroke-width="5" stroke-linecap="round"/>
    <!-- Apertura -->
    <ellipse cx="40" cy="32" rx="10" ry="3.5" fill="${colore}cc"/>
    <!-- Stelle -->
    ${lucente?`<text x="40" y="25" text-anchor="middle" font-size="8">✦✦✦</text>`:''}
    ${lucente?`<circle cx="34" cy="50" r="1.5" fill="white" opacity="0.6"/><circle cx="46" cy="45" r="1" fill="white" opacity="0.4"/>`:''}
    <text x="40" y="96" text-anchor="middle" font-family="'Bebas Neue',sans-serif" font-size="8" fill="${colore}">${anno}</text>
    </g>
  </svg>`;
}

function disegnaEuropaLeague(w,h,anno,glow,lucente){
  const colore=lucente?'#FF8C00':'#CC7000';
  const filt=glow?`<filter id="glowEL"><feGaussianBlur stdDeviation="1.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`:'';
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:70px;height:90px">
    ${filt}
    <g filter="${glow?'url(#glowEL)':''}">
    <rect x="24" y="82" width="32" height="5" rx="2" fill="${colore}"/>
    <rect x="29" y="76" width="22" height="7" rx="1" fill="${colore}88"/>
    <path d="M33,34 Q24,48 27,68 L53,68 Q56,48 47,34 Z" fill="${colore}"/>
    <!-- Orecchie più piccole stile EL -->
    <path d="M33,37 Q18,33 17,46 Q18,56 27,54" fill="none" stroke="${colore}" stroke-width="4" stroke-linecap="round"/>
    <path d="M47,37 Q62,33 63,46 Q62,56 53,54" fill="none" stroke="${colore}" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="40" cy="34" rx="9" ry="3" fill="${colore}cc"/>
    ${lucente?`<circle cx="36" cy="52" r="1.5" fill="white" opacity="0.5"/>`:''}
    <text x="40" y="96" text-anchor="middle" font-family="'Bebas Neue',sans-serif" font-size="8" fill="${colore}">${anno}</text>
    </g>
  </svg>`;
}

function disegnaFormula1(w,h,anno,glow,lucente){
  const colore=lucente?'#FF4444':'#CC2222';
  const filt=glow?`<filter id="glowF1"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`:'';
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:70px;height:90px">
    ${filt}
    <g filter="${glow?'url(#glowF1)':''}">
    <!-- Base con ruote F1 -->
    <rect x="15" y="82" width="50" height="6" rx="3" fill="${colore}"/>
    <circle cx="22" cy="85" r="5" fill="#333" stroke="${colore}" stroke-width="1"/>
    <circle cx="58" cy="85" r="5" fill="#333" stroke="${colore}" stroke-width="1"/>
    <!-- Trofeo a forma dinamica -->
    <path d="M28,30 L52,30 L58,68 L22,68 Z" fill="${colore}"/>
    <!-- Alette laterali -->
    <path d="M28,38 L15,35 L15,50 L28,48" fill="${colore}88" stroke="${colore}" stroke-width="1"/>
    <path d="M52,38 L65,35 L65,50 L52,48" fill="${colore}88" stroke="${colore}" stroke-width="1"/>
    <!-- Casco in cima -->
    <ellipse cx="40" cy="28" rx="14" ry="8" fill="${colore}"/>
    <ellipse cx="40" cy="26" rx="10" ry="5" fill="${colore}cc"/>
    ${lucente?`<ellipse cx="37" cy="24" rx="4" ry="2" fill="white" opacity="0.3"/>`:''}
    <!-- Bandiera scacchi -->
    ${lucente?`<text x="40" y="52" text-anchor="middle" font-size="12">🏁</text>`:'<text x="40" y="52" text-anchor="middle" font-size="10" fill="white">F1</text>'}
    <text x="40" y="96" text-anchor="middle" font-family="'Bebas Neue',sans-serif" font-size="8" fill="${colore}">${anno}</text>
    </g>
  </svg>`;
}

function disegnaCoglioni(w,h,anno){
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:70px;height:90px">
    <!-- Trofeo clown -->
    <!-- Base storta -->
    <rect x="20" y="82" width="40" height="5" rx="2" fill="#888" transform="rotate(-3,40,84)"/>
    <rect x="25" y="76" width="30" height="7" rx="1" fill="#66666688" transform="rotate(2,40,79)"/>
    <!-- Corpo storto e brutto -->
    <path d="M28,32 Q18,50 22,68 L58,68 Q62,50 52,32 Z" fill="#888" transform="rotate(-2,40,50)"/>
    <!-- Naso da clown -->
    <circle cx="40" cy="50" r="6" fill="#FF4444"/>
    <!-- Occhi da clown -->
    <circle cx="33" cy="43" r="3" fill="white"/>
    <circle cx="47" cy="43" r="3" fill="white"/>
    <circle cx="34" cy="44" r="1.5" fill="black"/>
    <circle cx="48" cy="44" r="1.5" fill="black"/>
    <!-- Cappello da clown in cima -->
    <path d="M30,32 L40,10 L50,32 Z" fill="#FF4444"/>
    <rect x="25" y="30" width="30" height="4" rx="2" fill="#FFD700"/>
    <!-- Fiore che spara acqua -->
    <circle cx="55" cy="38" r="5" fill="#FF69B4" stroke="#FF1493" stroke-width="1"/>
    <text x="55" y="42" text-anchor="middle" font-size="7">💧</text>
    <!-- Anno -->
    <text x="40" y="96" text-anchor="middle" font-family="'Bebas Neue',sans-serif" font-size="8" fill="#888">${anno}</text>
  </svg>`;
}

function disegnaCoppaItalia(w,h,anno,glow,lucente){
  const colore=lucente?'#4CAF50':'#388E3C';
  const filt=glow?`<filter id="glowCI"><feGaussianBlur stdDeviation="1.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`:'';
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:70px;height:90px">
    ${filt}
    <g filter="${glow?'url(#glowCI)':''}">
    <rect x="22" y="82" width="36" height="5" rx="2" fill="${colore}"/>
    <rect x="27" y="76" width="26" height="7" rx="1" fill="${colore}88"/>
    <!-- Corpo con tricolore -->
    <path d="M30,32 Q20,46 24,68 L56,68 Q60,46 50,32 Z" fill="${colore}"/>
    <!-- Fascia tricolore -->
    <path d="M30,48 Q40,46 50,48 L50,55 Q40,53 30,55 Z" fill="#009246"/>
    <path d="M30,55 Q40,53 50,55 L50,60 Q40,58 30,60 Z" fill="white"/>
    <path d="M30,60 Q40,58 50,60 L50,65 Q40,63 30,65 Z" fill="#CE2B37"/>
    <!-- Apertura -->
    <ellipse cx="40" cy="32" rx="11" ry="3.5" fill="${colore}cc"/>
    <!-- Manici -->
    <path d="M30,40 Q17,42 19,54 Q22,60 24,58" fill="none" stroke="${colore}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M50,40 Q63,42 61,54 Q58,60 56,58" fill="none" stroke="${colore}" stroke-width="2.5" stroke-linecap="round"/>
    ${lucente?`<circle cx="36" cy="44" r="1.5" fill="white" opacity="0.5"/>`:''}
    <text x="40" y="96" text-anchor="middle" font-family="'Bebas Neue',sans-serif" font-size="8" fill="${colore}">${anno}</text>
    </g>
  </svg>`;
}

function disegnaGenerico(w,h,anno,tipo,glow,lucente){
  // Valore base per determinare il colore
  const valori={
    'coopmeiners':['#9C27B0',lucente?'#CE93D8':'#9C27B0'],
    'talent_boy':['#2196F3',lucente?'#90CAF9':'#2196F3'],
    'coppa_eroi':['#FF9800',lucente?'#FFCC80':'#FF9800'],
    'coppa_tua':['#00BCD4',lucente?'#80DEEA':'#00BCD4'],
    'konami':['#3F51B5',lucente?'#9FA8DA':'#3F51B5'],
    'coppa_crediti':['#009688',lucente?'#80CBC4':'#009688'],
    'pedretti':['#FF5722',lucente?'#FFAB91':'#FF5722'],
  };
  const [coloreBase,colore]=valori[tipo]||['#607D8B','#90A4AE'];
  const filt=glow?`<filter id="glowG"><feGaussianBlur stdDeviation="1.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`:'';
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:70px;height:90px">
    ${filt}
    <g filter="${glow?'url(#glowG)':''}">
    <rect x="24" y="82" width="32" height="5" rx="2" fill="${colore}"/>
    <rect x="29" y="76" width="22" height="7" rx="1" fill="${colore}88"/>
    <path d="M32,34 Q23,48 26,68 L54,68 Q57,48 48,34 Z" fill="${colore}"/>
    <path d="M32,38 Q20,40 21,52 Q23,58 26,56" fill="none" stroke="${colore}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M48,38 Q60,40 59,52 Q57,58 54,56" fill="none" stroke="${colore}" stroke-width="2.5" stroke-linecap="round"/>
    <ellipse cx="40" cy="34" rx="10" ry="3" fill="${colore}cc"/>
    ${lucente?`<circle cx="35" cy="50" r="1.5" fill="white" opacity="0.5"/>`:''}
    <text x="40" y="96" text-anchor="middle" font-family="'Bebas Neue',sans-serif" font-size="8" fill="${colore}">${anno}</text>
    </g>
  </svg>`;
}

// Mappa tipo trofeo -> funzione SVG
// getTipoTrofeo ora vive in utils.js (carica sempre per primo).

// Mostra il dettaglio di un trofeo: anni vinti, conteggio, foto grande
function apriDettaglioTrofeo(sqId,compId,posto){
  const sq=squadreDB.find(s=>String(s.id)===String(sqId));
  if(!sq) return;
  const trofei=(sq.trofei||[]).filter(t=>t.compId===compId&&(compId!=='campionato'||(t.posto||1)===posto));
  if(!trofei.length) return;
  const comp=competizioni.find(c=>c.id===compId);
  const anni=trofei.map(t=>t.anno).sort().reverse();
  let tipoImg=getTipoTrofeo(compId);
  if(compId==='campionato'){
    tipoImg=posto===2?'campionato_2':posto===3?'campionato_3':'campionato_1';
  }
  const url=(typeof IMMAGINI_TROFEI!=='undefined')?IMMAGINI_TROFEI[tipoImg]:null;
  const nomePosto=compId==='campionato'?(posto===2?' — 2° posto':posto===3?' — 3° posto':' — 1° posto'):'';

  document.getElementById('modal-dettaglio-trofeo')?.remove();
  const modal=document.createElement('div');
  modal.className='modal-overlay open';
  modal.id='modal-dettaglio-trofeo';
  modal.onclick=(e)=>{if(e.target===modal) modal.remove();};
  modal.innerHTML=`
    <div class="modal" style="max-width:380px;text-align:center">
      <div class="modal-header">
        <div class="modal-title" style="color:var(--oro)">${comp?comp.nome:compId}${nomePosto}</div>
        <button class="modal-close" onclick="document.getElementById('modal-dettaglio-trofeo').remove()">×</button>
      </div>
      <div style="padding:24px">
        ${url?`<img src="${url}" style="max-width:160px;max-height:160px;object-fit:contain;margin:0 auto 16px;display:block;filter:drop-shadow(0 0 10px rgba(255,215,0,0.3))">`:''}
        <div style="font-family:'Bebas Neue',sans-serif;font-size:28px;color:var(--oro);letter-spacing:1px">${trofei.length} ${trofei.length===1?'VITTORIA':'VITTORIE'}</div>
        <div style="font-size:12px;color:var(--testo-dim);margin-top:12px">Vinto in:</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:8px">
          ${anni.map(a=>`<span style="background:var(--grigio-scuro);border:1px solid var(--grigio-chiaro);border-radius:6px;padding:4px 10px;font-size:12px;font-family:'Space Mono',monospace">${a}</span>`).join('')}
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

let museoStagioneAttiva={}; // sqId -> stagione selezionata, oppure 'tutte'

function renderMuseoStadio(sq){
  const trofeiTutti=sq.trofei||[];
  const capienza=sq.capienza_stadio||10000;
  const livelloMuseo=Math.floor((capienza-10000)/10000); // 0-7
  const bonusMuseo=getBonusMuseo(capienza);

  if(museoStagioneAttiva[sq.id]===undefined) museoStagioneAttiva[sq.id]='tutte';
  const stagioneSel=museoStagioneAttiva[sq.id];
  const stagioniDisponibili=[...new Set(trofeiTutti.map(t=>t.anno))].sort((a,b)=>a-b);
  const trofei=stagioneSel==='tutte'?trofeiTutti:trofeiTutti.filter(t=>String(t.anno)===String(stagioneSel));

  // Raggruppa per competizione (+posto per il campionato, che ha 1°/2°/3°)
  const gruppi={};
  trofei.forEach(t=>{
    const chiave=t.compId+(t.compId==='campionato'?'_'+(t.posto||1):'');
    if(!gruppi[chiave]) gruppi[chiave]=[];
    gruppi[chiave].push(t);
  });
  const gruppiOrdinati=Object.entries(gruppi).sort((a,b)=>b[1].length-a[1].length);

  const museoSfondoColori=[
    'linear-gradient(135deg,#1a1a1a,#2a2a2a)',
    'linear-gradient(135deg,#1a1a2a,#2a2a3a)',
    'linear-gradient(135deg,#1a2a1a,#2a3a2a)',
    'linear-gradient(135deg,#1a1a3a,#2a2a4a)',
    'linear-gradient(135deg,#0a1a2a,#1a2a3a)',
    'linear-gradient(135deg,#0a0a2a,#1a1a4a)',
    'linear-gradient(135deg,#0a0a1a,#1a1a3a)',
    'linear-gradient(135deg,#000010,#0a0a20)',
  ];
  const museoSfondo=museoSfondoColori[livelloMuseo]||museoSfondoColori[0];
  const coloreAccento=livelloMuseo>=5?'#FFD700':livelloMuseo>=3?'#DAA520':'#888';

  const museoNomi=['Magazzino Polveroso','Sala Trofei','Galleria Trofei','Sala d\'Onore','Hall of Fame','Galleria d\'Elite','Pantheon','Tempio dei Campioni'];
  const museoNome=museoNomi[livelloMuseo]||museoNomi[0];
  const museoEmoji=['🧰','🏠','🏡','🏛️','🏛️','🌟','💎','⭐'][livelloMuseo]||'🧰';

  return `
    <div style="background:${museoSfondo};border:1px solid ${livelloMuseo>=5?'rgba(255,215,0,0.5)':livelloMuseo>=3?'rgba(255,215,0,0.2)':'rgba(255,255,255,0.1)'};border-radius:12px;padding:16px;margin-bottom:16px">

      <!-- INTESTAZIONE -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:19px;color:${coloreAccento};letter-spacing:1px">${museoEmoji} ${museoNome}</div>
          <div style="font-size:11px;color:var(--testo-dim);margin-top:2px">Livello museo ${livelloMuseo+1} di 8</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:20px;color:${trofeiTutti.length>0?coloreAccento:'var(--testo-dim)'}">${trofeiTutti.length}</div>
          <div style="font-size:10px;color:var(--testo-dim)">TROFE${trofeiTutti.length===1?'O':'I'} TOTALI</div>
        </div>
      </div>

      <!-- BARRA LIVELLO + BONUS -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
        <div style="flex:1;height:5px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden">
          <div style="width:${((livelloMuseo+1)/8*100).toFixed(0)}%;height:100%;background:${coloreAccento};border-radius:3px"></div>
        </div>
        <div style="font-size:11px;color:${bonusMuseo>0?'var(--verde)':'var(--testo-dim)'};white-space:nowrap;flex-shrink:0">💰 Rendita +${bonusMuseo}%</div>
      </div>

      <!-- SELETTORE STAGIONE -->
      <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:14px;background:rgba(0,0,0,0.2);border-radius:8px;padding:6px">
        <button onclick="cambiaStagioneMuseo('${sq.id}',-1)" style="background:none;border:none;color:${coloreAccento};font-size:16px;cursor:pointer;padding:2px 8px">‹</button>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:13px;color:${coloreAccento};letter-spacing:1px;min-width:130px;text-align:center">
          ${stagioneSel==='tutte'?'🗓️ TUTTE LE STAGIONI':'📅 STAGIONE '+stagioneSel}
        </div>
        <button onclick="cambiaStagioneMuseo('${sq.id}',1)" style="background:none;border:none;color:${coloreAccento};font-size:16px;cursor:pointer;padding:2px 8px">›</button>
      </div>

      ${trofei.length===0?`
      <div style="text-align:center;padding:28px 10px;color:${livelloMuseo>=2?'#666':'#444'}">
        <div style="font-size:32px;margin-bottom:8px">${livelloMuseo>=2?'📭':'🕸️'}</div>
        <div style="font-size:13px">${stagioneSel==='tutte'?'Nessun trofeo ancora vinto':'Nessun trofeo in questa stagione'}</div>
        ${stagioneSel==='tutte'?'<div style="font-size:11px;margin-top:4px;color:#555">Vinci una competizione per iniziare la collezione</div>':''}
      </div>`:`
      <!-- STRISCIA ORIZZONTALE SCORREVOLE -->
      <div style="position:relative">
        <button onclick="scrollMuseo('${sq.id}',-1)" style="position:absolute;left:-2px;top:50%;transform:translateY(-50%);z-index:2;background:rgba(0,0,0,0.65);border:1px solid rgba(255,255,255,0.2);color:#fff;width:26px;height:26px;border-radius:50%;cursor:pointer;font-size:14px;line-height:1">‹</button>
        <div id="museo-scroll-${sq.id}" style="display:flex;gap:10px;overflow-x:auto;scroll-behavior:smooth;padding:2px 32px;scrollbar-width:none">
          ${gruppiOrdinati.map(([chiave,arr])=>{
            const compId=arr[0].compId;
            const posto=arr[0].posto||1;
            const comp=competizioni.find(c=>c.id===compId);
            let tipoSvg=getTipoTrofeo(compId);
            if(compId==='campionato'){
              tipoSvg=posto===2?'campionato_2':posto===3?'campionato_3':'campionato_1';
            }
            const ultimoAnno=arr[arr.length-1].anno;
            const postoLabel=compId==='campionato'&&posto!==1?` (${posto}°)`:'';
            return `<div onclick="apriDettaglioTrofeo('${sq.id}','${compId}',${posto})" style="cursor:pointer;flex-shrink:0;width:86px;text-align:center;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:8px;position:relative;${livelloMuseo>=5?'box-shadow:0 0 8px rgba(255,215,0,0.12)':''}">
              ${disegnaCoppa(tipoSvg,ultimoAnno,livelloMuseo)}
              ${arr.length>1?`<div style="position:absolute;top:3px;right:3px;background:var(--oro);color:#000;font-size:9px;font-weight:700;border-radius:10px;padding:1px 5px">×${arr.length}</div>`:''}
              <div style="font-size:10px;color:var(--testo-dim);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${comp?comp.nome:compId}${postoLabel}</div>
              <div style="font-size:9px;color:#666">${ultimoAnno}</div>
            </div>`;
          }).join('')}
        </div>
        <button onclick="scrollMuseo('${sq.id}',1)" style="position:absolute;right:-2px;top:50%;transform:translateY(-50%);z-index:2;background:rgba(0,0,0,0.65);border:1px solid rgba(255,255,255,0.2);color:#fff;width:26px;height:26px;border-radius:50%;cursor:pointer;font-size:14px;line-height:1">›</button>
      </div>
      `}

      ${adminLoggato?`<button onclick="apriModificaTrofei('${sq.id}')" style="width:100%;margin-top:14px;padding:9px;border-radius:8px;border:1px solid rgba(255,215,0,0.3);background:rgba(255,215,0,0.05);color:rgba(255,215,0,0.7);font-family:'Bebas Neue',sans-serif;font-size:13px;cursor:pointer;letter-spacing:1px">✏️ MODIFICA TROFEI</button>`:''}
    </div>
  `;
}

function cambiaStagioneMuseo(sqId,dir){
  const sq=squadreDB.find(s=>s.id===sqId);
  if(!sq) return;
  const trofeiTutti=sq.trofei||[];
  const stagioni=[...new Set(trofeiTutti.map(t=>t.anno))].sort((a,b)=>a-b);
  const opzioni=['tutte',...stagioni];
  let idx=opzioni.indexOf(museoStagioneAttiva[sqId]!==undefined?museoStagioneAttiva[sqId]:'tutte');
  if(idx===-1) idx=0;
  idx=(idx+dir+opzioni.length)%opzioni.length;
  museoStagioneAttiva[sqId]=opzioni[idx];
  const acc=document.getElementById('acc-museo');
  if(acc) acc.innerHTML=renderMuseoStadio(sq);
}

function scrollMuseo(sqId,dir){
  const el=document.getElementById(`museo-scroll-${sqId}`);
  if(el) el.scrollBy({left:dir*200,behavior:'smooth'});
}
