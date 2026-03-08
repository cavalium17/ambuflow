const CACHE_NAME = 'ambuflow-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Installation : Mise en cache des fichiers de base
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activation : Nettoyage des vieux caches
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch : Stratégie de cache pour valider l'installation PWA
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// --- Tes Notifications existantes ---
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body, delay, urgency, icon } = event.data;
    setTimeout(() => {
      const options = {
        body: body,
        icon: icon || 'https://cdn-icons-png.flaticon.com/512/1022/1022213.png',
        vibrate: urgency === 'high' ? [300, 100, 300, 100, 400] : [100, 50, 100],
        badge: 'https://cdn-icons-png.flaticon.com/512/1022/1022213.png',
        tag: 'ambuflow-alert'
      };
      self.registration.showNotification(title, options);
    }, delay);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((list) => {
      if (list.length > 0) return list[0].focus();
      return clients.openWindow('/');
    })
  );
});