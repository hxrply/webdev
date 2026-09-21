Code fails. The question is whether it fails loudly and recoverably, or silently and mysteriously three screens later.

# Error types

```js run
const attempts = [
  () => undefinedVariable,
  () => null.property,
  () => (42)(),
  () => JSON.parse('{ bad json }'),
  () => new Array(-1),
  () => decodeURIComponent('%')
];

for (const fn of attempts) {
  try { fn(); }
  catch (e) { console.log(e.constructor.name + ': ' + e.message); }
}
```

| Type | Means |
|---|---|
| `SyntaxError` | The code couldn't be parsed. Nothing runs. |
| `ReferenceError` | A name that doesn't exist in scope |
| `TypeError` | A value used in a way its type doesn't support — by far the most common |
| `RangeError` | A number outside an allowed range |
| `URIError` | Malformed URI encoding |

# try / catch / finally

```js run
function parseSettings(json) {
  try {
    const data = JSON.parse(json);
    console.log('parsed:', data);
    return data;
  } catch (err) {
    console.warn('invalid JSON, using defaults:', err.message);
    return { theme: 'light' };
  } finally {
    console.log('finally always runs — even after return or throw');
  }
}

parseSettings('{"theme":"dark"}');
parseSettings('not json at all');
```

`finally` runs whatever happens — normal exit, return, or an exception on its way up. It's where cleanup belongs: close a connection, hide a spinner, re-enable a button.

:::warn Don't swallow errors
```js
try { riskyThing(); } catch (e) { }          // ✗ silence
try { riskyThing(); } catch (e) { console.log(e); }   // ✗ logged and forgotten
```
An empty catch block turns a crash into a mystery: the symptom appears far from the cause. Either **handle** the error meaningfully, or let it propagate.
:::

# Throwing

```js run
class ValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

function createUser({ email, age }) {
  if (!email) throw new ValidationError('email', 'Email is required');
  if (!email.includes('@')) throw new ValidationError('email', 'Email looks invalid');
  if (age < 18) throw new ValidationError('age', 'Must be 18 or older');
  return { email, age };
}

for (const input of [{ email: 'a@b.com', age: 30 }, { email: 'nope', age: 30 }, { age: 5 }]) {
  try {
    console.log('created:', createUser(input));
  } catch (err) {
    if (err instanceof ValidationError) console.log(`✗ ${err.field}: ${err.message}`);
    else throw err;                     // not ours — let it propagate
  }
}
```

Two habits worth adopting:

- **Throw `Error` objects, not strings.** `throw 'oops'` gives you no stack trace and breaks `err.message`.
- **Custom error classes** let callers distinguish "the user typed something wrong" from "the database is down" — which need very different responses.

# Errors in async code

```js run
// Rejected promises must be caught, or they become unhandled rejections
const fail = () => Promise.reject(new Error('boom'));

async function withTryCatch() {
  try { await fail(); }
  catch (e) { console.log('caught with try/catch:', e.message); }
}

fail().catch(e => console.log('caught with .catch:', e.message));
withTryCatch();

// ✗ A classic trap: try/catch does NOT catch async callbacks
try {
  setTimeout(() => { /* throw new Error('not caught') */ }, 0);
} catch (e) {
  console.log('never reached — the callback runs later, on a clean stack');
}
```

```js
// Global safety nets — log, don't rely on them for control flow
window.addEventListener('error', (e) => report(e.error));
window.addEventListener('unhandledrejection', (e) => report(e.reason));
```

# Reading a stack trace

```text
TypeError: Cannot read properties of undefined (reading 'name')
    at formatUser (app.js:42:18)          ← where it actually broke
    at renderList (app.js:67:9)           ← who called that
    at handleClick (app.js:89:5)          ← and who called that
```

Read **top to bottom**: the first line is where it threw, and each line below is the caller. The top line in *your* code is where to start looking — frames from libraries above it usually just mean you passed them something bad.

# The bugs everyone hits

```js run
// 1. Off-by-one
const arr = [1, 2, 3];
for (let i = 0; i <= arr.length; i++) console.log(i, arr[i]);   // last is undefined

// 2. Mutating while iterating
const nums = [1, 2, 3, 4];
// nums.forEach((n, i) => { if (n % 2) nums.splice(i, 1); });   // skips elements
console.log('filter instead:', nums.filter(n => n % 2 === 0));

// 3. Shared references
const template = { tags: [] };
const a = { ...template }, b = { ...template };
a.tags.push('x');
console.log('b.tags:', b.tags);         // ['x'] — same array!

// 4. Async ordering
let value = 'initial';
setTimeout(() => { value = 'updated'; }, 0);
console.log('reads too early:', value);

// 5. Floating point
console.log(0.1 + 0.2 === 0.3, '→ compare with a tolerance instead');
```

And the perennial DOM ones:

```js
document.getElementById('btn').addEventListener(...)   // null if the script ran too early
document.querySelector('.btn')                          // null if the class name is wrong
element.value                                           // undefined on a div — it's not an input
```

# Defensive coding, in moderation

```js run
function getDisplayName(user) {
  if (!user) return 'Guest';                       // guard the obvious absence
  return user.profile?.displayName
      ?? user.email?.split('@')[0]
      ?? 'Anonymous';
}

console.log(getDisplayName(null));
console.log(getDisplayName({ email: 'ada@example.com' }));
console.log(getDisplayName({ profile: { displayName: 'Ada L' } }));
```

:::tip Fail fast on programmer errors
There's a difference between *expected* absence (a user without a profile picture) and a *bug* (a function called with the wrong arguments). Handle the first gracefully; let the second throw immediately and loudly. Wrapping everything in `?.` and `try/catch` hides bugs until they surface somewhere confusing.

A useful rule: validate inputs at the boundaries of your system (user input, API responses), and trust your own internals.
:::

# Debugging technique

1. **Reproduce it reliably.** A bug you can't reproduce, you can't verify fixed.
2. **Read the error and the stack trace.** Really read them.
3. **Bisect.** Comment out half. Still broken? It's in the other half.
4. **Check your assumptions with `console.log`** at each step — label them so you can tell which ran.
5. **Use breakpoints** for anything non-trivial. Hovering variables beats guessing.
6. **Explain it out loud** to someone or something. This works embarrassingly often.

```js run
// Logging that actually helps
const user = { name: 'Ada', tags: ['x'] };

console.log('user:', user);                        // fine
console.log({ user });                             // labelled automatically
console.table([user]);                             // tabular
console.log(structuredClone(user));                // snapshot, not a live reference
console.group('render'); console.log('step 1'); console.groupEnd();
console.assert(user.name, 'user should have a name');
```

:::gotcha Logged objects are live
Expanding a logged object in DevTools shows its state **now**, not when it was logged. If a value looks wrong, log a clone or a primitive instead.
:::

# Error handling in a real function

```js run
async function loadUserProfile(id) {
  if (!id) throw new TypeError('loadUserProfile requires an id');   // programmer error: throw

  try {
    const res = await fetch(`https://api.github.com/users/${id}`, {
      signal: AbortSignal.timeout(5000)
    });

    if (res.status === 404) return null;                  // expected: not an error
    if (res.status === 403) throw new Error('Rate limited — try again shortly');
    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    return await res.json();

  } catch (err) {
    if (err.name === 'TimeoutError') throw new Error('Request timed out');
    if (err.name === 'TypeError') throw new Error('Network unavailable');
    throw err;                                            // anything else: pass it on
  }
}

loadUserProfile('octocat')
  .then(u => console.log('loaded:', u?.login ?? 'no such user'))
  .catch(e => console.error('failed:', e.message));
```

Notice the distinctions: a 404 returns `null` because "no such user" is a normal outcome; a 403 and a timeout become clear, actionable messages; and anything unrecognised is re-thrown rather than swallowed.

:::quiz
? What does `finally` guarantee?
- It runs only on success
- It runs only on error
- It runs regardless, including after a return or throw *
- It runs before catch
> Which makes it the right place for cleanup like hiding spinners.

? Why throw `new Error('msg')` rather than `'msg'`?
- Strings aren't allowed
- Error objects carry a stack trace and a `.message` property *
- It is faster
- Strings can't be caught
> A thrown string gives you almost nothing to debug with.

? Does `try/catch` around `setTimeout(() => { throw x })` catch the error?
- Yes
- No — the callback runs later on a clean stack *
- Only in strict mode
- Only with await
> Put the try/catch inside the callback, or use promises with `.catch`.

? What's wrong with an empty `catch {}`?
- It is a syntax error
- It hides failures, so symptoms appear far from the cause *
- It is slower
- It catches too much
> Either handle the error or let it propagate.

? In a stack trace, which line shows where the error occurred?
- The last line
- The first line *
- The line mentioning your filename
- The line with the highest number
> Read downward for the chain of callers.

? When should a function throw rather than return a fallback?
- Never
- When the situation indicates a bug rather than an expected condition *
- For all errors
- Only in async code
> Expected absence → graceful handling. Programmer error → fail loudly and early.
:::

:::exercise Harden a function
Take this fragile function and make it robust:

```js
async function getTotal(cartId) {
  const res = await fetch('/api/cart/' + cartId);
  const cart = await res.json();
  return cart.items.reduce((s, i) => s + i.price * i.qty, 0);
}
```

Handle: a missing `cartId`; a non-ok response; a 404 (return null); malformed JSON; a missing or empty `items` array; and items with missing prices. Distinguish programmer errors (throw) from expected conditions (return a sensible value).
:::
