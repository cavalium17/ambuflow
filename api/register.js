import { generateRegistrationOptions } from '@simplewebauthn/server';
import admin from 'firebase-admin';

// 1. Initialisation sécurisée de Firebase Admin
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
      });
    } else {
      // Fallback pour l'environnement AI Studio Build qui utilise ADC
      admin.initializeApp();
    }
  } catch (error) {
    console.error('Erreur initialisation Firebase Admin:', error.message);
  }
}

const db = admin.firestore();

export default async function handler(req, res) {
  try {
    // 2. Vérification de la méthode
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    // 3. Gestion dynamique du domaine (RP_ID)
    // Cela permet au code de fonctionner sur l'URL principale ET les URLs de test
    const host = req.headers.host;
    const currentRP_ID = host ? host.split(':')[0] : 'localhost'; // Récupère le domaine sans le port

    // 4. Identification de l'utilisateur (ID provenant de votre Firebase)
    const userId = "nTdQajBkoKXmWnhLEkJQYaTP9rB3"; 
    const userEmail = "contact@exemple.com";
    const userName = "Adrien";

    // 5. Génération des options WebAuthn
    const options = await generateRegistrationOptions({
      rpName: 'AmbuFlow',
      rpID: currentRP_ID, // Dynamique pour éviter l'erreur "not equal to current domain"
      
      // CORRECTIF : Conversion de l'ID en Uint8Array (pour éviter "Unexpected token A")
      userID: Uint8Array.from(userId, c => c.charCodeAt(0)),
      
      userName: userEmail,
      userDisplayName: userName,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform', // Force TouchID/FaceID/Code téléphone
      },
    });

    // 6. SAUVEGARDE DU CHALLENGE DANS FIREBASE
    // Étape cruciale pour que l'étape de vérification puisse fonctionner plus tard
    await db.collection('users').doc(userId).update({
      currentChallenge: options.challenge,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 7. Envoi des options au frontend
    return res.status(200).json(options);

  } catch (error) {
    console.error('Erreur Serveur Register:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de la génération des options',
      details: error.message 
    });
  }
}
