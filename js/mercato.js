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
        ${t.importo?`<div class="trattativa-row"><span class="label">Importo</span><span style="color:var(--verde);font-family:'Space Mono',monospace">${fmtNum(t.importo)} FM</span></div>`:''}
        ${t.importo_riscatto?`<div class="trattativa-row"><span class="label">Riscatto</span><span style="color:var(--oro);font-family:'Space Mono',monospace">${fmtNum(t.importo_riscatto)} FM</span></div>`:''}
        ${t.importo_recompra?`<div class="trattativa-row"><span class="label">Recompra entro</span><span style="color:var(--argento)">${t.scadenza_recompra||'—'}</span></div>`:''}
        ${t.scadenza_prestito?`<div class="trattativa-row"><span class="label">Scadenza prestito</span><span>${t.scadenza_prestito}</span></div>`:''}
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
    </div>`;
  }).join('');
}

async function cambiaStatoTrattativa(id,stato){
  try{
    const t=trattativeDB.find(x=>x.id===id);
    if(!t) throw new Error('Trattativa non trovata');

    const{error}=await sb.from('trattative').update({stato,approvata_da:'admin',approvata_at:new Date().toISOString()}).eq('id',id);
    if(error) throw error;

    if(stato==='approvata'){
      // Leggo entrambi i nomi colonna possibili
      const sqOff=t.squadra_offerente_id||t.squadra_cedente_id;
      const sqRic=t.squadra_ricevente_id||t.squadra_acquirente_id;
      const tipo=t.tipo||'';
      const isScambio=tipo.includes('Scambio');
      const isPrestito=tipo.includes('Prestito');

      // ── TRASFERIMENTO GIOCATORE PRINCIPALE ──
      // Prestito: va a sqRic temporaneamente (torna alla scadenza)
      // Tutti gli altri: va a sqRic definitivamente
      if(t.giocatore_id){
        await sb.from('giocatori').update({squadra_id:sqRic}).eq('id',t.giocatore_id);
        const gIdx=giocatoriDB.findIndex(g=>g.id===t.giocatore_id);
        if(gIdx>=0) giocatoriDB[gIdx].squadra_id=sqRic;
      }

      // ── TRASFERIMENTO GIOCATORI SCAMBIO ──
      // giocatori_cambio_ids = miei che offro → vanno a sqRic
      // giocatori_ids_richiesti = suoi che voglio → vengono a sqOff
      if(isScambio){
        const miei=t.giocatori_cambio_ids||[];
        const suoi=t.giocatori_ids_richiesti||[];
        for(const gId of miei){
          await sb.from('giocatori').update({squadra_id:sqRic}).eq('id',gId);
          const idx=giocatoriDB.findIndex(g=>g.id===gId);
          if(idx>=0) giocatoriDB[idx].squadra_id=sqRic;
        }
        for(const gId of suoi){
          await sb.from('giocatori').update({squadra_id:sqOff}).eq('id',gId);
          const idx=giocatoriDB.findIndex(g=>g.id===gId);
          if(idx>=0) giocatoriDB[idx].squadra_id=sqOff;
        }
      }

      // ── BUDGET ──
      // Lo swap sqOff/sqRic è già avvenuto in bonus.js se dir='ricevo'
      // quindi sqOff paga SEMPRE e sqRic incassa SEMPRE
      if(t.importo){
        const sqOffDB=squadreDB.find(s=>s.id===sqOff);
        const sqRicDB=squadreDB.find(s=>s.id===sqRic);
        const sqOffIdx=squadreDB.findIndex(s=>s.id===sqOff);
        const sqRicIdx=squadreDB.findIndex(s=>s.id===sqRic);
        if(sqOffDB) await sb.from('squadre').update({budget:sqOffDB.budget-t.importo}).eq('id',sqOff);
        if(sqRicDB) await sb.from('squadre').update({budget:sqRicDB.budget+t.importo}).eq('id',sqRic);
        if(sqOffIdx>=0) squadreDB[sqOffIdx].budget-=t.importo;
        if(sqRicIdx>=0) squadreDB[sqRicIdx].budget+=t.importo;
      }
    }

    const idx=trattativeDB.findIndex(x=>x.id===id);
    if(idx>=0) trattativeDB[idx].stato=stato;
    showToast(stato==='approvata'?'✅ Trattativa approvata! Giocatore trasferito!':'❌ Trattativa rifiutata!');
    renderTrattative();
    if(stato==='approvata') renderOverview();
  }catch(e){showToast('❌ Errore: '+e.message,'error');}
}
