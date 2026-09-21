Authentication is *who are you*. Authorisation is *what may you do*. Getting either wrong is how companies end up in the news, so this lesson is more careful than most.

# Passwords

```js
import bcrypt from 'bcrypt';

// Registering
const hash = await bcrypt.hash(password, 12);      // 12 = cost factor
await db.run('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, hash]);

// Logging in
const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
const ok = user && await bcrypt.compare(password, user.password_hash);
if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
```

The rules, all of which matter:

- **Never store a password.** Store a hash.
- **Never use MD5, SHA-1 or SHA-256** for passwords. They're designed to be *fast*, which is exactly wrong — a GPU tries billions per second. Use a **slow, salted** algorithm: **bcrypt**, **scrypt** or **Argon2id** (the current recommendation).
- **The salt is automatic** in bcrypt — it's embedded in the output hash, so identical passwords produce different hashes and rainbow tables are useless.
- **Cost factor 12+** for bcrypt. Tune it so hashing takes roughly 250ms on your hardware, and raise it as hardware improves.
- **Never log passwords**, even at debug level. They end up in log aggregators forever.

:::warn "Invalid email or password"
Don't say "no such user" for one case and "wrong password" for the other. That difference lets an attacker enumerate which email addresses have accounts — useful for phishing and credential stuffing. Same message, same status, and ideally similar timing (run the bcrypt comparison against a dummy hash even when the user doesn't exist).
:::

## Password policy, per current guidance

NIST's modern advice reverses a lot of what people were taught:

- **Minimum 8 characters, ideally 12+.** Allow at least 64.
- **Allow every character**, including spaces and emoji.
- **Don't force composition rules** ("one uppercase, one symbol"). They produce `Password1!` and nothing else.
- **Don't force periodic rotation** — it produces `Password1`, `Password2`. Rotate only on evidence of compromise.
- **Do check against known-breached password lists** (the Have I Been Pwned API has a k-anonymity mode so you never send the password).

# Sessions vs tokens

Two mainstream approaches, with a genuine trade-off.

## Server sessions (cookie-based)

```js
import session from 'express-session';

app.use(session({
  secret: process.env.SESSION_SECRET,     // long, random, from the environment
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,                        // JavaScript cannot read it
    secure: true,                          // HTTPS only
    sameSite: 'lax',                       // CSRF defence
    maxAge: 1000 * 60 * 60 * 24 * 7        // a week
  },
  store: new RedisStore({ client: redis }) // NOT the default in-memory store
}));

// Log in
req.session.userId = user.id;

// Check
if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });

// Log out — genuinely destroys it server-side
req.session.destroy();
```

The server keeps session state; the cookie holds only an opaque id.

