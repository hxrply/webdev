The DOM — Document Object Model — is the browser's live, in-memory representation of your page, exposed to JavaScript as a tree of objects. Change the DOM and the screen changes.

# Selecting elements

```html run title="Every way to select"
<div id="app">
  <h2 class="title">Heading</h2>
  <p class="text">First paragraph</p>
  <p class="text highlight">Second paragraph</p>
  <ul><li>A</li><li>B</li></ul>
</div>
<pre id="out"></pre>

<script>
  const out = document.getElementById('out');
  const show = (label, v) => out.textContent += label + ': ' + v + '\n';

  show('getElementById', document.getElementById('app').tagName);
  show('querySelector', document.querySelector('.text').textContent);
  show('querySelectorAll length', document.querySelectorAll('.text').length);
  show('complex selector', document.querySelector('#app p.highlight').textContent);
  show('closest', document.querySelector('li').closest('div').id);
  show('children count', document.getElementById('app').children.length);
</script>
```

| Method | Returns |
|---|---|
| `getElementById('x')` | One element or `null` |
| `querySelector('css')` | The **first** match or `null` |
| `querySelectorAll('css')` | A static **NodeList** of all matches |
| `closest('css')` | The nearest **ancestor** matching (including itself) |
| `element.children` | Child elements (live HTMLCollection) |
| `element.parentElement` / `nextElementSibling` | Navigation |

`querySelector` takes any CSS selector, which means everything you learned in the CSS track applies here.

:::gotcha NodeList is not an Array
```js
const items = document.querySelectorAll('li');
items.forEach(el => ...);   // ✓ works
items.map(el => ...);       // ✗ TypeError — no map
[...items].map(el => ...);  // ✓ spread into a real array
```
`getElementsByClassName` returns a **live** HTMLCollection that updates as the DOM changes, and has no `forEach` at all. Prefer `querySelectorAll`.
:::

# Reading and changing content

```html run title="textContent vs innerHTML"
<div id="demo">Original <strong>content</strong></div>
<button id="b1">textContent</button>
<button id="b2">innerHTML</button>
<button id="b3">Reset</button>
<p id="note"></p>

<script>
  const demo = document.getElementById('demo');
  const original = demo.innerHTML;

  document.getElementById('b1').onclick = () => {
    demo.textContent = '<em>Escaped</em> — tags shown as text';
  };
  document.getElementById('b2').onclick = () => {
    demo.innerHTML = '<em>Parsed</em> — tags become real elements';
  };
  document.getElementById('b3').onclick = () => { demo.innerHTML = original; };

  console.log('textContent:', demo.textContent);
  console.log('innerHTML:', demo.innerHTML);
</script>
```

- **`textContent`** — plain text in and out. Safe, fast. **Your default.**
- **`innerHTML`** — parses HTML. Powerful and dangerous.
- **`innerText`** — like textContent but reflects rendering (skips hidden elements). Slower, because it forces layout.

:::warn innerHTML with user input is an XSS vulnerability
```js
el.innerHTML = `<p>Welcome, ${username}</p>`;   // if username contains <img onerror=...>
```
That runs attacker code in your users' browsers with their session. Use `textContent` for anything a user supplied. If you genuinely need HTML from untrusted input, sanitise it with a library like DOMPurify.
:::

# Attributes, properties and data

```html run title="Attributes vs properties"
<input id="field" type="text" value="initial">
<a id="link" href="/about" data-tracking-id="nav-1" data-section="header">About</a>
<pre id="out"></pre>

<script>
  const field = document.getElementById('field');
  const link = document.getElementById('link');
  const out = document.getElementById('out');
  const p = (s) => out.textContent += s + '\n';

  // Attribute = what's in the HTML. Property = the live state.
  field.value = 'typed by the user';
  p('getAttribute("value"): ' + field.getAttribute('value'));   // 'initial'
  p('.value property:       ' + field.value);                   // 'typed by the user'

  p('href attribute: ' + link.getAttribute('href'));            // '/about'
  p('href property:  ' + link.href);                            // fully resolved URL

  // data-* attributes
  p('dataset.trackingId: ' + link.dataset.trackingId);          // kebab → camel
  p('dataset.section:    ' + link.dataset.section);
  link.dataset.visited = 'true';
  p('after setting: ' + link.outerHTML);
</script>
```

