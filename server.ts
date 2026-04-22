
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { generateRegistrationOptions, generateAuthenticationOptions } from "@simplewebauthn/server";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Set Permissions-Policy for WebAuthn
  app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'publickey-credentials-create=*, publickey-credentials-get=*');
    next();
  });

  // API Routes
  app.get('/api/test', (req, res) => {
    res.json({ message: "Hello from AmbuFlow API" });
  });

  app.get('/api/register', async (req, res) => {
    try {
      const hostHeader = req.headers.host;
      const host = hostHeader ? hostHeader.split(':')[0] : "localhost";
      const rpID = host;

      console.log(`Generating registration options for rpID: ${rpID}`);

      const options = await generateRegistrationOptions({
        rpName: "AmbuFlow",
        rpID: rpID,
        userID: Buffer.from("1234"),
        userName: "test@ambuflow.com",
        attestationType: "none",
        authenticatorSelection: {
          residentKey: "required",
          userVerification: "preferred",
        },
      });

      res.status(200).json(options);
    } catch (error: any) {
      console.error("API Register Error:", error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  app.get('/api/login-options', async (req, res) => {
    try {
      const hostHeader = req.headers.host;
      const host = hostHeader ? hostHeader.split(':')[0] : "localhost";
      const rpID = host;

      const options = await generateAuthenticationOptions({
        rpID: rpID,
        allowCredentials: [],
        userVerification: "preferred",
      });

      res.status(200).json(options);
    } catch (error: any) {
      console.error("API Login Options Error:", error);
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
