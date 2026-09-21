A project on your laptop isn't real yet. Deploying is how it becomes something you can send a link to — and it's far easier than it was a decade ago.

# Static sites: the easy case

If your project is HTML, CSS and JavaScript with no server code, you have excellent free options:

| Host | Notes |
|---|---|
| **GitHub Pages** | Free, deploys from a repo, custom domains, HTTPS included |
| **Netlify** | Drag-and-drop or git-connected, build pipeline, forms, redirects |
| **Vercel** | Similar; excellent for Next.js |
| **Cloudflare Pages** | Free, very fast global CDN |

GitHub Pages in four steps:

1. Push your project to a GitHub repository.
2. Settings → Pages → Source: `main` branch, `/` root.
3. Wait a minute.
4. It's live at `https://username.github.io/repo-name/`.

:::tip This very site is a static site
Everything you're reading is HTML, CSS, JavaScript and Markdown files — no server, no build step. It can be deployed to any of the above by pushing the folder. That's a deliberate property worth designing for: static sites are cheap, fast, and almost impossible to break.
:::

Note the subpath: `https://username.github.io/repo-name/`. Root-relative paths like `/css/style.css` will 404 there, because `/` is the top of the *domain*, not your project. Use relative paths (`css/style.css`) or set a base path in your build tool.

# Applications with a server

You need somewhere that runs Node continuously.

| Platform | Character |
|---|---|
| **Render**, **Railway**, **Fly.io** | Push-to-deploy, managed, generous free/cheap tiers. Start here. |
| **Vercel / Netlify functions** | Serverless — per-request functions, scale to zero, cold starts |
| **DigitalOcean / Hetzner VPS** | A real machine you administer. Cheap, educational, more work |
| **AWS / GCP / Azure** | Everything, plus the complexity of everything |

For a first deployment, a managed platform is the right answer. You connect a repository, set environment variables, and it builds and runs on every push.

```json
{
  "scripts": {
    "start": "node src/server.js",
    "build": "vite build"
  },
  "engines": { "node": ">=22" }
}
```

```js
// Bind to the platform's port and to all interfaces
const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => console.log(`Listening on ${port}`));
```

:::gotcha The two deployment classics
1. **Hard-coded port.** Platforms inject `PORT`. Ignore it and your app binds to 3000, the platform routes to something else, and health checks fail.
2. **Listening on `localhost` only.** Inside a container, `127.0.0.1` is unreachable from outside. Bind `0.0.0.0`.
:::

# Environments and configuration

```text
development  → your laptop, test data, verbose errors
staging      → a production-like copy for final checks
production   → real users, real data
```

Everything that differs between them lives in **environment variables**:

```bash
NODE_ENV=production
DATABASE_URL=postgres://…
SESSION_SECRET=…
STRIPE_SECRET_KEY=…
```

Set these in the platform's dashboard or secret manager. Never in the repository. And validate them at startup:

```js
const required = ['DATABASE_URL', 'SESSION_SECRET'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(', ')}`);
  process.exit(1);
}
```

Failing loudly at boot beats a confusing error on the first user request at 2am.

# Databases in production

- **Use a managed database.** Neon, Supabase, PlanetScale, Render Postgres, RDS. Backups, patching and failover are someone else's job, which is worth the money.
- **Run migrations as part of deployment**, before the new code starts serving.
- **SQLite can work in production** for single-server, read-heavy applications — but its file must survive restarts, which rules out most container platforms unless you attach a persistent volume (Fly.io and Litestream are a popular combination).
- **Back up, and test restoring.** An untested backup is a guess.

# Domains and HTTPS

1. Buy a domain (Namecheap, Cloudflare, Porkbun — roughly £10/year).
2. Point DNS at your host: an `A` record to an IP, or a `CNAME` to their hostname.
3. Add the domain in your host's dashboard.
4. HTTPS is automatic on every platform listed above (Let's Encrypt).

DNS changes propagate in minutes to hours. If it doesn't work immediately, wait before debugging.

# Continuous deployment

```yaml
# .github/workflows/deploy.yml
name: CI/CD
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm test

  deploy:
    needs: test                 # only if tests pass
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: curl -X POST "$DEPLOY_HOOK"
        env:
          DEPLOY_HOOK: ${{ secrets.RENDER_DEPLOY_HOOK }}
