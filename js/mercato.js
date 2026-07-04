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
    const gc=t.giocatore_cambio_id?giocatoriDB.find(x=>x.id===t.giocatore_cambio_id):null;
    const statoClass={'in_attesa':'stato-attesa','approvata':'stato-approvata','completata':'stato-completata','rifiutata':'stato-rifiutata'}[t.stato]||'stato-attesa';
    const statoLabel={'in_attesa':'⏳ In attesa','approvata':'✅ Approvata','completata':'🏁 Completata','rifiutata':'❌ Rifiutata'}[t.stato]||t.stato;
    const isAdmin=adminLoggato;
    const miaTratt=utenteLoggato&&(t.squadra_offerente_id===utenteLoggato.id||t.squadra_ricevente_id===utenteLoggato.id);
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
        ${gc?`<div class="trattativa-row"><span class="label">In cambio</span><span style="font-weight:600">${gc.nome} (${gc.ruolo})</span></div>`:''}
        ${t.importo&&!t.tipo?.includes('Prestito')?`<div class="trattativa-row"><span class="label">Importo</span><span style="color:var(--verde);font-family:'Space Mono',monospace">${fmtNum(t.importo)} FM</span></div>`:''}
        ${t.tipo?.includes('Prestito')&&t.importo?`<div class="trattativa-row"><span class="label">💰 Cifra Prestito</span><span style="color:var(--blu);font-family:'Space Mono',monospace">${fmtNum(t.importo)} FM</span></div>`:''}
        ${t.importo_riscatto?`<div class="trattativa-row"><span class="label">🔑 Riscatto Finale</span><span style="color:var(--oro);font-family:'Space Mono',monospace">${fmtNum(t.importo_riscatto)} FM</span></div>`:''}
        ${t.importo_recompra?`<div class="trattativa-row"><span class="label">🔄 Contro-riscatto</span><span style="color:orange;font-family:'Space Mono',monospace">${fmtNum(t.importo_recompra)} FM${t.scadenza_recompra?' entro '+t.scadenza_recompra:''}</span></div>`:''}
        ${t.scadenza_prestito?`<div class="trattativa-row"><span class="label">📅 Scadenza prestito</span><span>${t.scadenza_prestito}</span></div>`:''}
        ${t.scadenza_riscatto?`<div class="trattativa-row"><span class="label">⏰ Scadenza riscatto</span><span>${t.scadenza_riscatto}</span></div>`:''}
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

// ── Helper: costruisce update contratto giocatore ──
// sqProprietariaId = squadra che rimane proprietaria del cartellino
function buildContrattoUpdate(tipo, trattativa, sqProprietariaId){
  const isPrestito=tipo.toLowerCase().includes('prestito');
  const hasDiritto=tipo.includes('Diritto');
  const hasObbligo=tipo.includes('Obbligo');
  if(isPrestito){
    let tipoContratto='Prestito Secco';
    if(hasDiritto) tipoContratto='Prestito con Diritto di Riscatto';
    if(hasObbligo) tipoContratto='Prestito con Obbligo di Riscatto';
    return {
      contratto: tipoContratto,
      badge: 'P',
      squadra_propr: sqProprietariaId||null,
      scadenza: trattativa.scadenza_prestito||null,
      riscatto: trattativa.importo_riscatto||null,
      scadenza_riscatto: trattativa.scadenza_riscatto||null,
    };
  } else {
    return {
      contratto: 'Titolo Definitivo',
      badge: null,
      squadra_propr: null,
      scadenza: null,
      riscatto: null,
      scadenza_riscatto: null,
      squadra_originale_id: null,
    };
  }
}

