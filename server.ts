import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'database.sqlite'));

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    current_level INTEGER DEFAULT 1,
    stars INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    role TEXT,
    content TEXT,
    level INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // API Routes
  app.get('/api/user/:username', (req, res) => {
    try {
      const { username } = req.params;
      let user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
      
      if (!user) {
        const info = db.prepare('INSERT INTO users (username) VALUES (?)').run(username);
        user = { id: info.lastInsertRowid, username, current_level: 1, stars: 0 };
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error in /api/user/:username:", error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/user/progress', (req, res) => {
    try {
      const { username, level, stars } = req.body;
      db.prepare('UPDATE users SET current_level = ?, stars = stars + ? WHERE username = ?')
        .run(level, stars, username);
      res.json({ success: true });
    } catch (error) {
      console.error("Error in /api/user/progress:", error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/messages/:username/:level', (req, res) => {
    try {
      const { username, level } = req.params;
      const messages = db.prepare(`
        SELECT m.* FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE u.username = ? AND m.level = ?
        ORDER BY m.timestamp ASC
      `).all(username, level);
      res.json(messages);
    } catch (error) {
      console.error("Error in /api/messages/:username/:level:", error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/messages', (req, res) => {
    try {
      const { username, role, content, level } = req.body;
      const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
      if (user) {
        db.prepare('INSERT INTO messages (user_id, role, content, level) VALUES (?, ?, ?, ?)')
          .run(user.id, role, content, level);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      console.error("Error in /api/messages:", error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
