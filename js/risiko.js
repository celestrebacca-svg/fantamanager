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

// ===== RENDER SEZIONE RISIKO =====
async function renderRisiko() {
  const container = document.getElementById('risiko-content');
  if (!container) return;
  container.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Caricamento...</div>';
  await caricaRisiko();

  // Se non ci sono obiettivi nel DB, mostra setup per admin
  if (risikoObiettivi.length === 0 && adminLoggato) {
    container.innerHTML = `
      <div style="text-align:center;padding:40px 20px">
        <div style="font-size:50px;margin-bottom:16px">🎯</div>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:28px;color:var(--oro);letter-spacing:2px;margin-bottom:8px">NESSUN OBIETTIVO CARICATO</div>
        <div style="color:var(--testo-dim);font-size:14px;margin-bottom:24px">Carica prima gli obiettivi nel database, poi assegnali alle squadre.</div>
        <button onclick="apriAdminRisiko()" style="background:var(--oro);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:1px;padding:12px 28px;border-radius:10px;border:none;cursor:pointer">⚙️ GESTISCI OBIETTIVI</button>
      </div>`;
    return;
  }

  // Vista utente normale
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
    const sq = squadreDB.find(s => s.id === sqId);
    html += `
      <div style="background:linear-gradient(135deg,rgba(255,215,0,0.08),rgba(255,215,0,0.03));border:1px solid rgba(255,215,0,0.3);border-radius:14px;padding:20px;margin-bottom:24px">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:22px;color:var(--oro);letter-spacing:2px;margin-bottom:4px">🎯 I MIEI OBIETTIVI</div>
        <div style="font-size:12px;color:var(--testo-dim);margin-bottom:16px">Solo tu puoi vedere i tuoi obiettivi</div>`;

    if (mieAssegnazioni.length === 0) {
      html += `<div style="text-align:center;padding:20px 0;color:var(--testo-dim)">⏳ Gli obiettivi non sono ancora stati assegnati dall'admin</div>`;
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

  // CLASSIFICA GENERALE (quanti hanno completato)
  html += renderClassificaRisiko();
  container.innerHTML = html;
}

function renderClassificaRisiko() {
  const righe = squadreDB.map(sq => {
    const assegn = risikoAssegnazioni.filter(a => a.squadra_id === sq.id);
    const completati = assegn.filter(a => a.completato).length;
    const totFM = assegn.filter(a => a.completato).reduce((s, a) => {
      const o = risikoObiettivi.find(x => x.id === a.obiettivo_id);
      return s + (o ? o.premio : 0);
    }, 0);
    const assegnati = assegn.length;
    return { sq, completati, totFM, assegnati };
  }).sort((a, b) => b.completati - a.completati || b.totFM - a.totFM);

  const logoHtml = sq => sq.logo_url
    ? `<img src="${sq.logo_url}" style="width:28px;height:28px;object-fit:contain;border-radius:4px">`
    : `<span style="font-family:'Bebas Neue',sans-serif;font-size:12px;color:var(--nero)">${sq.avatar || '⚽'}</span>`;

  return `
    <div style="margin-bottom:20px">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:22px;color:var(--testo);letter-spacing:2px;margin-bottom:14px">📊 CLASSIFICA RISIKO</div>
      <div style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:12px;overflow:hidden">
        <div style="display:grid;grid-template-columns:40px 1fr 80px 80px;gap:0;padding:10px 16px;border-bottom:1px solid var(--grigio-chiaro);font-size:10px;color:var(--testo-dim);text-transform:uppercase;letter-spacing:1px">
          <div>#</div><div>Squadra</div><div style="text-align:center">Completati</div><div style="text-align:right">FM</div>
        </div>
        ${righe.map((r, i) => {
          const rankCol = i === 0 ? 'var(--oro)' : i === 1 ? 'var(--argento)' : i === 2 ? '#cd7f32' : 'var(--testo-dim)';
          return `
          <div style="display:grid;grid-template-columns:40px 1fr 80px 80px;gap:0;padding:12px 16px;border-bottom:1px solid var(--grigio-chiaro);align-items:center${i === righe.length - 1 ? ';border-bottom:none' : ''}">
            <div style="font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:${rankCol}">${i + 1}</div>
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:28px;height:28px;border-radius:6px;background:${r.sq.avatar_bg || '#333'};display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">${logoHtml(r.sq)}</div>
              <div>
                <div style="font-size:13px;font-weight:600">${r.sq.nome}</div>
                <div style="font-size:10px;color:var(--testo-dim)">${r.assegnati > 0 ? `${r.assegnati} obiettivi assegnati` : 'Nessun obiettivo'}</div>
              </div>
            </div>
            <div style="text-align:center">
              ${r.assegnati > 0
                ? `<span style="font-family:'Space Mono',monospace;font-size:15px;font-weight:700;color:${r.completati > 0 ? 'var(--verde)' : 'var(--testo-dim)'}">${r.completati}/${r.assegnati}</span>`
                : `<span style="color:var(--testo-dim);font-size:12px">—</span>`}
            </div>
            <div style="text-align:right;font-family:'Space Mono',monospace;font-size:13px;font-weight:700;color:${r.totFM > 0 ? 'var(--oro)' : 'var(--testo-dim)'}">
              ${r.totFM > 0 ? '+' + (r.totFM / 1000000).toFixed(0) + 'M' : '—'}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

// ===== PANNELLO ADMIN RISIKO =====
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
      <button onclick="showAdminRisikoTab('assegna',this)" id="tab-rassegna" style="background:var(--grigio-medio);color:var(--testo);font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;padding:8px 18px;border-radius:8px;border:1px solid var(--grigio-chiaro);cursor:pointer">🎯 ASSEGNA</button>
      <button onclick="showAdminRisikoTab('gestisci',this)" id="tab-rgestisci" style="background:var(--grigio-medio);color:var(--testo);font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;padding:8px 18px;border-radius:8px;border:1px solid var(--grigio-chiaro);cursor:pointer">✅ GESTISCI</button>
    </div>
    <div id="risiko-admin-tab-content"></div>`;
  showAdminRisikoTab('obiettivi', document.getElementById('tab-robj'));
}

function showAdminRisikoTab(tab, btn) {
  document.querySelectorAll('[id^="tab-r"]').forEach(b => {
    b.style.background = 'var(--grigio-medio)';
    b.style.color = 'var(--testo)';
    b.style.border = '1px solid var(--grigio-chiaro)';
  });
  btn.style.background = 'var(--oro)';
  btn.style.color = 'var(--nero)';
  btn.style.border = 'none';

  const content = document.getElementById('risiko-admin-tab-content');
  if (tab === 'obiettivi') renderTabObiettivi(content);
  else if (tab === 'assegna') renderTabAssegna(content);
  else if (tab === 'gestisci') renderTabGestisci(content);
}

// TAB OBIETTIVI — visualizza e modifica i 60 obiettivi
function renderTabObiettivi(container) {
  const diff = ['facile', 'normale', 'difficile'];
  const colori = { facile: 'var(--verde)', normale: 'var(--oro)', difficile: 'var(--rosso)' };
  const premi = { facile: 5000000, normale: 15000000, difficile: 45000000 };

  let html = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px">
      <div style="font-size:13px;color:var(--testo-dim)">${risikoObiettivi.length} obiettivi caricati</div>
      ${risikoObiettivi.length === 0 ? `<button onclick="caricaObiettiviDefault()" style="background:var(--verde);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:1px;padding:8px 18px;border-radius:8px;border:none;cursor:pointer">⚡ CARICA OBIETTIVI FACILI</button>` : ''}
      <button onclick="apriNuovoObiettivo()" style="background:var(--grigio-medio);color:var(--testo);font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;padding:8px 16px;border-radius:8px;border:1px solid var(--grigio-chiaro);cursor:pointer">➕ NUOVO</button>
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
        ${lista.length === 0 ? `<div style="color:var(--testo-dim);font-size:13px;padding:10px 0">Nessun obiettivo caricato</div>` :
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

// FORM NUOVO/MODIFICA OBIETTIVO
function apriNuovoObiettivo() {
  document.getElementById('risiko-admin-tab-content').innerHTML = `
    <button onclick="showAdminRisikoTab('obiettivi',document.getElementById('tab-robj'))" style="background:none;border:none;color:var(--testo-dim);cursor:pointer;font-size:13px;margin-bottom:16px">← Torna alla lista</button>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:20px;color:var(--verde);letter-spacing:1px;margin-bottom:16px">➕ NUOVO OBIETTIVO</div>
    ${formObiettivo(null)}
    <button onclick="salvaObiettivo(null)" style="background:var(--verde);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:1px;padding:12px;border-radius:10px;border:none;cursor:pointer;width:100%;margin-top:8px" id="btn-salva-obj">💾 SALVA OBIETTIVO</button>`;
}

function apriModificaObiettivo(id) {
  const obj = risikoObiettivi.find(o => o.id === id);
  if (!obj) return;
  document.getElementById('risiko-admin-tab-content').innerHTML = `
    <button onclick="showAdminRisikoTab('obiettivi',document.getElementById('tab-robj'))" style="background:none;border:none;color:var(--testo-dim);cursor:pointer;font-size:13px;margin-bottom:16px">← Torna alla lista</button>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:20px;color:var(--oro);letter-spacing:1px;margin-bottom:16px">✏️ MODIFICA OBIETTIVO</div>
    ${formObiettivo(obj)}
    <button onclick="salvaObiettivo(${id})" style="background:var(--oro);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:1px;padding:12px;border-radius:10px;border:none;cursor:pointer;width:100%;margin-top:8px" id="btn-salva-obj">💾 AGGIORNA OBIETTIVO</button>`;
}

function formObiettivo(obj) {
  return `
    <div class="form-group">
      <label class="form-label">Testo obiettivo *</label>
      <textarea id="obj-testo" rows="3" style="width:100%;background:var(--grigio-scuro);border:1px solid var(--grigio-chiaro);border-radius:8px;padding:10px 14px;color:var(--testo);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;resize:vertical" placeholder="Descrivi l'obiettivo...">${obj ? obj.testo : ''}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Difficoltà *</label>
      <select id="obj-difficolta" class="form-select">
        <option value="facile" ${obj && obj.difficolta === 'facile' ? 'selected' : ''}>🟢 Facile — 5M FM</option>
        <option value="normale" ${obj && obj.difficolta === 'normale' ? 'selected' : ''}>🟡 Normale — 15M FM</option>
        <option value="difficile" ${obj && obj.difficolta === 'difficile' ? 'selected' : ''}>🔴 Difficile — 45M FM</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Stagione</label>
      <input id="obj-stagione" class="form-input" type="text" value="${obj ? obj.stagione : STAGIONE_RISIKO}">
    </div>`;
}

async function salvaObiettivo(id) {
  const testo = document.getElementById('obj-testo').value.trim();
  const difficolta = document.getElementById('obj-difficolta').value;
  const stagione = document.getElementById('obj-stagione').value.trim() || STAGIONE_RISIKO;
  if (!testo) { showToast('❌ Inserisci il testo dell\'obiettivo', 'error'); return; }
  const premi = { facile: 5000000, normale: 15000000, difficile: 45000000 };
  const btn = document.getElementById('btn-salva-obj');
  btn.disabled = true; btn.textContent = 'Salvataggio...';
  try {
    if (id) {
      const { error } = await sb.from('risiko_obiettivi_master').update({ testo, difficolta, premio: premi[difficolta], stagione }).eq('id', id);
      if (error) throw error;
      const idx = risikoObiettivi.findIndex(o => o.id === id);
      if (idx >= 0) risikoObiettivi[idx] = { ...risikoObiettivi[idx], testo, difficolta, premio: premi[difficolta], stagione };
      showToast('✅ Obiettivo aggiornato!');
    } else {
      const { data, error } = await sb.from('risiko_obiettivi_master').insert({ testo, difficolta, premio: premi[difficolta], stagione, attivo: true }).select().single();
      if (error) throw error;
      risikoObiettivi.push(data);
      showToast('✅ Obiettivo creato!');
    }
    showAdminRisikoTab('obiettivi', document.getElementById('tab-robj'));
  } catch (e) {
    showToast('❌ Errore: ' + e.message, 'error');
    btn.disabled = false; btn.textContent = id ? '💾 AGGIORNA' : '💾 SALVA';
  }
}

async function eliminaObiettivo(id) {
  if (!confirm('Eliminare questo obiettivo?')) return;
  try {
    const { error } = await sb.from('risiko_obiettivi_master').delete().eq('id', id);
    if (error) throw error;
    risikoObiettivi = risikoObiettivi.filter(o => o.id !== id);
    showToast('🗑️ Obiettivo eliminato');
    showAdminRisikoTab('obiettivi', document.getElementById('tab-robj'));
  } catch (e) { showToast('❌ Errore: ' + e.message, 'error'); }
}

// Carica i 20 obiettivi facili di default nel DB
async function caricaObiettiviDefault() {
  if (!confirm(`Caricare i 20 obiettivi FACILI nel database?`)) return;
  showToast('⏳ Caricamento in corso...', 'info');
  try {
    const rows = OBIETTIVI_FACILI.map(testo => ({ testo, difficolta: 'facile', premio: 5000000, stagione: STAGIONE_RISIKO, attivo: true }));
    const { data, error } = await sb.from('risiko_obiettivi_master').insert(rows).select();
    if (error) throw error;
    risikoObiettivi = [...risikoObiettivi, ...data];
    showToast(`✅ ${data.length} obiettivi caricati!`);
    showAdminRisikoTab('obiettivi', document.getElementById('tab-robj'));
  } catch (e) { showToast('❌ Errore: ' + e.message, 'error'); }
}

// TAB ASSEGNA — assegna obiettivi a ogni squadra
function renderTabAssegna(container) {
  if (risikoObiettivi.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:30px;color:var(--testo-dim)">Prima carica gli obiettivi nel tab "OBIETTIVI"</div>`;
    return;
  }

  const facili = risikoObiettivi.filter(o => o.difficolta === 'facile' && o.attivo);
  const normali = risikoObiettivi.filter(o => o.difficolta === 'normale' && o.attivo);
  const difficili = risikoObiettivi.filter(o => o.difficolta === 'difficile' && o.attivo);

  let html = `
    <div style="background:rgba(255,215,0,0.06);border:1px solid rgba(255,215,0,0.2);border-radius:10px;padding:14px;margin-bottom:16px;font-size:12px;color:var(--testo-dim);line-height:1.7">
      ⚠️ Ogni squadra riceve 1 obiettivo per difficoltà. Lo stesso obiettivo non può essere assegnato a più squadre nella stessa stagione.
    </div>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--testo);letter-spacing:1px;margin-bottom:12px">ASSEGNA OBIETTIVI PER SQUADRA</div>`;

  squadreDB.forEach(sq => {
    const assegn = risikoAssegnazioni.filter(a => a.squadra_id === sq.id);
    const haFacile = assegn.find(a => { const o = risikoObiettivi.find(x => x.id === a.obiettivo_id); return o && o.difficolta === 'facile'; });
    const haNormale = assegn.find(a => { const o = risikoObiettivi.find(x => x.id === a.obiettivo_id); return o && o.difficolta === 'normale'; });
    const haDifficile = assegn.find(a => { const o = risikoObiettivi.find(x => x.id === a.obiettivo_id); return o && o.difficolta === 'difficile'; });

    // Obiettivi già assegnati ad altre squadre
    const usatiFacili = risikoAssegnazioni.filter(a => a.squadra_id !== sq.id).map(a => a.obiettivo_id);

    html += `
      <div style="background:var(--grigio-scuro);border:1px solid var(--grigio-chiaro);border-radius:12px;padding:16px;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
          ${sq.logo_url ? `<img src="${sq.logo_url}" style="width:28px;height:28px;object-fit:contain;border-radius:4px">` : ''}
          <div style="font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:1px">${sq.nome}</div>
          <div style="font-size:11px;color:var(--testo-dim);margin-left:auto">${assegn.length}/3 assegnati</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
          ${renderSelectObiettivo(sq.id, 'facile', facili, haFacile, usatiFacili)}
          ${renderSelectObiettivo(sq.id, 'normale', normali, haNormale, usatiFacili)}
          ${renderSelectObiettivo(sq.id, 'difficile', difficili, haDifficile, usatiFacili)}
        </div>
      </div>`;
  });

  html += `<button onclick="assegnaRandom()" style="background:var(--grigio-medio);color:var(--testo);font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1px;padding:10px 20px;border-radius:8px;border:1px solid var(--grigio-chiaro);cursor:pointer;margin-top:4px">🎲 ASSEGNA RANDOM TUTTE LE SQUADRE</button>`;
  container.innerHTML = html;
}

