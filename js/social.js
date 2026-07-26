// ===== SOCIAL MANAGER =====
let socialPostsDB=[];
let socialLikesDB={}; // post_id → array of squadra_id
let socialTabAttivo='feed';

// Follower guadagnati per tipo post
const FOLLOWER_FOTO=30;         // per ogni foto (max 3/sett)
const FOLLOWER_INTERVISTA_5=60; // intervista completa 5 domande
const FOLLOWER_INTERVISTA_3=50; // intervista min 3 domande
const FOLLOWER_LIKE_DATO=3;     // dai un like
const FOLLOWER_LIKE_RICEVUTO=5; // ricevi un like
const FOLLOWER_COMMENTO_DATO=5;
const FOLLOWER_COMMENTO_RICEVUTO=10;
const FOLLOWER_TOP1=150;
const FOLLOWER_TOP2=100;
const FOLLOWER_TOP3=50;

// Follower per acquisto in base al valore TM
function followerAcquisto(quotazione){
  const q=parseFloat(quotazione)||0;
  if(q>=70) return 5000;
  if(q>=60) return 3000;
  if(q>=50) return 2000;
  if(q>=40) return 1500;
  if(q>=30) return 1000;
  if(q>=20) return 500;
  if(q>=10) return 200;
  return 100;
}

// 50 domande allenatore su giocatore, 30 ambizioni giocatori, 20 ambizioni club
const DOMANDE_INTERVISTA_ALLENATORE_SU_GIOCATORE=[
  'Come descriveresti il carattere di questo giocatore fuori dal campo?',
  'Qual è la qualità tecnica che ti ha più sorpreso di lui?',
  'Come si è integrato nel gruppo?',
  'In che modo ha migliorato la squadra da quando è arrivato?',
  'Qual è il suo ruolo nello spogliatoio?',
  'Come reagisce nei momenti difficili?',
  'Cosa lo distingue dagli altri giocatori che hai allenato?',
  'Qual è il suo margine di miglioramento secondo te?',
  'Come si allena durante la settimana?',
  'In che situazione di gioco rende di più?',
  'Quanto è importante per la tua idea di gioco?',
  'Come gestisce la pressione delle grandi partite?',
  'Qual è stato il suo momento migliore in questa squadra?',
  'Come lo descriveresti tatticamente?',
  'Rinnoveresti il suo contratto senza pensarci?',
  'Cosa gli chiedi di migliorare ancora?',
  'Come lo utilizzi nei momenti chiave della partita?',
  'Quanto conta la sua esperienza per i giovani del gruppo?',
  'Ha caratteristiche che gli altri non hanno?',
  'Come si comporta quando non gioca?',
  'Qual è la sua mentalità in allenamento?',
  'Lo vedi come capitano in futuro?',
  'Come ha reagito agli infortuni o alle difficoltà fisiche?',
  'Cosa pensi del suo rapporto con i tifosi?',
  'Ha ancora fame di vittorie?',
  'Come gestisce le critiche?',
  'Quanto è decisivo nelle partite più importanti?',
  'Lo consiglieresti a un altro allenatore?',
  'Qual è la partita in cui ti ha sorpreso di più?',
  'Come lavora sulla testa oltre che sui piedi?',
  'Cosa lo rende unico in questo campionato?',
  'Come influenza il rendimento dei compagni?',
  'Hai mai dovuto convincerlo di qualcosa?',
  'Qual è la sua forza mentale su scala da 1 a 10?',
  'Come si è evoluto dalla prima volta che lo hai visto?',
  'Qual è il contributo che dà che non si vede nelle statistiche?',
  'Come si comporta quando la squadra perde?',
  'Pensi che possa fare ancora meglio?',
  'Come lo gestisci quando è in un momento di forma straordinaria?',
  'Qual è il consiglio più importante che gli hai dato?',
  'Ha mai sorpreso lo staff tecnico con una giocata improvvisata?',
  'Come affronta le partite di andata e ritorno nei tornei?',
  'Quanto conta il suo apporto nei calci piazzati?',
  'Come reagisce agli errori arbitrali?',
  'Qual è il suo obiettivo personale per questa stagione?',
  'Come si relaziona con i più giovani del gruppo?',
  'Lo consideri un punto fermo della squadra?',
  'Cosa ti ha detto quando lo hai chiamato per portarlo qui?',
  'Torneresti a prendere lo stesso giocatore sapendo quello che sai ora?',
  'Qual è la partita che ricorda come la più bella in questa maglia?',
];

