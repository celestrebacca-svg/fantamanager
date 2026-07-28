// ===== SVINCOLATI =====
let svincolatiDB=[],svincolatiFiltrati=[];
let svincolatiVisibili=120; // quanti mostrarne ora; sale di 120 ad ogni "Carica altri"
const SERIE_A_BASE=[
  {nome:'Lookman',ruolo:'A',club:'Atalanta'},{nome:'Retegui',ruolo:'A',club:'Atalanta'},{nome:'De Ketelaere',ruolo:'A',club:'Atalanta'},{nome:'Kolasinac',ruolo:'D',club:'Atalanta'},{nome:'Toloi',ruolo:'D',club:'Atalanta'},{nome:'Hateboer',ruolo:'D',club:'Atalanta'},{nome:'Ruggeri',ruolo:'D',club:'Atalanta'},{nome:'Samardzic',ruolo:'C',club:'Atalanta'},{nome:'Kossounou',ruolo:'D',club:'Atalanta'},{nome:'Carnesecchi',ruolo:'P',club:'Atalanta'},{nome:'Bellanova',ruolo:'D',club:'Atalanta'},
  {nome:'Orsolini',ruolo:'A',club:'Bologna'},{nome:'Ndoye',ruolo:'A',club:'Bologna'},{nome:'Dallinga',ruolo:'A',club:'Bologna'},{nome:'Odgaard',ruolo:'C',club:'Bologna'},{nome:'Freuler',ruolo:'C',club:'Bologna'},{nome:'Fabbian',ruolo:'C',club:'Bologna'},{nome:'Lucumi',ruolo:'D',club:'Bologna'},{nome:'Beukema',ruolo:'D',club:'Bologna'},{nome:'Skorupski',ruolo:'P',club:'Bologna'},
  {nome:'Luvumbo',ruolo:'A',club:'Cagliari'},{nome:'Piccoli',ruolo:'A',club:'Cagliari'},{nome:'Gaetano',ruolo:'C',club:'Cagliari'},{nome:'Prati',ruolo:'C',club:'Cagliari'},{nome:'Luperto',ruolo:'D',club:'Cagliari'},{nome:'Lapadula',ruolo:'A',club:'Cagliari'},{nome:'Scuffet',ruolo:'P',club:'Cagliari'},
  {nome:'Nico Paz',ruolo:'C',club:'Como'},{nome:'Diao',ruolo:'A',club:'Como'},{nome:'Cutrone',ruolo:'A',club:'Como'},{nome:'Goldaniga',ruolo:'D',club:'Como'},{nome:'Smolcic',ruolo:'D',club:'Como'},{nome:'Reina',ruolo:'P',club:'Como'},
  {nome:'Esposito S.',ruolo:'A',club:'Empoli'},{nome:'Solbakken',ruolo:'A',club:'Empoli'},{nome:'Anjorin',ruolo:'C',club:'Empoli'},{nome:'Maleh',ruolo:'C',club:'Empoli'},{nome:'Ismajli',ruolo:'D',club:'Empoli'},{nome:'Goglichidze',ruolo:'D',club:'Empoli'},
  {nome:'Kean',ruolo:'A',club:'Fiorentina'},{nome:'Beltran',ruolo:'A',club:'Fiorentina'},{nome:'Colpani',ruolo:'A',club:'Fiorentina'},{nome:'Adli',ruolo:'C',club:'Fiorentina'},{nome:'Bove',ruolo:'C',club:'Fiorentina'},{nome:'Cataldi',ruolo:'C',club:'Fiorentina'},{nome:'Comuzzo',ruolo:'D',club:'Fiorentina'},{nome:'De Gea',ruolo:'P',club:'Fiorentina'},
  {nome:'Vitinha',ruolo:'A',club:'Genoa'},{nome:'Pinamonti',ruolo:'A',club:'Genoa'},{nome:'Malinovskyi',ruolo:'C',club:'Genoa'},{nome:'Thorsby',ruolo:'C',club:'Genoa'},{nome:'Vasquez',ruolo:'D',club:'Genoa'},{nome:'De Winter',ruolo:'D',club:'Genoa'},
  {nome:'Lautaro Martinez',ruolo:'A',club:'Inter'},{nome:'Thuram M.',ruolo:'A',club:'Inter'},{nome:'Taremi',ruolo:'A',club:'Inter'},{nome:'Mkhitaryan',ruolo:'C',club:'Inter'},{nome:'Asllani',ruolo:'C',club:'Inter'},{nome:'Zielinski',ruolo:'C',club:'Inter'},{nome:'Bastoni',ruolo:'D',club:'Inter'},{nome:'Acerbi',ruolo:'D',club:'Inter'},{nome:'Pavard',ruolo:'D',club:'Inter'},{nome:'Darmian',ruolo:'D',club:'Inter'},{nome:'Sommer',ruolo:'P',club:'Inter'},
  {nome:'Vlahovic',ruolo:'A',club:'Juventus'},{nome:'Yildiz',ruolo:'A',club:'Juventus'},{nome:'Conceicao',ruolo:'A',club:'Juventus'},{nome:'McKennie',ruolo:'C',club:'Juventus'},{nome:'Locatelli',ruolo:'C',club:'Juventus'},{nome:'Douglas Luiz',ruolo:'C',club:'Juventus'},{nome:'Bremer',ruolo:'D',club:'Juventus'},{nome:'Gatti',ruolo:'D',club:'Juventus'},{nome:'Savona',ruolo:'D',club:'Juventus'},{nome:'Di Gregorio',ruolo:'P',club:'Juventus'},
  {nome:'Castellanos',ruolo:'A',club:'Lazio'},{nome:'Isaksen',ruolo:'A',club:'Lazio'},{nome:'Guendouzi',ruolo:'C',club:'Lazio'},{nome:'Rovella',ruolo:'C',club:'Lazio'},{nome:'Dele-Bashiru',ruolo:'C',club:'Lazio'},{nome:'Romagnoli',ruolo:'D',club:'Lazio'},{nome:'Gila',ruolo:'D',club:'Lazio'},{nome:'Marusic',ruolo:'D',club:'Lazio'},{nome:'Provedel',ruolo:'P',club:'Lazio'},
  {nome:'Krstovic',ruolo:'A',club:'Lecce'},{nome:'Banda',ruolo:'A',club:'Lecce'},{nome:'Oudin',ruolo:'C',club:'Lecce'},{nome:'Ramadani',ruolo:'C',club:'Lecce'},{nome:'Baschirotto',ruolo:'D',club:'Lecce'},{nome:'Gendrey',ruolo:'D',club:'Lecce'},{nome:'Falcone',ruolo:'P',club:'Lecce'},
  {nome:'Leao',ruolo:'A',club:'Milan'},{nome:'Morata',ruolo:'A',club:'Milan'},{nome:'Abraham',ruolo:'A',club:'Milan'},{nome:'Reijnders',ruolo:'C',club:'Milan'},{nome:'Fofana',ruolo:'C',club:'Milan'},{nome:'Theo Hernandez',ruolo:'D',club:'Milan'},{nome:'Gabbia',ruolo:'D',club:'Milan'},{nome:'Tomori',ruolo:'D',club:'Milan'},{nome:'Maignan',ruolo:'P',club:'Milan'},
  {nome:'Maldini D.',ruolo:'A',club:'Monza'},{nome:'Djuric',ruolo:'A',club:'Monza'},{nome:'Caprari',ruolo:'A',club:'Monza'},{nome:'Pessina',ruolo:'C',club:'Monza'},{nome:'Bondo',ruolo:'C',club:'Monza'},{nome:'Izzo',ruolo:'D',club:'Monza'},
  {nome:'Lukaku',ruolo:'A',club:'Napoli'},{nome:'Politano',ruolo:'A',club:'Napoli'},{nome:'Neres',ruolo:'A',club:'Napoli'},{nome:'McTominay',ruolo:'C',club:'Napoli'},{nome:'Anguissa',ruolo:'C',club:'Napoli'},{nome:'Lobotka',ruolo:'C',club:'Napoli'},{nome:'Di Lorenzo',ruolo:'D',club:'Napoli'},{nome:'Rrahmani',ruolo:'D',club:'Napoli'},{nome:'Meret',ruolo:'P',club:'Napoli'},
  {nome:'Bonny',ruolo:'A',club:'Parma'},{nome:'Man',ruolo:'A',club:'Parma'},{nome:'Mihaila',ruolo:'A',club:'Parma'},{nome:'Bernabe',ruolo:'C',club:'Parma'},{nome:'Hernani',ruolo:'C',club:'Parma'},{nome:'Delprato',ruolo:'D',club:'Parma'},{nome:'Circati',ruolo:'D',club:'Parma'},
  {nome:'Dovbyk',ruolo:'A',club:'Roma'},{nome:'Dybala',ruolo:'A',club:'Roma'},{nome:'Saelemaekers',ruolo:'A',club:'Roma'},{nome:'Pellegrini',ruolo:'C',club:'Roma'},{nome:'Cristante',ruolo:'C',club:'Roma'},{nome:'Mancini G.',ruolo:'D',club:'Roma'},{nome:'Ndicka',ruolo:'D',club:'Roma'},{nome:'Angelino',ruolo:'D',club:'Roma'},{nome:'Svilar',ruolo:'P',club:'Roma'},
  {nome:'Adams',ruolo:'A',club:'Torino'},{nome:'Sanabria',ruolo:'A',club:'Torino'},{nome:'Ilic',ruolo:'C',club:'Torino'},{nome:'Linetty',ruolo:'C',club:'Torino'},{nome:'Coco',ruolo:'D',club:'Torino'},{nome:'Vojvoda',ruolo:'D',club:'Torino'},{nome:'Milinkovic-Savic V.',ruolo:'P',club:'Torino'},
  {nome:'Lucca',ruolo:'A',club:'Udinese'},{nome:'Thauvin',ruolo:'A',club:'Udinese'},{nome:'Davis',ruolo:'A',club:'Udinese'},{nome:'Lovric',ruolo:'C',club:'Udinese'},{nome:'Payero',ruolo:'C',club:'Udinese'},{nome:'Bijol',ruolo:'D',club:'Udinese'},{nome:'Okoye',ruolo:'P',club:'Udinese'},
  {nome:'Pohjanpalo',ruolo:'A',club:'Venezia'},{nome:'Oristanio',ruolo:'A',club:'Venezia'},{nome:'Busio',ruolo:'C',club:'Venezia'},{nome:'Idzes',ruolo:'D',club:'Venezia'},{nome:'Joronen',ruolo:'P',club:'Venezia'},
  {nome:'Tengstedt',ruolo:'A',club:'Verona'},{nome:'Suslov',ruolo:'A',club:'Verona'},{nome:'Belahyane',ruolo:'C',club:'Verona'},{nome:'Serdar',ruolo:'C',club:'Verona'},{nome:'Magnani',ruolo:'D',club:'Verona'},{nome:'Dawidowicz',ruolo:'D',club:'Verona'},
];

