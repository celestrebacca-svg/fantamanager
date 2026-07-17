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

// ===== MODIFICA NOME SQUADRA / PARTECIPANTE =====
function apriModificaNomi(){
  if(!adminLoggato) return;
  document.getElementById('modal-modifica-nomi').classList.add('open');
  renderFormNomi();
}

function renderFormNomi(){
  const body=document.getElementById('modifica-nomi-body');
  if(!body) return;
  body.innerHTML=`
    <div class="form-group">
      <label class="form-label">Squadra</label>
      <select id="nomi-sq-sel" class="form-select" onchange="aggiornaNomiAttuali()">
        ${squadreDB.map(s=>`<option value="${s.id}">${s.nome_squadra||s.nome}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Nome Squadra (fantasquadra)</label>
      <input id="nomi-nome-squadra" class="form-input" type="text">
    </div>
    <div class="form-group">
      <label class="form-label">Nome Partecipante (proprietario)</label>
      <input id="nomi-owner-name" class="form-input" type="text">
    </div>
    <button onclick="salvaNuoviNomi()" style="background:var(--oro);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1px;padding:12px;border-radius:8px;border:none;cursor:pointer;width:100%">💾 SALVA NOMI</button>`;
  aggiornaNomiAttuali();
}

function aggiornaNomiAttuali(){
  const sqId=document.getElementById('nomi-sq-sel')?.value;
  const sq=squadreDB.find(s=>s.id===sqId);
  if(!sq) return;
  document.getElementById('nomi-nome-squadra').value=sq.nome_squadra||'';
  document.getElementById('nomi-owner-name').value=sq.owner_name||'';
}

async function salvaNuoviNomi(){
  const sqId=document.getElementById('nomi-sq-sel').value;
  const nuovoNomeSquadra=document.getElementById('nomi-nome-squadra').value.trim();
  const nuovoOwnerName=document.getElementById('nomi-owner-name').value.trim();
  if(!sqId||!nuovoNomeSquadra||!nuovoOwnerName){showToast('❌ Compila tutti i campi','error');return;}
  try{
    const{error}=await sb.from('squadre').update({nome_squadra:nuovoNomeSquadra,owner_name:nuovoOwnerName}).eq('id',sqId);
    if(error) throw error;
    const idx=squadreDB.findIndex(s=>s.id===sqId);
    if(idx>=0){squadreDB[idx].nome_squadra=nuovoNomeSquadra;squadreDB[idx].owner_name=nuovoOwnerName;}
    if(utenteLoggato&&utenteLoggato.id===sqId){utenteLoggato.nome_squadra=nuovoNomeSquadra;utenteLoggato.owner_name=nuovoOwnerName;}
    showToast(`✅ Nomi aggiornati per ${nuovoNomeSquadra}!`);
    renderFormNomi();
  }catch(e){showToast('❌ '+e.message,'error');}
}

// ===== GESTIONE COSTRUZIONI (ANNULLA) =====
function apriGestioneCostruzioni(){
  if(!adminLoggato) return;
  document.getElementById('modal-costruzioni').classList.add('open');
  renderFormCostruzioni();
}

function renderFormCostruzioni(){
  const body=document.getElementById('costruzioni-body');
  if(!body) return;
  body.innerHTML=`
    <div class="form-group">
      <label class="form-label">Squadra</label>
      <select id="costr-sq-sel" class="form-select" onchange="renderStatoCostruzioni()">
        ${squadreDB.map(s=>`<option value="${s.id}">${s.nome_squadra||s.nome}</option>`).join('')}
      </select>
    </div>
    <div id="costr-stato"></div>`;
  renderStatoCostruzioni();
}

function renderStatoCostruzioni(){
  const sqId=document.getElementById('costr-sq-sel')?.value;
  const sq=squadreDB.find(s=>s.id===sqId);
  const box=document.getElementById('costr-stato');
  if(!box||!sq) return;

  const capienza=sq.capienza_stadio||10000;
  const ampliamenti=sq.ampliamenti_stadio||0;
  const puoAnnullareStadio=ampliamenti>0;

  const livelloFF=sq.fastfood_livello||0;
  const ffAttuale=(typeof FF_LIVELLI!=='undefined'&&FF_LIVELLI[livelloFF])?FF_LIVELLI[livelloFF]:null;
  const puoAnnullareFF=livelloFF>0;

  const upgradeKit=!!(sq.maglie&&sq.maglie.upgrade_kit);

  box.innerHTML=`
    <div style="background:var(--grigio-scuro);border:1px solid var(--grigio-chiaro);border-radius:10px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;margin-bottom:6px">🏟️ Stadio — ${capienza.toLocaleString('it-IT')} posti (${ampliamenti} ampliamenti)</div>
      <button onclick="annullaAmpliamentoAdmin()" style="background:${puoAnnullareStadio?'rgba(255,68,68,0.15)':'var(--grigio-medio)'};color:${puoAnnullareStadio?'var(--rosso)':'var(--testo-dim)'};border:1px solid ${puoAnnullareStadio?'var(--rosso)':'var(--grigio-chiaro)'};font-size:12px;padding:8px 12px;border-radius:6px;cursor:${puoAnnullareStadio?'pointer':'not-allowed'};width:100%" ${puoAnnullareStadio?'':'disabled'}>
        ↩️ Annulla ultimo ampliamento (+3,5M FM, -2.000 posti)
      </button>
    </div>
    <div style="background:var(--grigio-scuro);border:1px solid var(--grigio-chiaro);border-radius:10px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;margin-bottom:6px">🍔 Fast Food — Livello ${livelloFF}${ffAttuale?' • '+ffAttuale.nome:''}</div>
      <button onclick="annullaFastFoodAdmin()" style="background:${puoAnnullareFF?'rgba(255,68,68,0.15)':'var(--grigio-medio)'};color:${puoAnnullareFF?'var(--rosso)':'var(--testo-dim)'};border:1px solid ${puoAnnullareFF?'var(--rosso)':'var(--grigio-chiaro)'};font-size:12px;padding:8px 12px;border-radius:6px;cursor:${puoAnnullareFF?'pointer':'not-allowed'};width:100%" ${puoAnnullareFF?'':'disabled'}>
        ↩️ Annulla ultimo livello (${ffAttuale?'+'+fmtM(ffAttuale.costo)+' FM':''}, livello-1)
      </button>
    </div>
    <div style="background:var(--grigio-scuro);border:1px solid var(--grigio-chiaro);border-radius:10px;padding:14px">
      <div style="font-weight:600;margin-bottom:6px">👕 Upgrade Kit Store — ${upgradeKit?'✅ Acquistato':'❌ Non acquistato'}</div>
      <button onclick="annullaUpgradeKitAdmin()" style="background:${upgradeKit?'rgba(255,68,68,0.15)':'var(--grigio-medio)'};color:${upgradeKit?'var(--rosso)':'var(--testo-dim)'};border:1px solid ${upgradeKit?'var(--rosso)':'var(--grigio-chiaro)'};font-size:12px;padding:8px 12px;border-radius:6px;cursor:${upgradeKit?'pointer':'not-allowed'};width:100%" ${upgradeKit?'':'disabled'}>
        ↩️ Annulla upgrade kit (+60M FM)
      </button>
    </div>`;
}

async function annullaAmpliamentoAdmin(){
  const sqId=document.getElementById('costr-sq-sel').value;
  const sq=squadreDB.find(s=>s.id===sqId);
  if(!sq||(sq.ampliamenti_stadio||0)<=0) return;
  if(!confirm(`Annullare l'ultimo ampliamento stadio di ${sq.nome_squadra||sq.nome}?\n+3,5M FM, -2.000 posti.`)) return;
  try{
    const nuovaCapienza=Math.max(10000,(sq.capienza_stadio||10000)-2000);
    const nuovoBudget=(sq.budget||0)+3500000;
    const nuoviAmpliamenti=Math.max(0,(sq.ampliamenti_stadio||0)-1);
    const{error}=await sb.from('squadre').update({capienza_stadio:nuovaCapienza,budget:nuovoBudget,ampliamenti_stadio:nuoviAmpliamenti}).eq('id',sqId);
    if(error) throw error;
    const idx=squadreDB.findIndex(s=>s.id===sqId);
    if(idx>=0){squadreDB[idx].capienza_stadio=nuovaCapienza;squadreDB[idx].budget=nuovoBudget;squadreDB[idx].ampliamenti_stadio=nuoviAmpliamenti;}
    if(utenteLoggato&&utenteLoggato.id===sqId){utenteLoggato.capienza_stadio=nuovaCapienza;utenteLoggato.budget=nuovoBudget;utenteLoggato.ampliamenti_stadio=nuoviAmpliamenti;}
    showToast(`✅ Ampliamento annullato: ${nuovaCapienza.toLocaleString('it-IT')} posti, +3,5M FM`);
    renderStatoCostruzioni();
  }catch(e){showToast('❌ '+e.message,'error');}
}

