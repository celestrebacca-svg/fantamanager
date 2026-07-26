// ===== NUOVO POST =====
function apriNuovoPost(){
  if(!utenteLoggato){showToast('❌ Devi essere loggato','error');return;}
  renderFormNuovoPost('foto');
  document.getElementById('modal-social-post').classList.add('open');
}

function renderFormNuovoPost(tipo){
  const miei=giocatoriDB.filter(g=>g.squadra_id===utenteLoggato.id&&g.lista==='principale');
  // Trattative approvate il cui giocatore risulta ORA di proprietà dell'utente loggato.
  // Usiamo la proprietà attuale del giocatore (aggiornata da eseguiTrasferimento)
  // come fonte di verità, invece dei campi squadra_acquirente_id/offerente_id della
  // trattativa che su record più vecchi possono essere inconsistenti o mancanti.
  // Non escludiamo quelle già postate: il post viene creato in automatico al momento
  // del trasferimento, e qui l'utente può ancora personalizzarne la didascalia.
  const acquisti=trattativeDB.filter(t=>{
    if(t.stato!=='approvata') return false;
    if(!t.giocatore_id) return false;
    const g=giocatoriDB.find(x=>String(x.id)===String(t.giocatore_id));
    if(!g) return false;
    return String(g.squadra_id)===String(utenteLoggato.id);
  });
  document.getElementById('social-post-body').innerHTML=`
    <!-- TIPO POST -->
    <div style="display:flex;gap:6px;margin-bottom:16px">
      ${[['foto','📸 FOTO'],['intervista','🎤 INTERVISTA'],['acquisto','🔴 ACQUISTO']].map(([t,l])=>`
        <button onclick="renderFormNuovoPost('${t}')" style="flex:1;font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:1px;padding:7px;border-radius:7px;cursor:pointer;border:1px solid ${t===tipo?'var(--verde)':'var(--grigio-chiaro)'};background:${t===tipo?'rgba(0,255,135,0.15)':'var(--grigio)'};color:${t===tipo?'var(--verde)':'var(--testo)'}">${l}</button>`).join('')}
    </div>

    ${tipo==='foto'?`
      <div class="form-group"><label class="form-label">Didascalia (obbligatoria)</label><textarea id="post-contenuto" class="form-input" rows="3" placeholder="Scrivi qualcosa..." style="resize:vertical"></textarea></div>
      <div style="font-size:11px;color:var(--testo-dim);margin-bottom:10px">Max 3 foto • +${FOLLOWER_FOTO} follower per ogni foto</div>
      ${[0,1,2].map(i=>`
        <div style="margin-bottom:10px">
          <div style="font-size:10px;color:var(--testo-dim);margin-bottom:4px">FOTO ${i+1}${i===0?' (obbligatoria)':' (opzionale)'}</div>
          <div style="display:flex;gap:8px;align-items:center">
            <label style="background:rgba(0,255,135,0.1);border:1px solid rgba(0,255,135,0.3);color:var(--verde);font-size:11px;padding:6px 12px;border-radius:6px;cursor:pointer">
              📎 Scegli
              <input type="file" accept="image/*" style="display:none" onchange="aggiungiImgPost(${i},this)">
            </label>
            <input class="form-input" type="url" id="post-foto-url-${i}" placeholder="Oppure URL..." style="flex:1;font-size:11px" oninput="aggiornaUrlPost(${i},this.value)">
            <div id="post-foto-preview-${i}" style="width:36px;height:36px;border-radius:6px;overflow:hidden;background:var(--grigio-chiaro);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:14px">📷</div>
          </div>
        </div>`).join('')}
      <button onclick="pubblicaPost('foto')" class="btn-primary" style="margin-top:8px">📤 PUBBLICA</button>
    `:''}

    ${tipo==='intervista'?`
      <div class="form-group">
        <label class="form-label">Seleziona calciatore</label>
        <select class="form-select" id="post-giocatore">
          <option value="">— Seleziona —</option>
          ${miei.map(g=>`<option value="${g.id}">${g.nome} (${g.ruolo})</option>`).join('')}
        </select>
      </div>
      <div style="font-size:11px;color:var(--testo-dim);margin-bottom:12px">Min 3 domande (+${FOLLOWER_INTERVISTA_3} follower) • Max 5 domande (+${FOLLOWER_INTERVISTA_5} follower)</div>
      <div id="domande-container">
        ${[0,1,2].map(i=>renderDomandaRow(i)).join('')}
      </div>
      <button onclick="aggiungiDomanda()" id="btn-aggiungi-domanda" style="background:rgba(255,215,0,0.1);border:1px solid rgba(255,215,0,0.3);color:var(--oro);font-size:12px;padding:6px 14px;border-radius:6px;cursor:pointer;margin-bottom:12px">+ Aggiungi domanda (max 5)</button>
      <button onclick="pubblicaPost('intervista')" class="btn-primary">📤 PUBBLICA INTERVISTA</button>
    `:''}

    ${tipo==='acquisto'?`
      <div style="font-size:11px;color:var(--testo-dim);margin-bottom:12px">I tuoi acquisti/prestiti vengono pubblicati in automatico. Qui puoi personalizzare la didascalia.</div>
      ${acquisti.length===0?'<div class="empty">Nessun acquisto/prestito da ufficializzare</div>':`
        <div class="form-group">
          <label class="form-label">Seleziona acquisto</label>
          <select class="form-select" id="post-acquisto-tid" onchange="aggiornaPrevAcquisto(this.value)">
            <option value="">— Seleziona —</option>
            ${acquisti.map(t=>{
              const g=giocatoriDB.find(x=>String(x.id)===String(t.giocatore_id));
              const giaPostato=socialPostsDB.some(p=>p.tipo==='acquisto'&&String(p.trattativa_id)===String(t.id));
              return g?`<option value="${t.id}">${giaPostato?'✓ ':''}${g.nome} (${g.ruolo}) ${g.quotazione?'• '+g.quotazione+'M€':''}</option>`:'';
            }).join('')}
          </select>
        </div>
        <div id="acquisto-preview" style="margin-bottom:12px"></div>
        <div class="form-group"><label class="form-label">Messaggio ufficiale</label><textarea id="post-contenuto-acq" class="form-input" rows="2" placeholder="Es: Benvenuto nella famiglia! 🔴⚫"></textarea></div>
        <button onclick="pubblicaPost('acquisto')" class="btn-primary">🔴 SALVA DIDASCALIA</button>
      `}
    `:''}
  `;
}

