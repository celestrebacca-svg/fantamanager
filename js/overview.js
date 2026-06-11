// ===== OVERVIEW =====
function renderBannerMiaSquadra(){
  const wrap=document.getElementById('mia-squadra-banner-wrap');
  if(!utenteLoggato){wrap.innerHTML='';return;}
  const sq=utenteLoggato;
  const logoHtml=sq.logo_url?`<img src="${sq.logo_url}">`:(sq.avatar||'⚽');
  wrap.innerHTML=`
    <div class="mia-squadra-banner">
      <div class="msb-logo" style="background:${sq.avatar_bg||'#333'}">${logoHtml}</div>
      <div class="msb-info">
        <div class="msb-label">⭐ La tua squadra</div>
        <div class="msb-nome">${sq.nome}</div>
        <div class="msb-stats">
          <div class="msb-stat">Budget <span>${fmtBudget(sq.budget)}</span></div>
          <div class="msb-stat">Tifosi <span>${(sq.tifosi||0).toLocaleString('it-IT')}</span></div>
          <div class="msb-stat">Giocatori <span>${giocatoriDB.filter(g=>g.squadra_id===sq.id).length}</span></div>
        </div>
      </div>
      <button class="msb-btn" onclick="apriSquadra('${sq.id}')">VEDI ROSA →</button>
    </div>`;
}

function renderOverview(){
  renderBannerMiaSquadra();
  const grid=document.getElementById('squadre-overview');
  if(!squadreDB||squadreDB.length===0){
    grid.innerHTML=`<div class="empty" style="text-align:center;padding:30px">
      ❌ Nessuna squadra caricata.<br>
      <small style="color:var(--testo-dim)">Controlla la connessione Supabase</small><br><br>
      <button onclick="ricaricaDati()" style="background:var(--verde);color:var(--nero);border:none;padding:10px 20px;border-radius:8px;font-family:'Bebas Neue',sans-serif;font-size:16px;cursor:pointer">🔄 RIPROVA</button>
    </div>`;
    return;
  }
  const sq=ricercaSq?squadreDB.filter(s=>{
    const t=ricercaSq.toLowerCase();
    const gSq=giocatoriDB.filter(g=>g.squadra_id===s.id);
    return s.nome.toLowerCase().includes(t)||(s.owner_name||'').toLowerCase().includes(t)||gSq.some(g=>g.nome.toLowerCase().includes(t));
  }):squadreDB;
  if(!sq.length){grid.innerHTML='<div class="empty">Nessuna squadra trovata</div>';return;}
  grid.innerHTML=sq.map(s=>{
    const isMia=utenteLoggato&&s.id===utenteLoggato.id;
    const nomeDisplay=s.nome_squadra||s.nome;
    // Banner: logo a sinistra, maglia a destra, sfondo nero
    const bannerContent=`
      <div style="display:flex;align-items:center;justify-content:center;gap:20px;padding:20px 24px">
        <div style="width:100px;height:100px;background:#111;border-radius:14px;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0">
          ${s.logo_url?`<img src="${s.logo_url}" style="width:96px;height:96px;object-fit:contain">`:`<span style="font-family:'Bebas Neue',sans-serif;font-size:42px;color:var(--testo)">${s.avatar||'⚽'}</span>`}
        </div>
        ${s.maglia_url?`<div style="width:80px;height:100px;background:#111;border-radius:14px;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0">
          <img src="${s.maglia_url}" style="width:72px;height:90px;object-fit:contain">
        </div>`:''}
      </div>`;
    return `<div class="squadra-overview-card${isMia?' mia':''}" onclick="apriSquadra('${s.id}')">
      ${isMia?'<div class="mia-badge">⭐ TUA</div>':''}
      <div style="background:#000;border-radius:12px 12px 0 0;overflow:hidden">${bannerContent}</div>
      <div class="soc-info">
        <div class="soc-nome">${nomeDisplay}</div>
        <div class="soc-owner">👤 ${s.owner_name||'—'}</div>
        <div class="soc-stats">
          <div class="soc-stat">Budget <span>${fmtBudget(s.budget)}</span></div>
          <div class="soc-stat">Tifosi <span>${(s.tifosi||0).toLocaleString('it-IT')}</span></div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function cercaSquadra(val){ricercaSq=val;renderOverview();}
