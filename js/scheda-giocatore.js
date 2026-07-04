// ===== SCHEDA GIOCATORE =====
let giocatoreModificaDaScheda=null;
function apriModificaDaScheda(){
  if(!giocatoreSchedaAttiva) return;
  document.getElementById('modal-giocatore').classList.remove('open');
  apriModificaGiocatore();
  setTimeout(()=>selezionaGiocatoreAdmin(giocatoreSchedaAttiva.id),150);
}

function apriTrattativaDaScheda(){
  if(!giocatoreSchedaAttiva) return;
  document.getElementById('modal-giocatore').classList.remove('open');
  apriNuovaTrattativa(giocatoreSchedaAttiva);
}

function apriGiocatoreConTrattativa(gId){
  apriGiocatore(gId).then(()=>{
    const btn=document.getElementById('mg-trattativa-btn');
    if(btn) btn.style.display='block';
  });
}

async function apriGiocatore(gId){
  // Carica SEMPRE i dati freschi dal DB
  const{data:gFresh,error}=await sb.from('giocatori').select('*').eq('id',gId).single();
  const g=gFresh||(giocatoriDB.find(x=>String(x.id)===String(gId)));
  if(!g) return;
  // Aggiorna cache locale
  if(gFresh){
    const idx=giocatoriDB.findIndex(x=>String(x.id)===String(gId));
    if(idx>=0) giocatoriDB[idx]={...giocatoriDB[idx],...gFresh};
  }
  giocatoreSchedaAttiva=g;
  const sq=squadreDB.find(s=>s.id===g.squadra_id);
  document.getElementById('mg-title').textContent=g.nome.toUpperCase();
  // Bottone modifica: visibile SOLO se admin
  const editBtn=document.getElementById('mg-edit-btn');
  if(editBtn) editBtn.style.display=adminLoggato?'block':'none';
  const coloreC={'Titolo Definitivo':'var(--verde)','Titolo Definitivo con Clausola Recompra':'var(--argento)','Prestito Secco':'var(--blu)','Prestito con Diritto di Riscatto':'var(--oro)','Prestito con Obbligo di Riscatto':'var(--rosso)'}[g.contratto]||'var(--verde)';
  document.getElementById('mg-body').innerHTML=`
    <div class="player-hero">
      <div class="player-photo">${g.foto_url?`<img src="${g.foto_url}">`:iniziali(g.nome)}</div>
      <div>
        <div class="player-nome">${g.nome}</div>
        <div class="player-tags">
          <span class="g-ruolo ${ruoloColor(g.ruolo)}" style="font-size:12px;padding:3px 8px">${ruoloNome(g.ruolo)}</span>
          ${g.badge==='C'?'<span class="g-badge badge-c">CAPITANO</span>':''}
          ${g.badge==='V'?'<span class="g-badge badge-v">VICE CAP.</span>':''}
          ${g.badge==='P'?'<span class="g-badge badge-p">IN PRESTITO</span>':''}
          ${g.promosso?'<span class="g-badge badge-prom">PROMOSSO</span>':''}
        </div>
        <div style="font-family:'Space Mono',monospace;font-size:11px;color:var(--testo-dim)">Maglia #<span style="color:var(--verde);font-weight:700;font-size:14px">${g.maglia||'—'}</span></div>
      </div>
    </div>
    <div class="player-section">
      <div class="player-section-title">📋 Anagrafica</div>
      <div class="player-grid">
        <div class="player-info-item"><div class="pii-label">Età</div><div class="pii-val">${g.eta?g.eta+' anni':'—'}</div></div>
        <div class="player-info-item"><div class="pii-label">Data Nascita</div><div class="pii-val" style="font-size:11px">${g.data_nascita||'—'}</div></div>
        <div class="player-info-item"><div class="pii-label">Squadra Fantasy</div><div class="pii-val" style="font-size:11px">${sq?sq.nome:'—'}</div></div>
        <div class="player-info-item"><div class="pii-label">Club Attuale</div><div class="pii-val" style="font-size:11px;color:var(--blu)">${g.club_reale||'—'}</div></div>
      </div>
    </div>
    <div class="player-section">
      <div class="player-section-title">💰 Valori di Mercato</div>
      <div class="player-grid">
        <div class="player-info-item" style="border-left:3px solid var(--oro)"><div class="pii-label">Quotazione TM</div><div class="pii-val oro" style="font-size:20px;font-weight:700">${g.quotazione?g.quotazione+'M€':'—'}</div></div>
        <div class="player-info-item" style="border-left:3px solid var(--verde)"><div class="pii-label">Stipendio Netto</div><div class="pii-val verde" style="font-size:20px;font-weight:700">${g.stipendio?g.stipendio+'M€':'—'}</div></div>
      </div>
    </div>
    <div class="player-section">
      <div class="player-section-title">📄 Contratto</div>
      <div class="contratto-box" style="border-left-color:${coloreC}">
        <div class="contratto-tipo" style="color:${coloreC}">${g.contratto||'—'}</div>
        ${g.scadenza?`<div class="contratto-row"><span class="label">Scadenza</span><span class="val" style="color:var(--rosso)">${g.scadenza}</span></div>`:''}
        ${g.squadra_propr?`<div class="contratto-row"><span class="label">Proprietario</span><span class="val">${g.squadra_propr}</span></div>`:''}
        ${g.riscatto?`<div class="contratto-row"><span class="label">Riscatto</span><span class="val" style="color:var(--oro)">${fmtNum(g.riscatto)} FM</span></div>`:''}
        ${g.clausola?`<div class="contratto-row"><span class="label">Clausola recompra</span><span class="val" style="color:var(--argento)">${fmtNum(g.clausola)} FM</span></div>`:''}
        ${g.rivendita?`<div class="contratto-row"><span class="label">% Futura rivendita</span><span class="val" style="color:var(--verde)">${g.rivendita}%</span></div>`:''}
        ${(g.contratto?.includes('Diritto')||g.contratto?.includes('Obbligo'))&&g.riscatto&&utenteLoggato&&utenteLoggato.id===g.squadra_id?`
        <button onclick="esercitaRiscatto(${g.id})" style="width:100%;margin-top:12px;background:rgba(255,215,0,0.15);color:var(--oro);border:1px solid rgba(255,215,0,0.4);font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:1px;padding:10px;border-radius:8px;cursor:pointer">
          🔑 ESERCITA RISCATTO — ${fmtNum(g.riscatto)} FM
        </button>`:''}
      </div>
    </div>
    <div class="player-section" style="border-bottom:none">
      <div class="player-section-title">⚽ Statistiche</div>
      <div class="stats-row">
        <div class="stat-box"><div class="stat-box-val">${g.gol||0}</div><div class="stat-box-label">Gol</div></div>
        <div class="stat-box"><div class="stat-box-val">${g.assist||0}</div><div class="stat-box-label">Assist</div></div>
        <div class="stat-box"><div class="stat-box-val">${g.mv||'—'}</div><div class="stat-box-label">Media V.</div></div>
        <div class="stat-box"><div class="stat-box-val">${g.presenze||0}</div><div class="stat-box-label">Presenze</div></div>
      </div>
    </div>`;
  document.getElementById('modal-giocatore').classList.add('open');
}