function renderSelectObiettivo(sqId, diff, lista, corrente, usati) {
  const colori = { facile: 'var(--verde)', normale: 'var(--oro)', difficile: 'var(--rosso)' };
  const col = colori[diff];
  const liberi = lista.filter(o => !usati.includes(o.id) || (corrente && o.id === corrente.obiettivo_id));
  return `
    <div>
      <div style="font-size:10px;font-weight:700;color:${col};text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">${diff}</div>
      <select onchange="assegnaObiettivo('${sqId}','${diff}',this.value)" style="width:100%;background:var(--grigio);border:1px solid ${corrente ? col : 'var(--grigio-chiaro)'};border-radius:8px;padding:8px 10px;color:var(--testo);font-size:12px;outline:none;cursor:pointer">
        <option value="">— Seleziona —</option>
        ${liberi.map(o => `<option value="${o.id}" ${corrente && corrente.obiettivo_id === o.id ? 'selected' : ''}>${o.testo.substring(0, 35)}${o.testo.length > 35 ? '...' : ''}</option>`).join('')}
      </select>
      ${corrente ? `<button onclick="rimuoviAssegnazione('${sqId}','${diff}')" style="width:100%;margin-top:4px;background:rgba(255,68,68,0.1);color:var(--rosso);border:1px solid rgba(255,68,68,0.3);font-size:10px;padding:3px;border-radius:5px;cursor:pointer">🗑️ Rimuovi</button>` : ''}
    </div>`;
}