`data-*` attributes are the sanctioned way to attach your own metadata to elements, reachable via `element.dataset` with names converted from `kebab-case` to `camelCase`.

# Classes and styles

```html run title="classList and style"
<div id="box">Click the buttons</div>
<button id="add">Add class</button>
<button id="toggle">Toggle</button>
<button id="style">Inline style</button>

<style>
  body { font-family: system-ui; }
  #box { padding: 20px; background: #edf2f7; border-radius: 8px; margin-bottom: 10px; transition: all .2s; }
  #box.active { background: #4299e1; color: white; }
  #box.big { font-size: 1.5rem; }
</style>

<script>
  const box = document.getElementById('box');

  document.getElementById('add').onclick    = () => box.classList.add('active');
  document.getElementById('toggle').onclick = () => box.classList.toggle('big');
  document.getElementById('style').onclick  = () => {
    box.style.borderRadius = '30px';           // camelCase for hyphenated properties
    box.style.setProperty('--custom', 'x');    // custom properties need setProperty
  };

  console.log('has active?', box.classList.contains('active'));
</script>
```

```js
el.classList.add('a', 'b');
el.classList.remove('a');
el.classList.toggle('open');          // returns true if now present
el.classList.toggle('open', force);   // add if force is true, remove if false
el.classList.replace('old', 'new');
```

:::tip Prefer classes to inline styles
`element.style.color = 'red'` writes an inline style with the highest specificity, which then fights your stylesheet. Define the look in CSS and toggle a class. Your JavaScript describes *state*; your CSS describes *appearance*.
:::

# Creating and inserting elements

```html run title="Building DOM"
<ul id="list"></ul>
<button id="addItem">Add an item</button>

<style>
  body { font-family: system-ui; }
  li { padding: 6px; border-bottom: 1px solid #e2e8f0; }
  button { padding: 8px 14px; margin-top: 10px; font: inherit; cursor: pointer; }
</style>

<script>
  const list = document.getElementById('list');
  let n = 0;

  function addItem() {
    n++;
    const li = document.createElement('li');
    li.textContent = `Item ${n}`;
    li.dataset.index = n;
    list.appendChild(li);
  }

  document.getElementById('addItem').addEventListener('click', addItem);
  addItem(); addItem();
</script>
```

The insertion methods:

```js
parent.appendChild(el);                    // add as last child
parent.prepend(el);                        // add as first child
parent.append(el1, el2, 'text');           // multiple, accepts strings
ref.before(el);  ref.after(el);            // as a sibling
ref.replaceWith(el);
el.remove();                               // delete itself
parent.insertAdjacentHTML('beforeend', '<li>x</li>');   // parse HTML in place
```

## Building many elements efficiently

```js run
// Slow: touches the live DOM on every iteration
// for (const item of items) list.appendChild(makeLi(item));

// Better: build off-screen, insert once
const fragment = document.createDocumentFragment();
for (let i = 0; i < 3; i++) {
  const li = document.createElement('li');
  li.textContent = 'Item ' + i;
  fragment.appendChild(li);
}
console.log('fragment children:', fragment.children.length, '— one DOM insertion');

// Also fine for simple cases: build a string, assign once
const html = [1, 2, 3].map(n => `<li>Item ${n}</li>`).join('');
console.log(html);
```

Each DOM insertion can trigger layout recalculation. Batching into a fragment or a single `innerHTML` assignment is meaningfully faster for large lists. (And with `innerHTML`, escape any user data first.)

# Traversing

```js
el.parentElement
el.children              // element children only
el.firstElementChild / el.lastElementChild
el.nextElementSibling / el.previousElementSibling
el.closest('.card')      // nearest ancestor matching a selector
el.matches('.active')    // does this element match?
el.contains(other)       // is other inside el?
```

