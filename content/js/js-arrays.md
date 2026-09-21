Arrays are ordered lists, and their methods are the single most-used part of JavaScript. Learn these properly and a large amount of code writes itself.

# Basics

```js run
const fruits = ['apple', 'banana', 'cherry'];

console.log(fruits[0], fruits[2]);      // zero-indexed
console.log(fruits.at(-1));             // 'cherry' — negative indexes
console.log(fruits.length);
console.log(fruits.indexOf('banana'));  // 1, or -1 if absent
console.log(fruits.includes('cherry')); // true

fruits[1] = 'blueberry';
console.log(fruits);

console.log(Array.isArray(fruits));     // the correct check — typeof says 'object'
```

# Mutating vs non-mutating

This distinction causes more bugs than any other part of arrays.

```js run
const nums = [3, 1, 2];

// MUTATING — change the original, usually return something else
nums.push(4);            // add to end, returns new length
nums.unshift(0);         // add to start
console.log(nums);
console.log(nums.pop()); // remove & return last
console.log(nums.shift());// remove & return first
nums.splice(1, 1);       // remove 1 item at index 1
console.log(nums);
nums.sort();             // sorts IN PLACE
nums.reverse();          // reverses IN PLACE
console.log(nums);

// NON-MUTATING — return a new array, original untouched
const original = [3, 1, 2];
console.log(original.slice(0, 2));   // [3, 1]
console.log(original.concat([9]));   // [3, 1, 2, 9]
console.log(original.toSorted());    // [1, 2, 3] — newer, non-mutating sort
console.log(original.toReversed());
console.log([...original, 4]);       // spread into a new array
console.log(original);               // still [3, 1, 2] ✓
```

:::gotcha `sort()` mutates, and sorts as strings
```js
[10, 9, 100].sort()                    // [10, 100, 9]  ← string comparison!
[10, 9, 100].sort((a, b) => a - b)     // [9, 10, 100]  ✓
```
Always pass a comparator for numbers. And remember it modifies the array in place — use `toSorted()` (or `[...arr].sort()`) when the original matters.
:::

# The big five

```js run
const products = [
  { name: 'Keyboard', price: 89,  category: 'peripherals', stock: 42 },
  { name: 'Monitor',  price: 249, category: 'displays',    stock: 12 },
  { name: 'Hub',      price: 39,  category: 'peripherals', stock: 130 },
  { name: 'Stand',    price: 24,  category: 'accessories', stock: 0 },
  { name: 'Mouse',    price: 45,  category: 'peripherals', stock: 64 }
];

// map — transform each item, same length out
console.log(products.map(p => p.name));
console.log(products.map(p => ({ ...p, price: p.price * 1.2 })).map(p => p.price.toFixed(2)));

// filter — keep matching items, shorter or equal length
console.log(products.filter(p => p.stock > 0).map(p => p.name));

// find / findIndex — the first match, or undefined / -1
console.log(products.find(p => p.price < 40));
console.log(products.findIndex(p => p.stock === 0));

// some / every — booleans
console.log(products.some(p => p.stock === 0));       // any out of stock?
console.log(products.every(p => p.price > 20));       // all above £20?

// reduce — collapse to a single value
const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
console.log('inventory value:', totalValue);
```

# reduce, properly explained

`reduce` intimidates people. It's just a loop with an accumulator:

```js run
const nums = [1, 2, 3, 4];

// These are equivalent
let sum1 = 0;
for (const n of nums) sum1 = sum1 + n;

const sum2 = nums.reduce((accumulator, current) => accumulator + current, 0);
//                        ^ the running total  ^ this item          ^ starting value

console.log(sum1, sum2);
```

Once you see it as "a running value plus each item", the useful patterns open up:

```js run
const people = [
  { name: 'Ada',    dept: 'eng'   },
  { name: 'Grace',  dept: 'eng'   },
  { name: 'Alan',   dept: 'maths' }
];

// Group by a key — extremely common
const byDept = people.reduce((acc, p) => {
  (acc[p.dept] ||= []).push(p.name);
  return acc;
}, {});
console.log(byDept);

// Count occurrences
const votes = ['a', 'b', 'a', 'c', 'a'];
console.log(votes.reduce((acc, v) => ({ ...acc, [v]: (acc[v] || 0) + 1 }), {}));

// Build a lookup map by id
const users = [{ id: 7, name: 'Ada' }, { id: 9, name: 'Grace' }];
console.log(users.reduce((acc, u) => { acc[u.id] = u; return acc; }, {}));

// Max by a property
console.log(people.reduce((a, b) => a.name.length >= b.name.length ? a : b));
```

:::tip `Object.groupBy` now exists
```js
Object.groupBy(people, p => p.dept)
```
Newer browsers have this built in. The `reduce` version above still works everywhere and is worth understanding.
:::

# Chaining