function mapRuolo(pos){
  if(!pos) return '—';
  pos=pos.toLowerCase();
  if(pos.includes('goalkeeper')) return 'P';
  if(pos.includes('defender')) return 'D';
  if(pos.includes('midfielder')) return 'C';
  if(pos.includes('attacker')||pos.includes('forward')) return 'A';
  return '—';
}

async function caricaSvincolati(){
  svincolatiCaricati=true;
  const grid=document.getElementById('svincolati-grid');
  if(grid) grid.innerHTML='<div class="loading"><div class="loading-spinner"></div>Elaborazione...</div>';

  const nomiNelleRose=new Set(
    giocatoriDB.filter(g=>g.squadra_id&&g.lista!=='svincolato').map(g=>g.nome.toLowerCase().trim())
  );

  // Carica prima gli svincolati dal DB (lista='svincolato')
  const svincolatiNelDB=giocatoriDB.filter(g=>
    (!g.squadra_id||g.lista==='svincolato')&&g.nome
  ).map(g=>({
    nome:g.nome, ruolo:g.ruolo||'—', club:g.club_reale||null,
    eta:g.eta||null, foto:g.foto_url||null,
    quotazione:g.quotazione||null, stipendio:g.stipendio||null,
    dbId:g.id, // id nel DB, usato per rimuovere
    daDB:true,
  }));

  // Dataset base hardcoded (solo chi NON è già nelle rose E non è già nel DB)
  const nomiNelDB=new Set(svincolatiNelDB.map(p=>p.nome.toLowerCase()));
  const svincolatiBase=SERIE_A_BASE.filter(p=>{
    const nL=p.nome.toLowerCase();
    if(nomiNelDB.has(nL)) return false; // già nel DB
    return ![...nomiNelleRose].some(r=>r===nL||
      (r.split(' ')[0]===nL.split(' ')[0]&&nL.length>4));
  });

  svincolatiDB=[...svincolatiNelDB, ...svincolatiBase];

  // Prova arricchimento API (silenzioso)
  try{
    const res=await fetch('https://v3.football.api-sports.io/players?league=135&season=2024&page=1',
      {headers:{'x-rapidapi-key':RAPIDAPI_KEY,'x-rapidapi-host':'v3.football.api-sports.io'}});
    if(res.ok){
      const data=await res.json();
      if(data?.response?.length){
        const nomiBase=new Set(svincolatiDB.map(p=>p.nome.toLowerCase()));
        data.response.forEach(p=>{
          const nome=p.player?.name;
          if(!nome||nomiBase.has(nome.toLowerCase())) return;
          if([...nomiNelleRose].some(r=>r===nome.toLowerCase())) return;
          svincolatiDB.push({nome,ruolo:mapRuolo(p.statistics?.[0]?.games?.position),
            club:p.statistics?.[0]?.team?.name, eta:p.player?.age,
            foto:p.player?.photo});
        });
      }
    }
  }catch(e){}

  const squadreUniche=[...new Set(svincolatiDB.map(p=>p.club).filter(Boolean))].sort();
  const sel=document.getElementById('svincola-squadra');
  if(sel) sel.innerHTML='<option value="">Tutte le squadre</option>'+
    squadreUniche.map(s=>`<option value="${s}">${s}</option>`).join('');
  filtraSvincolati();
}

