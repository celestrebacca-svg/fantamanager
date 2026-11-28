// ===== SISTEMA BILANCIO =====

// Stagione: usa la variabile globale STAGIONE_CORRENTE (config.js, caricata da DB).
// bilancioNuovaStagione non serve più come variabile fissa: si calcola al volo
// con prossimaStagione(STAGIONE_CORRENTE).
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

// Controlla le rate (conguagli scambio, ecc.) con scadenza oggi o passata e le
// paga automaticamente: budget trasferito da debitrice a creditrice, marcata pagata.
// Va chiamata ad ogni caricamento dati (carica-dati.js), non solo una volta l'anno.
async function controllaRateScadute(){
  if(!rateMercato || !rateMercato.length) return;
  const oggi=new Date(); oggi.setHours(0,0,0,0);
  const scadute=rateMercato.filter(r=>!r.pagata && r.data_scadenza && new Date(r.data_scadenza)<=oggi);
  for(const r of scadute){
    try{
      const sqDeb=squadreDB.find(s=>s.id===r.squadra_debitrice_id);
      const sqCred=squadreDB.find(s=>s.id===r.squadra_creditrice_id);
      if(!sqDeb||!sqCred) continue;
      const nuovoDeb=(sqDeb.budget||0)-r.importo;
      const nuovoCred=(sqCred.budget||0)+r.importo;
      await sb.from('squadre').update({budget:nuovoDeb}).eq('id',sqDeb.id);
      await sb.from('squadre').update({budget:nuovoCred}).eq('id',sqCred.id);
      sqDeb.budget=nuovoDeb; sqCred.budget=nuovoCred;
      await sb.from('rate_mercato').update({pagata:true,data_pagamento:new Date().toISOString()}).eq('id',r.id);
      r.pagata=true;
      showToast(`💳 Rata pagata: ${r.descrizione||'Conguaglio'} — ${fmtBudget(r.importo)} (${sqDeb.nome_squadra||sqDeb.nome} → ${sqCred.nome_squadra||sqCred.nome})`);
    }catch(e){ console.warn('Errore pagamento rata automatica:', e.message); }
  }
}

// ===== RENDER SEZIONE BILANCIO (visibile a tutti, per ogni squadra) =====
let movimentiBilancio = [];
let bilSqSel = null;
let bilMercatoSel = null;
let bilArchivioAperto = false;
let stipendiAnno = [];
let eventiSponsor = [];
let bilAnnoSel = null;

function _bilEsc(t) {
  return String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function _bilFm(v) { return (v >= 0 ? '+' : '-') + fmtBudget(Math.abs(v)); }

// Il mercato si ricava dalla data di scadenza: invernale dal 1 gennaio al 2 febbraio,
// estivo dal 1 luglio al 1 settembre. Una data fuori dalle finestre va al mercato successivo.
function _bilMercato(dataStr) {
  if (!dataStr) return { k: 'Senza data', o: 0 };
  const d = new Date(dataStr), m = d.getMonth() + 1, g = d.getDate(), y = d.getFullYear();
  if (m === 1 || (m === 2 && g <= 2)) return { k: 'Inverno ' + y, o: y * 10 + 1 };
  if (m <= 8 || (m === 9 && g <= 1)) return { k: 'Estate ' + y, o: y * 10 + 2 };
  return { k: 'Inverno ' + (y + 1), o: (y + 1) * 10 + 1 };
}

// Registro movimenti: usa la tabella già esistente movimenti_budget (la stessa del riscatto)
async function caricaMovimentiBilancio() {
  try {
    let r = await sb.from('movimenti_budget').select('*').order('created_at', { ascending: false }).limit(2000);
    if (r.error) r = await sb.from('movimenti_budget').select('*').limit(2000);
    movimentiBilancio = r.error ? [] : (r.data || []);
  } catch (e) { movimentiBilancio = []; }
}

// Incassi di giornata (stadio, sponsor settimanali...): stanno in sponsor_eventi, non in movimenti_budget
async function caricaEventiSponsor() {
  try {
    let r = await sb.from('sponsor_eventi').select('*').order('created_at', { ascending: false }).limit(3000);
    if (r.error) r = await sb.from('sponsor_eventi').select('*').limit(3000);
    eventiSponsor = r.error ? [] : (r.data || []);
  } catch (e) { eventiSponsor = []; }
}

// Registra un movimento (importo con segno) con saldo prima/dopo. Se fallisce non blocca nulla.
async function registraMovimento(squadraId, descrizione, importo, saldoPrima) {
  try {
    const { error } = await sb.from('movimenti_budget').insert({
      squadra_id: squadraId, importo, tipo: importo >= 0 ? 'entrata' : 'uscita',
      descrizione, saldo_prima: saldoPrima, saldo_dopo: saldoPrima + importo
    });
    if (error) console.warn('Movimento non registrato:', error.message);
  } catch (e) { console.warn('Movimento non registrato:', e.message); }
}

// Stipendi: una "copia" della rosa con gli stipendi per ogni anno (tabella stipendi_anno, importi in FM)
async function caricaStipendiAnno() {
  try {
    const { data, error } = await sb.from('stipendi_anno').select('*').limit(10000);
    stipendiAnno = error ? [] : (data || []);
  } catch (e) { stipendiAnno = []; }
}
// Anno in cui chiude la stagione corrente (2026/27 -> 2027)
function _bilAnnoChiusura() {
  const a = parseInt(String(STAGIONE_CORRENTE).split(/[\/\-]/)[0], 10);
  return isNaN(a) ? new Date().getFullYear() : a + 1;
}

async function renderBilancio() {
  const container = document.getElementById('bilancio-content');
  if (!container) return;
  container.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Caricamento...</div>';
  await caricaBilancioAdmin();
  await caricaMovimentiBilancio();
  await caricaStipendiAnno();
  await caricaEventiSponsor();
  if (!bilSqSel || !squadreDB.find(s => s.id === bilSqSel)) {
    const mia = utenteLoggato ? squadreDB.find(s => s.id === utenteLoggato.id) : null;
    bilSqSel = mia ? mia.id : (squadreDB[0] ? squadreDB[0].id : null);
  }
  disegnaBilancio();
}

// Dalla pagina di una squadra: apre la pagina Bilancio già su quella squadra
function vaiAlBilancio(id) {
  bilSqSel = id; bilMercatoSel = null; bilArchivioAperto = false;
  showSection('bilancio');
}
function bilSelSquadra(id) { bilSqSel = id; bilMercatoSel = null; bilArchivioAperto = false; disegnaBilancio(); }
function bilSelMercato(k) { bilMercatoSel = k; disegnaBilancio(); }
function bilSelAnno(v) { bilAnnoSel = parseInt(v, 10); disegnaBilancio(); }
function bilToggleArchivio() { bilArchivioAperto = !bilArchivioAperto; disegnaBilancio(); }

function _bilRigaMov(m) {
  const col = m.v >= 0 ? 'var(--verde)' : 'var(--rosso)';
  return `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;padding:8px 0;border-top:1px solid var(--grigio-chiaro)">
      <div style="min-width:0">
        <div style="font-size:11px;font-weight:600;line-height:1.3;word-break:break-word">${_bilEsc(m.t)}</div>
        <div style="font-size:9px;color:var(--testo-dim);margin-top:2px">${m.d.toLocaleDateString('it-IT')}</div>
      </div>
      <div style="font-family:'Space Mono',monospace;font-size:11px;font-weight:700;color:${col};white-space:nowrap">${_bilFm(m.v)}</div>
    </div>`;
}

// ===== LETTORE STIPENDI (screenshot di Capology) =====
// Flusso: carichi gli screenshot -> l'AI (api/stipendi.js) legge nome e "tasso fisso netto annuo" ->
// i nomi vengono abbinati ai giocatori (quelli già visti sono riconosciuti da soli) -> salvi lo stipendio
// sui giocatori (giocatori.stipendio, in milioni) e rifai la finestra stipendi dell'anno scelto.
let stipLetti = [];
let stipFase = 'carica';
let stipAlias = {};
let stipMsg = '';

function _stipNorm(s) {
  return String(s || '').toLowerCase().replace(/ı/g, 'i').replace(/ø/g, 'o').replace(/ł/g, 'l').replace(/đ/g, 'd').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

async function caricaAliasStipendi() {
  stipAlias = {};
  try {
    const { data, error } = await sb.from('alias_capology').select('*').limit(5000);
    if (!error) (data || []).forEach(r => { stipAlias[r.nome_norm] = r.giocatore_id; });
  } catch (e) { /* tabella non ancora creata: si va avanti senza memoria */ }
}

function _stipAbbina(nomeCap) {
  const n = _stipNorm(nomeCap);
  if (!n) return { gid: null, stato: 'no' };
  const pool = giocatoriDB.map(g => ({ g, n: _stipNorm(g.nome) }));
  if (stipAlias[n] && pool.some(p => String(p.g.id) === String(stipAlias[n]))) return { gid: stipAlias[n], stato: 'ok', mem: true };
  let c = pool.filter(p => p.n === n);
  if (c.length === 1) return { gid: c[0].g.id, stato: 'ok' };
  // nome nell'app scritto come "P.Esposito": iniziale + cognome
  c = pool.filter(p => { const m = p.n.match(/^([a-z]) (.+)$/); return m && n.startsWith(m[1]) && (n === m[2] || n.endsWith(' ' + m[2])); });
  if (c.length === 1) return { gid: c[0].g.id, stato: 'ok' };
  // nome nell'app = solo cognome
  c = pool.filter(p => p.n.length >= 3 && n.endsWith(' ' + p.n));
  if (c.length === 1) return { gid: c[0].g.id, stato: 'proposta' };
  const cogn = n.split(' ').pop();
  c = pool.filter(p => cogn.length >= 3 && p.n.split(' ').pop() === cogn);
  if (c.length === 1) return { gid: c[0].g.id, stato: 'proposta' };
  return { gid: null, stato: 'no' };
}

function _stipComprimi(file) {
  return new Promise((ok, ko) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const k = Math.min(1, 2600 / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url); ok(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); ko(new Error('Immagine non leggibile')); };
    img.src = url;
  });
}

