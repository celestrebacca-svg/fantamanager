// ===== MIGRAZIONE IMMAGINI SU CLOUDINARY =====
// Esegui questo script una volta sola per migrare tutte le immagini base64 su Cloudinary

async function migraImmaginiSuCloudinary(){
  const risultati = {migrati: 0, errori: 0, saltati: 0};
  showToast('⏳ Avvio migrazione immagini su Cloudinary...', 'info');

  // Migra foto giocatori
  const giocatoriConBase64 = giocatoriDB.filter(g => 
    g.foto_url && g.foto_url.startsWith('data:')
  );
  
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
      } else {
        risultati.errori++;
      }
    } catch(e) {
      console.error(`❌ ${g.nome}: errore`, e);
      risultati.errori++;
    }
    // Pausa per non sovraccaricare
    await new Promise(r => setTimeout(r, 500));
  }

  // Migra loghi squadre
  const squadreConBase64 = squadreDB.filter(s => 
    (s.logo_url && s.logo_url.startsWith('data:')) ||
    (s.maglia_url && s.maglia_url.startsWith('data:'))
  );

  for(const sq of squadreConBase64){
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
    } catch(e) {
      risultati.errori++;
    }
    await new Promise(r => setTimeout(r, 500));
  }

  showToast(`✅ Migrazione completata! Migrati: ${risultati.migrati}, Errori: ${risultati.errori}`);
  console.log('Risultati migrazione:', risultati);
}
