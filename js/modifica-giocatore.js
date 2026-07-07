// ===== MODIFICA GIOCATORE =====
function apriModificaGiocatore(){
  giocatoreInModifica=null;
  document.getElementById('modifica-step1').style.display='block';
  document.getElementById('modifica-step2').style.display='none';
  document.getElementById('search-giocatore-admin').value='';
  document.getElementById('lista-giocatori-admin').innerHTML='';
  document.getElementById('modal-modifica').classList.add('open');
}

function cercaGiocatoreAdmin(val){
  if(val.length<2){document.getElementById('lista-giocatori-admin').innerHTML='';return;}
  const results=giocatoriDB.filter(g=>g.nome.toLowerCase().includes(val.toLowerCase())).slice(0,20);
  document.getElementById('lista-giocatori-admin').innerHTML=results.map(g=>{
    const sq=squadreDB.find(s=>s.id===g.squadra_id);
    return `<div class="giocatore-search-item" onclick="selezionaGiocatoreAdmin(${g.id})">
      <div class="gsi-avatar">${g.foto_url?`<img src="${g.foto_url}">`:iniziali(g.nome)}</div>
      <div class="gsi-info"><div class="gsi-nome">${g.nome}</div><div class="gsi-sub">${sq?sq.nome:'—'} • ${g.ruolo}</div></div>
    </div>`;
  }).join('');
}

function popolaSelectSquadraPropr(valoreSalvato){
  const sel=document.getElementById('edit-squadra-propr');
  if(!sel) return;
  const match=squadreDB.find(s=>String(s.id).toLowerCase()===String(valoreSalvato).toLowerCase());
  let opts='<option value="">— Seleziona —</option>'+squadreDB.map(s=>
    `<option value="${s.id}">${s.nome}</option>`).join('');
  // Se il valore salvato non corrisponde a nessuna squadra (dato vecchio/errato),
  // lo aggiungo come opzione extra per non perderlo silenziosamente.
  if(valoreSalvato&&!match){
    opts+=`<option value="${valoreSalvato}">⚠️ ${valoreSalvato} (valore esistente, non riconosciuto)</option>`;
  }
  sel.innerHTML=opts;
  sel.value=match?match.id:(valoreSalvato||'');
}

function selezionaGiocatoreAdmin(gId){
  const g=giocatoriDB.find(x=>x.id===gId);
  const sq=squadreDB.find(s=>s.id===g.squadra_id);
  giocatoreInModifica=g;
  document.getElementById('modifica-step1').style.display='none';
  document.getElementById('modifica-step2').style.display='block';
  document.getElementById('edit-foto-inline').style.display='none';
  const av=document.getElementById('edit-avatar');
  av.innerHTML=g.foto_url?`<img src="${g.foto_url}" style="width:52px;height:52px;object-fit:cover;border-radius:50%">`:iniziali(g.nome);
  document.getElementById('edit-nome-display').textContent=g.nome;
  document.getElementById('edit-squadra-display').textContent=sq?sq.nome:'—';
  document.getElementById('edit-nome').value=g.nome||'';
  document.getElementById('edit-foto-url').value=g.foto_url||'';
  document.getElementById('edit-ruolo').value=g.ruolo||'A';
  document.getElementById('edit-eta').value=g.eta||'';
  document.getElementById('edit-data-nascita').value=g.data_nascita||'';
  document.getElementById('edit-maglia').value=g.maglia||'';
  document.getElementById('edit-club-reale').value=g.club_reale||'';
  document.getElementById('edit-contratto').value=g.contratto||'Titolo Definitivo';
  popolaSelectSquadraPropr(g.squadra_propr||'');
  document.getElementById('edit-scadenza').value=g.scadenza||'';
  document.getElementById('edit-riscatto').value=g.riscatto||'';
  document.getElementById('edit-scadenza-riscatto').value=g.scadenza_riscatto||'';
  document.getElementById('edit-clausola').value=g.clausola||'';
  document.getElementById('edit-rivendita').value=g.rivendita||'';
  document.getElementById('edit-quotazione').value=g.quotazione||'';
  document.getElementById('edit-stipendio').value=g.stipendio||'';
  aggiornaFormContratto();
  aggiornaPreviewFotoModifica(g.foto_url||'');
  // Mostra sezione admin solo se admin e giocatore ha una squadra
  const adminAzioni=document.getElementById('admin-azioni-giocatore');
  if(adminAzioni) adminAzioni.style.display=adminLoggato&&g.squadra_id?'block':'none';
  const cifraInput=document.getElementById('admin-cifra-rimozione');
  if(cifraInput) cifraInput.value='';
}

function cambiaFotoInModifica(){
  const el=document.getElementById('edit-foto-inline');
  el.style.display=el.style.display==='none'?'block':'none';
}

function aggiornaPreviewFotoModifica(url){
  const prev=document.getElementById('edit-foto-preview');
  if(!prev) return;
  if(url) prev.innerHTML=`<img src="${url}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='❌'">`;
  else prev.innerHTML=giocatoreInModifica?iniziali(giocatoreInModifica.nome):'?';
}

