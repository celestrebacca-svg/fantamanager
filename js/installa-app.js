// ===== INSTALLA APP =====
// Registra il service worker e mostra in home il bottone "Installa app".
// Android/Chrome: apre la finestra di installazione. iPhone: mostra come aggiungerla alla Home.
(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
  }

  const giaInstallata = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (giaInstallata()) return;

  let promptInstall = null;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

  function creaBottone(testo, onclick) {
    if (document.getElementById('btn-installa-app')) return;
    const enter = document.querySelector('.home-enter');
    if (!enter) return;
    const b = document.createElement('button');
    b.id = 'btn-installa-app';
    b.textContent = testo;
    b.onclick = onclick;
    b.style.cssText = 'display:block;margin:10px auto 0;padding:10px 20px;border-radius:10px;border:1px solid rgba(255,215,0,0.5);background:rgba(255,215,0,0.08);color:var(--oro);font-size:14px;font-weight:600;cursor:pointer;position:relative;z-index:2';
    enter.parentNode.insertBefore(b, enter.nextSibling);
  }

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    promptInstall = e;
    creaBottone('📲 Installa app', async () => {
      if (!promptInstall) return;
      promptInstall.prompt();
      await promptInstall.userChoice.catch(() => {});
      promptInstall = null;
      const b = document.getElementById('btn-installa-app'); if (b) b.remove();
    });
  });

  window.addEventListener('appinstalled', () => {
    const b = document.getElementById('btn-installa-app'); if (b) b.remove();
  });

  if (ios) {
    window.addEventListener('load', () => {
      creaBottone('📲 Installa app', () => {
        alert('Per installare l\'app su iPhone:\n1) apri questa pagina con Safari\n2) tocca il tasto Condividi (il quadrato con la freccia)\n3) scegli "Aggiungi alla schermata Home"');
      });
    });
  }
})();
