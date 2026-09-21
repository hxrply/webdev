JavaScript is the language that makes pages do things. It started as a two-week hack in 1995 to make buttons blink; it now runs browsers, servers, phone apps, databases and spacecraft ground systems. It has some warts from that history, and we'll be honest about them.

# Where JavaScript runs

- **In the browser**, on every page that loads it. This is where you'll start.
- **On servers**, via Node.js, Deno or Bun.
- **Everywhere else** — desktop apps (Electron), mobile (React Native), embedded devices.

Same language, different available APIs. The browser gives you `document` and `window`; Node gives you file system and network access. Neither has the other's.

# Getting JavaScript onto a page

```html
<!-- 1. External file — what you'll use -->
<script src="js/main.js" defer></script>

<!-- 2. Inline, for tiny things -->
<script>
  console.log('Hello from an inline script');
</script>
```

`defer` means: download in parallel, run after the HTML is parsed, in document order. It's the right default for essentially all application code. Without it, a script in the `<head>` runs before the elements it needs exist.

```html run title="Your first script"
<h2 id="title">Original heading</h2>
<button id="btn">Change it</button>

<script>
  const button = document.getElementById('btn');
  const title = document.getElementById('title');

  button.addEventListener('click', function () {
    title.textContent = 'Changed at ' + new Date().toLocaleTimeString();
  });

  console.log('Script ran. Open the console pane below to see this.');
</script>
```

# The console is your workbench

```js run
console.log('A message');
console.log('Multiple', 'values', 42, true);
console.log({ name: 'Ada', role: 'engineer' });
console.table([{ id: 1, name: 'Ada' }, { id: 2, name: 'Grace' }]);
console.warn('Something looks off');
console.error('Something broke');

// Handy for measuring
console.time('loop');
let total = 0;
for (let i = 0; i < 1e6; i++) total += i;
console.timeEnd('loop');
console.log('total:', total);
```

Press Run and look at the console panel underneath. You'll use `console.log` thousands of times; there's no shame in it.

# Statements, semicolons and comments

```js run
// A single-line comment

/* A multi-line
   comment */

let x = 5;      // statement, terminated with a semicolon
let y = 10      // semicolons are optional — inserted automatically
console.log(x + y);
```

JavaScript inserts semicolons for you (**ASI** — Automatic Semicolon Insertion), and it mostly guesses right. The exceptions are nasty enough that most teams either always use semicolons or use a formatter (Prettier) that decides for them. Either is fine; inconsistency is not.

:::gotcha The one ASI rule that bites
```js
return
  { ok: true };    // returns undefined!
```
ASI inserts a semicolon after `return`, so the object is never reached. Never put a line break directly after `return`, `throw`, `break` or `continue`.
:::

# Variables in thirty seconds

```js run
const name = 'Ada';        // cannot be reassigned — your default
let count = 0;             // can be reassigned
count = count + 1;
// var legacy = 'avoid';   // old, function-scoped, confusing

console.log(name, count);
```

Use `const` by default, `let` when the value genuinely changes, and `var` never. The next lesson covers why in detail.

# Values and operations

```js run
// Numbers
console.log(7 + 3, 7 - 3, 7 * 3, 7 / 3, 7 % 3, 7 ** 3);

// Strings
const first = 'Ada';
const last = 'Lovelace';
console.log(first + ' ' + last);
console.log(`${first} ${last} has ${first.length + last.length} letters`);  // template literal

// Booleans and comparison
console.log(5 > 3, 5 === 5, 5 !== 4);

// Arrays and objects
const languages = ['HTML', 'CSS', 'JavaScript'];
const person = { name: 'Ada', year: 1815 };
console.log(languages[0], languages.length, person.name);
```

Template literals — backtick strings with `${}` — are the modern way to build strings. Multi-line, no concatenation, far more readable.

# Functions

```js run
// Declaration
function greet(name) {
  return `Hello, ${name}!`;
}

// Arrow function (shorter, and different in ways we'll cover later)
const shout = (text) => text.toUpperCase() + '!';

// Called
console.log(greet('Ada'));
console.log(shout('this is loud'));

// Functions are values: they can be passed around
const apply = (fn, value) => fn(value);
console.log(apply(shout, 'passed as an argument'));
```

# A complete small example

```html run title="Reading input, changing the page"
<label>Your name: <input id="nameInput" placeholder="Type here"></label>
<button id="greetBtn">Greet me</button>
<p id="output"></p>

<style>
  body { font-family: system-ui; }
  input, button { padding: 7px; font: inherit; margin: 4px 0; }
  #output { font-size: 1.2rem; font-weight: 600; color: #2b6cb0; min-height: 1.5em; }
</style>

<script>
  const input = document.getElementById('nameInput');
  const button = document.getElementById('greetBtn');
  const output = document.getElementById('output');

  function showGreeting() {
    const name = input.value.trim();
    if (name === '') {
      output.textContent = 'Please type a name first.';
      return;
    }
    output.textContent = `Hello, ${name}! Welcome to JavaScript.`;
  }

  button.addEventListener('click', showGreeting);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') showGreeting();
  });
</script>
```

That small program covers the shape of most front-end JavaScript: **select elements, listen for events, read values, update the page.**

# Case sensitivity and naming

```js
let userName = 'Ada';
let username = 'Grace';   // a completely different variable
```

JavaScript is case-sensitive. Conventions everyone follows:

- `camelCase` for variables and functions
- `PascalCase` for classes and constructors
- `UPPER_SNAKE_CASE` for true constants
- Names that say what they hold: `userEmail`, not `x` or `data2`

:::tip Read errors, don't fear them
You will see red text constantly. That is the normal state of programming, not a sign you're bad at it. `Uncaught TypeError: Cannot read properties of null` means something you expected to exist didn't. Read the message, read the line number, check your assumptions.
:::

:::quiz
? What does `defer` do on a script tag?
- Delays execution by one second
- Downloads in parallel and runs after HTML parsing, in order *
- Loads the script only when needed
- Prevents caching
> It is the right default for application code that touches the DOM.

? Which should be your default for declaring a variable?
- var
- let
- const *
- No keyword
> Use `const` unless you know the value will be reassigned; it prevents a class of bug.

? What does `` `Hello, ${name}!` `` produce?
- The literal text with ${name} in it
- A string with the value of `name` substituted *
- An error
- An array
> Template literals interpolate expressions and support multi-line strings.

? Why is a line break after `return` dangerous?
- It is a syntax error
- Automatic semicolon insertion ends the statement, returning undefined *
- It slows execution
- It breaks arrow functions
> Put the returned value on the same line as `return`.

? Where does browser JavaScript get `document` from?
- It is part of the language
- The browser provides it as a Web API *
- It must be imported
- From Node.js
> The language is small; `document`, `fetch` and `localStorage` are environment APIs.
:::

:::exercise Build a tiny interaction
Make a page with a text input, a button, and an empty paragraph. When clicked, the button should reverse the text in the input and show it in the paragraph. Then make Enter work too.

Hint: `[...str].reverse().join('')` reverses a string.
:::
