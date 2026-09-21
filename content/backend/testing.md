Tests are code that checks your code. Their real value isn't proving correctness today — it's letting you change things tomorrow without fear.

# The kinds of test

```text
        ╱╲          End-to-end: a real browser, the whole stack
       ╱  ╲         Slow, brittle, high confidence. A few.
      ╱────╲
     ╱      ╲       Integration: several units together, real database
    ╱        ╲      Moderate speed, high value. Quite a few.
   ╱──────────╲
  ╱            ╲    Unit: one function, in isolation
 ╱______________╲   Fast, precise, cheap. Many.
```

The classic advice is "many unit tests, fewer integration, fewest E2E". In practice, for web applications, **integration tests often give the best return** — they exercise real code paths (route → service → database) and don't break when you rename a private function.

# Your first test

```bash
npm install -D vitest
```

```js
// src/cart.js
export function cartTotal(items, { taxRate = 0.2, freeShippingOver = 5000 } = {}) {
  const subtotal = items.reduce((sum, i) => sum + i.pricePence * i.quantity, 0);
  const tax = Math.round(subtotal * taxRate);
  const shipping = subtotal >= freeShippingOver ? 0 : 499;
  return { subtotal, tax, shipping, total: subtotal + tax + shipping };
}
```

```js
// src/cart.test.js
import { describe, it, expect } from 'vitest';
import { cartTotal } from './cart.js';

describe('cartTotal', () => {
  it('sums item prices and quantities', () => {
    const result = cartTotal([
      { pricePence: 1000, quantity: 2 },
      { pricePence: 500,  quantity: 1 }
    ]);
    expect(result.subtotal).toBe(2500);
  });

  it('applies free shipping over the threshold', () => {
    const result = cartTotal([{ pricePence: 6000, quantity: 1 }]);
    expect(result.shipping).toBe(0);
  });

  it('charges shipping below the threshold', () => {
    expect(cartTotal([{ pricePence: 1000, quantity: 1 }]).shipping).toBe(499);
  });

  it('handles an empty cart', () => {
    expect(cartTotal([])).toEqual({ subtotal: 0, tax: 0, shipping: 499, total: 499 });
  });
});
```

```bash
npx vitest          # watch mode
npx vitest run      # once, for CI
```

# Anatomy of a good test

```js
it('rejects a password under 8 characters', () => {
  // Arrange — set up the world
  const input = { email: 'a@b.com', password: 'short' };

  // Act — do the one thing
  const result = validateRegistration(input);

  // Assert — check the outcome
  expect(result.valid).toBe(false);
  expect(result.errors.password).toMatch(/8 characters/);
});
```

Qualities worth aiming for:

- **The name describes the behaviour**, not the implementation. `'rejects a password under 8 characters'`, not `'test validateRegistration 2'`. When it fails, the name alone should tell you what broke.
- **One behaviour per test.** A test asserting six unrelated things tells you little when it fails.
- **Independent.** Any test can run alone, in any order. Shared mutable state between tests is a classic source of "passes locally, fails in CI".
- **Deterministic.** No dependence on the clock, network, randomness or test order.
- **Tests the contract, not the internals.** If renaming a private variable breaks a test, the test is coupled too tightly.

# What's worth testing

**Do test:**

- Business logic: pricing, permissions, validation, state machines.
- Edge cases: empty, zero, negative, null, one item, maximum, unicode.
- **Bugs you've fixed** — write the failing test first, then fix it. That bug can never silently return.
- Critical user paths end to end: sign up, log in, check out.

**Don't bother testing:**

- Third-party libraries. They have their own tests.
- Trivial getters and setters.
- Exact markup or CSS classes — brittle and low value.
- Things that never change and would be obviously broken.

:::warn Coverage is a diagnostic, not a goal
100% coverage proves every line *ran*, not that it's correct — a test with no assertions gives full coverage. Chasing the number produces tests written for the metric.

Low coverage in important code is a real signal. High coverage is not proof of anything. Look at *which* code is uncovered, not the percentage.
:::

# Testing async code

```js
it('fetches a user', async () => {
  const user = await getUser(1);
  expect(user.name).toBe('Ada');
});

it('throws for an unknown id', async () => {
  await expect(getUser(999)).rejects.toThrow('Not found');
});
```

Remember to `await` — a forgotten `await` makes the test pass before the assertion runs, which is worse than no test at all.

# Test doubles

