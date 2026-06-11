// ===== DIREZIONE IMPORTO =====
function setDirezioneImporto(dir){
  const el=document.getElementById('trat-direzione-importo');
  if(el) el.value=dir;
  const btnPago=document.getElementById('btn-pago');
  const btnRicevo=document.getElementById('btn-ricevo');
  if(!btnPago||!btnRicevo) return;
  if(dir==='pago'){
    btnPago.style.borderColor='var(--rosso)';btnPago.style.background='rgba(255,68,68,0.15)';btnPago.style.color='var(--rosso)';
    btnRicevo.style.borderColor='var(--grigio-chiaro)';btnRicevo.style.background='transparent';btnRicevo.style.color='var(--testo-dim)';
  } else {
    btnRicevo.style.borderColor='var(--verde)';btnRicevo.style.background='rgba(0,255,135,0.15)';btnRicevo.style.color='var(--verde)';
    btnPago.style.borderColor='var(--grigio-chiaro)';btnPago.style.background='transparent';btnPago.style.color='var(--testo-dim)';
  }
}

// ===== BONUS =====
let bonusList=[];
const TIPI_BONUS=['gol','assist','presenze','media_voto','classifica'];
const LABEL_BONUS={gol:'⚽ Gol',assist:'🎯 Assist',presenze:'👟 Presenze',media_voto:'⭐ Media Voto',classifica:'🏆 Posizione in classifica'};

function toggleBonus(){
  const checked=document.getElementById('trat-usa-bonus').checked;
  document.getElementById('campo-bonus').style.display=checked?'block':'none';
  if(checked&&bonusList.length===0) aggiungiBonus();
}

function aggiungiBonus(){
  if(bonusList.length>=5){showToast('Max 5 bonus','error');return;}
  bonusList.push({tipo:'gol',soglia:'',importo:''});
  renderBonusLista();
}

function renderBonusLista(){
  document.getElementById('bonus-lista').innerHTML=bonusList.map((b,i)=>`
    <div style="background:var(--grigio-scuro);border-radius:8px;padding:10px;margin-bottom:8px;border-left:3px solid var(--verde)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:11px;font-weight:700;color:var(--verde)">BONUS ${i+1}</span>
        <button onclick="bonusList.splice(${i},1);renderBonusLista()" style="background:rgba(255,68,68,0.15);border:none;color:var(--rosso);border-radius:4px;padding:3px 8px;cursor:pointer;font-size:11px">✕ Rimuovi</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:6px">
        <div>
          <div style="font-size:10px;color:var(--testo-dim);margin-bottom:4px">OBIETTIVO</div>
          <select onchange="bonusList[${i}].tipo=this.value" style="width:100%;background:var(--grigio-medio);border:1px solid var(--grigio-chiaro);border-radius:6px;padding:7px 8px;color:var(--testo);font-size:13px;outline:none">
            ${TIPI_BONUS.map(t=>`<option value="${t}" ${b.tipo===t?'selected':''}>${LABEL_BONUS[t]}</option>`).join('')}
          </select>
        </div>
        <div>
          <div style="font-size:10px;color:var(--testo-dim);margin-bottom:4px">${b.tipo==='classifica'?'ENTRO POSIZIONE N.':'SOGLIA MINIMA'}</div>
          <input class="form-input" type="number" value="${b.soglia}" oninput="bonusList[${i}].soglia=this.value" placeholder="${b.tipo==='media_voto'?'Es. 6.5':b.tipo==='classifica'?'Es. 4':'Es. 10'}" style="padding:7px 8px;font-size:13px" step="${b.tipo==='media_voto'?'0.1':'1'}" min="0">
        </div>
      </div>
      <div>
        <div style="font-size:10px;color:var(--testo-dim);margin-bottom:4px">IMPORTO BONUS (FM)</div>
        <input class="form-input" type="number" value="${b.importo}" oninput="bonusList[${i}].importo=this.value" placeholder="Es. 2500000" step="100000" style="padding:7px 8px;font-size:13px">
      </div>
    </div>`).join('');
}

// Aggiorna placeholder bonus quando cambia tipo
document.addEventListener('change',function(e){
  if(e.target.tagName==='SELECT'&&e.target.closest('#bonus-lista')){
    renderBonusLista();
  }
});

