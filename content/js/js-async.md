JavaScript runs your code on a **single thread**. If that thread is busy, nothing happens — no clicks, no rendering, nothing. Asynchronous programming is how a single-threaded language stays responsive while waiting for slow things.

# The problem

```js run
console.log('first');

setTimeout(() => console.log('third — runs later'), 0);

console.log('second');

// Output: first, second, third — even with a 0ms delay
```

Why does a 0ms timeout run last? Because of the event loop.

# The event loop, briefly

1. JavaScript runs your code on the **call stack**, one thing at a time.
2. Slow operations (timers, network requests, file reads) are handed to **the browser or Node**, which handles them outside your thread.
3. When one finishes, its callback is put in a **queue**.
4. When the call stack is empty, the **event loop** takes the next callback from the queue and runs it.

So asynchronous callbacks *never* interrupt running code. They wait their turn.

```js run
console.log('1: sync');

setTimeout(() => console.log('4: macrotask (timer)'), 0);

Promise.resolve().then(() => console.log('3: microtask (promise)'));

console.log('2: sync');

// Microtasks (promises) drain completely before the next macrotask (timers).
```

:::warn Blocking the thread freezes everything
```js
const start = Date.now();
while (Date.now() - start < 3000) {}   // 3 seconds of nothing
```
During that loop, the page cannot scroll, respond to clicks, or repaint. Heavy synchronous work — parsing a huge JSON file, a million-iteration loop — has the same effect. Move it to a Web Worker, or break it up.
:::

# Callbacks, and why they got a bad name

```js run
function fetchUser(id, callback) {
  setTimeout(() => callback(null, { id, name: 'Ada' }), 100);
}

fetchUser(1, (err, user) => {
  if (err) return console.error(err);
  console.log('got user:', user.name);
});
```

Fine for one level. Three levels deep, it becomes "callback hell":

```js
getUser(id, (err, user) => {
  if (err) return handle(err);
  getOrders(user.id, (err, orders) => {
    if (err) return handle(err);
    getDetails(orders[0].id, (err, details) => {
      if (err) return handle(err);
      // three levels of nesting, error handling repeated at every level
    });
  });
});
```

Promises exist to flatten that.

# Promises

A promise is an object representing a value that isn't ready yet. It's in one of three states: **pending**, **fulfilled** (with a value), or **rejected** (with a reason). Once settled, it never changes.

```js run
const promise = new Promise((resolve, reject) => {
  const succeed = true;
  setTimeout(() => {
    if (succeed) resolve('it worked');
    else reject(new Error('it failed'));
  }, 100);
});

promise
  .then(value => { console.log('then:', value); return value.toUpperCase(); })
  .then(upper => console.log('chained:', upper))
  .catch(err => console.error('catch:', err.message))
  .finally(() => console.log('finally: always runs'));

console.log('this logs first — the promise is still pending');
```

Chaining is the key: `.then` returns a new promise, and returning a value from a handler passes it to the next `.then`. **Returning a promise** from a handler waits for it, which is how you flatten nesting:

```js run
const delay = (ms, value) => new Promise(r => setTimeout(() => r(value), ms));

delay(50, 'user')
  .then(user => { console.log('got', user); return delay(50, 'orders'); })
  .then(orders => { console.log('got', orders); return delay(50, 'details'); })
  .then(details => console.log('got', details))
  .catch(err => console.error(err));
```

Flat, with **one** error handler for the whole chain.

:::gotcha Forgetting to return
```js
.then(user => { getOrders(user.id); })     // ✗ next .then runs immediately
.then(user => { return getOrders(user.id); }) // ✓ waits
.then(user => getOrders(user.id))             // ✓ implicit return
```
This is one of the most common promise bugs, and it produces a confusing "my data is undefined" failure.
:::

# async / await

Same promises, much better syntax.

```js run
const delay = (ms, value) => new Promise(r => setTimeout(() => r(value), ms));

async function loadEverything() {
  console.log('starting');

  const user = await delay(50, { id: 1, name: 'Ada' });
  console.log('user:', user.name);

  const orders = await delay(50, ['order-1', 'order-2']);
  console.log('orders:', orders.length);

  return { user, orders };
}

loadEverything().then(result => console.log('done:', Object.keys(result)));
console.log('sync code continues while that runs');
```

Two rules:

1. `await` can only be used inside an `async` function (or at the top level of an ES module).
2. An `async` function **always returns a promise**, whatever you return from it.

## Error handling

```js run
const fail = () => Promise.reject(new Error('network down'));

async function load() {
  try {
    const data = await fail();
    console.log('never reached', data);
  } catch (err) {
    console.error('caught:', err.message);
    return 'fallback data';
  } finally {
    console.log('cleanup runs either way');
  }
}

load().then(v => console.log('returned:', v));
```

`try/catch` around `await` catches both synchronous throws and promise rejections — one mechanism for both, which is the main ergonomic win over `.catch()`.

# Sequential vs parallel: the big performance mistake

