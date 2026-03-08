
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Fonction d'enregistrement simplifiée et sécurisée pour le Service Worker
const registerServiceWorker = () => {
  // Les Service Workers nécessitent un contexte sécurisé (HTTPS ou localhost)
  // et ne peuvent pas être enregistrés si la page elle-même est chargée via un blob
  if ('serviceWorker' in navigator && window.isSecureContext) {
    
    // Si nous sommes dans un environnement de sandbox qui utilise des blobs, 
    // l'enregistrement du SW échouera systématiquement.
    if (window.location.protocol === 'blob:') {
      console.debug('Service Worker : Enregistrement ignoré (protocole blob détecté).');
      return;
    }

    // Utilisation d'un chemin relatif simple. 
    // C'est la méthode la plus fiable pour que le navigateur résolve l'URL 
    // par rapport à l'origine réelle du document (le bac à sable .goog)
    navigator.serviceWorker.register('firebase-messaging-sw.js')
      .then(reg => {
        console.log('AmbuFlow FCM SW Ready:', reg.scope);
      })
      .catch(err => {
        // On utilise console.debug pour ne pas polluer la console avec des erreurs 
        // attendues dans certains environnements de développement restreints.
        console.debug('Service Worker non disponible ou bloqué par la politique de sécurité :', err.message);
      });
  }
};

// On s'assure que le document est prêt avant de tenter l'enregistrement
if (document.readyState === 'complete') {
  registerServiceWorker();
} else {
  window.addEventListener('load', registerServiceWorker);
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