async function assegnaObiettivo(sqId, diff, objId) {
  if (!objId) return;
  // Rimuovi eventuale precedente della stessa difficoltà
  const vecchio = risikoAssegnazioni.find(a => {
    const o = risikoObiettivi.find(x => x.id === a.obiettivo_id);
    return a.squadra_id === sqId && o && o.difficolta === diff;
  });
  if (vecchio) {
    await sb.from('risiko_assegnazioni').delete().eq('id', vecchio.id);
    risikoAssegnazioni = risikoAssegnazioni.filter(a => a.id !== vecchio.id);
  }
  try {
    const { data, error } = await sb.from('risiko_assegnazioni').insert({
      squadra_id: sqId, obiettivo_id: parseInt(objId), difficolta: diff,
      completato: false, stagione: STAGIONE_RISIKO
    }).select().single();
    if (error) throw error;
    risikoAssegnazioni.push(data);
    showToast('✅ Obiettivo assegnato!');
    renderTabAssegna(document.getElementById('risiko-admin-tab-content'));
  } catch (e) { showToast('❌ Errore: ' + e.message, 'error'); }
}

async function rimuoviAssegnazione(sqId, diff) {
  const assegn = risikoAssegnazioni.find(a => {
    const o = risikoObiettivi.find(x => x.id === a.obiettivo_id);
    return a.squadra_id === sqId && o && o.difficolta === diff;
  });
  if (!assegn) return;
  try {
    const { error } = await sb.from('risiko_assegnazioni').delete().eq('id', assegn.id);
    if (error) throw error;
    risikoAssegnazioni = risikoAssegnazioni.filter(a => a.id !== assegn.id);
    showToast('🗑️ Assegnazione rimossa');
    renderTabAssegna(document.getElementById('risiko-admin-tab-content'));
  } catch (e) { showToast('❌ Errore: ' + e.message, 'error'); }
}

