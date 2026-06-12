// ===== MIGRAZIONE IMMAGINI SU CLOUDINARY =====
async function migraImmaginiSuCloudinary(){
  const risultati = {migrati: 0, errori: 0};
  showToast('⏳ Avvio migrazione immagini su Cloudinary...', 'info');

  // Migra foto giocatori (base64)
  const giocatoriConBase64 = giocatoriDB.filter(g => g.foto_url && g.foto_url.startsWith('data:'));
  console.log(`Trovati ${giocatoriConBase64.length} giocatori con foto base64`);
  
  for(const g of giocatoriConBase64){
    try {
      const url = await uploadBase64ToCloudinary(g.foto_url, 'giocatori');
      if(url){
        await sb.from('giocatori').update({foto_url: url}).eq('id', g.id);
        const idx = giocatoriDB.findIndex(x => x.id === g.id);
        if(idx >= 0) giocatoriDB[idx].foto_url = url;
        risultati.migrati++;
        console.log(`✅ ${g.nome}: migrato`);
      } else { risultati.errori++; }
    } catch(e) { console.error(`❌ ${g.nome}:`, e); risultati.errori++; }
    await new Promise(r => setTimeout(r, 300));
  }

  // Migra loghi e maglie squadre (base64)
  for(const sq of squadreDB){
    try {
      const updates = {};
      if(sq.logo_url && sq.logo_url.startsWith('data:')){
        const url = await uploadBase64ToCloudinary(sq.logo_url, 'loghi');
        if(url) updates.logo_url = url;
      }
      if(sq.maglia_url && sq.maglia_url.startsWith('data:')){
        const url = await uploadBase64ToCloudinary(sq.maglia_url, 'maglie');
        if(url) updates.maglia_url = url;
      }
      if(Object.keys(updates).length > 0){
        await sb.from('squadre').update(updates).eq('id', sq.id);
        const idx = squadreDB.findIndex(x => x.id === sq.id);
        if(idx >= 0) squadreDB[idx] = {...squadreDB[idx], ...updates};
        risultati.migrati++;
      }
    } catch(e) { risultati.errori++; }
    await new Promise(r => setTimeout(r, 300));
  }

  // Migra foto presidenti (base64)
  const presidentiConBase64 = squadreDB.filter(s => s.presidente_foto && s.presidente_foto.startsWith('data:'));
  console.log(`Trovati ${presidentiConBase64.length} presidenti con foto base64`);
  
  for(const sq of presidentiConBase64){
    try {
      const url = await uploadBase64ToCloudinary(sq.presidente_foto, 'presidenti');
      if(url){
        await sb.from('squadre').update({presidente_foto: url}).eq('id', sq.id);
        const idx = squadreDB.findIndex(x => x.id === sq.id);
        if(idx >= 0) squadreDB[idx].presidente_foto = url;
        risultati.migrati++;
        console.log(`✅ Presidente ${sq.nome}: migrato`);
      }
    } catch(e) { risultati.errori++; }
    await new Promise(r => setTimeout(r, 300));
  }

  // Ottimizza URL Cloudinary già salvati (non ottimizzati)
  console.log('Ottimizzazione URL esistenti...');
  const daOttimizzare = giocatoriDB.filter(g => 
    g.foto_url && g.foto_url.includes('cloudinary.com') && !g.foto_url.includes('/upload/w_')
  );
  for(const g of daOttimizzare){
    const urlOtt = ottimizzaUrlCloudinary(g.foto_url, 150, 75);
    await sb.from('giocatori').update({foto_url: urlOtt}).eq('id', g.id);
    const idx = giocatoriDB.findIndex(x => x.id === g.id);
    if(idx >= 0) giocatoriDB[idx].foto_url = urlOtt;
    risultati.migrati++;
    await new Promise(r => setTimeout(r, 100));
  }

  showToast(`✅ Fatto! Migrati: ${risultati.migrati}, Errori: ${risultati.errori}`);
  console.log('Risultati:', risultati);
}