function filtraSvincolati(val){
  svincolatiVisibili=120; // ogni nuova ricerca/filtro riparte dalla prima pagina
  const search=(val||document.getElementById('svincola-search')?.value||'').toLowerCase();
  const ruolo=document.getElementById('svincola-ruolo')?.value||'';
  const squadra=document.getElementById('svincola-squadra')?.value||'';
  svincolatiFiltrati=svincolatiDB.filter(p=>{
    if(search&&!p.nome.toLowerCase().includes(search)) return false;
    if(ruolo&&p.ruolo!==ruolo) return false;
    if(squadra&&p.club!==squadra) return false;
    return true;
  });
  const stats=document.getElementById('svincolati-stats');
  const nDB=svincolatiDB.filter(p=>p.daDB).length;
  if(stats) stats.innerHTML=`
    <div style="background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:8px;padding:8px 14px;font-size:12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <span>🔓 <strong style="color:var(--verde)">${svincolatiFiltrati.length}</strong> disponibili (${nDB} nel DB)</span>
      ${adminLoggato?`<button onclick="apriRimuoviSvincolati()" style="background:rgba(255,68,68,0.1);border:1px solid rgba(255,68,68,0.3);color:var(--rosso);font-size:11px;font-weight:700;padding:4px 10px;border-radius:6px;cursor:pointer">🗑️ Rimuovi svincolati</button>`:''}
    </div>`;
  renderSvincolati();
}

