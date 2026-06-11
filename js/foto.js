// ===== FOTO GIOCATORE =====
function apriUploadFoto(){
  giocatoreInFoto=null;fotoScelta=null;
  document.getElementById('foto-step1').style.display='block';
  document.getElementById('foto-step2').style.display='none';
  document.getElementById('search-giocatore-foto').value='';
  document.getElementById('lista-giocatori-foto').innerHTML='';
  document.getElementById('modal-foto').classList.add('open');
}

function cercaGiocatoreFoto(val){
  if(val.length<2){document.getElementById('lista-giocatori-foto').innerHTML='';return;}
  const results=giocatoriDB.filter(g=>g.nome.toLowerCase().includes(val.toLowerCase())).slice(0,20);
  document.getElementById('lista-giocatori-foto').innerHTML=results.map(g=>{
    const sq=squadreDB.find(s=>s.id===g.squadra_id);
    return `<div class="giocatore-search-item" onclick="selezionaGiocatoreFoto(${g.id})">
      <div class="gsi-avatar">${g.foto_url?`<img src="${g.foto_url}">`:iniziali(g.nome)}</div>
      <div class="gsi-info"><div class="gsi-nome">${g.nome}</div><div class="gsi-sub">${sq?sq.nome:'—'} • ${g.ruolo}</div></div>
    </div>`;
  }).join('');
}

function selezionaGiocatoreFoto(gId){
  const g=giocatoriDB.find(x=>x.id===gId);
  const sq=squadreDB.find(s=>s.id===g.squadra_id);
  giocatoreInFoto=g;
  document.getElementById('foto-step1').style.display='none';
  document.getElementById('foto-step2').style.display='block';
  document.getElementById('foto-avatar').innerHTML=g.foto_url?`<img src="${g.foto_url}" style="width:44px;height:44px;object-fit:cover;border-radius:50%">`:iniziali(g.nome);
  document.getElementById('foto-nome-display').textContent=g.nome;
  document.getElementById('foto-squadra-display').textContent=sq?sq.nome:'—';
  document.getElementById('foto-preview-box').innerHTML=g.foto_url?`<img src="${g.foto_url}">` :'📷';
  document.getElementById('foto-url-input').value=g.foto_url||'';
  fotoScelta=null;
}

function tornaRicercaFoto(){
  giocatoreInFoto=null;
  document.getElementById('foto-step1').style.display='block';
  document.getElementById('foto-step2').style.display='none';
}

function previewFoto(event){
  const file=event.target.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=e=>{fotoScelta=e.target.result;document.getElementById('foto-preview-box').innerHTML=`<img src="${fotoScelta}">`;document.getElementById('foto-url-input').value='';};
  reader.readAsDataURL(file);
}

function previewFotoUrl(url){
  if(!url) return;fotoScelta=null;
  document.getElementById('foto-preview-box').innerHTML=`<img src="${url}" onerror="this.parentElement.innerHTML='❌'">`;
}

async function salvaFoto(){
  if(!giocatoreInFoto) return;
  let fotoUrl=document.getElementById('foto-url-input').value.trim()||null;
  // Se c'è una foto base64 scelta, caricala su Cloudinary
  if(fotoScelta && fotoScelta.startsWith('data:')){
    showToast('⏳ Caricamento foto...', 'info');
    fotoUrl = await uploadBase64ToCloudinary(fotoScelta, 'giocatori');
    if(!fotoUrl){return;}
  } else if(fotoScelta){
    fotoUrl = fotoScelta;
  }
  if(!fotoUrl){showToast('❌ Nessuna foto','error');return;}
  const btn=document.getElementById('btn-salva-foto');
  btn.disabled=true;btn.textContent='Salvataggio...';
  try{
    const{error}=await sb.from('giocatori').update({foto_url:fotoUrl}).eq('id',giocatoreInFoto.id);
    if(error) throw error;
    const idx=giocatoriDB.findIndex(g=>g.id===giocatoreInFoto.id);
    if(idx>=0) giocatoriDB[idx].foto_url=fotoUrl;
    showToast('📸 Foto salvata!');
    document.getElementById('modal-foto').classList.remove('open');
    if(squadraAttiva) renderRosa(tabAttivoSq);
  }catch(e){showToast('❌ Errore: '+e.message,'error');}
  finally{btn.disabled=false;btn.textContent='📸 SALVA FOTO';}
}