function apriNuovaTrattativa(giocatore=null){
  if(!utenteLoggato){showToast('❌ Devi essere loggato','error');return;}
  trattativaGiocatoreTarget=giocatore;
  rateList=[];
  giocatoriCambioSelezionati=[];
  giocatoriSuoiSelezionati=[];
  bonusList=[];

  // Info giocatore target
  const info=document.getElementById('trattativa-giocatore-info');
  if(giocatore){
    info.style.display='flex';
    document.getElementById('trat-avatar').innerHTML=giocatore.foto_url?`<img src="${giocatore.foto_url}" style="width:32px;height:32px;object-fit:cover;border-radius:50%">`:iniziali(giocatore.nome);
    document.getElementById('trat-nome').textContent=giocatore.nome;
    const sqG=squadreDB.find(s=>s.id===giocatore.squadra_id);
    document.getElementById('trat-squadra').textContent=(sqG?sqG.nome:'—')+' • '+ruoloNome(giocatore.ruolo);
  }else{
    info.style.display='none';
  }

  // Reset
  document.getElementById('trat-tipo').value='Titolo Definitivo';
  document.getElementById('trat-importo').value='';
  setDirezioneImporto('pago');
  document.getElementById('trat-note').value='';
  document.getElementById('trat-rivendita').value='';
  document.getElementById('trat-conguaglio').value='';
  document.getElementById('rate-lista').innerHTML='';
  document.getElementById('trat-usa-rate').checked=false;
  document.getElementById('campo-rate-inline').style.display='none';
  document.getElementById('trat-usa-bonus').checked=false;
  document.getElementById('campo-bonus').style.display='none';
  aggiornaCampiTrattativa();
  renderGiocatoriCambio();
  document.getElementById('modal-trattativa').classList.add('open');
}

let giocatoriCambioSelezionati=[];
let giocatoriSuoiSelezionati=[];

