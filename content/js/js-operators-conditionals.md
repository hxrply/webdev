Programs make decisions. This lesson covers the operators you compare with and the structures you branch with — plus the modern shorthands that remove a lot of noise.

# Arithmetic

```js run
console.log(10 + 3, 10 - 3, 10 * 3, 10 / 3);
console.log(10 % 3);        // 1  — remainder
console.log(2 ** 10);       // 1024 — exponent

let n = 5;
console.log(n++, n);        // 5 6 — returns then increments
console.log(++n, n);        // 7 7 — increments then returns

n += 3; n *= 2;
console.log(n);
```

`%` is more useful than it looks: `i % 2 === 0` tests evenness, `i % n` wraps an index around an array, `seconds % 60` splits time.

# Comparison

```js run
console.log(5 > 3, 5 >= 5, 5 < 3, 5 <= 4);
console.log(5 === 5, 5 === '5');      // true, false
console.log(5 !== '5');               // true

// Comparing objects compares REFERENCES, not contents
console.log({ a: 1 } === { a: 1 });   // false — two different objects
const x = { a: 1 };
const y = x;
console.log(x === y);                 // true — same object

// Comparing strings is lexicographic (by character code)
console.log('apple' < 'banana');      // true
console.log('Zebra' < 'apple');       // true — uppercase sorts first!
console.log('10' < '9');              // true — string comparison, not numeric
```

:::gotcha Comparing objects and arrays
There is no built-in deep equality. `[1,2] === [1,2]` is false. Options: compare `JSON.stringify` output (crude; key order matters), write a recursive comparison, or use a library. For sorting strings by human expectation, use `a.localeCompare(b)`.
:::

# Logical operators

```js run
const age = 25, hasTicket = true;

console.log(age >= 18 && hasTicket);     // AND — both must be true
console.log(age < 18 || hasTicket);      // OR — either
console.log(!hasTicket);                 // NOT

// They return VALUES, not just booleans — and short-circuit
console.log(0 || 'fallback');            // 'fallback'
console.log('value' || 'fallback');      // 'value'
console.log(null && 'never reached');    // null
console.log('a' && 'b');                 // 'b'
```

Short-circuiting is used constantly:

```js run
const user = { name: 'Ada', settings: null };

// Guard: only call if it exists
const theme = user.settings && user.settings.theme;
console.log(theme);                      // null, no crash

// Default value
const name = user.nickname || 'Anonymous';
console.log(name);
```

# ?? and ?. — the modern pair

```js run
const settings = { volume: 0, title: '', theme: null };

console.log(settings.volume || 50);      // 50  ← WRONG: 0 is falsy but valid
console.log(settings.volume ?? 50);      // 0   ← correct
console.log(settings.title ?? 'Untitled');  // '' — empty string is a real value
console.log(settings.theme ?? 'dark');   // 'dark' — null triggers the default

// Optional chaining
const user = { profile: { address: null } };
// console.log(user.profile.address.city);      // TypeError
console.log(user.profile?.address?.city);       // undefined, no crash
console.log(user.getName?.());                   // undefined — safe method call
console.log(user.tags?.[0]);                     // undefined — safe index
```

**`??` (nullish coalescing)** falls back only for `null` and `undefined`, not for `0`, `''` or `false`. That distinction matters for any setting where zero or empty is legitimate.

**`?.` (optional chaining)** stops evaluating and returns `undefined` rather than throwing. It replaces long `a && a.b && a.b.c` chains.

:::warn Don't over-use `?.`
`user?.profile?.name` on data you *know* is complete hides real bugs — a missing field becomes a silent `undefined` that surfaces three functions later. Use it where absence is genuinely expected, not as a blanket defence.
:::

# if / else if / else

```js run
function describe(score) {
  if (score >= 90) {
    return 'excellent';
  } else if (score >= 70) {
    return 'good';
  } else if (score >= 50) {
    return 'passing';
  } else {
    return 'needs work';
  }
}

[95, 75, 55, 20].forEach(s => console.log(s, '→', describe(s)));
```

Order matters: the first matching branch wins, so go from most to least specific.

## Guard clauses read better than nesting

