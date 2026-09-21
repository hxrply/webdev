Events are how a page responds to the world: clicks, typing, scrolling, network activity, the page finishing loading. Your code registers interest; the browser calls you back.

# addEventListener

```html run title="Listening for clicks"
<button id="btn">Click me</button>
<p id="count">Clicks: 0</p>

<script>
  let clicks = 0;
  const output = document.getElementById('count');

  document.getElementById('btn').addEventListener('click', function (event) {
    clicks++;
    output.textContent = `Clicks: ${clicks}`;
    console.log('clicked at', event.clientX, event.clientY);
  });
</script>
```

```js
element.addEventListener(type, handler, options);
element.removeEventListener(type, handler);   // needs the SAME function reference
```

:::gotcha removeEventListener needs the same reference
```js
el.addEventListener('click', () => doThing());
el.removeEventListener('click', () => doThing());   // does nothing — different function
```
Store the handler in a variable, or use `{ once: true }`, or an `AbortController`:
```js
const controller = new AbortController();
el.addEventListener('click', handler, { signal: controller.signal });
controller.abort();     // removes it — and any others using the same signal
```
:::

Options worth knowing:

```js
el.addEventListener('click', fn, { once: true });      // auto-removes after one call
el.addEventListener('scroll', fn, { passive: true });  // promises not to preventDefault — smoother scrolling
el.addEventListener('click', fn, { capture: true });   // fire during capture phase
```

# The event object

```html run title="What's in an event"
<div id="zone">Click, move over, or press a key here (click first)</div>
<pre id="log"></pre>

<style>
  body { font-family: system-ui; font-size: 14px; }
  #zone { padding: 24px; background: #edf2f7; border-radius: 8px; cursor: pointer; }
  #zone:focus { outline: 3px solid #4299e1; }
  pre { font-size: 12px; background: #f7fafc; padding: 8px; max-height: 120px; overflow: auto; }
</style>

<script>
  const zone = document.getElementById('zone');
  const log = document.getElementById('log');
  zone.tabIndex = 0;

  const print = (s) => { log.textContent = s + '\n' + log.textContent; };

  zone.addEventListener('click', (e) => {
    print(`click  target=${e.target.id} coords=(${e.offsetX},${e.offsetY}) shift=${e.shiftKey}`);
  });
  zone.addEventListener('keydown', (e) => {
    print(`keydown key="${e.key}" code=${e.code} ctrl=${e.ctrlKey}`);
  });
</script>
```

Common properties:

| Property | Meaning |
|---|---|
| `e.target` | The element that *actually* triggered it (possibly a child) |
| `e.currentTarget` | The element the listener is attached to |
| `e.type` | `'click'`, `'keydown'`… |
| `e.key` / `e.code` | The character typed / the physical key |
| `e.clientX/Y`, `e.offsetX/Y` | Pointer position |
| `e.shiftKey`, `e.ctrlKey`, `e.metaKey`, `e.altKey` | Modifiers |
| `e.preventDefault()` | Cancel the browser's default action |
| `e.stopPropagation()` | Stop the event travelling further |

# Bubbling, capturing and delegation

An event on a nested element travels in three phases: **capture** (window down to the target), **target**, then **bubble** (target back up to window). Listeners fire on the bubble phase by default.

```html run title="Watch an event bubble"
<div id="grandparent">grandparent
  <div id="parent">parent
    <button id="child">child — click me</button>
  </div>
</div>
<pre id="log"></pre>

<style>
  body { font-family: system-ui; font-size: 13px; }
  div { padding: 14px; border: 2px solid #cbd5e0; border-radius: 6px; }
  #parent { background: #ebf8ff; }
  pre { background: #f7fafc; padding: 8px; }
</style>

<script>
  const log = document.getElementById('log');
  ['grandparent', 'parent', 'child'].forEach(id => {
    document.getElementById(id).addEventListener('click', (e) => {
      log.textContent += `bubble: ${id} (target was ${e.target.id})\n`;
    });
  });
  // A capture-phase listener fires first, on the way down
  document.getElementById('grandparent').addEventListener('click', () => {
    log.textContent += 'CAPTURE: grandparent (fires first)\n';
  }, true);
</script>
```

## Event delegation

Because events bubble, **one listener on a parent can handle all its children** — including children added later.

```html run title="Delegation: one listener, any number of items"
<ul id="list">
  <li>Item 1 <button data-action="delete">×</button></li>
  <li>Item 2 <button data-action="delete">×</button></li>
</ul>
<button id="add">Add item (new ones work too)</button>

<style>
  body { font-family: system-ui; font-size: 14px; }
  li { padding: 6px; display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; }
  button { cursor: pointer; }
</style>

<script>
  const list = document.getElementById('list');
  let n = 2;

  // ONE listener handles every button, now and in the future
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="delete"]');
    if (!btn) return;                      // clicked something else — ignore
    btn.closest('li').remove();
  });

  document.getElementById('add').addEventListener('click', () => {
    n++;
    list.insertAdjacentHTML('beforeend', `<li>Item ${n} <button data-action="delete">×</button></li>`);
  });
</script>
```

Delegation is the standard pattern for dynamic lists. The alternative — attaching a listener to every item and re-attaching whenever you re-render — is more code, more memory, and a common source of "the buttons stopped working after I refreshed the list".

The `e.target.closest(...)` + early return is the idiomatic shape. Note `e.target` may be an icon *inside* the button, which is exactly why `closest` is used rather than checking `e.target` directly.

