// ===== SPOSTA GIOCATORE =====
let giocatoreDaSpostare=null;

function apriSpostaGiocatore(){
  giocatoreDaSpostare=null;
  document.getElementById('sposta-step1').style.display='block';
  document.getElementById('sposta-step2').style.display='none';
  document.getElementById('sposta-search').value='';
  document.getElementById('sposta-lista').innerHTML='';
  const sel=document.getElementById('sposta-squadra-id');
  sel.innerHTML='<option value="">— Lascia nella stessa squadra —</option>'+
    squadreDB.map(s=>`<option value="${s.id}">${s.nome} (${s.owner_name})</option>`).join('');
  document.getElementById('modal-sposta').classList.add('open');
}

function cercaGiocatoreSposta(val){
  if(val.length<2){document.getElementById('sposta-lista').innerHTML='';return;}
  const results=giocatoriDB.filter(g=>g.nome.toLowerCase().includes(val.toLowerCase())).slice(0,15);
  document.getElementById('sposta-lista').innerHTML=results.map(g=>{
    const sq=squadreDB.find(s=>s.id===g.squadra_id);
    return`<div class="giocatore-search-item" onclick="selezionaGiocatoreSposta(${g.id})">
      <div class="gsi-avatar">${g.foto_url?`<img src="${g.foto_url}">`:iniziali(g.nome)}</div>
      <div class="gsi-info">
        <div class="gsi-nome">${g.nome}</div>
        <div class="gsi-sub">${sq?sq.nome:'—'} • ${g.ruolo} • ${g.lista||'—'}</div>
      </div>
    </div>`;
  }).join('');
}

function selezionaGiocatoreSposta(gId){
  const g=giocatoriDB.find(x=>x.id===gId);
  const sq=squadreDB.find(s=>s.id===g.squadra_id);
  giocatoreDaSpostare=g;
  document.getElementById('sposta-step1').style.display='none';
  document.getElementById('sposta-step2').style.display='block';
  document.getElementById('sposta-avatar').innerHTML=g.foto_url?
    `<img src="${g.foto_url}" style="width:44px;height:44px;object-fit:cover;border-radius:50%">`:iniziali(g.nome);
  document.getElementById('sposta-nome').textContent=g.nome;
  document.getElementById('sposta-info-attuale').textContent=
    `${sq?sq.nome:'—'} • ${g.ruolo} • Lista attuale: ${g.lista||'—'}`;
  document.getElementById('sposta-squadra-id').value=g.squadra_id||'';
  document.getElementById('sposta-lista').innerHTML=`
    <option value="principale" ${g.lista==='principale'?'selected':''}>🟢 Principale</option>
    <option value="marginale" ${g.lista==='marginale'?'selected':''}>🟡 Marginale</option>
    <option value="primavera" ${g.lista==='primavera'?'selected':''}>🔵 Primavera</option>`;
  aggiornaCountSposta();
}

function tornaSpostaStep1(){
  giocatoreDaSpostare=null;
  document.getElementById('sposta-step1').style.display='block';
  document.getElementById('sposta-step2').style.display='none';
  document.getElementById('sposta-search').value='';
  document.getElementById('sposta-lista').innerHTML='';
}

function aggiornaCountSposta(){
  const sqId=document.getElementById('sposta-squadra-id').value||
    (giocatoreDaSpostare?giocatoreDaSpostare.squadra_id:'');
  const listaEl=document.getElementById('sposta-lista');
  const lista=listaEl?listaEl.value:'principale';
  if(!sqId){document.getElementById('sposta-count').textContent='';return;}
  const max={principale:25,marginale:14};
  const n=giocatoriDB.filter(g=>g.squadra_id===sqId&&g.lista===lista&&
    (!giocatoreDaSpostare||g.id!==giocatoreDaSpostare.id)).length;
  const m=max[lista];
  const color=m&&n>=m?'var(--rosso)':'var(--verde)';
  document.getElementById('sposta-count').innerHTML=m?
    `<span style="color:${color}">${lista.charAt(0).toUpperCase()+lista.slice(1)}: ${n}/${m} (dopo spostamento)</span>`:'';
}