async function annullaFastFoodAdmin(){
  const sqId=document.getElementById('costr-sq-sel').value;
  const sq=squadreDB.find(s=>s.id===sqId);
  const livelloAttuale=sq?.fastfood_livello||0;
  if(!sq||livelloAttuale<=0) return;
  const ffAttuale=FF_LIVELLI[livelloAttuale];
  if(!confirm(`Annullare l'ultimo livello Fast Food di ${sq.nome_squadra||sq.nome}?\n+${fmtM(ffAttuale.costo)} FM, torna a livello ${livelloAttuale-1}.`)) return;
  try{
    const nuovoLivello=livelloAttuale-1;
    const nuovoBudget=(sq.budget||0)+ffAttuale.costo;
    const{error}=await sb.from('squadre').update({fastfood_livello:nuovoLivello,budget:nuovoBudget}).eq('id',sqId);
    if(error) throw error;
    const idx=squadreDB.findIndex(s=>s.id===sqId);
    if(idx>=0){squadreDB[idx].fastfood_livello=nuovoLivello;squadreDB[idx].budget=nuovoBudget;}
    if(utenteLoggato&&utenteLoggato.id===sqId){utenteLoggato.fastfood_livello=nuovoLivello;utenteLoggato.budget=nuovoBudget;}
    showToast(`✅ Fast Food riportato a livello ${nuovoLivello}, +${fmtM(ffAttuale.costo)} FM`);
    renderStatoCostruzioni();
  }catch(e){showToast('❌ '+e.message,'error');}
}