```

The principle: **merging to `main` deploys, but only if the tests pass.** That one rule prevents an entire category of incident.

# Deployment strategies

| Strategy | How |
|---|---|
| **Rolling** | Replace instances a few at a time. The default on most platforms |
| **Blue-green** | Run the new version alongside, switch traffic, keep the old one ready to switch back |
| **Canary** | Send 5% of traffic to the new version, watch, then increase |

All three exist to make **rollback fast**. That's the property that matters: not avoiding bad deploys, but recovering from them in seconds.

# After it's live

You can't fix what you can't see:

- **Error tracking** — Sentry or similar. It tells you a user hit an exception before they email you, with a stack trace and context.
- **Uptime monitoring** — Better Stack, UptimeRobot. A request every minute, an alert when it fails.
- **Logs** — structured (JSON), with a request id, aggregated somewhere searchable.
- **A health endpoint** — `/healthz` that checks the database connection, for the platform's load balancer.
- **Analytics** — privacy-respecting options (Plausible, Fathom) avoid the cookie banner entirely.

```js
app.get('/healthz', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', version: process.env.GIT_SHA });
  } catch (err) {
    res.status(503).json({ status: 'degraded' });
  }
});
```

# A pre-launch checklist

- [ ] No secrets in the repository or its history
- [ ] Environment variables set and validated at startup
- [ ] HTTPS, with HTTP redirecting to it
- [ ] Security headers (`helmet` or equivalent)
- [ ] Database backups configured **and a restore tested**
- [ ] Error tracking and uptime monitoring wired up
- [ ] A custom 404 and 500 page
- [ ] Rate limiting on auth endpoints
- [ ] `robots.txt` and a sitemap
- [ ] Open Graph tags (check how the link looks when shared)
- [ ] Lighthouse run on the production URL
- [ ] Tested on a real phone
- [ ] Tested with a keyboard only
- [ ] A rollback plan you've actually rehearsed

:::warn Deploy on a Tuesday morning
Not Friday at 5pm. If something breaks — and eventually something will — you want the whole team awake and the whole week available. This is not superstition; it's the accumulated experience of everyone who has spent a weekend fixing a Friday deploy.
:::

:::quiz
? Your Node app works locally but the platform reports it as unhealthy. Likely cause?
- Missing dependencies
- Hard-coded port instead of `process.env.PORT`, or binding to localhost *
- No HTTPS
- Wrong Node version
> Both are the classic first-deployment failures.

? Where should production secrets live?
- In a committed config file
- In the platform's environment variables or secret manager *
- In package.json
- Hard-coded, but minified
> Anything in the repo is in the history, on every clone, forever.

? Why do root-relative paths break on GitHub Pages project sites?
- Pages doesn't support CSS
- The site is served from a subpath, so `/css/x.css` resolves to the domain root *
- HTTPS rewrites them
- They need a build step
> Use relative paths or configure a base path.

? What is the main purpose of blue-green deployment?
- Lower cost
- Fast rollback by switching traffic back to the previous version *
- Faster builds
- Better SEO
> Recovery speed matters more than deploy perfection.

? What makes a backup trustworthy?
- Its frequency
- Having tested a restore from it *
- Storing it offsite
- Encrypting it
> Every other property is irrelevant if the restore fails.

? Why gate deployment behind tests in CI?
- It's faster
- It prevents merging to main from shipping broken code *
- It reduces build minutes
- It's required by GitHub
> The single highest-value automation rule you can adopt.
:::

:::exercise Deploy something today
Take any project — even a single HTML page — and put it on the internet:

1. Push it to GitHub.
2. Enable GitHub Pages and confirm the live URL works.
3. Fix any broken paths (this is where root-relative paths bite).
4. Run Lighthouse against the live URL, not localhost.
5. Check how the link previews when you paste it into a chat app — add Open Graph tags if it looks bare.
6. Open it on your phone.

Then, if you have a server-based project, deploy it to Render or Railway with a managed database and a health endpoint.
:::
