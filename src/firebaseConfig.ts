import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getMessaging, Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "ambuflow-e5ffc.firebaseapp.com",
  projectId: "ambuflow-e5ffc",
  storageBucket: "ambuflow-e5ffc.firebasestorage.app",
  messagingSenderId: "296039792412",
  appId: "1:296039792412:web:1ae46d1b28c5f259bac4d9",
  measurementId: "G-CLQE06YVBK"
};

// 1. Initialiser Firebase
const app = initializeApp(firebaseConfig);

// 2. Initialiser et EXPORTER le Storage (C'est ce qui bloquait Vercel !)
export const storage = getStorage(app);

// 3. Initialiser la messagerie de façon sécurisée
let messaging: Messaging | null = null;
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
} catch (err) {
  console.error("FCM non supporté:", err);
}

export { messaging };
export default app;