function apriLettoreStipendi() {
  if (!adminLoggato) return;
  let m = document.getElementById('modal-stipendi-lettore');
  if (!m) {
    m = document.createElement('div');
    m.className = 'modal-overlay'; m.id = 'modal-stipendi-lettore';
    m.setAttribute('onclick', "closeModal('modal-stipendi-lettore',event)");
    m.innerHTML = `<div class="modal" style="border-color:var(--oro);max-width:520px">
      <div class="modal-header"><div class="modal-title" style="color:var(--oro)">📸 CARICA STIPENDI</div>
      <button class="modal-close" onclick="document.getElementById('modal-stipendi-lettore').classList.remove('open')">×</button></div>
      <div style="padding:16px" id="stip-lettore-body"></div></div>`;
    document.body.appendChild(m);
  }
  stipLetti = []; stipFase = 'carica'; stipMsg = '';
  disegnaLettore();
  m.classList.add('open');
}

function disegnaLettore() {
  const b = document.getElementById('stip-lettore-body');
  if (!b) return;
  const bottone = 'width:100%;background:var(--oro);color:var(--nero);font-family:\'Bebas Neue\',sans-serif;font-size:18px;letter-spacing:1px;padding:12px;border-radius:10px;border:none;cursor:pointer';
  const err = stipMsg ? `<div style="font-size:13px;color:${stipMsg.startsWith('❌') ? 'var(--rosso)' : 'var(--testo-dim)'};margin-bottom:10px">${_bilEsc(stipMsg)}</div>` : '';
  if (stipFase === 'carica') {
    b.innerHTML = `${err}
      <div style="font-size:13px;color:var(--testo-dim);margin-bottom:10px;line-height:1.5">Carica gli screenshot di Capology (anche tanti insieme). Su Capology deve essere attivo <b>RETE</b>. Leggo solo il <b>tasso fisso netto annuo</b>.</div>
      <input type="file" id="stip-files" accept="image/*" multiple style="width:100%;margin-bottom:12px">
      <button onclick="stipLeggi()" style="${bottone}">LEGGI GLI STIPENDI</button>`;
    return;
  }
  if (stipFase === 'lettura') {
    b.innerHTML = `<div style="text-align:center;padding:24px 0;font-size:14px;color:var(--testo-dim)">${_bilEsc(stipMsg || 'Leggo...')}</div>`;
    return;
  }
  const ok = stipLetti.map((x, i) => ({ x, i })).filter(o => o.x.stato === 'ok');
  const prop = stipLetti.map((x, i) => ({ x, i })).filter(o => o.x.stato === 'proposta');
  const no = stipLetti.map((x, i) => ({ x, i })).filter(o => o.x.stato === 'no');
  const nomeG = gid => { const g = giocatoriDB.find(z => String(z.id) === String(gid)); return g ? g.nome : '?'; };
  const riga = (o, extra) => `<div style="padding:9px 0;border-top:1px solid var(--grigio-chiaro);font-size:13px">
      <div style="display:flex;justify-content:space-between;gap:8px"><span style="min-width:0;word-break:break-word">${_bilEsc(o.x.nomeCap)}${o.x.gid ? ' <span style="color:var(--testo-dim)">→ ' + _bilEsc(nomeG(o.x.gid)) + '</span>' : ''}</span>
      <span style="font-family:'Space Mono',monospace;font-weight:700;white-space:nowrap">${fmtBudget(o.x.eur)}</span></div>${extra || ''}</div>`;
  const cerca = i => `<input type="text" placeholder="Cerca il giocatore per nome..." oninput="stipCerca(${i},this.value)" style="width:100%;margin-top:6px;padding:8px;border-radius:8px;background:var(--grigio-scuro);color:var(--testo);border:1px solid var(--grigio-chiaro);font-size:13px"><div id="stip-res-${i}"></div>`;
  b.innerHTML = `${err}
    <div style="font-size:13px;color:var(--testo-dim);margin-bottom:10px">Letti ${stipLetti.length} giocatori · ✅ ${ok.length} riconosciuti · 💡 ${prop.length} da confermare · ❓ ${no.length} non trovati</div>
    ${prop.length ? `<div style="font-family:'Bebas Neue',sans-serif;font-size:15px;color:var(--oro);letter-spacing:1px">💡 DA CONFERMARE (${prop.length})</div>
      ${prop.map(o => riga(o, `<div style="display:flex;gap:6px;margin-top:6px"><button onclick="stipConferma(${o.i})" style="flex:1;background:rgba(0,255,135,0.1);color:var(--verde);border:1px solid rgba(0,255,135,0.3);padding:6px;border-radius:6px;cursor:pointer">✓ È lui</button><button onclick="stipAnnulla(${o.i})" style="flex:1;background:var(--grigio-scuro);color:var(--testo);border:1px solid var(--grigio-chiaro);padding:6px;border-radius:6px;cursor:pointer">Cerca altro</button></div>`)).join('')}` : ''}
    <details style="margin-top:10px"><summary style="cursor:pointer;font-family:'Bebas Neue',sans-serif;font-size:15px;color:var(--verde);letter-spacing:1px">✅ RICONOSCIUTI (${ok.length})</summary>
      ${ok.map(o => riga(o, `<div style="text-align:right"><button onclick="stipAnnulla(${o.i})" style="background:none;border:none;color:var(--testo-dim);font-size:11px;cursor:pointer">togli</button></div>`)).join('')}</details>
    <details style="margin-top:10px" ${no.length && !prop.length && !ok.length ? 'open' : ''}><summary style="cursor:pointer;font-family:'Bebas Neue',sans-serif;font-size:15px;color:var(--testo-dim);letter-spacing:1px">❓ NON TROVATI (${no.length}) — se non sono nel gioco, lasciali così</summary>
      ${no.map(o => riga(o, cerca(o.i))).join('')}</details>
    <label style="display:flex;gap:8px;align-items:center;margin:14px 0 10px;font-size:13px"><input type="checkbox" id="stip-agg-anno" checked> Rifai la finestra stipendi dell'anno ${bilAnnoSel} di tutte le squadre</label>
    <button onclick="stipSalva()" id="stip-salva-btn" style="${bottone}">SALVA ${ok.length} STIPENDI</button>`;
}

