// ===== LOGO + MAGLIA + NOME SQUADRA =====
let magliaScelta=null;

function zoomImmagine(url){
  if(!url) return;
  const overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out';
  overlay.innerHTML=`<img src="${url}" style="max-width:92vw;max-height:92vh;object-fit:contain;border-radius:12px">`;
  overlay.onclick=()=>document.body.removeChild(overlay);
  document.body.appendChild(overlay);
}

function apriLogoSquadra(){
  squadraInLogo=null;logoScelto=null;magliaScelta=null;
  document.getElementById('logo-step1').style.display='block';
  document.getElementById('logo-step2').style.display='none';
  document.getElementById('lista-squadre-logo').innerHTML=squadreDB.map(sq=>`
    <div class="squadra-search-item" onclick="selezionaSquadraLogo('${sq.id}')">
      <div class="gsi-sq-logo" style="background:${sq.avatar_bg||'#333'}">${sq.logo_url?`<img src="${sq.logo_url}">`:sq.avatar||'⚽'}</div>
      <div class="gsi-info"><div class="gsi-nome">${sq.nome}</div><div class="gsi-sub">👤 ${sq.owner_name||'—'}</div></div>
    </div>`).join('');
  document.getElementById('modal-logo').classList.add('open');
}

function selezionaSquadraLogo(sqId){
  squadraInLogo=squadreDB.find(s=>s.id===sqId);
  document.getElementById('logo-step1').style.display='none';
  document.getElementById('logo-step2').style.display='block';
  document.getElementById('logo-sq-nome-display').textContent=squadraInLogo.nome;
  document.getElementById('logo-nome-squadra').value=squadraInLogo.nome_squadra||squadraInLogo.nome||'';
  const ps=document.getElementById('logo-preview-small');
  ps.style.background=squadraInLogo.avatar_bg||'#333';
  ps.innerHTML=squadraInLogo.logo_url?`<img src="${squadraInLogo.logo_url}">`:squadraInLogo.avatar||'⚽';
  document.getElementById('logo-preview-box').innerHTML=squadraInLogo.logo_url?`<img src="${squadraInLogo.logo_url}">`:'🏟️';
  document.getElementById('logo-url-input').value=squadraInLogo.logo_url||'';
  document.getElementById('maglia-preview-box').innerHTML=squadraInLogo.maglia_url?`<img src="${squadraInLogo.maglia_url}" style="width:70px;height:70px;object-fit:contain">`:'👕';
  document.getElementById('maglia-url-input').value=squadraInLogo.maglia_url||'';
  logoScelto=null;magliaScelta=null;
}

function tornaSceltaSquadraLogo(){
  squadraInLogo=null;
  document.getElementById('logo-step1').style.display='block';
  document.getElementById('logo-step2').style.display='none';
}

function previewLogo(event){
  const file=event.target.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=e=>{logoScelto=e.target.result;document.getElementById('logo-preview-box').innerHTML=`<img src="${logoScelto}">`;document.getElementById('logo-url-input').value='';};
  reader.readAsDataURL(file);
}

function previewLogoUrl(url){
  if(!url) return;logoScelto=null;
  document.getElementById('logo-preview-box').innerHTML=`<img src="${url}" onerror="this.parentElement.innerHTML='❌'">`;
}

function previewMaglia(event){
  const file=event.target.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=e=>{
    magliaScelta=e.target.result;
    document.getElementById('maglia-preview-box').innerHTML=`<img src="${magliaScelta}" style="width:70px;height:70px;object-fit:contain">`;
    document.getElementById('maglia-url-input').value='';
  };
  reader.readAsDataURL(file);
}

function previewMagliaUrl(url){
  if(!url) return;magliaScelta=null;
  document.getElementById('maglia-preview-box').innerHTML=`<img src="${url}" style="width:70px;height:70px;object-fit:contain" onerror="this.parentElement.innerHTML='❌'">`;
}

