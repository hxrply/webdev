`fetch` is how browser JavaScript talks to servers. Almost every dynamic page you've used is making these calls constantly.

# A basic GET

```js run
async function getJoke() {
  const response = await fetch('https://api.chucknorris.io/jokes/random');

  if (!response.ok) {                              // see the warning below
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  console.log(data.value);
}

getJoke().catch(err => console.error('Failed:', err.message));
```

Two awaits, and both are necessary:

1. `await fetch(...)` — waits for the **response headers** to arrive.
2. `await response.json()` — waits for the **body** to download and parse.

:::warn fetch does not reject on 404 or 500
This surprises everyone once:

```js
const res = await fetch('/does-not-exist');
// No error thrown! res.ok === false, res.status === 404
```

A `fetch` promise rejects only on **network failure** — no connection, DNS failure, CORS block. A server responding "404 Not Found" is a *successful* HTTP exchange as far as fetch is concerned. **Always check `response.ok`.**
:::

# The Response object

```js run
async function inspect() {
  const res = await fetch('https://api.github.com/repos/torvalds/linux');

  console.log('ok:', res.ok);
  console.log('status:', res.status, res.statusText);
  console.log('content-type:', res.headers.get('content-type'));

  const data = await res.json();
  console.log('repo:', data.full_name, '⭐', data.stargazers_count);
}

inspect().catch(e => console.error(e.message));
```

Reading the body — pick one, and only once:

```js
await res.json();        // parse as JSON
await res.text();        // as a string
await res.blob();        // as binary (images, files)
await res.formData();
await res.arrayBuffer();
```

:::gotcha The body can only be read once
```js
const data = await res.json();
const text = await res.text();   // TypeError: body stream already read
```
If you need it twice, `res.clone()` first, or read once and reuse the value.
:::

# POST and other methods

```js
const response = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ name: 'Ada', email: 'ada@example.com' })
});
```

Three things people get wrong:

1. **`body` must be a string** (or FormData/Blob). `JSON.stringify` it.
2. **Set `Content-Type`** — the server may otherwise refuse to parse it.
3. Sending `FormData`? **Don't set Content-Type.** The browser adds it with the required multipart boundary; setting it manually breaks the upload.

```js
// Other methods
await fetch(`/api/users/${id}`, { method: 'DELETE' });
await fetch(`/api/users/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ name }) });

// FormData — file uploads
const fd = new FormData();
fd.append('avatar', fileInput.files[0]);
await fetch('/api/upload', { method: 'POST', body: fd });   // no Content-Type header
```

# Query strings, built properly

```js run
const params = new URLSearchParams({ q: 'css grid', page: '2', sort: 'new' });
console.log(params.toString());

const url = new URL('https://example.com/search');
url.searchParams.set('q', 'a & b');          // encoding handled for you
url.searchParams.set('limit', 10);
console.log(url.toString());
```

Never build query strings by concatenation — an ampersand or space in user input will silently break it. `URLSearchParams` encodes correctly.

# A reusable wrapper

Writing the same error handling at every call site gets old. Wrap it once:

```js run
async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!res.ok) {
    let detail = '';
    try { detail = JSON.stringify(await res.json()); } catch { detail = await res.text(); }
    const error = new Error(`${res.status} ${res.statusText}`);
    error.status = res.status;
    error.detail = detail;
    throw error;
  }

  if (res.status === 204) return null;                 // No Content
  return res.json();
}

api('https://api.github.com/users/octocat')
  .then(u => console.log(u.login, '—', u.public_repos, 'repos'))
  .catch(e => console.error(e.status, e.message));
```

# Loading states and errors in the UI

```html run title="The full pattern: loading, error, empty, success"
<button id="load">Load users</button>
<button id="fail">Simulate failure</button>
<div id="out" role="status" aria-live="polite"></div>