let postFotoUrls=['','',''];

async function aggiungiImgPost(idx, input){
  const file=input.files[0];
  if(!file) return;
  const preview=document.getElementById(`post-foto-preview-${idx}`);
  preview.innerHTML='<div class="loading-spinner" style="width:16px;height:16px"></div>';
  const url=await uploadToCloudinary(file,'social');
  if(!url){
    preview.innerHTML='📷';
    return;
  }
  postFotoUrls[idx]=url;
  preview.innerHTML=`<img src="${url}" style="width:100%;height:100%;object-fit:cover">`;
  document.getElementById(`post-foto-url-${idx}`).value='';
}

function aggiornaUrlPost(idx, url){
  postFotoUrls[idx]=url;
  document.getElementById(`post-foto-preview-${idx}`).innerHTML=url?`<img src="${url}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'">`:'📷';
}

let ndomandeCorrente=3;

function renderDomandaRow(i){
  const tutte=tutteLeDomandeIntervista();
  const domandeSuggerite=tutte[i%tutte.length];
  return `<div id="domanda-row-${i}" style="background:var(--grigio-scuro);border-radius:8px;padding:10px;margin-bottom:8px">
    <div style="font-size:10px;color:var(--oro);font-weight:700;margin-bottom:6px">DOMANDA ${i+1}</div>
    <select id="domanda-testo-${i}" class="form-select" style="margin-bottom:6px;font-size:11px">
      <option value="">— Scegli domanda —</option>
      ${tutte.map(d=>`<option value="${d}">${d}</option>`).join('')}
    </select>
    <textarea id="risposta-${i}" class="form-input" rows="2" placeholder="Risposta del calciatore..." style="font-size:12px;resize:vertical"></textarea>
    ${i>=3?`<button onclick="rimuoviDomanda(${i})" style="background:rgba(255,68,68,0.1);border:1px solid rgba(255,68,68,0.3);color:var(--rosso);font-size:10px;padding:3px 8px;border-radius:4px;cursor:pointer;margin-top:4px">✕ Rimuovi</button>`:''}
  </div>`;
}

