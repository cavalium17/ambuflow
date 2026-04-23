import { generateRegistrationOptions } from '@simplewebauthn/server';

// Configuration de l'application
const RP_ID = 'ambuflow-delta.vercel.app';
const RP_NAME = 'AmbuFlow';
const ORIGIN = `https://${RP_ID}`;

export default async function handler(req, res) {
  try {
    // 1. Vérification de la méthode
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    // 2. Récupération de l'utilisateur (Exemple via session ou body)
    // REMPLACER PAR VOTRE LOGIQUE RÉELLE DE RÉCUPÉRATION D'UTILISATEUR
    const user = {
      id: 'user_123456', // Votre ID provenant de la DB (String)
      email: 'contact@exemple.com',
      name: 'Adrien'
    };

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    // 3. Génération des options avec le correctif Uint8Array
    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      
      // --- CORRECTIF CRUCIAL ICI ---
      // On transforme le string ID en Uint8Array pour respecter le nouveau standard
      userID: Uint8Array.from(user.id, c => c.charCodeAt(0)),
      
      userName: user.email,
      userDisplayName: user.name,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform', // Force l'usage de FaceID/TouchID/Code téléphone
      },
    });

    // 4. Stockage du challenge (Indispensable pour la vérification ultérieure)
    // Note: Vous devriez stocker options.challenge en DB ou en Cookie sécurisé ici
    
    // 5. Envoi des options au frontend
    return res.status(200).json(options);

  } catch (error) {
    console.error('Erreur lors de la génération des options:', error);
    
    // On renvoie un JSON propre même en cas d'erreur pour éviter le crash Vercel
    return res.status(500).json({ 
      error: 'Erreur serveur interne',
      details: error.message 
    });
  }
}
// Version 2.0 - Firebase Connection
