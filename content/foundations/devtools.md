DevTools is the single most useful thing in your toolkit, and most beginners use perhaps five percent of it. An hour here will repay you every working day.

Open it with **F12**, **Ctrl+Shift+I** (Windows/Linux), **⌘+Option+I** (Mac), or right-click → **Inspect**.

# Elements: the live page

The Elements panel shows the **DOM** — the browser's internal representation of your page. This is important: it is *not* your HTML file. It's what the HTML became after parsing, plus anything JavaScript has changed since.

What you can do here:

- **Click any element** to select it; hover to highlight it on the page.
- **Edit anything live.** Double-click text or an attribute and type. Changes apply instantly and vanish on reload — perfect for experiments.
- **Styles pane (right).** Every CSS rule applying to the selected element, in cascade order, with the losing ones struck through. Click a value and edit it. Tick and untick properties.
- **Computed tab.** The final value of every property after the cascade is resolved. When you cannot work out where `margin: 24px` came from, expand it here and it tells you which rule and which file.
- **Box model diagram.** A picture of content, padding, border and margin with real numbers. Invaluable for "why is there a gap?".
- **`:hov` button.** Force `:hover`, `:focus`, `:active` states so you can style them without gymnastics.

:::tip The fastest CSS debugging trick
Select the element, click the Styles pane, and press the **up/down arrow keys** on a numeric value. It changes by 1 (hold Shift for 10) and the page updates live. Finding the right padding takes seconds instead of a save-reload cycle.
:::

:::note DOM ≠ source
If your page is built by JavaScript, View Source shows an almost-empty file while Elements shows the full tree. That difference *is* the difference between server-rendered and client-rendered pages.
:::

# Console: talk to the page

The Console is a live JavaScript prompt running in the context of the current page. Type an expression, press Enter, get the result.

```js
document.title                       // read the page title
document.querySelectorAll('img').length  // how many images?
$0                                   // the element currently selected in Elements
$$('a')                              // shorthand for querySelectorAll
```

Beyond `console.log`, these earn their keep:

```js
console.table(users);        // arrays of objects as a readable grid
console.error('broke');      // red, with a stack trace
console.warn('careful');     // yellow
console.dir(el);             // the element as an object, not as HTML
console.count('clicked');    // how many times did this run?
console.time('load'); /* ... */ console.timeEnd('load');  // measure duration
console.assert(x > 0, 'x should be positive');
```

:::gotcha The blue "i" next to a logged object
Logging an object logs a *live reference*. Expanding it later shows its state **now**, not at log time. If a value looks wrong, log a snapshot instead: `console.log(JSON.parse(JSON.stringify(obj)))` or `console.log({...obj})`.
:::

Red console errors are not noise. Read them. The message says what went wrong, and the link on the right jumps straight to the line.

# Network: what was actually requested

Reload with this panel open and you see every request. Key columns: **Name**, **Status**, **Type**, **Size**, **Time**.

Things to do here:

- **Filter by Fetch/XHR** to see only API calls your JavaScript made — the fastest way to debug "my data isn't showing".
- **Click a request** for Headers (what was sent/received), Payload (what you posted), Response (the raw body), and Preview (formatted JSON).
- **Throttle**: the dropdown that fakes "Slow 3G". Your site feels very different on a bad connection, and this is how you find out before your users do.
- **Disable cache** (tick it while DevTools is open) so you always test fresh files.
- **Red rows** are failures. A 404 on a stylesheet explains an unstyled page far faster than staring at CSS.

:::warn "But I changed the file!"
Browsers cache aggressively. If an edit seems to have no effect: hard-reload (**Ctrl/⌘+Shift+R**), or tick *Disable cache*. An hour lost to a cached stylesheet is a rite of passage — skip it.
:::

# Sources: debugging properly

`console.log` is fine. Breakpoints are better.

1. Open **Sources**, find your JS file.
2. Click a line number to set a **breakpoint**.
3. Trigger the code. Execution *pauses* there.
4. Now hover any variable to see its value, inspect **Scope** in the sidebar, and step through:
   - **Step over** (F10): run this line, stay in this function
   - **Step into** (F11): go into the function being called
   - **Resume** (F8): continue until the next breakpoint

You can also write `debugger;` in your code — execution stops there whenever DevTools is open.

:::tip Conditional breakpoints
Right-click a line number → *Add conditional breakpoint* → `id === 42`. It pauses only when the condition is true. This beats logging inside a loop that runs ten thousand times.
:::

# The other panels

- **Application** — localStorage, sessionStorage, cookies, service workers. Inspect and delete stored values here. Essential when debugging "why am I still logged in?".
- **Lighthouse** — runs an audit of performance, accessibility, SEO and best practices, and gives prioritised fixes. Run it on your own project; it will humble you productively.
- **Performance** — records a timeline of what the browser did. Advanced, but the place to go when something is janky.
- **Accessibility** (inside Elements) — the accessibility tree, computed name and role, and a contrast checker on colour swatches.
- **Device toolbar** (Ctrl/⌘+Shift+M) — simulate phone sizes. Useful, but no substitute for a real device.

# Responsive checking

Click the device-toolbar icon, pick a size, and drag the edges. The number shown while dragging is the viewport width — exactly what your media queries respond to. If your layout breaks at 380px, you now know precisely where to add a breakpoint.

:::quiz
? The Elements panel shows markup that isn't in your HTML file. Why?
- DevTools is broken
- It shows the live DOM, including anything JavaScript added *
- The browser rewrites HTML for security
- You are viewing a cached version
> Elements = the current DOM. View Source = the original file. JS changes only appear in the former.

? Your API call returns data but nothing appears on screen. Which panel do you check first?
- Lighthouse
- Network, filtered to Fetch/XHR, to confirm the response actually contains what you expect *
- Performance
- Application
> Establish whether the problem is *getting* the data or *rendering* it — that splits the search space in half.

? What does `$0` mean in the Console?
- The first element on the page
- The last value you typed
- The element currently selected in the Elements panel *
- The document root
> `$0` through `$4` are your recently inspected elements. Extremely handy.

? Which is the better way to find why a variable is wrong inside a loop running 10,000 times?
- Add console.log and scroll
- Set a conditional breakpoint that pauses only on the interesting case *
- Refresh repeatedly
- Comment out the loop
> Conditional breakpoints take you straight to the one iteration that matters.

? A stylesheet change has no effect even after saving and reloading. Most likely cause?
- CSS is broken in this browser
- The browser served a cached copy of the old file *
- The file needs compiling
- CSS cannot be reloaded
> Hard-reload or tick "Disable cache" in the Network panel.
:::

:::exercise Ten minutes of deliberate practice
On any site you like:

1. Change a headline's text and colour live in Elements.
2. Run `document.querySelectorAll('a').length` in the Console.
3. In Network, find the slowest request and note its size.
4. Throttle to Slow 3G and reload — watch what appears first.
5. Run a Lighthouse audit and read the top accessibility issue.
:::
