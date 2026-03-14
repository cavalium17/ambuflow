import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const registerServiceWorkers = async () => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker non supporté par ce navigateur.');
    return;
  }

  if (!window.isSecureContext) {
    console.warn('Service Worker non enregistré : contexte non sécurisé.');
    return;
  }

  if (window.location.protocol === 'blob:') {
    console.debug('Service Worker ignoré : protocole blob détecté.');
    return;
  }

  try {
    const pwaRegistration = await navigator.serviceWorker.register('/sw.js');
    console.log('PWA Service Worker enregistré :', pwaRegistration.scope);

    try {
      const fcmRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Firebase Messaging SW enregistré :', fcmRegistration.scope);
    } catch (fcmError) {
      console.debug('Firebase Messaging SW non disponible :', fcmError);
    }
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du Service Worker principal :", error);
  }
};

window.addEventListener('load', () => {
  registerServiceWorkers();
});

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);