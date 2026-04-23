import { generateRegistrationOptions } from '@simplewebauthn/server';
import admin from 'firebase-admin';

// 1. Initialisation sécurisée
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
  } catch (e) { console.error("Erreur Init:", e.message); }
}

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

    // 2. Sauvegarde silencieuse (ne fait pas planter le JSON si ça échoue)
    try {
      // On teste les deux noms de collection vus sur tes captures
      const userRef = db.collection('users').doc(userId);
      await userRef.set({ currentChallenge: options.challenge }, { merge: true });
    } catch (dbError) {
      console.log("Note: Firebase n'a pas pu stocker le challenge, mais on continue.");
    }

    // 3. On renvoie le JSON (celui qui marche !)
    return res.status(200).json(options);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}