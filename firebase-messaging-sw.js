// Firebase Messaging Service Worker pour AmbuFlow

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyA_kth_5Ykhm7X1zlc1TWuPoOZRx2RqZtc',
  authDomain: 'ambuflow-e5ffc.firebaseapp.com',
  projectId: 'ambuflow-e5ffc',
  storageBucket: 'ambuflow-e5ffc.firebasestorage.app',
  messagingSenderId: '296039792412',
  appId: '1:296039792412:web:1ae46d1b28c5f259bac4d9',
  measurementId: 'G-CLQE06YVBK'
});

const messaging = firebase.messaging();

// Notification locale immédiate envoyée depuis l'app
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const title = event.data.title || 'AmbuFlow';
    const options = {
      body: event.data.body || 'Nouvelle notification',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: event.data.urgency === 'high' ? [300, 100, 300, 100, 400] : [100, 50, 100],
      tag: event.data.tag || 'ambuflow-alert',
      renotify: true,
      data: {
        url: event.data.url || '/',
        timestamp: Date.now()
      },
      actions: [
        { action: 'open', title: 'Ouvrir AmbuFlow' },
        { action: 'close', title: 'Fermer' }
      ]
    };

    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// Gestion des messages FCM en arrière-plan
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Message reçu en arrière-plan:', payload);

  const notificationTitle =
    payload.notification?.title || 'AmbuFlow - Notification';

  const notificationOptions = {
    body:
      payload.notification?.body ||
      payload.data?.message ||
      'Vous avez une nouvelle notification.',
    icon: payload.notification?.icon || '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: {
      ...payload.data,
      url: payload.data?.url || '/'
    },
    vibrate: [300, 100, 300],
    tag: payload.data?.tag || 'ambuflow-fcm',
    renotify: true,
    actions: [
      { action: 'open', title: 'Ouvrir' },
      { action: 'close', title: 'Plus tard' }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Gestion du clic sur notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification?.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        try {
          const url = new URL(client.url);
          if ('focus' in client && (url.pathname === targetUrl || targetUrl === '/')) {
            return client.focus();
          }
        } catch (e) {
          // ignore URL parsing issues
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});