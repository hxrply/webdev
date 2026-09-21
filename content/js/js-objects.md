Objects hold named values. Nearly everything in JavaScript that isn't a primitive is one — arrays, functions, dates, DOM elements. Getting comfortable with them is essential.

# Creating and accessing

```js run
const user = {
  name: 'Ada Lovelace',
  born: 1815,
  'favourite language': 'Analytical Engine',   // quotes needed for odd keys
  isActive: true,
  greet() {                                     // method shorthand
    return `Hi, I'm ${this.name}`;
  }
};

console.log(user.name);                       // dot notation
console.log(user['favourite language']);      // bracket notation, required here
console.log(user.greet());

const key = 'born';
console.log(user[key]);                       // brackets for dynamic keys

user.email = 'ada@example.com';               // add
user.born = 1816;                             // update
delete user.isActive;                         // remove
console.log(Object.keys(user));
```

Use dot notation unless the key is dynamic, contains spaces, or starts with a digit.

# Nesting and safe access

```js run
const order = {
  id: 1001,
  customer: { name: 'Ada', address: { city: 'London', postcode: 'E1 6AN' } },
  items: [
    { product: 'Keyboard', qty: 1, price: 89 },
    { product: 'Hub',      qty: 2, price: 39 }
  ]
};

console.log(order.customer.address.city);
console.log(order.items[1].product);
console.log(order.items.reduce((s, i) => s + i.qty * i.price, 0));

// Optional chaining for paths that might not exist
console.log(order.customer?.phone?.mobile);        // undefined, no crash
console.log(order.shipping?.tracking ?? 'not yet shipped');
```

# Destructuring

```js run
const config = { host: 'localhost', port: 3000, secure: false, db: { name: 'app' } };

const { host, port } = config;
console.log(host, port);

const { secure: isSecure } = config;              // rename
const { timeout = 5000 } = config;                // default for a missing key
const { db: { name: dbName } } = config;          // nested
const { host: h, ...others } = config;            // rest
console.log(isSecure, timeout, dbName, others);

// In function parameters — very common
function connect({ host, port = 80, retries = 3 }) {
  return `${host}:${port} (${retries} retries)`;
}
console.log(connect({ host: 'example.com' }));

// In loops
const users = [{ id: 1, name: 'Ada' }, { id: 2, name: 'Grace' }];
for (const { id, name } of users) console.log(id, name);
```

# Spread, merging and copying

```js run
const defaults = { theme: 'light', fontSize: 14, showTips: true };
const userPrefs = { theme: 'dark' };

const settings = { ...defaults, ...userPrefs };   // later wins
console.log(settings);

// Update without mutating — the standard pattern in React and elsewhere
const user = { name: 'Ada', role: 'user' };
const promoted = { ...user, role: 'admin' };
console.log(user, promoted);

// Conditional properties
const includeEmail = true;
const payload = { name: 'Ada', ...(includeEmail && { email: 'ada@example.com' }) };
console.log(payload);
```

:::gotcha Spread is shallow, again
```js
const original = { user: { name: 'Ada' } };
const copy = { ...original };
copy.user.name = 'Grace';
console.log(original.user.name);   // 'Grace' — nested object is shared
```
Deep copy: `structuredClone(original)`. `JSON.parse(JSON.stringify(x))` also works but silently destroys `Date`s, `undefined`, functions and `Map`s.
:::

# References vs values

```js run
// Primitives are copied by value
let a = 1;
let b = a;
b = 2;
console.log(a, b);              // 1 2 — independent

// Objects are copied by REFERENCE
const obj1 = { count: 1 };
const obj2 = obj1;
obj2.count = 99;
console.log(obj1.count);        // 99 — same object

// This is why functions can mutate their arguments
function addItem(cart) { cart.items.push('new'); }   // mutates the caller's object
const cart = { items: [] };
addItem(cart);
console.log(cart.items);

// Equality compares references
console.log({ a: 1 } === { a: 1 });   // false
console.log(obj1 === obj2);           // true
```

This is the single most important thing in this lesson. Passing an object to a function passes a *pointer to it*, not a copy — so the function can change your data. That's either a convenience or a nasty surprise, depending on whether you expected it.

# Object static methods

```js run
const scores = { ada: 95, grace: 88, alan: 91 };

console.log(Object.keys(scores));
console.log(Object.values(scores));
console.log(Object.entries(scores));

