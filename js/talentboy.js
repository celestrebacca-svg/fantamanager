// ===== TALENT BOY UNDER 23 =====
// Pagina indipendente dal sistema Competizioni: torneo Under 23 con
// formazione dedicata (titolari + panchina fino a 10), calendario sorteggiato
// e classifica calcolata in automatico dai risultati inseriti.

let talentboyCalendario=[];
let talentboySquadraVista=null; // squadra di cui si sta vedendo/modificando la formazione

async function caricaTalentboyCalendario(){
  try{
    const{data,error}=await sb.from('talentboy_calendario').select('*').eq('stagione',STAGIONE_CORRENTE).order('giornata');
    if(error) throw error;
    talentboyCalendario=data||[];
  }catch(e){ console.warn('Calendario Talent Boy non caricato:',e.message); talentboyCalendario=[]; }
}

async function renderTalentBoy(){
  const cont=document.getElementById('talentboy-content');
  if(!cont) return;
  cont.innerHTML='<div class="loading"><div class="loading-spinner"></div></div>';
  await caricaTalentboyCalendario();
  if(!talentboySquadraVista) talentboySquadraVista=(utenteLoggato&&utenteLoggato.id)||squadreDB[0]?.id||null;

  const trofeoUrl=(typeof IMMAGINI_TROFEI!=='undefined')?IMMAGINI_TROFEI['talent_boy']:null;

  cont.innerHTML=`
    <!-- BANNER TROFEO -->
    <div style="text-align:center;padding:24px 16px;background:linear-gradient(135deg,#1a0a2a,#2a1a3a);border:1px solid rgba(180,100,255,0.3);border-radius:14px;margin-bottom:20px">
      ${trofeoUrl?`<img src="${trofeoUrl}" style="max-width:140px;max-height:140px;object-fit:contain;margin:0 auto 10px;display:block;filter:drop-shadow(0 0 14px rgba(180,100,255,0.5))">`:`<div style="font-size:52px;margin-bottom:8px">🏆</div>`}
      <div style="font-family:'Bebas Neue',sans-serif;font-size:30px;letter-spacing:2px;color:#c896ff">TALENT BOY</div>
      <div style="font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:3px;color:var(--testo-dim);margin-top:-4px">UNDER 23</div>
      <div style="font-size:11px;color:var(--testo-dim);margin-top:8px">Stagione ${STAGIONE_CORRENTE}</div>
    </div>

    <!-- FORMAZIONE -->
    <div style="margin-bottom:20px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:20px;color:var(--verde);letter-spacing:1px">⚽ FORMAZIONE DA SCHIERARE</div>
        <select id="talentboy-sq-select" onchange="cambiaSquadraVistaTalentboy(this.value)" style="background:var(--grigio-scuro);color:var(--testo);border:1px solid var(--grigio-chiaro);border-radius:6px;padding:6px 10px;font-size:12px">
          ${squadreDB.map(s=>`<option value="${s.id}" ${s.id===talentboySquadraVista?'selected':''}>${s.nome_squadra||s.nome}</option>`).join('')}
        </select>
      </div>
      <div id="talentboy-edit-btn-wrap" style="margin-bottom:10px"></div>
      <div id="talentboy-formazione-content"></div>
    </div>

    <!-- CLASSIFICA -->
    <div style="margin-bottom:20px">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:20px;color:var(--oro);letter-spacing:1px;margin-bottom:12px">📊 CLASSIFICA</div>
      <div id="talentboy-classifica"></div>
    </div>

    <!-- CALENDARIO -->
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:20px;color:var(--blu);letter-spacing:1px">📅 CALENDARIO</div>
        ${adminLoggato?`<button onclick="sorteggiaCalendarioTalentboy()" style="background:rgba(77,159,255,0.12);border:1px solid rgba(77,159,255,0.4);color:var(--blu);font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:1px;padding:7px 14px;border-radius:8px;cursor:pointer">🎲 ${talentboyCalendario.length?'RI-SORTEGGIA':'SORTEGGIA CALENDARIO'}</button>`:''}
      </div>
      <div id="talentboy-calendario"></div>
    </div>
  `;

  renderFormazioneU23(talentboySquadraVista,false,'talentboy-formazione-content');
  const puoModificare=(utenteLoggato&&utenteLoggato.id===talentboySquadraVista)||adminLoggato;
  document.getElementById('talentboy-edit-btn-wrap').innerHTML=puoModificare?`<button onclick="attivaEditFormazioneU23()" style="background:rgba(0,255,135,0.1);border:1px solid rgba(0,255,135,0.3);color:var(--verde);font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;padding:7px 14px;border-radius:8px;cursor:pointer">✏️ MODIFICA FORMAZIONE</button>`:'';

  renderClassificaTalentboy();
  renderCalendarioTalentboy();
}