async function stipLeggi() {
  const inp = document.getElementById('stip-files');
  const files = Array.from((inp && inp.files) || []);
  if (!files.length) { stipMsg = '❌ Scegli almeno uno screenshot'; disegnaLettore(); return; }
  const righe = new Map();
  stipFase = 'lettura';
  for (let i = 0; i < files.length; i++) {
    stipMsg = `Leggo lo screenshot ${i + 1} di ${files.length}...`; disegnaLettore();
    try {
      const img = await _stipComprimi(files[i]);
      const r = await fetch('/api/stipendi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (typeof SESSIONE_TOKEN !== 'undefined' && SESSIONE_TOKEN ? SESSIONE_TOKEN : '') },
        body: JSON.stringify({ immagine: img })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || ('Errore ' + r.status));
      if (j.modo === 'lordo') throw new Error('Lo screenshot ' + (i + 1) + ' mostra gli stipendi LORDI: su Capology attiva RETE e rifai lo screenshot');
      if (j.valuta && j.valuta !== 'EUR') throw new Error('Lo screenshot ' + (i + 1) + ' non è in EUR: su Capology scegli EUR');
      (j.righe || []).forEach(x => righe.set(_stipNorm(x.nome), { nomeCap: x.nome, eur: x.stipendio }));
    } catch (e) { stipFase = 'carica'; stipMsg = '❌ ' + e.message; disegnaLettore(); return; }
  }
  await caricaAliasStipendi();
  stipLetti = Array.from(righe.values()).map(x => ({ ...x, ..._stipAbbina(x.nomeCap) }));
  stipFase = 'revisione'; stipMsg = '';
  disegnaLettore();
}

function stipConferma(i) { stipLetti[i].stato = 'ok'; stipLetti[i].mem = false; disegnaLettore(); }
function stipAnnulla(i) { stipLetti[i].stato = 'no'; stipLetti[i].gid = null; stipLetti[i].mem = false; disegnaLettore(); }
function stipScegli(i, gid) { stipLetti[i].gid = gid; stipLetti[i].stato = 'ok'; stipLetti[i].mem = false; disegnaLettore(); }
function stipCerca(i, q) {
  const box = document.getElementById('stip-res-' + i);
  if (!box) return;
  const n = _stipNorm(q);
  if (n.length < 2) { box.innerHTML = ''; return; }
  const trovati = giocatoriDB.filter(g => _stipNorm(g.nome).includes(n)).slice(0, 6);
  box.innerHTML = trovati.length ? trovati.map(g => {
    const sq = squadreDB.find(s => String(s.id) === String(g.squadra_id));
    return `<button onclick="stipScegli(${i},'${g.id}')" style="display:block;width:100%;text-align:left;margin-top:4px;padding:8px;border-radius:6px;background:var(--grigio-scuro);color:var(--testo);border:1px solid var(--grigio-chiaro);font-size:13px;cursor:pointer">${_bilEsc(g.nome)} <span style="color:var(--testo-dim)">· ${_bilEsc(sq ? sq.nome : 'senza squadra')}</span></button>`;
  }).join('') : '<div style="font-size:12px;color:var(--testo-dim);padding:6px 0">Nessun giocatore trovato</div>';
}

