
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

import firebaseConfig from '../firebase-applet-config.json';

// Clé VAPID publique (Web Push) - À générer dans Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
export const VAPID_KEY = "BCtoGbVvlqhGFK4QDOD1OtQMdydaMrKK_EKDp1-zBvEv9Yc46yTBCJrj1Z3YmFk1MtvfxoMqv5MCHyi4xpZOzsw";

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
let messaging: Messaging | null = null;

// Initialisation sécurisée (évite les erreurs sur les navigateurs non compatibles)
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
} catch (err) {
  console.error("FCM non supporté:", err);
}

export { messaging };

export const requestForToken = async () => {
  if (!messaging) return null;
  
  try {
    const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (currentToken) {
      console.log('FCM Token:', currentToken);
      console.log("Mon Token : ", currentToken);
      // Ici, vous devriez envoyer le token à votre backend pour cibler cet utilisateur
      return currentToken;
    } else {
      console.log('Aucun token de registration disponible. Demandez la permission.');
      return null;
    }
  } catch (err) {
    console.log('Erreur lors de la récupération du token:', err);
    return null;
  }
};

export const onMessageListener = (callback: (payload: any) => void) => {
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    console.log("Message reçu en premier plan:", payload);
    callback(payload);
  });
};