**Good:** revocation is instant, the cookie reveals nothing, the browser handles it automatically, and `HttpOnly` means XSS can't steal it.
**Cost:** the server must store sessions (Redis or a database — never the default in-memory store, which loses everyone's session on restart and breaks with more than one server).

## JWTs

```js
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { sub: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '15m' }
);

const payload = jwt.verify(token, process.env.JWT_SECRET);   // throws if invalid or expired
```

A JWT is three base64 parts — header, payload, signature — where the signature proves the payload wasn't altered.

:::warn A JWT is signed, not encrypted
Anyone holding the token can read its payload. Paste one into jwt.io and you'll see every claim. **Never put anything secret in it.**

And two implementation traps: always specify the expected algorithm on verification (`{ algorithms: ['HS256'] }`) to avoid `alg: none` and algorithm-confusion attacks, and always set an expiry.
:::

**Good:** stateless — any server can verify without a lookup, which suits microservices and third-party APIs.
**Cost:** **you cannot revoke one.** Until it expires, a stolen token works. Logging out only deletes the client's copy. The workarounds — a blocklist, short expiries plus refresh tokens — reintroduce the server state JWTs were supposed to avoid.

:::note Which should you use?
For a normal web application with its own front end: **server sessions in an HttpOnly cookie.** They're simpler, revocable, and the browser does the work.

Reach for JWTs when you genuinely need statelessness: a public API, service-to-service calls, or federated identity. "It scales better" is rarely the real reason — a Redis lookup is sub-millisecond.
:::

## Never store tokens in localStorage

If you do use JWTs in a browser, any XSS on your page reads `localStorage` and exfiltrates the token. An `HttpOnly` cookie cannot be read by JavaScript at all. Store tokens in `HttpOnly; Secure; SameSite` cookies, and pair that with CSRF protection.

# Authorisation

Authentication is the easy half. Authorisation is where most real breaches live.

```js
// ✗ Broken object-level authorisation — the #1 API vulnerability (OWASP API1)
app.get('/api/orders/:id', requireAuth, async (req, res) => {
  const order = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
  res.json(order);                     // ANY logged-in user can read ANY order
});

// ✓ Check ownership
app.get('/api/orders/:id', requireAuth, async (req, res) => {
  const order = await db.get(
    'SELECT * FROM orders WHERE id = ? AND customer_id = ?',
    [req.params.id, req.user.id]
  );
  if (!order) return res.status(404).json({ error: 'Not found' });
  res.json({ data: order });
});
```

Being logged in is not permission to see *everything*. Every single endpoint that touches a record must ask "is this user allowed *this* record?" — and the cheapest way to guarantee it is to make ownership part of the query, as above.

Returning 404 rather than 403 for someone else's resource is also deliberate: 403 confirms the record exists.

```js
// Role checks
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

app.delete('/api/users/:id', requireAuth, requireRole('admin'), deleteUser);
```

# Other essentials

```js
// Rate-limit authentication endpoints — brute force defence
import rateLimit from 'express-rate-limit';

app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many attempts. Try again in 15 minutes.' }
}));
```

**Password reset**, done correctly:

1. Generate a cryptographically random token (`crypto.randomBytes(32)`).
2. Store a **hash** of it with an expiry (1 hour) and a user id.
3. Email the plain token as a link. Never email a password.
4. On use: look up by hash, check expiry, **delete the token**, then set the new password.
5. Respond identically whether the email exists or not.
6. Invalidate existing sessions afterwards.

**Two-factor authentication** (TOTP — the authenticator-app kind) meaningfully defeats credential stuffing. Libraries like `otplib` make it a short job, and it's the single highest-value security feature you can add after correct password storage.

**OAuth / "Sign in with Google"** delegates authentication entirely. You never see a password, and users don't manage another one. Use a vetted library (Passport, Auth.js) rather than implementing the flow yourself — the details are easy to get subtly wrong.

:::tip Consider not building this yourself
Auth is high-stakes, fiddly, and largely undifferentiated work. Auth0, Clerk, Supabase Auth, Firebase Auth and similar handle hashing, sessions, 2FA, OAuth, password reset and breach detection for you. For a product, that's often the right call. Understand how it works — that's what this lesson is for — then decide deliberately.
:::

:::quiz
? Why is SHA-256 the wrong choice for password hashing?
- It's not secure enough
- It's fast by design, so an attacker can try billions of guesses per second *
- It produces short output
- It's deprecated
> Password hashing needs to be deliberately slow: bcrypt, scrypt or Argon2id.

? A login fails. What should the response say?
- "No account with that email"
- "Incorrect password"
- "Invalid email or password" for both cases *
- "User not found (code 404)"
> Distinct messages let attackers enumerate valid accounts.

? What is the main drawback of JWTs?
- They're slow to verify
- They cannot be revoked before they expire *
- They can't hold user data
- They only work over HTTPS
> Which is why short expiries plus refresh tokens are the usual mitigation.

? Where should a session token live in a browser?
- localStorage
- sessionStorage
- An HttpOnly, Secure, SameSite cookie *
- A JavaScript variable
> HttpOnly means an XSS payload cannot read it.

? A logged-in user requests `/api/orders/999`, which belongs to someone else. What should happen?
- Return the order — they're authenticated
- Return 404 or 403 after checking ownership *
- Return 500
- Return an empty object
> Broken object-level authorisation is the most common serious API flaw.

? A password reset email should contain?
- The user's existing password
- A newly generated password
- A time-limited, single-use random token link *
- A security question
> Store only a hash of the token, and delete it once used.
:::

:::exercise Build authentication
Implement registration and login for an Express app:

1. `POST /api/auth/register` — validate the email, require 8+ characters, hash with bcrypt (cost 12), handle duplicate emails with 409.
2. `POST /api/auth/login` — constant message on failure, rate limited to 5 attempts per 15 minutes.
3. Session cookie with `httpOnly`, `secure`, `sameSite: 'lax'`.
4. `requireAuth` middleware, and a `GET /api/me` that uses it.
5. `POST /api/auth/logout` that destroys the session server-side.
6. A protected resource where each user can only see their own records — and write a test proving user A gets a 404 for user B's record.
:::
