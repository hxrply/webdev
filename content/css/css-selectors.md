Selectors are how you point at things. Most people learn three and stop; knowing ten makes your CSS dramatically shorter and stops you adding classes to everything just to reach it.

# Combinators: relationships between elements

```html run title="The four combinators"
<div class="box">
  <h3>Heading</h3>
  <p>First paragraph (child of .box)</p>
  <p>Second paragraph</p>
  <section><p>Nested paragraph (descendant, not child)</p></section>
</div>
<p>Outside paragraph</p>

<style>
  body { font-family: system-ui; }

  .box p        { color: #555; }              /* descendant: any depth */
  .box > p      { font-weight: 700; }         /* child: direct only     */
  h3 + p        { color: crimson; }           /* adjacent sibling: the p right after h3 */
  h3 ~ p        { border-left: 3px solid #ddd; padding-left: 8px; }  /* all later siblings */
</style>
```

| Combinator | Meaning |
|---|---|
| `A B` | B anywhere inside A |
| `A > B` | B that is a **direct child** of A |
| `A + B` | The B **immediately after** A (same parent) |
| `A ~ B` | **Every** B after A (same parent) |

# Attribute selectors

Style by attribute, no extra classes needed:

```html run title="Selecting on attributes"
<p><a href="https://example.com">External link</a></p>
<p><a href="/about">Internal link</a></p>
<p><a href="report.pdf">A PDF</a></p>
<p><input type="email" placeholder="email"> <input type="checkbox" checked></p>

<style>
  body { font-family: system-ui; }
  a[href^="https"]::after  { content: " ↗"; }            /* starts with */
  a[href$=".pdf"]::after   { content: " (PDF)"; color: crimson; }  /* ends with */
  a[href*="example"]       { font-weight: 700; }          /* contains */
  input[type="email"]      { border: 2px solid steelblue; }  /* exact */
  input[checked]           { outline: 2px solid green; }     /* has attribute */
</style>
```

| Pattern | Matches |
|---|---|
| `[attr]` | has the attribute at all |
| `[attr="x"]` | exactly `x` |
| `[attr^="x"]` | starts with `x` |
| `[attr$="x"]` | ends with `x` |
| `[attr*="x"]` | contains `x` |
| `[attr~="x"]` | space-separated list containing `x` |
| `[attr="x" i]` | case-insensitive match |

# Pseudo-classes: state and position

## State

```html run title="Interactive states"
<button>Hover and focus me</button>
<input type="text" placeholder="Type something">
<input type="email" value="not-an-email">
<button disabled>Disabled</button>

<style>
  body { font-family: system-ui; display: grid; gap: 10px; max-width: 280px; }
  button, input { padding: 9px; font: inherit; border: 1px solid #bbb; border-radius: 6px; }

  button:hover          { background: #eef4ff; border-color: steelblue; }
  button:active         { transform: translateY(1px); }
  button:focus-visible  { outline: 3px solid steelblue; outline-offset: 2px; }
  button:disabled       { opacity: .5; cursor: not-allowed; }
  input:focus           { border-color: steelblue; outline: none; }
  input:invalid         { border-color: crimson; }
  input:placeholder-shown { background: #fafafa; }
</style>
```

