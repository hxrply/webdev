Most of the web is text. Marking it up properly is what makes a page readable by people, usable by screen readers, indexable by search engines and styleable by CSS.

# Headings: an outline, not font sizes

```html run title="Heading levels"
<h1>Making bread</h1>
<h2>Ingredients</h2>
<h3>Flour</h3>
<h3>Water</h3>
<h2>Method</h2>
<h3>Mixing</h3>
<h4>Autolyse</h4>
```

Headings `<h1>`–`<h6>` create a document outline, exactly like a book's table of contents.

The rules that matter:

- **One `<h1>` per page**, describing what the page is about.
- **Don't skip levels.** An `<h1>` followed by an `<h3>` leaves a hole in the outline.
- **Choose by meaning, not by size.** Need smaller text? That's CSS. Picking `<h4>` because it "looks right" wrecks the outline.

:::note Why this is not pedantry
Screen-reader users navigate by pulling up a list of headings and jumping — it's their equivalent of skimming. A page with one `<h1>` and no other headings is, to them, a wall of undifferentiated text. Search engines use the same structure to understand your page.
:::

# Paragraphs and line breaks

```html run title="Paragraphs vs breaks"
<p>A paragraph is a block of prose. Browsers add space above and below.</p>
<p>A second paragraph.</p>

<p>
  14 Bellevue Road<br>
  Glasgow<br>
  G12 8QQ
</p>
```

`<br>` forces a line break *within* a block — correct for addresses, poetry and song lyrics. It is **not** for creating gaps between paragraphs; that's what separate `<p>` elements and CSS margins are for. A stack of `<br><br><br>` is a sign that something has gone wrong.

# Emphasis and importance

```html run title="Semantic vs visual"
<p>You <em>must</em> chill the dough.</p>
<p><strong>Warning:</strong> the pan will be hot.</p>
<p>The word <i>schadenfreude</i> is German.</p>
<p>The <b>Ingredients</b> section follows.</p>
```

| Element | Means | Default look |
|---|---|---|
| `<em>` | Stress emphasis — changes the sentence's meaning | italic |
| `<strong>` | Strong importance, urgency, seriousness | bold |
| `<i>` | Different voice or mood: a term, a foreign phrase, a thought | italic |
| `<b>` | Draws attention without extra importance: a keyword, a product name | bold |
| `<mark>` | Highlighted for relevance, e.g. a search hit | yellow background |

`<em>` and `<strong>` carry meaning; screen readers may change intonation for them. `<i>` and `<b>` are visual distinctions with no importance attached. When in doubt, `<em>` and `<strong>` are usually right.

:::tip Never use `<i>` for icons out of habit
Icon fonts made `<i class="icon-x">` a common pattern. It's semantically wrong — `<span>` is the neutral choice, and SVG is better than icon fonts anyway.
:::

# Quotations

```html run title="Quotes"
<blockquote cite="https://example.com/essay">
  <p>The best way to predict the future is to invent it.</p>
  <footer>— Alan Kay</footer>
</blockquote>

<p>She described it as <q>a solved problem</q>, which was optimistic.</p>
```

`<blockquote>` for block-level quotations, `<q>` for inline ones (the browser adds the quote marks itself, in the right style for the page's language). The `cite` attribute holds the source URL.

# Code, output and technical text

```html run title="Technical elements"
<p>Run <code>npm install</code> to fetch dependencies.</p>

<pre><code>function add(a, b) {
  return a + b;
}</code></pre>

<p>Press <kbd>Ctrl</kbd> + <kbd>S</kbd> to save.</p>
<p>The program printed <samp>Segmentation fault</samp>.</p>
<p>E = mc<sup>2</sup>, and H<sub>2</sub>O is water.</p>
```

`<pre>` preserves whitespace and line breaks; `<code>` marks text as code. Together — `<pre><code>` — they're the standard way to show a code block, which is exactly what this site does.

# Dates, abbreviations and small print

```html run title="Fine-grained semantics"
<p>Published <time datetime="2025-03-14">14 March 2025</time>.</p>
<p>Uses <abbr title="Cascading Style Sheets">CSS</abbr> for layout.</p>
<p>Price: <del>£40</del> <ins>£28</ins></p>
<p><small>Terms and conditions apply.</small></p>
<address>Contact <a href="mailto:hi@example.com">hi@example.com</a></address>
```

`<time datetime="...">` gives a machine-readable date while displaying whatever format humans prefer — calendars and search engines read the attribute.

# Divs and spans: the ones with no meaning

```html
<div class="card">…</div>      <!-- generic block container -->
<span class="badge">New</span>  <!-- generic inline container -->
```

These are deliberately meaningless. Use them when you need a hook for styling or scripting and **no semantic element fits**. If one does fit — `<nav>`, `<article>`, `<button>` — use that instead. A page built entirely of divs works, but throws away every accessibility and SEO benefit HTML offers for free.

:::gotcha The classic mistake
`<div class="button" onclick="...">Save</div>` looks identical to a real button after styling. But it can't be focused with Tab, doesn't respond to Enter or Space, and announces as nothing at all to a screen reader. `<button>` gives you all of that for free. Use the right element.
:::

:::quiz
? Your subheading looks too big, so you use `<h4>` instead of `<h2>`. What's wrong with that?
- Nothing, h4 is valid
- It breaks the document outline that screen readers and search engines rely on *
- `<h4>` cannot contain links
- Browsers ignore h4
> Choose the heading level by position in the outline, then set the size with CSS.

? What is the difference between `<strong>` and `<b>`?
- None, `<b>` is deprecated
- `<strong>` means the content is important; `<b>` just draws visual attention *
- `<b>` is bolder
- `<strong>` only works inside paragraphs
> The distinction is meaning. Both render bold by default, but only one carries importance.

? How should you separate two paragraphs?
- `<br><br>`
- Two `<p>` elements, spaced with CSS *
- A `<div>` with a margin
- `&nbsp;` characters
> `<br>` is for line breaks inside a block (addresses, poetry), not for vertical spacing.

? Which element preserves whitespace exactly as typed?
- `<code>`
- `<pre>` *
- `<samp>`
- `<blockquote>`
> `<code>` marks text as code but does not preserve formatting; `<pre>` does.

? Why prefer `<button>` over a styled `<div>`?
- It is shorter to type
- It is keyboard focusable, activates on Enter/Space, and announces as a button *
- Divs cannot have click handlers
- Buttons are faster
> Native elements come with behaviour and accessibility built in — recreating it is surprisingly hard.
:::

:::exercise Mark up an article
Take three paragraphs of writing (a news story, a recipe, anything) and mark it up with: one `<h1>`, at least two `<h2>`s, a `<blockquote>` with attribution, an `<abbr>`, a `<time>`, and appropriate `<em>`/`<strong>`. Then read it aloud, skipping everything except headings. Does the outline still make sense? That's the screen-reader test.
:::
