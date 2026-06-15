// ===== COMPETIZIONI =====

let compClassifiche = [];
let compGironi = [];
let compPartite = [];
let compAttiva = 'campionato';
const STAGIONE_COMP = '2024/25';

const COMP_CONFIG = {
  campionato:    { nome: 'Campionato',      icon: '🏆', tipo: 'campionato', haClassifica: true,  haGironi: false, haTabellone: false },
  champions:     { nome: 'Champions League',icon: '⭐', tipo: 'coppa',      haClassifica: false, haGironi: true,  haTabellone: true  },
  europa:        { nome: 'Europa League',   icon: '🌍', tipo: 'coppa',      haClassifica: false, haGironi: true,  haTabellone: true  },
  coppa_italia:  { nome: 'Coppa Italia',    icon: '🇮🇹', tipo: 'coppa',     haClassifica: false, haGironi: true,  haTabellone: true  },
  coppa_tua:     { nome: 'Coppa Tua',       icon: '🏅', tipo: 'coppa',      haClassifica: false, haGironi: true,  haTabellone: true  },
  formula1:      { nome: 'Formula 1',       icon: '🏎️', tipo: 'speciale',   haClassifica: true,  haGironi: false, haTabellone: false },
  coopmeiners:   { nome: 'Coopmeiners',     icon: '⚡', tipo: 'speciale',   haClassifica: true,  haGironi: false, haTabellone: false },
  eroi:          { nome: 'Coppa degli Eroi',icon: '🦸', tipo: 'speciale',   haClassifica: true,  haGironi: false, haTabellone: false },
  konami:        { nome: 'Coppa Konami',    icon: '🎮', tipo: 'speciale',   haClassifica: true,  haGironi: false, haTabellone: false },
  pedretti:      { nome: 'Coppa Pedretti',  icon: '❄️', tipo: 'speciale',   haClassifica: true,  haGironi: false, haTabellone: false },
  crediti:       { nome: 'Coppa Crediti',   icon: '💰', tipo: 'speciale',   haClassifica: true,  haGironi: false, haTabellone: false },
  talent:        { nome: 'Talent Boy',      icon: '🌟', tipo: 'speciale',   haClassifica: true,  haGironi: false, haTabellone: false },
  coglioni:      { nome: 'Coppa dei Coglioni', icon: '🤡', tipo: 'speciale', haClassifica: true, haGironi: false, haTabellone: false },
};

// ===== CARICA DATI =====
async function caricaCompetizioni() {
  try {
    const [{ data: cl }, { data: gi }, { data: pa }] = await Promise.all([
      sb.from('comp_classifiche').select('*').eq('stagione', STAGIONE_COMP),
      sb.from('comp_gironi').select('*').eq('stagione', STAGIONE_COMP),
      sb.from('comp_partite').select('*').eq('stagione', STAGIONE_COMP)
    ]);
    compClassifiche = cl || [];
    compGironi = gi || [];
    compPartite = pa || [];
  } catch(e) {
    console.error('Errore caricamento competizioni:', e);
  }
}

// ===== RENDER PRINCIPALE =====
async function renderCompetizioni() {
  const container = document.getElementById('comp-grid');
  if (!container) return;
  container.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Caricamento...</div>';
  await caricaCompetizioni();
  renderCompLayout();
}