async function stipSalva() {
  const ok = stipLetti.filter(x => x.stato === 'ok' && x.gid);
  if (!ok.length) { stipMsg = '❌ Non c\'è niente da salvare'; disegnaLettore(); return; }
  const aggiorna = !!(document.getElementById('stip-agg-anno') || {}).checked;
  const btn = document.getElementById('stip-salva-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'SALVO...'; }
  let errori = 0;
  for (let k = 0; k < ok.length; k += 10) {
    await Promise.all(ok.slice(k, k + 10).map(async x => {
      const m = Math.round(x.eur / 1e4) / 100;          // milioni, 2 decimali (6.000.000 -> 6)
      const { error } = await sb.from('giocatori').update({ stipendio: m }).eq('id', x.gid);
      if (error) { errori++; return; }
      const i = giocatoriDB.findIndex(g => String(g.id) === String(x.gid));
      if (i >= 0) giocatoriDB[i] = { ...giocatoriDB[i], stipendio: m };
    }));
  }
  const nuovi = ok.filter(x => !x.mem).map(x => ({ nome_norm: _stipNorm(x.nomeCap), giocatore_id: String(x.gid) }));
  let aliasKo = false;
  if (nuovi.length) {
    try { const { error } = await sb.from('alias_capology').upsert(nuovi, { onConflict: 'nome_norm' }); if (error) aliasKo = true; } catch (e) { aliasKo = true; }
  }
  showToast(errori ? `⚠️ ${ok.length - errori} salvati, ${errori} non riusciti` : `✅ ${ok.length} stipendi salvati${aliasKo ? ' (nomi non memorizzati: manca la tabella alias_capology)' : ''}`);
  document.getElementById('modal-stipendi-lettore').classList.remove('open');
  if (aggiorna) await aggiornaStipendiAnno(bilAnnoSel, true);
  else renderBilancio();
}

// Rifà la finestra stipendi di un anno per tutte le squadre, partendo dalle rose di adesso.
// Regole: Primavera = 0, promosso = 0, il prestito secco lo paga chi ha il giocatore in rosa,
// allenatore intero. (Gennaio 50%: non ancora calcolato.) Le squadre con stipendi già pagati non si toccano.
async function aggiornaStipendiAnno(anno, senzaConferma) {
  if (!adminLoggato) return;
  await caricaStipendiAnno();
  const rows = [], senza = [], totali = [];
  const bloccate = new Set(stipendiAnno.filter(r => r.anno === anno && r.pagato).map(r => String(r.squadra_id)));
  squadreDB.forEach(sq => {
    if (bloccate.has(String(sq.id))) return;
    let tot = 0;
    giocatoriDB.filter(g => String(g.squadra_id) === String(sq.id) && g.lista !== 'primavera' && !g.promosso).forEach(g => {
      const st = Math.round((parseFloat(g.stipendio) || 0) * 1e6);
      if (!st) { senza.push(g.nome + ' (' + sq.nome + ')'); return; }
      rows.push({ anno, squadra_id: String(sq.id), tipo: 'calciatore', giocatore_id: String(g.id), nome: g.nome, stipendio: st, pagato: false });
      tot += st;
    });
    const all = parseM(sq.stip_all);
    if (all > 0) { rows.push({ anno, squadra_id: String(sq.id), tipo: 'allenatore', giocatore_id: null, nome: sq.allenatore || 'Allenatore', stipendio: all, pagato: false }); tot += all; }
    totali.push(sq.nome + ': ' + fmtBudget(tot));
  });
  if (!senzaConferma && !confirm(`Rifaccio la finestra stipendi ${anno} di tutte le squadre dalle rose di adesso.\n${rows.length} stipendi (${bloccate.size ? bloccate.size + ' squadre già pagate non si toccano' : 'nessuna squadra già pagata'}).\n\nProcedo?`)) return;
  const { error: eDel } = await sb.from('stipendi_anno').delete().eq('anno', anno).eq('pagato', false);
  if (eDel) { showToast('❌ ' + eDel.message, 'error'); return; }
  for (let k = 0; k < rows.length; k += 200) {
    const { error } = await sb.from('stipendi_anno').insert(rows.slice(k, k + 200));
    if (error) { showToast('❌ Salvataggio non riuscito: ' + error.message, 'error'); await renderBilancio(); return; }
  }
  await renderBilancio();
  let msg = `✅ Finestra stipendi ${anno} aggiornata: ${rows.length} stipendi.\n\n` + totali.join('\n');
  if (senza.length) msg += `\n\n⚠️ Senza stipendio (${senza.length}), non contati:\n` + senza.slice(0, 15).join('\n') + (senza.length > 15 ? '\n...' : '');
  msg += '\n\nRicorda: la regola di gennaio (50%) non è ancora calcolata.';
  alert(msg);
}

function _bilStipendiHtml(sq) {
  const chiusura = _bilAnnoChiusura();
  const anni = Array.from(new Set(stipendiAnno.map(r => r.anno).concat([0, 1, 2, 3, 4].map(n => chiusura + n)))).sort((a, b) => a - b);
  if (!bilAnnoSel || !anni.includes(bilAnnoSel)) bilAnnoSel = chiusura;
  const righe = stipendiAnno.filter(r => String(r.squadra_id) === String(sq.id) && r.anno === bilAnnoSel);
  const all = righe.filter(r => r.tipo === 'allenatore');
  const cal = righe.filter(r => r.tipo !== 'allenatore').sort((a, b) => b.stipendio - a.stipendio);
  const tot = righe.reduce((t, r) => t + (r.stipendio || 0), 0);
  const pagati = righe.length > 0 && righe.every(r => r.pagato);
  const ultimo = righe.reduce((m, r) => { const d = r.aggiornato_il ? new Date(r.aggiornato_il).getTime() : 0; return d > m ? d : m; }, 0);
  const riga = r => `
    <div style="display:flex;justify-content:space-between;gap:8px;padding:8px 0;border-top:1px solid var(--grigio-chiaro);font-size:13px">
      <span style="min-width:0;word-break:break-word">${_bilEsc(r.nome)}</span>
      <span style="font-family:'Space Mono',monospace;font-weight:700;white-space:nowrap">${fmtBudget(r.stipendio || 0)}</span>
    </div>`;
  return `
    <div style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:14px;padding:14px;margin-bottom:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:1px">👥 STIPENDI</div>
        ${righe.length ? (pagati
          ? `<span style="font-size:10px;padding:3px 10px;border-radius:999px;background:rgba(0,255,135,0.12);color:var(--verde);border:1px solid rgba(0,255,135,0.3)">✓ GIÀ PAGATI</span>`
          : `<span style="font-size:10px;padding:3px 10px;border-radius:999px;background:rgba(255,215,0,0.12);color:var(--oro);border:1px solid rgba(255,215,0,0.3)">DA PAGARE</span>`) : ''}
      </div>
      <div style="font-size:11px;color:var(--testo-dim);margin:4px 0 10px">Ultimo aggiornamento: ${ultimo ? new Date(ultimo).toLocaleDateString('it-IT') : 'mai'}</div>
      <select onchange="bilSelAnno(this.value)" style="width:100%;padding:8px;border-radius:8px;background:var(--grigio-scuro);color:var(--testo);border:1px solid var(--grigio-chiaro);font-size:13px">
        ${anni.map(a => `<option value="${a}" ${a === bilAnnoSel ? 'selected' : ''}>Rosa estate ${a}</option>`).join('')}
      </select>
      ${adminLoggato ? `<div style="display:flex;gap:8px;margin:8px 0">
        <button onclick="apriLettoreStipendi()" style="flex:1;background:rgba(255,215,0,0.1);color:var(--oro);border:1px solid rgba(255,215,0,0.3);font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;padding:8px;border-radius:8px;cursor:pointer">📸 CARICA STIPENDI</button>
        <button onclick="aggiornaStipendiAnno(bilAnnoSel)" style="flex:1;background:var(--grigio-scuro);color:var(--testo);border:1px solid var(--grigio-chiaro);font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;padding:8px;border-radius:8px;cursor:pointer">🔄 RIFAI ${bilAnnoSel}</button>
      </div>` : ''}
      <div style="font-size:11px;color:var(--testo-dim);margin:6px 0 4px">Si pagano a fine stagione ${bilAnnoSel - 1}/${String(bilAnnoSel).slice(2)}, prima di aprire il nuovo bilancio.</div>
      ${righe.length ? `
        <div style="font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;color:var(--oro);margin-top:10px">⚽ ALLENATORE</div>
        ${all.length ? all.map(riga).join('') : '<div style="font-size:12px;color:var(--testo-dim);padding:6px 0">Non inserito</div>'}
        <div style="font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;color:var(--oro);margin-top:12px">👕 CALCIATORI (${cal.length})</div>
        ${cal.map(riga).join('')}
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;margin-top:6px;border-top:2px solid var(--grigio-chiaro)">
          <span style="font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1px">TOTALE</span>
          <span style="font-family:'Space Mono',monospace;font-size:16px;font-weight:700;color:var(--rosso)">-${fmtBudget(tot)}</span>
        </div>` : '<div style="font-size:12px;color:var(--testo-dim);padding:12px 0">Nessuno stipendio caricato per questo anno.</div>'}
    </div>`;
}

function disegnaBilancio() {
  const container = document.getElementById('bilancio-content');
  if (!container) return;
  const sq = squadreDB.find(s => s.id === bilSqSel);

  let html = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px">
      <div>
        <div class="page-title">💰 BILANCIO</div>
        <div class="page-sub">Stagione ${STAGIONE_CORRENTE}</div>
      </div>
      ${adminLoggato ? `<button onclick="apriAdminBilancio()" style="background:var(--oro);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:1px;padding:10px 20px;border-radius:8px;border:none;cursor:pointer">⚙️ ADMIN BILANCIO</button>` : ''}
    </div>

    <div style="display:flex;gap:8px;overflow-x:auto;padding:2px 2px 12px;margin-bottom:4px;-webkit-overflow-scrolling:touch">
      ${squadreDB.map(s => {
        const sel = s.id === bilSqSel;
        const ico = s.logo_url
          ? `<img src="${s.logo_url}" style="width:20px;height:20px;object-fit:contain;border-radius:4px">`
          : `<div style="width:20px;height:20px;border-radius:4px;background:${s.avatar_bg || '#333'};display:flex;align-items:center;justify-content:center;font-size:10px">${s.avatar || '⚽'}</div>`;
        return `<button onclick="bilSelSquadra('${s.id}')" style="flex:0 0 auto;display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;cursor:pointer;font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;white-space:nowrap;color:${sel ? 'var(--nero)' : 'var(--testo)'};background:${sel ? 'var(--oro)' : 'var(--grigio)'};border:1px solid ${sel ? 'var(--oro)' : 'var(--grigio-chiaro)'}">${ico}${_bilEsc(s.nome)}</button>`;
      }).join('')}
    </div>`;

  if (sq) {
    const budget = sq.budget || 0;
    const budgetColor = budget >= 0 ? 'var(--verde)' : 'var(--rosso)';

    // ----- RATE (colonna sinistra) -----
    const rateSq = rateMercato.filter(r => r.squadra_debitrice_id === sq.id || r.squadra_creditrice_id === sq.id);
    const mercati = {};
    rateSq.forEach(r => { const m = _bilMercato(r.data_scadenza); mercati[m.k] = m.o; });
    const chiavi = Object.keys(mercati).sort((a, b) => mercati[a] - mercati[b]);
    if (!bilMercatoSel || !chiavi.includes(bilMercatoSel)) {
      bilMercatoSel = chiavi.find(k => rateSq.some(r => !r.pagata && _bilMercato(r.data_scadenza).k === k)) || chiavi[chiavi.length - 1] || null;
    }
    const rateMer = rateSq.filter(r => _bilMercato(r.data_scadenza).k === bilMercatoSel)
      .sort((a, b) => new Date(a.data_scadenza) - new Date(b.data_scadenza));
    const totDaRicevere = rateSq.filter(r => !r.pagata && r.squadra_creditrice_id === sq.id).reduce((s, r) => s + r.importo, 0);
    const totDaPagare = rateSq.filter(r => !r.pagata && r.squadra_debitrice_id === sq.id).reduce((s, r) => s + r.importo, 0);

    const righeRate = rateMer.map(r => {
      const deb = r.squadra_debitrice_id === sq.id;
      const ctrl = squadreDB.find(s => s.id === (deb ? r.squadra_creditrice_id : r.squadra_debitrice_id));
      const col = deb ? 'var(--rosso)' : 'var(--verde)';
      const scad = r.data_scadenza ? new Date(r.data_scadenza).toLocaleDateString('it-IT') : '—';
      const badge = r.pagata
        ? `<span style="font-size:9px;padding:2px 8px;border-radius:999px;background:rgba(0,255,135,0.12);color:var(--verde);border:1px solid rgba(0,255,135,0.3);white-space:nowrap">✓ GIÀ PAGATA</span>`
        : `<span style="font-size:9px;padding:2px 8px;border-radius:999px;background:rgba(255,215,0,0.12);color:var(--oro);border:1px solid rgba(255,215,0,0.3);white-space:nowrap">${deb ? 'DA PAGARE' : 'DA RICEVERE'}</span>`;
      return `
        <div style="padding:10px;background:var(--grigio-scuro);border-radius:10px;margin-bottom:8px;border-left:3px solid ${r.pagata ? 'var(--grigio-chiaro)' : col};${r.pagata ? 'opacity:0.75' : ''}">
          <div style="font-size:12px;font-weight:600;line-height:1.3;word-break:break-word">${_bilEsc(r.descrizione || 'Rata mercato')}</div>
          <div style="font-size:10px;color:var(--testo-dim);margin-top:2px">${deb ? 'A' : 'Da'}: ${_bilEsc(ctrl ? ctrl.nome : '?')} · ${scad}</div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:6px;flex-wrap:wrap">
            <div style="font-family:'Space Mono',monospace;font-size:13px;font-weight:700;color:${col}">${deb ? '-' : '+'}${fmtBudget(r.importo)}</div>
            ${badge}
          </div>
        </div>`;
    }).join('');

    // ----- MOVIMENTI (colonna destra) -----
    const mov = [];
    rateSq.filter(r => r.pagata && r.data_pagamento).forEach(r => {
      const deb = r.squadra_debitrice_id === sq.id;
      const ctrl = squadreDB.find(s => s.id === (deb ? r.squadra_creditrice_id : r.squadra_debitrice_id));
      mov.push({ d: new Date(r.data_pagamento), t: 'Rata: ' + (r.descrizione || 'Rata mercato') + (ctrl ? ' (' + (deb ? 'a ' : 'da ') + ctrl.nome + ')' : ''), v: deb ? -r.importo : r.importo });
    });
    movimentiBilancio.filter(m => String(m.squadra_id) === String(sq.id)).forEach(m => {
      mov.push({ d: new Date(m.created_at), t: m.descrizione, v: m.importo });
    });
    eventiSponsor.filter(e => String(e.squadra_id) === String(sq.id) && e.soldi).forEach(e => {
      mov.push({ d: new Date(e.created_at || Date.now()), t: (e.nome_sponsor || e.tipo_sponsor || 'Incasso') + (e.giornata ? ' · giornata ' + e.giornata : ''), v: e.soldi });
    });
    mov.sort((a, b) => b.d - a.d);
    const limite = Date.now() - 30 * 86400000;
    const recenti = mov.filter(m => m.d.getTime() >= limite);
    const vecchi = mov.filter(m => m.d.getTime() < limite);

    let archivioHtml = '';
    if (bilArchivioAperto) {
      const gruppi = {};
      vecchi.forEach(m => { const k = m.d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }); (gruppi[k] = gruppi[k] || []).push(m); });
      archivioHtml = Object.keys(gruppi).length
        ? Object.keys(gruppi).map(k => `<div style="font-family:'Bebas Neue',sans-serif;font-size:13px;color:var(--oro);letter-spacing:1px;margin-top:12px;text-transform:uppercase">${k}</div>${gruppi[k].map(_bilRigaMov).join('')}`).join('')
        : '<div style="font-size:11px;color:var(--testo-dim);padding:8px 0">Archivio vuoto</div>';
    }

    html += `
      <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin-bottom:16px;align-items:start">

        <div style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:14px;padding:12px;min-width:0">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1px;margin-bottom:8px">💳 RATE</div>
          ${chiavi.length ? `
            <select onchange="bilSelMercato(this.value)" style="width:100%;margin-bottom:10px;padding:8px;border-radius:8px;background:var(--grigio-scuro);color:var(--testo);border:1px solid var(--grigio-chiaro);font-size:12px">
              ${chiavi.map(k => `<option value="${_bilEsc(k)}" ${k === bilMercatoSel ? 'selected' : ''}>Mercato ${_bilEsc(k)}</option>`).join('')}
            </select>
            <div style="max-height:340px;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding-right:2px">${righeRate || '<div style="font-size:11px;color:var(--testo-dim)">Nessuna rata in questo mercato</div>'}</div>
          ` : '<div style="font-size:11px;color:var(--testo-dim)">Nessuna rata</div>'}
        </div>

        <div style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:14px;padding:12px;min-width:0">
          <div style="background:linear-gradient(135deg,rgba(255,215,0,0.12),rgba(0,0,0,0));border:1px solid rgba(255,215,0,0.3);border-radius:10px;padding:10px;margin-bottom:12px">
            <div style="font-size:10px;color:var(--testo-dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Budget attuale</div>
            <div style="font-family:'Space Mono',monospace;font-size:20px;font-weight:700;color:${budgetColor};word-break:break-word">${fmtBudget(budget)}</div>
            <div style="font-size:10px;color:var(--testo-dim);margin-top:6px;line-height:1.5">
              Da ricevere: <span style="color:var(--verde)">+${fmtBudget(totDaRicevere)}</span><br>
              Da pagare: <span style="color:var(--rosso)">-${fmtBudget(totDaPagare)}</span>
            </div>
          </div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;color:var(--testo-dim)">ULTIMI MOVIMENTI · 30 GIORNI</div>
          <div style="max-height:260px;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding-right:2px">${recenti.length ? recenti.map(_bilRigaMov).join('') : '<div style="font-size:11px;color:var(--testo-dim);padding:8px 0">Nessun movimento nell\'ultimo mese</div>'}</div>
          <button onclick="bilToggleArchivio()" style="width:100%;margin-top:10px;background:var(--grigio-medio);color:var(--testo);font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;padding:8px;border-radius:8px;border:1px solid var(--grigio-chiaro);cursor:pointer">${bilArchivioAperto ? '✕ CHIUDI ARCHIVIO' : '📁 ARCHIVIO (' + vecchi.length + ')'}</button>
          ${archivioHtml ? `<div style="max-height:260px;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch">${archivioHtml}</div>` : ''}
        </div>
      </div>`;

    // FM in arrivo al nuovo bilancio (pending non erogati)
    const mieiPending = bilancePending.filter(p => p.squadra_id === sq.id && !p.erogato);
    if (mieiPending.length > 0) {
      const totPending = mieiPending.reduce((s, p) => s + p.importo, 0);
      html += `
        <div style="background:var(--grigio);border:1px solid rgba(0,255,135,0.2);border-radius:14px;padding:16px;margin-bottom:16px">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--verde);letter-spacing:1px;margin-bottom:4px">📬 FM IN ARRIVO AL NUOVO BILANCIO</div>
          <div style="font-size:11px;color:var(--testo-dim);margin-bottom:12px">Verranno accreditati all'apertura del nuovo bilancio</div>
          ${mieiPending.map(p => `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;background:var(--grigio-scuro);border-radius:8px;margin-bottom:6px">
              <div style="font-size:12px;color:var(--testo)">${_bilEsc(p.descrizione)}</div>
              <div style="font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:var(--verde)">+${fmtBudget(p.importo)}</div>
            </div>`).join('')}
          <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--grigio-chiaro);margin-top:6px">
            <div style="font-size:12px;color:var(--testo-dim)">Totale in arrivo</div>
            <div style="font-family:'Space Mono',monospace;font-size:18px;font-weight:700;color:var(--verde)">+${fmtBudget(totPending)}</div>
          </div>
        </div>`;
    }
  }

  if (sq) html += _bilStipendiHtml(sq);
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
function apriAdminBilancioRate() {
  // Apre la modal admin direttamente sul tab RATE
  apriAdminBilancio();
  // Aspetta che la modal sia aperta e poi switcha al tab rate
  setTimeout(() => {
    const btn = document.getElementById('tab-brate');
    if (btn) showAdminBilancioTab('rate', btn);
    // Apre subito il form nuova rata
    setTimeout(() => apriNuovaRata(), 50);
  }, 100);
}

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
      Questa operazione accredita a ogni squadra: <strong style="color:var(--testo)">FM competizioni + rendita museo + rate in entrata</strong> (i 50M arrivano con il nuovo mercato) e addebita le rate in uscita. Prima toglie gli stipendi dell'anno che chiude, se caricati. Avanza automaticamente anche la stagione (da ${STAGIONE_CORRENTE} a ${prossimaStagione(STAGIONE_CORRENTE)}), usata ovunque nell'app. L'operazione è irreversibile.
    </div>

    <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;font-size:12px">
      <span style="color:var(--testo-dim)">Stagione attuale:</span>
      <input id="corr-stagione" class="form-input" style="width:100px;padding:6px 8px" value="${STAGIONE_CORRENTE}">
      <button onclick="correggiStagioneManuale()" style="background:var(--grigio-medio);color:var(--testo);border:1px solid var(--grigio-chiaro);font-size:11px;padding:6px 10px;border-radius:6px;cursor:pointer">✏️ Correggi</button>
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
      🆕 APRI NUOVO BILANCIO — ${prossimaStagione(STAGIONE_CORRENTE)}
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

// Correzione manuale della stagione (per errori, NON per il normale avanzamento
// a fine anno — quello è automatico con "Apri Nuovo Bilancio")
async function correggiStagioneManuale() {
  let val = document.getElementById('corr-stagione').value.trim();
  if (/^\d{4}\/\d{4}$/.test(val)) val = normalizzaStagione(val); // accetta anche "2025/2026" e lo converte
  if (!/^\d{4}\/\d{2}$/.test(val)) { showToast('❌ Formato non valido, usa es. 2025/26','error'); return; }
  if (!confirm(`Correggere manualmente la stagione a ${val}?\nVerrà usata subito ovunque nell'app (bilancio, competizioni, risiko, storia giocatori).`)) return;
  try {
    await sb.from('impostazioni').update({ stagione_corrente: val }).eq('id', 1);
    STAGIONE_CORRENTE = val;
    showToast(`✅ Stagione corretta a ${val}`);
    renderAdminBilancio();
  } catch(e) { showToast('❌ Errore: '+e.message,'error'); }
}

