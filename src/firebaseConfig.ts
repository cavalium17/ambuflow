import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  setPersistence, 
  browserLocalPersistence 
} from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import firebaseConfigData from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfigData);

// Initialize Auth with explicit local persistence for better iframe compatibility
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(err => {
  console.error("Firebase Auth persistence error:", err);
});

export const googleProvider = new GoogleAuthProvider();
// Force popup mode for better compatibility in AI Studio preview
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Forced Long Polling to avoid WebSocket issues in sandboxed/firewalled environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfigData.firestoreDatabaseId);

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection successful.");
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    } else {
      console.error("Firestore connection test error:", error);
    }
  }
}
testConnection();

export const storage = getStorage(app);

// Use a safe initialization for messaging to prevent crashes in unsupported environments
const initMessaging = () => {
  if (typeof window === 'undefined') return null;
  try {
    return getMessaging(app);
  } catch (error) {
    console.warn("Firebase Messaging not supported in this environment:", error);
    return null;
  }
};

export const messaging = initMessaging();

export const requestForToken = async () => {
  if (!messaging) return null;
  try {
    const currentToken = await getToken(messaging, {
      vapidKey: 'BD_v_Y_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z' // Placeholder, usually not strictly needed for basic setup if not using web push specifically
    });
    if (currentToken) {
      console.log('Token FCM:', currentToken);
      return currentToken;
    }
  } catch (err) {
    console.error('Erreur token FCM:', err);
  }
  return null;
};

export const onMessageListener = (callback: (payload: any) => void) => {
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};

export default app;
