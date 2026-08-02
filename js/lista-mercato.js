// ===== LISTA MERCATO — buste segrete con obiettivi di mercato =====
// Una "sessione" alla volta: admin sceglie tipo (primavera max25 / prima
// squadra max30 / libera senza limite) e una scadenza. Ogni squadra scrive
// a mano i nomi dei giocatori che le interessano, modificabili liberamente
// fino alla scadenza. Dopo la scadenza si "apre la busta": per ogni nome
// scritto, il sistema mostra quante squadre (e quali) lo hanno scritto.
//
// NOTA SICUREZZA: la segretezza è garantita solo lato interfaccia (come il
// resto dell'app, che non usa autenticazione reale lato server). Chi sa
// usare gli strumenti sviluppatore del browser potrebbe in teoria leggere
// i dati grezzi prima della scadenza.

let sessioneMercatoCorrente=null; // riga più recente di lista_mercato_sessioni
let vociMieSessione=[];           // le mie voci (prima della rivelazione)
let vociTutteSessione=[];         // tutte le voci (solo dopo la scadenza)
let bozzaListaMercato=[];         // nomi in modifica, non ancora salvati
let timerListaMercato=null;

const LISTA_MERCATO_TIPI={
  primavera:{label:'Lista Primavera',max:25},
  prima_squadra:{label:'Lista Prima Squadra',max:30},
  libera:{label:'Lista Libera',max:null}
};

function sessioneScaduta(s){
  return !!s && new Date(s.scadenza).getTime()<=Date.now();
}

// Normalizza un nome scritto a mano per il confronto: minuscolo, spazi ai
// bordi rimossi, spazi multipli interni ridotti a uno solo. Così "De  Silvestri",
// "de silvestri" e "DE SILVESTRI" risultano tutti la stessa chiave.
function normalizzaNomeListaMercato(nome){
  return (nome||'').trim().toLowerCase().replace(/\s+/g,' ');
}

async function caricaListaMercato(){
  const content=document.getElementById('listamercato-content');
  if(content) content.innerHTML='<div class="loading"><div class="loading-spinner"></div>Caricamento...</div>';
  try{
    const{data,error}=await sb.from('lista_mercato_sessioni').select('*').order('id',{ascending:false}).limit(1);
    if(error) throw error;
    sessioneMercatoCorrente=(data&&data[0])||null;

    if(sessioneMercatoCorrente){
      if(sessioneScaduta(sessioneMercatoCorrente)){
        const r=await sb.from('lista_mercato_voci').select('*').eq('sessione_id',sessioneMercatoCorrente.id);
        if(r.error) throw r.error;
        vociTutteSessione=r.data||[];
        vociMieSessione=[];
      } else {
        const r=await sb.from('lista_mercato_voci').select('*').eq('sessione_id',sessioneMercatoCorrente.id).eq('squadra_id',utenteLoggato.id);
        if(r.error) throw r.error;
        vociMieSessione=r.data||[];
        vociTutteSessione=[];
        bozzaListaMercato=vociMieSessione.map(v=>v.nome_giocatore);
      }
    } else {
      vociMieSessione=[];vociTutteSessione=[];bozzaListaMercato=[];
    }
  }catch(e){
    if(content) content.innerHTML=`<div class="empty">❌ Errore caricamento: ${e.message}</div>`;
    return;
  }
  renderListaMercato();
  // Ricontrolla ogni 30s se nel frattempo è scattata la scadenza, per aprire
  // la busta in automatico senza bisogno di ricaricare la pagina.
  if(timerListaMercato) clearInterval(timerListaMercato);
  if(sessioneMercatoCorrente&&!sessioneScaduta(sessioneMercatoCorrente)){
    timerListaMercato=setInterval(()=>{
      if(sessioneScaduta(sessioneMercatoCorrente)) caricaListaMercato();
    },30000);
  }
}

