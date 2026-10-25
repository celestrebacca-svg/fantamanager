// ===== LOGIN / LOGOUT =====
function entraAppDiretto(){
  utenteLoggato=null;
  adminLoggato=false;
  document.getElementById('login-screen').classList.add('hide');
  document.getElementById('home').style.display='flex';
}

// Pass di sessione rilasciato dal server (api/login.js): serve alle funzioni del server per sapere chi sei. Resta solo in memoria.
let SESSIONE_TOKEN=null;

// Primo accesso: la squadra sceglie da sola username e password (le conosce solo lei; nel database resta solo un hash)
function chiediCredenziali(tokenCambio){
  return new Promise(resolve=>{
    const ov=document.createElement('div');
    ov.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;background:rgba(0,0,0,0.88);display:flex;align-items:center;justify-content:center;padding:16px';
    ov.innerHTML='<div style="background:var(--grigio-scuro,#1c1c1c);border:1px solid var(--oro,#ffd700);border-radius:12px;padding:18px;max-width:340px;width:100%">'
      +'<div style="font-family:\'Bebas Neue\',sans-serif;font-size:22px;color:var(--oro,#ffd700);margin-bottom:6px">PRIMO ACCESSO</div>'
      +'<div style="font-size:12px;color:var(--testo-dim,#aaa);margin-bottom:12px;line-height:1.4">Scegli il tuo username e la tua password. Li conosci solo tu: nessuno, nemmeno l\'admin, può vederli. Da ora entrerai con questi (o con la tua email e la password).</div>'
      +'<input id="pa-user" class="form-input" placeholder="Username (3-20 caratteri)" autocapitalize="off" autocomplete="username" style="width:100%;margin-bottom:8px">'
      +'<input id="pa-pass" class="form-input" type="password" placeholder="Password (almeno 6 caratteri)" autocomplete="new-password" style="width:100%;margin-bottom:8px">'
      +'<input id="pa-pass2" class="form-input" type="password" placeholder="Ripeti la password" autocomplete="new-password" style="width:100%;margin-bottom:8px">'
      +'<div id="pa-err" style="color:#ff6b6b;font-size:12px;min-height:16px;margin-bottom:8px"></div>'
      +'<button id="pa-ok" class="btn-primary" style="width:100%;margin-bottom:6px">Conferma ed entra</button>'
      +'<button id="pa-no" style="width:100%;cursor:pointer">Annulla</button></div>';
    document.body.appendChild(ov);
    const el=id=>ov.querySelector('#'+id), errore=t=>{el('pa-err').textContent=t;};
    const chiudi=v=>{ov.remove();resolve(v);};
    el('pa-no').onclick=()=>chiudi(null);
    el('pa-ok').onclick=async()=>{
      const username=el('pa-user').value.trim(), p1=el('pa-pass').value, p2=el('pa-pass2').value;
      if(!username){errore('Scegli uno username');return;}
      if(p1.length<6){errore('La password deve avere almeno 6 caratteri');return;}
      if(p1!==p2){errore('Le due password non coincidono');return;}
      const btn=el('pa-ok'); btn.disabled=true; btn.textContent='⏳...'; errore('');
      try{
        const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({azione:'imposta',token:tokenCambio,username,password:p1})});
        const j=await r.json().catch(()=>({}));
        if(!r.ok||!j.ok){errore(j.error||'Impossibile salvare, riprova');btn.disabled=false;btn.textContent='Conferma ed entra';return;}
        chiudi(j);
      }catch(e){errore('Errore di connessione, riprova');btn.disabled=false;btn.textContent='Conferma ed entra';}
    };
  });
}

async function doLogin(){
  const email=document.getElementById('login-email').value.trim().toLowerCase();
  const pwd=document.getElementById('login-password').value.trim();
  const err=document.getElementById('login-error');
  err.style.display='none';
  if(!email||!pwd){err.style.display='block';err.textContent='❌ Inserisci email (o username) e password';return;}
  const btn=document.querySelector('#login-screen .btn-primary');
  const ripristina=()=>{if(btn){btn.disabled=false;btn.textContent='ENTRA NELLA LEGA →';}};
  if(btn){btn.disabled=true;btn.textContent='⏳...';}
  try{
    // La password viene controllata dal server: il browser non scarica più né password né email di tutte le squadre
    const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({azione:'login',email,password:pwd})});
    let j=await r.json().catch(()=>({}));
    if(!r.ok||!j.ok){
      err.style.display='block';
      err.textContent='❌ '+(j.error||'Email/username o password non corretti');
      ripristina();
      return;
    }
    if(j.primo){                         // primo accesso: sceglie username e password
      j=await chiediCredenziali(j.token_cambio);
      if(!j){ripristina();return;}
    }
    const{data:trovata,error:sqErr}=await sb.from('squadre')
      .select('id,nome,nome_squadra,owner_name,emails,budget,tifosi,avatar,avatar_bg,logo_url,maglia_url,allenatore,stip_all')
      .eq('id',j.squadra_id).maybeSingle();
    if(sqErr) throw sqErr;
    if(!trovata){
      err.style.display='block';err.textContent='❌ Squadra non trovata';
      ripristina();
      return;
    }

    SESSIONE_TOKEN=j.token;
    utenteLoggato=trovata;
    adminLoggato=!!j.admin;
    document.getElementById('login-screen').classList.add('hide');
    document.getElementById('home').style.display='flex';
    showToast('👋 Benvenuto '+trovata.owner_name+'!');

  }catch(e){
    err.style.display='block';
    err.textContent='❌ Errore: '+e.message;
  }
  ripristina();
}

function doLogout(){
  utenteLoggato=null;adminLoggato=false;SESSIONE_TOKEN=null;
  document.getElementById('app').classList.remove('show');
  document.getElementById('home').style.display='none';
  document.getElementById('login-screen').classList.remove('hide');
  document.getElementById('login-email').value='';
  document.getElementById('login-password').value='';
}
