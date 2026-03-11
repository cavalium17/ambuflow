import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getMessaging, Messaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "ambuflow-e5ffc.firebaseapp.com",
  projectId: "ambuflow-e5ffc",
  storageBucket: "ambuflow-e5ffc.firebasestorage.app",
  messagingSenderId: "296039792412",
  appId: "1:296039792412:web:1ae46d1b28c5f259bac4d9",
  measurementId: "G-CLQE06YVBK"
};

// Clé VAPID (Web Push)
export const VAPID_KEY = "BCtoGbVvlqhGFK4QDOD1OtQMdydaMrKK_EKDp1-zBvEv9Yc46yTBCJrj1Z3YmFk1MtvfxoMqv5MCHyi4xpZOzsw";

// 1. Initialiser Firebase
const app = initializeApp(firebaseConfig);

// 2. Export Storage
export const storage = getStorage(app);

// 3. Configuration Messagerie
let messaging: Messaging | null = null;
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
} catch (err) {
  console.error("FCM non supporté:", err);
}
export { messaging };

// 4. La fonction qui manquait (requestForToken)
export const requestForToken = async () => {
  if (!messaging) return null;
  try {
    const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
    return currentToken;
  } catch (err) {
    console.error('Erreur Token:', err);
    return null;
  }
};

// 5. Listener de messages
export const onMessageListener = (callback: (payload: any) => void) => {
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => callback(payload));
};

export default app;