async function annullaUpgradeKitAdmin(){
  const sqId=document.getElementById('costr-sq-sel').value;
  const sq=squadreDB.find(s=>s.id===sqId);
  if(!sq||!(sq.maglie&&sq.maglie.upgrade_kit)) return;
  if(!confirm(`Annullare l'upgrade kit store di ${sq.nome_squadra||sq.nome}?\n+60M FM.`)) return;
  try{
    const maglie={...(sq.maglie||{}),upgrade_kit:false};
    const nuovoBudget=(sq.budget||0)+60000000;
    const{error}=await sb.from('squadre').update({maglie,budget:nuovoBudget}).eq('id',sqId);
    if(error) throw error;
    const idx=squadreDB.findIndex(s=>s.id===sqId);
    if(idx>=0){squadreDB[idx].maglie=maglie;squadreDB[idx].budget=nuovoBudget;}
    if(utenteLoggato&&utenteLoggato.id===sqId){utenteLoggato.maglie=maglie;utenteLoggato.budget=nuovoBudget;}
    showToast('✅ Upgrade kit annullato, +60M FM');
    renderStatoCostruzioni();
  }catch(e){showToast('❌ '+e.message,'error');}
}

// ===== GESTIONE DOMANDE INTERVISTA (custom) =====
function apriGestioneDomande(){
  if(!adminLoggato) return;
  document.getElementById('modal-domande').classList.add('open');
  renderFormDomande();
}

function renderFormDomande(){
  const body=document.getElementById('domande-admin-body');
  if(!body) return;
  body.innerHTML=`
    <div style="font-size:11px;color:var(--testo-dim);margin-bottom:12px">
      Queste domande si aggiungono a quelle già presenti e compaiono anche loro nel menu a tendina quando si pubblica un'intervista.
    </div>
    <div class="form-group">
      <label class="form-label">Nuova domanda</label>
      <textarea id="nuova-domanda-testo" class="form-input" rows="2" placeholder="Scrivi la domanda..." style="resize:vertical"></textarea>
    </div>
    <button onclick="aggiungiDomandaCustom()" style="background:var(--oro);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;padding:10px;border-radius:8px;border:none;cursor:pointer;width:100%;margin-bottom:16px">➕ AGGIUNGI DOMANDA</button>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:1px;color:var(--testo-dim);margin-bottom:8px">DOMANDE AGGIUNTE (${domandeCustomDB.length})</div>
    <div style="max-height:260px;overflow-y:auto">
      ${domandeCustomDB.length?domandeCustomDB.map(d=>`
        <div style="display:flex;gap:8px;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--grigio-chiaro)">
          <div style="flex:1;font-size:12px">${d.testo}</div>
          <button onclick="eliminaDomandaCustom(${d.id})" style="background:rgba(255,68,68,0.1);border:1px solid rgba(255,68,68,0.3);color:var(--rosso);font-size:10px;padding:4px 8px;border-radius:5px;cursor:pointer;flex-shrink:0">✕</button>
        </div>`).join(''):'<div style="color:var(--testo-dim);font-size:12px;font-style:italic;padding:8px 0">Nessuna domanda aggiunta ancora</div>'}
    </div>`;
}