```js run
// Nested — the "arrow of doom"
function processA(user) {
  if (user) {
    if (user.isActive) {
      if (user.email) {
        return `Sending to ${user.email}`;
      } else { return 'No email'; }
    } else { return 'Inactive'; }
  } else { return 'No user'; }
}

// Guard clauses — handle exceptions first, then the happy path, unindented
function processB(user) {
  if (!user) return 'No user';
  if (!user.isActive) return 'Inactive';
  if (!user.email) return 'No email';
  return `Sending to ${user.email}`;
}

console.log(processB({ isActive: true, email: 'ada@example.com' }));
console.log(processB({ isActive: false }));
```

The second is the same logic and much easier to follow. Prefer it.

# Ternary

```js run
const age = 20;
const status = age >= 18 ? 'adult' : 'minor';
console.log(status);

// Great inside template literals
const count = 1;
console.log(`${count} item${count === 1 ? '' : 's'}`);

// Nested ternaries: legal, usually unkind to readers
const n = 0;
console.log(n > 0 ? 'positive' : n < 0 ? 'negative' : 'zero');
```

One ternary is clear. Three nested ones want to be an `if/else` chain or a lookup object.

# switch

```js run
function handle(action) {
  switch (action) {
    case 'save':
      return 'Saving…';
    case 'delete':
      return 'Deleting…';
    case 'copy':
    case 'duplicate':          // fall-through: both do the same
      return 'Copying…';
    default:
      return `Unknown action: ${action}`;
  }
}

['save', 'duplicate', 'explode'].forEach(a => console.log(handle(a)));
```

:::gotcha Missing `break` falls through
Without `break` (or `return`), execution continues into the next case. Occasionally that's what you want — as with `copy`/`duplicate` above — but accidental fall-through is a classic bug. Returning directly, as here, sidesteps it entirely.
:::

Often a plain object is clearer than a switch:

```js run
const handlers = {
  save:   () => 'Saving…',
  delete: () => 'Deleting…',
};
const action = 'save';
console.log((handlers[action] ?? (() => 'Unknown'))());
```

# Real-world conditional style

```js run
function getShippingCost(order) {
  if (!order || !order.items?.length) return null;      // guard

  const subtotal = order.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const isFree = subtotal >= 5000 || order.customer?.isPremium;   // pence

  return isFree ? 0 : (order.express ? 995 : 499);
}

console.log(getShippingCost({ items: [{ price: 2000, qty: 1 }] }));       // 499
console.log(getShippingCost({ items: [{ price: 6000, qty: 1 }] }));       // 0
console.log(getShippingCost({ items: [{ price: 100, qty: 1 }], express: true })); // 995
console.log(getShippingCost({ items: [] }));                              // null
```

:::quiz
? What does `0 ?? 50` return?
- 50
- 0 *
- undefined
- NaN
> `??` only falls back for `null`/`undefined`. `0 || 50` would give 50, which is usually a bug.

? `user?.address?.city` when `address` is null returns?
- An error
- null
- undefined *
- An empty string
> Optional chaining short-circuits to `undefined`.

? Why do guard clauses improve readability?
- They run faster
- Edge cases are handled first, leaving the main path unindented *
- They reduce file size
- They avoid the need for else
> Deeply nested conditionals are harder to follow than a flat list of exits.

? `[1,2] === [1,2]` is?
- true
- false — they are different objects in memory *
- An error
- Depends on the values
> Object comparison is by reference. There is no built-in deep equality.

? A `switch` case without `break` will?
- Throw an error
- Skip to default
- Continue executing the next case *
- Exit the switch
> Intentional fall-through is occasionally useful; accidental fall-through is a classic bug.

? Which is true about `&&`?
- It always returns a boolean
- It returns the first falsy value, or the last value if all are truthy *
- It cannot be chained
- It coerces to numbers
> Both `&&` and `||` return one of their operands, which is what makes short-circuit defaults work.
:::

:::exercise Write a grading function
Write `gradeFor(score)` returning `'A'` (90+), `'B'` (80+), `'C'` (70+), `'D'` (60+), `'F'` below — and `null` for invalid input (not a number, negative, or over 100). Use a guard clause for the invalid case, then handle the rest. Test with `-5`, `0`, `59.5`, `70`, `100`, `101` and `'abc'`.
:::
