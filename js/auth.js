// ===== LOGIN / LOGOUT =====
function entraAppDiretto(){
  utenteLoggato=null;
  adminLoggato=false;
  document.getElementById('login-screen').classList.add('hide');
  document.getElementById('home').style.display='flex';
}

async function doLogin(){
  const email=document.getElementById('login-email').value.trim().toLowerCase();
  const pwd=document.getElementById('login-password').value.trim();
  const err=document.getElementById('login-error');
  err.style.display='none';
  if(!email||!pwd){err.style.display='block';err.textContent='❌ Inserisci email e password';return;}
  const btn=document.querySelector('#login-screen .btn-primary');
  if(btn){btn.disabled=true;btn.textContent='⏳...';}
  try{
    // Seleziona solo le colonne necessarie per evitare timeout
    const{data:squadre,error:sqErr}=await sb.from('squadre')
      .select('id,nome,nome_squadra,owner_name,emails,password_accesso,budget,tifosi,avatar,avatar_bg,logo_url,maglia_url,allenatore,stip_all');
    if(sqErr) throw sqErr;
    if(!squadre||!squadre.length){
      err.style.display='block';err.textContent='❌ Errore connessione';
      if(btn){btn.disabled=false;btn.textContent='ENTRA NELLA LEGA →';}
      return;
    }
    const trovata=squadre.find(s=>{
      let emails=[];
      if(Array.isArray(s.emails)) emails=s.emails.map(e=>String(e).toLowerCase().trim());
      else if(s.emails) emails=[String(s.emails).toLowerCase().trim()];
      if(pwd===ADMIN_PWD) return emails.includes(email);
      return emails.includes(email)&&s.password_accesso===pwd;
    });
    if(!trovata){
      err.style.display='block';
      err.textContent='❌ Email o password non corretta';
      if(btn){btn.disabled=false;btn.textContent='ENTRA NELLA LEGA →';}
      return;
    }

    utenteLoggato=trovata;
    adminLoggato=(pwd===ADMIN_PWD);
    document.getElementById('login-screen').classList.add('hide');
    document.getElementById('home').style.display='flex';
    showToast('👋 Benvenuto '+trovata.owner_name+'!');

  }catch(e){
    err.style.display='block';
    err.textContent='❌ Errore: '+e.message;
  }
  if(btn){btn.disabled=false;btn.textContent='ENTRA NELLA LEGA →';}
}

function doLogout(){
  utenteLoggato=null;adminLoggato=false;
  document.getElementById('app').classList.remove('show');
  document.getElementById('home').style.display='none';
  document.getElementById('login-screen').classList.remove('hide');
  document.getElementById('login-email').value='';
  document.getElementById('login-password').value='';
}