function caricaFileInModifica(input){
  const file=input.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=e=>{
    document.getElementById('edit-foto-url').value=e.target.result;
    aggiornaPreviewFotoModifica(e.target.result);
    document.getElementById('edit-avatar').innerHTML=`<img src="${e.target.result}" style="width:52px;height:52px;object-fit:cover;border-radius:50%">`;
  };
  reader.readAsDataURL(file);
}

function tornaRicercaAdmin(){
  giocatoreInModifica=null;
  document.getElementById('modifica-step1').style.display='block';
  document.getElementById('modifica-step2').style.display='none';
  document.getElementById('search-giocatore-admin').value='';
  document.getElementById('lista-giocatori-admin').innerHTML='';
}

function aggiornaFormContratto(){
  const tipo=document.getElementById('edit-contratto').value;
  document.getElementById('campi-prestito').style.display=tipo.includes('Prestito')?'block':'none';
  document.getElementById('campo-riscatto').style.display=(tipo.includes('Diritto')||tipo.includes('Obbligo'))?'block':'none';
  document.getElementById('campo-clausola').style.display=tipo.includes('Clausola')?'block':'none';
}

async function salvaModificaGiocatore(){
  if(!giocatoreInModifica) return;
  const btn=document.getElementById('btn-salva');
  btn.disabled=true;btn.textContent='Salvataggio...';
  const tipo=document.getElementById('edit-contratto').value;
  const nuovoNome=document.getElementById('edit-nome').value.trim()||giocatoreInModifica.nome;
  const nuovaFoto=document.getElementById('edit-foto-url').value.trim()||null;
  const updates={
    nome:nuovoNome,
    foto_url:nuovaFoto,
    ruolo:document.getElementById('edit-ruolo').value,
    eta:parseInt(document.getElementById('edit-eta').value)||null,
    data_nascita:document.getElementById('edit-data-nascita').value||null,
    maglia:parseInt(document.getElementById('edit-maglia').value)||null,
    club_reale:document.getElementById('edit-club-reale').value||null,
    squadra_club:document.getElementById('edit-club-reale').value||null,
    contratto:tipo,
    squadra_propr:tipo.includes('Prestito')?document.getElementById('edit-squadra-propr').value||null:null,
    scadenza:tipo.includes('Prestito')?document.getElementById('edit-scadenza').value||null:null,
    riscatto:(tipo.includes('Diritto')||tipo.includes('Obbligo'))?parseFloat(document.getElementById('edit-riscatto').value)||null:null,
    scadenza_riscatto:(tipo.includes('Diritto')||tipo.includes('Obbligo'))?document.getElementById('edit-scadenza-riscatto').value||null:null,
    clausola:tipo.includes('Clausola')?parseFloat(document.getElementById('edit-clausola').value)||null:null,
    rivendita:parseFloat(document.getElementById('edit-rivendita').value)||null,
    quotazione:parseFloat(document.getElementById('edit-quotazione').value)||null,
    stipendio:parseFloat(document.getElementById('edit-stipendio').value)||null,
    badge:tipo.includes('Prestito')?'P':(giocatoreInModifica.badge==='C'||giocatoreInModifica.badge==='V'?giocatoreInModifica.badge:null),
  };
  try{
    const{error}=await sb.from('giocatori').update(updates).eq('id',giocatoreInModifica.id);
    if(error) throw error;
    const vecchiaMaglia=giocatoreInModifica.maglia;
    const vecchioContratto=giocatoreInModifica.contratto;
    const idx=giocatoriDB.findIndex(g=>g.id===giocatoreInModifica.id);
    if(idx>=0) giocatoriDB[idx]={...giocatoriDB[idx],...updates};
    showToast('✅ '+nuovoNome+' aggiornato!');
    document.getElementById('modal-modifica').classList.remove('open');
    if(squadraAttiva) renderRosa(tabAttivoSq);

    // Storico carriera: registra SOLO se maglia o contratto sono cambiati davvero
    if(updates.maglia!==vecchiaMaglia||updates.contratto!==vecchioContratto){
      logStoricoGiocatore(giocatoreInModifica.id,'modifica_admin',{
        numero_maglia: updates.maglia,
        tipo_contratto: updates.contratto,
        note: 'Modifica manuale da pannello admin',
      });
    }
  }catch(e){showToast('❌ Errore: '+e.message,'error');}
  finally{btn.disabled=false;btn.textContent='💾 SALVA MODIFICHE';}
}

// ===== ADMIN: SVINCOLA / ELIMINA GIOCATORE =====

function getCifraRimozione(){
  const raw=document.getElementById('admin-cifra-rimozione').value.trim();
  if(!raw) return null;
  const str=raw.toUpperCase().replace('M','');
  const num=parseFloat(str);
  if(isNaN(num)||num<=0) return null;
  return num<=1000 ? num*1000000 : num;
}

