import { generateRegistrationOptions } from '@simplewebauthn/server';
import admin from 'firebase-admin';

// 1. Initialisation de Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
  } catch (error) {
    console.error('Erreur Firebase Admin:', error.message);
  }
}

// FORCE LA CONNEXION À LA BASE SPÉCIFIQUE DE TA PHOTO
// On récupère l'ID de la base que l'on voit sur ta capture écran
const db = admin.firestore("ai-studio-bc6dd8d0-4580-4097-892c-7d8a2e1c3e27");

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

    // Utilisation de .set pour être certain que ça ne renvoie pas NOT_FOUND
    await db.collection('users').doc(userId).set({
      currentChallenge: options.challenge,
      lastCheck: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return res.status(200).json(options);

  } catch (error) {
    console.error('Erreur technique:', error);
    return res.status(500).json({ 
      error: 'Erreur Serveur', 
      message: error.message,
      code: error.code // On affiche le code d'erreur pour mieux comprendre
    });
  }
}