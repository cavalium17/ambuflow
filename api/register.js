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

const db = admin.firestore();

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    // 2. Récupération dynamique du domaine
    const host = req.headers.host || '';
    const currentRP_ID = host.split(':')[0]; 

    // 3. Données utilisateur (Formatage strict pour éviter l'erreur 'replace')
    // On s'assure que ce sont des strings pures sans espaces bizarres
    const userId = "nTdQajBkoKXmWnhLEkJQYaTP9rB3".trim(); 
    const userEmail = "contact@exemple.com".trim();
    const userName = "Adrien".trim();

    // 4. Génération des options
    const options = await generateRegistrationOptions({
      rpName: 'AmbuFlow',
      rpID: currentRP_ID,
      
      // Conversion sécurisée en Uint8Array pour le standard WebAuthn
      userID: Uint8Array.from(userId, c => c.charCodeAt(0)),
      
      userName: userEmail,
      userDisplayName: userName,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform', 
      },
    });

    // 5. Sauvegarde du challenge dans Firestore
    await db.collection('users').doc(userId).update({
      currentChallenge: options.challenge
    });

    return res.status(200).json(options);

  } catch (error) {
    console.error('Détail de l’erreur:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de la génération',
      message: error.message 
    });
  }
}