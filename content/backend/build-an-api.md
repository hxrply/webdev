Time to build the other half. This lesson walks through a complete CRUD API in Express — routes, middleware, validation, errors and a database.

# Express in ten lines

```bash
npm init -y
npm install express
```

```js
import express from 'express';

const app = express();
app.use(express.json());              // parse JSON request bodies

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.listen(3000, () => console.log('Listening on http://localhost:3000'));
```

```bash
curl http://localhost:3000/api/health
```

:::gotcha Forgetting express.json()
Without `app.use(express.json())`, `req.body` is `undefined` on every POST, and you'll spend twenty minutes convinced your client is broken. It's the single most common Express beginner bug.
:::

# Routing

```js
app.get('/api/tasks', listTasks);
app.post('/api/tasks', createTask);
app.get('/api/tasks/:id', getTask);        // :id is a route parameter
app.patch('/api/tasks/:id', updateTask);
app.delete('/api/tasks/:id', deleteTask);
```

Three places data arrives from:

```js
app.get('/api/tasks/:id', (req, res) => {
  req.params.id;          // '/api/tasks/42'        → '42'  (always a string)
  req.query.status;       // '?status=done&page=2'  → 'done'
  req.body;               // the parsed JSON body (POST/PATCH/PUT)
  req.headers.authorization;
});
```

Route order matters — Express matches top to bottom, first match wins:

```js
app.get('/api/tasks/new', ...);     // must come BEFORE /:id
app.get('/api/tasks/:id', ...);     // otherwise this matches 'new' as an id
```

# A complete CRUD resource

```js
import express from 'express';
import Database from 'better-sqlite3';

const db = new Database('tasks.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT    NOT NULL,
    done       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`);

const app = express();
app.use(express.json());

// ---- List, with filtering and pagination -------------------------------
app.get('/api/tasks', (req, res) => {
  const limit  = Math.min(Number(req.query.limit) || 20, 100);   // cap it
  const offset = Number(req.query.offset) || 0;
  const done   = req.query.done;

  let sql = 'SELECT id, title, done, created_at FROM tasks';
  const params = [];

  if (done === 'true' || done === 'false') {
    sql += ' WHERE done = ?';
    params.push(done === 'true' ? 1 : 0);
  }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const tasks = db.prepare(sql).all(...params);          // parameterised
  const { total } = db.prepare('SELECT COUNT(*) AS total FROM tasks').get();

  res.json({ data: tasks, meta: { total, limit, offset } });
});

// ---- Read one ----------------------------------------------------------
app.get('/api/tasks/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json({ data: task });
});

// ---- Create ------------------------------------------------------------
app.post('/api/tasks', (req, res) => {
  const { title } = req.body ?? {};

  if (typeof title !== 'string' || title.trim().length === 0) {
    return res.status(422).json({
      error: 'Validation failed',
      details: { title: 'Title is required and must be a non-empty string' }
    });
  }
  if (title.length > 200) {
    return res.status(422).json({ error: 'Validation failed',
      details: { title: 'Maximum 200 characters' } });
  }

  const info = db.prepare('INSERT INTO tasks (title) VALUES (?)').run(title.trim());
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid);

  res.status(201)
     .location(`/api/tasks/${task.id}`)
     .json({ data: task });
});

// ---- Update ------------------------------------------------------------
app.patch('/api/tasks/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Task not found' });

  const title = req.body?.title ?? existing.title;
  const done  = req.body?.done  ?? existing.done;

  db.prepare('UPDATE tasks SET title = ?, done = ? WHERE id = ?')
    .run(title, done ? 1 : 0, req.params.id);

  res.json({ data: db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) });
});

// ---- Delete ------------------------------------------------------------
app.delete('/api/tasks/:id', (req, res) => {
  const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Task not found' });
  res.status(204).end();                 // 204 = success, no body
});

app.listen(3000, () => console.log('http://localhost:3000'));
```

Test it:

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Express"}'

curl http://localhost:3000/api/tasks
curl -X PATCH http://localhost:3000/api/tasks/1 -H "Content-Type: application/json" -d '{"done":true}'
curl -X DELETE http://localhost:3000/api/tasks/1 -i
```

# Middleware

Middleware are functions that run **between** the request arriving and your handler. They receive `(req, res, next)` and either respond or call `next()`.

```js
// Logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

// Authentication — applied to specific routes
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  const user = verifyToken(token);
  if (!user) return res.status(401).json({ error: 'Invalid token' });

  req.user = user;              // hand data to the next handler
  next();
}

app.delete('/api/tasks/:id', requireAuth, deleteTask);
```