function aggiungiDomanda(){
  if(ndomandeCorrente>=5){showToast('Max 5 domande','error');return;}
  const cont=document.getElementById('domande-container');
  const div=document.createElement('div');
  div.innerHTML=renderDomandaRow(ndomandeCorrente);
  cont.appendChild(div.firstElementChild);
  ndomandeCorrente++;
  if(ndomandeCorrente>=5) document.getElementById('btn-aggiungi-domanda').style.display='none';
}

function rimuoviDomanda(i){
  const el=document.getElementById(`domanda-row-${i}`);
  if(el) el.remove();
  ndomandeCorrente--;
  document.getElementById('btn-aggiungi-domanda').style.display='block';
}

function aggiornaPrevAcquisto(tIdStr){
  const tId=parseInt(tIdStr)||null;
  const t=tId?trattativeDB.find(x=>x.id===tId):null;
  const g=t?giocatoriDB.find(x=>String(x.id)===String(t.giocatore_id)):null;
  const el=document.getElementById('acquisto-preview');
  const textarea=document.getElementById('post-contenuto-acq');
  if(textarea) textarea.value='';
  if(!el) return;
  if(!g){el.innerHTML='';return;}
  // Se esiste già un post (creato in automatico dal trasferimento), precompila la didascalia attuale
  const postEsistente=socialPostsDB.find(p=>p.tipo==='acquisto'&&String(p.trattativa_id)===String(tId));
  if(postEsistente&&textarea) textarea.value=postEsistente.contenuto||'';
  const f=followerAcquisto(g.quotazione);
  el.innerHTML=`<div style="background:rgba(255,68,68,0.08);border:1px solid rgba(255,68,68,0.2);border-radius:8px;padding:10px;display:flex;align-items:center;gap:10px">
    <div style="width:36px;height:36px;border-radius:50%;overflow:hidden;background:var(--grigio-chiaro);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700">
      ${g.foto_url?`<img src="${g.foto_url}" style="width:100%;height:100%;object-fit:cover">`:iniziali(g.nome)}
    </div>
    <div style="flex:1"><div style="font-weight:600">${g.nome}</div><div style="font-size:11px;color:var(--testo-dim)">${g.ruolo} ${g.quotazione?'• '+g.quotazione+'M€':''}</div></div>
    <div style="text-align:center"><div style="font-family:'Space Mono',monospace;font-size:14px;color:${postEsistente?'var(--testo-dim)':'var(--verde)'};font-weight:700">${postEsistente?'✓ pubblicato':'+'+fmtNum(f)}</div><div style="font-size:9px;color:var(--testo-dim)">${postEsistente?'':'follower'}</div></div>
  </div>`;
}

