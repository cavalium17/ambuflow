import { generateRegistrationOptions } from '@simplewebauthn/server';
import admin from 'firebase-admin';

// 1. Initialisation de Firebase Admin
// On vérifie si l'app n'est pas déjà initialisée pour éviter les erreurs au rechargement
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
  } catch (error: any) {
    console.error('Erreur initialisation Firebase Admin:', error.message);
  }
}

const db = admin.firestore();

// Configuration de votre domaine Vercel
const RP_ID = 'ambuflow-delta.vercel.app';
const RP_NAME = 'AmbuFlow';

export default async function handler(req: any, res: any) {
  try {
    // 2. Vérification de la méthode
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    // 3. Identification de l'utilisateur
    // Note : Remplacez cet ID par celui de votre session utilisateur réelle plus tard
    const userId = "nTdQajBkoKXmWnhLEkJQYaTP9rB3"; 
    const userEmail = "contact@exemple.com";
    const userName = "Adrien";

    // 4. Génération des options WebAuthn
    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      
      // CORRECTIF : Conversion de l'ID en Uint8Array (Standard FIDO2)
      userID: Uint8Array.from(userId, c => c.charCodeAt(0)),
      
      userName: userEmail,
      userDisplayName: userName,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform', // Force FaceID / TouchID / Code
      },
    });

    // 5. SAUVEGARDE DU CHALLENGE DANS FIREBASE
    // On enregistre options.challenge dans le document de l'utilisateur
    // pour pouvoir le comparer lors de la validation finale.
    await db.collection('users').doc(userId).update({
      currentChallenge: options.challenge
    });

    // 6. Envoi des options au navigateur
    return res.status(200).json(options);

  } catch (error: any) {
    console.error('Erreur Serveur Register:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de la génération des options',
      details: error.message 
    });
  }
}