async function cambiaStatoTrattativa(id,stato){
  try{
    const t=trattativeDB.find(x=>String(x.id)===String(id));
    if(!t) throw new Error('Trattativa non trovata');

    const{error}=await sb.from('trattative').update({stato,approvata_da:'admin',approvata_at:new Date().toISOString()}).eq('id',id).select();
    if(error) throw error;

    if(stato==='approvata'){
      const sqOff=t.squadra_offerente_id||t.squadra_cedente_id;
      const sqRic=t.squadra_ricevente_id||t.squadra_acquirente_id;
      const tipo=t.tipo||'';
      const isScambio=tipo.toLowerCase().includes('scambio');
      const isPrestito=tipo.toLowerCase().includes('prestito');

      // ── TRASFERIMENTO GIOCATORE PRINCIPALE ──
      if(t.giocatore_id){
        // sqOff=acquirente, sqRic=cedente (convenzione DB)
        // Prestito: giocatore va a sqOff (acquirente), proprietario resta sqRic (cedente)
        // Definitivo: giocatore va a sqOff (acquirente)
        const destId=sqOff;
        const sqProprietaria=isPrestito?sqRic:null;
        const updateData={
          squadra_id: destId,
          squadra_originale_id: isPrestito?sqRic:null,
          ...buildContrattoUpdate(tipo, t, sqProprietaria)
        };
        const{error:gErr,data:gData}=await sb.from('giocatori').update(updateData).eq('id',t.giocatore_id).select().single();
        if(gErr) console.warn('Errore update giocatore:',gErr);
        else console.log('Giocatore aggiornato:',gData?.contratto,gData?.badge);
        const gIdx=giocatoriDB.findIndex(g=>String(g.id)===String(t.giocatore_id));
        if(gIdx>=0) giocatoriDB[gIdx]={...giocatoriDB[gIdx],...updateData};
      }

      // ── TRASFERIMENTO GIOCATORI SCAMBIO ──
      if(isScambio){
        const miei=t.giocatori_cambio_ids||[];
        const suoi=t.giocatori_ids_richiesti||[];
        for(const gId of miei){
          const upd={squadra_id:sqRic,...buildContrattoUpdate('Titolo Definitivo',{},null)};
          await sb.from('giocatori').update(upd).eq('id',gId);
          const idx=giocatoriDB.findIndex(g=>g.id==gId);
          if(idx>=0) giocatoriDB[idx]={...giocatoriDB[idx],...upd};
        }
        for(const gId of suoi){
          const upd={squadra_id:sqOff,...buildContrattoUpdate('Titolo Definitivo',{},null)};
          await sb.from('giocatori').update(upd).eq('id',gId);
          const idx=giocatoriDB.findIndex(g=>g.id==gId);
          if(idx>=0) giocatoriDB[idx]={...giocatoriDB[idx],...upd};
        }
      }

      // ── BUDGET + STORICO MOVIMENTI ──
      const g=giocatoriDB.find(x=>x.id==t.giocatore_id);
      const nomeG=g?g.nome:(t.giocatore_nome||'Giocatore');
      const sqOffDB=squadreDB.find(s=>s.id===sqOff);
      const sqRicDB=squadreDB.find(s=>s.id===sqRic);
      const sqOffIdx=squadreDB.findIndex(s=>s.id===sqOff);
      const sqRicIdx=squadreDB.findIndex(s=>s.id===sqRic);

      const acconto=parseFloat(t.acconto_immediato)||0;
      const totImmediato=(parseFloat(t.importo)||0)+acconto;
      if(totImmediato>0){
        if(sqOffDB) await sb.from('squadre').update({budget:sqOffDB.budget-totImmediato}).eq('id',sqOff);
        if(sqRicDB) await sb.from('squadre').update({budget:sqRicDB.budget+totImmediato}).eq('id',sqRic);
        if(sqOffIdx>=0) squadreDB[sqOffIdx].budget-=totImmediato;
        if(sqRicIdx>=0) squadreDB[sqRicIdx].budget+=totImmediato;
        try{
          const budgetOffDopo=(sqOffDB?sqOffDB.budget:0)-totImmediato;
          const budgetRicDopo=(sqRicDB?sqRicDB.budget:0)+totImmediato;
          await sb.from('movimenti_budget').insert([
            {squadra_id:sqOff,importo:-totImmediato,tipo:'uscita',descrizione:`${t.tipo}: ${nomeG}`,saldo_prima:sqOffDB?sqOffDB.budget:null,saldo_dopo:budgetOffDopo},
            {squadra_id:sqRic,importo:totImmediato,tipo:'entrata',descrizione:`${t.tipo}: ${nomeG}`,saldo_prima:sqRicDB?sqRicDB.budget:null,saldo_dopo:budgetRicDopo}
          ]);
        }catch(e){console.warn('Log movimenti:',e.message);}
      }
    }

    const idx=trattativeDB.findIndex(x=>x.id===id);
    if(idx>=0) trattativeDB[idx].stato=stato;
    showToast(stato==='approvata'?'✅ Trattativa approvata! Giocatore trasferito!':'❌ Trattativa rifiutata!');
    renderTrattative();
    if(stato==='approvata') renderOverview();
  }catch(e){showToast('❌ Errore: '+e.message,'error');}
}