// ===== ESERCITA RISCATTO =====
async function esercitaRiscatto(gId){
  const g=giocatoriDB.find(x=>String(x.id)===String(gId));
  if(!g||!g.riscatto) return;
  const sq=squadreDB.find(s=>s.id===g.squadra_id);
  const sqPropr=squadreDB.find(s=>String(s.id)===String(g.squadra_propr));

  if(!sq||!sqPropr){showToast('❌ Errore squadre','error');return;}
  if((sq.budget||0)<g.riscatto){
    showToast(`❌ Budget insufficiente! Servono ${fmtNum(g.riscatto)} FM, hai ${fmtNum(sq.budget)} FM`,'error');
    return;
  }

  if(!confirm(`🔑 ESERCITA RISCATTO\n\n${g.nome} diventa definitivamente tuo!\nCosto: ${fmtNum(g.riscatto)} FM\nIl pagamento andrà a: ${sqPropr.nome}\n\nConfermi?`)) return;

  try{
    // 1. Aggiorna giocatore — diventa titolo definitivo
    const upd={
      contratto:'Titolo Definitivo',
      badge: g.badge==='C'||g.badge==='V'?g.badge:null,
      squadra_propr:null,
      scadenza:null,
      riscatto:null,
      scadenza_riscatto:null,
      squadra_originale_id:null,
    };
    const{error:e1}=await sb.from('giocatori').update(upd).eq('id',g.id);
    if(e1) throw e1;

    // 2. Budget: sq paga, sqPropr incassa
    const saldoSqPrima=sq.budget||0;
    const saldoProprPrima=sqPropr.budget||0;
    const nuovoSq=saldoSqPrima-g.riscatto;
    const nuovoPropr=saldoProprPrima+g.riscatto;
    await sb.from('squadre').update({budget:nuovoSq}).eq('id',sq.id);
    await sb.from('squadre').update({budget:nuovoPropr}).eq('id',sqPropr.id);
    sq.budget=nuovoSq;
    sqPropr.budget=nuovoPropr;

    // 3. Log movimenti
    try{
      await sb.from('movimenti_budget').insert([
        {squadra_id:sq.id,importo:-g.riscatto,tipo:'uscita',descrizione:`Riscatto: ${g.nome}`,saldo_prima:saldoSqPrima,saldo_dopo:nuovoSq},
        {squadra_id:sqPropr.id,importo:g.riscatto,tipo:'entrata',descrizione:`Riscatto: ${g.nome}`,saldo_prima:saldoProprPrima,saldo_dopo:nuovoPropr}
      ]);
    }catch(e){console.warn('Log riscatto:',e.message);}

    // 4. Marca trattativa come completata
    const trat=trattativeDB.find(t=>String(t.giocatore_id)===String(g.id)&&t.stato==='approvata');
    if(trat) await sb.from('trattative').update({stato:'completata'}).eq('id',trat.id);

    // 5. Aggiorna DB locale
    const gIdx=giocatoriDB.findIndex(x=>String(x.id)===String(g.id));
    if(gIdx>=0) giocatoriDB[gIdx]={...giocatoriDB[gIdx],...upd};

    showToast(`✅ Riscatto esercitato! ${g.nome} è tuo definitivamente!`);
    document.getElementById('modal-giocatore').classList.remove('open');
    if(squadraAttiva) renderRosa(tabAttivoSq);

  }catch(e){showToast('❌ Errore: '+e.message,'error');}
}