// Assegna random a tutte le squadre che non hanno ancora obiettivi
async function assegnaRandom() {
  if (!confirm('Assegnare obiettivi RANDOM a tutte le squadre senza obiettivi?')) return;
  const diff = ['facile', 'normale', 'difficile'];
  let assegnati = 0;
  for (const d of diff) {
    const lista = risikoObiettivi.filter(o => o.difficolta === d && o.attivo);
    const usati = risikoAssegnazioni.filter(a => {
      const o = risikoObiettivi.find(x => x.id === a.obiettivo_id);
      return o && o.difficolta === d;
    }).map(a => a.obiettivo_id);
    const disponibili = lista.filter(o => !usati.includes(o.id));
    const shuffled = disponibili.sort(() => Math.random() - 0.5);
    let idx = 0;
    for (const sq of squadreDB) {
      const haGia = risikoAssegnazioni.find(a => {
        const o = risikoObiettivi.find(x => x.id === a.obiettivo_id);
        return a.squadra_id === sq.id && o && o.difficolta === d;
      });
      if (haGia) continue;
      if (idx >= shuffled.length) { showToast(`⚠️ Obiettivi ${d} esauriti!`, 'error'); break; }
      try {
        const { data, error } = await sb.from('risiko_assegnazioni').insert({
          squadra_id: sq.id, obiettivo_id: shuffled[idx].id, difficolta: d,
          completato: false, stagione: STAGIONE_RISIKO
        }).select().single();
        if (error) throw error;
        risikoAssegnazioni.push(data);
        assegnati++; idx++;
      } catch (e) { console.error(e); }
    }
  }
  showToast(`✅ ${assegnati} obiettivi assegnati!`);
  renderTabAssegna(document.getElementById('risiko-admin-tab-content'));
}

