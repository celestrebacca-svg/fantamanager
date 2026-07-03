// ===== CARICA DATI =====
async function ricaricaDati(){
  document.getElementById('squadre-overview').innerHTML='<div class="loading"><div class="loading-spinner"></div>Riconnessione...</div>';
  const ok=await caricaDati();
  if(ok) renderOverview();
}

async function caricaDati(){
  try{
    const sq=await sb.from('squadre').select('*').order('nome');
    if(sq.error) throw new Error(sq.error.message);
    squadreDB=sq.data||[];
    document.getElementById('home-num-squadre').textContent=squadreDB.length||'—';
    sb.from('trattative').select('*').order('created_at',{ascending:false})
      .then(r=>{if(!r.error){trattativeDB=r.data||[];controllaPrestatiScaduti();}});
    caricaGiocatoriBackground();
    return true;
  }catch(e){
    showToast('❌ '+e.message,'error');
    return false;
  }
}

async function caricaGiocatoriBackground(){
  try{
    const r1=await sb.from('giocatori').select('*').order('nome').range(0,199);
    if(!r1.error){
      giocatoriDB=r1.data||[];
      if(document.getElementById('section-rose')?.classList.contains('active')) renderOverview();
    }
    const r2=await sb.from('giocatori').select('*').order('nome').range(200,599);
    if(!r2.error){
      giocatoriDB=[...giocatoriDB,...(r2.data||[])];
    }
    sb.from('tifosi_log').select('*').order('created_at',{ascending:false})
      .then(r=>{if(!r.error)tifosi_logDB=r.data||[];});
  }catch(e){console.warn('Background load error:',e);}
}

// ===== CONTROLLO SCADENZA PRESTITI =====
async function controllaPrestatiScaduti(){
  try{
    const oggi=new Date();
    oggi.setHours(0,0,0,0);

    const prestatiScaduti=trattativeDB.filter(t=>{
      if(t.stato!=='approvata') return false;
      const tipo=t.tipo||'';
      if(!tipo.includes('Prestito')) return false;
      if(t.prestito_rientrato) return false;
      if(!t.scadenza_prestito) return false;
      const scadenza=new Date(t.scadenza_prestito);
      scadenza.setHours(0,0,0,0);
      return scadenza<=oggi;
    });

    if(!prestatiScaduti.length) return;

    for(const t of prestatiScaduti){
      // La squadra originale è sqRic (chi ha ceduto = ricevente della proposta)
      const sqOriginale=t.squadra_ricevente_id||t.squadra_acquirente_id;
      if(!sqOriginale||!t.giocatore_id) continue;

      // Riporta giocatore alla squadra originale e resetta contratto
      const resetData={
        squadra_id: sqOriginale,
        squadra_originale_id: null,
        contratto: 'Titolo Definitivo',
        badge: null,
        squadra_propr: null,
        scadenza: null,
        riscatto: null,
        scadenza_riscatto: null,
      };
      const{error}=await sb.from('giocatori').update(resetData).eq('id',t.giocatore_id);
      if(error){console.warn('Errore rientro prestito:',error);continue;}

      // Marca la trattativa come completata
      await sb.from('trattative').update({prestito_rientrato:true,stato:'completata'}).eq('id',t.id);

      // Aggiorna DB locale
      const gIdx=giocatoriDB.findIndex(g=>g.id===t.giocatore_id);
      if(gIdx>=0) giocatoriDB[gIdx]={...giocatoriDB[gIdx],...resetData};
      const tIdx=trattativeDB.findIndex(x=>x.id===t.id);
      if(tIdx>=0){trattativeDB[tIdx].prestito_rientrato=true;trattativeDB[tIdx].stato='completata';}

      const g=giocatoriDB.find(x=>x.id===t.giocatore_id);
      const sqNome=squadreDB.find(s=>s.id===sqOriginale)?.nome||sqOriginale;
      showToast(`🔄 Prestito scaduto: ${g?g.nome:'Giocatore'} rientrato a ${sqNome}`);
    }
  }catch(e){console.warn('Errore controllo prestiti scaduti:',e);}
}
