// ===== SISTEMA BILANCIO =====

let bilancioStagione = '2024/25';
let bilancioNuovaStagione = '2025/26';
let bilancePending = [];
let rateMercato = [];

// ===== CARICA DATI =====
async function caricaBilancioAdmin() {
  try {
    const [{ data: bp }, { data: rm }] = await Promise.all([
      sb.from('bilancio_pending').select('*').order('created_at', { ascending: false }),
      sb.from('rate_mercato').select('*').order('data_scadenza')
    ]);
    bilancePending = bp || [];
    rateMercato = rm || [];
  } catch(e) {
    console.error('Errore caricamento bilancio:', e);
  }
}

// ===== RENDER SEZIONE BILANCIO (per utente) =====
async function renderBilancio() {
  const container = document.getElementById('bilancio-content');
  if (!container) return;
  container.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Caricamento...</div>';
  await caricaBilancioAdmin();

  const sqId = utenteLoggato ? utenteLoggato.id : null;
  const sq = sqId ? squadreDB.find(s => s.id === sqId) : null;

  let html = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px">
      <div>
        <div class="page-title">💰 BILANCIO</div>
        <div class="page-sub">Stagione ${bilancioStagione}</div>
      </div>
      ${adminLoggato ? `<button onclick="apriAdminBilancio()" style="background:var(--oro);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:1px;padding:10px 20px;border-radius:8px;border:none;cursor:pointer">⚙️ ADMIN BILANCIO</button>` : ''}
    </div>`;

  if (sq) {
    // Budget attuale
    const budget = sq.budget || 0;
    const budgetColor = budget >= 0 ? 'var(--verde)' : 'var(--rosso)';
    html += `
      <div style="background:linear-gradient(135deg,rgba(255,215,0,0.08),rgba(0,0,0,0));border:1px solid rgba(255,215,0,0.3);border-radius:14px;padding:20px;margin-bottom:20px">
        <div style="font-size:12px;color:var(--testo-dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Budget Attuale</div>
        <div style="font-family:'Space Mono',monospace;font-size:32px;font-weight:700;color:${budgetColor}">${fmtBudget(budget)}</div>
        <div style="font-size:11px;color:var(--testo-dim);margin-top:4px">Scadenza bilancio: 15 giugno 2025</div>
      </div>`;

    // Rate in scadenza per questa squadra
    const mieRate = rateMercato.filter(r => r.squadra_debitrice_id === sqId && !r.pagata);
    if (mieRate.length > 0) {
      html += `
        <div style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:14px;padding:16px;margin-bottom:20px">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--rosso);letter-spacing:1px;margin-bottom:12px">⚠️ RATE DA PAGARE</div>
          ${mieRate.map(r => {
            const scad = new Date(r.data_scadenza);
            const oggi = new Date();
            const diff = Math.ceil((scad - oggi) / (1000*60*60*24));
            const scadColor = diff < 0 ? 'var(--rosso)' : diff <= 7 ? 'var(--oro)' : 'var(--testo-dim)';
            const sqCred = squadreDB.find(s => s.id === r.squadra_creditrice_id);
            return `
              <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--grigio-scuro);border-radius:10px;margin-bottom:8px;border-left:3px solid ${scadColor}">
                <div style="flex:1">
                  <div style="font-size:13px;font-weight:600;margin-bottom:3px">${r.descrizione || 'Rata mercato'}</div>
                  <div style="font-size:11px;color:var(--testo-dim)">A: ${sqCred?.nome || '?'}</div>
                  <div style="font-size:11px;color:${scadColor}">Scadenza: ${scad.toLocaleDateString('it-IT')} ${diff < 0 ? '(SCADUTA)' : diff === 0 ? '(OGGI)' : '(tra '+diff+' giorni)'}</div>
                </div>
                <div style="font-family:'Space Mono',monospace;font-size:16px;font-weight:700;color:var(--rosso)">-${fmtBudget(r.importo)}</div>
              </div>`;
          }).join('')}
        </div>`;
    }

    // FM in arrivo (pending non erogati)
    const mieiPending = bilancePending.filter(p => p.squadra_id === sqId && !p.erogato);
    if (mieiPending.length > 0) {
      const totPending = mieiPending.reduce((s, p) => s + p.importo, 0);
      html += `
        <div style="background:var(--grigio);border:1px solid rgba(0,255,135,0.2);border-radius:14px;padding:16px;margin-bottom:20px">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--verde);letter-spacing:1px;margin-bottom:4px">📬 FM IN ARRIVO AL NUOVO BILANCIO</div>
          <div style="font-size:11px;color:var(--testo-dim);margin-bottom:12px">Verranno accreditati il 16 giugno all'apertura del nuovo bilancio</div>
          ${mieiPending.map(p => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--grigio-scuro);border-radius:8px;margin-bottom:6px">
              <div style="font-size:12px;color:var(--testo)">${p.descrizione}</div>
              <div style="font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:var(--verde)">+${fmtBudget(p.importo)}</div>
            </div>`).join('')}
          <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--grigio-chiaro);margin-top:6px">
            <div style="font-size:12px;color:var(--testo-dim)">Totale in arrivo</div>
            <div style="font-family:'Space Mono',monospace;font-size:18px;font-weight:700;color:var(--verde)">+${fmtBudget(totPending)}</div>
          </div>
        </div>`;
    }

    // Rate in entrata (crediti)
    const mieRateCrediti = rateMercato.filter(r => r.squadra_creditrice_id === sqId && !r.pagata);
    if (mieRateCrediti.length > 0) {
      html += `
        <div style="background:var(--grigio);border:1px solid rgba(0,255,135,0.15);border-radius:14px;padding:16px;margin-bottom:20px">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--verde);letter-spacing:1px;margin-bottom:12px">💵 RATE IN ENTRATA</div>
          ${mieRateCrediti.map(r => {
            const scad = new Date(r.data_scadenza);
            const sqDeb = squadreDB.find(s => s.id === r.squadra_debitrice_id);
            return `
              <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--grigio-scuro);border-radius:10px;margin-bottom:8px">
                <div style="flex:1">
                  <div style="font-size:13px;font-weight:600;margin-bottom:3px">${r.descrizione || 'Rata mercato'}</div>
                  <div style="font-size:11px;color:var(--testo-dim)">Da: ${sqDeb?.nome || '?'}</div>
                  <div style="font-size:11px;color:var(--testo-dim)">Scadenza: ${scad.toLocaleDateString('it-IT')}</div>
                </div>
                <div style="font-family:'Space Mono',monospace;font-size:16px;font-weight:700;color:var(--verde)">+${fmtBudget(r.importo)}</div>
              </div>`;
          }).join('')}
        </div>`;
    }
  }

  // Classifica budget tutte le squadre
  html += renderClassificaBudget();
  container.innerHTML = html;
}

