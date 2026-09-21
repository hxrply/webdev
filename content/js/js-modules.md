Modules split code into files with explicit imports and exports. Before them, everything shared one global namespace and load order was a minefield.

# import / export

```js
// math.js — named exports
export const PI = 3.14159;
export function add(a, b) { return a + b; }
export function multiply(a, b) { return a * b; }

// Or export at the bottom, which keeps the list visible in one place
const subtract = (a, b) => a - b;
export { subtract };
```

```js
// main.js
import { add, PI } from './math.js';
import { add as sum } from './math.js';        // rename
import * as math from './math.js';             // everything as a namespace

console.log(add(2, 3), PI, math.multiply(2, 3));
```

## Default exports

```js
// Button.js — one main thing per file
export default function Button(label) { /* … */ }

// Or combined with named exports
export default class Modal { }
export const MODAL_SIZES = ['sm', 'md', 'lg'];
```

```js
import Button from './Button.js';              // no braces; you choose the name
import Modal, { MODAL_SIZES } from './Modal.js';
```

:::tip Prefer named exports
Default exports can be imported under any name, so the same thing ends up called `Button`, `Btn` and `MyButton` across a codebase. Named exports also autocomplete better and make refactoring tools more reliable. Many style guides now ban defaults outright.
:::

# Using modules in a browser

```html
<script type="module" src="js/main.js"></script>
```

Modules differ from classic scripts in ways worth knowing:

- **Deferred by default** — they run after HTML parsing, no `defer` needed.
- **Strict mode always.** No accidental globals.
- **Own scope.** Top-level `const` doesn't touch `window`.
- **Fetched with CORS**, so `file://` won't work — you need a local server.
- **Evaluated once**, however many times they're imported.
- **`await` works at the top level.**

```js
// Paths must be explicit in the browser
import { add } from './math.js';     // ✓
import { add } from './math';        // ✗ no extension — bundlers allow this, browsers don't
```

# Dynamic imports

```js run
// Load a module on demand — returns a promise
async function loadChart() {
  console.log('loading the chart module only when needed…');
  // const { renderChart } = await import('./chart.js');
  // renderChart(data);
  console.log('this is how you code-split: heavy code is only fetched if used');
}
loadChart();
```

Use it for anything large and conditionally needed — a chart library, a rich text editor, an admin panel. The initial bundle stays small.

# Circular dependencies

```js
// a.js
import { b } from './b.js';
export const a = 'a' + b;

// b.js
import { a } from './a.js';         // circular!
export const b = 'b' + a;           // a is undefined here
```

Modules handle cycles without crashing, but values may be `undefined` at the wrong moment. If you hit one, it usually means two modules should be one, or a third module should hold the shared piece.

# ESM vs CommonJS

Node originally used CommonJS; ESM is the standard now, and Node supports both.

```js
// CommonJS (older Node, still extremely common)
const fs = require('fs');
module.exports = { add };

// ESM (the standard)
import fs from 'node:fs';
export { add };
```

In Node, `"type": "module"` in `package.json` makes `.mjs`-style ESM the default; otherwise files are CommonJS unless named `.mjs`. Mixing them causes the classic `Cannot use import statement outside a module` error.

# Modern syntax worth having at your fingertips

```js run
// Template literals
const name = 'Ada', items = 3;
console.log(`${name} has ${items} item${items === 1 ? '' : 's'}`);

// Destructuring with defaults and renaming
const { host = 'localhost', port: p = 3000 } = { port: 8080 };
console.log(host, p);

// Spread and rest
const merged = { ...{ a: 1 }, ...{ b: 2 } };
const [first, ...others] = [1, 2, 3];
console.log(merged, first, others);

// Optional chaining and nullish coalescing
const config = { db: null };
console.log(config.db?.host ?? 'no database configured');

// Logical assignment
let settings = { theme: null, count: 0 };
settings.theme ??= 'dark';        // assign only if null/undefined
settings.count ||= 10;            // assign if falsy — careful, 0 is falsy
settings.debug &&= false;
console.log(settings);

// Array and object helpers
console.log([1, [2, [3]]].flat(2));
console.log(Object.entries({ a: 1 }).map(([k, v]) => `${k}=${v}`));
console.log([3, 1, 2].toSorted());              // non-mutating
console.log([1, 2, 3].at(-1));                  // last item
console.log(Object.groupBy?.([1,2,3,4], n => n % 2 ? 'odd' : 'even') ?? 'not supported here');

// Numeric separators and padding
console.log(1_000_000, String(7).padStart(3, '0'));

// String helpers
console.log('  x '.trimStart(), 'abc'.replaceAll('b', 'B'), 'ab'.at(-1));
```