// TAB GESTISCI — marca completati e assegna premi
function renderTabGestisci(container) {
  const colori = { facile: 'var(--verde)', normale: 'var(--oro)', difficile: 'var(--rosso)' };

  let html = `<div style="font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--testo);letter-spacing:1px;margin-bottom:12px">STATO OBIETTIVI PER SQUADRA</div>`;

  squadreDB.forEach(sq => {
    const assegn = risikoAssegnazioni.filter(a => a.squadra_id === sq.id);
    if (assegn.length === 0) return;
    html += `
      <div style="background:var(--grigio-scuro);border:1px solid var(--grigio-chiaro);border-radius:12px;padding:16px;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          ${sq.logo_url ? `<img src="${sq.logo_url}" style="width:24px;height:24px;object-fit:contain;border-radius:4px">` : ''}
          <div style="font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1px">${sq.nome}</div>
        </div>`;
    assegn.forEach(a => {
      const obj = risikoObiettivi.find(o => o.id === a.obiettivo_id);
      if (!obj) return;
      const col = colori[obj.difficolta] || 'var(--testo)';
      html += `
        <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--grigio);border-radius:8px;margin-bottom:6px;border-left:2px solid ${a.completato ? 'var(--verde)' : col}">
          <div style="flex:1">
            <div style="font-size:10px;color:${col};font-weight:700;text-transform:uppercase;margin-bottom:3px">${obj.difficolta} — ${(obj.premio/1000000).toFixed(0)}M FM</div>
            <div style="font-size:12px;color:var(--testo);line-height:1.4">${obj.testo}</div>
          </div>
          <div style="flex-shrink:0">
            ${a.completato
              ? `<div style="text-align:center"><div style="font-size:11px;color:var(--verde);font-weight:700">✅ COMPLETATO</div><button onclick="annullaCompletamento(${a.id},'${sq.id}')" style="font-size:10px;color:var(--testo-dim);background:none;border:none;cursor:pointer;text-decoration:underline;margin-top:2px">Annulla</button></div>`
              : `<button onclick="marcaCompletato(${a.id},'${sq.id}',${obj.premio})" style="background:rgba(0,255,135,0.1);color:var(--verde);border:1px solid rgba(0,255,135,0.3);font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:1px;padding:6px 12px;border-radius:8px;cursor:pointer">✅ COMPLETA</button>`}
          </div>
        </div>`;
    });
    html += `</div>`;
  });

  if (html === `<div style="font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--testo);letter-spacing:1px;margin-bottom:12px">STATO OBIETTIVI PER SQUADRA</div>`) {
    html += `<div style="text-align:center;padding:30px;color:var(--testo-dim)">Nessun obiettivo assegnato ancora. Vai nel tab ASSEGNA.</div>`;
  }
  container.innerHTML = html;
}

