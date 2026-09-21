Everything in a program is a value in a box with a label. This lesson is about the boxes, the labels, and the specific ways JavaScript's type system will surprise you.

# const, let, var

```js run
const pi = 3.14159;
// pi = 3; // TypeError: Assignment to constant variable

let counter = 0;
counter += 1;
console.log(counter);

var old = 'avoid this';
console.log(pi, old);
```

| | `const` | `let` | `var` |
|---|---|---|---|
| Reassignable | No | Yes | Yes |
| Scope | Block `{}` | Block `{}` | **Function** |
| Redeclarable | No | No | **Yes** |
| Hoisted usable before declaration | No (TDZ) | No (TDZ) | Yes, as `undefined` |

```js run
// Block scope vs function scope
if (true) {
  let blockScoped = 'only in here';
  var functionScoped = 'leaks out';
}
// console.log(blockScoped);   // ReferenceError
console.log(functionScoped);   // 'leaks out' — this is why var is confusing

// The classic var-in-a-loop bug
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log('var i:', i), 10);   // 3, 3, 3
}
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log('let j:', j), 20);   // 0, 1, 2
}
```

`var` has one binding for the whole function, so by the time the timeouts fire, `i` is 3. `let` creates a fresh binding each iteration. This bug produced a decade of Stack Overflow questions; `let` ended it.

:::gotcha `const` does not mean immutable
```js
const user = { name: 'Ada' };
user.name = 'Grace';     // fine — the object's contents can change
user = {};               // TypeError — the binding cannot be reassigned
```
`const` freezes the *variable*, not the *value*. For a genuinely immutable object, `Object.freeze()` — shallow — or just don't mutate it.
:::

# The eight types

Seven primitives and objects:

```js run
console.log(typeof 42);                  // 'number'
console.log(typeof 'hello');             // 'string'
console.log(typeof true);                // 'boolean'
console.log(typeof undefined);           // 'undefined'
console.log(typeof null);                // 'object'  ← a famous 1995 bug, never fixed
console.log(typeof Symbol('id'));        // 'symbol'
console.log(typeof 10n);                 // 'bigint'
console.log(typeof { a: 1 });            // 'object'
console.log(typeof [1, 2]);              // 'object'  ← arrays are objects
console.log(typeof function () {});      // 'function'
console.log(Array.isArray([1, 2]));      // true — the correct array check
```

# Numbers

There is one number type: 64-bit floating point. No separate integer type.

```js run
console.log(0.1 + 0.2);              // 0.30000000000000004
console.log(0.1 + 0.2 === 0.3);      // false
console.log(Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON);  // true — compare with a tolerance

console.log(10 / 3);                 // 3.3333333333333335
console.log(Math.round(4.5), Math.floor(4.9), Math.ceil(4.1));
console.log((1234.5678).toFixed(2));  // '1234.57' — a STRING
console.log(Number.MAX_SAFE_INTEGER); // 9007199254740991

console.log(1 / 0, -1 / 0);           // Infinity, -Infinity
console.log(0 / 0);                   // NaN
console.log(NaN === NaN);             // false! use Number.isNaN()
console.log(Number.isNaN(0 / 0));     // true
```

:::warn Never use floats for money
`0.1 + 0.2 !== 0.3` is not a JavaScript quirk — it's how binary floating point works in every language. For currency, **store and calculate in the smallest unit** (pence, cents) as integers, and format for display only. `1099` pence, not `10.99` pounds.
:::

# Strings

```js run
const s = 'JavaScript';

console.log(s.length);              // 10
console.log(s.toUpperCase());       // 'JAVASCRIPT'
console.log(s[0], s.at(-1));        // 'J' 't'
console.log(s.includes('Script'));  // true
console.log(s.indexOf('S'));        // 4
console.log(s.slice(0, 4));         // 'Java'
console.log(s.replace('Java', 'Type'));
console.log('  padded  '.trim());
console.log('a,b,c'.split(','));    // ['a','b','c']
console.log('ab'.repeat(3));        // 'ababab'
console.log('5'.padStart(3, '0'));  // '005'

// Strings are immutable — every method returns a NEW string
let t = 'hello';
t.toUpperCase();
console.log(t);                     // still 'hello'
t = t.toUpperCase();
console.log(t);                     // 'HELLO'
```

Template literals handle multi-line and interpolation:

