import { generateRegistrationOptions } from '@simplewebauthn/server';
import admin from 'firebase-admin';

// 1. Initialisation sécurisée
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
  } catch (e) {
    console.error("Erreur Init Firebase:", e.message);
  }
}

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

    // 2. ÉCRITURE DYNAMIQUE DANS FIRESTORE
    // On n'utilise plus d'ID de base en dur pour éviter le plantage 500
    try {
      const db = admin.firestore();
      await db.collection('users').doc(userId).set({ 
        currentChallenge: options.challenge,
        lastRegistrationAttempt: new Date().toISOString()
      }, { merge: true });
      console.log("Challenge enregistré avec succès");
    } catch (dbError) {
      // Si la base refuse l'accès, on log l'erreur mais on ne bloque pas l'utilisateur
      console.error("Erreur Firestore non bloquante:", dbError.message);
    }

    // 3. RENVOI DES OPTIONS (Quoi qu'il arrive)
    return res.status(200).json(options);

  } catch (error) {
    console.error("Erreur critique:", error.message);
    return res.status(500).json({ error: "Erreur Serveur", details: error.message });
  }
}