async function marcaCompletato(assegnId, sqId, premio) {
  if (!confirm(`Marcare come completato e accreditare ${(premio/1000000).toFixed(0)}M FM alla squadra?`)) return;
  try {
    const { error } = await sb.from('risiko_assegnazioni').update({
      completato: true, data_completamento: new Date().toISOString()
    }).eq('id', assegnId);
    if (error) throw error;

    // Aggiorna budget squadra
    const sq = squadreDB.find(s => s.id === sqId);
    if (sq) {
      const nuovoBudget = (sq.budget || 0) + premio;
      await sb.from('squadre').update({ budget: nuovoBudget }).eq('id', sqId);
      const idx = squadreDB.findIndex(s => s.id === sqId);
      if (idx >= 0) squadreDB[idx].budget = nuovoBudget;
    }

    // Aggiorna in memoria
    const idx = risikoAssegnazioni.findIndex(a => a.id === assegnId);
    if (idx >= 0) { risikoAssegnazioni[idx].completato = true; risikoAssegnazioni[idx].data_completamento = new Date().toISOString(); }

    showToast(`✅ Completato! +${(premio/1000000).toFixed(0)}M FM accreditati`);
    renderTabGestisci(document.getElementById('risiko-admin-tab-content'));
  } catch (e) { showToast('❌ Errore: ' + e.message, 'error'); }
}