async function salvaSposta(){
  if(!giocatoreDaSpostare){showToast('❌ Nessun giocatore selezionato','error');return;}
  const nuovaSqId=document.getElementById('sposta-squadra-id').value||giocatoreDaSpostare.squadra_id;
  const nuovaLista=document.getElementById('sposta-lista').value;
  const max={principale:25,marginale:14};
  const n=giocatoriDB.filter(g=>g.squadra_id===nuovaSqId&&g.lista===nuovaLista&&g.id!==giocatoreDaSpostare.id).length;
  if(max[nuovaLista]&&n>=max[nuovaLista]){
    showToast(`❌ Rosa ${nuovaLista} piena (max ${max[nuovaLista]})!`,'error');return;
  }
  const updates={squadra_id:nuovaSqId,lista:nuovaLista};
  try{
    const{data,error}=await sb.from('giocatori').update(updates).eq('id',giocatoreDaSpostare.id).select();
    if(error) throw error;
    // Supabase non segnala errore se l'UPDATE viene bloccato da RLS o non trova
    // righe corrispondenti: restituisce semplicemente un array vuoto. Senza
    // questo controllo il toast direbbe "riuscito" anche a fronte di zero
    // modifiche reali sul database.
    if(!data || data.length===0){
      showToast('❌ Spostamento non salvato (nessuna riga aggiornata — controlla i permessi RLS sulla tabella giocatori)','error');
      return;
    }
    const idx=giocatoriDB.findIndex(x=>x.id===giocatoreDaSpostare.id);
    if(idx>=0) giocatoriDB[idx]={...giocatoriDB[idx],...updates};
    const sq=squadreDB.find(s=>s.id===nuovaSqId);
    showToast(`✅ ${giocatoreDaSpostare.nome} → ${nuovaLista} di ${sq?.nome||''}!`);
    document.getElementById('modal-sposta').classList.remove('open');
    if(squadraAttiva) renderRosa(tabAttivoSq);
  }catch(e){showToast('❌ Errore: '+e.message,'error');}
}

let svincolatiCaricati=false;
function switchTabRose(tab){
  const sqDiv=document.getElementById('rose-tab-squadre');
  const svDiv=document.getElementById('rose-tab-svincolati');
  const btnSq=document.getElementById('tab-rose-squadre');
  const btnSv=document.getElementById('tab-rose-svincolati');
  if(tab==='squadre'){
    sqDiv.style.display='block';svDiv.style.display='none';
    btnSq.style.cssText='background:var(--verde);color:var(--nero);font-family:\'Bebas Neue\',sans-serif;font-size:14px;letter-spacing:1px;padding:8px 18px;border-radius:8px;border:none;cursor:pointer';
    btnSv.style.cssText='background:var(--grigio-medio);color:var(--testo);font-family:\'Bebas Neue\',sans-serif;font-size:14px;letter-spacing:1px;padding:8px 18px;border-radius:8px;border:1px solid var(--grigio-chiaro);cursor:pointer';
  }else{
    sqDiv.style.display='none';svDiv.style.display='block';
    btnSv.style.cssText='background:var(--verde);color:var(--nero);font-family:\'Bebas Neue\',sans-serif;font-size:14px;letter-spacing:1px;padding:8px 18px;border-radius:8px;border:none;cursor:pointer';
    btnSq.style.cssText='background:var(--grigio-medio);color:var(--testo);font-family:\'Bebas Neue\',sans-serif;font-size:14px;letter-spacing:1px;padding:8px 18px;border-radius:8px;border:1px solid var(--grigio-chiaro);cursor:pointer';
    if(!svincolatiCaricati) caricaSvincolati();
  }
}
