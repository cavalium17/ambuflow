
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Gestionnaire de messages pour la planification
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body, delay, urgency, icon } = event.data;
    
    // Planification locale (dépend de la durée de vie du SW dans le navigateur)
    setTimeout(() => {
      const options = {
        body: body,
        icon: icon || 'https://cdn-icons-png.flaticon.com/512/1022/1022213.png',
        vibrate: urgency === 'high' ? [300, 100, 300, 100, 400] : [100, 50, 100],
        badge: 'https://cdn-icons-png.flaticon.com/512/1022/1022213.png',
        tag: 'ambuflow-alert',
        renotify: true,
        data: {
          timestamp: Date.now()
        },
        actions: [
          { action: 'open', title: 'Ouvrir AmbuFlow' }
        ]
      };

      self.registration.showNotification(title, options);
    }, delay);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      if (clientList.length > 0) return clientList[0].focus();
      return clients.openWindow('/');
    })
  );
});