async function annullaCompletamento(assegnId, sqId) {
  const assegn = risikoAssegnazioni.find(a => a.id === assegnId);
  const obj = assegn ? risikoObiettivi.find(o => o.id === assegn.obiettivo_id) : null;
  if (!confirm('Annullare il completamento? Il premio verrà sottratto dal budget.')) return;
  try {
    const { error } = await sb.from('risiko_assegnazioni').update({ completato: false, data_completamento: null }).eq('id', assegnId);
    if (error) throw error;

    if (obj) {
      const sq = squadreDB.find(s => s.id === sqId);
      if (sq) {
        const nuovoBudget = (sq.budget || 0) - obj.premio;
        await sb.from('squadre').update({ budget: nuovoBudget }).eq('id', sqId);
        const idx = squadreDB.findIndex(s => s.id === sqId);
        if (idx >= 0) squadreDB[idx].budget = nuovoBudget;
      }
    }

    const idx = risikoAssegnazioni.findIndex(a => a.id === assegnId);
    if (idx >= 0) { risikoAssegnazioni[idx].completato = false; risikoAssegnazioni[idx].data_completamento = null; }

    showToast('↩️ Completamento annullato');
    renderTabGestisci(document.getElementById('risiko-admin-tab-content'));
  } catch (e) { showToast('❌ Errore: ' + e.message, 'error'); }
}
