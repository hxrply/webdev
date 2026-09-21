Everyone gets stuck. The difference between a beginner and an experienced developer is not that the second one gets stuck less — it's that they get *unstuck* faster, and with less emotional damage. That skill is learnable.

# Read the error message. Actually read it.

The single most common beginner failure is not reading the error. They are wordy and look intimidating, so eyes slide off them. But an error message is a message *from someone who knows exactly what went wrong*.

```text
Uncaught TypeError: Cannot read properties of null (reading 'addEventListener')
    at main.js:4:32
```

Take it apart:

- `TypeError` — you used a value in a way its type doesn't allow.
- `Cannot read properties of null` — something was `null`, and you asked it for a property.
- `(reading 'addEventListener')` — the property you asked for.
- `at main.js:4:32` — file, line 4, column 32.

So: on line 4, you called `.addEventListener` on something that is `null`. Which means the thing before the dot isn't an element. Which usually means `document.getElementById('btn')` found nothing — either the id is misspelled, or the script ran before the element existed.

You solved it by reading, not guessing.

# The five most common error messages, decoded

| Message | Usually means |
|---|---|
| `Cannot read properties of null/undefined (reading 'x')` | The thing before the dot doesn't exist. A selector matched nothing, or a value wasn't set yet. |
| `x is not a function` | Typo in the name, or `x` isn't what you think (e.g. it's an array, not a function). |
| `x is not defined` | Variable never declared, misspelled, out of scope, or the script defining it didn't load. |
| `Unexpected token` | Syntax error — a missing bracket, brace, comma or quote, usually *just before* the reported line. |
| `Failed to fetch` / CORS error | Network request blocked or failed. Check the URL, the server, and the Network panel. |

# Bisect: cut the problem in half

When you have no idea where the problem is, don't stare — **narrow the search space**.

1. Does the simplest possible version work? Delete everything except five lines. Still broken? The bug is in those five lines.
2. Add things back one at a time until it breaks. The last thing you added is the culprit.
3. Comment out half your code. Fixed? The bug is in the half you removed. Repeat.

Ten steps of halving searches a thousand lines. This sounds tedious and takes less time than "just thinking about it" essentially every time.

# Check your assumptions, one by one

Bugs live in the gap between what you *think* is happening and what *is* happening. So verify, don't assume:

```js
function applyDiscount(cart, code) {
  console.log('1. called with', cart, code);        // did we even get here?
  const rule = discounts[code];
  console.log('2. rule is', rule);                  // did the lookup work?
  if (!rule) return cart.total;
  console.log('3. applying', rule.percent);         // is it the shape I expect?
  return cart.total * (1 - rule.percent / 100);
}
```

Nine times out of ten, one of those logs prints something you did not expect, and that is your bug. Note the numbering — it tells you which logs ran and in what order.

:::tip The rubber duck
Explain the problem out loud, line by line, to an inanimate object. The act of articulating it forces you to state your assumptions explicitly, and you will frequently interrupt yourself mid-sentence with "…oh." This is a real, widely used technique, not a joke.
:::

# Searching well

Bad search: *"my website doesn't work"*.

Good searches:

- Paste the **exact error message**, minus your own variable names and file paths.
- Include the technology: `flexbox children not shrinking`, `sqlite foreign key constraint failed insert`.
- Add the year if the topic churns: `react state management 2025`.
- Prefix `mdn` for web platform questions — MDN is the reference, and it is excellent.

Where answers are reliable:

- **MDN Web Docs** — the authority on HTML, CSS, JS and browser APIs. Bookmark it.
- **Official documentation** of whatever you're using. Frequently better than tutorials.
- **Stack Overflow** — check the date and whether accepted answers are still current. A 2011 answer about JavaScript is archaeology.
- **caniuse.com** — is this feature safe to use in browsers yet?

:::warn Using AI assistants (including this one)
They're genuinely useful — and confidently wrong often enough to matter. Two rules:

1. **Never paste code you don't understand into a project.** Ask it to explain each line until you do. Otherwise you inherit a codebase you cannot debug.
2. **Verify against docs** anything security-related, or any API signature. Plausible-looking invented function names are a classic failure mode.

Use it like a patient senior colleague who occasionally makes things up.
:::

# How to ask a good question

Whether you're asking a person, a forum or an AI, include:

1. **What you're trying to do** (the goal, not just the symptom).
2. **What you tried**, and what happened instead.
3. **The exact error**, copied as text.
4. **A minimal reproducible example** — the smallest code that still shows the bug.

Building that minimal example solves the problem outright maybe a third of the time. That's not wasted effort; that's the debugging *working*.

# Learning that sticks

- **Type the code out.** Copy-paste teaches your clipboard. Typing it forces you to notice the semicolons, and your fingers learn the syntax.
- **Build things slightly beyond you.** Tutorials give the illusion of competence. Blank-page projects reveal the truth, which is uncomfortable and exactly where learning happens.
- **Space it out.** Four half-hours across four days beats one four-hour binge, by a wide margin.
- **Accept the plateau.** Everyone hits a stretch where nothing seems to improve. It is the normal shape of the curve, not evidence you can't do this.
- **Finish something small.** A finished ugly project teaches more than three beautiful abandoned ones, because the last 10% is where all the real problems live.

:::note A realistic timeline
Comfortable with HTML and CSS: a few weeks. Able to build interactive pages with JavaScript: a few months. Able to build and deploy a full application: six months to a year of consistent practice. Anyone promising faster is selling something.
:::

:::quiz
? `Uncaught TypeError: Cannot read properties of null (reading 'value')` on line 12. What is most likely?
- Line 12 has a syntax error
- A selector returned null — the element wasn't found or didn't exist yet *
- The value is the wrong type
- The file failed to load
> "Cannot read properties of null" always means the thing *before the dot* is null.

? You have 500 lines and no idea where the bug is. Best first move?
- Read all 500 lines carefully from the top
- Rewrite it from scratch
- Comment out half and see if the symptom persists *
- Add console.log to every line
> Bisecting halves the search space each round — vastly faster than linear reading.

? Which is the most useful thing to include when asking for help?
- How long you've been stuck
- A minimal reproducible example plus the exact error *
- A screenshot of your whole screen
- The name of your editor
> Minimal repro + exact error lets someone diagnose in seconds instead of guessing.

? An accepted Stack Overflow answer from 2012 solves your CSS layout problem. What should you check?
- Nothing, accepted answers are correct
- Whether a modern approach (flexbox/grid) now does it better *
- Whether the author is still active
- The number of comments
> Old answers often predate the tools that make the problem trivial today.
:::

:::exercise Practise reading errors
Run this in your browser console — it will throw. Before you fix it, write down in one sentence what the error is telling you, then fix it.

```js
const buttons = document.getElementByClass('nav-link');
buttons.forEach(b => console.log(b.textContent));
```

(Two problems hide in there. The method name is wrong — it's `getElementsByClassName` — and even then the result is an `HTMLCollection`, which has no `forEach`. `document.querySelectorAll` returns a NodeList, which does.)
:::