The order matters for links: **L**ove/**H**ate — `:link`, `:visited`, `:hover`, `:focus`, `:active`. Declared out of order, later rules win and your hover state silently stops working.

## Position in the tree

```html run title="Structural pseudo-classes"
<ul>
  <li>One</li><li>Two</li><li>Three</li><li>Four</li><li>Five</li>
</ul>

<style>
  body { font-family: system-ui; }
  li { padding: 6px; }
  li:first-child      { font-weight: 700; }
  li:last-child       { border-bottom: none; }
  li:nth-child(odd)   { background: #f2f4f8; }
  li:nth-child(3)     { color: crimson; }
  li:nth-child(2n+3)  { border-left: 4px solid steelblue; }
  li:not(:last-child) { border-bottom: 1px solid #e5e8ee; }
</style>
```

`:nth-child()` takes a formula `an+b`, where `n` counts 0, 1, 2… So `2n` is every second, `3n+1` is every third starting at the first, `odd`/`even` are the obvious shorthands. `:nth-last-child()` counts from the end.

:::gotcha `:nth-child` vs `:nth-of-type`
`p:nth-child(2)` means "the second child, *if* it happens to be a `<p>`". `p:nth-of-type(2)` means "the second `<p>` among its siblings". When a heading sits above your paragraphs, these give very different answers.
:::

## The functional ones

```html run title=":is(), :where() and :has()"
<article>
  <h2>A heading</h2>
  <p>Some text.</p>
  <figure><img src="https://picsum.photos/id/1015/200/100" alt=""><figcaption>A caption</figcaption></figure>
</article>
<article>
  <h2>No figure here</h2>
  <p>Just text.</p>
</article>

<style>
  body { font-family: system-ui; }

  /* :is() — one rule instead of three, and it keeps specificity */
  :is(h1, h2, h3) { color: #24304a; margin-bottom: .3em; }

  /* :where() — identical, but contributes ZERO specificity (easy to override) */
  :where(article) p { line-height: 1.6; }

  /* :has() — style a PARENT based on its children */
  article:has(figure) { border-left: 4px solid seagreen; padding-left: 12px; }
  article:not(:has(figure)) { opacity: .75; }
</style>
```

`:has()` is genuinely transformative — CSS finally has a "parent selector". Style a card that contains an image, a label whose input is checked, a form with an error:

```css
.field:has(input:invalid) { border-color: crimson; }
label:has(input:checked)  { font-weight: 700; }
body:has(dialog[open])    { overflow: hidden; }
```

# Pseudo-elements: parts that aren't in the HTML

```html run title="::before, ::after and friends"
<p class="note">A note with a generated icon.</p>
<p class="fancy">This paragraph has a styled first letter and first line, which goes on long enough to show the effect.</p>
<p>Select this text to see the selection colour.</p>

<style>
  body { font-family: system-ui; }
  .note::before {
    content: "💡 ";
  }
  .note::after {
    content: " (generated)";
    color: #888;
    font-size: .85em;
  }
  .fancy::first-letter { font-size: 2.4em; float: left; line-height: 1; padding-right: 4px; color: crimson; }
  .fancy::first-line   { font-variant: small-caps; }
  ::selection          { background: #ffe08a; }
  ::placeholder        { color: #aaa; font-style: italic; }
</style>
```

`::before` and `::after` require a `content` property — even `content: ""` — or nothing appears. They're common for icons, decorative shapes and clearfixes.

:::warn Don't put meaningful text in `content`
Generated content is inconsistently exposed to assistive tech and can't be selected, copied or translated. Decoration only; real content belongs in HTML.
:::

# The universal selector and specificity preview

```css
*          { box-sizing: border-box; }   /* everything */
.card > *  { margin-block: 0; }          /* every direct child of .card */
```

`*` is fine for resets. In long selector chains it costs a little performance and a lot of clarity.

:::quiz
? What does `.menu > li` match?
- Any `li` inside `.menu` at any depth
- Only `li` elements that are direct children of `.menu` *
- The first `li` in `.menu`
- Every `li` after `.menu`
> `>` is the child combinator — one level only.

? You want to style a card only when it contains an image. Which selector?
- `.card img`
- `.card:has(img)` *
- `.card > img`
- `img:parent(.card)`
> `:has()` looks at descendants and styles the ancestor — the long-awaited parent selector.

? `p:nth-child(2)` doesn't match your second paragraph. Why?
- nth-child starts at 0
- The second child of the parent isn't a `p` — you want `p:nth-of-type(2)` *
- nth-child only works on lists
- You need a space before the colon
> `:nth-child` counts *all* siblings; `:nth-of-type` counts only matching elements.

? What is the difference between `:is()` and `:where()`?
- `:where()` is faster
- `:where()` adds no specificity, `:is()` takes the highest of its arguments *
- `:is()` only accepts classes
- There is none
> `:where()` is ideal for defaults you want easy to override.

? Why does `::before` sometimes show nothing?
- It needs a `display` value
- The `content` property is missing *
- It only works on block elements
- It requires a class
> No `content`, no pseudo-element — `content: ""` is enough.
:::

:::exercise Style without adding classes
Take a plain HTML document (headings, paragraphs, a list, some links, a form) and style it using **only** element, attribute, pseudo-class and pseudo-element selectors — no new classes in the HTML. Zebra-stripe the list with `:nth-child`, flag external links with `[href^="http"]::after`, and highlight invalid inputs.
:::
