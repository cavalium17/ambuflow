import { generateRegistrationOptions } from '@simplewebauthn/server';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
  } catch (e) { console.error("Erreur Init:", e.message); }
}

// ON FORCE L'ACCÈS À TA BASE SPÉCIFIQUE
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

    // TENTATIVE D'ÉCRITURE DIRECTE
    // On utilise le nom de collection "users" sans espace, tel qu'on le voit sur ta capture
    await db.collection('users').doc(userId).set({ 
      currentChallenge: options.challenge,
      lastUpdate: new Date().toISOString()
    }, { merge: true });

    return res.status(200).json(options);

  } catch (error) {
    // Si ça échoue, on veut voir l'erreur exacte cette fois
    return res.status(500).json({ error: error.message });
  }
}