```js run
const orders = [
  { id: 1, total: 120, status: 'shipped'   },
  { id: 2, total: 45,  status: 'cancelled' },
  { id: 3, total: 300, status: 'shipped'   },
  { id: 4, total: 80,  status: 'pending'   }
];

const revenue = orders
  .filter(o => o.status === 'shipped')
  .map(o => o.total)
  .reduce((sum, t) => sum + t, 0);

console.log('shipped revenue:', revenue);

// Read it top to bottom: keep shipped → take totals → add them up.
```

Chaining reads beautifully. It does iterate the array once per method, which is irrelevant for hundreds of items and worth collapsing into one `reduce` for millions.

# Spread, destructuring and copying

```js run
const a = [1, 2, 3];
const b = [4, 5];

console.log([...a, ...b]);          // combine
console.log(Math.max(...a));        // spread as arguments

const [first, second, ...rest] = [10, 20, 30, 40];
console.log(first, second, rest);

const [x = 0, y = 0] = [5];         // defaults
console.log(x, y);

let p = 1, q = 2;
[p, q] = [q, p];                    // swap
console.log(p, q);
```

:::gotcha Spread copies are shallow
```js
const orig = [{ n: 1 }, { n: 2 }];
const copy = [...orig];
copy[0].n = 99;
console.log(orig[0].n);   // 99 — the objects inside are shared!
```
`[...arr]` gives you a new array holding the *same* object references. For a deep copy: `structuredClone(orig)`.
:::

# Other useful methods

```js run
console.log([1, [2, [3, [4]]]].flat(2));              // [1, 2, 3, [4]]
console.log([[1, 2], [3]].flatMap(x => x));           // [1, 2, 3]
console.log(Array.from({ length: 5 }, (_, i) => i * i));  // [0,1,4,9,16]
console.log(Array(3).fill('x'));
console.log([1,2,3,4].join(' – '));
console.log([...new Set([1, 2, 2, 3, 3, 3])]);        // deduplicate
console.log(Array.from('hello'));                      // string → array of chars
console.log([3,1,2].toSorted((a,b) => b - a));         // descending, non-mutating
```

# Sorting properly

```js run
const items = [
  { name: 'Cherry', price: 3,  date: '2024-03-01' },
  { name: 'apple',  price: 10, date: '2023-11-15' },
  { name: 'Banana', price: 3,  date: '2025-01-20' }
];

// Numbers
console.log(items.toSorted((a, b) => a.price - b.price).map(i => i.name));

// Strings, case- and accent-aware
console.log(items.toSorted((a, b) => a.name.localeCompare(b.name)).map(i => i.name));

// Dates (ISO strings sort correctly as strings, conveniently)
console.log(items.toSorted((a, b) => a.date.localeCompare(b.date)).map(i => i.date));

// Multi-key: price ascending, then name
console.log(items.toSorted((a, b) => a.price - b.price || a.name.localeCompare(b.name)).map(i => i.name));
```

That `||` trick for multi-key sorting is worth remembering: the first comparator returns 0 for ties, so the second one decides.

:::quiz
? Which methods mutate the original array?
- map, filter, slice
- push, sort, splice, reverse *
- concat, join, find
- every, some, reduce
> `toSorted` and `toReversed` are the non-mutating versions of two of those.

? `[10, 9, 100].sort()` gives?
- [9, 10, 100]
- [10, 100, 9] *
- [100, 10, 9]
- An error
> Default sort converts to strings. Pass `(a, b) => a - b` for numbers.

? What does `reduce` do?
- Removes items from an array
- Collapses an array to a single value using an accumulator *
- Shrinks the array length
- Sorts and filters together
> That single value can be a number, string, object or another array.

? `const copy = [...arr]` then `copy[0].name = 'x'`. What happens to `arr[0].name`?
- Unchanged
- Also becomes 'x' — spread is a shallow copy *
- Throws an error
- Becomes undefined
> Use `structuredClone(arr)` for a deep copy.

? Which returns a boolean?
- find
- filter
- some *
- map
> `find` returns an item, `filter` an array, `map` an array. `some`/`every` return booleans.

? How do you deduplicate an array?
- `arr.unique()`
- `[...new Set(arr)]` *
- `arr.filter(distinct)`
- `arr.flat()`
> A Set only holds unique values; spreading it back gives an array.
:::

:::exercise Work a dataset
Given this array, answer each question with a single chain:

```js
const sales = [
  { rep: 'Ada',   region: 'UK', amount: 1200, quarter: 1 },
  { rep: 'Grace', region: 'US', amount: 2400, quarter: 1 },
  { rep: 'Ada',   region: 'UK', amount: 800,  quarter: 2 },
  { rep: 'Alan',  region: 'UK', amount: 1500, quarter: 2 },
  { rep: 'Grace', region: 'US', amount: 900,  quarter: 2 }
];
```

1. Total of all sales.
2. Every unique rep name.
3. Total per region (an object like `{ UK: 3500, US: 3300 }`).
4. The single largest sale.
5. Reps sorted by total sales, descending.
6. Did anyone sell more than 2000 in one go?
:::