function cambiaSquadraVistaTalentboy(sqId){
  talentboySquadraVista=sqId;
  renderFormazioneU23(sqId,false,'talentboy-formazione-content');
  const puoModificare=(utenteLoggato&&utenteLoggato.id===sqId)||adminLoggato;
  document.getElementById('talentboy-edit-btn-wrap').innerHTML=puoModificare?`<button onclick="attivaEditFormazioneU23()" style="background:rgba(0,255,135,0.1);border:1px solid rgba(0,255,135,0.3);color:var(--verde);font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;padding:7px 14px;border-radius:8px;cursor:pointer">✏️ MODIFICA FORMAZIONE</button>`:'';
}

// ===== CLASSIFICA (calcolata dal vivo dai risultati) =====
function renderClassificaTalentboy(){
  const cont=document.getElementById('talentboy-classifica');
  if(!cont) return;
  const stats={};
  squadreDB.forEach(s=>{stats[s.id]={squadra:s,pt:0,g:0,v:0,n:0,p:0,gf:0,gs:0};});
  talentboyCalendario.filter(m=>m.giocata).forEach(m=>{
    const casa=stats[m.squadra_casa_id],osp=stats[m.squadra_ospite_id];
    if(!casa||!osp) return;
    casa.g++;osp.g++;
    casa.gf+=m.punti_casa;casa.gs+=m.punti_ospite;
    osp.gf+=m.punti_ospite;osp.gs+=m.punti_casa;
    if(m.punti_casa>m.punti_ospite){casa.v++;casa.pt+=3;osp.p++;}
    else if(m.punti_casa<m.punti_ospite){osp.v++;osp.pt+=3;casa.p++;}
    else{casa.n++;osp.n++;casa.pt++;osp.pt++;}
  });
  const classifica=Object.values(stats).sort((a,b)=>b.pt-a.pt||(b.gf-b.gs)-(a.gf-a.gs)||b.gf-a.gf);

  if(!talentboyCalendario.length){
    cont.innerHTML='<div style="text-align:center;padding:20px;color:var(--testo-dim);font-size:12px">Nessun calendario ancora sorteggiato</div>';
    return;
  }

  cont.innerHTML=`<div style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:10px;overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:11px">
      <thead><tr style="background:var(--grigio-scuro);text-align:center">
        <th style="padding:8px 6px;text-align:left">Squadra</th>
        <th style="padding:8px 4px">PT</th><th style="padding:8px 4px">G</th>
        <th style="padding:8px 4px">V</th><th style="padding:8px 4px">N</th><th style="padding:8px 4px">P</th>
        <th style="padding:8px 4px">GF</th><th style="padding:8px 4px">GS</th><th style="padding:8px 4px">DR</th>
      </tr></thead>
      <tbody>
        ${classifica.map((r,i)=>`<tr style="border-top:1px solid var(--grigio-chiaro);text-align:center;${i<3?'background:rgba(0,255,135,0.04)':''}">
          <td style="padding:6px;text-align:left;font-weight:600">${i+1}. ${r.squadra.nome_squadra||r.squadra.nome}</td>
          <td style="font-weight:700;color:var(--oro)">${r.pt}</td><td>${r.g}</td>
          <td>${r.v}</td><td>${r.n}</td><td>${r.p}</td>
          <td>${r.gf}</td><td>${r.gs}</td><td>${r.gf-r.gs>0?'+':''}${r.gf-r.gs}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

// ===== CALENDARIO =====
function renderCalendarioTalentboy(){
  const cont=document.getElementById('talentboy-calendario');
  if(!cont) return;
  if(!talentboyCalendario.length){
    cont.innerHTML='<div style="text-align:center;padding:24px;color:var(--testo-dim);font-size:12px">Nessun calendario ancora sorteggiato'+(adminLoggato?' — usa il bottone qui sopra':'')+'</div>';
    return;
  }
  const giornate=[...new Set(talentboyCalendario.map(m=>m.giornata))].sort((a,b)=>a-b);
  cont.innerHTML=giornate.map(g=>{
    const partite=talentboyCalendario.filter(m=>m.giornata===g);
    return `<div style="margin-bottom:12px">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:12px;color:var(--testo-dim);letter-spacing:1px;margin-bottom:6px">GIORNATA ${g}</div>
      ${partite.map(m=>{
        const casa=squadreDB.find(s=>s.id===m.squadra_casa_id);
        const osp=squadreDB.find(s=>s.id===m.squadra_ospite_id);
        return `<div style="display:flex;align-items:center;gap:8px;background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:8px;padding:8px 12px;margin-bottom:6px;font-size:12px">
          <div style="flex:1;text-align:right">${casa?.nome_squadra||casa?.nome||'—'}</div>
          ${adminLoggato?`
          <input type="number" min="0" id="tb-pc-${m.id}" value="${m.punti_casa??''}" style="width:32px;text-align:center;background:var(--grigio-scuro);color:var(--testo);border:1px solid var(--grigio-chiaro);border-radius:4px;padding:3px">
          <span style="color:var(--testo-dim)">-</span>
          <input type="number" min="0" id="tb-po-${m.id}" value="${m.punti_ospite??''}" style="width:32px;text-align:center;background:var(--grigio-scuro);color:var(--testo);border:1px solid var(--grigio-chiaro);border-radius:4px;padding:3px">
          `:`<div style="font-weight:700;min-width:44px;text-align:center">${m.giocata?m.punti_casa+' - '+m.punti_ospite:'vs'}</div>`}
          <div style="flex:1">${osp?.nome_squadra||osp?.nome||'—'}</div>
          ${adminLoggato?`<button onclick="salvaRisultatoTalentboy(${m.id})" style="background:rgba(0,255,135,0.1);border:1px solid rgba(0,255,135,0.3);color:var(--verde);font-size:10px;padding:4px 8px;border-radius:5px;cursor:pointer;flex-shrink:0">💾</button>`:''}
        </div>`;
      }).join('')}
    </div>`;
  }).join('');
}

async function salvaRisultatoTalentboy(matchId){
  const pc=document.getElementById(`tb-pc-${matchId}`).value;
  const po=document.getElementById(`tb-po-${matchId}`).value;
  if(pc===''||po===''){showToast('❌ Inserisci entrambi i punteggi','error');return;}
  try{
    const{error}=await sb.from('talentboy_calendario').update({punti_casa:parseInt(pc),punti_ospite:parseInt(po),giocata:true}).eq('id',matchId);
    if(error) throw error;
    const m=talentboyCalendario.find(x=>x.id===matchId);
    if(m){m.punti_casa=parseInt(pc);m.punti_ospite=parseInt(po);m.giocata=true;}
    showToast('✅ Risultato salvato!');
    renderClassificaTalentboy();
    renderCalendarioTalentboy();
  }catch(e){showToast('❌ '+e.message,'error');}
}

// Sorteggio calendario: esattamente 38 giornate fisse (come la Serie A),
// indipendentemente dal numero di squadre — se il girone completo (andata e
// ritorno) è più corto di 38 giornate, il calendario continua a ruotare oltre,
// niente stop anticipato.
async function sorteggiaCalendarioTalentboy(){
  if(!adminLoggato) return;
  if(talentboyCalendario.length&&!confirm('Esiste già un calendario per questa stagione: sorteggiarne uno nuovo lo sostituisce (i risultati già inseriti andranno persi). Confermi?')) return;
  if(!confirm(`Sorteggiare il calendario Talent Boy Under 23 per la stagione ${STAGIONE_CORRENTE}? Saranno generate 38 giornate, come la Serie A.`)) return;

  const GIORNATE_TOTALI=38;
  let squadre=squadreDB.map(s=>s.id);
  if(squadre.length%2!==0) squadre.push(null); // squadra fittizia "riposo" se numero dispari
  const n=squadre.length;
  const partite=[];
  let arr=[...squadre];

  for(let round=0; round<GIORNATE_TOTALI; round++){
    for(let i=0;i<n/2;i++){
      const casa=arr[i], osp=arr[n-1-i];
      if(casa!==null&&osp!==null){
        if(round%2===0) partite.push({giornata:round+1,squadra_casa_id:casa,squadra_ospite_id:osp});
        else partite.push({giornata:round+1,squadra_casa_id:osp,squadra_ospite_id:casa});
      }
    }
    arr.splice(1,0,arr.pop()); // ruota tutti tranne il primo (metodo del cerchio), continua oltre il ciclo naturale
  }

  const tutte=partite.map(p=>({...p,stagione:STAGIONE_CORRENTE,giocata:false,punti_casa:null,punti_ospite:null}));

  try{
    await sb.from('talentboy_calendario').delete().eq('stagione',STAGIONE_CORRENTE);
    const{error}=await sb.from('talentboy_calendario').insert(tutte);
    if(error) throw error;
    showToast(`✅ Calendario sorteggiato! ${tutte.length} partite su ${GIORNATE_TOTALI} giornate`);
    renderTalentBoy();
  }catch(e){showToast('❌ '+e.message,'error');}
}
