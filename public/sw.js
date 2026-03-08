// public/sw.js

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Écouter les messages envoyés par App.tsx
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
        const { title, body, delay } = event.data;
        
        // On crée un délai pour envoyer la notif
        setTimeout(() => {
            self.registration.showNotification(title, {
                body: body,
                icon: '/pwa-192x192.png',
                vibrate: [200, 100, 200],
                badge: '/pwa-192x192.png',
                tag: 'ambuflow-alert' // Évite les doublons
            });
        }, delay);
    }
});