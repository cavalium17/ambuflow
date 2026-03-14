const CACHE_NAME = 'ambuflow-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
];

// Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Ne pas interférer avec les extensions navigateur, devtools, etc.
  if (!url.protocol.startsWith('http')) return;

  // Navigation HTML : network first, fallback cache puis index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          return cachedPage || caches.match('/index.html');
        })
    );
    return;
  }

  // Assets statiques : stale-while-revalidate simple
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Message depuis l'app
self.addEventListener('message', (event) => {
  if (!event.data) return;

  // Permet de forcer la prise en compte immédiate du nouveau SW
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  // Notification immédiate
  if (event.data.type === 'SHOW_NOTIFICATION') {
    const title = event.data.title || 'AmbuFlow';
    const options = {
      body: event.data.body || 'Nouvelle notification',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: event.data.tag || 'ambuflow-notification',
      renotify: true,
      requireInteraction: false,
      data: {
        url: event.data.url || '/'
      }
    };

    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// Clic sur notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification?.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        const clientUrl = new URL(client.url);

        if (clientUrl.pathname === targetUrl || targetUrl === '/') {
          return client.focus();
        }
      }

      return clients.openWindow(targetUrl);
    })
  );
});