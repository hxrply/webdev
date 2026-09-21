"Front end", "back end", "full stack" — the terms get thrown around as if they were job titles handed down from on high. They are really just descriptions of *where code runs*.

# The dividing line

The line is the network. Code on the user's device is front end; code on your machines is back end.

```text
   BROWSER (the user's device)          │            SERVER (yours)
 ───────────────────────────────────────┼──────────────────────────────────────
   HTML, CSS, JavaScript                │   Node / Python / Ruby / Go / PHP / Java
   Rendering, clicks, animations        │   Business rules, authentication
   Form validation (for convenience)    │   Form validation (for real)
   Everything is visible to the user    │   Nothing is visible unless you send it
                                        │   Database lives back here
```

# What the front end is responsible for

- **Structure and presentation.** The markup and styles that make an interface.
- **Interaction.** Clicks, typing, drag and drop, keyboard support.
- **Fetching data** from the back end and displaying it.
- **Perceived speed.** Loading states, optimistic updates, not blocking the main thread.
- **Accessibility.** Whether the product works for someone using a screen reader or keyboard alone.

# What the back end is responsible for

- **Truth.** The canonical, authoritative version of the data.
- **Authentication and authorisation.** Who you are; what you may do.
- **Business logic.** Pricing rules, permissions, workflows.
- **Persistence.** Reading and writing the database.
- **Integrations.** Payment providers, email, third-party APIs (with the secret keys).

:::warn The rule that makes this concrete
**Client-side validation is a courtesy. Server-side validation is security.**

A friendly "please enter a valid email" in the browser is good UX. But anyone can open DevTools, or use `curl`, and send whatever they like straight to your API, skipping your page entirely. If the server does not re-check every rule, your rules do not exist.
:::

# How they talk

Mostly by sending JSON over HTTP. The front end asks, the back end answers:

```js
// Front end: ask the server for tasks
const response = await fetch('/api/tasks');
const tasks = await response.json();
// tasks is now a plain JavaScript array, e.g.
// [{ id: 1, title: 'Learn HTTP', done: true }, ...]
```

```js
// Back end (Node + Express): answer
app.get('/api/tasks', async (req, res) => {
  const tasks = await db.query('SELECT id, title, done FROM tasks WHERE user_id = ?', [req.user.id]);
  res.json(tasks);
});
```

Note what the back end did there that the front end *could not be trusted to do*: it filtered by `req.user.id`. If it accepted a user id from the browser, anyone could read anyone else's tasks by changing a number.

# Rendering strategies

Where does the HTML get built? There are three common answers, and the industry has swung between them for twenty years.

| Strategy | HTML built… | Good at | Trade-off |
|---|---|---|---|
| **Static (SSG)** | Ahead of time, at build | Speed, cost, reliability | Content only changes on rebuild |
| **Server-rendered (SSR)** | Per request, on the server | Fresh, personalised, SEO-friendly, fast first paint | Server does more work |
| **Client-rendered (SPA)** | In the browser, by JavaScript | Rich app-like interaction | Slower first load; breaks without JS |

Real applications mix them: a static marketing page, a server-rendered product listing, and a client-rendered checkout, all in one product. Modern frameworks (Next.js, Astro, Remix, SvelteKit) exist largely to let you choose per page.

# The rest of the stack

Beyond "front" and "back" there is a supporting cast you will meet:

- **Database** — where data lives. Relational (PostgreSQL, MySQL, SQLite) or document (MongoDB). You'll spend a whole track on SQL.
- **Cache** — a fast layer (Redis, or the browser's own cache) that avoids repeating expensive work.
- **CDN** — servers distributed worldwide that hold copies of your static files close to users.
- **Reverse proxy / load balancer** — (nginx, Caddy) sits in front, terminates HTTPS, spreads traffic across servers.
- **Build tools** — (Vite, esbuild) bundle and optimise your front-end code before shipping.
- **CI/CD** — automation that tests and deploys your code when you push.

:::note "Full stack" in practice
It doesn't mean expert at everything. It means you can follow a feature all the way through: markup → styles → client logic → API → database → deploy. That trail is exactly what this course walks.
:::

# So where should a piece of logic live?

A decision guide you can actually use:

- Does it need a **secret** (API key, DB password)? → Back end. Always.
- Can a malicious user cause harm by skipping it? → Back end (front end too, for UX).
- Does it need to be **the same for everyone**, permanently? → Back end.
- Is it purely about **how things look or feel**? → Front end.
- Does it need to be **instant**, with no network round-trip? → Front end, then confirm with the back end.

:::quiz
? A user changes the `price` field in DevTools before submitting an order. What should happen?
- The order goes through at the edited price
- The server recalculates the price from its own data and ignores the client's *
- The browser prevents editing the DOM
- The order fails with a JavaScript error
> Never trust a number that came from the browser. The server owns the truth about prices.

? Which belongs on the back end?
- A dropdown animation
- Deciding whether this user may view this document *
- Highlighting the active nav link
- Showing a spinner while data loads
> Authorisation decisions must be made where the user cannot tamper with them.

? What is the main trade-off of a pure client-rendered SPA?
- It cannot use CSS
- It cannot talk to a database
- Slower initial load and reliance on JavaScript running successfully *
- It only works on mobile
> The browser has to download and execute JS before anything appears, which delays first paint.

? Why does client-side form validation still have value if the server re-checks anyway?
- It makes the server code shorter
- Instant feedback is better UX and saves a wasted round trip *
- It prevents SQL injection
- It is required by HTML
> It's for humans, not for security. Both layers do the same checks for different reasons.
:::

:::exercise Sort the responsibilities
For a photo-sharing app, decide where each belongs — front end, back end, or both:

1. Cropping the preview while a user drags the crop handles
2. Checking the uploaded file is really an image
3. Showing "3 likes" under a photo
4. Deciding whether a private photo may be shown to this viewer
5. Resizing the uploaded image to thumbnails
6. Remembering the user's dark-mode preference

(Answers: 1 front; 2 back — a file can be renamed to `.jpg`; 3 both — server supplies, client displays; 4 back, absolutely; 5 back; 6 front is fine, back if it must follow them across devices.)
:::