```js
import { vi, it, expect } from 'vitest';

// Stub a module
vi.mock('./emailService.js', () => ({
  sendEmail: vi.fn().mockResolvedValue({ id: 'msg_1' })
}));

// Spy on a call
const spy = vi.spyOn(logger, 'error');
doSomethingThatLogs();
expect(spy).toHaveBeenCalledWith(expect.stringContaining('failed'));

// Control time
vi.useFakeTimers();
vi.setSystemTime(new Date('2025-01-01'));
expect(formatRelative(new Date('2024-12-25'))).toBe('7 days ago');
vi.useRealTimers();
```

Mock **the edges**: network, time, randomness, email, payment providers. Don't mock your own internals — a test that mocks everything tests only your mocks.

# Integration tests

```js
import request from 'supertest';
import { app } from '../src/server.js';

describe('POST /api/tasks', () => {
  beforeEach(async () => { await resetTestDatabase(); });

  it('creates a task and returns 201', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Write tests' })
      .expect(201);

    expect(res.body.data).toMatchObject({ title: 'Write tests', done: 0 });
    expect(res.headers.location).toMatch(/\/api\/tasks\/\d+/);
  });

  it('rejects an empty title with 422', async () => {
    const res = await request(app).post('/api/tasks').send({ title: '  ' }).expect(422);
    expect(res.body.details.title).toBeDefined();
  });

  it('does not let one user read another user\'s task', async () => {
    const taskId = await createTaskAs(userB);
    await request(app).get(`/api/tasks/${taskId}`).set(authAs(userA)).expect(404);
  });
});
```

Use a **real database** for these — a disposable SQLite file, or a PostgreSQL container. Mocked databases don't catch constraint violations, transaction bugs or SQL errors, which is precisely what you want these tests to catch. That third test — checking one user can't read another's data — is worth more than a hundred unit tests of formatting functions.

# End-to-end tests

```js
import { test, expect } from '@playwright/test';

test('a visitor can sign up and see their dashboard', async ({ page }) => {
  await page.goto('/signup');

  await page.getByLabel('Email').fill('new@example.com');
  await page.getByLabel('Password').fill('a-good-password');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
});
```

Notice the selectors: `getByRole` and `getByLabel` rather than CSS classes. They survive restyling, and — usefully — **a page that's hard to test this way is usually a page with accessibility problems.** The test and the screen reader want the same thing.

Keep E2E tests few and focused on critical journeys. They're slow, and they're where flakiness lives.

:::tip Flaky tests are worse than no tests
A test that fails randomly trains everyone to re-run rather than investigate — and then real failures get ignored too. Fix flakes immediately or delete the test.

The usual causes: fixed `sleep` calls instead of waiting for a condition; test order dependence; shared state; real network calls; time zones.
:::

# TDD, briefly

Write the failing test, make it pass, then tidy up. **Red → green → refactor.**

It's genuinely excellent for well-specified logic — parsers, pricing rules, validators — where the test clarifies what you're building. It's more awkward for exploratory UI work. Use it where it helps rather than as an identity.

The one place it's unarguable: **fixing a bug.** Write the test that reproduces it first. You get a precise reproduction, proof of the fix, and permanent protection against regression.

# In CI

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm test
```

Tests that only run when someone remembers aren't a safety net. Run them on every push, and make a red build block merging.

:::quiz
? What is the real benefit of a test suite?
- Proving the code has no bugs
- Confidence to change code without breaking things *
- Higher coverage numbers
- Faster execution
> Tests are what make refactoring safe.

? Why is 100% coverage a poor goal?
- It's impossible
- It proves lines ran, not that behaviour is correct *
- It slows CI
- It requires E2E tests
> A test with no assertions still produces coverage.

? What should you do first when fixing a bug?
- Fix it, then move on
- Write a test that reproduces the bug *
- Add logging
- Refactor the function
> You get a reproduction, proof of the fix and permanent regression protection.

? Which selector is most robust in an E2E test?
- `.btn-primary-large`
- `#submit-btn-2`
- `getByRole('button', { name: 'Create account' })` *
- `div > form > button:nth-child(3)`
> Role and accessible name survive restyling — and reward accessible markup.

? Should integration tests use a real database?
- No, always mock it
- Yes — mocks hide constraint, transaction and SQL errors *
- Only in CI
- Only for reads
> Catching those errors is the entire point of the layer.

? A test fails intermittently. What should you do?
- Re-run until it passes
- Add a retry
- Fix the cause or delete it *
- Increase the timeout
> Tolerated flakiness trains the team to ignore failures generally.
:::

:::exercise Test something real
Take the task API from the earlier lesson and write:

1. Unit tests for a validation function: valid input, empty title, 201-character title, non-string, missing field.
2. Integration tests for all five endpoints against a real test database, asserting status codes and bodies.
3. One test proving user A cannot read user B's task.
4. A test that reproduces a bug you deliberately introduce, then fix.
5. A GitHub Actions workflow running them on every push.
:::
