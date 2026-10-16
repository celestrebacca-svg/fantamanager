// Service worker minimo: serve solo a rendere l'app installabile.
// Non salva nulla in cache, quindi dopo ogni deploy si vede sempre la versione nuova.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => { /* passa direttamente alla rete */ });
