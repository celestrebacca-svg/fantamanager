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
      .then(r=>{if(!r.error)trattativeDB=r.data||[];});
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
