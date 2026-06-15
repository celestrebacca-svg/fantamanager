// ===== PAGINA SQUADRA =====
function apriSquadra(id){
  squadraAttiva=squadreDB.find(s=>s.id===id);
  tabAttivoSq='principale';
  document.getElementById('lista-squadre').style.display='none';
  document.getElementById('pagina-squadra').style.display='block';
  const sq=squadraAttiva;
  const presidenti=sq.presidenti||[];
  const gTot=giocatoriDB.filter(g=>g.squadra_id===id);
  const logoHtml=sq.logo_url?`<img src="${sq.logo_url}" style="width:140px;height:140px;object-fit:contain">`:`<span style="font-family:'Bebas Neue',sans-serif;font-size:60px;color:var(--testo)">${sq.avatar||'⚽'}</span>`;
  const nomeDisplay=sq.nome_squadra||sq.nome;
  document.getElementById('sq-hero').innerHTML=`
    <div class="squadra-hero-banner" style="background:#000;min-height:180px;display:flex;align-items:center;justify-content:center">
      <div style="display:flex;align-items:center;justify-content:center;gap:24px;padding:24px">
        <div onclick="zoomImmagine('${sq.logo_url||''}')" style="width:150px;height:150px;background:#111;border-radius:20px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.15);overflow:hidden;flex-shrink:0;cursor:${sq.logo_url?'zoom-in':'default'}">${logoHtml}</div>
        ${sq.maglia_url?`<div onclick="zoomImmagine('${sq.maglia_url}')" style="width:120px;height:150px;background:#111;border-radius:20px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.15);overflow:hidden;flex-shrink:0;cursor:zoom-in"><img src="${sq.maglia_url}" style="width:110px;height:140px;object-fit:contain"></div>`:''}
      </div>
    </div>
    <div class="squadra-hero-body">
      <div class="squadra-hero-nome">${nomeDisplay}</div>
      <div class="squadra-hero-all">⚽ All.: <span>${sq.allenatore||'—'}</span> &nbsp;|&nbsp; Stipendio: <span>${sq.stip_all||'—'}</span></div>
      <div class="presidenti-title">👑 PRESIDENZA</div>
      <div class="presidenti-row">${presidenti.length?presidenti.map(p=>`
        <div class="presidente-card">
          <div class="presidente-foto">${p.foto?`<img src="${p.foto}">`:(p.nome||'P').charAt(0).toUpperCase()}</div>
          <div><div class="presidente-nome">${p.nome||'—'}</div><div class="presidente-ruolo">👑 Presidente</div></div>
        </div>`).join(''):'<div style="color:var(--testo-dim);font-size:13px">—</div>'}
      </div>
    </div>
    <div class="squadra-stats-bar">
      <div class="squadra-stat-item" onclick="${adminLoggato?`apriModificaBudget('${id}')`:''}">
        <div class="squadra-stat-label">Budget ${adminLoggato?'✏️':''}</div>
        <div class="squadra-stat-val" style="color:var(--verde);font-size:10px">${fmtBudget(sq.budget)}</div>
      </div>
      <div class="squadra-stat-item"><div class="squadra-stat-label">Tifosi</div><div class="squadra-stat-val" style="color:var(--blu)">${(sq.tifosi||0).toLocaleString('it-IT')}</div></div>
      <div class="squadra-stat-item"><div class="squadra-stat-label">Giocatori</div><div class="squadra-stat-val">${gTot.length}</div></div>
      <div class="squadra-stat-item"><div class="squadra-stat-label">Trofei</div><div class="squadra-stat-val" style="color:var(--oro)">${(sq.trofei||[]).length}</div></div>
    </div>`;
  const princ=giocatoriDB.filter(g=>g.squadra_id===id&&g.lista==='principale');
  const marg=giocatoriDB.filter(g=>g.squadra_id===id&&g.lista==='marginale');
  const prim=giocatoriDB.filter(g=>g.squadra_id===id&&g.lista==='primavera');
  document.getElementById('cnt-princ').textContent=princ.length;
  document.getElementById('cnt-marg').textContent=marg.length;
  document.getElementById('cnt-prim').textContent=prim.length;
  document.querySelectorAll('.rosa-tab').forEach(t=>t.classList.remove('active'));
  document.querySelector('.rosa-tab').classList.add('active');
  renderRosa('principale');

  // Formazione — visibile a tutti
  const formazioneDiv=document.getElementById('formazione-squadra-inline');
  const editBtnWrap=document.getElementById('formazione-edit-btn-wrap');
  if(formazioneDiv){
    formazioneDiv.style.display='block';
    const puoModificare=(utenteLoggato&&utenteLoggato.id===id)||adminLoggato;
    if(editBtnWrap) editBtnWrap.style.display=puoModificare?'block':'none';
    renderFormazione(id, false);
  }

  // Bilancio: tutti lo vedono, ma lo storico solo al proprietario/admin
  const bilancioDiv=document.getElementById('bilancio-squadra-inline');
  if(bilancioDiv){
    bilancioDiv.style.display='block';
    bilancioSquadraAttiva=id;
    const isProprietario=(utenteLoggato&&utenteLoggato.id===id)||adminLoggato;
    renderBilancioSquadra(id, isProprietario);
  }

  // Museo squadra inline
  const museoDiv=document.getElementById('museo-squadra-inline');
  if(museoDiv){
    museoDiv.style.display='block';
    museoDiv.innerHTML=`
      <div style="margin:16px 0">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--oro);letter-spacing:1px;margin-bottom:8px">🏛️ MUSEO DEI TROFEI</div>
        ${renderMuseoStadio(sq)}
      </div>`;
  }

  window.scrollTo(0,0);
}