function renderCompLayout() {
  const container = document.getElementById('comp-grid');

  const keys = Object.keys(COMP_CONFIG);
  const idxAttivo = keys.indexOf(compAttiva);
  const cfg = COMP_CONFIG[compAttiva];
  const prevKey = idxAttivo > 0 ? keys[idxAttivo-1] : keys[keys.length-1];
  const nextKey = idxAttivo < keys.length-1 ? keys[idxAttivo+1] : keys[0];
  const prevCfg = COMP_CONFIG[prevKey];
  const nextCfg = COMP_CONFIG[nextKey];

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px">
      <div>
        <div class="page-title">🏆 COMPETIZIONI</div>
        <div class="page-sub">Stagione ${STAGIONE_COMP}</div>
      </div>
      ${adminLoggato ? `<button onclick="apriAdminComp()" style="background:var(--oro);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:1px;padding:10px 20px;border-radius:8px;border:none;cursor:pointer">⚙️ ADMIN</button>` : ''}
    </div>

    <!-- Navigazione con frecce -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
      <button onclick="selezionaComp('${prevKey}')" style="background:var(--grigio-scuro);border:1px solid var(--grigio-chiaro);border-radius:10px;padding:10px 14px;color:var(--testo);cursor:pointer;font-size:18px;flex-shrink:0">‹</button>
      <div style="flex:1;background:var(--grigio-scuro);border:1px solid rgba(255,215,0,0.3);border-radius:12px;padding:12px 16px;text-align:center">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:22px;color:var(--oro);letter-spacing:2px">${cfg.icon} ${cfg.nome}</div>
        <div style="font-size:11px;color:var(--testo-dim);margin-top:2px">${idxAttivo+1} / ${keys.length}</div>
      </div>
      <button onclick="selezionaComp('${nextKey}')" style="background:var(--grigio-scuro);border:1px solid var(--grigio-chiaro);border-radius:10px;padding:10px 14px;color:var(--testo);cursor:pointer;font-size:18px;flex-shrink:0">›</button>
    </div>

    <!-- Contenuto competizione selezionata -->
    <div id="comp-dettaglio"></div>
  `;

  renderDettaglioComp(compAttiva);
}

function selezionaComp(key) {
  compAttiva = key;
  renderCompLayout();
}

// ===== RENDER DETTAGLIO =====
function renderDettaglioComp(key) {
  const container = document.getElementById('comp-dettaglio');
  if (!container) return;
  const cfg = COMP_CONFIG[key];
  if (!cfg) return;

  if (cfg.haGironi) {
    renderDettaglioCoppa(key, cfg, container);
  } else {
    renderDettaglioClassifica(key, cfg, container);
  }
}

// CLASSIFICA (campionato, F1, ecc.)
function renderDettaglioClassifica(key, cfg, container) {
  const cl = compClassifiche
    .filter(c => c.competizione === key)
    .sort((a, b) => (a.posizione || 99) - (b.posizione || 99) || b.punti - a.punti);

  const premi = getPremi(key);

  let html = `
    <div style="background:linear-gradient(135deg,rgba(255,215,0,0.06),rgba(0,0,0,0));border:1px solid rgba(255,215,0,0.2);border-radius:14px;overflow:hidden;margin-bottom:16px">
      <div style="padding:14px 16px;border-bottom:1px solid rgba(255,215,0,0.15);display:flex;align-items:center;gap:10px">
        <div style="font-size:24px">${cfg.icon}</div>
        <div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:2px;color:var(--oro)">${cfg.nome}</div>
          <div style="font-size:11px;color:var(--testo-dim)">${getDescrizioneComp(key)}</div>
        </div>
      </div>`;

  if (cl.length === 0) {
    html += `<div style="padding:30px;text-align:center;color:var(--testo-dim)">📋 Classifica non ancora disponibile</div>`;
  } else {
    html += `
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;min-width:320px">
          <thead>
            <tr style="font-size:10px;color:var(--testo-dim);text-transform:uppercase;letter-spacing:1px">
              <th style="padding:10px 16px;text-align:left;font-weight:600">#</th>
              <th style="padding:10px 8px;text-align:left;font-weight:600">Squadra</th>
              <th style="padding:10px 8px;text-align:center;font-weight:600">G</th>
              <th style="padding:10px 8px;text-align:center;font-weight:600">V</th>
              <th style="padding:10px 8px;text-align:center;font-weight:600">P</th>
              <th style="padding:10px 8px;text-align:center;font-weight:600">S</th>
              <th style="padding:10px 16px;text-align:center;font-weight:600">PTS</th>
              ${key !== 'campionato' ? '<th style="padding:10px 16px;text-align:right;font-weight:600">FM</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${cl.map((r, i) => {
              const sq = squadreDB.find(s => s.id === r.squadra_id);
              if (!sq) return '';
              const pos = r.posizione || (i + 1);
              const rankCol = pos===1?'var(--oro)':pos===2?'var(--argento)':pos===3?'#cd7f32':'var(--testo-dim)';
              const premio = premi[pos] || null;
              const bgRow = r.eliminato ? 'rgba(255,68,68,0.05)' : i%2===0 ? 'transparent' : 'rgba(255,255,255,0.02)';
              return `
                <tr style="background:${bgRow};border-bottom:1px solid rgba(255,255,255,0.04)${r.eliminato?';opacity:0.5':''}">
                  <td style="padding:12px 16px">
                    <span style="font-family:'Space Mono',monospace;font-size:15px;font-weight:700;color:${rankCol}">${pos}</span>
                  </td>
                  <td style="padding:12px 8px">
                    <div style="display:flex;align-items:center;gap:8px">
                      ${sq.logo_url ? `<img src="${sq.logo_url}" style="width:24px;height:24px;object-fit:contain;border-radius:4px">` : `<div style="width:24px;height:24px;border-radius:4px;background:${sq.avatar_bg||'#333'};display:flex;align-items:center;justify-content:center;font-size:11px">${sq.avatar||'⚽'}</div>`}
                      <span style="font-size:13px;font-weight:600${r.eliminato?';text-decoration:line-through':''}">${sq.nome}</span>
                    </div>
                  </td>
                  <td style="padding:12px 8px;text-align:center;font-size:13px;color:var(--testo-dim)">${r.giocate||0}</td>
                  <td style="padding:12px 8px;text-align:center;font-size:13px;color:var(--verde)">${r.vittorie||0}</td>
                  <td style="padding:12px 8px;text-align:center;font-size:13px;color:var(--testo-dim)">${r.pareggi||0}</td>
                  <td style="padding:12px 8px;text-align:center;font-size:13px;color:var(--rosso)">${r.sconfitte||0}</td>
                  <td style="padding:12px 16px;text-align:center">
                    <span style="font-family:'Space Mono',monospace;font-size:16px;font-weight:700;color:var(--testo)">${r.punti||0}</span>
                  </td>
                  ${key !== 'campionato' ? `<td style="padding:12px 16px;text-align:right;font-size:12px;color:var(--oro)">${premio ? premio : '—'}</td>` : ''}
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  }

  // Premi
  html += renderPremiBox(key);
  html += `</div>`;
  container.innerHTML = html;
}

// COPPA CON GIRONI
function renderDettaglioCoppa(key, cfg, container) {
  const gironi = compGironi.filter(g => g.competizione === key);
  const partite = compPartite.filter(p => p.competizione === key);

  let html = `
    <div style="background:linear-gradient(135deg,rgba(255,215,0,0.06),rgba(0,0,0,0));border:1px solid rgba(255,215,0,0.2);border-radius:14px;overflow:hidden;margin-bottom:16px">
      <div style="padding:14px 16px;border-bottom:1px solid rgba(255,215,0,0.15);display:flex;align-items:center;gap:10px">
        <div style="font-size:24px">${cfg.icon}</div>
        <div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:2px;color:var(--oro)">${cfg.nome}</div>
          <div style="font-size:11px;color:var(--testo-dim)">${getDescrizioneComp(key)}</div>
        </div>
      </div>`;

  if (gironi.length === 0) {
    html += `<div style="padding:30px;text-align:center;color:var(--testo-dim)">📋 Gironi non ancora creati${adminLoggato ? ' — clicca ADMIN per crearli' : ''}</div>`;
  } else {
    // Tab fasi
    html += `
      <div style="display:flex;gap:0;border-bottom:1px solid var(--grigio-chiaro)">
        <button onclick="switchFaseCoppa('gironi','${key}')" id="fase-gironi-${key}" style="flex:1;padding:10px;background:var(--oro);color:var(--nero);border:none;font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;cursor:pointer">GIRONI</button>
        <button onclick="switchFaseCoppa('finale','${key}')" id="fase-finale-${key}" style="flex:1;padding:10px;background:var(--grigio-scuro);color:var(--testo);border:none;font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;cursor:pointer;border-left:1px solid var(--grigio-chiaro)">FASI FINALI</button>
      </div>
      <div id="fase-content-${key}" style="padding:16px">`;

    // Gironi
    html += gironi.map(g => {
      const sqIds = g.squadre_ids || [];
      const partiteGirone = partite.filter(p => p.girone === g.nome_girone);

      // Calcola mini classifica girone
      const miniCl = sqIds.map(sqId => {
        const sq = squadreDB.find(s => s.id === sqId);
        let v=0,pa=0,sc=0,pt=0;
        partiteGirone.filter(p => p.giocata).forEach(p => {
          if (p.squadra_casa_id===sqId || p.squadra_ospite_id===sqId) {
            const casa = p.squadra_casa_id===sqId;
            const pcasa = p.punti_casa||0, posp = p.punti_ospite||0;
            const mio = casa?pcasa:posp, avv = casa?posp:pcasa;
            if (mio>avv) {v++;pt+=3;} else if (mio===avv) {pa++;pt+=1;} else {sc++;}
          }
        });
        return { sq, v, pa, sc, pt, giocate: v+pa+sc };
      }).sort((a,b) => b.pt-a.pt);

      return `
        <div style="margin-bottom:20px">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--oro);letter-spacing:2px;margin-bottom:10px">GIRONE ${g.nome_girone}</div>
          <div style="background:var(--grigio-scuro);border-radius:10px;overflow:hidden;margin-bottom:10px">
            <table style="width:100%;border-collapse:collapse">
              <thead><tr style="font-size:10px;color:var(--testo-dim);text-transform:uppercase">
                <th style="padding:8px 12px;text-align:left">#</th>
                <th style="padding:8px 4px;text-align:left">Squadra</th>
                <th style="padding:8px 4px;text-align:center">G</th>
                <th style="padding:8px 4px;text-align:center">V</th>
                <th style="padding:8px 4px;text-align:center">P</th>
                <th style="padding:8px 4px;text-align:center">S</th>
                <th style="padding:8px 12px;text-align:center">PT</th>
              </tr></thead>
              <tbody>
                ${miniCl.map((r,i) => {
                  if (!r.sq) return '';
                  const qualify = i < getQualificate(key);
                  return `
                    <tr style="border-top:1px solid rgba(255,255,255,0.05);background:${qualify?'rgba(255,215,0,0.04)':'transparent'}">
                      <td style="padding:10px 12px"><span style="font-family:'Space Mono',monospace;font-size:13px;font-weight:700;color:${qualify?'var(--oro)':'var(--testo-dim)'}">${i+1}</span></td>
                      <td style="padding:10px 4px">
                        <div style="display:flex;align-items:center;gap:6px">
                          ${r.sq.logo_url?`<img src="${r.sq.logo_url}" style="width:20px;height:20px;object-fit:contain;border-radius:3px">`:`<div style="width:20px;height:20px;border-radius:3px;background:${r.sq.avatar_bg||'#333'};display:flex;align-items:center;justify-content:center;font-size:9px">${r.sq.avatar||'⚽'}</div>`}
                          <span style="font-size:12px;font-weight:600">${r.sq.nome}</span>
                          ${qualify?'<span style="font-size:9px;color:var(--oro);margin-left:2px">✓</span>':''}
                        </div>
                      </td>
                      <td style="padding:10px 4px;text-align:center;font-size:12px;color:var(--testo-dim)">${r.giocate}</td>
                      <td style="padding:10px 4px;text-align:center;font-size:12px;color:var(--verde)">${r.v}</td>
                      <td style="padding:10px 4px;text-align:center;font-size:12px;color:var(--testo-dim)">${r.pa}</td>
                      <td style="padding:10px 4px;text-align:center;font-size:12px;color:var(--rosso)">${r.sc}</td>
                      <td style="padding:10px 12px;text-align:center"><span style="font-family:'Space Mono',monospace;font-size:14px;font-weight:700">${r.pt}</span></td>
                    </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
          <!-- Partite girone -->
          ${renderPartiteGirone(partiteGirone, sqIds)}
        </div>`;
    }).join('');

    html += `</div>`; // fine fase-content
  }

  html += renderPremiBox(key);
  html += `</div>`;
  container.innerHTML = html;
}