Prefer the `*Element*` versions — `childNodes` and `nextSibling` include text nodes (whitespace between tags), which is almost never what you want.

# Measuring and scrolling

```js
el.getBoundingClientRect();      // {top, left, width, height, ...} relative to viewport
el.offsetWidth / offsetHeight;   // layout size including padding + border
el.scrollIntoView({ behavior: 'smooth', block: 'center' });
window.scrollY;                  // how far the page is scrolled
```

:::gotcha Reading layout forces synchronous work
Interleaving reads (`offsetHeight`) and writes (`style.width`) in a loop causes **layout thrashing** — the browser must recalculate on every read. Batch all reads, then all writes.
:::

# A complete example

```html run title="Render a list from data"
<input id="filter" placeholder="Filter products…">
<ul id="products"></ul>

<style>
  body { font-family: system-ui; }
  input { padding: 8px; font: inherit; width: 100%; box-sizing: border-box; margin-bottom: 10px; }
  li { padding: 8px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; }
  .out-of-stock { opacity: .5; }
  .empty { color: #718096; font-style: italic; }
</style>

<script>
  const products = [
    { name: 'Keyboard', price: 89, stock: 42 },
    { name: 'Monitor', price: 249, stock: 0 },
    { name: 'USB-C Hub', price: 39, stock: 130 },
    { name: 'Desk Lamp', price: 32, stock: 58 }
  ];

  const list = document.getElementById('products');
  const filter = document.getElementById('filter');

  function render(items) {
    list.textContent = '';                       // clear

    if (items.length === 0) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'No products match.';
      list.appendChild(li);
      return;
    }

    const frag = document.createDocumentFragment();
    for (const p of items) {
      const li = document.createElement('li');
      li.classList.toggle('out-of-stock', p.stock === 0);

      const name = document.createElement('span');
      name.textContent = p.name;                 // textContent — safe with any data

      const price = document.createElement('strong');
      price.textContent = '£' + p.price;

      li.append(name, price);
      frag.appendChild(li);
    }
    list.appendChild(frag);
  }

  filter.addEventListener('input', () => {
    const q = filter.value.toLowerCase();
    render(products.filter(p => p.name.toLowerCase().includes(q)));
  });

  render(products);
</script>
```

That pattern — **data → render function → re-render on change** — is the core idea every front-end framework automates.

:::quiz
? Which is safe for inserting text a user typed?
- innerHTML
- textContent *
- insertAdjacentHTML
- outerHTML
> `innerHTML` parses tags, which is how cross-site scripting happens.

? `document.querySelectorAll('li').map(...)` throws. Why?
- li elements can't be mapped
- It returns a NodeList, which has forEach but not map *
- You need getElementsByTagName
- The selector is wrong
> Spread it first: `[...document.querySelectorAll('li')].map(...)`.

? An input's HTML says `value="initial"` but the user typed something. What does `getAttribute('value')` return?
- What the user typed
- 'initial' — the attribute, not the live property *
- undefined
- An empty string
> `.value` is the live property; the attribute holds the original HTML value.

? How do you read `data-user-id="7"`?
- `el.getAttribute('userId')`
- `el.dataset.userId` *
- `el.data.userId`
- `el.userId`
> Hyphenated data attributes become camelCase on `dataset`.

? Why use a DocumentFragment for adding 100 elements?
- It sorts them
- It builds off-screen so the DOM is touched once instead of 100 times *
- It is required for lists
- It escapes HTML automatically
> Each live insertion can trigger layout work.

? Which finds the nearest ancestor matching a selector?
- querySelector
- parentElement
- closest *
- matches
> `closest` walks up the tree (and includes the element itself).
:::

:::exercise Build a live-filtering list
Start from an array of ten objects. Render them as a list. Add a text input that filters as you type, a dropdown that sorts by name or price, and a counter showing "showing X of Y". Use `textContent`, a render function that redraws from the data, and a DocumentFragment.
:::