const DOMANDE_INTERVISTA_GIOCATORE_AMBIZIONI=[
  'Qual è il trofeo che sogni di vincere con questa squadra?',
  'Dove ti vedi tra 5 anni nel calcio?',
  'Cosa rappresenta per te indossare questa maglia?',
  'Qual è l\'obiettivo personale più importante di questa stagione?',
  'Come vuoi essere ricordato da questi tifosi?',
  'Hai un idolo che hai sempre sognato di emulare?',
  'Qual è il traguardo che ancora non hai raggiunto e che vuoi raggiungere?',
  'Come descriveresti il tuo percorso fino a qui?',
  'Cosa ti ha spinto a scegliere questa squadra?',
  'Qual è la vittoria che ti ha dato più soddisfazione in carriera?',
  'Come ti motivi quando le cose non vanno bene?',
  'Qual è il tuo sogno più grande nel calcio?',
  'Cosa pensi di poter portare a questa squadra che ancora manca?',
  'In che posizione vuoi chiudere in classifica questa stagione?',
  'Hai intenzione di vincere il titolo di miglior giocatore della lega?',
  'Come bilanci ambizioni personali e obiettivi di squadra?',
  'Cosa ti spinge ad alzarsi ogni mattina e allenarsi?',
  'Qual è il sacrificio più grande che hai fatto per arrivare qui?',
  'Come vuoi finire la tua carriera?',
  'Cosa diresti a un giovane che sogna di fare il tuo mestiere?',
  'Qual è il gol o la giocata che ricorderai per sempre?',
  'Come gestisci le aspettative che gli altri hanno su di te?',
  'Pensi di poter diventare il simbolo di questo club?',
  'Qual è il tuo prossimo grande obiettivo?',
  'Come vivi il rapporto con la tifoseria?',
  'Cosa ti manca ancora per essere il giocatore completo che vuoi essere?',
  'Qual è il momento della carriera di cui vai più fiero?',
  'Come affronti le stagioni difficili?',
  'Hai mai pensato di mollare? Come hai superato quel momento?',
  'Cosa significa per te vincere un trofeo con questi compagni?',
];

const DOMANDE_INTERVISTA_PRESIDENTE_CLUB=[
  'Qual è l\'obiettivo principale del club per questa stagione?',
  'Fino a dove può arrivare questa squadra in campionato?',
  'Qual è il trofeo che vuoi portare a casa quest\'anno?',
  'Come descriveresti il progetto tecnico che stai costruendo?',
  'Quali sono le ambizioni del club nei prossimi 3 anni?',
  'Come vuoi essere ricordato come presidente di questo club?',
  'Qual è la posizione in classifica che consideri il minimo accettabile?',
  'Stai costruendo una squadra per vincere subito o per il futuro?',
  'Qual è l\'investimento più importante che vuoi fare?',
  'Come descrivi la filosofia di gioco che vuoi portare avanti?',
  'Qual è il colpo di mercato che cambierebbe tutto?',
  'Come stai lavorando per rendere il club più forte ogni anno?',
  'Qual è il messaggio che vuoi dare ai tifosi per questa stagione?',
  'Pensi di poter vincere il campionato quest\'anno?',
  'Quali competizioni ti stanno più a cuore?',
  'Come stai gestendo il budget per competere ai massimi livelli?',
  'Qual è la visione che hai per il futuro di questo club?',
  'Come stai costruendo un gruppo vincente?',
  'Qual è la cosa che ti rende più orgoglioso di questo club?',
  'Cosa manca ancora per fare il salto di qualità definitivo?',
];

const DOMANDE_INTERVISTA=[
  ...DOMANDE_INTERVISTA_ALLENATORE_SU_GIOCATORE,
  ...DOMANDE_INTERVISTA_GIOCATORE_AMBIZIONI,
  ...DOMANDE_INTERVISTA_PRESIDENTE_CLUB
];

// Domande totali: predefinite + quelle aggiunte da admin (domandeCustomDB, da config.js)
function tutteLeDomandeIntervista(){
  return [...DOMANDE_INTERVISTA, ...domandeCustomDB.map(d=>d.testo)];
}

