// ===== MODALITÀ RISIKO =====

let risikoObiettivi = [];
let risikoAssegnazioni = [];
const STAGIONE_RISIKO = '2024/25';

const OBIETTIVI_FACILI = [
  'Usare almeno 20 giocatori diversi durante la stagione',
  'Un giocatore della marginale prende almeno un voto ≥7',
  'Un giocatore della marginale fa almeno 1 assist',
  'I giocatori della marginale totalizzano almeno 3 gol',
  'I giocatori della marginale totalizzano almeno 15 presenze',
  'Non perdere mai con un distacco superiore a 20 punti',
  'Vincere una giornata con almeno +12 punti di distacco',
  'Almeno 2 gol segnati da difensori titolari durante la stagione',
  'Almeno 3 gol da giocatori subentrati durante la stagione',
  'Almeno 2 assist da giocatori subentrati durante la stagione',
  'Un centrocampista totalizza almeno 7 bonus durante la stagione',
  'Superare i 71 punti in almeno 8 giornate',
  'Almeno 3 assist dai difensori titolari durante la stagione',
  'Almeno 6 giornate con 3 o più bonus di squadra (solo titolari)',
  'Almeno 5 assist dai centrocampisti titolari durante la stagione',
  'Almeno 18 gol dagli attaccanti titolari durante la stagione',
  'Almeno 7 assist totali dai titolari durante la stagione',
  'Vendere 3 giocatori che durante la stagione faranno 0 bonus',
  'Chiudere almeno 4 acquisti da altri fantallenatori nella stagione',
  'Avere almeno 8 giocatori nella rosa marginale'
];

const OBIETTIVI_NORMALI = [
  'Superare gli 80 punti in almeno 6 giornate',
  'I centrocampisti titolari segnano almeno 12 gol durante la stagione',
  'Fare almeno 8 acquisti entro settembre e almeno 3 entro febbraio',
  'Avere almeno 4 giornate con 5 titolari che prendono voto ≥7',
  'Chiudere almeno 15 operazioni di mercato con altri fantallenatori',
  'Avere in rosa almeno 6 italiani con almeno 1 per ogni ruolo',
  'Fare almeno una trattativa con ogni altro fantallenatore della lega',
  'Almeno 7 giornate in cui 3 difensori titolari prendono voto ≥6.5',
  'Gli attaccanti titolari totalizzano almeno 40 bonus durante la stagione',
  'I titolari totalizzano almeno 18 assist durante la stagione',
  'Svincolare giocatori per un valore totale di almeno 25 fantamilioni',
  'Fare almeno 7 cessioni entro settembre e almeno 3 entro febbraio',
  'Avere almeno 5 giocatori sudamericani nella rosa principale',
  'Avere almeno 6 giocatori che superano i 5 gol durante la stagione',
  'Avere almeno 4 difensori con almeno 3 bonus ciascuno durante la stagione',
  'Avere almeno 5 giocatori in rosa che hanno cambiato squadra nell\'ultimo mercato',
  'Avere almeno 3 giocatori nati dal 1995 in poi e almeno 4 nati nel 2003',
  'Avere almeno 4 giocatori con 100 o più presenze in Serie A',
  'Avere almeno 9 giocatori della rosa principale di nazionalità diverse',
  'Avere almeno 10 giocatori della rosa principale con voto medio ≥6 a fine stagione'
];

const OBIETTIVI_DIFFICILI = [
  'Avere almeno 5 giocatori che totalizzano 10 o più bonus durante la stagione',
  'Avere almeno 14 giocatori con almeno 1 bonus durante la stagione',
  'I difensori totalizzano almeno 20 bonus durante la stagione',
  'Obiettivo combinato centrocampisti: almeno 15 gol + 20 assist + 3 giocatori con media ≥6.5',
  'Obiettivo combinato attaccanti: almeno 25 gol + 15 assist + 2 giocatori con media ≥7',
  'Avere almeno 10 italiani nella rosa principale a fine stagione',
  'Avere almeno 10 giocatori nati dal 2003 in poi tra principale e primavera',
  'Avere almeno 11 nazionalità diverse nella rosa principale',
  'Avere almeno 7 giocatori provenienti da squadre neopromosse',
  'Cambiare almeno 15 giocatori rispetto alla rosa dell\'anno scorso',
  'Promuovere almeno 7 giovani dalla primavera durante la stagione',
  'Avere almeno 13 giocatori provenienti da 13 squadre diverse nella rosa principale',
  'Avere almeno 9 giocatori nati nello stesso mese nella rosa principale',
  'Avere almeno 12 giocatori africani tra rosa principale e marginale',
  'Avere almeno 5 giocatori della Juventus e 4 della Fiorentina (portieri marginali esclusi)',
  'Schierare la difesa a 5 per almeno 10 giornate durante la stagione',
  'Alternare due portieri titolari per almeno 10 giornate durante la stagione',
  'Avere almeno 4 giocatori del Milan + 3 del Venezia + 3 del Bologna nella rosa principale',
  'Obiettivo combinato multiplo: acquisto a gennaio + 1 giocatore alto ≥1.90 + 3 italiani + 2 sudamericani + 1 nato nel 2004',
  'Avere almeno 15 giocatori alti almeno 1.90m tra rosa principale e marginale'
];