async function adminSvincolaGiocatore(){
  if(!adminLoggato||!giocatoreInModifica) return;
  const g=giocatoreInModifica;
  const sq=squadreDB.find(s=>s.id===g.squadra_id);
  if(!sq){showToast('❌ Giocatore senza squadra','error');return;}

  const cifra=getCifraRimozione();
  const cifraStr=cifra?fmtBudget(cifra):'0 FM';

  if(!confirm(`⚠️ SVINCOLA ${g.nome.toUpperCase()}\n\nLa squadra "${sq.nome}" riceverà ${cifraStr}.\nIl giocatore sarà spostato negli svincolati.\n\nConfermi?`)) return;

  const btn=document.getElementById('btn-svincola');
  btn.disabled=true; btn.textContent='Svincolo...';

  try{
    // 1. Aggiorna giocatore
    const{error:e1}=await sb.from('giocatori').update({
      squadra_id:null, lista:'svincolato', contratto:'Svincolato',
      badge:null, squadra_propr:null, scadenza:null,
      riscatto:null, scadenza_riscatto:null, clausola:null,
    }).eq('id',g.id);
    if(e1) throw e1;

    // 2. Accredita budget + log storico movimenti
    if(cifra && cifra>0){
      const saldoPrima=sq.budget||0;
      const nuovoBudget=saldoPrima+cifra;
      const{error:e2}=await sb.from('squadre').update({budget:nuovoBudget}).eq('id',sq.id);
      if(e2) throw e2;
      sq.budget=nuovoBudget;
      try{
        await sb.from('movimenti_budget').insert([{
          squadra_id:sq.id,
          importo:cifra,
          tipo:'entrata',
          descrizione:`Svincolo: ${g.nome}`,
          saldo_prima:saldoPrima,
          saldo_dopo:nuovoBudget
        }]);
      }catch(e){console.warn('Log movimenti svincolo:',e.message);}
    }

    // 3. Aggiorna DB locale
    const idx=giocatoriDB.findIndex(x=>x.id===g.id);
    if(idx>=0){
      giocatoriDB[idx].squadra_id=null;
      giocatoriDB[idx].lista='svincolato';
      giocatoriDB[idx].contratto='Svincolato';
      giocatoriDB[idx].badge=null;
    }

    showToast(`🔓 ${g.nome} svincolato${cifra?` • +${cifraStr} a ${sq.nome}`:''}!`);
    document.getElementById('modal-modifica').classList.remove('open');
    if(squadraAttiva) renderRosa(tabAttivoSq);
    if(typeof svincolatiCaricati!=='undefined'&&svincolatiCaricati) caricaSvincolati();

    logStoricoGiocatore(g.id,'svincolo',{
      squadra_da: sq.id, importo: cifra||null,
      note: 'Svincolato da admin',
    });

  }catch(e){showToast('❌ Errore: '+e.message,'error');}
  finally{btn.disabled=false; btn.textContent='🔓 SVINCOLA';}
}

async function adminEliminaGiocatore(){
  if(!adminLoggato||!giocatoreInModifica) return;
  const g=giocatoreInModifica;
  const sq=squadreDB.find(s=>s.id===g.squadra_id);
  if(!sq){showToast('❌ Giocatore senza squadra','error');return;}

  const cifra=getCifraRimozione();
  const cifraStr=cifra?fmtBudget(cifra):'0 FM';

  if(!confirm(`🗑️ ELIMINA ${g.nome.toUpperCase()}\n\nATTENZIONE: eliminazione definitiva dal database!\nLa squadra "${sq.nome}" riceverà ${cifraStr}.\n\nQuesta azione è IRREVERSIBILE. Confermi?`)) return;

  const btn=document.getElementById('btn-elimina-giocatore');
  btn.disabled=true; btn.textContent='Eliminazione...';

  try{
    // 1. Elimina dal DB
    const{error:e1}=await sb.from('giocatori').delete().eq('id',g.id);
    if(e1) throw e1;

    // 2. Accredita budget + log storico movimenti
    if(cifra && cifra>0){
      const saldoPrima=sq.budget||0;
      const nuovoBudget=saldoPrima+cifra;
      const{error:e2}=await sb.from('squadre').update({budget:nuovoBudget}).eq('id',sq.id);
      if(e2) throw e2;
      sq.budget=nuovoBudget;
      try{
        await sb.from('movimenti_budget').insert([{
          squadra_id:sq.id,
          importo:cifra,
          tipo:'entrata',
          descrizione:`Eliminazione: ${g.nome}`,
          saldo_prima:saldoPrima,
          saldo_dopo:nuovoBudget
        }]);
      }catch(e){console.warn('Log movimenti eliminazione:',e.message);}
    }

    // 3. Rimuovi da DB locale
    const idx=giocatoriDB.findIndex(x=>x.id===g.id);
    if(idx>=0) giocatoriDB.splice(idx,1);

    showToast(`🗑️ ${g.nome} eliminato${cifra?` • +${cifraStr} a ${sq.nome}`:''}!`);
    document.getElementById('modal-modifica').classList.remove('open');
    if(squadraAttiva) renderRosa(tabAttivoSq);

  }catch(e){showToast('❌ Errore: '+e.message,'error');}
  finally{btn.disabled=false; btn.textContent='🗑️ ELIMINA';}
}