async function pubblicaPost(tipo){
  if(!utenteLoggato){showToast('❌ Non loggato','error');return;}
  let payload={squadra_id:utenteLoggato.id, tipo, follower_guadagnati:0};

  if(tipo==='foto'){
    const contenuto=document.getElementById('post-contenuto')?.value?.trim();
    if(!contenuto){showToast('❌ Didascalia obbligatoria','error');return;}
    // Raccogli foto da url inputs
    const urls=[0,1,2].map(i=>document.getElementById(`post-foto-url-${i}`)?.value?.trim()||postFotoUrls[i]||'').filter(Boolean);
    if(!urls.length){showToast('❌ Aggiungi almeno una foto','error');return;}
    const guadagnati=urls.length*FOLLOWER_FOTO;
    payload={...payload, contenuto, foto_urls:urls, follower_guadagnati:guadagnati};

  } else if(tipo==='intervista'){
    const gId=parseInt(document.getElementById('post-giocatore')?.value)||null;
    if(!gId){showToast('❌ Seleziona un calciatore','error');return;}
    const domande=[];
    for(let i=0;i<5;i++){
      const el=document.getElementById(`domanda-testo-${i}`);
      const risp=document.getElementById(`risposta-${i}`);
      if(!el||!risp) continue;
      const d=el.value?.trim();
      const r=risp.value?.trim();
      if(d&&r) domande.push({domanda:d,risposta:r});
    }
    if(domande.length<3){showToast('❌ Almeno 3 domande con risposta','error');return;}
    const g=giocatoriDB.find(x=>x.id===gId);
    const guadagnati=domande.length>=5?FOLLOWER_INTERVISTA_5:FOLLOWER_INTERVISTA_3;
    payload={...payload, giocatore_id:gId, titolo:`🎤 INTERVISTA ESCLUSIVA — ${g?.nome||''}`, domande, follower_guadagnati:guadagnati};

  } else if(tipo==='acquisto'){
    const tId=parseInt(document.getElementById('post-acquisto-tid')?.value)||null;
    if(!tId){showToast('❌ Seleziona un acquisto','error');return;}
    const contenuto=document.getElementById('post-contenuto-acq')?.value?.trim()||'';
    const postEsistente=socialPostsDB.find(p=>p.tipo==='acquisto'&&String(p.trattativa_id)===String(tId));

    if(postEsistente){
      // Il post è già stato creato in automatico al momento del trasferimento:
      // qui aggiorniamo solo la didascalia, senza toccare i follower già assegnati.
      try{
        const{error}=await sb.from('social_posts').update({contenuto}).eq('id',postEsistente.id);
        if(error) throw error;
        postEsistente.contenuto=contenuto;
        showToast('✅ Didascalia aggiornata!');
        document.getElementById('modal-social-post').classList.remove('open');
        if(typeof renderSocial==='function') renderSocial();
      }catch(e){ showToast('❌ Errore: '+e.message,'error'); }
      return;
    }

    // Fallback: trattativa vecchia senza post automatico associato (creato prima
    // dell'introduzione della pubblicazione automatica) — crea il post da qui.
    const t=trattativeDB.find(x=>x.id===tId);
    const g=t?giocatoriDB.find(x=>String(x.id)===String(t.giocatore_id)):null;
    const guadagnati=followerAcquisto(g?.quotazione);
    payload={...payload, giocatore_id:g?.id||null, trattativa_id:tId, titolo:`🔴 UFFICIALE: ${g?.nome||''} È NOSTRO!`, contenuto, follower_guadagnati:guadagnati};
  }

  try{
    const{data,error}=await sb.from('social_posts').insert(payload).select();
    if(error) throw error;

    // Accredita i follower guadagnati alla squadra che pubblica
    if(payload.follower_guadagnati>0){
      await aggiornaFollower(utenteLoggato.id, payload.follower_guadagnati);
    }

    showToast(`✅ Post pubblicato! +${fmtNum(payload.follower_guadagnati||0)} follower`);

    // Reset form per il prossimo post
    postFotoUrls=['','',''];
    ndomandeCorrente=3;

    document.getElementById('modal-social-post').classList.remove('open');
    if(typeof renderSocial==='function') renderSocial();
  } catch(e){
    showToast('❌ Errore: '+e.message,'error');
  }
}