async function salvaLogo(){
  if(!squadraInLogo) return;
  // Prendi nuovi valori — se campo vuoto mantieni quello esistente
  let logoUrl=document.getElementById('logo-url-input').value.trim()||null;
  if(logoScelto && logoScelto.startsWith('data:')){
    showToast('⏳ Caricamento logo...', 'info');
    logoUrl = await uploadBase64ToCloudinary(logoScelto, 'loghi');
    if(!logoUrl) return;
  } else if(logoScelto){ logoUrl=logoScelto; }
  logoUrl = logoUrl || squadraInLogo.logo_url || null;
  let magliaUrl=document.getElementById('maglia-url-input').value.trim()||null;
  if(magliaScelta && magliaScelta.startsWith('data:')){
    showToast('⏳ Caricamento maglia...', 'info');
    magliaUrl = await uploadBase64ToCloudinary(magliaScelta, 'maglie');
    if(!magliaUrl) return;
  } else if(magliaScelta){ magliaUrl=magliaScelta; }
  magliaUrl = magliaUrl || squadraInLogo.maglia_url || null;
  const nomeInput=document.getElementById('logo-nome-squadra').value.trim();
  const nomeSquadra=nomeInput||squadraInLogo.nome_squadra||null;
  const btn=document.getElementById('btn-salva-logo');
  btn.disabled=true;btn.textContent='⏳ Salvataggio...';
  try{
    const updates={};
    if(logoUrl) updates.logo_url=logoUrl;
    if(magliaUrl) updates.maglia_url=magliaUrl;
    if(nomeSquadra) updates.nome_squadra=nomeSquadra;
    const{error}=await sb.from('squadre').update(updates).eq('id',squadraInLogo.id);
    if(error) throw error;
    // Aggiorna DB locale
    const idx=squadreDB.findIndex(s=>s.id===squadraInLogo.id);
    if(idx>=0) squadreDB[idx]={...squadreDB[idx],...updates};
    // Aggiorna utenteLoggato
    if(utenteLoggato&&utenteLoggato.id===squadraInLogo.id) utenteLoggato={...utenteLoggato,...updates};
    showToast('✅ Salvato!');
    document.getElementById('modal-logo').classList.remove('open');
    // Ricarica tutto con nuovi dati
    renderOverview();
    renderBannerMiaSquadra();
  }catch(e){
    showToast('❌ Errore: '+e.message,'error');
  }
  finally{btn.disabled=false;btn.textContent='💾 SALVA TUTTO';}
}

function selezionaSquadraLogo(sqId){
  squadraInLogo=squadreDB.find(s=>s.id===sqId);
  if(!squadraInLogo) return;
  document.getElementById('logo-step1').style.display='none';
  document.getElementById('logo-step2').style.display='block';
  document.getElementById('logo-sq-nome-display').textContent=squadraInLogo.nome;
  // Nome squadra
  document.getElementById('logo-nome-squadra').value=squadraInLogo.nome_squadra||squadraInLogo.nome||'';
  // Logo
  const ps=document.getElementById('logo-preview-small');
  ps.style.background=squadraInLogo.avatar_bg||'#333';
  ps.innerHTML=squadraInLogo.logo_url?`<img src="${squadraInLogo.logo_url}">`:squadraInLogo.avatar||'⚽';
  document.getElementById('logo-preview-box').innerHTML=squadraInLogo.logo_url?`<img src="${squadraInLogo.logo_url}">` :'🏟️';
  document.getElementById('logo-url-input').value=squadraInLogo.logo_url||'';
  // Maglia
  const mb=document.getElementById('maglia-preview-box');
  if(mb) mb.innerHTML=squadraInLogo.maglia_url?`<img src="${squadraInLogo.maglia_url}" style="width:70px;height:70px;object-fit:contain">`:'👕';
  const mi=document.getElementById('maglia-url-input');
  if(mi) mi.value=squadraInLogo.maglia_url||'';
  logoScelto=null;
  magliaScelta=null;
}

function tornaSceltaSquadraLogo(){
  squadraInLogo=null;
  document.getElementById('logo-step1').style.display='block';
  document.getElementById('logo-step2').style.display='none';
}

function previewLogo(event){
  const file=event.target.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=e=>{logoScelto=e.target.result;document.getElementById('logo-preview-box').innerHTML=`<img src="${logoScelto}">`;document.getElementById('logo-url-input').value='';};
  reader.readAsDataURL(file);
}

function previewLogoUrl(url){
  if(!url) return;logoScelto=null;
  document.getElementById('logo-preview-box').innerHTML=`<img src="${url}" onerror="this.parentElement.innerHTML='❌'">`;
}