function renderListaMercato(){
  const content=document.getElementById('listamercato-content');
  if(!content) return;

  const formNuovaSessione=adminLoggato?`
    <div style="background:var(--grigio);border:1px solid var(--oro);border-radius:12px;padding:16px;margin-bottom:16px">
      <div style="font-weight:700;color:var(--oro);margin-bottom:10px">⚙️ ${sessioneMercatoCorrente?'Nuova sessione (sostituisce quella attuale)':'Attiva una sessione'}</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:10px">
        ${Object.entries(LISTA_MERCATO_TIPI).map(([k,v])=>`
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="radio" name="lm-tipo" value="${k}" ${k==='primavera'?'checked':''}>
            <span>${v.label} ${v.max?`(max ${v.max} nomi)`:'(nessun limite)'}</span>
          </label>`).join('')}
      </div>
      <label class="form-label">Scadenza</label>
      <input type="datetime-local" id="lm-scadenza" class="form-input" style="margin-bottom:10px">
      <button onclick="creaSessioneListaMercato()" class="btn-primary" style="width:100%">🚀 Attiva sessione</button>
    </div>`:'';

  if(!sessioneMercatoCorrente){
    content.innerHTML=formNuovaSessione+(adminLoggato?'':'<div class="empty">Nessuna sessione di Lista Mercato attiva al momento.</div>');
    return;
  }

  const tipoInfo=LISTA_MERCATO_TIPI[sessioneMercatoCorrente.tipo]||{label:sessioneMercatoCorrente.tipo,max:sessioneMercatoCorrente.max_nomi};
  const scaduta=sessioneScaduta(sessioneMercatoCorrente);
  const dataScadenza=new Date(sessioneMercatoCorrente.scadenza).toLocaleString('it-IT',{dateStyle:'medium',timeStyle:'short'});

  if(!scaduta){
    // ===== FASE COMPILAZIONE (busta chiusa) =====
    const max=sessioneMercatoCorrente.max_nomi;
    content.innerHTML=`
      ${adminLoggato?formNuovaSessione:''}
      <div style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:12px;padding:16px;margin-bottom:16px">
        <div style="font-weight:700;font-size:16px;margin-bottom:4px">✉️ ${tipoInfo.label}</div>
        <div style="font-size:12px;color:var(--testo-dim);margin-bottom:12px">
          Scrivi i nomi dei giocatori che ti interessano — resteranno segreti fino alla scadenza.
          ${max?`Massimo ${max} nomi.`:'Nessun limite di nomi.'}<br>
          ⏰ Scadenza: <strong>${dataScadenza}</strong>
          ${adminLoggato?` <button onclick="modificaScadenzaListaMercato()" style="background:none;border:none;color:var(--oro);text-decoration:underline;cursor:pointer;font-size:12px;padding:0">✏️ modifica scadenza</button>`:''}
        </div>
        <div id="lm-righe-nomi"></div>
        ${(!max||bozzaListaMercato.length<max)?`<button onclick="aggiungiRigaListaMercato()" style="background:var(--grigio-chiaro);border:none;color:var(--testo);padding:8px 14px;border-radius:8px;cursor:pointer;font-size:13px;margin-top:6px">+ Aggiungi giocatore</button>`:''}
        <button onclick="salvaListaMercato()" class="btn-primary" style="width:100%;margin-top:14px">💾 Salva la mia lista</button>
      </div>`;
    renderRigheListaMercato();
    return;
  }

  // ===== FASE RIVELAZIONE (busta aperta) =====
  const gruppi={};
  vociTutteSessione.forEach(v=>{
    const key=normalizzaNomeListaMercato(v.nome_giocatore);
    if(!key) return;
    if(!gruppi[key]) gruppi[key]={nomeVisualizzato:v.nome_giocatore.trim(),squadreIds:new Set()};
    gruppi[key].squadreIds.add(String(v.squadra_id));
  });
  const listaGruppi=Object.entries(gruppi)
    .map(([key,g])=>[key,{
      nomeVisualizzato:g.nomeVisualizzato,
      squadre:[...g.squadreIds].map(id=>{
        const sq=squadreDB.find(s=>String(s.id)===id);
        return sq?.nome||sq?.owner_name||'—';
      })
    }])
    .sort((a,b)=>b[1].squadre.length-a[1].squadre.length);

  content.innerHTML=`
    ${adminLoggato?formNuovaSessione:''}
    <div style="background:var(--grigio);border:1px solid var(--verde);border-radius:12px;padding:16px">
      <div style="font-weight:700;font-size:16px;margin-bottom:4px">📬 ${tipoInfo.label} — Busta aperta</div>
      <div style="font-size:12px;color:var(--testo-dim);margin-bottom:14px">Scaduta il ${dataScadenza}</div>
      ${listaGruppi.length===0?'<div class="empty">Nessun nome scritto in questa sessione.</div>':listaGruppi.map(([key,g])=>`
        <div style="background:var(--grigio-scuro);border:1px solid var(--grigio-chiaro);border-radius:8px;padding:10px 14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:10px">
          <div>
            <div style="font-weight:700">${g.nomeVisualizzato}</div>
            <div style="font-size:12px;color:var(--testo-dim)">Scritto da ${g.squadre.length}: ${g.squadre.join(', ')}</div>
          </div>
          ${adminLoggato?`<button onclick="eliminaGruppoListaMercato('${key.replace(/'/g,"\\'")}')" style="background:rgba(255,68,68,0.1);border:1px solid rgba(255,68,68,0.3);color:var(--rosso);font-size:11px;padding:6px 10px;border-radius:6px;cursor:pointer;white-space:nowrap">🗑️ Non idoneo</button>`:''}
        </div>`).join('')}
    </div>`;
}

