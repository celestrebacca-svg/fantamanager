// ===== MERCATO =====
function filtraTrattative(stato,el){
  filtroTrattative=stato;
  document.querySelectorAll('.mercato-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  renderTrattative();
}

function renderTrattative(){
  const lista=filtroTrattative==='tutte'?trattativeDB:trattativeDB.filter(t=>t.stato===filtroTrattative);
  const container=document.getElementById('trattative-lista');
  if(!lista.length){container.innerHTML='<div class="empty">Nessuna trattativa</div>';return;}
  container.innerHTML=lista.map(t=>{
    const off=squadreDB.find(s=>s.id===t.squadra_offerente_id);
    const ric=squadreDB.find(s=>s.id===t.squadra_ricevente_id);
    const g=giocatoriDB.find(x=>String(x.id)===String(t.giocatore_id));
    const statoClass={'in_attesa':'stato-attesa','approvata':'stato-approvata','completata':'stato-completata','rifiutata':'stato-rifiutata'}[t.stato]||'stato-attesa';
    const statoLabel={'in_attesa':'⏳ In attesa','approvata':'✅ Approvata','completata':'🏁 Completata','rifiutata':'❌ Rifiutata'}[t.stato]||t.stato;
    return `<div class="trattativa-card">
      <div class="trattativa-header">
        <div>
          <div class="trattativa-tipo">${t.tipo}</div>
          <div style="font-size:11px;color:var(--testo-dim);margin-top:2px">${off?off.nome:'?'} → ${ric?ric.nome:'?'}</div>
        </div>
        <span class="trattativa-stato ${statoClass}">${statoLabel}</span>
      </div>
      <div class="trattativa-body">
        ${g?`<div class="trattativa-row"><span class="label">Giocatore</span><span style="font-weight:600">${g.nome} (${g.ruolo})</span></div>`:''}
        ${t.importo?`<div class="trattativa-row"><span class="label">${t.tipo?.includes('Prestito')?'💰 Cifra Prestito':'💰 Importo'}</span><span style="color:var(--verde);font-family:'Space Mono',monospace">${fmtNum(t.importo)} FM</span></div>`:''}
        ${t.importo_riscatto?`<div class="trattativa-row"><span class="label">🔑 Riscatto</span><span style="color:var(--oro);font-family:'Space Mono',monospace">${fmtNum(t.importo_riscatto)} FM${t.scadenza_riscatto?' entro '+t.scadenza_riscatto:''}</span></div>`:''}
        ${t.importo_recompra?`<div class="trattativa-row"><span class="label">🔄 Contro-riscatto</span><span style="color:orange;font-family:'Space Mono',monospace">${fmtNum(t.importo_recompra)} FM${t.scadenza_recompra?' entro '+t.scadenza_recompra:''}</span></div>`:''}
        ${t.scadenza_prestito?`<div class="trattativa-row"><span class="label">📅 Scadenza</span><span>${t.scadenza_prestito}</span></div>`:''}
        ${t.percentuale_rivendita?`<div class="trattativa-row"><span class="label">% Rivendita</span><span style="color:var(--verde)">${t.percentuale_rivendita}%</span></div>`:''}
        ${t.note?`<div class="trattativa-row"><span class="label">Note</span><span style="color:var(--testo-dim)">${t.note}</span></div>`:''}
        <div class="trattativa-row"><span class="label">Data</span><span>${new Date(t.created_at).toLocaleDateString('it-IT')}</span></div>
      </div>
      ${adminLoggato&&t.stato==='in_attesa'?`
        <div class="trattativa-footer">
          <button class="btn-rifiuta" onclick="cambiaStatoTrattativa(${t.id},'rifiutata')">❌ Rifiuta</button>
          <button class="btn-approva" onclick="cambiaStatoTrattativa(${t.id},'approvata')">✅ Approva</button>
        </div>`:''}
      ${adminLoggato&&t.stato==='approvata'?`
        <div class="trattativa-footer">
          <button onclick="annullaTrattativa(${t.id})" style="width:100%;background:rgba(255,150,0,0.15);color:orange;border:1px solid rgba(255,150,0,0.4);padding:10px;border-radius:8px;cursor:pointer;font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px">↩️ ANNULLA E RIPRISTINA</button>
        </div>`:''}
    </div>`;
  }).join('');
}

// ══════════════════════════════════════════════
// TRASFERIMENTO - usa sempre squadra_cedente_id
// e squadra_acquirente_id che sono fissi nel DB
// ══════════════════════════════════════════════
async function eseguiTrasferimento(t){
  const tipo = t.tipo||'';
  const isPrestito = tipo.toLowerCase().includes('prestito');
  const isScambio = tipo.toLowerCase().includes('scambio');
  const hasDiritto = tipo.includes('Diritto');
  const hasObbligo = tipo.includes('Obbligo');

  // Usa i campi fissi - non cambiano mai
  const sqCedente = t.squadra_cedente_id;
  const sqAcquirente = t.squadra_acquirente_id;

  if(!sqCedente||!sqAcquirente){
    console.error('Campi squadra mancanti:', t.squadra_cedente_id, t.squadra_acquirente_id);
    return false;
  }

  // ── GIOCATORE PRINCIPALE ──
  if(t.giocatore_id){
    const gId = parseInt(t.giocatore_id);
    let upd;

    if(isPrestito){
      let tipoContratto = 'Prestito Secco';
      if(hasDiritto) tipoContratto = 'Prestito con Diritto di Riscatto';
      if(hasObbligo) tipoContratto = 'Prestito con Obbligo di Riscatto';
      upd = {
        squadra_id: sqAcquirente,
        squadra_originale_id: sqCedente,
        contratto: tipoContratto,
        badge: 'P',
        squadra_propr: sqCedente,
        scadenza: t.scadenza_prestito||null,
        riscatto: t.importo_riscatto||null,
        scadenza_riscatto: t.scadenza_riscatto||null,
      };
    } else {
      upd = {
        squadra_id: sqAcquirente,
        squadra_originale_id: null,
        contratto: 'Titolo Definitivo',
        badge: null,
        squadra_propr: null,
        scadenza: null,
        riscatto: null,
        scadenza_riscatto: null,
      };
    }

    const {error} = await sb.from('giocatori').update(upd).eq('id', gId);
    if(error){ console.error('Errore giocatore:', error); return false; }
    const idx = giocatoriDB.findIndex(g=>String(g.id)===String(t.giocatore_id));
    if(idx>=0) giocatoriDB[idx]={...giocatoriDB[idx],...upd};
    console.log('✅', upd.contratto, sqCedente, '→', sqAcquirente);

    // Storico carriera
    logStoricoGiocatore(gId, isPrestito?'prestito':'trasferimento', {
      squadra_da: sqCedente, squadra_a: sqAcquirente,
      tipo_contratto: upd.contratto,
      importo: parseFloat(t.importo)||null,
    });
  }

  // ── SCAMBIO ──
  if(isScambio){
    for(const gId of (t.giocatori_cambio_ids||[])){
      const upd={squadra_id:sqCedente,contratto:'Titolo Definitivo',badge:null,squadra_propr:null,scadenza:null,riscatto:null,squadra_originale_id:null};
      await sb.from('giocatori').update(upd).eq('id',gId);
      const i=giocatoriDB.findIndex(g=>g.id==gId);
      if(i>=0) giocatoriDB[i]={...giocatoriDB[i],...upd};
      logStoricoGiocatore(gId,'scambio',{squadra_da:sqAcquirente,squadra_a:sqCedente,tipo_contratto:'Titolo Definitivo',note:`Scambio: ${t.tipo}`});
    }
    for(const gId of (t.giocatori_ids_richiesti||[])){
      const upd={squadra_id:sqAcquirente,contratto:'Titolo Definitivo',badge:null,squadra_propr:null,scadenza:null,riscatto:null,squadra_originale_id:null};
      await sb.from('giocatori').update(upd).eq('id',gId);
      const i=giocatoriDB.findIndex(g=>g.id==gId);
      if(i>=0) giocatoriDB[i]={...giocatoriDB[i],...upd};
      logStoricoGiocatore(gId,'scambio',{squadra_da:sqCedente,squadra_a:sqAcquirente,tipo_contratto:'Titolo Definitivo',note:`Scambio: ${t.tipo}`});
    }
  }

  // ── BUDGET ──
  const importo = parseFloat(t.importo)||0;
  if(importo>0){
    const sqAcqDB = squadreDB.find(s=>s.id===sqAcquirente);
    const sqCedDB = squadreDB.find(s=>s.id===sqCedente);
    const g = giocatoriDB.find(x=>String(x.id)===String(t.giocatore_id));
    const nomeG = g?g.nome:'Giocatore';
    if(sqAcqDB){ sqAcqDB.budget=(sqAcqDB.budget||0)-importo; await sb.from('squadre').update({budget:sqAcqDB.budget}).eq('id',sqAcquirente); }
    if(sqCedDB){ sqCedDB.budget=(sqCedDB.budget||0)+importo; await sb.from('squadre').update({budget:sqCedDB.budget}).eq('id',sqCedente); }
    try{
      await sb.from('movimenti_budget').insert([
        {squadra_id:sqAcquirente,importo:-importo,tipo:'uscita',descrizione:`${t.tipo}: ${nomeG}`,saldo_prima:(sqAcqDB?.budget||0)+importo,saldo_dopo:(sqAcqDB?.budget||0)},
        {squadra_id:sqCedente,importo:importo,tipo:'entrata',descrizione:`${t.tipo}: ${nomeG}`,saldo_prima:(sqCedDB?.budget||0)-importo,saldo_dopo:(sqCedDB?.budget||0)}
      ]);
    }catch(e){console.warn('Log budget:',e);}
  }

  return true;
}

async function cambiaStatoTrattativa(id, stato){
  try{
    const t = trattativeDB.find(x=>String(x.id)===String(id));
    if(!t) throw new Error('Trattativa non trovata');

    if(stato==='approvata'){
      const ok = await eseguiTrasferimento(t);
      if(!ok) throw new Error('Trasferimento fallito');
    }

    await sb.from('trattative').update({stato, approvata_da:'admin', approvata_at:new Date().toISOString()}).eq('id', id);
    const idx = trattativeDB.findIndex(x=>String(x.id)===String(id));
    if(idx>=0) trattativeDB[idx].stato = stato;

    showToast(stato==='approvata'?'✅ Trattativa approvata!':'❌ Trattativa rifiutata!');
    renderTrattative();
    if(stato==='approvata') renderOverview();
  }catch(e){
    showToast('❌ '+e.message,'error');
    console.error('Errore:', e);
  }
}

async function annullaTrattativa(id){
  if(!adminLoggato) return;
  if(!confirm('⚠️ Annullare?\nI giocatori torneranno alle squadre originali.')) return;
  try{
    const t = trattativeDB.find(x=>String(x.id)===String(id));
    if(!t) throw new Error('Trattativa non trovata');

    const sqCedente = t.squadra_cedente_id||t.squadra_ricevente_id;
    const sqAcquirente = t.squadra_acquirente_id||t.squadra_offerente_id;

    if(t.giocatore_id){
      const reset={squadra_id:sqCedente,contratto:'Titolo Definitivo',badge:null,squadra_propr:null,scadenza:null,riscatto:null,scadenza_riscatto:null,squadra_originale_id:null};
      await sb.from('giocatori').update(reset).eq('id',parseInt(t.giocatore_id));
      const i=giocatoriDB.findIndex(g=>String(g.id)===String(t.giocatore_id));
      if(i>=0) giocatoriDB[i]={...giocatoriDB[i],...reset};
    }

    for(const gId of (t.giocatori_cambio_ids||[])){
      const upd={squadra_id:sqAcquirente,contratto:'Titolo Definitivo',badge:null,squadra_propr:null,scadenza:null};
      await sb.from('giocatori').update(upd).eq('id',gId);
      const i=giocatoriDB.findIndex(g=>g.id==gId);
      if(i>=0) giocatoriDB[i]={...giocatoriDB[i],...upd};
    }

    if(t.importo&&t.importo>0){
      const sqAcqDB=squadreDB.find(s=>s.id===sqAcquirente);
      const sqCedDB=squadreDB.find(s=>s.id===sqCedente);
      if(sqAcqDB){sqAcqDB.budget=(sqAcqDB.budget||0)+t.importo;await sb.from('squadre').update({budget:sqAcqDB.budget}).eq('id',sqAcquirente);}
      if(sqCedDB){sqCedDB.budget=(sqCedDB.budget||0)-t.importo;await sb.from('squadre').update({budget:sqCedDB.budget}).eq('id',sqCedente);}
    }

    await sb.from('trattative').update({stato:'in_attesa'}).eq('id',id);
    const idx=trattativeDB.findIndex(x=>String(x.id)===String(id));
    if(idx>=0) trattativeDB[idx].stato='in_attesa';

    showToast('↩️ Annullata!');
    renderTrattative();
    renderOverview();
  }catch(e){
    showToast('❌ '+e.message,'error');
    console.error('Errore annulla:', e);
  }
}
