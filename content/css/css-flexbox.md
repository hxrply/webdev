Flexbox lays things out along a single axis — a row or a column — and distributes space between them. It is the right tool for navigation bars, toolbars, card footers, form rows and centring, which is to say: most of the layout you write.

# The mental model

You set `display: flex` on a **container**. Its direct children become **flex items**. Then:

- The **main axis** runs in the direction of `flex-direction` (default: horizontal).
- The **cross axis** is perpendicular to it.
- `justify-content` aligns along the **main** axis.
- `align-items` aligns along the **cross** axis.

Getting those two straight is 80% of Flexbox. And note they swap meaning when `flex-direction: column`.

```html run title="Your first flex container"
<div class="row">
  <div>One</div><div>Two</div><div>Three</div>
</div>

<style>
  body { font-family: system-ui; }
  .row { display: flex; gap: 10px; background: #edf2f7; padding: 10px; }
  .row > div { background: #4299e1; color: white; padding: 12px 18px; border-radius: 6px; }
</style>
```

Three divs that would have stacked vertically now sit in a row. `gap` handles the spacing — no margin gymnastics, no whitespace bugs.

# Container properties

```html run title="justify-content — the main axis"
<p>flex-start</p>
<div class="c" style="justify-content: flex-start"><i>1</i><i>2</i><i>3</i></div>
<p>center</p>
<div class="c" style="justify-content: center"><i>1</i><i>2</i><i>3</i></div>
<p>flex-end</p>
<div class="c" style="justify-content: flex-end"><i>1</i><i>2</i><i>3</i></div>
<p>space-between — first and last hug the edges</p>
<div class="c" style="justify-content: space-between"><i>1</i><i>2</i><i>3</i></div>
<p>space-around — equal space around each item (edges get half)</p>
<div class="c" style="justify-content: space-around"><i>1</i><i>2</i><i>3</i></div>
<p>space-evenly — every gap identical, edges included</p>
<div class="c" style="justify-content: space-evenly"><i>1</i><i>2</i><i>3</i></div>

<style>
  body { font-family: system-ui; font-size: 12px; }
  p { margin: 10px 0 4px; color: #4a5568; font-weight: 600; }
  .c { display: flex; background: #edf2f7; padding: 6px; }
  .c i { background: #4299e1; color: #fff; padding: 6px 14px; border-radius: 4px; font-style: normal; }
</style>
```


| Property | Does | Common values |
|---|---|---|
| `flex-direction` | Sets the main axis | `row`, `column`, `row-reverse`, `column-reverse` |
| `justify-content` | Main-axis distribution | `flex-start`, `center`, `flex-end`, `space-between`, `space-around`, `space-evenly` |
| `align-items` | Cross-axis alignment | `stretch` (default), `flex-start`, `center`, `flex-end`, `baseline` |
| `flex-wrap` | Allow wrapping | `nowrap` (default), `wrap` |
| `align-content` | Distributes **wrapped lines** | Same values as justify-content |
| `gap` | Space between items | `gap: 16px`, `row-gap`, `column-gap` |

:::gotcha `align-items` vs `align-content`
`align-items` aligns items *within their line*. `align-content` distributes the *lines themselves*, and only does anything when items wrap onto multiple lines. Reaching for `align-content` on a single-line container is a common no-op.
:::

# Item properties

```html run title="flex-grow, shrink and basis"
<div class="row">
  <div class="a">grow: 1</div>
  <div class="b">grow: 2 — twice the free space</div>
  <div class="c">no grow</div>
</div>

<div class="row">
  <div class="fixed">200px, won't shrink</div>
  <div class="flexible">flex: 1 — takes what's left</div>
</div>

<style>
  body { font-family: system-ui; font-size: 13px; }
  .row { display: flex; gap: 8px; background: #edf2f7; padding: 8px; margin-bottom: 10px; }
  .row > div { background: #4299e1; color: white; padding: 10px; border-radius: 6px; }
  .a { flex-grow: 1; }
  .b { flex-grow: 2; }
  .fixed { flex: 0 0 200px; }
  .flexible { flex: 1; }
</style>
```

- **`flex-grow`** — share of *leftover* space. `0` (default) means don't grow.
- **`flex-shrink`** — how readily it shrinks when space is tight. `1` (default) means yes.
- **`flex-basis`** — the starting size before growing or shrinking. `auto` uses the content's size.

The shorthand `flex: grow shrink basis` covers all three, and the useful presets are:

```css
.item { flex: 1; }            /* 1 1 0%  — equal columns, ignore content size */
.item { flex: auto; }         /* 1 1 auto — grow, but start from content size */
.item { flex: none; }         /* 0 0 auto — rigid */
.item { flex: 0 0 240px; }    /* fixed 240px sidebar */
```

:::tip `flex: 1` vs `flex: auto`
`flex: 1` sets basis to `0`, so all items end up **equal width** regardless of content. `flex: auto` starts from content width, so a long item stays wider. For equal columns you want `flex: 1`.
:::

## align-self and order

```css
.item { align-self: flex-end; }  /* override align-items for one item */
.item { order: -1; }             /* move it visually first */
.footer-item { margin-left: auto; }  /* push this and everything after it to the right */
```

That `margin-left: auto` trick is the neatest way to build a nav bar: logo on the left, links pushed right, no extra wrappers.