```js run
const delay = (ms, v) => new Promise(r => setTimeout(() => r(v), ms));

async function sequential() {
  const t = Date.now();
  const a = await delay(100, 'a');     // wait 100ms
  const b = await delay(100, 'b');     // then another 100ms
  const c = await delay(100, 'c');     // then another
  console.log('sequential:', Date.now() - t, 'ms', [a, b, c]);
}

async function parallel() {
  const t = Date.now();
  const [a, b, c] = await Promise.all([   // all three start immediately
    delay(100, 'a'), delay(100, 'b'), delay(100, 'c')
  ]);
  console.log('parallel:', Date.now() - t, 'ms', [a, b, c]);
}

sequential().then(parallel);
```

~300ms versus ~100ms. **If requests don't depend on each other, run them together.** This is one of the highest-impact things you can fix in a slow front end.

## The promise combinators

```js run
const ok = (v, ms = 50) => new Promise(r => setTimeout(() => r(v), ms));
const bad = (msg, ms = 30) => new Promise((_, rej) => setTimeout(() => rej(new Error(msg)), ms));

// all — every one must succeed; rejects immediately if any fails
Promise.all([ok(1), ok(2)]).then(v => console.log('all:', v));
Promise.all([ok(1), bad('boom')]).catch(e => console.log('all rejected:', e.message));

// allSettled — never rejects; reports each outcome
Promise.allSettled([ok(1), bad('boom')])
  .then(rs => console.log('allSettled:', rs.map(r => r.status)));

// race — first to settle, success or failure
Promise.race([ok('slow', 100), ok('fast', 10)]).then(v => console.log('race:', v));

// any — first to SUCCEED; ignores failures
Promise.any([bad('x'), ok('winner', 40)]).then(v => console.log('any:', v));
```

| Use | When |
|---|---|
| `all` | You need every result; any failure is fatal |
| `allSettled` | You want all outcomes, failures included (dashboards, batch jobs) |
| `race` | Timeouts — race the real request against a rejecting timer |
| `any` | Several sources, first success wins |

# Common mistakes

```js run
const delay = (ms, v) => new Promise(r => setTimeout(() => r(v), ms));

// ✗ forEach does not await
async function broken() {
  const out = [];
  [1, 2, 3].forEach(async (n) => { out.push(await delay(10, n)); });
  console.log('broken — empty:', out);
}

// ✓ for...of awaits properly (sequential)
async function sequential() {
  const out = [];
  for (const n of [1, 2, 3]) out.push(await delay(10, n));
  console.log('sequential:', out);
}

// ✓ map + Promise.all (parallel)
async function parallel() {
  const out = await Promise.all([1, 2, 3].map(n => delay(10, n)));
  console.log('parallel:', out);
}

broken();
sequential().then(parallel);
```

Other traps:

```js
const data = fetchData();          // ✗ a Promise object, not the data
const data = await fetchData();    // ✓

// ✗ unhandled rejection — crashes Node, warns in browsers
doAsyncThing();
// ✓
doAsyncThing().catch(console.error);
```

:::tip Adding a timeout to anything
```js
function withTimeout(promise, ms) {
  const timeout = new Promise((_, rej) =>
    setTimeout(() => rej(new Error(`Timed out after ${ms}ms`)), ms));
  return Promise.race([promise, timeout]);
}
```
For `fetch` specifically, `AbortSignal.timeout(5000)` does this natively and actually cancels the request.
:::

:::quiz
? Why does `setTimeout(fn, 0)` run after synchronous code?
- 0 is rounded up to 4ms
- Its callback goes in a queue and only runs when the call stack is empty *
- setTimeout is always slow
- It runs in a Web Worker
> The event loop only picks up queued callbacks once your current code has finished.

? What does an `async` function return?
- The value you return
- A promise resolving to that value *
- undefined
- A callback
> Which is why you still need `await` or `.then()` at the call site.

? Three independent API calls. Which is fastest?
- Three sequential awaits
- `await Promise.all([a(), b(), c()])` *
- A for...of loop
- forEach with async
> Sequential awaits take the sum of the durations; Promise.all takes the longest one.

? `.then(user => { getOrders(user.id); })` — what does the next `.then` receive?
- The orders
- undefined, because nothing was returned *
- A promise
- An error
> Return the promise (or use a concise arrow) so the chain waits for it.

? Which combinator never rejects?
- Promise.all
- Promise.race
- Promise.allSettled *
- Promise.any
> It resolves with an array of `{status, value}` or `{status, reason}` objects.

? Why doesn't `array.forEach(async item => await save(item))` wait?
- async isn't allowed in forEach
- forEach ignores the promises its callback returns *
- await only works in loops
- It does wait
> Use `for...of` for sequential, or `Promise.all(array.map(...))` for parallel.
:::

:::exercise Build a retry helper
Write `retry(fn, attempts = 3, delayMs = 200)` that calls an async `fn`, and on rejection waits and tries again, up to `attempts` times, doubling the delay each time (exponential backoff). If all attempts fail, reject with the last error.

```js
let n = 0;
const flaky = () => { n++; return n < 3 ? Promise.reject(new Error('fail ' + n)) : Promise.resolve('ok on ' + n); };
retry(flaky).then(console.log).catch(console.error);   // should log "ok on 3"
```
:::
