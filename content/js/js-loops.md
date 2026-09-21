Loops repeat work. Modern JavaScript has several, and choosing the right one makes code shorter and clearer — often by removing the loop entirely.

# for

```js run
for (let i = 0; i < 5; i++) {
  console.log('i =', i);
}

// Counting down
for (let i = 3; i > 0; i--) console.log(i);

// Stepping by 2
for (let i = 0; i < 10; i += 2) console.log('even:', i);
```

Three parts, separated by semicolons: **initialise**, **condition to keep going**, **after each pass**.

Use `let`, not `var` — each iteration gets a fresh binding, which matters the moment you capture `i` in a callback.

# while and do...while

```js run
let count = 3;
while (count > 0) {
  console.log('countdown:', count);
  count--;
}

// do...while always runs at least once
let attempts = 0;
do {
  attempts++;
  console.log('attempt', attempts);
} while (attempts < 3);
```

Use `while` when you don't know how many iterations you need — reading until a condition, retrying until success.

:::warn Infinite loops freeze the tab
```js
let i = 0;
while (i < 10) {
  console.log(i);   // i never changes — this never ends
}
```
A browser tab running an infinite loop becomes unresponsive; you'll need to close it. Always make sure something inside the loop moves the condition towards false.
:::

# for...of — the everyday loop

```js run
const languages = ['HTML', 'CSS', 'JavaScript'];

for (const lang of languages) {
  console.log(lang);
}

// With the index too
for (const [i, lang] of languages.entries()) {
  console.log(i, lang);
}

// Works on anything iterable
for (const char of 'abc') console.log(char);
for (const [key, value] of Object.entries({ a: 1, b: 2 })) console.log(key, value);

const set = new Set([1, 2, 2, 3]);
for (const n of set) console.log('unique:', n);
```

`for...of` is the default choice for arrays: no index arithmetic, no off-by-one errors, and `break`/`continue` work normally.

# for...in — for object keys only

```js run
const person = { name: 'Ada', year: 1815, field: 'mathematics' };

for (const key in person) {
  console.log(key, '=', person[key]);
}
```

:::gotcha Don't use `for...in` on arrays
It iterates **keys as strings** (`'0'`, `'1'`, `'2'`), includes inherited enumerable properties, and does not guarantee order. Use `for...of` for values, `for` for indexes, and `for...in` only for plain objects — or better, `Object.entries()` with `for...of`.
:::

# break and continue

```js run
const numbers = [1, 3, 8, 5, 12, 7];

for (const n of numbers) {
  if (n % 2 === 0) {
    console.log('first even number:', n);
    break;                        // stop entirely
  }
}

for (const n of numbers) {
  if (n < 5) continue;            // skip to the next iteration
  console.log('5 or more:', n);
}

// Labels, for breaking out of nested loops
outer:
for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 3; j++) {
    if (i * j > 2) break outer;
    console.log(i, j);
  }
}
```

# Array methods often replace loops

```js run
const prices = [10, 25, 8, 42, 15];

// Instead of: build a new array with a loop
const withTax = prices.map(p => p * 1.2);
console.log(withTax);

// Instead of: filter with a loop and push
const expensive = prices.filter(p => p > 20);
console.log(expensive);

// Instead of: accumulate with a loop
const total = prices.reduce((sum, p) => sum + p, 0);
console.log(total);

// Instead of: search with a loop and break
const firstBig = prices.find(p => p > 20);
console.log(firstBig);

// Just do something for each
prices.forEach((p, i) => console.log(`${i}: £${p}`));
```

**When to use which:**

| Goal | Reach for |
|---|---|
| Transform every item into something else | `map` |
| Keep some items | `filter` |
| Reduce to a single value | `reduce` |
| Find one item | `find` / `findIndex` |
| Test if any/all match | `some` / `every` |
| Side effect for each item | `forEach` or `for...of` |
| Need `break`, or `await` inside | **`for...of`** |

:::tip forEach can't break, and doesn't await
```js
[1,2,3].forEach(n => { if (n === 2) break; });     // SyntaxError
[1,2,3].forEach(async n => { await save(n); });    // does NOT wait
```
Both are reasons to use `for...of`, which supports `break` and works correctly with `await`.
:::

# Loops and asynchronous code

```js run
const ids = [1, 2, 3];
const fakeFetch = (id) => new Promise(r => setTimeout(() => r(`data-${id}`), 50));

async function sequential() {
  for (const id of ids) {
    const data = await fakeFetch(id);      // one at a time
    console.log('sequential:', data);
  }
}

async function parallel() {
  const results = await Promise.all(ids.map(fakeFetch));  // all at once
  console.log('parallel:', results);
}

sequential().then(parallel);
```

Sequential when each step depends on the last, or you're rate-limited. `Promise.all` when they're independent — it's dramatically faster.

# Performance, briefly

```js run
const big = Array.from({ length: 200000 }, (_, i) => i);

console.time('for');
let a = 0;
for (let i = 0; i < big.length; i++) a += big[i];
console.timeEnd('for');

console.time('for-of');
let b = 0;
for (const n of big) b += n;
console.timeEnd('for-of');

console.time('reduce');
const c = big.reduce((s, n) => s + n, 0);
console.timeEnd('reduce');

console.log(a === b && b === c);
```

The classic `for` is usually fastest, but the differences are tiny until you're in the millions. **Write the clearest version first.** Optimise when a profiler says to, not before.

:::quiz
? Which loop should you use to iterate array values?
- `for...in`
- `for...of` *
- `while`
- `do...while`
> `for...in` gives string keys and can include inherited properties.

? Why can't you `break` out of `forEach`?
- It is a syntax restriction of callbacks *
- forEach is asynchronous
- Arrays are immutable
- You can, with `return false`
> `break` only works in loop statements. `return` inside forEach just ends that one callback.

? What does `continue` do?
- Exits the loop
- Skips the rest of the current iteration and starts the next *
- Restarts the loop from zero
- Pauses execution
> `break` exits entirely; `continue` skips ahead.

? You need to `await` inside a loop over an array. Which construct works correctly?
- `forEach` with an async callback
- `for...of` with `await` *
- `map` with await inside
- `while (true)`
> `forEach` ignores returned promises, so nothing waits.

? Ten independent API calls, and you want them as fast as possible. What do you use?
- A for...of loop with await
- `await Promise.all(ids.map(fetchOne))` *
- A while loop
- forEach
> Sequential awaiting makes ten round trips one after another; Promise.all overlaps them.

? What does `numbers.filter(n => n > 5)` return?
- The first number over 5
- A new array containing only numbers over 5 *
- true or false
- The count of numbers over 5
> `find` returns one item; `some` returns a boolean; `filter` returns a new array.
:::

:::exercise Rewrite loops as methods
Rewrite each of these using an array method instead of a loop:

```js
// 1
const doubled = [];
for (let i = 0; i < nums.length; i++) doubled.push(nums[i] * 2);

// 2
let total = 0;
for (const n of nums) total += n;

// 3
let found = null;
for (const u of users) { if (u.id === targetId) { found = u; break; } }

// 4
let allValid = true;
for (const f of fields) { if (!f.valid) { allValid = false; break; } }
```

(Answers: `nums.map(n => n*2)`; `nums.reduce((a,b) => a+b, 0)`; `users.find(u => u.id === targetId)`; `fields.every(f => f.valid)`.)
:::
