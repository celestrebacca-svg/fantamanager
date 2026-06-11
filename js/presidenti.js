// ===== PRESIDENTI =====
function apriFotoPresidente(){
  squadraInPres=null;
  document.getElementById('pres-step1').style.display='block';
  document.getElementById('pres-step2').style.display='none';
  document.getElementById('lista-squadre-pres').innerHTML=squadreDB.map(sq=>`
    <div class="squadra-search-item" onclick="selezionaSquadraPres('${sq.id}')">
      <div class="gsi-sq-logo" style="background:${sq.avatar_bg||'#333'}">${sq.logo_url?`<img src="${sq.logo_url}">`:sq.avatar||'⚽'}</div>
      <div class="gsi-info"><div class="gsi-nome">${sq.nome}</div><div class="gsi-sub">👤 ${sq.owner_name||'—'}</div></div>
    </div>`).join('');
  document.getElementById('modal-presidente').classList.add('open');
}

function selezionaSquadraPres(sqId){
  squadraInPres=squadreDB.find(s=>s.id===sqId);
  document.getElementById('pres-step1').style.display='none';
  document.getElementById('pres-step2').style.display='block';
  document.getElementById('pres-sq-nome-display').textContent=squadraInPres.nome;
  renderPresidentiEditor();
}

function tornaSceltaSquadraPres(){
  squadraInPres=null;
  document.getElementById('pres-step1').style.display='block';
  document.getElementById('pres-step2').style.display='none';
}

function renderPresidentiEditor(){
  const presidenti=(squadraInPres.presidenti&&squadraInPres.presidenti.length)?squadraInPres.presidenti:[{nome:'',foto:''}];
  document.getElementById('presidenti-editor').innerHTML=presidenti.map((p,i)=>`
    <div style="background:var(--grigio-scuro);border-radius:10px;padding:14px;margin-bottom:12px;border:1px solid var(--grigio-chiaro)">
      <div style="font-size:11px;font-weight:700;color:var(--testo-dim);margin-bottom:10px">👑 PRESIDENTE ${i+1}</div>
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:10px">
        <div class="presidente-foto" id="pres-foto-preview-${i}" style="width:50px;height:50px;font-size:18px">${p.foto?`<img src="${p.foto}">`:((p.nome||'P').charAt(0).toUpperCase())}</div>
        <div style="flex:1"><div class="form-group" style="margin-bottom:0"><label class="form-label">Nome</label><input class="form-input" type="text" id="pres-nome-${i}" value="${p.nome||''}" oninput="aggiornaNomePres(${i})"></div></div>
      </div>
      <div class="form-group" style="margin-bottom:8px"><label class="form-label">URL Foto</label><input class="form-input" type="url" id="pres-foto-${i}" value="${p.foto||''}" placeholder="https://..." oninput="aggiornaFotoPres(${i})"></div>
      <div style="position:relative;margin-top:6px">
        <input type="file" accept="image/*" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;z-index:1" onchange="caricaFotoPresidente(event,${i})">
        <button class="btn-secondary" style="width:100%;pointer-events:none;font-size:12px;padding:8px">📁 Scegli dalla Galleria</button>
      </div>
    </div>`).join('')+`<button class="btn-secondary" onclick="aggiungiPresidente()" style="width:100%;margin-bottom:8px">+ Aggiungi Presidente</button>`;
}

function aggiornaNomePres(i){
  const lettera=document.getElementById(`pres-nome-${i}`).value.charAt(0).toUpperCase()||'P';
  const foto=document.getElementById(`pres-foto-${i}`).value;
  document.getElementById(`pres-foto-preview-${i}`).innerHTML=foto?`<img src="${foto}">`:(lettera||'P');
}

function aggiornaFotoPres(i){
  const url=document.getElementById(`pres-foto-${i}`).value;
  const nome=document.getElementById(`pres-nome-${i}`).value;
  document.getElementById(`pres-foto-preview-${i}`).innerHTML=url?`<img src="${url}" onerror="this.parentElement.innerHTML='${(nome||'P').charAt(0).toUpperCase()}'">`:(nome||'P').charAt(0).toUpperCase();
}

function caricaFotoPresidente(event,i){
  const file=event.target.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=e=>{
    document.getElementById(`pres-foto-${i}`).value=e.target.result;
    document.getElementById(`pres-foto-preview-${i}`).innerHTML=`<img src="${e.target.result}">`;
  };
  reader.readAsDataURL(file);
}

function aggiungiPresidente(){
  if(!squadraInPres) return;
  if(!squadraInPres.presidenti) squadraInPres.presidenti=[];
  squadraInPres.presidenti.push({nome:'',foto:''});
  renderPresidentiEditor();
}

async function salvaPresidenti(){
  if(!squadraInPres) return;
  const n=document.querySelectorAll('[id^="pres-nome-"]').length;
  const presidenti=[];
  for(let i=0;i<n;i++){
    const nome=document.getElementById(`pres-nome-${i}`)?.value||'';
    const foto=document.getElementById(`pres-foto-${i}`)?.value||'';
    if(nome||foto) presidenti.push({nome,foto});
  }
  const btn=document.getElementById('btn-salva-pres');
  btn.disabled=true;btn.textContent='Salvataggio...';
  try{
    const{error}=await sb.from('squadre').update({presidenti}).eq('id',squadraInPres.id);
    if(error) throw error;
    const idx=squadreDB.findIndex(s=>s.id===squadraInPres.id);
    if(idx>=0) squadreDB[idx].presidenti=presidenti;
    showToast('👑 Presidenti salvati!');
    document.getElementById('modal-presidente').classList.remove('open');
    if(squadraAttiva&&squadraAttiva.id===squadraInPres.id) apriSquadra(squadraInPres.id);
  }catch(e){showToast('❌ Errore: '+e.message,'error');}
  finally{btn.disabled=false;btn.textContent='👑 SALVA PRESIDENTI';}
}
