
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { 
  generateRegistrationOptions, 
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse
} from "@simplewebauthn/server";
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read Firebase config
const firebaseConfigPath = path.join(__dirname, 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));

// Initialize Firebase Admin (Default App) - Let it pick up environment credentials
let passkeyApp;
if (getApps().length === 0) {
  passkeyApp = initializeApp();
} else {
  passkeyApp = getApps()[0];
}

// We still use the database ID from the config
const db = getFirestore(passkeyApp, firebaseConfig.firestoreDatabaseId);
const authAdmin = getAuth(passkeyApp);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Set Permissions-Policy for WebAuthn - Simplified for broadest compatibility
  app.use((req, res, next) => {
    // Explicitly allow across origins for WebAuthn features
    res.setHeader('Permissions-Policy', 'publickey-credentials-create=*, publickey-credentials-get=*, webauthn=*, usb=*, bluetooth=*');
    res.setHeader('Feature-Policy', 'publickey-credentials-create *; publickey-credentials-get *; webauthn *; usb *; bluetooth *');
    next();
  });

  // API Routes
  app.get('/api/test', (req, res) => {
    res.json({ message: "Hello from AmbuFlow API" });
  });

  // Legacy endpoint for raw testing in index.html
  app.get('/api/register', async (req, res) => {
    try {
      const rpID = getRpID(req);
      const user = {
        id: 'user_123456',
        email: 'contact@exemple.com',
        name: 'Adrien'
      };

      const options = await generateRegistrationOptions({
        rpName: "AmbuFlow",
        rpID: rpID,
        userID: Uint8Array.from(user.id, c => c.charCodeAt(0)),
        userName: user.email,
        userDisplayName: user.name,
        attestationType: 'none',
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
          authenticatorAttachment: 'platform', // Force FaceID/TouchID/Passkey
        },
      });
      res.status(200).json(options);
    } catch (error: any) {
      console.error('Erreur lors de la génération des options (Legacy):', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Helper to get RP ID
  const getRpID = (req: express.Request) => {
    const hostHeader = req.headers.host;
    if (!hostHeader) return 'localhost';
    return hostHeader.split(':')[0];
  };

  // PASSKEY REGISTRATION OPTIONS
  app.post('/api/register-options', async (req, res) => {
    try {
      const { userId, email } = req.body;
      if (!userId || !email) {
        return res.status(400).json({ error: "userId and email are required" });
      }

      const rpID = getRpID(req);
      console.log(`Generating registration options for rpID: ${rpID}, userId: ${userId}`);

      const options = await generateRegistrationOptions({
        rpName: "AmbuFlow",
        rpID: rpID,
        userID: Uint8Array.from(userId as string, c => c.charCodeAt(0)),
        userName: email,
        userDisplayName: email,
        attestationType: "none",
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "preferred",
          authenticatorAttachment: "platform", // Supporte FaceID/TouchID/Biométrie native
        },
      });

      // Store challenge in Firestore to verify later
      await db.collection('challenges').doc(userId).set({
        challenge: options.challenge,
        createdAt: FieldValue.serverTimestamp()
      });

      res.status(200).json(options);
    } catch (error: any) {
      console.error("API Register Options Error:", error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  // VERIFY REGISTRATION
  app.post('/api/verify-registration', async (req, res) => {
    try {
      const { userId, registrationResponse } = req.body;
      if (!userId || !registrationResponse) {
        return res.status(400).json({ error: "userId and registrationResponse are required" });
      }

      const rpID = getRpID(req);
      const origin = `${req.protocol}://${req.get('host')}`;

      // Get stored challenge
      const challengeDoc = await db.collection('challenges').doc(userId).get();
      if (!challengeDoc.exists) {
        return res.status(400).json({ error: "No registration challenge found for this user" });
      }

      const expectedChallenge = challengeDoc.data()?.challenge;

      const verification = await verifyRegistrationResponse({
        response: registrationResponse,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });

      if (verification.verified && verification.registrationInfo) {
        const regInfo = verification.registrationInfo as any;
        const credentialID = regInfo.credentialID;
        const credentialPublicKey = regInfo.credentialPublicKey;
        const counter = regInfo.counter;

        // Store credential in Firestore
        const passkey = {
          credentialID: Buffer.from(credentialID).toString('base64url'),
          credentialPublicKey: Buffer.from(credentialPublicKey).toString('base64url'),
          counter,
          transports: registrationResponse.response.transports,
          createdAt: new Date(),
        };

        await db.collection('users').doc(userId).collection('passkeys').doc(passkey.credentialID).set(passkey);
        
        // Mark user as having passkey enabled
        await db.collection('users').doc(userId).update({ isPasskeyEnabled: true });

        // Cleanup challenge
        await db.collection('challenges').doc(userId).delete();

        res.status(200).json({ verified: true });
      } else {
        res.status(400).json({ verified: false, error: "Verification failed" });
      }
    } catch (error: any) {
      console.error("API Verify Registration Error:", error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  // AUTHENTICATION OPTIONS
  app.post('/api/login-options', async (req, res) => {
    try {
      const { email } = req.body; // Can be optional if we want to support userless login
      
      const rpID = getRpID(req);
      
      const options = await generateAuthenticationOptions({
        rpID: rpID,
        userVerification: "preferred",
      });

      // We need a way to track this challenge. Since we don't know the user yet
      // we'll use a temporary session-like ID or just store it by challenge string
      // For simplicity in this demo environment, we'll store it in a generic 'auth_challenges' collection
      await db.collection('auth_challenges').doc(options.challenge).set({
        challenge: options.challenge,
        createdAt: FieldValue.serverTimestamp()
      });

      res.status(200).json(options);
    } catch (error: any) {
      console.error("API Login Options Error:", error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  // VERIFY AUTHENTICATION
  app.post('/api/verify-authentication', async (req, res) => {
    try {
      const { authenticationResponse } = req.body;
      const rpID = getRpID(req);
      const origin = `${req.protocol}://${req.get('host')}`;

      // Find challenge in Firestore
      const challengeDoc = await db.collection('auth_challenges').doc(authenticationResponse.response.challenge).get();
      if (!challengeDoc.exists) {
        return res.status(400).json({ error: "Session expired or invalid challenge" });
      }

      const expectedChallenge = challengeDoc.data()?.challenge;

      // Find the credential in Firestore across all users
      // This is a bit expensive, but standard for "userless" login
      const credentialID = authenticationResponse.id;
      const passkeyQuery = await db.collectionGroup('passkeys').where('credentialID', '==', credentialID).get();
      
      if (passkeyQuery.empty) {
        return res.status(400).json({ error: "Credential not found" });
      }

      const passkeyDoc = passkeyQuery.docs[0];
      const passkeyData = passkeyDoc.data();
      const userDoc = passkeyDoc.ref.parent.parent!;

      const verification = await verifyAuthenticationResponse({
        response: authenticationResponse,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: Buffer.from(passkeyData.credentialID, 'base64url'),
          publicKey: Buffer.from(passkeyData.credentialPublicKey, 'base64url'),
          counter: passkeyData.counter,
          transports: passkeyData.transports,
        },
      } as any);

      if (verification.verified) {
        // Update counter
        await passkeyDoc.ref.update({ counter: verification.authenticationInfo.newCounter });
        
        // Cleanup challenge
        await db.collection('auth_challenges').doc(expectedChallenge).delete();

        // Generate Firebase custom token
        const customToken = await authAdmin.createCustomToken(userDoc.id);

        res.status(200).json({ 
          verified: true, 
          customToken 
        });
      } else {
        res.status(400).json({ verified: false, error: "Verification failed" });
      }
    } catch (error: any) {
      console.error("API Verify Authentication Error:", error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