function renderGiocatoriCambio(){
  if(!utenteLoggato||!trattativaGiocatoreTarget) return;
  const sqAvversaria=trattativaGiocatoreTarget.squadra_id;

  // I MIEI
  const miei=giocatoriDB.filter(g=>g.squadra_id===utenteLoggato.id);
  document.getElementById('trat-miei-lista').innerHTML=miei.map(g=>`
    <div onclick="toggleMio(${g.id})" style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-bottom:1px solid var(--grigio-chiaro);cursor:pointer;background:${giocatoriCambioSelezionati.includes(g.id)?'rgba(0,255,135,0.08)':''}">
      <div style="width:14px;height:14px;border-radius:3px;border:2px solid ${giocatoriCambioSelezionati.includes(g.id)?'var(--verde)':'var(--grigio-chiaro)'};background:${giocatoriCambioSelezionati.includes(g.id)?'var(--verde)':'transparent'};flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:9px">${giocatoriCambioSelezionati.includes(g.id)?'✓':''}</div>
      <div style="width:24px;height:24px;border-radius:50%;background:var(--grigio-chiaro);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0;overflow:hidden">${g.foto_url?`<img src="${g.foto_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`:iniziali(g.nome)}</div>
      <div style="flex:1;min-width:0"><div style="font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${g.nome}</div><div style="font-size:9px;color:var(--testo-dim)">${g.ruolo}</div></div>
    </div>`).join('');
  document.getElementById('miei-count').textContent=giocatoriCambioSelezionati.length;

  // SUOI
  const suoi=giocatoriDB.filter(g=>g.squadra_id===sqAvversaria);
  document.getElementById('trat-suoi-lista').innerHTML=suoi.map(g=>`
    <div onclick="toggleSuo(${g.id})" style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-bottom:1px solid var(--grigio-chiaro);cursor:pointer;background:${giocatoriSuoiSelezionati.includes(g.id)?'rgba(68,136,255,0.08)':''}">
      <div style="width:14px;height:14px;border-radius:3px;border:2px solid ${giocatoriSuoiSelezionati.includes(g.id)?'var(--blu)':'var(--grigio-chiaro)'};background:${giocatoriSuoiSelezionati.includes(g.id)?'var(--blu)':'transparent'};flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--nero)">${giocatoriSuoiSelezionati.includes(g.id)?'✓':''}</div>
      <div style="width:24px;height:24px;border-radius:50%;background:var(--grigio-chiaro);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0;overflow:hidden">${g.foto_url?`<img src="${g.foto_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`:iniziali(g.nome)}</div>
      <div style="flex:1;min-width:0"><div style="font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${g.nome}</div><div style="font-size:9px;color:var(--testo-dim)">${g.ruolo}</div></div>
    </div>`).join('');
  document.getElementById('suoi-count').textContent=giocatoriSuoiSelezionati.length;
}

function toggleMio(gId){
  const idx=giocatoriCambioSelezionati.indexOf(gId);
  if(idx>=0) giocatoriCambioSelezionati.splice(idx,1);
  else giocatoriCambioSelezionati.push(gId);
  renderGiocatoriCambio();
}

function toggleSuo(gId){
  const idx=giocatoriSuoiSelezionati.indexOf(gId);
  if(idx>=0) giocatoriSuoiSelezionati.splice(idx,1);
  else giocatoriSuoiSelezionati.push(gId);
  renderGiocatoriCambio();
}

function aggiornaCampiTrattativa(){
  const tipo=document.getElementById('trat-tipo').value;
  const isPresto=tipo.includes('Prestito');
  const hasRiscatto=tipo.includes('Diritto di Riscatto');
  const hasObbligo=tipo.includes('Obbligo di Riscatto');
  const hasCondizioni=tipo.includes('diventa Obbligo');
  const isScambio=tipo.includes('Scambio');
  const isRecompra=tipo.includes('Clausola');

  document.getElementById('campo-importo').style.display=(!isScambio&&!isPresto)?'block':'none';
  const elImpPrestito=document.getElementById('campo-importo-prestito'); if(elImpPrestito) elImpPrestito.style.display=isPresto?'block':'none';
  document.getElementById('campo-scambio').style.display=isScambio?'block':'none';
  document.getElementById('campo-prestito-trat').style.display=isPresto?'block':'none';
  document.getElementById('campo-riscatto-trat').style.display=(hasRiscatto||hasObbligo)?'block':'none';
  document.getElementById('campo-condizioni-obbligo').style.display=hasCondizioni?'block':'none';
  document.getElementById('campo-recompra').style.display=isRecompra?'block':'none';
}

function toggleRate(){
  const checked=document.getElementById('trat-usa-rate').checked;
  document.getElementById('campo-rate-inline').style.display=checked?'block':'none';
}

function aggiungiRata(){
  rateList.push({importo:'',data:''});
  renderRateLista();
}

function renderRateLista(){
  document.getElementById('rate-lista').innerHTML=rateList.map((r,i)=>`
    <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center">
      <span style="font-size:11px;color:var(--testo-dim);width:50px;flex-shrink:0">Rata ${i+1}</span>
      <input class="form-input" type="number" value="${r.importo}" oninput="rateList[${i}].importo=this.value" placeholder="FM" style="flex:1;padding:8px;font-size:13px" step="100000">
      <input class="form-input" type="date" value="${r.data}" oninput="rateList[${i}].data=this.value" style="flex:1;padding:8px;font-size:13px">
      <button onclick="rateList.splice(${i},1);renderRateLista()" style="background:rgba(255,68,68,0.15);border:none;color:var(--rosso);border-radius:6px;padding:8px 10px;cursor:pointer;flex-shrink:0">✕</button>
    </div>`).join('');
}

async function inviaTrattativa(){
  if(!utenteLoggato){showToast('❌ Devi essere loggato','error');return;}
  if(!trattativaGiocatoreTarget){showToast('❌ Seleziona un giocatore','error');return;}

  const tipo=document.getElementById('trat-tipo').value;
  const sqRicevente=squadreDB.find(s=>s.id===trattativaGiocatoreTarget.squadra_id);
  if(!sqRicevente){showToast('❌ Squadra non trovata','error');return;}

  const usaRate=document.getElementById('trat-usa-rate').checked;
  const usaBonus=document.getElementById('trat-usa-bonus').checked;
  const hasCondizioni=tipo.includes('diventa Obbligo');

  // Bonus performance
  const bonusValidi=usaBonus?bonusList.filter(b=>b.soglia&&b.importo&&parseFloat(b.importo)>0):[];
  const bonusNote=bonusValidi.map(b=>`${LABEL_BONUS[b.tipo]||b.tipo}≥${b.soglia}→+${new Intl.NumberFormat('it-IT').format(parseFloat(b.importo))}FM`).join(' | ');

  // Costruisci condizioni obbligo
  let condizioniObbligo=null;
  if(hasCondizioni){
    condizioniObbligo={
      presenze:parseInt(document.getElementById('cond-presenze').value)||0,
      gol:parseInt(document.getElementById('cond-gol').value)||0,
      assist:parseInt(document.getElementById('cond-assist').value)||0,
      classifica:parseInt(document.getElementById('cond-classifica').value)||0,
    };
  }

  // Giocatori scambio: miei + suoi
  const giocatoriMiei=tipo.includes('Scambio')?giocatoriCambioSelezionati:[];
  const giocatoriSuoi=tipo.includes('Scambio')?giocatoriSuoiSelezionati:[];
  const nomiMiei=giocatoriMiei.map(id=>giocatoriDB.find(g=>g.id===id)?.nome||'').filter(Boolean);
  const nomiSuoi=giocatoriSuoi.map(id=>giocatoriDB.find(g=>g.id===id)?.nome||'').filter(Boolean);
  // Per backward compat mantieni anche giocatoriScambio (tutti i giocatori coinvolti)
  const giocatoriScambio=[...giocatoriMiei,...giocatoriSuoi];
  const nomiScambio=[...nomiMiei.map(n=>'→'+n),...nomiSuoi.map(n=>'←'+n)];

  const dati={
    squadra_offerente_id:utenteLoggato.id,
    squadra_ricevente_id:sqRicevente.id,
    tipo,
    giocatore_id:trattativaGiocatoreTarget.id,
    giocatori_ids:[trattativaGiocatoreTarget.id],
    stato:'in_attesa',
    note:document.getElementById('trat-note').value||null,
    percentuale_rivendita:parseFloat(document.getElementById('trat-rivendita').value)||null,
    giocatori_cambio_ids:giocatoriScambio,
    condizioni_obbligo:condizioniObbligo,
    rate:usaRate?rateList.filter(r=>r.importo&&r.data):[],
    bonus_performance:bonusValidi.length>0?bonusValidi:null,
  };

  if(!tipo.includes('Scambio')&&!tipo.includes('Prestito')){
    dati.importo=parseFloat(document.getElementById('trat-importo').value)||0;
    const dir=document.getElementById('trat-direzione-importo')?.value||'pago';
    dati.direzione_importo=dir;
    // Se ricevo i soldi, inverti la direzione nel DB
    if(dir==='ricevo'){
      const tmp=dati.squadra_offerente_id;
      dati.squadra_offerente_id=dati.squadra_ricevente_id;
      dati.squadra_ricevente_id=tmp;
    }
  }
  if(tipo.includes('Clausola Recompra')){
    dati.importo_recompra=parseFloat(document.getElementById('trat-importo-recompra').value)||null;
    dati.scadenza_recompra=document.getElementById('trat-scadenza-recompra').value||null;
  }
  if(tipo.includes('Scambio')){
    dati.importo=parseFloat(document.getElementById('trat-conguaglio').value)||0;
    dati.giocatori_cambio_ids=giocatoriMiei; // miei che offro
    dati.giocatori_ids_richiesti=giocatoriSuoi; // suoi che voglio
    if(!giocatoriMiei.length&&!giocatoriSuoi.length){showToast('❌ Seleziona almeno un giocatore per parte','error');return;}
  }
  if(usaRate){
    dati.importo=parseFloat(document.getElementById('trat-importo-totale').value)||0;
  }
  if(tipo.includes('Prestito')){
    dati.importo=parseFloat(document.getElementById('trat-cifra-prestito')?.value)||0;
    dati.scadenza_prestito=document.getElementById('trat-scadenza-prestito').value||null;
  }
  if(tipo.includes('Diritto di Riscatto')||tipo.includes('Obbligo di Riscatto')){
    dati.importo_riscatto=parseFloat(document.getElementById('trat-importo-riscatto').value)||null;
    dati.scadenza_riscatto=document.getElementById('trat-scadenza-riscatto').value||null;
  }
  if(hasCondizioni){
    dati.importo_riscatto=parseFloat(document.getElementById('trat-importo-riscatto-cond').value)||null;
    dati.scadenza_riscatto=document.getElementById('trat-scadenza-riscatto-cond').value||null;
  }

  // Costruisci nota automatica per condizioni
  if(condizioniObbligo){
    const conds=[];
    if(condizioniObbligo.presenze) conds.push(`${condizioniObbligo.presenze} presenze`);
    if(condizioniObbligo.gol) conds.push(`${condizioniObbligo.gol} gol`);
    if(condizioniObbligo.assist) conds.push(`${condizioniObbligo.assist} assist`);
    if(condizioniObbligo.classifica) conds.push(`top ${condizioniObbligo.classifica} in campionato`);
    if(conds.length) dati.note=(dati.note?dati.note+' | ':'')+'⚡ Obbligo scatta se: '+conds.join(' OPPURE ');
  }
  if(nomiScambio.length) dati.note=(dati.note?dati.note+' | ':'')+'🔄 Cambio: '+nomiScambio.join(', ');
  if(bonusNote) dati.note=(dati.note?dati.note+' | ':'')+'🎯 Bonus: '+bonusNote;

  const btn=document.getElementById('btn-invia-trattativa');
  btn.disabled=true;btn.textContent='Invio...';
  try{
    const{data,error}=await sb.from('trattative').insert(dati).select();
    if(error) throw error;
    trattativeDB.unshift(data[0]);
    showToast('📤 Proposta inviata!');
    document.getElementById('modal-trattativa').classList.remove('open');
    renderTrattative();
  }catch(e){showToast('❌ Errore: '+e.message,'error');}
  finally{btn.disabled=false;btn.textContent='📤 INVIA PROPOSTA';}
}

function apriApprovazione(){
  showSection('mercato',null);
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  filtraTrattative('in_attesa',document.querySelector('.mercato-tab:nth-child(2)'));
}