async function aggiungiDomandaCustom(){
  const testo=document.getElementById('nuova-domanda-testo').value.trim();
  if(!testo){showToast('❌ Scrivi una domanda','error');return;}
  try{
    const{data,error}=await sb.from('domande_custom').insert({testo}).select().single();
    if(error) throw error;
    domandeCustomDB.push(data);
    showToast('✅ Domanda aggiunta!');
    renderFormDomande();
  }catch(e){showToast('❌ '+e.message,'error');}
}

async function eliminaDomandaCustom(id){
  if(!confirm('Eliminare questa domanda?')) return;
  try{
    const{error}=await sb.from('domande_custom').delete().eq('id',id);
    if(error) throw error;
    domandeCustomDB=domandeCustomDB.filter(d=>d.id!==id);
    showToast('✅ Domanda eliminata');
    renderFormDomande();
  }catch(e){showToast('❌ '+e.message,'error');}
}

// ===== GESTIONE IMMAGINI (trofei, stadio, store, fastfood) =====
let uploadingImgKey=null;

function apriGestioneImmagini(){
  if(!adminLoggato) return;
  document.getElementById('modal-immagini').classList.add('open');
  renderGestioneImmagini();
}

function renderGestioneImmagini(){
  const body=document.getElementById('immagini-admin-body');
  if(!body) return;
  const sezioni=[
    {titolo:'🏆 Trofei', prefisso:'trofeo_', chiavi:TIPI_TROFEO},
    {titolo:'🏟️ Stadio (livelli 1-8)', prefisso:'stadio_', chiavi:[1,2,3,4,5,6,7,8]},
    {titolo:'👕 Store Maglie (livelli 0-7)', prefisso:'store_', chiavi:[0,1,2,3,4,5,6,7]},
    {titolo:'🍔 Fast Food (livelli 0-8)', prefisso:'fastfood_', chiavi:[0,1,2,3,4,5,6,7,8]},
  ];
  body.innerHTML=`
    <div style="font-size:11px;color:var(--testo-dim);margin-bottom:14px">
      Tocca un riquadro per caricare/sostituire la foto. Va in automatico su Cloudinary, non serve fare nulla a mano.
    </div>
    ${sezioni.map(sez=>`
      <div style="margin-bottom:20px">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:14px;color:var(--oro);letter-spacing:1px;margin-bottom:8px">${sez.titolo}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:8px">
          ${sez.chiavi.map(k=>{
            const chiave=sez.prefisso+k;
            const url=immaginiConfigDB[chiave];
            const labelBreve=String(k).replace(/_/g,' ').slice(0,10);
            return `<div style="text-align:center">
              <div onclick="document.getElementById('imgfile-${chiave}').click()" style="width:100%;aspect-ratio:1;background:var(--grigio-scuro);border:2px dashed ${url?'rgba(0,255,135,0.4)':'var(--grigio-chiaro)'};border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;position:relative">
                ${url?`<img src="${url}" style="width:100%;height:100%;object-fit:cover">`:'<span style="font-size:18px;color:var(--testo-dim)">➕</span>'}
                ${uploadingImgKey===chiave?'<div style="position:absolute;inset:0;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center"><div class="loading-spinner" style="width:18px;height:18px"></div></div>':''}
              </div>
              <div style="font-size:9px;color:var(--testo-dim);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${labelBreve}</div>
              <input type="file" id="imgfile-${chiave}" accept="image/*" style="display:none" onchange="caricaImmagineConfig('${chiave}',this.files[0])">
            </div>`;
          }).join('')}
        </div>
      </div>`).join('')}`;
}

async function caricaImmagineConfig(chiave, file){
  if(!file) return;
  uploadingImgKey=chiave;
  renderGestioneImmagini();
  try{
    const url=await uploadToCloudinary(file,'config');
    if(!url) throw new Error('Upload su Cloudinary fallito');
    const{error}=await sb.from('immagini_config').upsert({chiave,url}).select();
    if(error) throw error;
    immaginiConfigDB[chiave]=url;
    if(chiave.startsWith('trofeo_')) IMMAGINI_TROFEI[chiave.replace('trofeo_','')]=url;
    else if(chiave.startsWith('stadio_')) IMMAGINI_STADI[parseInt(chiave.replace('stadio_',''))]=url;
    else if(chiave.startsWith('store_')) IMMAGINI_STORE[parseInt(chiave.replace('store_',''))]=url;
    else if(chiave.startsWith('fastfood_')) IMMAGINI_FASTFOOD[parseInt(chiave.replace('fastfood_',''))]=url;
    showToast('✅ Immagine caricata!');
  }catch(e){
    showToast('❌ '+e.message,'error');
  }finally{
    uploadingImgKey=null;
    renderGestioneImmagini();
  }
}