// Esegui apertura nuovo bilancio
async function apriNuovoBilancio() {
  await caricaStipendiAnno();
  const annoChiusura = _bilAnnoChiusura();
  const stipDaPagare = stipendiAnno.filter(r => r.anno === annoChiusura && !r.pagato);
  const sqConStip = new Set(stipDaPagare.map(r => String(r.squadra_id))).size;
  const totStip = stipDaPagare.reduce((t, r) => t + (r.stipendio || 0), 0);
  const avvisoStip = stipDaPagare.length
    ? `\n\n💼 Prima verranno tolti gli stipendi ${annoChiusura}: ${sqConStip} squadre su ${squadreDB.length}, totale ${fmtBudget(totStip)}.`
    : `\n\n⚠️ ATTENZIONE: nessuno stipendio ${annoChiusura} caricato. Non verrà tolto niente.`;
  if (!confirm(`⚠️ APERTURA NUOVO BILANCIO ${prossimaStagione(STAGIONE_CORRENTE)}\n\nQuesta operazione è IRREVERSIBILE.${avvisoStip}\n\nConfermi di voler procedere?`)) return;

  const body = document.getElementById('bilancio-admin-tab-content');
  body.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Apertura bilancio in corso...</div>';

  let errori = 0;
  let ok = 0;
  const negativi = [];
  // Alle rate si applicano solo quelle già scadute: le rate future (fino a 7 mercati) restano dov'erano
  const limiteRate = new Date(); limiteRate.setHours(23, 59, 59, 999);
  const rateScadute = r => !r.pagata && r.data_scadenza && new Date(r.data_scadenza) <= limiteRate;

  for (const sq of squadreDB) {
    try {
      let nuovoBudget = sq.budget || 0;

      // 0. Stipendi dell'anno che chiude (si pagano prima di aprire il nuovo bilancio)
      const stipSq = stipDaPagare.filter(r => String(r.squadra_id) === String(sq.id));
      const totStipSq = stipSq.reduce((t, r) => t + (r.stipendio || 0), 0);
      if (totStipSq > 0) {
        await registraMovimento(sq.id, `Stipendi ${annoChiusura}`, -totStipSq, nuovoBudget);
        nuovoBudget -= totStipSq;
        const adesso = new Date().toISOString();
        const { error: errSt } = await sb.from('stipendi_anno').update({ pagato: true, data_pagamento: adesso })
          .eq('anno', annoChiusura).eq('squadra_id', sq.id).eq('pagato', false);
        if (errSt) throw errSt;
        stipSq.forEach(r => { r.pagato = true; r.data_pagamento = adesso; });
      }

      // (i 50M non si danno più qui: arrivano con il nuovo mercato)

      // 2. FM competizioni pending
      const pendingComp = bilancePending.filter(p => p.squadra_id === sq.id && !p.erogato);
      for (const p of pendingComp) {
        registraMovimento(sq.id, p.descrizione || 'FM competizione', p.importo, nuovoBudget);
        nuovoBudget += p.importo;
        await sb.from('bilancio_pending').update({ erogato: true, data_erogazione: new Date().toISOString() }).eq('id', p.id);
        p.erogato = true;
      }

      // 3. Rendita museo
      const fmMuseo = calcolaRenditaMuseo(sq.trofei || []);
      if (fmMuseo > 0) { registraMovimento(sq.id, 'Rendita museo', fmMuseo, nuovoBudget); nuovoBudget += fmMuseo; }

      // 4. Rate in entrata (pagate)
      const rateIn = rateMercato.filter(r => r.squadra_creditrice_id === sq.id && rateScadute(r));
      for (const r of rateIn) {
        nuovoBudget += r.importo;
      }

      // 5. Rate in uscita
      const rateOut = rateMercato.filter(r => r.squadra_debitrice_id === sq.id && rateScadute(r));
      for (const r of rateOut) {
        nuovoBudget -= r.importo;
      }

      // Aggiorna budget squadra
      await sb.from('squadre').update({ budget: nuovoBudget }).eq('id', sq.id);
      const idx = squadreDB.findIndex(s => s.id === sq.id);
      if (idx >= 0) squadreDB[idx].budget = nuovoBudget;
      if (nuovoBudget < 0) negativi.push(sq.nome + ': ' + fmtBudget(nuovoBudget));
      ok++;
    } catch(e) {
      console.error('Errore per squadra', sq.nome, e);
      errori++;
    }
  }

  // Marca tutte le rate come pagate
  try {
    // Segna come pagate solo le rate già scadute (le stesse appena applicate ai budget)
    const rateDaPagare = rateMercato.filter(rateScadute);
    for (const r of rateDaPagare) {
      await sb.from('rate_mercato').update({ pagata: true, data_pagamento: new Date().toISOString() }).eq('id', r.id);
      r.pagata = true; r.data_pagamento = new Date().toISOString();
    }
  } catch(e) { console.error('Errore mark rate:', e); }

  // Azzera lo stato "promosso": con la nuova stagione lo slot aggiuntivo decade,
  // il giocatore torna un giocatore normale della lista in cui si trova.
  try {
    const promossi = giocatoriDB.filter(g => g.promosso);
    if (promossi.length > 0) {
      await sb.from('giocatori').update({ promosso: false }).eq('promosso', true);
      promossi.forEach(g => { g.promosso = false; });
    }
  } catch(e) { console.error('Errore reset promossi:', e); }

  // Avanza la stagione corrente (unificata per bilancio, competizioni, risiko, storico giocatori)
  const nuovaStagione = prossimaStagione(STAGIONE_CORRENTE);
  try {
    await sb.from('impostazioni').update({ stagione_corrente: nuovaStagione }).eq('id', 1);
    STAGIONE_CORRENTE = nuovaStagione;
  } catch(e) { console.error('Errore aggiornamento stagione:', e); }

  if (negativi.length) alert('⚠️ Chiudono in negativo (penalità):\n\n' + negativi.join('\n'));
  showToast(`✅ Bilancio aperto! ${ok} squadre aggiornate${errori > 0 ? ' ('+errori+' errori)' : ''} • Stagione ${STAGIONE_CORRENTE}`);
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
      <button onclick="apriAdminBilancioRate()" style="background:var(--verde);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:1px;padding:6px 14px;border-radius:8px;border:none;cursor:pointer">+ NUOVA RATA</button>
    </div>
    ${adminLoggato ? `<button onclick="importaVecchieRate()" style="width:100%;margin-bottom:12px;background:rgba(255,215,0,0.1);color:var(--oro);border:1px solid rgba(255,215,0,0.3);font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;padding:8px;border-radius:8px;cursor:pointer">📥 IMPORTA VECCHIE RATE (dalle trattative)</button>` : ''}
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

// Una volta sola: copia nel nuovo bilancio le rate NON pagate rimaste dentro le vecchie trattative.
// Salta da sola quelle già presenti e mostra l'elenco prima di fare qualsiasi cosa.
async function importaVecchieRate() {
  if (!adminLoggato) return;
  const { data: tr, error } = await sb.from('trattative').select('*');
  if (error) { showToast('❌ ' + error.message, 'error'); return; }
  const daImportare = [], giaPresenti = [], daFareAMano = [];
  const stessa = (a, b) => String(a.squadra_debitrice_id) === String(b.squadra_debitrice_id) && String(a.squadra_creditrice_id) === String(b.squadra_creditrice_id) && Number(a.importo) === Number(b.importo) && String(a.data_scadenza).slice(0, 10) === String(b.data_scadenza).slice(0, 10);
  (tr || []).forEach(t => {
    if (t.stato === 'rifiutata' || !Array.isArray(t.rate)) return;
    const paga = t.squadra_offerente_id || t.squadra_cedente_id;
    const incassa = t.squadra_ricevente_id || t.squadra_acquirente_id;
    const g = giocatoriDB.find(x => String(x.id) === String(t.giocatore_id));
    const nome = (g && g.nome) || t.giocatore_nome || t.tipo || 'Trattativa';
    t.rate.forEach((r, i) => {
      const imp = parseFloat(r.importo);
      if (r.pagata || r.importata || !r.data || !(imp > 0)) return;
      if (!paga || !incassa) { daFareAMano.push(`${nome} (${r.data}, ${fmtBudget(imp)})`); return; }
      const riga = { descrizione: `Rata: ${nome}`, squadra_debitrice_id: paga, squadra_creditrice_id: incassa, importo: imp, data_scadenza: r.data, pagata: false, stagione: STAGIONE_CORRENTE, trattativa_id: String(t.id) };
      if (rateMercato.some(x => !x.pagata && stessa(x, riga)) || daImportare.some(x => stessa(x.riga, riga))) giaPresenti.push(riga);
      else daImportare.push({ riga, tid: t.id, idx: i });
    });
  });
  const nomeSq = id => (squadreDB.find(s => String(s.id) === String(id)) || {}).nome || '?';
  let msg = `Rate da importare: ${daImportare.length}\nGià presenti nel bilancio (saltate): ${giaPresenti.length}`;
  if (daImportare.length) msg += '\n\n' + daImportare.map(x => `• ${x.riga.descrizione}: ${nomeSq(x.riga.squadra_debitrice_id)} → ${nomeSq(x.riga.squadra_creditrice_id)}, ${fmtBudget(x.riga.importo)}, ${x.riga.data_scadenza}`).join('\n');
  if (daFareAMano.length) msg += '\n\nDa inserire a mano (manca una squadra):\n' + daFareAMano.map(x => '• ' + x).join('\n');
  if (!daImportare.length) { alert(msg); return; }
  if (!confirm(msg + '\n\nImporto?')) return;
  let res = await sb.from('rate_mercato').insert(daImportare.map(x => x.riga)).select();
  if (res.error) res = await sb.from('rate_mercato').insert(daImportare.map(x => { const { trattativa_id, ...r } = x.riga; return r; })).select();
  if (res.error) { showToast('❌ Importazione non riuscita: ' + res.error.message, 'error'); return; }
  (res.data || []).forEach(x => rateMercato.push(x));
  // segna le rate vecchie come importate, così non si ripetono
  const perT = {};
  daImportare.forEach(x => { (perT[x.tid] = perT[x.tid] || []).push(x.idx); });
  for (const tid of Object.keys(perT)) {
    const t = (tr || []).find(z => String(z.id) === String(tid));
    const nuove = t.rate.map((r, i) => perT[tid].includes(i) ? { ...r, importata: true } : r);
    await sb.from('trattative').update({ rate: nuove }).eq('id', t.id);
  }
  showToast(`✅ ${(res.data || []).length} rate importate`);
  renderAdminBilancio();
}

function apriNuovaRata() {
  let form = document.getElementById('form-nuova-rata');
  if (!form) {
    // Crealo al volo nel tab content
    const parent = document.getElementById('bilancio-admin-tab-content');
    if (!parent) return;
    form = document.createElement('div');
    form.id = 'form-nuova-rata';
    form.style.cssText = 'background:var(--grigio-scuro);border-radius:10px;padding:14px;margin-bottom:14px;display:none';
    parent.insertBefore(form, parent.firstChild);
  }
  if (form.style.display === 'block') { form.style.display = 'none'; return; }
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
        <label class="form-label">Importo (FM) es. 5M, 1.5M</label>
        <input id="rata-importo" class="form-input" type="text" placeholder="Es. 5M o 1.5M">
      </div>
      <div class="form-group">
        <label class="form-label">Data Scadenza</label>
        <input id="rata-scad" class="form-input" type="date">
      </div>
    </div>
    <button onclick="salvaRata()" style="background:var(--verde);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1px;padding:10px;border-radius:8px;border:none;cursor:pointer;width:100%;margin-top:4px">💾 SALVA RATA</button>`;
  form.style.display = 'block';
}

async function salvaRata() {
  const desc = document.getElementById('rata-desc').value.trim();
  const debId = document.getElementById('rata-deb').value;
  const credId = document.getElementById('rata-cred').value;
  const importo = parseFM(document.getElementById('rata-importo').value);
  const scad = document.getElementById('rata-scad').value;
  if (!desc || !debId || !credId || !importo || !scad) { showToast('❌ Compila tutti i campi','error'); return; }
  if (debId === credId) { showToast('❌ Le due squadre devono essere diverse','error'); return; }
  try {
    const { data, error } = await sb.from('rate_mercato').insert({
      descrizione: desc, squadra_debitrice_id: debId, squadra_creditrice_id: credId,
      importo, data_scadenza: scad, pagata: false, stagione: STAGIONE_CORRENTE
    }).select().single();
    if (error) throw error;
    rateMercato.push(data);
    showToast('✅ Rata salvata!');
    const fform=document.getElementById('form-nuova-rata'); if(fform) fform.style.display='none';
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
        <label class="form-label">Importo (FM) es. 5M, 1.5M</label>
        <input id="man-importo" class="form-input" type="text" placeholder="Es. 5M o 1.5M">
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
  const importo = parseFM(document.getElementById('man-importo').value);
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
      registraMovimento(sqId, desc, delta, nuovoBudget - delta);
      showToast(`✅ ${delta>0?'+':''}${fmtBudget(delta)} applicato a ${sq.nome}`);
    } else {
      const { data, error } = await sb.from('bilancio_pending').insert({
        squadra_id: sqId, importo: delta, tipo: 'manuale',
        descrizione: desc, stagione: STAGIONE_CORRENTE, erogato: false
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
      descrizione, stagione: STAGIONE_CORRENTE, erogato: false
    }).select().single();
    if (error) throw error;
    bilancePending.push(data);
    return true;
  } catch(e) {
    console.error('Errore aggiunta FM pending:', e);
    return false;
  }
}