function renderRigheListaMercato(){
  const cont=document.getElementById('lm-righe-nomi');
  if(!cont) return;
  cont.innerHTML=bozzaListaMercato.map((nome,i)=>`
    <div style="display:flex;gap:6px;margin-bottom:6px">
      <input class="form-input" value="${(nome||'').replace(/"/g,'&quot;')}" placeholder="Nome giocatore" oninput="aggiornaRigaListaMercato(${i},this.value)" style="flex:1">
      <button onclick="rimuoviRigaListaMercato(${i})" style="background:var(--grigio-chiaro);border:none;color:var(--rosso);width:36px;border-radius:8px;cursor:pointer;font-size:16px">×</button>
    </div>`).join('');
}

function aggiungiRigaListaMercato(){
  const max=sessioneMercatoCorrente?.max_nomi;
  if(max&&bozzaListaMercato.length>=max){showToast(`❌ Massimo ${max} nomi`,'error');return;}
  bozzaListaMercato.push('');
  renderListaMercato();
}

function aggiornaRigaListaMercato(i,val){ bozzaListaMercato[i]=val; }

function rimuoviRigaListaMercato(i){
  bozzaListaMercato.splice(i,1);
  renderListaMercato();
}

async function salvaListaMercato(){
  if(!sessioneMercatoCorrente||sessioneScaduta(sessioneMercatoCorrente)){showToast('❌ Sessione non più aperta','error');return;}
  const nomi=bozzaListaMercato.map(n=>(n||'').trim()).filter(Boolean);
  const max=sessioneMercatoCorrente.max_nomi;
  if(max&&nomi.length>max){showToast(`❌ Massimo ${max} nomi`,'error');return;}

  // Blocca doppioni nella stessa lista (stesso nome scritto due volte, a
  // prescindere da maiuscole/spazi) — es. "Gianni" due volte non è ammesso,
  // ma "Gianni" e "C.Gianni" sono considerati nomi diversi perché il testo
  // digitato è diverso.
  const viste=new Set();
  for(const n of nomi){
    const key=normalizzaNomeListaMercato(n);
    if(viste.has(key)){
      showToast(`❌ Hai scritto "${n}" più di una volta`,'error');
      return;
    }
    viste.add(key);
  }

  try{
    const{error:errDel}=await sb.from('lista_mercato_voci').delete()
      .eq('sessione_id',sessioneMercatoCorrente.id).eq('squadra_id',utenteLoggato.id);
    if(errDel) throw errDel;
    if(nomi.length){
      const payload=nomi.map(n=>({sessione_id:sessioneMercatoCorrente.id,squadra_id:utenteLoggato.id,nome_giocatore:n}));
      const{error:errIns}=await sb.from('lista_mercato_voci').insert(payload);
      if(errIns) throw errIns;
    }
    showToast('✅ Lista salvata!');
    caricaListaMercato();
  }catch(e){ showToast('❌ Errore: '+e.message,'error'); }
}