# Formatting data for humans

```js run
const n = 1234567.891;
console.log(new Intl.NumberFormat('en-GB').format(n));
console.log(new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n));
console.log(new Intl.NumberFormat('de-DE').format(n));

const d = new Date('2025-03-14T15:09:00Z');
console.log(new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeStyle: 'short', timeZone: 'UTC' }).format(d));

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
console.log(rtf.format(-1, 'day'), '/', rtf.format(3, 'hour'));

console.log(new Intl.ListFormat('en', { style: 'long', type: 'conjunction' })
  .format(['HTML', 'CSS', 'JavaScript']));
```

`Intl` is built into every browser and handles currencies, plurals, relative times and list punctuation correctly for any locale. Hand-rolling "3 days ago" logic is a classic reinvention of a wheel that's already in the runtime.

:::note Dates are JavaScript's weakest area
The `Date` object is famously awkward: months are zero-indexed, parsing non-ISO strings is unreliable, and there's no real timezone support. `Temporal` — a proper replacement — is arriving in browsers now. Until it's everywhere, use `Intl` for formatting and a library (date-fns, Day.js) for arithmetic.
:::

# A quick tour of tooling

You can build plenty without any of this. But once a project grows:

- **npm** — installs packages, runs scripts.
- **Vite** — dev server with instant hot reload, plus a production build. The current default for new projects.
- **Bundler** (esbuild/Rollup, inside Vite) — combines modules into optimised files, removes unused code (tree shaking), splits bundles.
- **Prettier** — formats code. Ends all formatting arguments.
- **ESLint** — catches likely bugs and enforces conventions.
- **TypeScript** — adds static types. A significant investment that pays off on anything you'll maintain.

```bash
npm create vite@latest my-app
cd my-app
npm install
npm run dev
```

:::quiz
? Why do browser imports need the `.js` extension?
- To identify the file type for the server
- Browsers resolve module paths literally as URLs; bundlers are what allow omitting it *
- It is a security requirement
- Only in strict mode
> `./math` is a valid URL that simply doesn't exist.

? What is the main advantage of named exports over default?
- Faster loading
- Consistent naming across the codebase and better tooling support *
- They allow more exports
- They work in CommonJS
> A default export can be renamed at every import site, which fragments naming.

? What does `import()` (the function form) return?
- The module's exports
- A promise resolving to the module namespace *
- undefined
- A string
> That's what makes code splitting possible — the module is fetched on demand.

? `settings.count ||= 10` when `count` is `0`. Result?
- 0
- 10 *
- undefined
- An error
> `||=` assigns on any falsy value. Use `??=` if `0` is a legitimate value.

? Which is true of `<script type="module">`?
- It runs immediately, blocking parsing
- It is deferred by default and runs in strict mode with its own scope *
- It requires the defer attribute
- It exposes top-level variables on window
> Which is why modules can't be loaded from `file://` — they're fetched with CORS rules.

? What does `Intl.NumberFormat` do?
- Rounds numbers
- Formats numbers per locale, including currency and grouping *
- Parses strings to numbers
- Converts currencies
> It handles separators, decimal marks and currency symbols for any locale.
:::

:::exercise Split a file into modules
Take a single-file script of 100+ lines and split it into: `api.js` (fetch wrappers), `render.js` (DOM building), `storage.js` (persistence) and `main.js` (wiring). Use named exports, load with `<script type="module">`, and serve it locally. Then convert one heavy import to a dynamic `import()` triggered by a button.
:::
