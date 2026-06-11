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

function selezionaGiocatoreAdmin(gId){
  const g=giocatoriDB.find(x=>x.id===gId);
  const sq=squadreDB.find(s=>s.id===g.squadra_id);
  giocatoreInModifica=g;
  document.getElementById('modifica-step1').style.display='none';
  document.getElementById('modifica-step2').style.display='block';
  document.getElementById('edit-foto-inline').style.display='none';
  // Avatar con foto attuale
  const av=document.getElementById('edit-avatar');
  av.innerHTML=g.foto_url?`<img src="${g.foto_url}" style="width:52px;height:52px;object-fit:cover;border-radius:50%">`:iniziali(g.nome);
  document.getElementById('edit-nome-display').textContent=g.nome;
  document.getElementById('edit-squadra-display').textContent=sq?sq.nome:'—';
  // Popola campi
  document.getElementById('edit-nome').value=g.nome||'';
  document.getElementById('edit-foto-url').value=g.foto_url||'';
  document.getElementById('edit-ruolo').value=g.ruolo||'A';
  document.getElementById('edit-eta').value=g.eta||'';
  document.getElementById('edit-data-nascita').value=g.data_nascita||'';
  document.getElementById('edit-maglia').value=g.maglia||'';
  document.getElementById('edit-club-reale').value=g.club_reale||'';
  document.getElementById('edit-contratto').value=g.contratto||'Titolo Definitivo';
  document.getElementById('edit-squadra-propr').value=g.squadra_propr||'';
  document.getElementById('edit-scadenza').value=g.scadenza||'';
  document.getElementById('edit-riscatto').value=g.riscatto||'';
  document.getElementById('edit-scadenza-riscatto').value=g.scadenza_riscatto||'';
  document.getElementById('edit-clausola').value=g.clausola||'';
  document.getElementById('edit-rivendita').value=g.rivendita||'';
  document.getElementById('edit-quotazione').value=g.quotazione||'';
  document.getElementById('edit-stipendio').value=g.stipendio||'';
  aggiornaFormContratto();
  // Preview foto
  aggiornaPreviewFotoModifica(g.foto_url||'');
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
    // Aggiorna anche avatar nell'header
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
    const idx=giocatoriDB.findIndex(g=>g.id===giocatoreInModifica.id);
    if(idx>=0) giocatoriDB[idx]={...giocatoriDB[idx],...updates};
    showToast('✅ '+nuovoNome+' aggiornato!');
    document.getElementById('modal-modifica').classList.remove('open');
    if(squadraAttiva) renderRosa(tabAttivoSq);
  }catch(e){showToast('❌ Errore: '+e.message,'error');}
  finally{btn.disabled=false;btn.textContent='💾 SALVA MODIFICHE';}
}
