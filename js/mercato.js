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
    const g=giocatoriDB.find(x=>x.id===t.giocatore_id);
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
    const{error}=await sb.from('trattative').update({stato,approvata_da:'admin',approvata_at:new Date().toISOString()}).eq('id',id);
    if(error) throw error;
    const idx=trattativeDB.findIndex(t=>t.id===id);
    if(idx>=0) trattativeDB[idx].stato=stato;
    showToast(stato==='approvata'?'✅ Trattativa approvata!':'❌ Trattativa rifiutata!');
    renderTrattative();
  }catch(e){showToast('❌ Errore: '+e.message,'error');}
}