```js run
const name = 'Ada';
const items = 3;
console.log(`Hi ${name},
you have ${items} item${items === 1 ? '' : 's'} waiting.
Total: ${(items * 4.5).toFixed(2)}`);
```

# null vs undefined

```js run
let a;                    // declared, never assigned
console.log(a);           // undefined — "nothing is here yet"

let b = null;             // explicitly set to nothing
console.log(b);           // null — "deliberately empty"

const obj = { x: 1 };
console.log(obj.missing); // undefined — property doesn't exist

console.log(null == undefined);   // true  (loose)
console.log(null === undefined);  // false (strict)
```

Convention: `undefined` is the language's "absent"; `null` is *your* "intentionally empty". Both are falsy, and both throw if you access a property on them.

# Type coercion: the famous weirdness

```js run
console.log('5' + 3);        // '53'   — + with a string concatenates
console.log('5' - 3);        // 2      — other operators convert to number
console.log('5' * '2');      // 10
console.log(1 + true);       // 2      — true becomes 1
console.log([] + {});        // '[object Object]'
console.log([] + []);        // ''
console.log('' == 0);        // true   — loose equality coerces
console.log('' === 0);       // false  — strict does not
```

:::tip Always use `===`
`==` performs type coercion with rules almost nobody remembers correctly. `===` compares type and value with no surprises. The one accepted exception is `x == null`, which conveniently checks for both `null` and `undefined`.
:::

# Truthy and falsy

Exactly **eight** falsy values. Everything else is truthy:

```js run
const falsy = [false, 0, -0, 0n, '', null, undefined, NaN];
const label = ['false', '0', '-0', '0n', "''", 'null', 'undefined', 'NaN'];
falsy.forEach((v, i) => console.log(label[i], '→', Boolean(v)));

console.log('--- surprising truthy values ---');
console.log('0' ? 'truthy' : 'falsy');        // '0' is a non-empty string → truthy
console.log([] ? 'truthy' : 'falsy');         // empty array → truthy
console.log({} ? 'truthy' : 'falsy');         // empty object → truthy
console.log(' ' ? 'truthy' : 'falsy');        // a space → truthy
```

:::gotcha Checking for an empty array
```js
if (myArray) { }             // always true, even when empty
if (myArray.length) { }      // correct
if (myArray.length === 0) { }// clearer still
```
Same for objects: `Object.keys(obj).length === 0`.
:::

# Converting deliberately

```js run
console.log(Number('42'), Number(''), Number('abc'));       // 42, 0, NaN
console.log(parseInt('42px', 10), parseFloat('3.14rem'));   // 42, 3.14
console.log(String(42), (42).toString(), `${42}`);
console.log(Boolean(''), !!'text');                          // false, true
```

`parseInt` stops at the first non-numeric character, which is useful for `'42px'` and dangerous if you expected strict validation. Always pass the radix (`10`).

:::quiz
? What does `const` prevent?
- Any change to the value
- Reassigning the variable binding *
- Adding properties to an object
- Use before declaration only
> `const obj = {}` then `obj.x = 1` is perfectly legal.

? `0.1 + 0.2 === 0.3` evaluates to?
- true
- false *
- NaN
- Depends on the browser
> Binary floating point can't represent 0.1 exactly. Store money as integer minor units.

? Which of these is truthy?
- `0`
- `''`
- `[]` *
- `NaN`
> Empty arrays and objects are truthy. Check `.length` instead.

? What is `typeof null`?
- 'null'
- 'undefined'
- 'object' *
- 'boolean'
> A bug from 1995 that can't be fixed without breaking the web.

? Why prefer `===` over `==`?
- It is faster
- It compares without type coercion, avoiding surprising results *
- `==` is deprecated
- `===` works on objects
> `'' == 0` is true; `'' === 0` is false. The second is what you meant.

? `'5' + 3` gives?
- 8
- '53' *
- NaN
- 15
> `+` concatenates when either side is a string. `-`, `*`, `/` convert to numbers instead.
:::

:::exercise Predict then verify
Write down your answer for each before running it:

```js
console.log(typeof typeof 1);
console.log([] == false);
console.log(null + 1);
console.log(undefined + 1);
console.log('10' - '4' - '3' + 2);
console.log(Number.isNaN('hello'));
```

(Answers: `'string'`; `true`; `1`; `NaN`; `5`; `false` — `Number.isNaN` only returns true for the actual `NaN` value, unlike the global `isNaN`.)
:::
