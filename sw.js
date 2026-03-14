const CACHE_NAME = 'ambuflow-v2'; // Forcer la mise à jour
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-512x512.png' // On met ton logo en cache
];

// Installation : On force la prise de contrôle immédiate
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activation : On NETTOIE l'ancien cache "v1" (le bleu)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Récupération des fichiers : Réseau d'abord, sinon Cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// Notifications (Code fusionné et nettoyé)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body, delay } = event.data;
    setTimeout(() => {
      self.registration.showNotification(title, {
        body: body,
        icon: '/pwa-512x512.png',
        badge: '/pwa-512x512.png',
        vibrate: [200, 100, 200],
        tag: 'alert-ambulancier'
      });
    }, delay);
  }
});