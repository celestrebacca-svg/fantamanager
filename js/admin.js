// ===== ADMIN =====
function apriAdmin(){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  const adminEl=document.getElementById('section-admin');
  if(adminEl) adminEl.classList.add('active');
  _sezioneAttiva='admin';
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  if(adminLoggato){
    document.getElementById('admin-password-screen').style.display='none';
    document.getElementById('admin-content').style.display='block';
  }else{
    document.getElementById('admin-password-screen').style.display='block';
    document.getElementById('admin-content').style.display='none';
  }
}

function esciAdmin(){
  adminLoggato=false;
  const roseBtn=document.querySelector('.nav-btn[onclick*="\'rose\'"]');
  showSection('rose', roseBtn);
}

function verificaPassword(){
  const pwd=document.getElementById('pwd-input').value;
  if(pwd===ADMIN_PWD){
    adminLoggato=true;
    document.getElementById('admin-password-screen').style.display='none';
    document.getElementById('admin-content').style.display='block';
    document.getElementById('pwd-error').style.display='none';
    document.getElementById('pwd-input').value='';
    showToast('✅ Accesso admin!');
  }else{
    document.getElementById('pwd-error').style.display='block';
    document.getElementById('pwd-input').value='';
  }
}