async function renderSocial(){
  const btn=document.getElementById('btn-nuovo-post');
  if(btn) btn.style.display=utenteLoggato?'block':'none';
  // Carica posts
  try{
    const{data}=await sb.from('social_posts').select('*').order('created_at',{ascending:false}).limit(100);
    socialPostsDB=data||[];
  }catch(e){socialPostsDB=[];}
  pulisciFotoVecchie(); // pulizia in background, non blocca il render del feed
  // Carica likes
  try{
    const{data}=await sb.from('social_likes').select('*');
    socialLikesDB={};
    (data||[]).forEach(l=>{
      if(!socialLikesDB[l.post_id]) socialLikesDB[l.post_id]=[];
      socialLikesDB[l.post_id].push(l.squadra_id);
    });
  }catch(e){socialLikesDB={};}
  renderTopFollower();
  switchSocialTab(socialTabAttivo);
}

function renderTopFollower(){
  const el=document.getElementById('social-top-follower');
  if(!el) return;
  const sorted=[...squadreDB].sort((a,b)=>(b.social_followers||0)-(a.social_followers||0)).slice(0,3);
  el.innerHTML=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:4px">
    ${sorted.map((sq,i)=>{
      const medaglie=['🥇','🥈','🥉'];
      const colori=['var(--oro)','#aaa','#cd7f32'];
      return `<div style="background:var(--grigio);border:1px solid ${colori[i]}33;border-radius:10px;padding:10px;text-align:center;cursor:pointer" onclick="apriProfiloSocial('${sq.id}')">
        <div style="font-size:18px">${medaglie[i]}</div>
        <div style="width:36px;height:36px;border-radius:50%;margin:4px auto;overflow:hidden;background:${sq.avatar_bg};display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:14px;color:var(--nero)">
          ${sq.logo_url?`<img src="${sq.logo_url}" style="width:100%;height:100%;object-fit:cover">`:sq.avatar}
        </div>
        <div style="font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${sq.owner_name}</div>
        <div style="font-family:'Space Mono',monospace;font-size:12px;color:${colori[i]};font-weight:700">${fmtNum(sq.social_followers||0)}</div>
        <div style="font-size:9px;color:var(--testo-dim)">follower</div>
      </div>`;
    }).join('')}
  </div>`;
}

function switchSocialTab(tab){
  socialTabAttivo=tab;
  ['feed','mio','classifica'].forEach(t=>{
    const btn=document.getElementById(`social-tab-${t}`);
    if(!btn) return;
    const active=t===tab;
    btn.style.background=active?'var(--verde)':'var(--grigio-medio)';
    btn.style.color=active?'var(--nero)':'var(--testo)';
    btn.style.border=active?'none':'1px solid var(--grigio-chiaro)';
  });
  const c=document.getElementById('social-content');
  if(!c) return;
  if(tab==='feed') renderFeed(c);
  else if(tab==='mio') renderProfiloMio(c);
  else if(tab==='classifica') renderClassificaFollower(c);
}

function renderFeed(c){
  if(!socialPostsDB.length){
    c.innerHTML='<div class="empty">Nessun post ancora — sii il primo a pubblicare! 🚀</div>';
    return;
  }
  c.innerHTML=socialPostsDB.map(p=>renderPostCard(p)).join('');
}

function renderPostCard(p){
  const sq=squadreDB.find(s=>s.id===p.squadra_id);
  if(!sq) return '';
  const likes=socialLikesDB[p.id]||[];
  const iaMiPiace=utenteLoggato&&likes.includes(utenteLoggato.id);
  const foto=p.foto_urls||[];
  const mioPost=utenteLoggato&&p.squadra_id===utenteLoggato.id;
  const data=new Date(p.created_at).toLocaleDateString('it-IT',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
  const tipoBadge={
    'foto':'📸 FOTO',
    'intervista':'🎤 INTERVISTA',
    'acquisto':'🔴 ACQUISTO UFFICIALE',
  }[p.tipo]||'📝 POST';
  const tipoColor={
    'foto':'var(--blu)',
    'intervista':'var(--oro)',
    'acquisto':'var(--rosso)',
  }[p.tipo]||'var(--testo-dim)';

  return `<div style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:12px;overflow:hidden;margin-bottom:12px">
    <!-- HEADER POST -->
    <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--grigio-chiaro)">
      <div style="width:38px;height:38px;border-radius:50%;overflow:hidden;background:${sq.avatar_bg};flex-shrink:0;display:flex;align-items:center;justify-content:center;cursor:pointer" onclick="apriProfiloSocial('${sq.id}')">
        ${sq.logo_url?`<img src="${sq.logo_url}" style="width:100%;height:100%;object-fit:cover">`:sq.avatar}
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;font-size:13px;cursor:pointer" onclick="apriProfiloSocial('${sq.id}')">${sq.nome_squadra||sq.nome}</div>
        <div style="font-size:10px;color:var(--testo-dim)">👤 ${sq.owner_name} • ${data}</div>
      </div>
      <div style="font-size:10px;font-weight:700;color:${tipoColor};background:${tipoColor}22;padding:3px 8px;border-radius:5px;white-space:nowrap">${tipoBadge}</div>
    </div>

    <!-- CONTENUTO -->
    <div style="padding:12px 14px">
      ${p.titolo?`<div style="font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1px;margin-bottom:6px">${p.titolo}</div>`:''}
      ${p.contenuto?`<div style="font-size:13px;color:var(--testo);line-height:1.6;margin-bottom:10px">${p.contenuto}</div>`:''}

      <!-- FOTO -->
      ${foto.length?`<div style="display:grid;grid-template-columns:${foto.length===1?'1fr':'repeat('+Math.min(foto.length,3)+',1fr)'};gap:4px;border-radius:8px;overflow:hidden;margin-bottom:10px">
        ${foto.map(f=>`<img src="${f}" style="width:100%;aspect-ratio:1;object-fit:cover" onerror="this.style.display='none'">`).join('')}
      </div>`:''}

      <!-- INTERVISTA -->
      ${p.tipo==='intervista'&&p.domande?`
        <div style="background:var(--grigio-scuro);border-radius:8px;overflow:hidden;margin-bottom:10px">
          ${(p.domande||[]).map((d,i)=>`
            <div style="padding:10px 14px;${i>0?'border-top:1px solid var(--grigio-chiaro)':''}">
              <div style="font-size:10px;font-weight:700;color:var(--oro);margin-bottom:4px">Q${i+1}: ${d.domanda}</div>
              <div style="font-size:13px;line-height:1.5">${d.risposta}</div>
            </div>`).join('')}
        </div>`:''}

      <!-- ACQUISTO -->
      ${p.tipo==='acquisto'&&p.giocatore_id?`
        ${(()=>{const g=giocatoriDB.find(x=>x.id===p.giocatore_id);return g?`
          <div style="background:rgba(255,68,68,0.08);border:1px solid rgba(255,68,68,0.2);border-radius:10px;padding:12px;display:flex;align-items:center;gap:12px;margin-bottom:10px">
            <div style="width:44px;height:44px;border-radius:50%;overflow:hidden;background:var(--grigio-chiaro);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700">
              ${g.foto_url?`<img src="${g.foto_url}" style="width:100%;height:100%;object-fit:cover">`:iniziali(g.nome)}
            </div>
            <div>
              <div style="font-family:'Bebas Neue',sans-serif;font-size:16px">${g.nome}</div>
              <div style="font-size:11px;color:var(--testo-dim)">${g.ruolo} ${g.quotazione?'• '+g.quotazione+'M€ TM':''}</div>
              <div style="font-size:11px;color:var(--rosso);margin-top:2px">🔴 SI È UNITO ALLA SQUADRA</div>
            </div>
            ${g.quotazione?`<div style="margin-left:auto;text-align:center;flex-shrink:0">
              <div style="font-family:'Space Mono',monospace;font-size:14px;color:var(--verde);font-weight:700">+${fmtNum(followerAcquisto(g.quotazione))}</div>
              <div style="font-size:9px;color:var(--testo-dim)">follower</div>
            </div>`:''}
          </div>`:'';})()}
      `:''}
    </div>

    <!-- AZIONI -->
    <div style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-top:1px solid var(--grigio-chiaro)">
      ${utenteLoggato&&!mioPost?`
        <button onclick="toggleLike(${p.id})" style="display:flex;align-items:center;gap:5px;background:${iaMiPiace?'rgba(255,68,68,0.15)':'rgba(255,255,255,0.05)'};border:1px solid ${iaMiPiace?'rgba(255,68,68,0.4)':'var(--grigio-chiaro)'};color:${iaMiPiace?'var(--rosso)':'var(--testo-dim)'};font-size:12px;font-weight:${iaMiPiace?'700':'400'};padding:5px 12px;border-radius:6px;cursor:pointer">
          ${iaMiPiace?'❤️':'🤍'} ${likes.length>0?likes.length:''}
        </button>
      `:`<div style="display:flex;align-items:center;gap:5px;font-size:12px;color:var(--testo-dim)">❤️ ${likes.length}</div>`}
      <button onclick="apriCommenti(${p.id})" style="display:flex;align-items:center;gap:5px;background:rgba(255,255,255,0.05);border:1px solid var(--grigio-chiaro);color:var(--testo-dim);font-size:12px;padding:5px 12px;border-radius:6px;cursor:pointer">
        💬 Commenta
      </button>
      <div style="margin-left:auto;font-size:10px;color:var(--testo-dim)">+${fmtNum(p.follower_guadagnati||0)} follower</div>
    </div>
  </div>`;
}

async function toggleLike(postId){
  if(!utenteLoggato){showToast('❌ Devi essere loggato','error');return;}
  const post=socialPostsDB.find(p=>p.id===postId);
  if(!post) return;

  // Non fidarti solo della cache locale (socialLikesDB): se non è aggiornata
  // (es. dopo un ricaricamento) rischi di far ripartire il conteggio da zero
  // e permettere di mettere like più volte. Verifichiamo sempre sul database.
  let giaMiPiace=false;
  try{
    const{data,error}=await sb.from('social_likes').select('id').eq('post_id',postId).eq('squadra_id',utenteLoggato.id).limit(1);
    if(error) throw error;
    giaMiPiace = !!(data && data.length);
  }catch(e){
    showToast('❌ Errore verifica like: '+e.message,'error');
    return;
  }

  // Allinea la cache locale a quanto trovato sul DB, prima di decidere l'azione
  if(!socialLikesDB[postId]) socialLikesDB[postId]=[];
  const cacheHaLike=socialLikesDB[postId].includes(utenteLoggato.id);
  if(giaMiPiace && !cacheHaLike) socialLikesDB[postId].push(utenteLoggato.id);
  if(!giaMiPiace && cacheHaLike) socialLikesDB[postId]=socialLikesDB[postId].filter(s=>s!==utenteLoggato.id);

  if(giaMiPiace){
    // Rimuovi like
    try{
      const{error}=await sb.from('social_likes').delete().eq('post_id',postId).eq('squadra_id',utenteLoggato.id);
      if(error) throw error;
      socialLikesDB[postId]=(socialLikesDB[postId]||[]).filter(s=>s!==utenteLoggato.id);
      await aggiornaFollower(utenteLoggato.id,-FOLLOWER_LIKE_DATO);
      await aggiornaFollower(post.squadra_id,-FOLLOWER_LIKE_RICEVUTO);
    }catch(e){ showToast('❌ Errore rimozione like: '+e.message,'error'); return; }
  } else {
    // Aggiungi like — il vincolo UNIQUE(post_id, squadra_id) sul DB blocca
    // eventuali doppioni anche se la cache locale fosse disallineata
    try{
      const{error}=await sb.from('social_likes').insert({post_id:postId,squadra_id:utenteLoggato.id});
      if(error){
        // Violazione del vincolo di unicità: il like esiste già sul DB,
        // semplicemente non aggiorniamo i follower una seconda volta
        if(error.code==='23505'){
          socialLikesDB[postId].push(utenteLoggato.id);
          showToast('Hai già messo like a questo post');
          switchSocialTab('feed');
          return;
        }
        throw error;
      }
      socialLikesDB[postId].push(utenteLoggato.id);
      await aggiornaFollower(utenteLoggato.id,FOLLOWER_LIKE_DATO);
      await aggiornaFollower(post.squadra_id,FOLLOWER_LIKE_RICEVUTO);
      showToast(`❤️ +${FOLLOWER_LIKE_DATO} tuoi follower, +${FOLLOWER_LIKE_RICEVUTO} a ${squadreDB.find(s=>s.id===post.squadra_id)?.owner_name||'—'}`);
    }catch(e){ showToast('❌ Errore like: '+e.message,'error'); return; }
  }
  switchSocialTab('feed');
}

// ══════════════════════════════════════════════
// POST AUTOMATICO ACQUISTO/PRESTITO
// Chiamata da eseguiTrasferimento() in mercato.js: ogni trasferimento
// (admin diretto o trattativa approvata) genera SEMPRE un post, con
// didascalia di default che il proprietario potrà poi modificare dal
// tab "ACQUISTO" del form nuovo post (non crea un post nuovo, aggiorna
// quello esistente — vedi pubblicaPost in nuovo-post.js).
// Non blocca mai il trasferimento: eventuali errori vengono solo loggati.
// ══════════════════════════════════════════════
async function pubblicaPostAutomatico(t, gId){
  try{
    if(!t || !gId) return;
    const sqAcquirente = t.squadra_acquirente_id;
    if(!sqAcquirente) return; // niente squadra valida, niente post

    // Un giocatore può essere "ufficializzato" una sola volta in assoluto,
    // anche se viene ceduto e ripreso più volte nel tempo — evita di generare
    // più post (e più follower) per lo stesso giocatore.
    const {data: esistente} = await sb.from('social_posts').select('id').eq('tipo','acquisto').eq('giocatore_id', gId).limit(1);
    if(esistente && esistente.length) return;

    const g = giocatoriDB.find(x=>String(x.id)===String(gId));
    if(!g) return;

    const isPrestito = (t.tipo||'').toLowerCase().includes('prestito');
    const guadagnati = followerAcquisto(g.quotazione);
    const titolo = isPrestito
      ? `🔵 UFFICIALE: ${g.nome} arriva in prestito!`
      : `🔴 UFFICIALE: ${g.nome} È NOSTRO!`;

    const payload = {
      squadra_id: sqAcquirente,
      tipo: 'acquisto',
      giocatore_id: g.id,
      trattativa_id: t.id || null,
      titolo,
      contenuto: '',
      follower_guadagnati: guadagnati
    };

    const {data, error} = await sb.from('social_posts').insert(payload).select();
    if(error){ console.warn('Post automatico non creato:', error); return; }
    if(data && data[0]) socialPostsDB.unshift(data[0]);
    if(guadagnati>0) await aggiornaFollower(sqAcquirente, guadagnati);
  }catch(e){
    console.warn('Errore post automatico:', e);
  }
}

async function aggiornaFollower(sqId, delta){
  const idx=squadreDB.findIndex(s=>s.id===sqId);
  if(idx<0) return;
  const nuovi=Math.max(0,(squadreDB[idx].social_followers||0)+delta);
  try{
    await sb.from('squadre').update({social_followers:nuovi}).eq('id',sqId);
    squadreDB[idx].social_followers=nuovi;
    if(utenteLoggato&&utenteLoggato.id===sqId) utenteLoggato.social_followers=nuovi;
  }catch(e){}
}

async function apriCommenti(postId){
  const post=socialPostsDB.find(p=>p.id===postId);
  if(!post) return;
  const modalEl=document.getElementById('modal-commenti');
  const body=document.getElementById('commenti-body');
  body.innerHTML='<div class="loading"><div class="loading-spinner"></div></div>';
  modalEl.classList.add('open');
  try{
    const{data}=await sb.from('social_commenti').select('*').eq('post_id',postId).order('created_at');
    const commenti=data||[];
    const sq=squadreDB.find(s=>s.id===post.squadra_id);
    body.innerHTML=`
      <div style="font-weight:600;font-size:13px;margin-bottom:12px">Post di ${sq?.nome_squadra||sq?.nome||'—'}</div>
      <div style="max-height:300px;overflow-y:auto;margin-bottom:14px">
        ${commenti.length?commenti.map(cm=>{
          const s=squadreDB.find(x=>x.id===cm.squadra_id);
          const d=new Date(cm.created_at).toLocaleDateString('it-IT',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
          return `<div style="display:flex;gap:8px;padding:8px 0;border-bottom:1px solid var(--grigio-chiaro)">
            <div style="width:28px;height:28px;border-radius:50%;background:${s?.avatar_bg||'#333'};flex-shrink:0;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700">
              ${s?.logo_url?`<img src="${s.logo_url}" style="width:100%;height:100%;object-fit:cover">`:s?.avatar||'?'}
            </div>
            <div style="flex:1">
              <div style="font-size:11px;font-weight:700">${s?.owner_name||'—'} <span style="color:var(--testo-dim);font-weight:400">${d}</span></div>
              <div style="font-size:13px;margin-top:2px">${cm.testo}</div>
            </div>
          </div>`;
        }).join(''):'<div style="text-align:center;color:var(--testo-dim);padding:16px">Nessun commento ancora</div>'}
      </div>
      ${utenteLoggato&&post.squadra_id!==utenteLoggato.id?(
        commenti.some(cm=>String(cm.squadra_id)===String(utenteLoggato.id))
        ? `<div style="font-size:11px;color:var(--testo-dim);text-align:center;padding:6px">Hai già commentato questo post</div>`
        : `<div style="display:flex;gap:8px">
            <input id="nuovo-commento-input" class="form-input" type="text" placeholder="Scrivi un commento..." style="flex:1">
            <button onclick="inviaCommento(${postId},'${post.squadra_id}')" style="background:var(--verde);color:var(--nero);font-family:'Bebas Neue',sans-serif;font-size:14px;padding:8px 14px;border-radius:8px;border:none;cursor:pointer">INVIA</button>
          </div>
          <div style="font-size:10px;color:var(--testo-dim);margin-top:4px">+${FOLLOWER_COMMENTO_DATO} tuoi follower • +${FOLLOWER_COMMENTO_RICEVUTO} follower al proprietario</div>`
      ):''}`;
  }catch(e){body.innerHTML='<div class="empty">Errore caricamento</div>';}
}

async function inviaCommento(postId, postOwnerSqId){
  const input=document.getElementById('nuovo-commento-input');
  const testo=input?.value?.trim();
  if(!testo){showToast('❌ Scrivi qualcosa','error');return;}
  if(!utenteLoggato) return;

  // Un solo commento per post per squadra: verifica sempre sul DB, non solo
  // sull'interfaccia, per evitare farming di follower da sessioni disallineate.
  try{
    const{data,error:errSel}=await sb.from('social_commenti').select('id').eq('post_id',postId).eq('squadra_id',utenteLoggato.id).limit(1);
    if(errSel) throw errSel;
    if(data && data.length){
      showToast('Hai già commentato questo post');
      apriCommenti(postId);
      return;
    }
  }catch(e){ showToast('❌ Errore verifica: '+e.message,'error'); return; }

  try{
    const{error}=await sb.from('social_commenti').insert({post_id:postId,squadra_id:utenteLoggato.id,testo});
    if(error){
      if(error.code==='23505'){
        showToast('Hai già commentato questo post');
        apriCommenti(postId);
        return;
      }
      throw error;
    }
    await aggiornaFollower(utenteLoggato.id,FOLLOWER_COMMENTO_DATO);
    await aggiornaFollower(postOwnerSqId,FOLLOWER_COMMENTO_RICEVUTO);
    showToast(`💬 Commento pubblicato! +${FOLLOWER_COMMENTO_DATO} tuoi follower`);
    input.value='';
    apriCommenti(postId); // ricarica
  }catch(e){showToast('❌ Errore: '+e.message,'error');}
}

function renderProfiloMio(c){
  if(!utenteLoggato){c.innerHTML='<div class="empty">Accedi per vedere il tuo profilo</div>';return;}
  apriProfiloSocial(utenteLoggato.id, c);
}

function apriProfiloSocial(sqId, container=null){
  const sq=squadreDB.find(s=>s.id===sqId);
  if(!sq) return;
  const miei=socialPostsDB.filter(p=>p.squadra_id===sqId);
  const mieiGiocatori=giocatoriDB.filter(g=>g.squadra_id===sqId&&g.lista==='principale');
  const html=`
    <!-- HEADER PROFILO -->
    <div style="background:${sq.avatar_bg};border-radius:14px;overflow:hidden;margin-bottom:14px">
      <div style="padding:20px;display:flex;align-items:center;gap:14px">
        <div style="width:64px;height:64px;border-radius:50%;overflow:hidden;background:rgba(0,0,0,0.2);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:24px;color:var(--nero);border:3px solid rgba(255,255,255,0.3)">
          ${sq.logo_url?`<img src="${sq.logo_url}" style="width:100%;height:100%;object-fit:cover">`:sq.avatar}
        </div>
        <div style="flex:1">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:22px;color:var(--nero);letter-spacing:2px">${sq.nome_squadra||sq.nome}</div>
          <div style="font-size:12px;color:rgba(0,0,0,0.6)">👤 ${sq.owner_name}</div>
          ${sq.maglia_url?`<img src="${sq.maglia_url}" style="height:32px;margin-top:6px;object-fit:contain" onerror="this.style.display='none'">`:''}
        </div>
        <div style="text-align:center;flex-shrink:0">
          <div style="font-family:'Space Mono',monospace;font-size:22px;font-weight:700;color:var(--nero)">${fmtNum(sq.social_followers||0)}</div>
          <div style="font-size:11px;color:rgba(0,0,0,0.6)">follower</div>
          ${adminLoggato?`<button onclick="modificaFollowerManuale('${sq.id}')" style="background:none;border:none;color:rgba(0,0,0,0.5);cursor:pointer;font-size:12px;margin-top:2px">✏️ modifica</button>`:''}
        </div>
      </div>
    </div>
    <!-- POST -->
    <div style="font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1px;margin-bottom:10px;color:var(--testo-dim)">${miei.length} POST</div>
    ${miei.length?miei.map(p=>renderPostCard(p)).join(''):'<div class="empty" style="margin-bottom:14px">Nessun post ancora</div>'}
  `;
  if(container){
    container.innerHTML=html;
  } else {
    document.getElementById('profilo-social-body').innerHTML=html;
    document.getElementById('modal-profilo-social').classList.add('open');
  }
}

function renderClassificaFollower(c){
  const sorted=[...squadreDB].sort((a,b)=>(b.social_followers||0)-(a.social_followers||0));
  c.innerHTML=`<div style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:12px;overflow:hidden">
    ${sorted.map((sq,i)=>{
      const medaglie=['🥇','🥈','🥉'];
      const isMio=utenteLoggato&&sq.id===utenteLoggato.id;
      return `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--grigio-chiaro);background:${isMio?'rgba(0,255,135,0.04)':''};cursor:pointer" onclick="apriProfiloSocial('${sq.id}')">
        <div style="font-family:'Space Mono',monospace;font-size:13px;font-weight:700;color:var(--testo-dim);width:20px">${i<3?medaglie[i]:i+1}</div>
        <div style="width:32px;height:32px;border-radius:50%;overflow:hidden;background:${sq.avatar_bg};flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:13px;color:var(--nero)">
          ${sq.logo_url?`<img src="${sq.logo_url}" style="width:100%;height:100%;object-fit:cover">`:sq.avatar}
        </div>
        <div style="flex:1">
          <div style="font-weight:600;font-size:13px">${sq.nome_squadra||sq.nome}</div>
          <div style="font-size:10px;color:var(--testo-dim)">👤 ${sq.owner_name}</div>
        </div>
        <div style="font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:var(--verde)">${fmtNum(sq.social_followers||0)}</div>
        ${adminLoggato?`<button onclick="event.stopPropagation();modificaFollowerManuale('${sq.id}')" style="background:none;border:none;color:var(--testo-dim);cursor:pointer;font-size:13px;padding:2px 4px">✏️</button>`:''}
      </div>`;
    }).join('')}
  </div>`;
}

// Modifica manuale follower (solo admin) — per correzioni o eventi speciali
async function modificaFollowerManuale(sqId){
  if(!adminLoggato) return;
  const sq=squadreDB.find(s=>s.id===sqId);
  if(!sq) return;
  const attuale=sq.social_followers||0;
  const nuovoStr=prompt(`Follower attuali di ${sq.nome_squadra||sq.nome}: ${attuale}\n\nInserisci il nuovo totale:`,attuale);
  if(nuovoStr===null) return;
  const nuovo=parseInt(nuovoStr);
  if(isNaN(nuovo)||nuovo<0){showToast('❌ Valore non valido','error');return;}
  try{
    await sb.from('squadre').update({social_followers:nuovo}).eq('id',sqId);
    sq.social_followers=nuovo;
    if(utenteLoggato&&utenteLoggato.id===sqId) utenteLoggato.social_followers=nuovo;
    showToast(`✅ Follower di ${sq.nome_squadra||sq.nome} impostati a ${fmtNum(nuovo)}`);
    if(typeof renderSocial==='function') renderSocial();
  }catch(e){showToast('❌ '+e.message,'error');}
}

// Cancella dal database i post-foto più vecchi di 7 giorni, per non far
// affollare il feed e alleggerire la tabella. NOTA: questo rimuove solo il
// riferimento nel database, non la foto vera su Cloudinary (servirebbe la
// chiave segreta dell'account, non usabile in sicurezza lato client) — se
// vuoi liberare anche lo spazio reale, va fatto a mano dalla Media Library
// di Cloudinary di tanto in tanto.
let ultimaPuliziaFoto=null;
async function pulisciFotoVecchie(){
  // Al massimo una volta per sessione, per non ripetere la query ad ogni apertura del feed
  if(ultimaPuliziaFoto) return;
  ultimaPuliziaFoto=Date.now();
  try{
    const settimanaFa=new Date(Date.now()-7*24*60*60*1000).toISOString();
    const{data,error}=await sb.from('social_posts').delete().eq('tipo','foto').lt('created_at',settimanaFa).select();
    if(error) throw error;
    if(data&&data.length){
      const idsRimossi=new Set(data.map(p=>p.id));
      socialPostsDB=socialPostsDB.filter(p=>!idsRimossi.has(p.id));
      console.log(`🧹 Puliti ${data.length} post-foto più vecchi di 7 giorni`);
    }
  }catch(e){ console.warn('Pulizia foto vecchie non riuscita:',e.message); }
}
