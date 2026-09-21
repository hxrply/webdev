Functions are how you name a piece of behaviour and reuse it. In JavaScript they're also *values* — you can pass them around, return them, and store them — which unlocks a great deal of the language's expressiveness.

# Declaring functions

```js run
// Function declaration — hoisted, usable before it appears
console.log(add(2, 3));
function add(a, b) {
  return a + b;
}

// Function expression — not hoisted
const multiply = function (a, b) {
  return a * b;
};

// Arrow function
const divide = (a, b) => a / b;

// Arrow variations
const square = n => n * n;               // one param, parens optional
const greet = () => 'hello';             // no params
const make = (a, b) => ({ a, b });       // returning an object needs parens
const long = (a, b) => {                 // block body needs explicit return
  const sum = a + b;
  return sum * 2;
};

console.log(multiply(3, 4), divide(10, 2), square(5), greet(), make(1, 2), long(1, 2));
```

:::gotcha Returning an object from an arrow
```js
const bad  = () => { name: 'Ada' };     // undefined — braces read as a block
const good = () => ({ name: 'Ada' });   // parentheses make it an expression
```
:::

# Parameters

```js run
// Defaults
function greet(name = 'friend', greeting = 'Hello') {
  return `${greeting}, ${name}!`;
}
console.log(greet());
console.log(greet('Ada'));
console.log(greet(undefined, 'Hi'));    // undefined triggers the default; null does NOT

// Rest parameters — collect the remainder into an array
function sum(...numbers) {
  return numbers.reduce((total, n) => total + n, 0);
}
console.log(sum(1, 2, 3, 4, 5));

function log(level, ...messages) {
  console.log(`[${level}]`, messages.join(' '));
}
log('info', 'server', 'started');

// Destructured parameters — an "options object", very common
function createUser({ name, role = 'user', active = true }) {
  return `${name} (${role}) ${active ? 'active' : 'inactive'}`;
}
console.log(createUser({ name: 'Ada', role: 'admin' }));
```

Named options beat positional arguments once you pass more than two or three things — `createUser({ name, role })` reads better than `createUser('Ada', null, true, false)` and survives adding a parameter later.

# Return values

```js run
function noReturn() { const x = 1; }
console.log(noReturn());        // undefined — every function returns something

function early(n) {
  if (n < 0) return 'negative';  // exits immediately
  return 'non-negative';
}
console.log(early(-1), early(1));

// Returning multiple values via an object or array
function stats(nums) {
  return {
    min: Math.min(...nums),
    max: Math.max(...nums),
    avg: nums.reduce((a, b) => a + b, 0) / nums.length
  };
}
const { min, max, avg } = stats([4, 8, 15, 16, 23, 42]);
console.log(min, max, avg.toFixed(1));
```

# Scope

```js run
const globalVar = 'I am global';

function outer() {
  const outerVar = 'I am in outer';

  function inner() {
    const innerVar = 'I am in inner';
    console.log(globalVar);   // ✓ reaches out
    console.log(outerVar);    // ✓ reaches out
    console.log(innerVar);    // ✓ own scope
  }

  inner();
  // console.log(innerVar);   // ✗ ReferenceError — can't reach in
}
outer();
```

Scope looks **outward and upward**, never inward. Inner functions can see their parents' variables; parents cannot see their children's. This chain is called the **scope chain**.

# Closures

A closure is a function that remembers the variables from where it was *defined*, even after that outer function has returned. This sounds academic and is used constantly.

```js run
function makeCounter() {
  let count = 0;                       // private to each counter

  return {
    increment() { count++; return count; },
    decrement() { count--; return count; },
    get value() { return count; }
  };
}

const counterA = makeCounter();
const counterB = makeCounter();

console.log(counterA.increment());   // 1
console.log(counterA.increment());   // 2
console.log(counterB.increment());   // 1 — separate, independent count
console.log(counterA.value);         // 2
// count is unreachable from outside — genuinely private
```

Practical uses:

```js run
// 1. Function factories
const multiplier = (factor) => (n) => n * factor;
const double = multiplier(2);
const triple = multiplier(3);
console.log(double(5), triple(5));

// 2. Debounce — run only after activity stops
function debounce(fn, wait) {
  let timer;                        // remembered between calls
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}
const search = debounce((q) => console.log('searching for', q), 100);
search('a'); search('ab'); search('abc');   // only the last one runs

// 3. Memoisation — cache expensive results
function memoise(fn) {
  const cache = new Map();
  return (n) => {
    if (cache.has(n)) { console.log('cache hit for', n); return cache.get(n); }
    const result = fn(n);
    cache.set(n, result);
    return result;
  };
}
const slowSquare = memoise(n => { for (let i = 0; i < 1e6; i++); return n * n; });
console.log(slowSquare(9));
console.log(slowSquare(9));
```

