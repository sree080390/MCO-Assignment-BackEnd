// 1. Load Fastify (web framework) and Node's built-in SQLite module
const fastify = require('fastify')({ logger: true });
const { DatabaseSync } = require('node:sqlite');

// 2. Open (or create) the database file. Path comes from an env var, so it can point to a volume in a container
const db = new DatabaseSync(process.env.DB_PATH || 'app.db');

// 3. Create tables on startup, only if they don't exist yet
db.exec(`
  CREATE TABLE IF NOT EXISTS greeting (id INTEGER PRIMARY KEY, text TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS message  (id INTEGER PRIMARY KEY, text TEXT NOT NULL);
  INSERT OR IGNORE INTO greeting (id, text) VALUES (1, 'Hello World from the database (SQLite)');
  INSERT OR IGNORE INTO message  (id, text) VALUES (1, 'Edit me from the frontend');
`);

// 4. Hello World from the backend
fastify.get('/api/hello', async () => {
  return { message: 'Hello World from the backend API (Fastify)' };
});

// 5. Hello World from the database (reads a row from SQLite)
fastify.get('/api/db/hello', async () => {
  const row = db.prepare('SELECT text FROM greeting WHERE id = 1').get();
  return { message: row.text };
});

// 6. CRUD flow: read the editable message
fastify.get('/api/message', async () => {
  const row = db.prepare('SELECT text FROM message WHERE id = 1').get();
  return { text: row.text };
});

// 7. CRUD flow: update the editable message
fastify.put('/api/message', async (request, reply) => {
  const text = request.body && request.body.text;
  if (!text || !text.trim()) {
    return reply.code(400).send({ error: 'text is required' });
  }
  db.prepare('UPDATE message SET text = ? WHERE id = 1').run(text.trim());
  return { text: text.trim() };
});

// 8. Health check (used later by Podman/Kubernetes)
fastify.get('/healthz', async () => ({ status: 'ok' }));

// 9. Start the server. 0.0.0.0 makes it reachable from outside a container too
fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});