// ===== CLOSE MODAL =====
function closeModal(id, event){
  if(!event || event.target.classList.contains('modal-overlay')){
    document.getElementById(id)?.classList.remove('open');
  }
}

// ===== NAVIGAZIONE =====
async function entraApp(sezione){
  document.getElementById('home').style.display='none';
  document.getElementById('app').classList.add('show');
  document.getElementById('user-nome').textContent=utenteLoggato?utenteLoggato.owner_name:'—';
  if(adminLoggato) document.getElementById('admin-btn-header').style.display='block';
  document.getElementById('quick-menu-btn').style.display='flex';
  // Prima mostra rose con loading
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  const roseEl=document.getElementById('section-rose');
  if(roseEl) roseEl.classList.add('active');
  document.getElementById('squadre-overview').innerHTML='<div class="loading"><div class="loading-spinner"></div>Caricamento squadre...</div>';
  // Poi carica dati
  const ok=await caricaDati();
  if(ok){
    renderOverview();
    showToast('✅ Connesso!');
  } else {
    document.getElementById('squadre-overview').innerHTML='<div class="empty">❌ Errore connessione. Riprova.</div>';
    return;
  }
  // Vai alla sezione richiesta
  if(sezione && sezione!=='rose'){
    const navBtn=document.querySelector(`.nav-btn[onclick*="'${sezione}'"]`);
    showSection(sezione, navBtn);
  } else {
    const roseBtn=document.querySelector(`.nav-btn[onclick*="'rose'"]`);
    if(roseBtn) roseBtn.classList.add('active');
  }
}

function tornaHome(){
  document.getElementById('app').classList.remove('show');
  document.getElementById('home').style.display='flex';
  document.getElementById('home').classList.remove('hide');
}

let _sezioneAttiva='rose';

function toggleMenuRapido(){
  const menu=document.getElementById('quick-menu');
  const overlay=document.getElementById('quick-menu-overlay');
  const open=menu.style.display==='block';
  menu.style.display=open?'none':'block';
  overlay.style.display=open?'none':'block';
}
function chiudiMenuRapido(){
  document.getElementById('quick-menu').style.display='none';
  document.getElementById('quick-menu-overlay').style.display='none';
}

function showSection(nome,btn){
  _sezioneAttiva=nome;
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  // Fix admin: nascondi contenuto quando esci
  if(nome!=='admin'){
    const ac=document.getElementById('admin-content');
    const ap=document.getElementById('admin-password-screen');
    if(ac) ac.style.display='none';
    if(ap) ap.style.display='none';
  }
  const el=document.getElementById('section-'+nome);
  if(!el) return;
  el.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  else{
    const nb=document.querySelector(`.nav-btn[onclick*="'${nome}'"]`);
    if(nb) nb.classList.add('active');
  }
  if(nome==='tifosi') renderTifosi();
  else if(nome==='competizioni') renderCompetizioni();
  else if(nome==='museo') renderMuseo();
  else if(nome==='mercato') renderTrattative();
  else if(nome==='classifica') renderClassifica();
  else if(nome==='stadio') renderStadio();
  else if(nome==='social') renderSocial();
  else if(nome==='risiko') renderRisiko();
  else if(nome==='rose'){
    const lista=document.getElementById('lista-squadre');
    const pagina=document.getElementById('pagina-squadra');
    if(lista) lista.style.display='block';
    if(pagina) pagina.style.display='none';
    renderOverview();
  }
}
