// ===== CARICA DATI =====
async function ricaricaDati(){
  document.getElementById('squadre-overview').innerHTML='<div class="loading"><div class="loading-spinner"></div>Riconnessione...</div>';
  const ok=await caricaDati();
  if(ok) renderOverview();
}

async function caricaDati(){
  try{
    // Al login carica SOLO le squadre - veloci e leggere
    const sq=await sb.from('squadre').select('*').order('nome');
    if(sq.error) throw new Error(sq.error.message);
    squadreDB=sq.data||[];
    document.getElementById('home-num-squadre').textContent=squadreDB.length||'—';
    // Carica trattative in background
    sb.from('trattative').select('*').order('created_at',{ascending:false})
      .then(r=>{if(!r.error){trattativeDB=r.data||[];controllaPrestatiScaduti();}});
    // Carica giocatori in background a chunk
    caricaGiocatoriBackground();
    return true;
  }catch(e){
    showToast('❌ '+e.message,'error');
    return false;
  }
}

async function caricaGiocatoriBackground(){
  try{
    // Carica prima 200 giocatori
    const r1=await sb.from('giocatori').select('*').order('nome').range(0,199);
    if(!r1.error){
      giocatoriDB=r1.data||[];
      // Aggiorna overview con i giocatori parziali
      if(document.getElementById('section-rose')?.classList.contains('active')) renderOverview();
    }
    // Poi i restanti
    const r2=await sb.from('giocatori').select('*').order('nome').range(200,599);
    if(!r2.error){
      giocatoriDB=[...giocatoriDB,...(r2.data||[])];
    }
    // Tifosi log
    sb.from('tifosi_log').select('*').order('created_at',{ascending:false})
      .then(r=>{if(!r.error)tifosi_logDB=r.data||[];});
  }catch(e){console.warn('Background load error:',e);}
}

// ===== CONTROLLO SCADENZA PRESTITI =====
async function controllaPrestatiScaduti(){
  try{
    const oggi=new Date();
    oggi.setHours(0,0,0,0);

    // Trova tutti i prestiti approvati con scadenza passata e non ancora rientrati
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
      // La squadra originale è sempre sqOff (chi ha ceduto in prestito)
      const sqOriginale=t.squadra_offerente_id||t.squadra_cedente_id;
      if(!sqOriginale||!t.giocatore_id) continue;

      // Riporta il giocatore alla squadra originale
      const{error}=await sb.from('giocatori').update({squadra_id:sqOriginale}).eq('id',t.giocatore_id);
      if(error){console.warn('Errore rientro prestito:',error);continue;}

      // Marca la trattativa come rientrata
      await sb.from('trattative').update({prestito_rientrato:true,stato:'completata'}).eq('id',t.id);

      // Aggiorna DB locale
      const gIdx=giocatoriDB.findIndex(g=>g.id===t.giocatore_id);
      if(gIdx>=0) giocatoriDB[gIdx].squadra_id=sqOriginale;
      const tIdx=trattativeDB.findIndex(x=>x.id===t.id);
      if(tIdx>=0){trattativeDB[tIdx].prestito_rientrato=true;trattativeDB[tIdx].stato='completata';}

      // Notifica
      const g=giocatoriDB.find(x=>x.id===t.giocatore_id);
      const sqNome=squadreDB.find(s=>s.id===sqOriginale)?.nome||sqOriginale;
      showToast(`🔄 Prestito scaduto: ${g?g.nome:'Giocatore'} rientrato a ${sqNome}`);
    }
  }catch(e){console.warn('Errore controllo prestiti scaduti:',e);}
}
