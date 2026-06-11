// ===== TRANSFERMARKT (endpoint corretto) =====
async function cercaGiocatoreTM(nome){
  try{
    // Endpoint corretto per "Transfermarkt Football Data" su RapidAPI
    const res=await fetch(`https://transfermarkt-football-data-api.p.rapidapi.com/api/v1/players/search?query=${encodeURIComponent(nome)}&locale=IT`,{
      method:'GET',
      headers:{
        'X-RapidAPI-Key':RAPIDAPI_KEY,
        'X-RapidAPI-Host':'transfermarkt-football-data-api.p.rapidapi.com'
      }
    });
    if(!res.ok) throw new Error('HTTP '+res.status);
    const data=await res.json();
    // Prova vari formati risposta dell'API
    const players=data?.data?.items||data?.data||data?.items||data?.players||data?.results||[];
    if(!players.length) return null;
    const p=players[0];
    // Normalizza i campi (l'API può usare nomi diversi)
    const marketValue=p.marketValue||p.market_value||p.value||null;
    const age=p.age||p.eta||null;
    const dob=p.dateOfBirth||p.date_of_birth||p.birthdate||null;
    return{
      quotazione:marketValue?parseFloat((marketValue/1000000).toFixed(2)):null,
      eta:age?parseInt(age):null,
      data_nascita:dob||null
    };
  }catch(e){console.warn('TM API error:',nome,e.message);return null;}
}

async function aggiornaTuttiTM(){
  if(!adminLoggato){showToast('❌ Non sei admin!');return;}
  showToast('🔄 Avvio aggiornamento TM...');
  let aggiornati=0,errori=0;
  for(const g of giocatoriDB){
    const dati=await cercaGiocatoreTM(g.nome);
    if(!dati){errori++;await new Promise(r=>setTimeout(r,300));continue;}
    const updates={};
    if(dati.quotazione) updates.quotazione=dati.quotazione;
    if(dati.eta) updates.eta=dati.eta;
    if(dati.data_nascita) updates.data_nascita=dati.data_nascita;
    if(!Object.keys(updates).length){errori++;await new Promise(r=>setTimeout(r,300));continue;}
    try{
      const{error}=await sb.from('giocatori').update(updates).eq('id',g.id);
      if(!error){
        const idx=giocatoriDB.findIndex(x=>x.id===g.id);
        if(idx>=0) giocatoriDB[idx]={...giocatoriDB[idx],...updates};
        aggiornati++;
      }else errori++;
    }catch(e){errori++;}
    await new Promise(r=>setTimeout(r,400)); // rispetta rate limit
  }
  showToast(`✅ TM: ${aggiornati} aggiornati • ${errori} non trovati`);
  if(squadraAttiva) renderRosa(tabAttivoSq);
}

// Aggiorna singolo giocatore da TM (dalla scheda)
async function aggiornaTMSingolo(gId){
  const g=giocatoriDB.find(x=>x.id===gId);
  if(!g) return;
  showToast('🔄 Cercando su Transfermarkt...');
  const dati=await cercaGiocatoreTM(g.nome);
  if(!dati){showToast('❌ '+g.nome+' non trovato su TM','error');return;}
  const updates={};
  if(dati.quotazione) updates.quotazione=dati.quotazione;
  if(dati.eta) updates.eta=dati.eta;
  if(dati.data_nascita) updates.data_nascita=dati.data_nascita;
  if(!Object.keys(updates).length){showToast('⚠️ Nessun dato trovato','error');return;}
  const{error}=await sb.from('giocatori').update(updates).eq('id',g.id);
  if(!error){
    const idx=giocatoriDB.findIndex(x=>x.id===g.id);
    if(idx>=0) giocatoriDB[idx]={...giocatoriDB[idx],...updates};
    showToast(`✅ ${g.nome}: ${dati.quotazione?dati.quotazione+'M€':''} ${dati.eta?'• '+dati.eta+' anni':''}`);
  }else showToast('❌ Errore salvataggio','error');
}

// ===== ROSE TABS =====