function apriModificaBudget(sqId){
  if(!adminLoggato) return;
  const sq=squadreDB.find(s=>s.id===sqId);
  if(!sq) return;
  let m=document.getElementById('modal-modifica-budget');
  if(!m){
    m=document.createElement('div');
    m.id='modal-modifica-budget';
    m.className='modal-overlay';
    m.innerHTML=`<div class="modal-content" style="max-width:380px">
      <div class="modal-header">
        <h2 class="modal-title">💰 MODIFICA BUDGET</h2>
        <button class="modal-close" onclick="document.getElementById('modal-modifica-budget').classList.remove('open')">✕</button>
      </div>
      <div class="modal-body" id="modifica-budget-body"></div>
    </div>`;
    document.body.appendChild(m);
  }
  document.getElementById('modifica-budget-body').innerHTML=`
    <div class="form-group">
      <label class="form-label">Squadra</label>
      <div style="font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--oro)">${sq.nome_squadra||sq.nome}</div>
    </div>
    <div class="form-group">
      <label class="form-label">Budget attuale</label>
      <div style="font-family:'Space Mono',monospace;font-size:18px;color:var(--verde)">${fmtBudget(sq.budget)}</div>
    </div>
    <div class="form-group">
      <label class="form-label">Tipo modifica</label>
      <select class="form-select" id="mod-budget-tipo">
        <option value="aggiungi">➕ Aggiungi FM</option>
        <option value="rimuovi">➖ Rimuovi FM</option>
        <option value="imposta">🎯 Imposta valore esatto</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Importo (es. 5M, 500K)</label>
      <input class="form-input" type="text" id="mod-budget-valore" placeholder="Es. 10M">
    </div>
    <div class="form-group">
      <label class="form-label">Motivo</label>
      <input class="form-input" type="text" id="mod-budget-motivo" placeholder="Es. Premio campionato...">
    </div>
    <button onclick="salvaBudget('${sqId}')" class="btn-primary" style="width:100%;margin-top:8px">💾 SALVA</button>
  `;
  m.classList.add('open');
}

async function salvaBudget(sqId){
  const sq=squadreDB.find(s=>s.id===sqId);
  const tipo=document.getElementById('mod-budget-tipo').value;
  const valoreRaw=document.getElementById('mod-budget-valore').value;
  const valore=parseFM(valoreRaw);
  if(!valore){showToast('❌ Inserisci un importo valido','error');return;}
  
  const budgetAttuale=sq.budget||0;
  let nuovoBudget=budgetAttuale;
  if(tipo==='aggiungi') nuovoBudget=budgetAttuale+valore;
  else if(tipo==='rimuovi') nuovoBudget=budgetAttuale-valore;
  else if(tipo==='imposta') nuovoBudget=valore;

  try{
    const{error}=await sb.from('squadre').update({budget:nuovoBudget}).eq('id',sqId);
    if(error) throw error;
    const idx=squadreDB.findIndex(s=>s.id===sqId);
    if(idx>=0) squadreDB[idx].budget=nuovoBudget;
    if(utenteLoggato&&utenteLoggato.id===sqId) utenteLoggato.budget=nuovoBudget;
    document.getElementById('modal-modifica-budget').classList.remove('open');
    showToast(`✅ Budget aggiornato: ${fmtBudget(nuovoBudget)}`);
    apriSquadra(sqId);
  }catch(e){showToast('❌ Errore: '+e.message,'error');}
}

function tornaLista(){
  squadraAttiva=null;
  document.getElementById('lista-squadre').style.display='block';
  document.getElementById('pagina-squadra').style.display='none';
}
