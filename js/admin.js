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

// ===== MODIFICA BUDGET =====
function apriModificaBudget(){
  if(!adminLoggato) return;
  document.getElementById('modal-modifica-budget').classList.add('open');
  renderFormBudget();
}

function renderFormBudget(){
  const body=document.getElementById('modifica-budget-body');
  if(!body) return;
  body.innerHTML=`
    <div class="form-group">
      <label class="form-label">Squadra</label>
      <select id="budget-sq-sel" class="form-select" onchange="aggiornaBudgetAttuale()">
        ${squadreDB.map(s=>`<option value="${s.id}">${s.nome} — ${fmtBudget(s.budget||0)}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Nuovo budget (es. 50 oppure 50.5 in M)</label>
      <input id="budget-nuovo-val" class="form-input" type="text" placeholder="Es. 50 oppure 50.5 (M)">
    </div>
    <div style="font-size:11px;color:var(--testo-dim);margin-bottom:14px" id="budget-attuale-label"></div>
    <button onclick="salvaNuovoBudget()" style="background:var(--oro);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1px;padding:12px;border-radius:8px;border:none;cursor:pointer;width:100%">💾 SALVA BUDGET</button>`;
  aggiornaBudgetAttuale();
}

function aggiornaBudgetAttuale(){
  const sqId=document.getElementById('budget-sq-sel')?.value;
  const sq=squadreDB.find(s=>s.id===sqId);
  const label=document.getElementById('budget-attuale-label');
  if(label&&sq) label.textContent=`Budget attuale: ${fmtBudget(sq.budget||0)}`;
}

async function salvaNuovoBudget(){
  const sqId=document.getElementById('budget-sq-sel').value;
  const valRaw=document.getElementById('budget-nuovo-val').value.trim();
  if(!sqId||!valRaw){showToast('❌ Compila tutti i campi','error');return;}
  const nuovoBudget=parseM(valRaw);
  if(isNaN(nuovoBudget)){showToast('❌ Valore non valido','error');return;}
  try{
    const{error}=await sb.from('squadre').update({budget:nuovoBudget}).eq('id',sqId);
    if(error) throw error;
    const idx=squadreDB.findIndex(s=>s.id===sqId);
    if(idx>=0) squadreDB[idx].budget=nuovoBudget;
    showToast(`✅ Budget aggiornato a ${fmtBudget(nuovoBudget)}!`);
    document.getElementById('budget-nuovo-val').value='';
    renderFormBudget();
  }catch(e){showToast('❌ '+e.message,'error');}
}