async function annullaTrattativa(id){
  if(!adminLoggato) return;
  if(!confirm('⚠️ Annullare questa trattativa?\nI giocatori torneranno alle squadre originali e i budget verranno ripristinati.')) return;
  try{
    const t=trattativeDB.find(x=>String(x.id)===String(id));
    if(!t) throw new Error('Trattativa non trovata');

    const sqOff=t.squadra_offerente_id||t.squadra_cedente_id;
    const sqRic=t.squadra_ricevente_id||t.squadra_acquirente_id;
    const tipo=(t.tipo||'').toLowerCase();
    const isScambio=tipo.includes('scambio');
    const isPrestito=tipo.includes('prestito');

    // Ripristino giocatore principale con contratto pulito
    if(t.giocatore_id){
      const origId=isPrestito?sqRic:sqRic; // torna sempre a sqRic (chi cedeva)
      const resetData={
        squadra_id:origId,
        contratto:'Titolo Definitivo',
        badge:null,
        squadra_propr:null,
        scadenza:null,
        riscatto:null,
        scadenza_riscatto:null,
        squadra_originale_id:null,
      };
      await sb.from('giocatori').update(resetData).eq('id',t.giocatore_id);
      const gIdx=giocatoriDB.findIndex(g=>g.id==t.giocatore_id);
      if(gIdx>=0) giocatoriDB[gIdx]={...giocatoriDB[gIdx],...resetData};
    }

    // Ripristino giocatori scambio
    if(isScambio){
      const miei=t.giocatori_cambio_ids||[];
      const suoi=t.giocatori_ids_richiesti||[];
      for(const gId of miei){
        const upd={squadra_id:sqOff,contratto:'Titolo Definitivo',badge:null,squadra_propr:null,scadenza:null};
        await sb.from('giocatori').update(upd).eq('id',gId);
        const idx=giocatoriDB.findIndex(g=>g.id==gId);
        if(idx>=0) giocatoriDB[idx]={...giocatoriDB[idx],...upd};
      }
      for(const gId of suoi){
        const upd={squadra_id:sqRic,contratto:'Titolo Definitivo',badge:null,squadra_propr:null,scadenza:null};
        await sb.from('giocatori').update(upd).eq('id',gId);
        const idx=giocatoriDB.findIndex(g=>g.id==gId);
        if(idx>=0) giocatoriDB[idx]={...giocatoriDB[idx],...upd};
      }
    }

    // Ripristino budget
    if(t.importo&&t.importo>0){
      const sqOffDB=squadreDB.find(s=>s.id===sqOff);
      const sqRicDB=squadreDB.find(s=>s.id===sqRic);
      if(sqOffDB){
        const nb=sqOffDB.budget+t.importo;
        await sb.from('squadre').update({budget:nb}).eq('id',sqOff);
        sqOffDB.budget=nb;
      }
      if(sqRicDB){
        const nb=sqRicDB.budget-t.importo;
        await sb.from('squadre').update({budget:nb}).eq('id',sqRic);
        sqRicDB.budget=nb;
      }
    }

    try{ await sb.from('rate_mercato').delete().eq('trattativa_id',id); }
    catch(e){ console.warn('Rate:',e.message); }

    await sb.from('trattative').update({stato:'in_attesa'}).eq('id',id);
    const idx=trattativeDB.findIndex(x=>x.id===id);
    if(idx>=0) trattativeDB[idx].stato='in_attesa';

    showToast('↩️ Trattativa annullata e ripristinata!');
    renderTrattative();
    renderOverview();
  }catch(e){showToast('❌ Errore: '+e.message,'error');}
}
