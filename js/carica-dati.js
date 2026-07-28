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

    // IMPORTANTE: la stagione va caricata PRIMA di qualsiasi altra cosa (await,
    // non fire-and-forget) — altrimenti per una frazione di secondo l'app usa
    // ancora il valore di fallback vecchio, e qualsiasi azione fatta in quella
    // finestra (es. pescare un obiettivo Risiko) viene salvata con la stagione
    // sbagliata e sparisce silenziosamente dalla vista.
    try{
      const imp=await sb.from('impostazioni').select('*').eq('id',1).single();
      if(!imp.error&&imp.data?.stagione_corrente) STAGIONE_CORRENTE=normalizzaStagione(imp.data.stagione_corrente);
      if(!imp.error) LIMITI_ROSE_ATTIVI=!!imp.data?.limiti_rose_attivi;
    }catch(e){ console.warn('Impostazioni non caricate, uso fallback:',e.message); }
    stagioneCaricata=true; // segnala alla UI che il tentativo di caricamento è concluso (successo o fallback)
    if(typeof aggiornaCardLimitiRose==='function') aggiornaCardLimitiRose();

    sb.from('domande_custom').select('*').order('created_at')
      .then(r=>{if(!r.error) domandeCustomDB=r.data||[];})
      .catch(e=>console.warn('Domande custom non caricate:',e.message));
    sb.from('rate_mercato').select('*').order('data_scadenza')
      .then(r=>{if(!r.error){rateMercato=r.data||[]; controllaRateScadute();}})
      .catch(e=>console.warn('Rate mercato non caricate:',e.message));
    sb.from('immagini_config').select('*')
      .then(r=>{
        if(r.error) return;
        (r.data||[]).forEach(row=>{
          immaginiConfigDB[row.chiave]=row.url;
          if(row.chiave.startsWith('trofeo_')) IMMAGINI_TROFEI[row.chiave.replace('trofeo_','')]=row.url;
          else if(row.chiave.startsWith('stadio_')) IMMAGINI_STADI[parseInt(row.chiave.replace('stadio_',''))]=row.url;
          else if(row.chiave.startsWith('store_')) IMMAGINI_STORE[parseInt(row.chiave.replace('store_',''))]=row.url;
          else if(row.chiave.startsWith('fastfood_')) IMMAGINI_FASTFOOD[parseInt(row.chiave.replace('fastfood_',''))]=row.url;
        });
      })
      .catch(e=>console.warn('Immagini config non caricate:',e.message));
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
// Controlla direttamente sui giocatori (badge=P, scadenza popolata)
async function controllaPrestatiScaduti(){
  try{
    const oggi=new Date();
    oggi.setHours(0,0,0,0);

    // Cerca giocatori in prestito con scadenza passata
    const inPrestito=giocatoriDB.filter(g=>{
      if(g.badge!=='P') return false;
      if(!g.scadenza) return false;
      const scad=new Date(g.scadenza);
      scad.setHours(0,0,0,0);
      return scad<=oggi;
    });

    if(!inPrestito.length) return;

    for(const g of inPrestito){
      // squadra_propr = chi possiede il cartellino (torna lì)
      // squadra_propr contiene l'id stringa della squadra (es. "damiano")
      // squadra_propr può avere maiuscole diverse dall'id — normalizza in minuscolo
      const sqOriginale=(g.squadra_propr||g.squadra_originale_id||'').toLowerCase()||null;
      if(!sqOriginale){console.warn('Nessuna squadra originale per',g.nome);continue;}

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
      const{error}=await sb.from('giocatori').update(resetData).eq('id',g.id);
      if(error){console.warn('Errore rientro prestito:',error);continue;}

      // Marca trattativa come completata
      const trat=trattativeDB.find(t=>String(t.giocatore_id)===String(g.id)&&t.stato==='approvata');
      if(trat){
        await sb.from('trattative').update({prestito_rientrato:true,stato:'completata'}).eq('id',trat.id);
        const tIdx=trattativeDB.findIndex(x=>x.id===trat.id);
        if(tIdx>=0){trattativeDB[tIdx].prestito_rientrato=true;trattativeDB[tIdx].stato='completata';}
      }

      // Aggiorna DB locale
      const gIdx=giocatoriDB.findIndex(x=>String(x.id)===String(g.id));
      if(gIdx>=0) giocatoriDB[gIdx]={...giocatoriDB[gIdx],...resetData};

      const sqNome=squadreDB.find(s=>String(s.id)===String(sqOriginale))?.nome||sqOriginale;
      showToast(`🔄 Prestito scaduto: ${g.nome} rientrato a ${sqNome}`);

      logStoricoGiocatore(g.id,'rientro_prestito',{
        squadra_da: g.squadra_id, squadra_a: sqOriginale,
        tipo_contratto: 'Titolo Definitivo',
        note: 'Rientro automatico per scadenza prestito',
      });
    }
  }catch(e){console.warn('Errore controllo prestiti scaduti:',e);}
}
