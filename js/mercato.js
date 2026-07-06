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
    const isAdmin=adminLoggato;
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
        ${t.importo&&!t.tipo?.includes('Prestito')?`<div class="trattativa-row"><span class="label">Importo</span><span style="color:var(--verde);font-family:'Space Mono',monospace">${fmtNum(t.importo)} FM</span></div>`:''}
        ${t.tipo?.includes('Prestito')&&t.importo?`<div class="trattativa-row"><span class="label">💰 Cifra Prestito</span><span style="color:var(--blu);font-family:'Space Mono',monospace">${fmtNum(t.importo)} FM</span></div>`:''}
        ${t.importo_riscatto?`<div class="trattativa-row"><span class="label">🔑 Riscatto</span><span style="color:var(--oro);font-family:'Space Mono',monospace">${fmtNum(t.importo_riscatto)} FM${t.scadenza_riscatto?' entro '+t.scadenza_riscatto:''}</span></div>`:''}
        ${t.importo_recompra?`<div class="trattativa-row"><span class="label">🔄 Contro-riscatto</span><span style="color:orange;font-family:'Space Mono',monospace">${fmtNum(t.importo_recompra)} FM${t.scadenza_recompra?' entro '+t.scadenza_recompra:''}</span></div>`:''}
        ${t.scadenza_prestito?`<div class="trattativa-row"><span class="label">📅 Scadenza prestito</span><span>${t.scadenza_prestito}</span></div>`:''}
        ${t.percentuale_rivendita?`<div class="trattativa-row"><span class="label">% Rivendita</span><span style="color:var(--verde)">${t.percentuale_rivendita}%</span></div>`:''}
        ${t.rate&&t.rate.length?`<div class="trattativa-row"><span class="label">Rate</span><span>${t.rate.length} rate programmate</span></div>`:''}
        ${t.note?`<div class="trattativa-row"><span class="label">Note</span><span style="color:var(--testo-dim)">${t.note}</span></div>`:''}
        <div class="trattativa-row"><span class="label">Data</span><span>${new Date(t.created_at).toLocaleDateString('it-IT')}</span></div>
      </div>
      ${isAdmin&&t.stato==='in_attesa'?`
        <div class="trattativa-footer">
          <button class="btn-rifiuta" onclick="cambiaStatoTrattativa(${t.id},'rifiutata')">❌ Rifiuta</button>
          <button class="btn-approva" onclick="cambiaStatoTrattativa(${t.id},'approvata')">✅ Approva</button>
        </div>`:''}
      ${isAdmin&&t.stato==='approvata'?`
        <div class="trattativa-footer">
          <button class="btn-rifiuta" onclick="annullaTrattativa(${t.id})" style="width:100%;background:rgba(255,150,0,0.15);color:orange;border:1px solid rgba(255,150,0,0.4)">↩️ Annulla e ripristina</button>
        </div>`:''}
    </div>`;
  }).join('');
}

// ── Unica funzione che aggiorna il giocatore dopo approvazione ──
// Regola: squadra_offerente = chi ACQUISTA, squadra_ricevente = chi CEDE
async function eseguiTrasferimento(t){
  const tipo = t.tipo||'';
  const isPrestito = tipo.toLowerCase().includes('prestito');
  const isScambio = tipo.toLowerCase().includes('scambio');
  const hasDiritto = tipo.includes('Diritto');
  const hasObbligo = tipo.includes('Obbligo');

  // Chi acquista e chi cede
  const sqAcquirente = t.squadra_offerente_id; // chi ha fatto l'offerta = acquirente
  const sqCedente = t.squadra_ricevente_id;    // chi riceve la proposta = cedente

  // ── GIOCATORE PRINCIPALE ──
  if(t.giocatore_id){
    const gId = parseInt(t.giocatore_id)||t.giocatore_id;

    let updateData;
    if(isPrestito){
      let tipoContratto = 'Prestito Secco';
      if(hasDiritto) tipoContratto = 'Prestito con Diritto di Riscatto';
      if(hasObbligo) tipoContratto = 'Prestito con Obbligo di Riscatto';
      updateData = {
        squadra_id: sqAcquirente,        // va all'acquirente
        squadra_originale_id: sqCedente, // ricorda il cedente per il rientro
        contratto: tipoContratto,
        badge: 'P',
        squadra_propr: sqCedente,        // proprietario = cedente
        scadenza: t.scadenza_prestito||null,
        riscatto: t.importo_riscatto||null,
        scadenza_riscatto: t.scadenza_riscatto||null,
      };
    } else {
      updateData = {
        squadra_id: sqAcquirente,        // va all'acquirente
        squadra_originale_id: null,
        contratto: 'Titolo Definitivo',
        badge: null,
        squadra_propr: null,
        scadenza: null,
        riscatto: null,
        scadenza_riscatto: null,
      };
    }

    const {error} = await sb.from('giocatori').update(updateData).eq('id', gId);
    if(error){
      console.error('Errore trasferimento giocatore:', JSON.stringify(error));
      return false;
    }
    // Aggiorna cache locale
    const idx = giocatoriDB.findIndex(g=>String(g.id)===String(t.giocatore_id));
    if(idx>=0) giocatoriDB[idx]={...giocatoriDB[idx],...updateData};
    console.log('✅ Giocatore trasferito:', updateData.contratto, '→', sqAcquirente);
  }

  // ── GIOCATORI SCAMBIO ──
  if(isScambio){
    const miei = t.giocatori_cambio_ids||[];   // miei che vado alla cedente
    const suoi = t.giocatori_ids_richiesti||[]; // suoi che vanno all'offerente
    for(const gId of miei){
      const upd={squadra_id:sqCedente,contratto:'Titolo Definitivo',badge:null,squadra_propr:null,scadenza:null,riscatto:null,squadra_originale_id:null};
      await sb.from('giocatori').update(upd).eq('id',gId);
      const idx=giocatoriDB.findIndex(g=>g.id==gId);
      if(idx>=0) giocatoriDB[idx]={...giocatoriDB[idx],...upd};
    }
    for(const gId of suoi){
      const upd={squadra_id:sqAcquirente,contratto:'Titolo Definitivo',badge:null,squadra_propr:null,scadenza:null,riscatto:null,squadra_originale_id:null};
      await sb.from('giocatori').update(upd).eq('id',gId);
      const idx=giocatoriDB.findIndex(g=>g.id==gId);
      if(idx>=0) giocatoriDB[idx]={...giocatoriDB[idx],...upd};
    }
  }

  // ── BUDGET ──
  const importo = parseFloat(t.importo)||0;
  if(importo>0){
    const sqAcqDB = squadreDB.find(s=>s.id===sqAcquirente);
    const sqCedDB = squadreDB.find(s=>s.id===sqCedente);
    if(sqAcqDB && sqCedDB){
      const nuovoAcq = (sqAcqDB.budget||0) - importo;
      const nuovoCed = (sqCedDB.budget||0) + importo;
      await sb.from('squadre').update({budget:nuovoAcq}).eq('id',sqAcquirente);
      await sb.from('squadre').update({budget:nuovoCed}).eq('id',sqCedente);
      sqAcqDB.budget = nuovoAcq;
      sqCedDB.budget = nuovoCed;
      const g = giocatoriDB.find(x=>String(x.id)===String(t.giocatore_id));
      const nomeG = g?g.nome:'Giocatore';
      try{
        await sb.from('movimenti_budget').insert([
          {squadra_id:sqAcquirente,importo:-importo,tipo:'uscita',descrizione:`${t.tipo}: ${nomeG}`,saldo_prima:sqAcqDB.budget+importo,saldo_dopo:nuovoAcq},
          {squadra_id:sqCedente,importo:importo,tipo:'entrata',descrizione:`${t.tipo}: ${nomeG}`,saldo_prima:sqCedDB.budget-importo,saldo_dopo:nuovoCed}
        ]);
      }catch(e){console.warn('Log movimenti:',e.message);}
    }
  }

  return true;
}

async function cambiaStatoTrattativa(id, stato){
  try{
    const t = trattativeDB.find(x=>String(x.id)===String(id));
    if(!t) throw new Error('Trattativa non trovata');

    // Prima esegui il trasferimento se approvata
    if(stato==='approvata'){
      const ok = await eseguiTrasferimento(t);
      if(!ok) throw new Error('Trasferimento fallito');
    }

    // Poi aggiorna lo stato
    await sb.from('trattative').update({stato, approvata_da:'admin', approvata_at:new Date().toISOString()}).eq('id',id);

    const idx = trattativeDB.findIndex(x=>String(x.id)===String(id));
    if(idx>=0) trattativeDB[idx].stato = stato;

    showToast(stato==='approvata'?'✅ Trattativa approvata! Giocatore trasferito!':'❌ Trattativa rifiutata!');
    renderTrattative();
    if(stato==='approvata') renderOverview();
  }catch(e){
    showToast('❌ Errore: '+e.message,'error');
    console.error('cambiaStatoTrattativa error:', e);
  }
}

async function annullaTrattativa(id){
  if(!adminLoggato) return;
  if(!confirm('⚠️ Annullare questa trattativa?\nI giocatori torneranno alle squadre originali e i budget verranno ripristinati.')) return;
  try{
    const t = trattativeDB.find(x=>String(x.id)===String(id));
    if(!t) throw new Error('Trattativa non trovata');

    const sqAcquirente = t.squadra_offerente_id;
    const sqCedente = t.squadra_ricevente_id;
    const tipo = (t.tipo||'').toLowerCase();
    const isScambio = tipo.includes('scambio');
    const isPrestito = tipo.includes('prestito');

    // Ripristino giocatore principale → torna al cedente
    if(t.giocatore_id){
      const resetData={
        squadra_id: sqCedente,
        contratto: 'Titolo Definitivo',
        badge: null,
        squadra_propr: null,
        scadenza: null,
        riscatto: null,
        scadenza_riscatto: null,
        squadra_originale_id: null,
      };
      await sb.from('giocatori').update(resetData).eq('id',parseInt(t.giocatore_id)||t.giocatore_id);
      const gIdx = giocatoriDB.findIndex(g=>String(g.id)===String(t.giocatore_id));
      if(gIdx>=0) giocatoriDB[gIdx]={...giocatoriDB[gIdx],...resetData};
    }

    // Ripristino giocatori scambio
    if(isScambio){
      for(const gId of (t.giocatori_cambio_ids||[])){
        const upd={squadra_id:sqAcquirente,contratto:'Titolo Definitivo',badge:null,squadra_propr:null,scadenza:null};
        await sb.from('giocatori').update(upd).eq('id',gId);
        const idx=giocatoriDB.findIndex(g=>g.id==gId);
        if(idx>=0) giocatoriDB[idx]={...giocatoriDB[idx],...upd};
      }
      for(const gId of (t.giocatori_ids_richiesti||[])){
        const upd={squadra_id:sqCedente,contratto:'Titolo Definitivo',badge:null,squadra_propr:null,scadenza:null};
        await sb.from('giocatori').update(upd).eq('id',gId);
        const idx=giocatoriDB.findIndex(g=>g.id==gId);
        if(idx>=0) giocatoriDB[idx]={...giocatoriDB[idx],...upd};
      }
    }

    // Ripristino budget
    if(t.importo&&t.importo>0){
      const sqAcqDB = squadreDB.find(s=>s.id===sqAcquirente);
      const sqCedDB = squadreDB.find(s=>s.id===sqCedente);
      if(sqAcqDB){ sqAcqDB.budget+=t.importo; await sb.from('squadre').update({budget:sqAcqDB.budget}).eq('id',sqAcquirente); }
      if(sqCedDB){ sqCedDB.budget-=t.importo; await sb.from('squadre').update({budget:sqCedDB.budget}).eq('id',sqCedente); }
    }

    await sb.from('trattative').update({stato:'in_attesa'}).eq('id',id);
    const idx = trattativeDB.findIndex(x=>String(x.id)===String(id));
    if(idx>=0) trattativeDB[idx].stato='in_attesa';

    showToast('↩️ Trattativa annullata e ripristinata!');
    renderTrattative();
    renderOverview();
  }catch(e){
    showToast('❌ Errore: '+e.message,'error');
    console.error('annullaTrattativa error:', e);
  }
}