`debounce` alone justifies learning closures: it's how you stop a search box firing a request on every keystroke.

# Higher-order functions

Functions that take or return other functions:

```js run
const numbers = [1, 2, 3, 4, 5];

console.log(numbers.map(n => n * 2));
console.log(numbers.filter(n => n % 2 === 0));
console.log(numbers.reduce((a, b) => a + b));

// Writing your own
function repeat(times, action) {
  for (let i = 0; i < times; i++) action(i);
}
repeat(3, i => console.log('iteration', i));

// Composition
const compose = (...fns) => (x) => fns.reduceRight((acc, fn) => fn(acc), x);
const addOne = n => n + 1;
const doubleIt = n => n * 2;
console.log(compose(doubleIt, addOne)(5));   // addOne first → 6, then double → 12
```

# Arrow functions vs regular functions

They differ in three ways that matter:

```js run
const obj = {
  name: 'Ada',

  regular() {
    console.log('regular:', this.name);       // 'Ada' — this is obj
  },

  arrow: () => {
    console.log('arrow:', this?.name);        // undefined — arrows have no own this
  },

  delayed() {
    setTimeout(() => {
      console.log('arrow in timeout:', this.name);   // 'Ada' — inherits this ✓
    }, 10);

    setTimeout(function () {
      console.log('regular in timeout:', this?.name); // undefined ✗
    }, 20);
  }
};

obj.regular();
obj.arrow();
obj.delayed();
```

| | Regular | Arrow |
|---|---|---|
| Own `this` | Yes, set by how it's called | No — inherits from enclosing scope |
| `arguments` object | Yes | No (use rest params) |
| Usable as constructor (`new`) | Yes | No |
| Hoisted (declarations) | Yes | No |

**The practical rule:** arrows for callbacks and anything nested inside a method; regular functions for object methods and class methods.

:::gotcha Arrow functions as object methods
```js
const timer = {
  seconds: 0,
  start: () => { this.seconds++; }   // `this` is not timer — broken
};
```
Use shorthand method syntax — `start() { this.seconds++ }` — instead.
:::

# Pure functions

```js run
// Pure: same input → same output, no side effects
const addPure = (a, b) => a + b;
const addItem = (list, item) => [...list, item];    // returns a NEW array

// Impure: mutates its input
const addItemImpure = (list, item) => { list.push(item); return list; };

const original = [1, 2];
const copy = addItem(original, 3);
console.log(original, copy);          // [1,2] [1,2,3] — original untouched

addItemImpure(original, 3);
console.log(original);                // [1,2,3] — caller's array changed
```

Pure functions are easier to test, reason about and cache. Not everything can be pure — something has to touch the DOM or the network — but keeping your *logic* pure and pushing side effects to the edges is a pattern that scales well.

:::quiz
? What does a closure let a function do?
- Run faster
- Access variables from the scope where it was defined, even after that scope returned *
- Modify global variables
- Be called before it is declared
> This is how debounce, memoisation and private state all work.

? Why does `setTimeout(function() { this.x }, 100)` inside a method lose `this`?
- setTimeout is asynchronous
- A regular function gets its own `this`, which isn't the object *
- `this` is undefined in callbacks
- Timeouts run in a different scope chain
> An arrow function inherits `this` from the enclosing scope, which fixes it.

? `const f = () => { value: 42 };` — what does `f()` return?
- `{ value: 42 }`
- `undefined` — the braces are read as a function body *
- 42
- A syntax error
> Wrap the object in parentheses: `() => ({ value: 42 })`.

? What does `function sum(...nums)` do?
- Accepts exactly three arguments
- Collects all arguments into an array called `nums` *
- Spreads an array into arguments
- Makes the parameters optional
> Rest parameters gather; the spread operator (same syntax, different position) scatters.

? Which best describes a pure function?
- One that returns a value
- Same input always gives the same output, with no side effects *
- One defined with an arrow
- One with no parameters
> Purity makes code testable and predictable.

? When should you use a regular function instead of an arrow?
- Always
- As an object or class method, where you need `this` bound to the instance *
- For callbacks
- Inside loops
> Arrows are ideal for callbacks precisely because they *don't* rebind `this`.
:::

:::exercise Write a throttle function
`debounce` waits for activity to stop. `throttle` runs at most once per interval, regardless of how often it's called — useful for scroll and resize handlers.

```js
function throttle(fn, interval) {
  // Your code: remember the last run time in a closure,
  // and only call fn if enough time has passed.
}

const log = throttle(() => console.log('ran at', Date.now()), 500);
// Calling log() ten times rapidly should produce roughly two calls.
```
:::
