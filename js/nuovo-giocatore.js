// ===== NUOVO GIOCATORE =====
function apriNuovoGiocatore(){
  const sel=document.getElementById('nuovo-squadra-id');
  sel.innerHTML='<option value="">— Seleziona squadra —</option>'+
    squadreDB.map(s=>`<option value="${s.id}">${s.nome} (${s.owner_name})</option>`).join('');
  ['nuovo-nome','nuovo-maglia','nuovo-eta','nuovo-data-nascita','nuovo-club',
   'nuovo-quotazione','nuovo-stipendio','nuovo-foto','nuovo-note'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });
  document.getElementById('nuovo-ruolo').value='A';
  document.getElementById('nuovo-lista').value='principale';
  document.getElementById('nuovo-contratto').value='Titolo Definitivo';
  document.getElementById('nuovo-rosa-count').textContent='';
  document.getElementById('modal-nuovo-giocatore').classList.add('open');
}

function aggiornaNuovoCountRosa(){
  const sqId=document.getElementById('nuovo-squadra-id').value;
  const lista=document.getElementById('nuovo-lista').value;
  if(!sqId){document.getElementById('nuovo-rosa-count').textContent='';return;}
  const max={principale:25,marginale:14};
  const n=giocatoriDB.filter(g=>g.squadra_id===sqId&&g.lista===lista).length;
  const m=max[lista];
  const label=lista.charAt(0).toUpperCase()+lista.slice(1);
  const color=m&&n>=m?'var(--rosso)':'var(--verde)';
  document.getElementById('nuovo-rosa-count').innerHTML=
    `<span style="color:${color}">${label}: ${n}${m?'/'+m:''} giocatori</span>`;
}

async function salvaNuovoGiocatore(){
  const sqId=document.getElementById('nuovo-squadra-id').value;
  const nome=document.getElementById('nuovo-nome').value.trim();
  if(!sqId){showToast('❌ Seleziona una squadra','error');return;}
  if(!nome){showToast('❌ Inserisci il nome','error');return;}
  const lista=document.getElementById('nuovo-lista').value;
  const max={principale:25,marginale:14};
  const n=giocatoriDB.filter(g=>g.squadra_id===sqId&&g.lista===lista).length;
  if(max[lista]&&n>=max[lista]){showToast(`❌ Rosa ${lista} piena (max ${max[lista]})!`,'error');return;}
  const nuovoG={
    nome,squadra_id:sqId,lista,
    ruolo:document.getElementById('nuovo-ruolo').value,
    maglia:parseInt(document.getElementById('nuovo-maglia').value)||null,
    eta:parseInt(document.getElementById('nuovo-eta').value)||null,
    data_nascita:document.getElementById('nuovo-data-nascita').value||null,
    club_reale:document.getElementById('nuovo-club').value||null,
    squadra_club:document.getElementById('nuovo-club').value||null,
    quotazione:parseFloat(document.getElementById('nuovo-quotazione').value)||null,
    stipendio:parseFloat(document.getElementById('nuovo-stipendio').value)||null,
    contratto:document.getElementById('nuovo-contratto').value,
    foto_url:document.getElementById('nuovo-foto').value||null,
    gol:0,assist:0,presenze:0,promosso:false,
  };
  try{
    const{data,error}=await sb.from('giocatori').insert(nuovoG).select();
    if(error) throw error;
    giocatoriDB.push(data[0]);
    const sq=squadreDB.find(s=>s.id===sqId);
    showToast(`✅ ${nome} aggiunto alla ${lista} di ${sq?.nome||''}!`);
    document.getElementById('modal-nuovo-giocatore').classList.remove('open');
    if(squadraAttiva&&squadraAttiva.id===sqId) renderRosa(tabAttivoSq);
  }catch(e){showToast('❌ Errore: '+e.message,'error');}
}