function renderSvincolati(){
  const grid=document.getElementById('svincolati-grid');
  if(!grid) return;
  if(!svincolatiFiltrati.length){grid.innerHTML='<div class="empty">Nessun giocatore trovato</div>';return;}
  const vis=svincolatiFiltrati.slice(0,svincolatiVisibili);
  grid.innerHTML=vis.map(p=>{
    // Troviamo l'indice globale in svincolatiDB per riferirci
    const dbIdx=svincolatiDB.indexOf(p);
    const safeP=JSON.stringify(p).replace(/'/g,'&#39;').replace(/"/g,'&quot;');
    const bordo=p.daDB?'rgba(0,255,135,0.25)':'var(--grigio-chiaro)';
    return `<div id="svincolo-card-${dbIdx}" style="background:var(--grigio);border:1px solid ${bordo};border-radius:10px;overflow:hidden">
      <!-- INFO CARD -->
      <div style="padding:10px;display:flex;align-items:center;gap:8px;cursor:pointer" onclick='apriSchedaSvincolatoStr(this)' data-p="${safeP}">
        <div style="position:relative;width:36px;height:36px;flex-shrink:0">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--grigio-chiaro);overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700">
            ${p.foto?`<img src="${p.foto}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'">`:iniziali(p.nome)}
          </div>
          ${p.daDB?'<div style="position:absolute;bottom:-1px;right:-1px;width:10px;height:10px;border-radius:50%;background:var(--verde);border:1px solid var(--grigio)"></div>':''}
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.nome}</div>
          <div style="display:flex;gap:4px;margin-top:2px;flex-wrap:wrap">
            <span class="g-ruolo ${ruoloColor(p.ruolo)}" style="font-size:9px">${p.ruolo||'—'}</span>
            ${p.eta?`<span style="font-size:9px;color:var(--testo-dim)">${p.eta}a</span>`:''}
            ${p.quotazione?`<span style="font-size:9px;color:var(--oro)">${p.quotazione}M€</span>`:''}
            ${p.stipendio?`<span style="font-size:9px;color:var(--verde)">${p.stipendio}M€/a</span>`:''}
          </div>
          ${p.club?`<div style="font-size:10px;color:var(--blu);margin-top:1px">${p.club}</div>`:''}
        </div>
      </div>
      <!-- PANNELLO MODIFICA INLINE (nascosto) -->
      <div id="svincolo-edit-${dbIdx}" style="display:none;padding:10px;background:var(--grigio-scuro);border-top:1px solid var(--grigio-chiaro)">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px">
          <div>
            <div style="font-size:9px;color:var(--testo-dim);margin-bottom:2px">NOME</div>
            <input id="sv-nome-${dbIdx}" value="${p.nome}" style="width:100%;background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:4px;padding:4px 6px;color:var(--testo);font-size:11px;outline:none">
          </div>
          <div>
            <div style="font-size:9px;color:var(--testo-dim);margin-bottom:2px">RUOLO</div>
            <select id="sv-ruolo-${dbIdx}" style="width:100%;background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:4px;padding:4px 6px;color:var(--testo);font-size:11px;outline:none">
              <option value="P" ${p.ruolo==='P'?'selected':''}>P — Portiere</option>
              <option value="D" ${p.ruolo==='D'?'selected':''}>D — Difensore</option>
              <option value="C" ${p.ruolo==='C'?'selected':''}>C — Centrocampista</option>
              <option value="A" ${(!p.ruolo||p.ruolo==='A')?'selected':''}>A — Attaccante</option>
            </select>
          </div>
          <div>
            <div style="font-size:9px;color:var(--testo-dim);margin-bottom:2px">CLUB</div>
            <input id="sv-club-${dbIdx}" value="${p.club||''}" placeholder="Es. Inter" style="width:100%;background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:4px;padding:4px 6px;color:var(--testo);font-size:11px;outline:none">
          </div>
          <div>
            <div style="font-size:9px;color:var(--testo-dim);margin-bottom:2px">ETÀ</div>
            <input id="sv-eta-${dbIdx}" type="number" value="${p.eta||''}" placeholder="Es. 25" style="width:100%;background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:4px;padding:4px 6px;color:var(--testo);font-size:11px;outline:none" min="14" max="45">
          </div>
          <div>
            <div style="font-size:9px;color:var(--testo-dim);margin-bottom:2px">QUOTAZIONE TM (M€)</div>
            <input id="sv-quot-${dbIdx}" type="number" value="${p.quotazione||''}" placeholder="Es. 15" step="0.5" style="width:100%;background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:4px;padding:4px 6px;color:var(--testo);font-size:11px;outline:none">
          </div>
          <div>
            <div style="font-size:9px;color:var(--testo-dim);margin-bottom:2px">STIPENDIO (M€/anno)</div>
            <input id="sv-stip-${dbIdx}" type="number" value="${p.stipendio||''}" placeholder="Es. 2.5" step="0.1" style="width:100%;background:var(--grigio);border:1px solid var(--grigio-chiaro);border-radius:4px;padding:4px 6px;color:var(--testo);font-size:11px;outline:none">
          </div>
        </div>
        <div style="display:flex;gap:5px">
          <button onclick="salvaSvincolato(${dbIdx})" style="flex:1;background:rgba(0,255,135,0.15);border:1px solid rgba(0,255,135,0.4);color:var(--verde);font-size:11px;font-weight:700;padding:5px;border-radius:5px;cursor:pointer">💾 Salva</button>
          <button onclick="chiudiEditSvincolo(${dbIdx})" style="background:var(--grigio);border:1px solid var(--grigio-chiaro);color:var(--testo-dim);font-size:11px;padding:5px 10px;border-radius:5px;cursor:pointer">✕</button>
        </div>
      </div>
      <!-- BOTTONI AZIONE -->
      <div style="border-top:1px solid var(--grigio-chiaro);padding:5px 8px;display:flex;gap:5px">
        ${utenteLoggato?`<button onclick='apriAggiungiSvincolo(this)' data-p="${safeP}" style="flex:1;background:rgba(0,255,135,0.1);border:1px solid rgba(0,255,135,0.3);color:var(--verde);font-size:10px;font-weight:700;padding:4px;border-radius:5px;cursor:pointer">➕ Rosa</button>`:''}
        ${adminLoggato?`<button onclick="apriEditSvincolo(${dbIdx})" style="background:rgba(255,215,0,0.1);border:1px solid rgba(255,215,0,0.3);color:var(--oro);font-size:10px;padding:4px 8px;border-radius:5px;cursor:pointer" title="Modifica">✏️</button>`:''}
        ${adminLoggato?`<button onclick="eliminaSvincolato(${dbIdx})" style="background:rgba(255,68,68,0.1);border:1px solid rgba(255,68,68,0.3);color:var(--rosso);font-size:10px;padding:4px 8px;border-radius:5px;cursor:pointer" title="Elimina">🗑️</button>`:''}
      </div>
    </div>`;
  }).join('');
  if(svincolatiFiltrati.length>svincolatiVisibili){
    grid.innerHTML+=`<div style="grid-column:1/-1;text-align:center;padding:12px">
      <button onclick="caricaAltriSvincolati()" style="background:var(--grigio);border:1px solid var(--grigio-chiaro);color:var(--testo);font-size:12px;font-weight:600;padding:8px 16px;border-radius:8px;cursor:pointer">
        Carica altri (${svincolatiFiltrati.length-svincolatiVisibili} rimanenti)
      </button>
    </div>`;
  }
}

function caricaAltriSvincolati(){
  svincolatiVisibili+=120;
  renderSvincolati();
}

function apriEditSvincolo(dbIdx){
  // Chiudi altri pannelli aperti
  document.querySelectorAll('[id^="svincolo-edit-"]').forEach(el=>{
    if(el.id!==`svincolo-edit-${dbIdx}`) el.style.display='none';
  });
  const el=document.getElementById(`svincolo-edit-${dbIdx}`);
  if(el) el.style.display=el.style.display==='none'?'block':'none';
}

function chiudiEditSvincolo(dbIdx){
  const el=document.getElementById(`svincolo-edit-${dbIdx}`);
  if(el) el.style.display='none';
}

async function salvaSvincolato(dbIdx){
  const p=svincolatiDB[dbIdx];
  if(!p) return;
  const nuovoNome=document.getElementById(`sv-nome-${dbIdx}`)?.value.trim()||p.nome;
  const nuovoRuolo=document.getElementById(`sv-ruolo-${dbIdx}`)?.value||p.ruolo;
  const nuovoClub=document.getElementById(`sv-club-${dbIdx}`)?.value.trim()||null;
  const nuovaEta=parseInt(document.getElementById(`sv-eta-${dbIdx}`)?.value)||null;
  const nuovaQuot=parseFloat(document.getElementById(`sv-quot-${dbIdx}`)?.value)||null;
  const nuovoStip=parseFloat(document.getElementById(`sv-stip-${dbIdx}`)?.value)||null;

  // Aggiorna oggetto locale
  p.nome=nuovoNome; p.ruolo=nuovoRuolo; p.club=nuovoClub;
  p.eta=nuovaEta; p.quotazione=nuovaQuot; p.stipendio=nuovoStip;

  // Se è nel DB, aggiorna Supabase
  if(p.daDB&&p.dbId){
    try{
      const upd={nome:nuovoNome,ruolo:nuovoRuolo,club_reale:nuovoClub,squadra_club:nuovoClub,
        eta:nuovaEta,quotazione:nuovaQuot,stipendio:nuovoStip};
      const{error}=await sb.from('giocatori').update(upd).eq('id',p.dbId);
      if(error) throw error;
      const gi=giocatoriDB.findIndex(g=>g.id===p.dbId);
      if(gi>=0) giocatoriDB[gi]={...giocatoriDB[gi],...upd};
    }catch(e){showToast('❌ Errore salvataggio: '+e.message,'error');return;}
  }
  showToast('✅ '+nuovoNome+' aggiornato!');
  chiudiEditSvincolo(dbIdx);
  filtraSvincolati(); // ri-renderizza
}

async function eliminaSvincolato(dbIdx){
  const p=svincolatiDB[dbIdx];
  if(!p) return;
  if(!confirm(`Eliminare ${p.nome} dagli svincolati?`)) return;

  // Se è nel DB, cancella da Supabase
  if(p.daDB&&p.dbId){
    try{
      const{error}=await sb.from('giocatori').delete().eq('id',p.dbId);
      if(error) throw error;
      const gi=giocatoriDB.findIndex(g=>g.id===p.dbId);
      if(gi>=0) giocatoriDB.splice(gi,1);
    }catch(e){showToast('❌ Errore: '+e.message,'error');return;}
  }

  // Rimuovi dall'array locale
  svincolatiDB.splice(dbIdx,1);
  svincolatiFiltrati=svincolatiFiltrati.filter(x=>x!==p);
  showToast(`🗑️ ${p.nome} eliminato!`);
  filtraSvincolati();
}

function apriAggiungiSvincolo(el){
  if(!utenteLoggato){showToast('❌ Devi essere loggato','error');return;}
  try{
    const p=JSON.parse(el.dataset.p.replace(/&quot;/g,'"').replace(/&#39;/g,"'"));
    const sq=utenteLoggato;
    const princ=giocatoriDB.filter(g=>g.squadra_id===sq.id&&g.lista==='principale').length;
    const marg=giocatoriDB.filter(g=>g.squadra_id===sq.id&&g.lista==='marginale').length;
    document.getElementById('aggiungi-svincolo-body').innerHTML=`
      <div style="background:var(--grigio-scuro);border-radius:10px;padding:14px;margin-bottom:16px;display:flex;align-items:center;gap:12px">
        <div style="width:44px;height:44px;border-radius:50%;background:var(--grigio-chiaro);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;overflow:hidden">${p.foto?`<img src="${p.foto}" style="width:100%;height:100%;object-fit:cover">`:iniziali(p.nome)}</div>
        <div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:18px">${p.nome}</div>
          <div style="font-size:12px;color:var(--testo-dim)">${p.ruolo} • ${p.club||'Svincolato'}</div>
        </div>
      </div>
      <div class="form-group"><label class="form-label">Lista</label>
        <select class="form-select" id="svincolo-lista">
          <option value="principale">Principale (${princ}/25)</option>
          <option value="marginale">Marginale (${marg}/14)</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label">Numero Maglia</label>
        <input class="form-input" type="number" id="svincolo-maglia" placeholder="Es. 9" min="1" max="99">
      </div>
      <div class="form-group"><label class="form-label">Stipendio annuo (M€)</label>
        <input class="form-input" type="number" id="svincolo-stipendio" placeholder="Es. 2.5" step="0.1" value="${p.stipendio||''}">
      </div>
      <div class="form-group"><label class="form-label">Quotazione TM (M€)</label>
        <input class="form-input" type="number" id="svincolo-quotazione" placeholder="Es. 10" step="0.1" value="${p.quotazione||''}">
      </div>
      <button onclick="salvaAggiungiSvincolo(${JSON.stringify(p).split('"').join("'")})" class="btn-primary">➕ AGGIUNGI ALLA ROSA</button>`;
    document.getElementById('modal-aggiungi-svincolo').classList.add('open');
  }catch(e){console.error(e);}
}

async function salvaAggiungiSvincolo(p){
  if(!utenteLoggato){showToast('❌ Non sei loggato','error');return;}
  const lista=document.getElementById('svincolo-lista').value;
  const maglia=parseInt(document.getElementById('svincolo-maglia').value)||null;
  const stipendio=parseFloat(document.getElementById('svincolo-stipendio').value)||null;
  const quotazione=parseFloat(document.getElementById('svincolo-quotazione').value)||null;
  // Controlla limiti rosa
  const n=giocatoriDB.filter(g=>g.squadra_id===utenteLoggato.id&&g.lista===lista).length;
  const max={principale:25,marginale:14}[lista]||25;
  if(n>=max){showToast(`❌ Rosa ${lista} piena (max ${max})!`,'error');return;}
  const nuovoG={
    squadra_id:utenteLoggato.id,
    nome:p.nome,
    ruolo:p.ruolo||'A',
    lista,
    maglia,
    stipendio,
    quotazione,
    contratto:'Titolo Definitivo',
    club_reale:p.club||null,
    squadra_club:p.club||null,
    foto_url:p.foto||null,
    eta:p.eta||null,
    gol:0,assist:0,presenze:0,promosso:false,
  };
  try{
    const{data,error}=await sb.from('giocatori').insert(nuovoG).select();
    if(error) throw error;
    giocatoriDB.push(data[0]);
    // Rimuovi dagli svincolati
    svincolatiDB=svincolatiDB.filter(x=>x.nome!==p.nome);
    svincolatiFiltrati=svincolatiFiltrati.filter(x=>x.nome!==p.nome);
    showToast('✅ '+p.nome+' aggiunto alla tua rosa!');
    document.getElementById('modal-aggiungi-svincolo').classList.remove('open');
    renderSvincolati();
    if(squadraAttiva&&squadraAttiva.id===utenteLoggato.id) renderRosa(tabAttivoSq);
  }catch(e){showToast('❌ Errore: '+e.message,'error');}
}

function apriSchedaSvincolatoStr(el){
  try{apriSchedaSvincolato(JSON.parse(el.dataset.p.replace(/&quot;/g,'"').replace(/&#39;/g,"'")));}catch(e){}
}

async function rimuoviSvincolato(dbId){
  if(!dbId||!adminLoggato) return;
  if(!confirm('Rimuovere questo giocatore dagli svincolati?')) return;
  try{
    const{error}=await sb.from('giocatori').delete().eq('id',dbId);
    if(error) throw error;
    // Rimuovi da giocatoriDB
    const idx=giocatoriDB.findIndex(g=>g.id===dbId);
    if(idx>=0) giocatoriDB.splice(idx,1);
    // Rimuovi da svincolatiDB
    const si=svincolatiDB.findIndex(p=>p.dbId===dbId);
    if(si>=0) svincolatiDB.splice(si,1);
    showToast('🗑️ Svincolato rimosso!');
    filtraSvincolati();
  }catch(e){showToast('❌ Errore: '+e.message,'error');}
}

function apriRimuoviSvincolati(){
  // Mostra modal con lista di tutti gli svincolati nel DB per rimuoverli in batch
  const nelDB=svincolatiDB.filter(p=>p.daDB);
  if(!nelDB.length){showToast('Nessuno svincolato nel DB','error');return;}
  document.getElementById('mg-title').textContent='🗑️ GESTISCI SVINCOLATI';
  document.getElementById('mg-edit-btn').style.display='none';
  document.getElementById('mg-trattativa-btn').style.display='none';
  document.getElementById('mg-body').innerHTML=`
    <div style="padding:14px 16px;background:var(--grigio-scuro);border-bottom:1px solid var(--grigio-chiaro)">
      <div style="font-size:12px;color:var(--testo-dim)">Questi sono i giocatori nel DB con lista "svincolato". Rimuovi quelli che non servono più.</div>
      <button onclick="rimuoviTuttiSvincolati()" style="margin-top:8px;background:rgba(255,68,68,0.15);border:1px solid rgba(255,68,68,0.4);color:var(--rosso);font-size:12px;font-weight:700;padding:6px 14px;border-radius:6px;cursor:pointer">🗑️ Rimuovi TUTTI gli svincolati dal DB</button>
    </div>
    <div style="padding:8px 16px;max-height:400px;overflow-y:auto">
      ${nelDB.map(p=>`
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--grigio-chiaro);font-size:12px">
          <div style="flex:1">
            <div style="font-weight:600">${p.nome}</div>
            <div style="font-size:10px;color:var(--testo-dim)">${p.ruolo||'—'} • ${p.club||'—'} ${p.quotazione?'• '+p.quotazione+'M€':''}</div>
          </div>
          <button onclick="rimuoviSvincolato(${p.dbId})" style="background:rgba(255,68,68,0.1);border:1px solid rgba(255,68,68,0.3);color:var(--rosso);font-size:11px;padding:4px 10px;border-radius:5px;cursor:pointer;white-space:nowrap">🗑️ Rimuovi</button>
        </div>`).join('')}
    </div>`;
  document.getElementById('modal-giocatore').classList.add('open');
}

async function rimuoviTuttiSvincolati(){
  if(!adminLoggato) return;
  const nelDB=svincolatiDB.filter(p=>p.daDB);
  if(!nelDB.length) return;
  if(!confirm(`Rimuovere TUTTI i ${nelDB.length} svincolati dal DB?`)) return;
  try{
    const ids=nelDB.map(p=>p.dbId).filter(Boolean);
    const{error}=await sb.from('giocatori').delete().in('id',ids);
    if(error) throw error;
    ids.forEach(id=>{
      const idx=giocatoriDB.findIndex(g=>g.id===id);
      if(idx>=0) giocatoriDB.splice(idx,1);
    });
    svincolatiDB=svincolatiDB.filter(p=>!p.daDB);
    svincolatiFiltrati=svincolatiFiltrati.filter(p=>!p.daDB);
    showToast(`🗑️ Rimossi ${ids.length} svincolati!`);
    document.getElementById('modal-giocatore').classList.remove('open');
    filtraSvincolati();
  }catch(e){showToast('❌ Errore: '+e.message,'error');}
}

function apriSchedaSvincolato(p){
  document.getElementById('mg-title').textContent=p.nome.toUpperCase();
  document.getElementById('mg-edit-btn').style.display='none';
  document.getElementById('mg-trattativa-btn').style.display='none';
  document.getElementById('mg-body').innerHTML=`
    <div class="player-hero">
      <div class="player-photo">${p.foto?`<img src="${p.foto}">`:iniziali(p.nome)}</div>
      <div>
        <div class="player-nome">${p.nome}</div>
        <div class="player-tags"><span class="g-ruolo ${ruoloColor(p.ruolo)}" style="font-size:12px;padding:3px 8px">${ruoloNome(p.ruolo)}</span></div>
        ${p.club?`<div style="font-size:12px;color:var(--blu);margin-top:4px">🏟️ ${p.club}</div>`:''}
        ${p.eta?`<div style="font-size:12px;color:var(--testo-dim);margin-top:2px">📅 ${p.eta} anni</div>`:''}
      </div>
    </div>
    ${p.gol!==undefined?`<div class="player-section" style="border-bottom:none"><div class="player-section-title">⚽ Statistiche</div><div class="stats-row"><div class="stat-box"><div class="stat-box-val">${p.gol||0}</div><div class="stat-box-label">Gol</div></div><div class="stat-box"><div class="stat-box-val">${p.assist||0}</div><div class="stat-box-label">Assist</div></div><div class="stat-box"><div class="stat-box-val">${p.mv||'—'}</div><div class="stat-box-label">Media V.</div></div><div class="stat-box"><div class="stat-box-val">${p.presenze||0}</div><div class="stat-box-label">Presenze</div></div></div></div>`:''}
    <div style="padding:12px 20px;background:rgba(0,255,135,0.04);border-top:1px solid var(--grigio-chiaro);text-align:center;font-size:12px;color:var(--testo-dim)">🔓 Disponibile — non in nessuna rosa della lega</div>`;
  document.getElementById('modal-giocatore').classList.add('open');
}

// renderBilancio è ora integrato nella pagina squadra
let bilancioSquadraAttiva=null;