# preventDefault and stopPropagation

```html run title="Cancelling defaults"
<form id="form">
  <input name="q" placeholder="Press Enter — no page reload">
  <button>Submit</button>
</form>
<p><a href="https://example.com" id="link">This link is cancelled</a></p>
<p id="msg"></p>

<script>
  const msg = document.getElementById('msg');

  document.getElementById('form').addEventListener('submit', (e) => {
    e.preventDefault();                    // stop the browser navigating
    msg.textContent = 'Form handled in JavaScript at ' + new Date().toLocaleTimeString();
  });

  document.getElementById('link').addEventListener('click', (e) => {
    e.preventDefault();
    msg.textContent = 'Navigation prevented.';
  });
</script>
```

- **`preventDefault()`** stops the browser's built-in behaviour (following a link, submitting a form, checking a checkbox).
- **`stopPropagation()`** stops the event reaching other elements. Use it sparingly — it breaks delegation and other code's listeners, often mysteriously.

They are unrelated: `preventDefault` doesn't stop propagation, and `stopPropagation` doesn't prevent the default.

# The events you'll actually use

```js
// Mouse / pointer
'click', 'dblclick', 'mousedown', 'mouseup', 'mouseenter', 'mouseleave', 'contextmenu'
'pointerdown', 'pointermove', 'pointerup'   // unified mouse + touch + pen — prefer these

// Keyboard
'keydown', 'keyup'     // 'keypress' is deprecated

// Form
'submit', 'input', 'change', 'focus', 'blur', 'reset'

// Window / document
'DOMContentLoaded'     // HTML parsed; images may still be loading
'load'                 // everything, including images
'resize', 'scroll', 'beforeunload', 'visibilitychange'
```

:::tip `input` vs `change`
`input` fires on **every keystroke** — use it for live search and character counters.
`change` fires when the value is **committed** (blur for text, immediately for checkboxes and selects) — use it for validation and saving.
:::

# Throttling and debouncing

Scroll, resize, mousemove and keystroke events fire *constantly*. Running expensive work on each one makes a page stutter.

```html run title="Debounced search input"
<input id="search" placeholder="Type quickly…">
<pre id="log"></pre>

<style>
  body { font-family: system-ui; font-size: 14px; }
  input { padding: 8px; font: inherit; width: 100%; box-sizing: border-box; }
  pre { background: #f7fafc; padding: 8px; font-size: 12px; max-height: 120px; overflow: auto; }
</style>

<script>
  const log = document.getElementById('log');

  function debounce(fn, wait) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  }

  const search = (value) => { log.textContent = `SEARCH REQUEST for "${value}"\n` + log.textContent; };
  const debouncedSearch = debounce(search, 400);

  document.getElementById('search').addEventListener('input', (e) => {
    log.textContent = `keystroke: "${e.target.value}"\n` + log.textContent;
    debouncedSearch(e.target.value);
  });
</script>
```

Type quickly: every keystroke logs, but only one search request fires, 400ms after you stop. Without this, a search box makes one network request per character.

- **Debounce** — wait until activity stops. Search inputs, autosave, resize.
- **Throttle** — run at most once per interval. Scroll position, mousemove tracking.

# Custom events

```js run
// Dispatch your own events — useful for decoupling components
document.addEventListener('cart:updated', (e) => {
  console.log('Cart now has', e.detail.count, 'items');
});

document.dispatchEvent(new CustomEvent('cart:updated', {
  detail: { count: 3 },
  bubbles: true
}));
```

# Keyboard accessibility

```js
// A div with a click handler is invisible to keyboard users.
// If you must use one (you usually shouldn't), you need all of this:
div.tabIndex = 0;
div.setAttribute('role', 'button');
div.addEventListener('click', doThing);
div.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doThing(); }
});

// Or: use <button>, which does all of that for free.
```

:::quiz
? What is event delegation?
- Passing events between components
- Attaching one listener to a parent to handle events from its children *
- Delaying an event handler
- Using capture phase
> It works because events bubble, and it automatically covers elements added later.

? `e.target` vs `e.currentTarget`?
- They are always the same
- `target` is what was actually clicked; `currentTarget` is where the listener sits *
- `currentTarget` is the parent
- `target` is the window
> With delegation the distinction is essential — and why `closest()` is used.

? Why does `removeEventListener` with an inline arrow function fail?
- Arrows can't be event handlers
- It's a different function object than the one added *
- You must use `once: true`
- Arrows don't bubble
> Keep a reference, or use an AbortController signal.

? Which event fires on every keystroke in a text field?
- change
- input *
- keyup only
- submit
> `change` waits until the value is committed (usually on blur).

? Why debounce a search input?
- To make typing feel slower
- To avoid firing a request on every single keystroke *
- To prevent XSS
- Because input events don't bubble
> Debounce waits for a pause; throttle caps the rate.

? What does `{ passive: true }` on a scroll listener do?
- Makes the handler run later
- Promises not to call preventDefault, letting the browser scroll without waiting *
- Prevents bubbling
- Removes the listener after one call
> Without it the browser must wait to see whether you'll cancel the scroll.
:::

:::exercise Build a to-do list with delegation
Build a list with an input to add items. Using a **single** delegated listener on the `<ul>`:

- clicking an item's text toggles a `.done` class (line-through);
- clicking its × button removes it;
- pressing Enter in the input adds a new item.

Verify that items added *after* page load behave identically — that's the whole point of delegation.
:::