function renderClassificaBudget() {
  const righe = [...squadreDB].sort((a, b) => (b.budget || 0) - (a.budget || 0));
  return `
    <div style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:14px;overflow:hidden">
      <div style="padding:14px 16px;border-bottom:1px solid var(--grigio-chiaro)">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:1px">💰 BUDGET SQUADRE</div>
      </div>
      ${righe.map((sq, i) => {
        const budget = sq.budget || 0;
        const budgetColor = budget >= 0 ? 'var(--verde)' : 'var(--rosso)';
        const maxBudget = Math.max(...squadreDB.map(s => Math.abs(s.budget || 0)));
        const pct = maxBudget > 0 ? Math.abs(budget) / maxBudget * 100 : 0;
        return `
          <div style="padding:12px 16px;border-bottom:1px solid var(--grigio-chiaro)${i===righe.length-1?';border-bottom:none':''}">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
              ${sq.logo_url ? `<img src="${sq.logo_url}" style="width:24px;height:24px;object-fit:contain;border-radius:4px">` : `<div style="width:24px;height:24px;border-radius:4px;background:${sq.avatar_bg||'#333'};display:flex;align-items:center;justify-content:center;font-size:10px">${sq.avatar||'⚽'}</div>`}
              <div style="flex:1;font-size:13px;font-weight:600">${sq.nome}</div>
              <div style="font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:${budgetColor}">${fmtBudget(budget)}</div>
            </div>
            <div style="height:4px;background:var(--grigio-scuro);border-radius:2px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:${budgetColor};border-radius:2px;transition:width 0.3s"></div>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

// ===== ADMIN BILANCIO =====
function apriAdminBilancio() {
  if (!adminLoggato) return;
  document.getElementById('modal-bilancio-admin').classList.add('open');
  renderAdminBilancio();
}

async function renderAdminBilancio() {
  await caricaBilancioAdmin();
  const body = document.getElementById('bilancio-admin-body');
  body.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap">
      <button onclick="showAdminBilancioTab('nuovo',this)" id="tab-bnuovo" style="background:var(--oro);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;padding:8px 16px;border-radius:8px;border:none;cursor:pointer">🆕 NUOVO BILANCIO</button>
      <button onclick="showAdminBilancioTab('pending',this)" id="tab-bpending" style="background:var(--grigio-medio);color:var(--testo);font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;padding:8px 16px;border-radius:8px;border:1px solid var(--grigio-chiaro);cursor:pointer">📬 FM PENDING</button>
      <button onclick="showAdminBilancioTab('rate',this)" id="tab-brate" style="background:var(--grigio-medio);color:var(--testo);font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;padding:8px 16px;border-radius:8px;border:1px solid var(--grigio-chiaro);cursor:pointer">💳 RATE</button>
      <button onclick="showAdminBilancioTab('manuale',this)" id="tab-bmanuale" style="background:var(--grigio-medio);color:var(--testo);font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;padding:8px 16px;border-radius:8px;border:1px solid var(--grigio-chiaro);cursor:pointer">✏️ MANUALE</button>
    </div>
    <div id="bilancio-admin-tab-content"></div>`;
  showAdminBilancioTab('nuovo', document.getElementById('tab-bnuovo'));
}

function showAdminBilancioTab(tab, btn) {
  ['tab-bnuovo','tab-bpending','tab-brate','tab-bmanuale'].forEach(id => {
    const b = document.getElementById(id);
    if (b) { b.style.background='var(--grigio-medio)'; b.style.color='var(--testo)'; b.style.border='1px solid var(--grigio-chiaro)'; }
  });
  btn.style.background='var(--oro)'; btn.style.color='var(--nero)'; btn.style.border='none';
  const c = document.getElementById('bilancio-admin-tab-content');
  if (tab==='nuovo') renderTabNuovoBilancio(c);
  else if (tab==='pending') renderTabPending(c);
  else if (tab==='rate') renderTabRate(c);
  else if (tab==='manuale') renderTabManuale(c);
}

// TAB NUOVO BILANCIO
async function renderTabNuovoBilancio(container) {
  // Calcola anteprima per ogni squadra
  const righe = await Promise.all(squadreDB.map(async sq => {
    // 1. FM Competizioni pending
    const fmComp = bilancePending
      .filter(p => p.squadra_id === sq.id && !p.erogato && p.tipo === 'competizione')
      .reduce((s, p) => s + p.importo, 0);

    // 2. Rendita museo
    const trofei = sq.trofei || [];
    const fmMuseo = calcolaRenditaMuseo(trofei);

    // 3. 50M fissi apertura
    const fmFissi = 50000000;

    // 4. Rate in scadenza (da pagare)
    const rateDebito = rateMercato
      .filter(r => r.squadra_debitrice_id === sq.id && !r.pagata)
      .reduce((s, r) => s + r.importo, 0);

    // 5. Rate in entrata
    const rateCredito = rateMercato
      .filter(r => r.squadra_creditrice_id === sq.id && !r.pagata)
      .reduce((s, r) => s + r.importo, 0);

    const totaleEntrate = fmComp + fmMuseo + fmFissi + rateCredito;
    const totaleUscite = rateDebito;
    const netto = totaleEntrate - totaleUscite;

    return { sq, fmComp, fmMuseo, fmFissi, rateDebito, rateCredito, netto };
  }));

  container.innerHTML = `
    <div style="background:rgba(255,215,0,0.06);border:1px solid rgba(255,215,0,0.2);border-radius:10px;padding:14px;margin-bottom:16px;font-size:12px;color:var(--testo-dim);line-height:1.7">
      ⚠️ <strong style="color:var(--oro)">Apertura Nuovo Bilancio (16 Giugno)</strong><br>
      Questa operazione accredita a ogni squadra: <strong style="color:var(--testo)">50M fissi + FM competizioni + rendita museo + rate in entrata</strong> e addebita le rate in uscita. L'operazione è irreversibile.
    </div>

    <div style="font-family:'Bebas Neue',sans-serif;font-size:14px;color:var(--testo-dim);letter-spacing:1px;margin-bottom:10px">ANTEPRIMA PER SQUADRA</div>

    ${righe.map(r => `
      <div style="background:var(--grigio-scuro);border:1px solid var(--grigio-chiaro);border-radius:12px;padding:14px;margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          ${r.sq.logo_url ? `<img src="${r.sq.logo_url}" style="width:24px;height:24px;object-fit:contain;border-radius:4px">` : ''}
          <div style="font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1px">${r.sq.nome}</div>
          <div style="margin-left:auto;font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:${r.netto>=0?'var(--verde)':'var(--rosso)'}">
            ${r.netto >= 0 ? '+' : ''}${fmtBudget(r.netto)}
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px">
          <div style="color:var(--verde)">✅ 50M fissi</div>
          <div style="color:var(--verde);text-align:right">${fmtBudget(r.fmFissi)}</div>
          ${r.fmComp > 0 ? `<div style="color:var(--verde)">🏆 FM Competizioni</div><div style="color:var(--verde);text-align:right">+${fmtBudget(r.fmComp)}</div>` : ''}
          ${r.fmMuseo > 0 ? `<div style="color:var(--verde)">🏛️ Rendita Museo</div><div style="color:var(--verde);text-align:right">+${fmtBudget(r.fmMuseo)}</div>` : ''}
          ${r.rateCredito > 0 ? `<div style="color:var(--verde)">💵 Rate in entrata</div><div style="color:var(--verde);text-align:right">+${fmtBudget(r.rateCredito)}</div>` : ''}
          ${r.rateDebito > 0 ? `<div style="color:var(--rosso)">💸 Rate in uscita</div><div style="color:var(--rosso);text-align:right">-${fmtBudget(r.rateDebito)}</div>` : ''}
        </div>
      </div>`).join('')}

    <button onclick="apriNuovoBilancio()" style="background:var(--oro);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:2px;padding:14px;border-radius:10px;border:none;cursor:pointer;width:100%;margin-top:8px">
      🆕 APRI NUOVO BILANCIO — ${bilancioNuovaStagione}
    </button>`;
}

// Calcola rendita museo da trofei
function calcolaRenditaMuseo(trofei) {
  if (!trofei || trofei.length === 0) return 0;
  const valoriBase = {
    'campionato': 2500000, 'formula_1': 1800000, 'champions': 1500000,
    'coopmeiners': 1000000, 'talent_boy': 1000000, 'coppa_eroi': 1000000,
    'campionato_2': 800000, 'europa_league': 700000, 'coppa_crediti': 700000,
    'coppa_italia': 700000, 'coppa_tua': 600000, 'konami': 500000,
    'campionato_3': 300000, 'coppa_coglioni': 200000
  };

  // Raggruppa per competizione e calcola con moltiplicatori
  const perComp = {};
  trofei.forEach(t => {
    const compId = t.compId || t.comp_id;
    if (!perComp[compId]) perComp[compId] = [];
    perComp[compId].push(t);
  });

  let totale = 0;
  Object.entries(perComp).forEach(([compId, arr]) => {
    const base = valoriBase[compId] || 500000;
    const molt = getMolt(arr.length);
    totale += base * molt;
  });
  return totale;
}

// Esegui apertura nuovo bilancio
async function apriNuovoBilancio() {
  if (!confirm(`⚠️ APERTURA NUOVO BILANCIO ${bilancioNuovaStagione}\n\nQuesta operazione è IRREVERSIBILE.\nConfermi di voler procedere?`)) return;

  const body = document.getElementById('bilancio-admin-tab-content');
  body.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Apertura bilancio in corso...</div>';

  let errori = 0;
  let ok = 0;

  for (const sq of squadreDB) {
    try {
      let nuovoBudget = sq.budget || 0;

      // 1. FM fissi
      nuovoBudget += 50000000;

      // 2. FM competizioni pending
      const pendingComp = bilancePending.filter(p => p.squadra_id === sq.id && !p.erogato);
      for (const p of pendingComp) {
        nuovoBudget += p.importo;
        await sb.from('bilancio_pending').update({ erogato: true, data_erogazione: new Date().toISOString() }).eq('id', p.id);
        p.erogato = true;
      }

      // 3. Rendita museo
      const fmMuseo = calcolaRenditaMuseo(sq.trofei || []);
      if (fmMuseo > 0) nuovoBudget += fmMuseo;

      // 4. Rate in entrata (pagate)
      const rateIn = rateMercato.filter(r => r.squadra_creditrice_id === sq.id && !r.pagata);
      for (const r of rateIn) {
        nuovoBudget += r.importo;
      }

      // 5. Rate in uscita
      const rateOut = rateMercato.filter(r => r.squadra_debitrice_id === sq.id && !r.pagata);
      for (const r of rateOut) {
        nuovoBudget -= r.importo;
      }

      // Aggiorna budget squadra
      await sb.from('squadre').update({ budget: nuovoBudget }).eq('id', sq.id);
      const idx = squadreDB.findIndex(s => s.id === sq.id);
      if (idx >= 0) squadreDB[idx].budget = nuovoBudget;
      ok++;
    } catch(e) {
      console.error('Errore per squadra', sq.nome, e);
      errori++;
    }
  }

  // Marca tutte le rate come pagate
  try {
    await sb.from('rate_mercato').update({ pagata: true, data_pagamento: new Date().toISOString() }).eq('pagata', false);
    rateMercato.forEach(r => { r.pagata = true; r.data_pagamento = new Date().toISOString(); });
  } catch(e) { console.error('Errore mark rate:', e); }

  showToast(`✅ Bilancio aperto! ${ok} squadre aggiornate${errori > 0 ? ' ('+errori+' errori)' : ''}`);
  await renderAdminBilancio();
}

// TAB PENDING
function renderTabPending(container) {
  const nonErogati = bilancePending.filter(p => !p.erogato);
  const erogati = bilancePending.filter(p => p.erogato);

  container.innerHTML = `
    <div style="font-family:'Bebas Neue',sans-serif;font-size:14px;color:var(--testo-dim);letter-spacing:1px;margin-bottom:10px">FM DA EROGARE (${nonErogati.length})</div>
    ${nonErogati.length === 0 ? '<div style="color:var(--testo-dim);font-size:13px;padding:10px 0">Nessun FM in attesa</div>' :
    nonErogati.map(p => {
      const sq = squadreDB.find(s => s.id === p.squadra_id);
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--grigio-scuro);border-radius:8px;margin-bottom:6px;border-left:2px solid var(--verde)">
          <div style="flex:1">
            <div style="font-size:12px;font-weight:600">${sq?.nome || '?'}</div>
            <div style="font-size:11px;color:var(--testo-dim)">${p.descrizione}</div>
            <div style="font-size:10px;color:var(--testo-dim)">${new Date(p.created_at).toLocaleDateString('it-IT')}</div>
          </div>
          <div style="font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:var(--verde)">+${fmtBudget(p.importo)}</div>
          <button onclick="eliminaPending(${p.id})" style="background:rgba(255,68,68,0.1);color:var(--rosso);border:1px solid rgba(255,68,68,0.3);font-size:10px;padding:4px 8px;border-radius:5px;cursor:pointer">🗑️</button>
        </div>`;
    }).join('')}

    <div style="font-family:'Bebas Neue',sans-serif;font-size:14px;color:var(--testo-dim);letter-spacing:1px;margin-top:16px;margin-bottom:10px">GIÀ EROGATI (${erogati.length})</div>
    ${erogati.slice(0, 20).map(p => {
      const sq = squadreDB.find(s => s.id === p.squadra_id);
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--grigio-scuro);border-radius:8px;margin-bottom:6px;opacity:0.5;border-left:2px solid var(--testo-dim)">
          <div style="flex:1">
            <div style="font-size:12px;font-weight:600">${sq?.nome || '?'}</div>
            <div style="font-size:11px;color:var(--testo-dim)">${p.descrizione}</div>
          </div>
          <div style="font-family:'Space Mono',monospace;font-size:13px;color:var(--testo-dim)">+${fmtBudget(p.importo)}</div>
          <div style="font-size:10px;color:var(--verde)">✅</div>
        </div>`;
    }).join('')}`;
}

async function eliminaPending(id) {
  if (!confirm('Eliminare questo FM pending?')) return;
  try {
    await sb.from('bilancio_pending').delete().eq('id', id);
    bilancePending = bilancePending.filter(p => p.id !== id);
    showToast('🗑️ Eliminato');
    renderTabPending(document.getElementById('bilancio-admin-tab-content'));
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

// TAB RATE
function renderTabRate(container) {
  const nonPagate = rateMercato.filter(r => !r.pagata).sort((a,b) => new Date(a.data_scadenza)-new Date(b.data_scadenza));
  const pagate = rateMercato.filter(r => r.pagata);

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:14px;color:var(--testo-dim);letter-spacing:1px">RATE IN SOSPESO (${nonPagate.length})</div>
      <button onclick="apriNuovaRata()" style="background:var(--verde);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:1px;padding:6px 14px;border-radius:8px;border:none;cursor:pointer">+ NUOVA RATA</button>
    </div>
    <div id="form-nuova-rata" style="display:none;background:var(--grigio-scuro);border-radius:10px;padding:14px;margin-bottom:14px"></div>

    ${nonPagate.length === 0 ? '<div style="color:var(--testo-dim);font-size:13px;margin-bottom:16px">Nessuna rata in sospeso</div>' :
    nonPagate.map(r => {
      const sqDeb = squadreDB.find(s => s.id === r.squadra_debitrice_id);
      const sqCred = squadreDB.find(s => s.id === r.squadra_creditrice_id);
      const scad = new Date(r.data_scadenza);
      const oggi = new Date();
      const diff = Math.ceil((scad - oggi) / (1000*60*60*24));
      const scadColor = diff < 0 ? 'var(--rosso)' : diff <= 7 ? 'var(--oro)' : 'var(--testo-dim)';
      return `
        <div style="padding:12px;background:var(--grigio-scuro);border-radius:10px;margin-bottom:8px;border-left:3px solid ${scadColor}">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <div style="font-size:12px;font-weight:600">${r.descrizione || 'Rata mercato'}</div>
            <div style="font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:var(--oro)">${fmtBudget(r.importo)}</div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--testo-dim)">
            <div>Da: <span style="color:var(--rosso)">${sqDeb?.nome||'?'}</span> → A: <span style="color:var(--verde)">${sqCred?.nome||'?'}</span></div>
            <div style="color:${scadColor}">${scad.toLocaleDateString('it-IT')} ${diff<0?'⚠️ SCADUTA':diff===0?'⚠️ OGGI':'('+diff+'gg)'}</div>
          </div>
          <div style="display:flex;gap:6px;margin-top:8px">
            <button onclick="pagaRata(${r.id})" style="flex:1;background:rgba(0,255,135,0.1);color:var(--verde);border:1px solid rgba(0,255,135,0.3);font-family:'Bebas Neue',sans-serif;font-size:12px;padding:5px;border-radius:6px;cursor:pointer">✅ PAGA ORA</button>
            <button onclick="eliminaRata(${r.id})" style="background:rgba(255,68,68,0.1);color:var(--rosso);border:1px solid rgba(255,68,68,0.3);font-size:11px;padding:5px 10px;border-radius:6px;cursor:pointer">🗑️</button>
          </div>
        </div>`;
    }).join('')}

    <div style="font-family:'Bebas Neue',sans-serif;font-size:14px;color:var(--testo-dim);letter-spacing:1px;margin-top:16px;margin-bottom:10px">PAGATE (${pagate.length})</div>
    ${pagate.slice(0,10).map(r => {
      const sqDeb = squadreDB.find(s => s.id === r.squadra_debitrice_id);
      const sqCred = squadreDB.find(s => s.id === r.squadra_creditrice_id);
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--grigio-scuro);border-radius:8px;margin-bottom:6px;opacity:0.5">
          <div style="flex:1;font-size:12px">${r.descrizione || 'Rata'} — ${sqDeb?.nome||'?'} → ${sqCred?.nome||'?'}</div>
          <div style="font-size:12px;color:var(--verde)">${fmtBudget(r.importo)} ✅</div>
        </div>`;
    }).join('')}`;
}

function apriNuovaRata() {
  const form = document.getElementById('form-nuova-rata');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
  if (form.style.display === 'none') return;
  form.innerHTML = `
    <div style="font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--verde);letter-spacing:1px;margin-bottom:12px">➕ NUOVA RATA</div>
    <div class="form-group">
      <label class="form-label">Descrizione</label>
      <input id="rata-desc" class="form-input" type="text" placeholder="es. Rata acquisto Mbappé - 2ª tranche">
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="form-group">
        <label class="form-label">Squadra Debitrice (paga)</label>
        <select id="rata-deb" class="form-select">${squadreDB.map(s=>`<option value="${s.id}">${s.nome}</option>`).join('')}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Squadra Creditrice (riceve)</label>
        <select id="rata-cred" class="form-select">${squadreDB.map(s=>`<option value="${s.id}">${s.nome}</option>`).join('')}</select>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="form-group">
        <label class="form-label">Importo (FM)</label>
        <input id="rata-importo" class="form-input" type="number" placeholder="es. 10000000">
      </div>
      <div class="form-group">
        <label class="form-label">Data Scadenza</label>
        <input id="rata-scad" class="form-input" type="date">
      </div>
    </div>
    <button onclick="salvaRata()" style="background:var(--verde);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1px;padding:10px;border-radius:8px;border:none;cursor:pointer;width:100%;margin-top:4px">💾 SALVA RATA</button>`;
}

async function salvaRata() {
  const desc = document.getElementById('rata-desc').value.trim();
  const debId = document.getElementById('rata-deb').value;
  const credId = document.getElementById('rata-cred').value;
  const importo = parseFloat(document.getElementById('rata-importo').value);
  const scad = document.getElementById('rata-scad').value;
  if (!desc || !debId || !credId || !importo || !scad) { showToast('❌ Compila tutti i campi','error'); return; }
  if (debId === credId) { showToast('❌ Le due squadre devono essere diverse','error'); return; }
  try {
    const { data, error } = await sb.from('rate_mercato').insert({
      descrizione: desc, squadra_debitrice_id: debId, squadra_creditrice_id: credId,
      importo, data_scadenza: scad, pagata: false, stagione: bilancioStagione
    }).select().single();
    if (error) throw error;
    rateMercato.push(data);
    showToast('✅ Rata salvata!');
    document.getElementById('form-nuova-rata').style.display='none';
    renderTabRate(document.getElementById('bilancio-admin-tab-content'));
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

async function pagaRata(id) {
  const r = rateMercato.find(x => x.id === id);
  if (!r) return;
  if (!confirm(`Pagare ${fmtBudget(r.importo)} da ${squadreDB.find(s=>s.id===r.squadra_debitrice_id)?.nome} a ${squadreDB.find(s=>s.id===r.squadra_creditrice_id)?.nome}?`)) return;
  try {
    // Debit squadra debitrice
    const sqDeb = squadreDB.find(s => s.id === r.squadra_debitrice_id);
    const sqCred = squadreDB.find(s => s.id === r.squadra_creditrice_id);
    if (sqDeb) {
      const nb = (sqDeb.budget||0) - r.importo;
      await sb.from('squadre').update({ budget: nb }).eq('id', sqDeb.id);
      sqDeb.budget = nb;
    }
    if (sqCred) {
      const nb = (sqCred.budget||0) + r.importo;
      await sb.from('squadre').update({ budget: nb }).eq('id', sqCred.id);
      sqCred.budget = nb;
    }
    await sb.from('rate_mercato').update({ pagata: true, data_pagamento: new Date().toISOString() }).eq('id', id);
    const idx = rateMercato.findIndex(x => x.id === id);
    if (idx >= 0) { rateMercato[idx].pagata = true; }
    showToast('✅ Rata pagata!');
    renderTabRate(document.getElementById('bilancio-admin-tab-content'));
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

async function eliminaRata(id) {
  if (!confirm('Eliminare questa rata?')) return;
  try {
    await sb.from('rate_mercato').delete().eq('id', id);
    rateMercato = rateMercato.filter(r => r.id !== id);
    showToast('🗑️ Eliminata');
    renderTabRate(document.getElementById('bilancio-admin-tab-content'));
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

// TAB MANUALE — accredita/addebita manualmente
function renderTabManuale(container) {
  container.innerHTML = `
    <div style="font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--oro);letter-spacing:1px;margin-bottom:14px">✏️ MOVIMENTO MANUALE</div>
    <div class="form-group">
      <label class="form-label">Squadra</label>
      <select id="man-sq" class="form-select">${squadreDB.map(s=>`<option value="${s.id}">${s.nome}</option>`).join('')}</select>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="form-group">
        <label class="form-label">Tipo</label>
        <select id="man-tipo" class="form-select">
          <option value="entrata">➕ Entrata</option>
          <option value="uscita">➖ Uscita</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Importo (FM)</label>
        <input id="man-importo" class="form-input" type="number" placeholder="es. 5000000">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Descrizione</label>
      <input id="man-desc" class="form-input" type="text" placeholder="es. Premio giornata più alta">
    </div>
    <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--testo);margin-bottom:16px;cursor:pointer">
      <input type="checkbox" id="man-immediato" checked style="width:16px;height:16px"> Accredita subito (non aspettare nuovo bilancio)
    </label>
    <button onclick="salvaMovimentoManuale()" style="background:var(--oro);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1px;padding:12px;border-radius:8px;border:none;cursor:pointer;width:100%">💾 APPLICA MOVIMENTO</button>`;
}

async function salvaMovimentoManuale() {
  const sqId = document.getElementById('man-sq').value;
  const tipo = document.getElementById('man-tipo').value;
  const importo = parseFloat(document.getElementById('man-importo').value);
  const desc = document.getElementById('man-desc').value.trim();
  const immediato = document.getElementById('man-immediato').checked;
  if (!sqId || !importo || !desc) { showToast('❌ Compila tutti i campi','error'); return; }
  const delta = tipo === 'entrata' ? importo : -importo;
  try {
    if (immediato) {
      const sq = squadreDB.find(s => s.id === sqId);
      if (!sq) return;
      const nuovoBudget = (sq.budget || 0) + delta;
      await sb.from('squadre').update({ budget: nuovoBudget }).eq('id', sqId);
      const idx = squadreDB.findIndex(s => s.id === sqId);
      if (idx >= 0) squadreDB[idx].budget = nuovoBudget;
      showToast(`✅ ${delta>0?'+':''}${fmtBudget(delta)} applicato a ${sq.nome}`);
    } else {
      const { data, error } = await sb.from('bilancio_pending').insert({
        squadra_id: sqId, importo: delta, tipo: 'manuale',
        descrizione: desc, stagione: bilancioStagione, erogato: false
      }).select().single();
      if (error) throw error;
      bilancePending.push(data);
      showToast('✅ Aggiunto ai FM pending per il nuovo bilancio');
    }
    renderTabManuale(document.getElementById('bilancio-admin-tab-content'));
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

// ===== FUNZIONE ESTERNA: aggiungi FM competizione a pending =====
async function aggiungiFMCompPending(squadraId, importo, descrizione) {
  try {
    const { data, error } = await sb.from('bilancio_pending').insert({
      squadra_id: squadraId, importo, tipo: 'competizione',
      descrizione, stagione: bilancioStagione, erogato: false
    }).select().single();
    if (error) throw error;
    bilancePending.push(data);
    return true;
  } catch(e) {
    console.error('Errore aggiunta FM pending:', e);
    return false;
  }
}