:::warn `order` changes visuals, not reality
Tab order and screen-reader order follow the **DOM**, not `order` or `row-reverse`. Reordering visually creates a confusing mismatch for keyboard users. Reorder the HTML when you can, and use `order` only for minor, responsive adjustments.
:::

# Centring, finally solved

```html run title="Perfect centring"
<div class="centre">
  <div class="thing">Dead centre, both axes</div>
</div>

<style>
  body { font-family: system-ui; }
  .centre {
    display: flex;
    justify-content: center;   /* main axis: horizontal */
    align-items: center;       /* cross axis: vertical */
    height: 180px;
    background: #edf2f7;
  }
  .thing { background: #4299e1; color: white; padding: 16px 24px; border-radius: 8px; }
</style>
```

Three lines. This was genuinely difficult before 2015, which is why "centre a div" became a joke.

# Real patterns

```html run title="Four everyday flex layouts"
<!-- 1. Nav bar -->
<nav class="nav">
  <strong>Logo</strong>
  <a href="#">Home</a><a href="#">About</a>
  <button class="push">Sign in</button>
</nav>

<!-- 2. Media object -->
<div class="media">
  <img src="https://picsum.photos/id/1027/56/56" alt="">
  <div><strong>Ada Lovelace</strong><br><span class="dim">Wrote the first algorithm.</span></div>
</div>

<!-- 3. Card with footer pinned to the bottom -->
<div class="cards">
  <article class="card"><h4>Short</h4><p>Little text.</p><a href="#">Read →</a></article>
  <article class="card"><h4>Longer</h4><p>Rather more text here, enough to make this card taller than its neighbour.</p><a href="#">Read →</a></article>
</div>

<!-- 4. Wrapping tags -->
<div class="tags"><span>css</span><span>flexbox</span><span>layout</span><span>frontend</span><span>responsive</span></div>

<style>
  body { font-family: system-ui; font-size: 14px; }
  .nav { display: flex; align-items: center; gap: 16px; background: #2d3748; padding: 10px 14px; border-radius: 8px; color: white; }
  .nav a { color: #cbd5e0; text-decoration: none; }
  .push { margin-left: auto; padding: 6px 12px; border-radius: 6px; border: none; cursor: pointer; }

  .media { display: flex; gap: 12px; align-items: center; margin: 16px 0; }
  .media img { border-radius: 50%; flex: none; }
  .dim { color: #718096; }

  .cards { display: flex; gap: 12px; align-items: stretch; }
  .card { flex: 1; display: flex; flex-direction: column; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
  .card p { flex: 1; }            /* eats the free space, pushing the link down */
  .card h4 { margin: 0 0 6px; }

  .tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
  .tags span { background: #edf2f7; padding: 4px 10px; border-radius: 999px; font-size: 12px; }
</style>
```

Look at pattern 3: `flex: 1` on the paragraph makes it absorb the leftover height, so the "Read →" links line up at the bottom of both cards no matter how much text they contain. That's the flex idiom for pinning a footer.

# The two classic bugs

:::gotcha Flex items refusing to shrink
A flex item won't shrink below its content's minimum size, because `min-width` defaults to `auto`. A long word or a `<pre>` block then blows out your layout.

```css
.item { min-width: 0; }      /* let it shrink */
.item { overflow: hidden; }  /* or this */
```
This is *the* fix for "my flex layout overflows and I can't work out why". For columns, it's `min-height: 0`.
:::

:::gotcha Images stretching oddly
`align-items: stretch` is the default, so an image in a flex row may stretch to the tallest item's height. Add `align-items: flex-start`, or `align-self: flex-start` / `flex: none` on the image.
:::

:::quiz
? `flex-direction: column`. Which property now controls vertical alignment?
- align-items
- justify-content *
- align-content
- vertical-align
> `justify-content` always works on the main axis — which is vertical in a column.

? What is the difference between `flex: 1` and `flex: auto`?
- None
- `flex: 1` sets basis to 0 so items are equal; `flex: auto` starts from content size *
- `flex: auto` cannot shrink
- `flex: 1` only works in rows
> For equal-width columns you want `flex: 1`.

? A long word makes your flex layout overflow its container. The fix?
- `flex-wrap: wrap`
- `min-width: 0` on the flex item *
- `overflow-x: hidden` on body
- Reduce the font size
> Flex items default to `min-width: auto`, refusing to shrink below their content.

? How do you push one nav item to the far right?
- `float: right`
- `justify-content: flex-end`
- `margin-left: auto` on that item *
- `position: absolute`
> Auto margins absorb all free space on that side — a very handy flex idiom.

? Why should you avoid reordering items with `order`?
- It is slow
- Keyboard and screen-reader order follow the DOM, creating a confusing mismatch *
- It only works in Chrome
- It breaks gap
> Visual order and focus order diverging is a real accessibility problem.

? Cards in a row have different amounts of text but you want their buttons aligned at the bottom. What do you do?
- Give every card a fixed height
- Make the card a column flex container and `flex: 1` the text above the button *
- Use position: absolute on the button
- Add margin-top: 100px
> The growing element absorbs the spare height and pushes the footer down.
:::

:::exercise Build a navbar and a card grid
1. A nav bar: logo left, three links centred-ish, a button hard right, vertically aligned, collapsing to a column below 600px.
2. A row of three cards with equal widths (`flex: 1`), equal heights, and footers aligned regardless of body text length.

Then shrink the preview and make the cards wrap gracefully with `flex-wrap` and a sensible `flex-basis`.
:::
