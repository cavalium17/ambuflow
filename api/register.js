import { generateRegistrationOptions } from '@simplewebauthn/server';
import admin from 'firebase-admin';

// 1. Initialisation standard
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
  } catch (error) {
    console.error('Erreur Firebase Admin:', error.message);
  }
}

// On revient à la base par défaut, Firebase Admin s'occupe du reste
const db = admin.firestore();

export default async function handler(req, res) {
  try {
    const host = req.headers.host || '';
    const currentRP_ID = host.split(':')[0]; 
    const userId = "nTdQajBkoKXmWnhLEkJQYaTP9rB3"; 

    const options = await generateRegistrationOptions({
      rpName: 'AmbuFlow',
      rpID: currentRP_ID,
      userID: Uint8Array.from(userId, c => c.charCodeAt(0)),
      userName: "contact@exemple.com",
      userDisplayName: "Adrien",
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform', 
      },
    });

    // On utilise .set avec merge: true pour être blindé contre les erreurs "Not Found"
    const userRef = db.collection('users').doc(userId);
    await userRef.set({
      currentChallenge: options.challenge,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // On renvoie les options au navigateur
    return res.status(200).json(options);

  } catch (error) {
    // Si ça plante, on veut savoir exactement pourquoi dans les logs Vercel
    console.error('ERREUR SERVEUR:', error.message);
    return res.status(500).json({ error: 'Erreur Interne', details: error.message });
  }
}