function renderPartiteGirone(partite, sqIds) {
  if (partite.length === 0) return `<div style="font-size:12px;color:var(--testo-dim);padding:8px 0">Nessuna partita inserita</div>`;
  return `
    <div style="display:flex;flex-direction:column;gap:6px">
      ${partite.map(p => {
        const casa = squadreDB.find(s => s.id===p.squadra_casa_id);
        const osp = squadreDB.find(s => s.id===p.squadra_ospite_id);
        if (!casa||!osp) return '';
        const giocata = p.giocata;
        const pc = p.punti_casa, po = p.punti_ospite;
        return `
          <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;padding:10px 12px;background:var(--grigio-scuro);border-radius:8px">
            <div style="display:flex;align-items:center;gap:6px;justify-content:flex-end">
              <span style="font-size:12px;font-weight:600;text-align:right">${casa.nome}</span>
              ${casa.logo_url?`<img src="${casa.logo_url}" style="width:20px;height:20px;object-fit:contain;border-radius:3px">`:''}
            </div>
            <div style="text-align:center;min-width:70px">
              ${giocata
                ? `<span style="font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:var(--oro)">${pc} — ${po}</span>`
                : `<span style="font-size:11px;color:var(--testo-dim)">vs</span>`}
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              ${osp.logo_url?`<img src="${osp.logo_url}" style="width:20px;height:20px;object-fit:contain;border-radius:3px">`:''}
              <span style="font-size:12px;font-weight:600">${osp.nome}</span>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

function switchFaseCoppa(fase, key) {
  const btns = [`fase-gironi-${key}`, `fase-finale-${key}`];
  btns.forEach(id => {
    const b = document.getElementById(id);
    if (b) { b.style.background='var(--grigio-scuro)'; b.style.color='var(--testo)'; }
  });
  const attivo = document.getElementById(`fase-${fase}-${key}`);
  if (attivo) { attivo.style.background='var(--oro)'; attivo.style.color='var(--nero)'; }

  const content = document.getElementById(`fase-content-${key}`);
  if (!content) return;

  if (fase==='gironi') {
    const gironi = compGironi.filter(g => g.competizione===key);
    const partite = compPartite.filter(p => p.competizione===key && p.fase==='gironi');
    content.innerHTML = gironi.map(g => {
      const sqIds = g.squadre_ids||[];
      const partiteGirone = partite.filter(p => p.girone===g.nome_girone);
      return `<div style="margin-bottom:20px"><div style="font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--oro);letter-spacing:2px;margin-bottom:10px">GIRONE ${g.nome_girone}</div>${renderPartiteGirone(partiteGirone, sqIds)}</div>`;
    }).join('');
  } else {
    // Fasi finali
    const fasiFinali = ['semifinale','finale'];
    const partiteFin = compPartite.filter(p => p.competizione===key && fasiFinali.includes(p.fase));
    if (partiteFin.length===0) {
      content.innerHTML = `<div style="text-align:center;padding:20px;color:var(--testo-dim)">Fasi finali non ancora disponibili</div>`;
    } else {
      content.innerHTML = fasiFinali.map(fase => {
        const pp = partiteFin.filter(p => p.fase===fase);
        if (pp.length===0) return '';
        return `<div style="margin-bottom:16px"><div style="font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--oro);letter-spacing:1px;margin-bottom:8px;text-transform:uppercase">${fase}</div>${renderPartiteGirone(pp,[])}</div>`;
      }).join('');
    }
  }
}

// ===== HELPERS =====
function getQualificate(key) {
  const map = { champions:1, europa:1, coppa_italia:2, coppa_tua:2 };
  return map[key] || 1;
}

function getDescrizioneComp(key) {
  const map = {
    campionato: '38 giornate • Vittoria 3pt • Pareggio 1pt • Sconfitta 0pt',
    champions: 'Riservata alle prime 6 della stagione precedente',
    europa: 'Riservata alle ultime 6 della stagione precedente',
    coppa_italia: '2 gironi da 6 • Passano le prime 4 per girone',
    coppa_tua: 'Gironi da 6 • Passano le prime 2 per girone',
    formula1: 'Giornate 15-25 • Punti F1 (25-18-12-10-8-6-4-3-2-1)',
    coopmeiners: 'Dal giornata 4 • Chi fa meno punti viene eliminato',
    eroi: 'Giornate 21-31 • Battle Royale • V=3pt P=1pt S=0pt',
    konami: 'Girone di ritorno (giornate 20-38)',
    pedretti: 'Campione d\'inverno • Giornata 19',
    crediti: 'Somma punti giornate 1-10',
    talent: 'Solo giocatori under 23',
    coglioni: 'Vince chi fa il punteggio più basso in assoluto'
  };
  return map[key] || '';
}

function getPremi(key) {
  const map = {
    campionato: {
      1:"900u20ac + 30M FM", 2:"600u20ac + 27M FM", 3:"320u20ac + 24M FM", 4:"150u20ac + 20M FM",
      5:"18M FM", 6:"16M FM", 7:"13M FM", 8:"12M FM",
      9:"11M FM", 10:"10M FM", 11:"9M FM", 12:"8M FM"
    },
    champions:  { 1:"15M FM + 40u20ac", 2:"8M FM", "Semifinale":"8M FM", "Gironi":"5M FM", "Qualif.":"5M FM" },
    europa:     { 1:"9M FM + 25u20ac", 2:"4.5M FM", "Semifinale":"6M FM", "Gironi":"4M FM" },
    coppa_italia: { 1:"3M FM + 20u20ac", 2:"1M FM", "Semifinale":"2M FM", "Quarti":"1.5M FM", "Gironi":"0.5M FM" },
    formula1:   { 1:"13M FM + 45u20ac", 2:"11M FM", 3:"10M FM", 4:"9M FM", 5:"8M FM", 6:"7M FM", 7:"6M FM", 8:"5M FM", 9:"4M FM", 10:"3M FM", 11:"2M FM", 12:"1M FM" },
    coopmeiners:{ 1:"13M FM + 30u20ac", 2:"11M FM", 3:"10M FM", 4:"9M FM", 5:"8M FM", 6:"7M FM", 7:"6M FM", 8:"5M FM", 9:"4M FM", 10:"3M FM", 11:"2M FM", 12:"1M FM" },
    eroi:       { 1:"20M FM", 2:"13M FM", 3:"10M FM", 4:"8M FM", 5:"7M FM", 6:"6M FM", 7:"5M FM", 8:"4M FM", 9:"3M FM", 10:"2M FM", 11:"1M FM", 12:"0M FM" },
    coppa_tua:  { 1:"8.5M FM", 2:"2M FM", "Semifinale":"4.5M FM", "Gironi":"3.5M FM" },
    konami:     { 1:"30M FM", 2:"10M FM" },
    pedretti:   { 1:"20M FM", 2:"5M FM" },
    crediti:    { "1u00b0-2u00b0-3u00b0":"15M FM", "4u00b0-5u00b0-6u00b0":"10M FM", "7u00b0-8u00b0-9u00b0":"5M FM" },
    talent:     { 1:"8M FM", 2:"4M FM", 3:"3M FM" },
    coglioni:   { 1:"3M FM (punteggio piu00f9 basso)", 2:"1.5M FM" }
  };
  return map[key] || {};
}

function renderPremiBox(key) {
  const premi = getPremi(key);
  if (Object.keys(premi).length===0) return '';
  return `
    <div style="padding:14px 16px;border-top:1px solid rgba(255,215,0,0.15)">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:14px;color:var(--testo-dim);letter-spacing:1px;margin-bottom:10px">PREMI</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${Object.entries(premi).map(([pos, val]) => `
          <div style="background:var(--grigio-scuro);border-radius:8px;padding:8px 12px;font-size:12px">
            <span style="color:var(--testo-dim)">${isNaN(pos)?pos:pos+"°"}</span>
            <span style="color:var(--oro);font-weight:700;margin-left:6px">${val}</span>
          </div>`).join('')}
      </div>
    </div>`;
}

// ===== ADMIN MODAL =====
function apriAdminComp() {
  if (!adminLoggato) return;
  document.getElementById('modal-comp-admin').classList.add('open');
  renderAdminComp();
}

function renderAdminComp() {
  const body = document.getElementById('comp-admin-body');
  body.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap">
      <button onclick="showAdminCompTab('classifica',this)" id="tab-cl" style="background:var(--oro);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;padding:8px 16px;border-radius:8px;border:none;cursor:pointer">📊 CLASSIFICHE</button>
      <button onclick="showAdminCompTab('gironi',this)" id="tab-gi" style="background:var(--grigio-medio);color:var(--testo);font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;padding:8px 16px;border-radius:8px;border:1px solid var(--grigio-chiaro);cursor:pointer">⚽ GIRONI</button>
      <button onclick="showAdminCompTab('partite',this)" id="tab-pa" style="background:var(--grigio-medio);color:var(--testo);font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;padding:8px 16px;border-radius:8px;border:1px solid var(--grigio-chiaro);cursor:pointer">📅 PARTITE</button>
      <button onclick="showAdminCompTab('pdf',this)" id="tab-pdf" style="background:var(--grigio-medio);color:var(--testo);font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;padding:8px 16px;border-radius:8px;border:1px solid var(--grigio-chiaro);cursor:pointer">📄 PDF</button>
    </div>
    <div id="comp-admin-tab-content"></div>`;
  showAdminCompTab('classifica', document.getElementById('tab-cl'));
}

function showAdminCompTab(tab, btn) {
  document.querySelectorAll('[id^="tab-cl"],[id^="tab-gi"],[id^="tab-pa"],[id^="tab-pdf"]').forEach(b => {
    b.style.background='var(--grigio-medio)'; b.style.color='var(--testo)'; b.style.border='1px solid var(--grigio-chiaro)';
  });
  btn.style.background='var(--oro)'; btn.style.color='var(--nero)'; btn.style.border='none';
  const c = document.getElementById('comp-admin-tab-content');
  if (tab==='classifica') renderTabClassifica(c);
  else if (tab==='gironi') renderTabGironi(c);
  else if (tab==='partite') renderTabPartite(c);
  else if (tab==='pdf') renderTabPDF(c);
}

// TAB CLASSIFICHE
function renderTabClassifica(container) {
  const compConClassifica = Object.entries(COMP_CONFIG).filter(([,c]) => c.haClassifica);
  container.innerHTML = `
    <div style="margin-bottom:12px">
      <label class="form-label">Seleziona competizione</label>
      <select id="sel-comp-cl" class="form-select" onchange="renderFormClassifica()">
        ${compConClassifica.map(([k,c]) => `<option value="${k}">${c.icon} ${c.nome}</option>`).join('')}
      </select>
    </div>
    <div id="form-classifica-content"></div>`;
  renderFormClassifica();
}

function renderFormClassifica() {
  const key = document.getElementById('sel-comp-cl').value;
  const cl = compClassifiche.filter(c => c.competizione===key).sort((a,b)=>(a.posizione||99)-(b.posizione||99));
  const container = document.getElementById('form-classifica-content');

  // Squadre non ancora in classifica
  const sqGiaIn = cl.map(c => c.squadra_id);
  const sqDisp = squadreDB.filter(s => !sqGiaIn.includes(s.id));

  container.innerHTML = `
    ${cl.length > 0 ? `
    <div style="margin-bottom:16px">
      <div style="font-size:12px;color:var(--testo-dim);margin-bottom:8px">Modifica classifica esistente</div>
      ${cl.map(r => {
        const sq = squadreDB.find(s => s.id===r.squadra_id);
        if (!sq) return '';
        return `
          <div style="display:grid;grid-template-columns:30px 1fr 45px 45px 45px 45px 45px auto;gap:6px;align-items:center;padding:8px;background:var(--grigio-scuro);border-radius:8px;margin-bottom:6px">
            <div style="font-size:12px;color:var(--oro);font-weight:700">${r.posizione||'?'}</div>
            <div style="font-size:12px;font-weight:600">${sq.nome}</div>
            <input type="number" value="${r.vittorie||0}" min="0" onchange="aggiornaRigaCl(${r.id},'vittorie',this.value)" style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:4px;padding:4px;color:var(--testo);font-size:11px;text-align:center;width:100%" placeholder="V">
            <input type="number" value="${r.pareggi||0}" min="0" onchange="aggiornaRigaCl(${r.id},'pareggi',this.value)" style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:4px;padding:4px;color:var(--testo);font-size:11px;text-align:center;width:100%" placeholder="P">
            <input type="number" value="${r.sconfitte||0}" min="0" onchange="aggiornaRigaCl(${r.id},'sconfitte',this.value)" style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:4px;padding:4px;color:var(--testo);font-size:11px;text-align:center;width:100%" placeholder="S">
            <input type="number" value="${r.punti||0}" min="0" onchange="aggiornaRigaCl(${r.id},'punti',this.value)" style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:4px;padding:4px;color:var(--testo);font-size:11px;text-align:center;width:100%;font-weight:700" placeholder="PT">
            <input type="number" value="${r.posizione||0}" min="0" onchange="aggiornaRigaCl(${r.id},'posizione',this.value)" style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:4px;padding:4px;color:var(--oro);font-size:11px;text-align:center;width:100%" placeholder="#" title="Posizione">
            <button onclick="eliminaRigaCl(${r.id})" style="background:rgba(255,68,68,0.1);color:var(--rosso);border:1px solid rgba(255,68,68,0.3);font-size:11px;padding:4px 8px;border-radius:6px;cursor:pointer">🗑️</button>
          </div>`;
      }).join('')}
      <div style="font-size:10px;color:var(--testo-dim);margin-top:4px">Colonne: Vittorie • Pareggi • Sconfitte • Punti • Posizione</div>
      <button onclick="salvaTutteClassifica('${key}')" style="background:var(--verde);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1px;padding:10px;border-radius:8px;border:none;cursor:pointer;width:100%;margin-top:10px">💾 SALVA TUTTO</button>
    </div>` : ''}

    ${sqDisp.length > 0 ? `
    <div style="border-top:1px solid var(--grigio-chiaro);padding-top:14px;margin-top:8px">
      <div style="font-size:12px;color:var(--testo-dim);margin-bottom:8px">Aggiungi squadra alla classifica</div>
      <div style="display:grid;grid-template-columns:1fr auto;gap:8px">
        <select id="nuova-sq-cl" class="form-select">
          ${sqDisp.map(s => `<option value="${s.id}">${s.nome}</option>`).join('')}
        </select>
        <button onclick="aggiungiSqClassifica('${key}')" style="background:var(--oro);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;padding:8px 16px;border-radius:8px;border:none;cursor:pointer">+ AGGIUNGI</button>
      </div>
    </div>` : ''}`;
}

async function aggiornaRigaCl(id, campo, valore) {
  const val = parseInt(valore) || 0;
  try {
    const { error } = await sb.from('comp_classifiche').update({ [campo]: val, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    const idx = compClassifiche.findIndex(c => c.id===id);
    if (idx>=0) compClassifiche[idx][campo]=val;
    // Ricalcola giocate
    const r = compClassifiche[idx];
    if (r) {
      const giocate = (r.vittorie||0)+(r.pareggi||0)+(r.sconfitte||0);
      await sb.from('comp_classifiche').update({ giocate }).eq('id', id);
      if (idx>=0) compClassifiche[idx].giocate=giocate;
    }
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

async function salvaTutteClassifica(key) {
  showToast('✅ Classifica salvata!');
  renderDettaglioComp(key);
}

async function aggiungiSqClassifica(key) {
  const sqId = document.getElementById('nuova-sq-cl').value;
  if (!sqId) return;
  const posMax = compClassifiche.filter(c=>c.competizione===key).length + 1;
  try {
    const { data, error } = await sb.from('comp_classifiche').insert({
      competizione: key, stagione: STAGIONE_COMP, squadra_id: sqId,
      punti:0, vittorie:0, pareggi:0, sconfitte:0, giocate:0, posizione: posMax
    }).select().single();
    if (error) throw error;
    compClassifiche.push(data);
    showToast('✅ Squadra aggiunta!');
    renderFormClassifica();
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

async function eliminaRigaCl(id) {
  if (!confirm('Rimuovere questa squadra dalla classifica?')) return;
  try {
    const { error } = await sb.from('comp_classifiche').delete().eq('id', id);
    if (error) throw error;
    compClassifiche = compClassifiche.filter(c => c.id!==id);
    showToast('🗑️ Rimosso');
    renderFormClassifica();
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

// TAB GIRONI
function renderTabGironi(container) {
  const compConGironi = Object.entries(COMP_CONFIG).filter(([,c]) => c.haGironi);
  container.innerHTML = `
    <div style="margin-bottom:12px">
      <label class="form-label">Competizione</label>
      <select id="sel-comp-gi" class="form-select" onchange="renderFormGironi()">
        ${compConGironi.map(([k,c]) => `<option value="${k}">${c.icon} ${c.nome}</option>`).join('')}
      </select>
    </div>
    <div id="form-gironi-content"></div>`;
  renderFormGironi();
}

function renderFormGironi() {
  const key = document.getElementById('sel-comp-gi').value;
  const gironi = compGironi.filter(g => g.competizione===key);
  const container = document.getElementById('form-gironi-content');

  container.innerHTML = `
    ${gironi.map(g => `
      <div style="background:var(--grigio-scuro);border-radius:10px;padding:14px;margin-bottom:12px;border-left:2px solid var(--oro)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--oro);letter-spacing:1px">GIRONE ${g.nome_girone}</div>
          <button onclick="eliminaGirone(${g.id})" style="background:rgba(255,68,68,0.1);color:var(--rosso);border:1px solid rgba(255,68,68,0.3);font-size:11px;padding:4px 10px;border-radius:6px;cursor:pointer">🗑️</button>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">
          ${(g.squadre_ids||[]).map(sqId => {
            const sq = squadreDB.find(s => s.id===sqId);
            return sq ? `<div style="display:flex;align-items:center;gap:4px;background:var(--grigio);padding:4px 10px;border-radius:20px;font-size:12px">
              ${sq.logo_url?`<img src="${sq.logo_url}" style="width:16px;height:16px;object-fit:contain;border-radius:2px">`:''}
              ${sq.nome}
              <button onclick="rimuoviSqGirone(${g.id},'${sqId}')" style="background:none;border:none;color:var(--rosso);cursor:pointer;font-size:11px;padding:0 0 0 4px">×</button>
            </div>` : '';
          }).join('')}
        </div>
        <div style="display:grid;grid-template-columns:1fr auto;gap:8px">
          <select id="add-sq-gi-${g.id}" class="form-select">
            <option value="">— Aggiungi squadra —</option>
            ${squadreDB.filter(s=>!(g.squadre_ids||[]).includes(s.id)).map(s=>`<option value="${s.id}">${s.nome}</option>`).join('')}
          </select>
          <button onclick="aggiungiSqGirone(${g.id})" style="background:var(--oro);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:13px;padding:8px 14px;border-radius:8px;border:none;cursor:pointer">+</button>
        </div>
      </div>`).join('')}

    <div style="border-top:1px solid var(--grigio-chiaro);padding-top:14px;margin-top:8px">
      <div style="font-size:12px;color:var(--testo-dim);margin-bottom:8px">Crea nuovo girone</div>
      <div style="display:grid;grid-template-columns:1fr auto;gap:8px">
        <input id="nome-nuovo-girone" class="form-input" placeholder="Nome girone (es. A, B, Rosso...)" type="text">
        <button onclick="creaGirone('${key}')" style="background:var(--verde);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;padding:8px 16px;border-radius:8px;border:none;cursor:pointer">+ CREA</button>
      </div>
    </div>`;
}

async function creaGirone(key) {
  const nome = document.getElementById('nome-nuovo-girone').value.trim().toUpperCase();
  if (!nome) { showToast('❌ Inserisci un nome per il girone','error'); return; }
  try {
    const { data, error } = await sb.from('comp_gironi').insert({ competizione:key, stagione:STAGIONE_COMP, nome_girone:nome, squadre_ids:[] }).select().single();
    if (error) throw error;
    compGironi.push(data);
    showToast('✅ Girone creato!');
    renderFormGironi();
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

async function aggiungiSqGirone(gironeId) {
  const sqId = document.getElementById('add-sq-gi-'+gironeId).value;
  if (!sqId) return;
  const g = compGironi.find(x => x.id===gironeId);
  if (!g) return;
  const nuove = [...(g.squadre_ids||[]), sqId];
  try {
    const { error } = await sb.from('comp_gironi').update({ squadre_ids: nuove }).eq('id', gironeId);
    if (error) throw error;
    g.squadre_ids = nuove;
    showToast('✅ Squadra aggiunta al girone!');
    renderFormGironi();
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

async function rimuoviSqGirone(gironeId, sqId) {
  const g = compGironi.find(x => x.id===gironeId);
  if (!g) return;
  const nuove = (g.squadre_ids||[]).filter(id => id!==sqId);
  try {
    const { error } = await sb.from('comp_gironi').update({ squadre_ids: nuove }).eq('id', gironeId);
    if (error) throw error;
    g.squadre_ids = nuove;
    showToast('🗑️ Squadra rimossa');
    renderFormGironi();
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

async function eliminaGirone(id) {
  if (!confirm('Eliminare questo girone e tutte le sue partite?')) return;
  try {
    await sb.from('comp_partite').delete().eq('girone', compGironi.find(g=>g.id===id)?.nome_girone);
    const { error } = await sb.from('comp_gironi').delete().eq('id', id);
    if (error) throw error;
    compGironi = compGironi.filter(g => g.id!==id);
    showToast('🗑️ Girone eliminato');
    renderFormGironi();
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

// TAB PARTITE
function renderTabPartite(container) {
  container.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
      <div>
        <label class="form-label">Competizione</label>
        <select id="sel-comp-pa" class="form-select" onchange="aggiornaSelezionePartita()">
          ${Object.entries(COMP_CONFIG).map(([k,c]) => `<option value="${k}">${c.icon} ${c.nome}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="form-label">Fase</label>
        <select id="sel-fase-pa" class="form-select">
          <option value="gironi">Gironi</option>
          <option value="quarti">Quarti</option>
          <option value="semifinale">Semifinale</option>
          <option value="finale">Finale</option>
          <option value="regular">Regular Season</option>
        </select>
      </div>
    </div>
    <div id="sel-girone-pa-wrap" style="margin-bottom:12px;display:none">
      <label class="form-label">Girone</label>
      <select id="sel-girone-pa" class="form-select"></select>
    </div>
    <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:end;margin-bottom:12px">
      <div>
        <label class="form-label">Casa</label>
        <select id="pa-casa" class="form-select">${squadreDB.map(s=>`<option value="${s.id}">${s.nome}</option>`).join('')}</select>
      </div>
      <div style="font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--testo-dim);text-align:center;padding-bottom:8px">VS</div>
      <div>
        <label class="form-label">Ospite</label>
        <select id="pa-ospite" class="form-select">${squadreDB.map(s=>`<option value="${s.id}">${s.nome}</option>`).join('')}</select>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">
      <div>
        <label class="form-label">Punti Casa</label>
        <input id="pa-punti-casa" class="form-input" type="number" step="0.1" placeholder="es. 72.5">
      </div>
      <div>
        <label class="form-label">Punti Ospite</label>
        <input id="pa-punti-ospite" class="form-input" type="number" step="0.1" placeholder="es. 68.0">
      </div>
      <div>
        <label class="form-label">Giornata</label>
        <input id="pa-giornata" class="form-input" type="number" placeholder="es. 1">
      </div>
    </div>
    <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--testo);margin-bottom:16px;cursor:pointer">
      <input type="checkbox" id="pa-giocata" style="width:16px;height:16px"> Partita già giocata
    </label>
    <button onclick="salvaPartita()" style="background:var(--verde);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1px;padding:12px;border-radius:8px;border:none;cursor:pointer;width:100%;margin-bottom:20px">💾 SALVA PARTITA</button>

    <div style="border-top:1px solid var(--grigio-chiaro);padding-top:14px">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:14px;color:var(--testo-dim);letter-spacing:1px;margin-bottom:10px">PARTITE INSERITE</div>
      <div id="lista-partite-admin"></div>
    </div>`;

  aggiornaSelezionePartita();
}

function aggiornaSelezionePartita() {
  const key = document.getElementById('sel-comp-pa').value;
  const cfg = COMP_CONFIG[key];
  const wrap = document.getElementById('sel-girone-pa-wrap');
  const selGirone = document.getElementById('sel-girone-pa');
  if (cfg && cfg.haGironi) {
    wrap.style.display='block';
    const gironi = compGironi.filter(g => g.competizione===key);
    selGirone.innerHTML = gironi.length ? gironi.map(g=>`<option value="${g.nome_girone}">Girone ${g.nome_girone}</option>`).join('') : '<option value="">Nessun girone creato</option>';
  } else { wrap.style.display='none'; }
  // Mostra partite esistenti
  const pp = compPartite.filter(p=>p.competizione===key).slice(-10).reverse();
  const lista = document.getElementById('lista-partite-admin');
  if (lista) {
    lista.innerHTML = pp.length===0 ? '<div style="color:var(--testo-dim);font-size:13px">Nessuna partita inserita</div>' :
      pp.map(p => {
        const casa=squadreDB.find(s=>s.id===p.squadra_casa_id);
        const osp=squadreDB.find(s=>s.id===p.squadra_ospite_id);
        return `
          <div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--grigio-scuro);border-radius:8px;margin-bottom:6px">
            <div style="flex:1;font-size:12px">${casa?.nome||'?'} <span style="color:var(--oro);font-weight:700">${p.giocata?(p.punti_casa+' — '+p.punti_ospite):'vs'}</span> ${osp?.nome||'?'}</div>
            <div style="font-size:10px;color:var(--testo-dim)">${p.fase}${p.girone?' G.'+p.girone:''}</div>
            <button onclick="eliminaPartita(${p.id})" style="background:rgba(255,68,68,0.1);color:var(--rosso);border:1px solid rgba(255,68,68,0.3);font-size:10px;padding:3px 8px;border-radius:5px;cursor:pointer">🗑️</button>
          </div>`;
      }).join('');
  }
}

async function salvaPartita() {
  const key = document.getElementById('sel-comp-pa').value;
  const fase = document.getElementById('sel-fase-pa').value;
  const girone = COMP_CONFIG[key]?.haGironi ? document.getElementById('sel-girone-pa').value : null;
  const casaId = document.getElementById('pa-casa').value;
  const ospId = document.getElementById('pa-ospite').value;
  const ptCasa = parseFloat(document.getElementById('pa-punti-casa').value)||null;
  const ptOsp = parseFloat(document.getElementById('pa-punti-ospite').value)||null;
  const giornata = parseInt(document.getElementById('pa-giornata').value)||null;
  const giocata = document.getElementById('pa-giocata').checked;

  if (casaId===ospId) { showToast('❌ Le due squadre devono essere diverse','error'); return; }
  try {
    const { data, error } = await sb.from('comp_partite').insert({
      competizione:key, stagione:STAGIONE_COMP, fase, girone,
      squadra_casa_id:casaId, squadra_ospite_id:ospId,
      punti_casa:ptCasa, punti_ospite:ptOsp, giornata, giocata
    }).select().single();
    if (error) throw error;
    compPartite.push(data);
    showToast('✅ Partita salvata!');
    aggiornaSelezionePartita();
    if (giocata) aggiornaClassificaAutomatica(key, casaId, ospId, ptCasa, ptOsp);
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

async function eliminaPartita(id) {
  if (!confirm('Eliminare questa partita?')) return;
  try {
    const { error } = await sb.from('comp_partite').delete().eq('id', id);
    if (error) throw error;
    compPartite = compPartite.filter(p=>p.id!==id);
    showToast('🗑️ Eliminata');
    aggiornaSelezionePartita();
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

// Aggiorna automaticamente la classifica quando si inserisce una partita giocata
async function aggiornaClassificaAutomatica(key, casaId, ospId, ptCasa, ptOsp) {
  if (!ptCasa || !ptOsp) return;
  const aggiorna = async (sqId, v, pa, s) => {
    const riga = compClassifiche.find(c=>c.competizione===key&&c.squadra_id===sqId);
    if (!riga) return;
    const nuovi = {
      vittorie: (riga.vittorie||0)+v,
      pareggi: (riga.pareggi||0)+pa,
      sconfitte: (riga.sconfitte||0)+s,
      punti: (riga.punti||0)+(v*3)+(pa*1),
      giocate: (riga.giocate||0)+1,
      updated_at: new Date().toISOString()
    };
    await sb.from('comp_classifiche').update(nuovi).eq('id', riga.id);
    Object.assign(riga, nuovi);
  };
  if (ptCasa>ptOsp) { await aggiorna(casaId,1,0,0); await aggiorna(ospId,0,0,1); }
  else if (ptOsp>ptCasa) { await aggiorna(ospId,1,0,0); await aggiorna(casaId,0,0,1); }
  else { await aggiorna(casaId,0,1,0); await aggiorna(ospId,0,1,0); }
}

// TAB PDF
function renderTabPDF(container) {
  container.innerHTML = `
    <div style="background:rgba(255,215,0,0.06);border:1px solid rgba(255,215,0,0.2);border-radius:10px;padding:16px;margin-bottom:16px">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--oro);letter-spacing:1px;margin-bottom:8px">📄 IMPORTA DA PDF</div>
      <div style="font-size:12px;color:var(--testo-dim);line-height:1.7;margin-bottom:14px">
        Carica un PDF con i risultati delle partite. Il sistema estrarrà automaticamente i punteggi e li associerà alle squadre.<br>
        <strong style="color:var(--testo)">Formato consigliato:</strong> "Squadra A 72.5 — Squadra B 68.0"
      </div>
      <div style="margin-bottom:12px">
        <label class="form-label">Competizione di riferimento</label>
        <select id="pdf-comp" class="form-select">
          ${Object.entries(COMP_CONFIG).map(([k,c]) => `<option value="${k}">${c.icon} ${c.nome}</option>`).join('')}
        </select>
      </div>
      <div style="margin-bottom:12px">
        <label class="form-label">Fase</label>
        <select id="pdf-fase" class="form-select">
          <option value="gironi">Gironi</option>
          <option value="semifinale">Semifinale</option>
          <option value="finale">Finale</option>
          <option value="regular">Regular Season</option>
        </select>
      </div>
      <label style="display:flex;align-items:center;justify-content:center;gap:10px;padding:20px;border:2px dashed var(--grigio-chiaro);border-radius:10px;cursor:pointer;margin-bottom:12px" for="pdf-upload">
        <div style="text-align:center">
          <div style="font-size:32px;margin-bottom:6px">📄</div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1px;color:var(--oro)">CARICA PDF</div>
          <div style="font-size:11px;color:var(--testo-dim);margin-top:4px">Clicca per selezionare il file</div>
        </div>
      </label>
      <input type="file" id="pdf-upload" accept=".pdf" style="display:none" onchange="elaboraPDF(this)">
      <div id="pdf-risultato" style="display:none"></div>
    </div>

    <div style="border-top:1px solid var(--grigio-chiaro);padding-top:14px">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:14px;color:var(--testo-dim);letter-spacing:1px;margin-bottom:10px">📝 OPPURE INCOLLA IL TESTO</div>
      <textarea id="pdf-testo-manuale" rows="8" style="width:100%;background:var(--grigio-scuro);border:1px solid var(--grigio-chiaro);border-radius:8px;padding:12px;color:var(--testo);font-family:'Space Mono',monospace;font-size:12px;outline:none;resize:vertical" placeholder="Incolla qui i risultati, es:&#10;Umberto 72.5 - Giorgio 68.0&#10;Noah 80.0 - Daniele 55.5&#10;..."></textarea>
      <button onclick="elaboraTesto()" style="background:var(--oro);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1px;padding:12px;border-radius:8px;border:none;cursor:pointer;width:100%;margin-top:8px">🔍 ANALIZZA E IMPORTA</button>
    </div>`;
}

async function elaboraPDF(input) {
  const file = input.files[0];
  if (!file) return;
  showToast('⏳ Lettura PDF in corso...', 'info');
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Usa PDF.js se disponibile, altrimenti istruzioni manuali
    if (typeof pdfjsLib !== 'undefined') {
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let testo = '';
      for (let i=1; i<=pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        testo += content.items.map(item => item.str).join(' ') + '\n';
      }
      document.getElementById('pdf-testo-manuale').value = testo;
      showToast('✅ PDF letto! Controlla il testo e clicca ANALIZZA');
    } else {
      showToast('⚠️ Copia il testo dal PDF e incollalo nella casella sotto', 'info');
    }
  } catch(e) {
    showToast('❌ Errore lettura PDF — incolla manualmente il testo', 'error');
  }
}

function elaboraTesto() {
  const testo = document.getElementById('pdf-testo-manuale').value;
  const compKey = document.getElementById('pdf-comp').value;
  const fase = document.getElementById('pdf-fase').value;
  if (!testo.trim()) { showToast('❌ Inserisci del testo','error'); return; }

  // Pattern: "NomeSquadra 72.5 - NomeSquadra2 68.0" o "NomeSquadra 72.5 — NomeSquadra2 68.0"
  const righe = testo.split('\n').filter(r => r.trim());
  const risultati = [];

  righe.forEach(riga => {
    // Pattern flessibile: parole con numero — parole con numero
    const match = riga.match(/(.+?)\s+(\d+[\.,]?\d*)\s*[-—–]\s*(.+?)\s+(\d+[\.,]?\d*)\s*$/);
    if (match) {
      const nomeCasa = match[1].trim();
      const ptCasa = parseFloat(match[2].replace(',','.'));
      const nomeOsp = match[3].trim();
      const ptOsp = parseFloat(match[4].replace(',','.'));

      // Cerca squadra per nome (fuzzy)
      const trovaCasa = trovaSq(nomeCasa);
      const trovaOsp = trovaSq(nomeOsp);

      risultati.push({ nomeCasa, nomeOsp, ptCasa, ptOsp, trovaCasa, trovaOsp });
    }
  });

  if (risultati.length===0) {
    showToast('❌ Nessun risultato trovato. Controlla il formato','error');
    return;
  }

  // Mostra anteprima
  const div = document.getElementById('pdf-risultato');
  div.style.display='block';
  div.innerHTML = `
    <div style="background:var(--grigio-scuro);border-radius:10px;padding:14px;margin-top:12px">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--verde);letter-spacing:1px;margin-bottom:10px">📋 ANTEPRIMA (${risultati.length} risultati)</div>
      ${risultati.map((r,i) => `
        <div style="padding:8px;background:var(--grigio);border-radius:8px;margin-bottom:6px;font-size:12px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="color:${r.trovaCasa?'var(--verde)':'var(--rosso)'}">${r.trovaCasa?'✅':'❓'}</span>
            <span style="font-weight:600">${r.nomeCasa}</span>
            <span style="color:var(--oro);font-weight:700">${r.ptCasa} — ${r.ptOsp}</span>
            <span style="font-weight:600">${r.nomeOsp}</span>
            <span style="color:${r.trovaOsp?'var(--verde)':'var(--rosso)'}">${r.trovaOsp?'✅':'❓'}</span>
          </div>
          ${!r.trovaCasa||!r.trovaOsp ? `<div style="color:var(--rosso);font-size:11px;margin-top:4px">⚠️ Squadra non trovata — verrà saltata</div>` : ''}
        </div>`).join('')}
      <button onclick="importaRisultati(${JSON.stringify(risultati).replace(/"/g,'&quot;')},'${compKey}','${fase}')" style="background:var(--verde);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1px;padding:12px;border-radius:8px;border:none;cursor:pointer;width:100%;margin-top:10px">✅ IMPORTA TUTTI</button>
    </div>`;
}

function trovaSq(nome) {
  const n = nome.toLowerCase().trim();
  return squadreDB.find(s =>
    s.nome.toLowerCase()===n ||
    s.nome.toLowerCase().includes(n) ||
    n.includes(s.nome.toLowerCase())
  ) || null;
}

async function importaRisultati(risultati, compKey, fase) {
  let importati=0, saltati=0;
  for (const r of risultati) {
    if (!r.trovaCasa || !r.trovaOsp) { saltati++; continue; }
    try {
      const { data, error } = await sb.from('comp_partite').insert({
        competizione:compKey, stagione:STAGIONE_COMP, fase,
        squadra_casa_id:r.trovaCasa.id, squadra_ospite_id:r.trovaOsp.id,
        punti_casa:r.ptCasa, punti_ospite:r.ptOsp, giocata:true
      }).select().single();
      if (error) throw error;
      compPartite.push(data);
      await aggiornaClassificaAutomatica(compKey, r.trovaCasa.id, r.trovaOsp.id, r.ptCasa, r.ptOsp);
      importati++;
    } catch(e) { saltati++; }
  }
  showToast(`✅ ${importati} partite importate${saltati>0?' ('+saltati+' saltate)':''}`);
  document.getElementById('pdf-risultato').style.display='none';
  document.getElementById('pdf-testo-manuale').value='';
  renderDettaglioComp(compKey);
}
