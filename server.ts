
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/test', async (req, res) => {
    try {
      const module = await import('./api/test.js');
      return module.default(req, res);
    } catch (error) {
      res.status(500).json({ error: 'Failed to load test handler' });
    }
  });

  app.get('/api/register', async (req, res) => {
    try {
      const module = await import('./api/register.js');
      return module.default(req, res);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to load register handler' });
    }
  });

  app.get('/api/login-options', async (req, res) => {
    try {
      const module = await import('./api/login-options.js');
      return module.default(req, res);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to load login-options handler' });
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