// ===== CARICA DATI DAL DB =====
async function caricaRisiko() {
  try {
    const [{ data: master }, { data: assegn }] = await Promise.all([
      sb.from('risiko_obiettivi_master').select('*').eq('stagione', STAGIONE_RISIKO).order('difficolta').order('id'),
      sb.from('risiko_assegnazioni').select('*').eq('stagione', STAGIONE_RISIKO)
    ]);
    risikoObiettivi = master || [];
    risikoAssegnazioni = assegn || [];
  } catch (e) {
    console.error('Errore caricamento risiko:', e);
    risikoObiettivi = [];
    risikoAssegnazioni = [];
  }
}

// ===== RENDER PRINCIPALE =====
async function renderRisiko() {
  const container = document.getElementById('risiko-content');
  if (!container) return;
  container.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Caricamento...</div>';
  await caricaRisiko();

  const sqId = utenteLoggato ? utenteLoggato.id : null;
  const mieAssegnazioni = sqId ? risikoAssegnazioni.filter(a => a.squadra_id === sqId) : [];

  let html = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px">
      <div>
        <div class="page-title">🎯 MODALITÀ RISIKO</div>
        <div class="page-sub">3 obiettivi segreti per squadra — Stagione ${STAGIONE_RISIKO}</div>
      </div>
      ${adminLoggato ? `<button onclick="apriAdminRisiko()" style="background:var(--oro);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:1px;padding:10px 20px;border-radius:8px;border:none;cursor:pointer">⚙️ ADMIN RISIKO</button>` : ''}
    </div>`;

  // I MIEI OBIETTIVI
  if (sqId) {
    html += `
      <div style="background:linear-gradient(135deg,rgba(255,215,0,0.08),rgba(255,215,0,0.03));border:1px solid rgba(255,215,0,0.3);border-radius:14px;padding:20px;margin-bottom:24px">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:22px;color:var(--oro);letter-spacing:2px;margin-bottom:4px">🎯 I MIEI OBIETTIVI</div>
        <div style="font-size:12px;color:var(--testo-dim);margin-bottom:16px">Solo tu puoi vedere i tuoi obiettivi</div>`;

    if (mieAssegnazioni.length === 0) {
      // Controlla se ci sono obiettivi nel DB da pescare
      const totObiettivi = risikoObiettivi.length;
      if (totObiettivi === 0) {
        html += `<div style="text-align:center;padding:20px 0;color:var(--testo-dim)">⏳ Gli obiettivi non sono ancora stati caricati dall'admin</div>`;
      } else {
        html += `
          <div style="text-align:center;padding:20px 0">
            <div style="font-size:40px;margin-bottom:12px">🎲</div>
            <div style="font-size:14px;color:var(--testo);margin-bottom:16px">Non hai ancora pescato i tuoi obiettivi!</div>
            <button onclick="pescaObiettivi()" style="background:var(--oro);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:1px;padding:12px 28px;border-radius:10px;border:none;cursor:pointer">🎲 PESCA I TUOI OBIETTIVI</button>
          </div>`;
      }
    } else {
      const colori = { facile: 'var(--verde)', normale: 'var(--oro)', difficile: 'var(--rosso)' };
      const premi = { facile: '5M', normale: '15M', difficile: '45M' };
      const icone = { facile: '🟢', normale: '🟡', difficile: '🔴' };
      mieAssegnazioni.forEach(a => {
        const obj = risikoObiettivi.find(o => o.id === a.obiettivo_id);
        if (!obj) return;
        const col = colori[obj.difficolta] || 'var(--testo)';
        html += `
          <div style="background:var(--grigio-scuro);border:1px solid ${a.completato ? 'rgba(0,255,135,0.4)' : 'var(--grigio-chiaro)'};border-radius:12px;padding:16px;margin-bottom:10px;position:relative;overflow:hidden">
            ${a.completato ? `<div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--verde)"></div>` : ''}
            <div style="display:flex;align-items:flex-start;gap:12px">
              <div style="font-size:24px;flex-shrink:0">${icone[obj.difficolta]}</div>
              <div style="flex:1">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
                  <span style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${col};background:${col}22;padding:2px 8px;border-radius:10px">${obj.difficolta.toUpperCase()}</span>
                  <span style="font-family:'Space Mono',monospace;font-size:12px;color:var(--verde)">+${premi[obj.difficolta]} FM</span>
                  ${a.completato ? `<span style="font-size:10px;font-weight:700;color:var(--verde);background:rgba(0,255,135,0.15);padding:2px 8px;border-radius:10px">✅ COMPLETATO</span>` : `<span style="font-size:10px;color:var(--testo-dim);background:var(--grigio-medio);padding:2px 8px;border-radius:10px">⏳ IN CORSO</span>`}
                </div>
                <div style="font-size:14px;color:var(--testo);line-height:1.5">${obj.testo}</div>
                ${a.completato && a.data_completamento ? `<div style="font-size:11px;color:var(--testo-dim);margin-top:6px">📅 Completato il ${new Date(a.data_completamento).toLocaleDateString('it-IT')}</div>` : ''}
              </div>
            </div>
          </div>`;
      });

      const completati = mieAssegnazioni.filter(a => a.completato).length;
      const totFM = mieAssegnazioni.filter(a => a.completato).reduce((s, a) => {
        const o = risikoObiettivi.find(x => x.id === a.obiettivo_id);
        return s + (o ? o.premio : 0);
      }, 0);
      html += `
        <div style="display:flex;gap:16px;margin-top:8px;padding-top:14px;border-top:1px solid var(--grigio-chiaro)">
          <div><div style="font-size:10px;color:var(--testo-dim);text-transform:uppercase;letter-spacing:1px">Completati</div><div style="font-family:'Space Mono',monospace;font-size:20px;font-weight:700;color:var(--verde)">${completati}/3</div></div>
          <div><div style="font-size:10px;color:var(--testo-dim);text-transform:uppercase;letter-spacing:1px">FM incassati</div><div style="font-family:'Space Mono',monospace;font-size:20px;font-weight:700;color:var(--oro)">${(totFM/1000000).toFixed(0)}M</div></div>
          <div><div style="font-size:10px;color:var(--testo-dim);text-transform:uppercase;letter-spacing:1px">Max potenziale</div><div style="font-family:'Space Mono',monospace;font-size:16px;font-weight:700;color:var(--testo-dim)">65M</div></div>
        </div>`;
    }
    html += `</div>`;
  }

  html += renderClassificaRisiko();
  container.innerHTML = html;
}

// ===== PESCA OBIETTIVI (utente) =====
async function pescaObiettivi() {
  if (!utenteLoggato) return;
  if (!confirm('Vuoi pescare i tuoi 3 obiettivi segreti? Questa azione è irreversibile!')) return;

  const sqId = utenteLoggato.id;

  // Obiettivi già assegnati ad altre squadre per ogni difficoltà
  const getUsati = (diff) => risikoAssegnazioni
    .filter(a => a.squadra_id !== sqId)
    .filter(a => { const o = risikoObiettivi.find(x => x.id === a.obiettivo_id); return o && o.difficolta === diff; })
    .map(a => a.obiettivo_id);

  const pesca = (diff) => {
    const usati = getUsati(diff);
    const disponibili = risikoObiettivi.filter(o => o.difficolta === diff && o.attivo && !usati.includes(o.id));
    if (disponibili.length === 0) return null;
    return disponibili[Math.floor(Math.random() * disponibili.length)];
  };

  const facile = pesca('facile');
  const normale = pesca('normale');
  const difficile = pesca('difficile');

  if (!facile || !normale || !difficile) {
    showToast('❌ Non ci sono abbastanza obiettivi disponibili!', 'error');
    return;
  }

  try {
    const rows = [
      { squadra_id: sqId, obiettivo_id: facile.id, difficolta: 'facile', completato: false, stagione: STAGIONE_RISIKO },
      { squadra_id: sqId, obiettivo_id: normale.id, difficolta: 'normale', completato: false, stagione: STAGIONE_RISIKO },
      { squadra_id: sqId, obiettivo_id: difficile.id, difficolta: 'difficile', completato: false, stagione: STAGIONE_RISIKO }
    ];
    const { data, error } = await sb.from('risiko_assegnazioni').insert(rows).select();
    if (error) throw error;
    risikoAssegnazioni = [...risikoAssegnazioni, ...data];
    showToast('🎯 Obiettivi pescati! Buona fortuna!');
    renderRisiko();
  } catch (e) {
    showToast('❌ Errore: ' + e.message, 'error');
  }
}

// ===== CLASSIFICA =====
function renderClassificaRisiko() {
  const righe = squadreDB.map(sq => {
    const assegn = risikoAssegnazioni.filter(a => a.squadra_id === sq.id);
    const completati = assegn.filter(a => a.completato).length;
    const totFM = assegn.filter(a => a.completato).reduce((s, a) => {
      const o = risikoObiettivi.find(x => x.id === a.obiettivo_id);
      return s + (o ? o.premio : 0);
    }, 0);
    const haPescato = assegn.length > 0;
    return { sq, completati, totFM, haPescato };
  }).sort((a, b) => b.completati - a.completati || b.totFM - a.totFM);

  const logoHtml = sq => sq.logo_url
    ? `<img src="${sq.logo_url}" style="width:28px;height:28px;object-fit:contain;border-radius:4px">`
    : `<div style="width:28px;height:28px;border-radius:6px;background:${sq.avatar_bg||'#333'};display:flex;align-items:center;justify-content:center;font-size:12px">${sq.avatar||'⚽'}</div>`;

  return `
    <div style="margin-bottom:20px">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:22px;color:var(--testo);letter-spacing:2px;margin-bottom:14px">📊 CLASSIFICA RISIKO</div>
      <div style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:12px;overflow:hidden">
        <div style="display:grid;grid-template-columns:36px 1fr 90px 80px;padding:10px 16px;border-bottom:1px solid var(--grigio-chiaro);font-size:10px;color:var(--testo-dim);text-transform:uppercase;letter-spacing:1px">
          <div>#</div><div>Squadra</div><div style="text-align:center">Completati</div><div style="text-align:right">FM</div>
        </div>
        ${righe.map((r, i) => {
          const rankCol = i===0?'var(--oro)':i===1?'var(--argento)':i===2?'#cd7f32':'var(--testo-dim)';
          return `
          <div style="display:grid;grid-template-columns:36px 1fr 90px 80px;padding:12px 16px;border-bottom:1px solid var(--grigio-chiaro);align-items:center${i===righe.length-1?';border-bottom:none':''}">
            <div style="font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:${rankCol}">${i+1}</div>
            <div style="display:flex;align-items:center;gap:10px">
              ${logoHtml(r.sq)}
              <div>
                <div style="font-size:13px;font-weight:600">${r.sq.nome}</div>
                <div style="font-size:10px;color:var(--testo-dim)">${r.haPescato ? '🎯 Obiettivi pescati' : '⏳ Non ancora pescato'}</div>
              </div>
            </div>
            <div style="text-align:center">
              ${r.haPescato
                ? `<span style="font-family:'Space Mono',monospace;font-size:15px;font-weight:700;color:${r.completati>0?'var(--verde)':'var(--testo-dim)'}">${r.completati}/3</span>`
                : `<span style="color:var(--testo-dim);font-size:12px">—</span>`}
            </div>
            <div style="text-align:right;font-family:'Space Mono',monospace;font-size:13px;font-weight:700;color:${r.totFM>0?'var(--oro)':'var(--testo-dim)'}">
              ${r.totFM>0?'+'+(r.totFM/1000000).toFixed(0)+'M':'—'}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

// ===== ADMIN =====
function apriAdminRisiko() {
  if (!adminLoggato) return;
  document.getElementById('modal-risiko-admin').classList.add('open');
  renderAdminRisiko();
}

function renderAdminRisiko() {
  const body = document.getElementById('risiko-admin-body');
  body.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap">
      <button onclick="showAdminRisikoTab('obiettivi',this)" id="tab-robj" style="background:var(--oro);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;padding:8px 18px;border-radius:8px;border:none;cursor:pointer">📋 OBIETTIVI</button>
      <button onclick="showAdminRisikoTab('gestisci',this)" id="tab-rgestisci" style="background:var(--grigio-medio);color:var(--testo);font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;padding:8px 18px;border-radius:8px;border:1px solid var(--grigio-chiaro);cursor:pointer">✅ GESTISCI</button>
      <button onclick="showAdminRisikoTab('reset',this)" id="tab-rreset" style="background:var(--grigio-medio);color:var(--rosso);font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;padding:8px 18px;border-radius:8px;border:1px solid rgba(255,68,68,0.3);cursor:pointer">🔄 RESET</button>
    </div>
    <div id="risiko-admin-tab-content"></div>`;
  showAdminRisikoTab('obiettivi', document.getElementById('tab-robj'));
}

function showAdminRisikoTab(tab, btn) {
  document.querySelectorAll('[id^="tab-r"]').forEach(b => {
    b.style.background = b.id==='tab-rreset' ? 'var(--grigio-medio)' : 'var(--grigio-medio)';
    b.style.color = b.id==='tab-rreset' ? 'var(--rosso)' : 'var(--testo)';
    b.style.border = b.id==='tab-rreset' ? '1px solid rgba(255,68,68,0.3)' : '1px solid var(--grigio-chiaro)';
  });
  btn.style.background = tab==='reset' ? 'rgba(255,68,68,0.2)' : 'var(--oro)';
  btn.style.color = tab==='reset' ? 'var(--rosso)' : 'var(--nero)';
  btn.style.border = tab==='reset' ? '1px solid rgba(255,68,68,0.5)' : 'none';

  const content = document.getElementById('risiko-admin-tab-content');
  if (tab==='obiettivi') renderTabObiettivi(content);
  else if (tab==='gestisci') renderTabGestisci(content);
  else if (tab==='reset') renderTabReset(content);
}

// TAB OBIETTIVI
function renderTabObiettivi(container) {
  const diff = ['facile','normale','difficile'];
  const colori = { facile:'var(--verde)', normale:'var(--oro)', difficile:'var(--rosso)' };
  const premi = { facile:5000000, normale:15000000, difficile:45000000 };

  const totNelDB = risikoObiettivi.length;
  const mancanti = 60 - totNelDB;

  let html = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px">
      <div style="font-size:13px;color:var(--testo-dim)">${totNelDB}/60 obiettivi caricati</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${totNelDB === 0 ? `<button onclick="caricaTuttiObiettivi()" style="background:var(--verde);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;padding:8px 16px;border-radius:8px;border:none;cursor:pointer">⚡ CARICA TUTTI I 60</button>` : ''}
        ${mancanti > 0 && totNelDB > 0 ? `<button onclick="caricaTuttiObiettivi()" style="background:rgba(0,255,135,0.1);color:var(--verde);font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;padding:8px 16px;border-radius:8px;border:1px solid rgba(0,255,135,0.3);cursor:pointer">⚡ CARICA MANCANTI (${mancanti})</button>` : ''}
        <button onclick="apriNuovoObiettivo()" style="background:var(--grigio-medio);color:var(--testo);font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;padding:8px 16px;border-radius:8px;border:1px solid var(--grigio-chiaro);cursor:pointer">➕ NUOVO</button>
      </div>
    </div>`;

  diff.forEach(d => {
    const lista = risikoObiettivi.filter(o => o.difficolta === d);
    html += `
      <div style="margin-bottom:18px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:18px;color:${colori[d]};letter-spacing:1px">${d.toUpperCase()}</div>
          <div style="font-size:11px;color:var(--testo-dim);background:var(--grigio-scuro);padding:2px 8px;border-radius:8px">${lista.length}/20</div>
          <div style="font-family:'Space Mono',monospace;font-size:11px;color:${colori[d]}">${(premi[d]/1000000).toFixed(0)}M FM</div>
        </div>
        ${lista.length===0 ? `<div style="color:var(--testo-dim);font-size:13px;padding:10px 0">Nessun obiettivo</div>` :
        lista.map(o => `
          <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--grigio-scuro);border-radius:8px;margin-bottom:6px;border-left:2px solid ${colori[d]}">
            <div style="flex:1;font-size:13px;color:var(--testo);line-height:1.5">${o.testo}</div>
            <div style="display:flex;gap:6px;flex-shrink:0">
              <button onclick="apriModificaObiettivo(${o.id})" style="background:rgba(255,215,0,0.1);color:var(--oro);border:1px solid rgba(255,215,0,0.3);font-size:11px;padding:4px 10px;border-radius:6px;cursor:pointer">✏️</button>
              <button onclick="eliminaObiettivo(${o.id})" style="background:rgba(255,68,68,0.1);color:var(--rosso);border:1px solid rgba(255,68,68,0.3);font-size:11px;padding:4px 10px;border-radius:6px;cursor:pointer">🗑️</button>
            </div>
          </div>`).join('')}
      </div>`;
  });
  container.innerHTML = html;
}

function apriNuovoObiettivo() {
  document.getElementById('risiko-admin-tab-content').innerHTML = `
    <button onclick="showAdminRisikoTab('obiettivi',document.getElementById('tab-robj'))" style="background:none;border:none;color:var(--testo-dim);cursor:pointer;font-size:13px;margin-bottom:16px">← Torna alla lista</button>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:20px;color:var(--verde);letter-spacing:1px;margin-bottom:16px">➕ NUOVO OBIETTIVO</div>
    ${formObiettivo(null)}
    <button onclick="salvaObiettivo(null)" style="background:var(--verde);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:1px;padding:12px;border-radius:10px;border:none;cursor:pointer;width:100%;margin-top:8px" id="btn-salva-obj">💾 SALVA</button>`;
}

function apriModificaObiettivo(id) {
  const obj = risikoObiettivi.find(o => o.id===id);
  if (!obj) return;
  document.getElementById('risiko-admin-tab-content').innerHTML = `
    <button onclick="showAdminRisikoTab('obiettivi',document.getElementById('tab-robj'))" style="background:none;border:none;color:var(--testo-dim);cursor:pointer;font-size:13px;margin-bottom:16px">← Torna alla lista</button>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:20px;color:var(--oro);letter-spacing:1px;margin-bottom:16px">✏️ MODIFICA OBIETTIVO</div>
    ${formObiettivo(obj)}
    <button onclick="salvaObiettivo(${id})" style="background:var(--oro);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:1px;padding:12px;border-radius:10px;border:none;cursor:pointer;width:100%;margin-top:8px" id="btn-salva-obj">💾 AGGIORNA</button>`;
}

function formObiettivo(obj) {
  return `
    <div class="form-group">
      <label class="form-label">Testo obiettivo *</label>
      <textarea id="obj-testo" rows="3" style="width:100%;background:var(--grigio-scuro);border:1px solid var(--grigio-chiaro);border-radius:8px;padding:10px 14px;color:var(--testo);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;resize:vertical">${obj?obj.testo:''}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Difficoltà *</label>
      <select id="obj-difficolta" class="form-select">
        <option value="facile" ${obj&&obj.difficolta==='facile'?'selected':''}>🟢 Facile — 5M FM</option>
        <option value="normale" ${obj&&obj.difficolta==='normale'?'selected':''}>🟡 Normale — 15M FM</option>
        <option value="difficile" ${obj&&obj.difficolta==='difficile'?'selected':''}>🔴 Difficile — 45M FM</option>
      </select>
    </div>`;
}

async function salvaObiettivo(id) {
  const testo = document.getElementById('obj-testo').value.trim();
  const difficolta = document.getElementById('obj-difficolta').value;
  if (!testo) { showToast('❌ Inserisci il testo', 'error'); return; }
  const premi = { facile:5000000, normale:15000000, difficile:45000000 };
  const btn = document.getElementById('btn-salva-obj');
  btn.disabled = true; btn.textContent = 'Salvataggio...';
  try {
    if (id) {
      const { error } = await sb.from('risiko_obiettivi_master').update({ testo, difficolta, premio: premi[difficolta] }).eq('id', id);
      if (error) throw error;
      const idx = risikoObiettivi.findIndex(o => o.id===id);
      if (idx>=0) risikoObiettivi[idx] = { ...risikoObiettivi[idx], testo, difficolta, premio: premi[difficolta] };
      showToast('✅ Aggiornato!');
    } else {
      const { data, error } = await sb.from('risiko_obiettivi_master').insert({ testo, difficolta, premio: premi[difficolta], stagione: STAGIONE_RISIKO, attivo: true }).select().single();
      if (error) throw error;
      risikoObiettivi.push(data);
      showToast('✅ Creato!');
    }
    showAdminRisikoTab('obiettivi', document.getElementById('tab-robj'));
  } catch(e) {
    showToast('❌ '+e.message, 'error');
    btn.disabled=false;
  }
}

async function eliminaObiettivo(id) {
  if (!confirm('Eliminare questo obiettivo?')) return;
  try {
    const { error } = await sb.from('risiko_obiettivi_master').delete().eq('id', id);
    if (error) throw error;
    risikoObiettivi = risikoObiettivi.filter(o => o.id!==id);
    showToast('🗑️ Eliminato');
    showAdminRisikoTab('obiettivi', document.getElementById('tab-robj'));
  } catch(e) { showToast('❌ '+e.message, 'error'); }
}

// Carica tutti e 60 gli obiettivi (solo quelli mancanti)
async function caricaTuttiObiettivi() {
  const esistenti = risikoObiettivi.map(o => o.testo.substring(0,30));
  const tuttiGliObiettivi = [
    ...OBIETTIVI_FACILI.map(t => ({ testo:t, difficolta:'facile', premio:5000000 })),
    ...OBIETTIVI_NORMALI.map(t => ({ testo:t, difficolta:'normale', premio:15000000 })),
    ...OBIETTIVI_DIFFICILI.map(t => ({ testo:t, difficolta:'difficile', premio:45000000 }))
  ];
  const daInserire = tuttiGliObiettivi.filter(o => !esistenti.some(e => e === o.testo.substring(0,30)));
  if (daInserire.length === 0) { showToast('✅ Tutti gli obiettivi sono già presenti!'); return; }
  if (!confirm(`Caricare ${daInserire.length} obiettivi nel database?`)) return;
  showToast('⏳ Caricamento...', 'info');
  try {
    const rows = daInserire.map(o => ({ ...o, stagione: STAGIONE_RISIKO, attivo: true }));
    const { data, error } = await sb.from('risiko_obiettivi_master').insert(rows).select();
    if (error) throw error;
    risikoObiettivi = [...risikoObiettivi, ...data];
    showToast(`✅ ${data.length} obiettivi caricati!`);
    showAdminRisikoTab('obiettivi', document.getElementById('tab-robj'));
  } catch(e) { showToast('❌ '+e.message, 'error'); }
}

// TAB GESTISCI — marca completati
function renderTabGestisci(container) {
  const colori = { facile:'var(--verde)', normale:'var(--oro)', difficile:'var(--rosso)' };
  let html = `<div style="font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--testo);letter-spacing:1px;margin-bottom:12px">STATO OBIETTIVI PER SQUADRA</div>`;
  let qualcuno = false;
  squadreDB.forEach(sq => {
    const assegn = risikoAssegnazioni.filter(a => a.squadra_id===sq.id);
    if (assegn.length===0) return;
    qualcuno = true;
    html += `
      <div style="background:var(--grigio-scuro);border:1px solid var(--grigio-chiaro);border-radius:12px;padding:16px;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          ${sq.logo_url?`<img src="${sq.logo_url}" style="width:24px;height:24px;object-fit:contain;border-radius:4px">`:''}
          <div style="font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1px">${sq.nome}</div>
        </div>`;
    assegn.forEach(a => {
      const obj = risikoObiettivi.find(o => o.id===a.obiettivo_id);
      if (!obj) return;
      const col = colori[obj.difficolta]||'var(--testo)';
      html += `
        <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--grigio);border-radius:8px;margin-bottom:6px;border-left:2px solid ${a.completato?'var(--verde)':col}">
          <div style="flex:1">
            <div style="font-size:10px;color:${col};font-weight:700;text-transform:uppercase;margin-bottom:3px">${obj.difficolta} — ${(obj.premio/1000000).toFixed(0)}M FM</div>
            <div style="font-size:12px;color:var(--testo);line-height:1.4">${obj.testo}</div>
          </div>
          <div style="flex-shrink:0">
            ${a.completato
              ? `<div style="text-align:center"><div style="font-size:11px;color:var(--verde);font-weight:700">✅ FATTO</div><button onclick="annullaCompletamento(${a.id},'${sq.id}')" style="font-size:10px;color:var(--testo-dim);background:none;border:none;cursor:pointer;text-decoration:underline;margin-top:2px">Annulla</button></div>`
              : `<button onclick="marcaCompletato(${a.id},'${sq.id}',${obj.premio})" style="background:rgba(0,255,135,0.1);color:var(--verde);border:1px solid rgba(0,255,135,0.3);font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:1px;padding:6px 12px;border-radius:8px;cursor:pointer">✅ COMPLETA</button>`}
          </div>
        </div>`;
    });
    html += `</div>`;
  });
  if (!qualcuno) html += `<div style="text-align:center;padding:30px;color:var(--testo-dim)">Nessuna squadra ha ancora pescato gli obiettivi</div>`;
  container.innerHTML = html;
}

async function marcaCompletato(assegnId, sqId, premio) {
  if (!confirm(`Marcare come completato e accreditare ${(premio/1000000).toFixed(0)}M FM?`)) return;
  try {
    const { error } = await sb.from('risiko_assegnazioni').update({ completato:true, data_completamento: new Date().toISOString() }).eq('id', assegnId);
    if (error) throw error;
    const sq = squadreDB.find(s => s.id===sqId);
    if (sq) {
      const nuovoBudget = (sq.budget||0) + premio;
      await sb.from('squadre').update({ budget: nuovoBudget }).eq('id', sqId);
      const idx = squadreDB.findIndex(s => s.id===sqId);
      if (idx>=0) squadreDB[idx].budget = nuovoBudget;
    }
    const idx = risikoAssegnazioni.findIndex(a => a.id===assegnId);
    if (idx>=0) { risikoAssegnazioni[idx].completato=true; risikoAssegnazioni[idx].data_completamento=new Date().toISOString(); }
    showToast(`✅ +${(premio/1000000).toFixed(0)}M FM accreditati!`);
    renderTabGestisci(document.getElementById('risiko-admin-tab-content'));
  } catch(e) { showToast('❌ '+e.message, 'error'); }
}

async function annullaCompletamento(assegnId, sqId) {
  const assegn = risikoAssegnazioni.find(a => a.id===assegnId);
  const obj = assegn ? risikoObiettivi.find(o => o.id===assegn.obiettivo_id) : null;
  if (!confirm('Annullare il completamento? Il premio verrà sottratto.')) return;
  try {
    const { error } = await sb.from('risiko_assegnazioni').update({ completato:false, data_completamento:null }).eq('id', assegnId);
    if (error) throw error;
    if (obj) {
      const sq = squadreDB.find(s => s.id===sqId);
      if (sq) {
        const nuovoBudget = (sq.budget||0) - obj.premio;
        await sb.from('squadre').update({ budget: nuovoBudget }).eq('id', sqId);
        const idx = squadreDB.findIndex(s => s.id===sqId);
        if (idx>=0) squadreDB[idx].budget = nuovoBudget;
      }
    }
    const idx = risikoAssegnazioni.findIndex(a => a.id===assegnId);
    if (idx>=0) { risikoAssegnazioni[idx].completato=false; risikoAssegnazioni[idx].data_completamento=null; }
    showToast('↩️ Annullato');
    renderTabGestisci(document.getElementById('risiko-admin-tab-content'));
  } catch(e) { showToast('❌ '+e.message, 'error'); }
}

// TAB RESET — per annullare pesca di una squadra
function renderTabReset(container) {
  let html = `
    <div style="background:rgba(255,68,68,0.06);border:1px solid rgba(255,68,68,0.2);border-radius:10px;padding:14px;margin-bottom:16px;font-size:12px;color:var(--testo-dim);line-height:1.7">
      ⚠️ Da qui puoi resettare gli obiettivi pescati da una squadra specifica (es. se ha pescato per errore). Gli obiettivi torneranno disponibili per la pesca.
    </div>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--testo);letter-spacing:1px;margin-bottom:12px">RESET PESCA PER SQUADRA</div>`;

  squadreDB.forEach(sq => {
    const assegn = risikoAssegnazioni.filter(a => a.squadra_id===sq.id);
    const haPescato = assegn.length > 0;
    html += `
      <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--grigio-scuro);border-radius:10px;margin-bottom:8px">
        ${sq.logo_url?`<img src="${sq.logo_url}" style="width:24px;height:24px;object-fit:contain;border-radius:4px">`:''}
        <div style="flex:1">
          <div style="font-size:14px;font-weight:600">${sq.nome}</div>
          <div style="font-size:11px;color:${haPescato?'var(--verde)':'var(--testo-dim)'}">${haPescato?'🎯 Ha pescato ('+assegn.length+' obiettivi)':'⏳ Non ha ancora pescato'}</div>
        </div>
        ${haPescato ? `<button onclick="resetPescaSquadra('${sq.id}','${sq.nome}')" style="background:rgba(255,68,68,0.1);color:var(--rosso);border:1px solid rgba(255,68,68,0.3);font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:1px;padding:6px 14px;border-radius:8px;cursor:pointer">🔄 RESET</button>` : ''}
      </div>`;
  });
  container.innerHTML = html;
}

async function resetPescaSquadra(sqId, nome) {
  if (!confirm(`Resettare gli obiettivi di ${nome}? La squadra dovrà ripescare.`)) return;
  try {
    const { error } = await sb.from('risiko_assegnazioni').delete().eq('squadra_id', sqId).eq('stagione', STAGIONE_RISIKO);
    if (error) throw error;
    risikoAssegnazioni = risikoAssegnazioni.filter(a => !(a.squadra_id===sqId && a.stagione===STAGIONE_RISIKO));
    showToast(`🔄 Reset completato per ${nome}`);
    renderTabReset(document.getElementById('risiko-admin-tab-content'));
  } catch(e) { showToast('❌ '+e.message, 'error'); }
}