Order matters: middleware runs in the order registered, so logging goes first and error handling goes last.

:::gotcha Forgetting `next()`
A middleware that neither responds nor calls `next()` leaves the request hanging until the client times out — no error, no log, just silence. If requests mysteriously never complete, look for a missing `next()`.
:::

# Error handling

```js
// A helper so handlers can just throw
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Async handlers must forward errors to Express
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

app.get('/api/tasks/:id', asyncHandler(async (req, res) => {
  const task = await findTask(req.params.id);
  if (!task) throw new HttpError(404, 'Task not found');
  res.json({ data: task });
}));

// 404 for unmatched routes — after all other routes
app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
});

// The error handler — FOUR arguments is what marks it as one
app.use((err, req, res, next) => {
  const status = err.status ?? 500;

  if (status >= 500) console.error(err);     // log the real error server-side

  res.status(status).json({
    error: status >= 500 ? 'Internal server error' : err.message,
    details: err.details,
    // never leak err.stack to clients in production
  });
});
```

:::warn Express 4 doesn't catch async errors
```js
app.get('/x', async (req, res) => { throw new Error('boom'); });   // hangs forever
```
A rejected promise in an async handler is invisible to Express 4 — the request never completes. Wrap handlers (`asyncHandler` above) or use the `express-async-errors` package. Express 5 fixes this natively.
:::

# Serving static files and CORS

```js
app.use(express.static('public'));          // serve public/ at /

import cors from 'cors';
app.use(cors({ origin: 'https://myapp.com', credentials: true }));
```

`cors()` with no options allows every origin — fine for a public read-only API, wrong for anything with credentials.

# Structure that survives growth

```text
src/
├── server.js          ← create the app, start listening
├── routes/
│   ├── tasks.js       ← express.Router() per resource
│   └── users.js
├── controllers/       ← request/response handling
├── services/          ← business logic (no req/res in here)
├── db/
│   ├── index.js
│   └── migrations/
└── middleware/
```

```js
// routes/tasks.js
import { Router } from 'express';
const router = Router();
router.get('/', listTasks);
router.post('/', createTask);
export default router;

// server.js
import tasksRouter from './routes/tasks.js';
app.use('/api/tasks', tasksRouter);
```

The valuable rule: **keep business logic out of route handlers.** A service function that takes plain data and returns plain data can be tested without HTTP, reused from a CLI or a job queue, and read without thinking about Express.

# Alternatives to Express

| Framework | Character |
|---|---|
| **Express** | The default. Enormous ecosystem, minimal opinions |
| **Fastify** | Faster, schema-based validation, async-native |
| **Hono** | Tiny; runs on Node, Bun, Deno and edge runtimes |
| **NestJS** | Heavily structured, Angular-like, good for large teams |
| **Next.js / SvelteKit** | Full-stack — API routes alongside your front end |

Learn Express first; its concepts (routing, middleware, handlers) transfer directly to all of them.

:::quiz
? `req.body` is undefined on every POST. What's missing?
- A Content-Type header
- `app.use(express.json())` *
- An async handler
- CORS
> Express doesn't parse bodies by default.

? What marks a function as an Express error handler?
- Naming it errorHandler
- Registering it with app.error()
- Taking four arguments: (err, req, res, next) *
- Throwing inside it
> And it must be registered after all routes.

? A middleware doesn't call `next()` or respond. What happens?
- Express skips it
- The request hangs until the client times out *
- An error is thrown
- The next middleware runs anyway
> Silent hangs are the symptom of a forgotten `next()`.

? Which status code fits a successful DELETE with no response body?
- 200
- 201
- 204 *
- 404
> 201 is for creation, with a Location header.

? Why cap `limit` with `Math.min(limit, 100)`?
- To reduce database size
- So a client can't request a million rows and exhaust the server *
- It's required by REST
- To enable caching
> Any unbounded list endpoint is an availability risk.

? Where should business logic live?
- In route handlers
- In service functions that know nothing about req and res *
- In middleware
- In the database only
> Testable, reusable, and readable without Express in your head.
:::

:::exercise Build the API
Build a complete `/api/notes` resource with SQLite:

1. All five CRUD routes, with proper status codes (200, 201, 204, 404, 422).
2. Validation: title required, 1–200 chars; body optional, max 10,000.
3. Pagination with a capped `limit`, plus a `?search=` filter using `LIKE` — parameterised.
4. A request-logging middleware and a central error handler.
5. An `asyncHandler` wrapper, with at least one async route.
6. Test every endpoint with `curl`, including the failure cases.
:::
