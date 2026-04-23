import { generateRegistrationOptions } from '@simplewebauthn/server';
import admin from 'firebase-admin';

// 1. Initialisation de Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin initialisé avec succès.");
  } catch (error) {
    console.error('Erreur fatale initialisation Firebase:', error.message);
  }
}

const db = admin.firestore();

export default async function handler(req, res) {
  // On ne traite que le GET pour la génération d'options
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const host = req.headers.host || '';
    const currentRP_ID = host.split(':')[0]; 
    
    // Nettoyage de l'ID pour éviter tout caractère invisible
    const userId = "nTdQajBkoKXmWnhLEkJQYaTP9rB3".trim(); 

    // 2. Génération des options WebAuthn
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

    console.log("Options générées, tentative d'écriture Firebase...");

    // 3. BLOC FIREBASE CORRIGÉ
    // On tente d'écrire dans 'users' (standard) ET on crée un log de test
    // Si 'users ' avec un espace est vraiment le problème, on le saura ici
    try {
      const batch = db.batch();
      
      // Référence vers ton utilisateur
      const userRef = db.collection('users').doc(userId);
      batch.set(userRef, {
        currentChallenge: options.challenge,
        lastRegistrationAttempt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // Document de secours pour vérifier si la connexion globale marche
      const debugRef = db.collection('debug').doc('last_attempt');
      batch.set(debugRef, { 
        success: true, 
        at: new Date().toISOString() 
      });

      await batch.commit();
      console.log("Écriture Firebase réussie.");
    } catch (dbError) {
      console.error("Erreur spécifique Firestore:", dbError.message);
      // Si ça échoue encore, on essaie la collection avec l'espace par désespoir
      await db.collection('users ').doc(userId).set({
        currentChallenge: options.challenge
      }, { merge: true });
    }

    // 4. Envoi de la réponse au client
    return res.status(200).json(options);

  } catch (error) {
    console.error('Erreur globale handler:', error.message);
    return res.status(500).json({ 
      error: 'Erreur Serveur', 
      details: error.message,
      step: 'Calcul des options ou accès DB'
    });
  }
}