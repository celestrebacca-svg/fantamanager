// ===== GESTIONE EMAIL =====
function apriGestioneEmail(){
  squadraInEmail=null;
  document.getElementById('email-step1').style.display='block';
  document.getElementById('email-step2').style.display='none';
  document.getElementById('lista-squadre-email').innerHTML=squadreDB.map(sq=>`
    <div class="squadra-search-item" onclick="selezionaSquadraEmail('${sq.id}')">
      <div class="gsi-sq-logo" style="background:${sq.avatar_bg||'#333'}">${sq.logo_url?`<img src="${sq.logo_url}">`:sq.avatar||'⚽'}</div>
      <div class="gsi-info"><div class="gsi-nome">${sq.nome}</div><div class="gsi-sub">${(sq.emails||[]).join(', ')||'Nessuna email'}</div></div>
    </div>`).join('');
  document.getElementById('modal-email').classList.add('open');
}

function selezionaSquadraEmail(sqId){
  squadraInEmail=squadreDB.find(s=>s.id===sqId);
  document.getElementById('email-step1').style.display='none';
  document.getElementById('email-step2').style.display='block';
  document.getElementById('email-sq-nome').textContent=squadraInEmail.nome;
  document.getElementById('email-password').value=squadraInEmail.password_accesso||'';
  renderEmailEditor();
}

function tornaSceltaSquadraEmail(){
  squadraInEmail=null;
  document.getElementById('email-step1').style.display='block';
  document.getElementById('email-step2').style.display='none';
}

function renderEmailEditor(){
  const emails=squadraInEmail.emails||[''];
  document.getElementById('email-editor').innerHTML=emails.map((e,i)=>`
    <div style="display:grid;grid-template-columns:1fr auto;gap:8px;margin-bottom:8px">
      <input class="form-input" type="email" id="email-val-${i}" value="${e}" placeholder="email@esempio.com">
      <button onclick="rimuoviEmail(${i})" style="background:rgba(255,68,68,0.2);border:none;color:var(--rosso);border-radius:6px;padding:8px 12px;cursor:pointer">✕</button>
    </div>`).join('')+`<button class="btn-secondary" onclick="aggiungiEmail()" style="width:100%;margin-top:4px;font-size:12px">+ Aggiungi Email</button>`;
}

function aggiungiEmail(){
  if(!squadraInEmail.emails) squadraInEmail.emails=[];
  squadraInEmail.emails.push('');
  renderEmailEditor();
}

function rimuoviEmail(i){
  squadraInEmail.emails.splice(i,1);
  renderEmailEditor();
}

async function salvaEmail(){
  if(!squadraInEmail) return;
  // Raccogli tutti gli input email visibili
  const inputs=document.querySelectorAll('[id^="email-val-"]');
  const emails=[];
  inputs.forEach(inp=>{
    const v=inp.value.trim().toLowerCase();
    if(v) emails.push(v);
  });
  const pwd=document.getElementById('email-password').value.trim();
  if(!pwd){showToast('❌ Inserisci la password','error');return;}
  const btn=document.getElementById('btn-salva-email');
  btn.disabled=true;btn.textContent='Salvataggio...';
  try{
    // Usa cast esplicito per JSONB
    const{error}=await sb.from('squadre')
      .update({
        emails: emails,           // array JS → Supabase lo serializza in JSONB
        password_accesso: pwd
      })
      .eq('id',squadraInEmail.id);
    if(error) throw error;
    const idx=squadreDB.findIndex(s=>s.id===squadraInEmail.id);
    if(idx>=0){
      squadreDB[idx].emails=emails;
      squadreDB[idx].password_accesso=pwd;
    }
    // Aggiorna anche l'utente loggato se è la sua squadra
    if(utenteLoggato&&utenteLoggato.id===squadraInEmail.id){
      utenteLoggato.emails=emails;
      utenteLoggato.password_accesso=pwd;
    }
    showToast(`📧 ${emails.length} email salvate per ${squadraInEmail.nome}!`);
    document.getElementById('modal-email').classList.remove('open');
  }catch(e){
    showToast('❌ Errore: '+e.message,'error');
    console.error('Email save error:',e);
  }
  finally{btn.disabled=false;btn.textContent='💾 SALVA ACCESSI';}
}