// entries + array methods is a powerful combination
const passed = Object.entries(scores).filter(([, score]) => score >= 90);
console.log(Object.fromEntries(passed));

const doubled = Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, v * 2]));
console.log(doubled);

console.log(Object.freeze({ a: 1 }));      // shallow immutability
console.log('ada' in scores);              // true
console.log(Object.hasOwn(scores, 'ada')); // true — safer than hasOwnProperty
```

# Computed keys and shorthand

```js run
const name = 'Ada';
const age = 36;
const person = { name, age };               // shorthand when key === variable name
console.log(person);

const field = 'email';
const dynamic = { [field]: 'ada@example.com', [`${field}Verified`]: true };
console.log(dynamic);
```

# Getters and setters

```js run
const account = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  _balance: 100,

  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  },
  set fullName(value) {
    [this.firstName, this.lastName] = value.split(' ');
  },
  get balance() {
    return `£${this._balance.toFixed(2)}`;
  }
};

console.log(account.fullName);        // looks like a property, runs a function
account.fullName = 'Grace Hopper';
console.log(account.firstName, account.lastName);
console.log(account.balance);
```

# JSON

```js run
const data = { name: 'Ada', tags: ['maths', 'computing'], active: true, joined: new Date('2024-01-01') };

const json = JSON.stringify(data);
console.log(json);
console.log(JSON.stringify(data, null, 2));          // pretty-printed
console.log(JSON.stringify(data, ['name', 'tags'])); // only these keys

const parsed = JSON.parse(json);
console.log(parsed.name, typeof parsed.joined);      // 'string' — Dates become strings!
```

:::warn JSON loses things
`JSON.stringify` drops `undefined` values, functions and symbols; converts `Date` to a string; and throws on circular references. Parsing back never restores the original types. Wrap `JSON.parse` in `try/catch` — malformed input throws.
:::

# Map and Set

```js run
// Map — keys of ANY type, guaranteed insertion order, easy size
const cache = new Map();
const keyObj = { id: 1 };
cache.set('string key', 'a');
cache.set(keyObj, 'object key works');
cache.set(42, 'number key stays a number');

console.log(cache.get(keyObj), cache.size, cache.has(42));
for (const [k, v] of cache) console.log(typeof k, '→', v);

// Set — unique values
const tags = new Set(['js', 'css', 'js']);
tags.add('html');
console.log([...tags], tags.size, tags.has('css'));
```

| Use | When |
|---|---|
| Object | Records with known string keys; JSON-shaped data |
| Map | Dynamic keys, non-string keys, frequent add/remove, order matters |
| Set | A collection of unique values, fast membership tests |

:::quiz
? `const a = {x: 1}; const b = a; b.x = 2;` — what is `a.x`?
- 1
- 2 *
- undefined
- An error
> Objects are assigned by reference. `b` and `a` point at the same object.

? How do you copy an object without sharing nested objects?
- `{...obj}`
- `Object.assign({}, obj)`
- `structuredClone(obj)` *
- `obj.slice()`
> The first two are shallow: nested objects are still shared.

? What does `Object.entries({a: 1, b: 2})` return?
- `['a', 'b']`
- `[1, 2]`
- `[['a', 1], ['b', 2]]` *
- `{a: 1, b: 2}`
> Pairs, which combine beautifully with array methods and `Object.fromEntries`.

? When should you use a Map instead of an object?
- Always, it is faster
- When keys aren't strings, or you add and remove entries frequently *
- When storing JSON
- When you need methods
> Maps also preserve insertion order and report `.size` directly.

? What happens to a `Date` after `JSON.parse(JSON.stringify(obj))`?
- It stays a Date
- It becomes an ISO string *
- It becomes null
- It throws
> JSON has no date type. Revive it manually if you need the object back.

? `const {port = 80} = config` when `config.port` is `0`. What is `port`?
- 80
- 0 *
- undefined
- null
> Destructuring defaults only apply to `undefined`, not to other falsy values.
:::

:::exercise Transform some data
Given:

```js
const inventory = {
  keyboard: { price: 89, stock: 42 },
  monitor:  { price: 249, stock: 0 },
  hub:      { price: 39, stock: 130 }
};
```

Write expressions that produce:

1. An array of product names.
2. Only the in-stock products, as an object.
3. Total inventory value (price × stock).
4. The same object with every price increased by 10%, without mutating the original.
5. A `Map` keyed by product name with the price as value.
:::