<style>
  body { font-family: system-ui; font-size: 14px; }
  button { padding: 8px 12px; font: inherit; cursor: pointer; margin-right: 6px; }
  #out { margin-top: 12px; min-height: 60px; }
  .spinner { color: #718096; }
  .error { color: crimson; padding: 10px; background: #fff5f5; border-radius: 6px; }
  li { padding: 4px 0; }
</style>

<script>
  const out = document.getElementById('out');

  async function load(shouldFail) {
    out.innerHTML = '<p class="spinner">Loading…</p>';

    try {
      const url = shouldFail
        ? 'https://api.github.com/this-endpoint-does-not-exist'
        : 'https://api.github.com/users/octocat/repos?per_page=5';

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const repos = await res.json();

      if (repos.length === 0) { out.innerHTML = '<p>No repositories found.</p>'; return; }

      const ul = document.createElement('ul');
      for (const r of repos) {
        const li = document.createElement('li');
        li.textContent = `${r.name} — ${r.language ?? 'unknown'}`;   // textContent: safe
        ul.appendChild(li);
      }
      out.replaceChildren(ul);

    } catch (err) {
      out.innerHTML = '<p class="error"></p>';
      out.querySelector('.error').textContent = `Could not load: ${err.message}`;
      console.error(err);
    }
  }

  document.getElementById('load').addEventListener('click', () => load(false));
  document.getElementById('fail').addEventListener('click', () => load(true));
</script>
```

Every data-driven UI needs **four** states, and beginners usually build one:

1. **Loading** — the user knows something is happening.
2. **Error** — what went wrong, and what to do.
3. **Empty** — the request worked, there's just nothing there. Not the same as an error.
4. **Success** — the data.

# Cancelling requests

```js
const controller = new AbortController();

fetch('/api/slow', { signal: controller.signal })
  .then(r => r.json())
  .catch(err => {
    if (err.name === 'AbortError') console.log('cancelled');
    else throw err;
  });

controller.abort();                              // cancel it

// Timeout, natively
fetch(url, { signal: AbortSignal.timeout(5000) });
```

This matters for search-as-you-type: abort the previous request before firing the next, or a slow earlier response can land *after* a fast later one and overwrite your results with stale data.

# CORS

```text
Access to fetch at 'https://api.example.com/data' from origin
'https://mysite.com' has been blocked by CORS policy.
```

The browser refuses to let JavaScript on one origin read a response from another origin unless the server explicitly allows it with an `Access-Control-Allow-Origin` header.

Things to understand:

- **It is enforced by the browser, not the server.** The request often *did* reach the server; you just can't read the reply.
- **You cannot fix it in your front-end code.** No header, flag or option on your side will help.
- **The fix is on the server** — add the CORS headers — or route the call through your own backend, which has no such restriction.
- For non-simple requests (custom headers, `PUT`/`DELETE`), the browser first sends an `OPTIONS` **preflight** request that the server must also answer correctly.

:::tip Debugging a failed request
Open the Network tab and check, in order: did the request appear at all? What status came back? Look at the **Response** tab for the server's actual error message — it's usually far more informative than the generic message in your console.
:::

:::quiz
? A fetch returns 500. Does the promise reject?
- Yes
- No — check `response.ok` yourself *
- Only for 5xx
- Only if you await
> fetch rejects only for network-level failures, not HTTP error statuses.

? What does `await response.json()` wait for?
- The connection to open
- The body to download and parse *
- The headers
- The server to acknowledge
> `await fetch()` resolves once headers arrive; the body may still be streaming.

? You get a CORS error. Where is the fix?
- Add a header to your fetch call
- Use `mode: 'no-cors'`
- On the server, or by proxying through your own backend *
- Disable it in the browser
> `no-cors` returns an opaque response you can't read — it's not a fix.

? When sending FormData, what should you do about Content-Type?
- Set it to `multipart/form-data`
- Set it to `application/json`
- Leave it out — the browser adds it with the required boundary *
- Set it to `text/plain`
> Setting it manually omits the boundary and the server can't parse the body.

? Why abort the previous request in a search-as-you-type box?
- To save bandwidth only
- A slow earlier response can arrive after a later one and overwrite the results *
- fetch only allows one request at a time
- To avoid CORS
> That race condition produces results that don't match what's in the box.

? Reading `res.json()` twice throws. Why?
- JSON can only be parsed once
- The response body is a stream that is consumed on read *
- You must await both times
- It's a browser bug
> Use `res.clone()` if you genuinely need to read it twice.
:::

:::exercise Build a search with a public API
Using `https://api.github.com/search/users?q=YOURQUERY`, build a search box that:

1. Debounces input by 400ms.
2. Aborts the previous request when a new one starts.
3. Shows loading, error, empty and results states.
4. Renders avatars and usernames, using `textContent` for the names.
5. Handles the 403 rate-limit response with a friendly message.
:::
