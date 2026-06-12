// ===== CLOUDINARY UPLOAD =====
const CLOUDINARY_CLOUD = 'dxh7otqux';
const CLOUDINARY_PRESET = 'fantamanager';

// Ottimizza URL Cloudinary: riduce dimensione e qualità
function ottimizzaUrlCloudinary(url, width=200, quality=70){
  if(!url || !url.includes('cloudinary.com')) return url;
  // Inserisce trasformazioni nell'URL
  return url.replace('/upload/', `/upload/w_${width},q_${quality},f_auto/`);
}

async function uploadToCloudinary(file, folder='general'){
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_PRESET);
  formData.append('folder', 'fantamanager/' + folder);
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if(data.error) throw new Error(data.error.message);
    return data.secure_url;
  } catch(e) {
    showToast('❌ Errore upload immagine: ' + e.message, 'error');
    return null;
  }
}

async function uploadBase64ToCloudinary(base64, folder='general'){
  const formData = new FormData();
  formData.append('file', base64);
  formData.append('upload_preset', CLOUDINARY_PRESET);
  formData.append('folder', 'fantamanager/' + folder);
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if(data.error) throw new Error(data.error.message);
    // Salva URL ottimizzato
    return ottimizzaUrlCloudinary(data.secure_url, 150, 75);
  } catch(e) {
    showToast('❌ Errore upload immagine: ' + e.message, 'error');
    return null;
  }
}
