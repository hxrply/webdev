Node.js runs JavaScript outside the browser. That one change — the same language on the server — is why JavaScript went from "the thing that makes menus drop down" to running entire backends.

# What Node gives you

Node is the V8 engine (Chrome's JavaScript engine) plus APIs the browser doesn't have:

```js
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';

const text = await fs.readFile('data.json', 'utf8');   // the file system
console.log(process.env.DATABASE_URL);                  // environment variables
console.log(process.argv);                              // command-line arguments
```

And it lacks things the browser has: no `document`, no `window`, no `localStorage`. Code that touches the DOM cannot run in Node, and vice versa for `fs`.

```bash
node --version
node script.js           # run a file
node                     # interactive REPL
node --watch server.js   # restart on file changes (built in since Node 18)
```

# npm and package.json

npm is the package registry (over two million packages) and the CLI that installs them.

```bash
npm init -y              # create package.json
npm install express      # add a dependency
npm install -D vitest    # a dev-only dependency
npm install              # install everything package.json lists
npm run dev              # run a script
npm update               # update within your version ranges
npm uninstall express
```

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node --watch server.js",
    "start": "node server.js",
    "test": "vitest",
    "lint": "eslint .",
    "build": "vite build"
  },
  "dependencies": {
    "express": "^4.19.2"
  },
  "devDependencies": {
    "vitest": "^2.0.0"
  }
}
```

`"type": "module"` makes `import`/`export` the default. Without it, Node treats `.js` files as CommonJS (`require`).

# Semantic versioning

```text
  ^4.19.2
  │ │  │ └─ patch: bug fixes
  │ │  └─── minor: new features, backwards compatible
  │ └────── major: breaking changes
  └──────── range specifier
```

| Range | Accepts |
|---|---|
| `^4.19.2` | ≥ 4.19.2 and < 5.0.0 (minor + patch) — the default |
| `~4.19.2` | ≥ 4.19.2 and < 4.20.0 (patch only) |
| `4.19.2` | exactly this |
| `*` | anything — don't |

:::warn Commit your lockfile
`package-lock.json` records the *exact* version of every package, including transitive dependencies. Without it, two developers running `npm install` a week apart can get different code, and "works on my machine" becomes literal.

Commit it. In CI use `npm ci`, which installs exactly the lockfile and fails if it disagrees with `package.json`.
:::

# node_modules and dependency hygiene

`node_modules` is generated — always in `.gitignore`, never committed. It can be enormous, because dependencies have dependencies.

That depth is also a risk. Before adding a package, ask:

- **Do I need it?** `left-pad` was famously 11 lines. `String.prototype.padStart` exists now.
- **Is it maintained?** Check the last publish date and open issues.
- **How heavy is it?** Use bundlephobia.com for front-end packages.
- **How many dependencies does it drag in?**

```bash
npm audit                # known vulnerabilities
npm audit fix
npm ls express           # why is this installed, and which version?
npx depcheck             # find unused dependencies
```

:::note npx
`npx` runs a package without installing it permanently:
```bash
npx create-vite@latest my-app
npx serve
```
Useful for one-off tools. Be aware you're executing code from the internet — check the package name carefully, as typosquatting is a real attack.
:::

# Reading and writing files

```js
import fs from 'node:fs/promises';

// Read
const config = JSON.parse(await fs.readFile('config.json', 'utf8'));

// Write
await fs.writeFile('output.txt', 'Hello\n');
await fs.appendFile('log.txt', `${new Date().toISOString()} started\n`);

// Directories
const files = await fs.readdir('./src');
await fs.mkdir('./dist', { recursive: true });

// Does it exist?
try { await fs.access('config.json'); } catch { console.log('no config'); }

// Large files: stream instead of loading into memory
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

const rl = createInterface({ input: createReadStream('huge.csv') });
for await (const line of rl) { /* one line at a time */ }
```

Always use the promise-based API (`node:fs/promises`). The synchronous versions (`readFileSync`) block the entire event loop — acceptable at startup, disastrous in a request handler.

# Paths

```js
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));   // ESM equivalent

path.join(__dirname, 'data', 'users.json');   // handles / vs \ correctly
path.resolve('./config.json');                 // absolute path
path.extname('photo.jpg');                     // '.jpg'
```

:::gotcha Relative paths resolve from the working directory
`fs.readFile('data.json')` looks in wherever the process was *started*, not next to your script. Run the same app from a different folder and it breaks. Always build paths from `__dirname` (or `import.meta.url`).
:::

# Environment variables

```js
const port = process.env.PORT || 3000;
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('DATABASE_URL is required');
  process.exit(1);           // fail loudly at startup, not mysteriously later
}
```

```bash
# .env — never committed
DATABASE_URL=postgres://localhost/myapp
SESSION_SECRET=a-long-random-string
```

Node 20.6+ loads it natively: `node --env-file=.env server.js`. Otherwise use the `dotenv` package.

**Configuration that differs between environments, and anything secret, belongs in environment variables** — not in the code, not in the repo.

# A first server, with no dependencies

```js
import http from 'node:http';

const server = http.createServer(async (req, res) => {
  if (req.url === '/api/time' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ now: new Date().toISOString() }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(3000, () => console.log('http://localhost:3000'));
```

```bash
node --watch server.js
curl http://localhost:3000/api/time
```

That's a working HTTP server in twelve lines with nothing installed. Express, covered next, adds routing, middleware and body parsing on top of exactly this.

# Being a good CLI citizen

```js
// Exit codes matter — 0 success, non-zero failure. CI depends on this.
process.exit(1);

// Graceful shutdown: finish in-flight requests before dying
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

// Don't leave these unhandled
process.on('unhandledRejection', (err) => { console.error(err); process.exit(1); });
```

:::quiz
? What does `"type": "module"` in package.json do?
- Marks the package as a library
- Makes Node treat .js files as ES modules, enabling import/export *
- Enables TypeScript
- Installs a module bundler
> Without it, `.js` is CommonJS and `import` throws.

? Why commit package-lock.json?
- It speeds up installs
- It pins exact versions of every dependency so installs are reproducible *
- npm requires it
- It documents the API
> Use `npm ci` in CI to install exactly what it specifies.

? `^4.19.2` allows which upgrade?
- 5.0.0
- 4.20.0 *
- 3.9.0
- Only 4.19.2
> Caret allows minor and patch; tilde allows patch only.

? Why avoid `fs.readFileSync` inside a request handler?
- It's deprecated
- It blocks the event loop, so the server can't handle anything else meanwhile *
- It can't read JSON
- It needs a callback
> Synchronous I/O at startup is fine; in a hot path it destroys concurrency.

? `fs.readFile('data.json')` fails when the app is started from another folder. Why?
- The file is missing
- Relative paths resolve from the process's working directory, not the script's location *
- Node caches paths
- JSON files need an absolute path
> Build the path from `import.meta.url` or `__dirname`.

? Where should a database password live?
- In config.js
- In package.json
- In an environment variable, with the .env file gitignored *
- In a comment
> Configuration that varies by environment, and anything secret, stays out of the repo.
:::

:::exercise Build a small CLI
Write a Node script that reads a JSON file of tasks, accepts a command-line argument (`add`, `list`, `done`), and writes the file back.

```bash
node tasks.js add "Learn Node"
node tasks.js list
node tasks.js done 1
```

Requirements: resolve the file path relative to the script, use `fs/promises`, handle a missing file by starting with an empty list, and exit with code 1 and a helpful message on invalid input.
:::
