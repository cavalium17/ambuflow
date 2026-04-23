import { generateRegistrationOptions } from '@simplewebauthn/server';

export default async function handler(req, res) {
  try {
    const host = req.headers.host || '';
    const currentRP_ID = host.split(':')[0]; 
    const userId = "nTdQajBkoKXmWnhLEkJQYaTP9rB3"; 

    // GÉNÉRATION DES OPTIONS (SANS APPEL FIREBASE POUR TESTER)
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

    // ON RENVOIE DIRECTEMENT LES OPTIONS
    // Si cela affiche le JSON, alors le problème est 100% ta clé Firebase ou l'ID de ton projet.
    return res.status(200).json(options);

  } catch (error) {
    return res.status(500).json({ 
      error: 'Erreur de génération', 
      details: error.message 
    });
  }
}