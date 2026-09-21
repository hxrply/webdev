Browsers can store data on the user's machine. It's how a site remembers your theme, keeps your draft, or leaves you logged in.

# localStorage and sessionStorage

```html run title="Persisting a preference"
<button id="toggle">Toggle theme</button>
<button id="clear">Clear stored value</button>
<p id="status"></p>

<style>
  body { font-family: system-ui; padding: 10px; transition: background .2s; }
  body.dark { background: #1a202c; color: #e2e8f0; }
  button { padding: 8px 12px; font: inherit; cursor: pointer; margin-right: 6px; }
</style>

<script>
  const status = document.getElementById('status');

  function apply(theme) {
    document.body.classList.toggle('dark', theme === 'dark');
    status.textContent = `Theme: ${theme} (stored — reload the preview and it persists)`;
  }

  // Read on load, with a default
  apply(localStorage.getItem('demo-theme') || 'light');

  document.getElementById('toggle').addEventListener('click', () => {
    const next = document.body.classList.contains('dark') ? 'light' : 'dark';
    localStorage.setItem('demo-theme', next);
    apply(next);
  });

  document.getElementById('clear').addEventListener('click', () => {
    localStorage.removeItem('demo-theme');
    status.textContent = 'Cleared.';
  });
</script>
```

```js
localStorage.setItem('key', 'value');
localStorage.getItem('key');          // string, or null if absent
localStorage.removeItem('key');
localStorage.clear();                  // everything for this origin
localStorage.length;
Object.keys(localStorage);
```

| | localStorage | sessionStorage |
|---|---|---|
| Lifetime | Until explicitly cleared | Until the tab closes |
| Shared between tabs | Yes (same origin) | No — each tab is separate |
| Capacity | ~5–10 MB | ~5 MB |
| Sent to the server | No | No |

# Everything is a string

```js run
localStorage.setItem('count', 42);
console.log(localStorage.getItem('count'), typeof localStorage.getItem('count'));  // '42' string

localStorage.setItem('user', { name: 'Ada' });
console.log(localStorage.getItem('user'));   // '[object Object]' — useless

// Use JSON
const user = { name: 'Ada', roles: ['admin'], active: true };
localStorage.setItem('user', JSON.stringify(user));
const restored = JSON.parse(localStorage.getItem('user'));
console.log(restored.roles[0], typeof restored.active);

localStorage.removeItem('count'); localStorage.removeItem('user');
```

# Storage that doesn't crash

Storage throws more often than you'd expect: private browsing, disabled cookies, a full quota, corrupt JSON. Wrap it.

```js run
const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;                 // unreadable or invalid JSON
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      if (err.name === 'QuotaExceededError') console.warn('Storage full');
      return false;                    // caller decides what to do
    }
  },

  remove(key) { try { localStorage.removeItem(key); } catch {} }
};

store.set('settings', { theme: 'dark', fontSize: 16 });
console.log(store.get('settings'));
console.log(store.get('does-not-exist', { theme: 'light' }));   // fallback
store.remove('settings');
```

:::warn Never store anything sensitive
localStorage is readable by **any JavaScript running on your origin**, including an injected script from a compromised third-party dependency. Do not put auth tokens, personal data or anything you'd mind leaking in it. Session tokens belong in `HttpOnly` cookies, which JavaScript cannot read at all.
:::

# Syncing across tabs

```js
window.addEventListener('storage', (e) => {
  // Fires in OTHER tabs of the same origin, not the one that made the change
  if (e.key === 'theme') applyTheme(e.newValue);
});
```

Useful for keeping several open tabs consistent — log out in one, log out everywhere.

# Cookies

```js run
document.cookie = 'demo=hello; max-age=3600; path=/; SameSite=Lax';
console.log(document.cookie);

function getCookie(name) {
  return document.cookie.split('; ')
    .find(row => row.startsWith(name + '='))
    ?.split('=')[1];
}
console.log('demo cookie:', getCookie('demo'));

document.cookie = 'demo=; max-age=0; path=/';    // delete by expiring it
```

The API is genuinely unpleasant — a single string you parse yourself. Use cookies when:

- **The server needs the value.** Cookies are sent with every request; localStorage is not. This is the whole reason sessions use cookies.
- You need `HttpOnly` (invisible to JavaScript) or `Secure` (HTTPS only) — both set by the server.

Cookie attributes worth knowing:

| Attribute | Effect |
|---|---|
| `HttpOnly` | JavaScript cannot read it — the main XSS defence for session tokens |
| `Secure` | Only sent over HTTPS |
| `SameSite=Strict/Lax/None` | Controls sending on cross-site requests — the primary CSRF defence |
| `Max-Age` / `Expires` | Lifetime |
| `Path` / `Domain` | Scope |

# IndexedDB, briefly

For large or structured data — offline apps, caches, thousands of records — there's IndexedDB: asynchronous, transactional, effectively unlimited (quota permitting), and able to store real objects, `Blob`s and files rather than strings.

Its native API is verbose and callback-based. In practice nearly everyone uses a small wrapper like **idb** or **Dexie**:

```js
import { openDB } from 'idb';

const db = await openDB('notes-db', 1, {
  upgrade(db) { db.createObjectStore('notes', { keyPath: 'id' }); }
});

await db.put('notes', { id: 1, text: 'Hello', updated: new Date() });
const note = await db.get('notes', 1);
const all = await db.getAll('notes');
```

# Choosing

| Need | Use |
|---|---|
| Small preference (theme, sidebar state) | `localStorage` |
| Per-tab temporary state (a wizard's progress) | `sessionStorage` |
| Something the **server** must see on each request | Cookie |
| A session token | `HttpOnly` cookie, set by the server |
| Megabytes, files, or offline data | IndexedDB |
| Anything sensitive | **The server** |

# A practical example

```html run title="A draft that survives reload"
<textarea id="draft" rows="4" placeholder="Type a message… it autosaves"></textarea>
<p id="saved"></p>
<button id="clear">Discard draft</button>

<style>
  body { font-family: system-ui; font-size: 14px; }
  textarea { width: 100%; box-sizing: border-box; padding: 8px; font: inherit; }
  #saved { color: #718096; font-size: 12px; min-height: 1em; }
  button { padding: 6px 12px; font: inherit; cursor: pointer; }
</style>

<script>
  const draft = document.getElementById('draft');
  const saved = document.getElementById('saved');
  const KEY = 'demo-draft';

  try { draft.value = localStorage.getItem(KEY) || ''; } catch {}
  if (draft.value) saved.textContent = 'Restored a saved draft.';

  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  const save = debounce(() => {
    try {
      localStorage.setItem(KEY, draft.value);
      saved.textContent = 'Saved at ' + new Date().toLocaleTimeString();
    } catch { saved.textContent = 'Could not save (storage unavailable).'; }
  }, 500);

  draft.addEventListener('input', save);
  document.getElementById('clear').addEventListener('click', () => {
    draft.value = '';
    try { localStorage.removeItem(KEY); } catch {}
    saved.textContent = 'Draft discarded.';
  });
</script>
```

:::quiz
? What type does `localStorage.getItem()` always return?
- The original type
- A string, or null if the key is absent *
- undefined for missing keys
- JSON
> Store objects with `JSON.stringify` and parse them on the way out.

? Where should a session token be stored?
- localStorage
- sessionStorage
- An HttpOnly cookie set by the server *
- A JavaScript variable
> HttpOnly means injected scripts cannot read it, which is the point.

? When does the `storage` event fire?
- Whenever you call setItem
- In *other* tabs of the same origin when storage changes *
- On page load
- When the quota is exceeded
> It's for syncing tabs — the tab that made the change is not notified.

? Why wrap localStorage access in try/catch?
- It is asynchronous
- It throws in private mode, when quota is exceeded, or on invalid JSON *
- To improve performance
- To support older browsers only
> A single uncaught throw here can break an otherwise working page.

? What is sent to the server on every request?
- localStorage
- sessionStorage
- Cookies (for that domain and path) *
- IndexedDB
> Which is exactly why cookies, not localStorage, carry session identity.

? You need to store 50 MB of offline data. What do you use?
- localStorage
- Cookies
- IndexedDB *
- sessionStorage
> localStorage caps out around 5–10 MB and is synchronous, which blocks the thread.
:::

:::exercise Build a persistent to-do list
Extend a to-do list so it survives a reload:

1. Save the array of tasks as JSON on every change.
2. Load and render it on startup, defaulting to an empty list.
3. Wrap every storage call so a private-browsing failure doesn't break the app.
4. Add a `storage` listener so two open tabs stay in sync.
5. Add an "export" button that downloads the list as a JSON file.
:::
