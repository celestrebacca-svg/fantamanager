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
let vociMieSessione=[];           // le mie voci già salvate (prima della rivelazione)
let vociTutteSessione=[];         // tutte le voci (solo dopo la scadenza)
let bozzaListaMercato=[];         // righe in modifica: [{id, nome}] — id=null se non ancora salvata
let timerListaMercato=null;
let salvandoListaMercato=false;   // blocca doppio salvataggio da click ripetuti

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
        bozzaListaMercato=vociMieSessione.map(v=>({id:v.id,nome:v.nome_giocatore}));
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
        <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap">
          ${(!max||bozzaListaMercato.length<max)?`<button onclick="aggiungiRigaListaMercato()" style="background:var(--grigio-chiaro);border:none;color:var(--testo);padding:8px 14px;border-radius:8px;cursor:pointer;font-size:13px">+ Aggiungi giocatore</button>`:''}
          ${bozzaListaMercato.length>0?`<button onclick="svuotaListaMercato()" style="background:rgba(255,68,68,0.1);border:1px solid rgba(255,68,68,0.3);color:var(--rosso);padding:8px 14px;border-radius:8px;cursor:pointer;font-size:13px">🗑️ Svuota tutto</button>`:''}
        </div>
        <button id="lm-btn-salva" onclick="salvaListaMercato()" class="btn-primary" style="width:100%;margin-top:14px">💾 Salva (aggiunge solo i nomi nuovi)</button>
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
  cont.innerHTML=bozzaListaMercato.map((riga,i)=>`
    <div style="display:flex;gap:6px;margin-bottom:6px">
      <input class="form-input" value="${(riga.nome||'').replace(/"/g,'&quot;')}" placeholder="Nome giocatore" oninput="aggiornaRigaListaMercato(${i},this.value)" style="flex:1">
      <button onclick="rimuoviRigaListaMercato(${i})" style="background:var(--grigio-chiaro);border:none;color:var(--rosso);width:36px;border-radius:8px;cursor:pointer;font-size:16px">×</button>
    </div>`).join('');
}

function aggiungiRigaListaMercato(){
  const max=sessioneMercatoCorrente?.max_nomi;
  if(max&&bozzaListaMercato.length>=max){showToast(`❌ Massimo ${max} nomi`,'error');return;}
  bozzaListaMercato.push({id:null,nome:''});
  renderListaMercato();
}

function aggiornaRigaListaMercato(i,val){ bozzaListaMercato[i].nome=val; }

// Se la riga era già salvata sul database (ha un id), la cancella subito lì;
// se era solo una bozza non ancora salvata, la toglie semplicemente in locale.
async function rimuoviRigaListaMercato(i){
  const riga=bozzaListaMercato[i];
  if(riga.id){
    try{
      const{error}=await sb.from('lista_mercato_voci').delete().eq('id',riga.id);
      if(error) throw error;
    }catch(e){ showToast('❌ Errore rimozione: '+e.message,'error'); return; }
  }
  bozzaListaMercato.splice(i,1);
  renderListaMercato();
}

// Cancella TUTTE le mie voci di questa sessione in un colpo solo (utile per
// ripartire da zero senza dover rimuovere le righe una per una).
async function svuotaListaMercato(){
  if(!sessioneMercatoCorrente) return;
  if(!confirm('Svuotare completamente la tua lista per questa sessione? Non si può annullare.')) return;
  try{
    const{error}=await sb.from('lista_mercato_voci').delete()
      .eq('sessione_id',sessioneMercatoCorrente.id).eq('squadra_id',utenteLoggato.id);
    if(error) throw error;
    bozzaListaMercato=[];
    showToast('✅ Lista svuotata');
    caricaListaMercato();
  }catch(e){ showToast('❌ Errore: '+e.message,'error'); }
}

// Salvataggio ADDITIVO: aggiunge solo le righe nuove (senza id, cioè mai
// salvate prima) e non tocca quelle già presenti sul database. Non fa mai
// più un cancella-e-reinserisci-tutto, che era la causa dei doppioni.
async function salvaListaMercato(){
  if(salvandoListaMercato) return; // blocca doppio click / doppio salvataggio
  if(!sessioneMercatoCorrente||sessioneScaduta(sessioneMercatoCorrente)){showToast('❌ Sessione non più aperta','error');return;}

  const nomiNuovi=bozzaListaMercato.filter(r=>!r.id&&(r.nome||'').trim()).map(r=>r.nome.trim());
  const totaleFinale=bozzaListaMercato.filter(r=>(r.nome||'').trim()).length;
  const max=sessioneMercatoCorrente.max_nomi;
  if(max&&totaleFinale>max){showToast(`❌ Massimo ${max} nomi`,'error');return;}
  if(!nomiNuovi.length){showToast('Nessun nome nuovo da salvare');return;}

  salvandoListaMercato=true;
  const btn=document.getElementById('lm-btn-salva');
  if(btn){btn.disabled=true;btn.textContent='Salvataggio...';}
  try{
    const payload=nomiNuovi.map(n=>({sessione_id:sessioneMercatoCorrente.id,squadra_id:utenteLoggato.id,nome_giocatore:n}));
    const{error}=await sb.from('lista_mercato_voci').insert(payload);
    if(error) throw error;
    showToast(`✅ Aggiunti ${nomiNuovi.length} nomi nuovi!`);
    await caricaListaMercato();
  }catch(e){ showToast('❌ Errore: '+e.message,'error'); }
  finally{ salvandoListaMercato=false; }
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