// Corregge solo la data di scadenza della sessione attuale (es. errore di
// battitura), senza toccare i nomi già scritti dalle squadre.
async function modificaScadenzaListaMercato(){
  if(!adminLoggato||!sessioneMercatoCorrente) return;
  const attuale=new Date(sessioneMercatoCorrente.scadenza);
  const pad=n=>String(n).padStart(2,'0');
  const valoreAttuale=`${attuale.getFullYear()}-${pad(attuale.getMonth()+1)}-${pad(attuale.getDate())}T${pad(attuale.getHours())}:${pad(attuale.getMinutes())}`;
  const nuovoValore=prompt('Nuova data/ora di scadenza (formato: AAAA-MM-GGTHH:MM)',valoreAttuale);
  if(!nuovoValore) return;
  const nuovaData=new Date(nuovoValore);
  if(isNaN(nuovaData.getTime())){showToast('❌ Data non valida','error');return;}
  try{
    const{error}=await sb.from('lista_mercato_sessioni').update({scadenza:nuovaData.toISOString()}).eq('id',sessioneMercatoCorrente.id);
    if(error) throw error;
    showToast('✅ Scadenza aggiornata!');
    caricaListaMercato();
  }catch(e){ showToast('❌ Errore: '+e.message,'error'); }
}

async function creaSessioneListaMercato(){
  if(!adminLoggato) return;
  const tipo=document.querySelector('input[name="lm-tipo"]:checked')?.value||'primavera';
  const scadenzaVal=document.getElementById('lm-scadenza')?.value;
  if(!scadenzaVal){showToast('❌ Imposta una scadenza','error');return;}
  if(sessioneMercatoCorrente&&!sessioneScaduta(sessioneMercatoCorrente)){
    if(!confirm('C\'è già una sessione attiva non ancora scaduta. Crearne una nuova la sostituirà (le liste già scritte per quella vecchia restano salvate ma non più visibili come "attuali"). Continuare?')) return;
  }
  const max=LISTA_MERCATO_TIPI[tipo]?.max||null;
  try{
    const{error}=await sb.from('lista_mercato_sessioni').insert({
      tipo, max_nomi:max, scadenza:new Date(scadenzaVal).toISOString()
    });
    if(error) throw error;
    showToast('✅ Sessione attivata!');
    caricaListaMercato();
  }catch(e){ showToast('❌ Errore: '+e.message,'error'); }
}

async function eliminaGruppoListaMercato(keyNormalizzato){
  if(!adminLoggato) return;
  if(!confirm('Rimuovere questo giocatore dalle liste di tutte le squadre che lo hanno scritto (es. perché non idoneo)?')) return;
  try{
    // Cancella lato client tutte le voci il cui nome normalizzato corrisponde,
    // così gestiamo correttamente maiuscole/minuscole e spazi come da digitazione libera.
    const daRimuovere=vociTutteSessione.filter(v=>normalizzaNomeListaMercato(v.nome_giocatore)===keyNormalizzato);
    for(const v of daRimuovere){
      const{error}=await sb.from('lista_mercato_voci').delete().eq('id',v.id);
      if(error) throw error;
    }
    showToast('✅ Rimosso');
    caricaListaMercato();
  }catch(e){ showToast('❌ Errore: '+e.message,'error'); }
}
