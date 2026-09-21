Every element on a page is a rectangle. Understanding exactly how big that rectangle is, and why, eliminates a large fraction of layout confusion.

# The four layers

From the inside out: **content**, **padding**, **border**, **margin**.

```html run title="The box model, visible"
<div class="box">Content</div>

<style>
  body { font-family: system-ui; background: #eef1f5; }
  .box {
    width: 200px;
    height: 60px;

    padding: 20px;                  /* space INSIDE, gets the background */
    border: 6px solid #2b6cb0;      /* the edge */
    margin: 30px;                   /* space OUTSIDE, always transparent */

    background: #bee3f8;
    outline: 2px dashed crimson;    /* outside the border, takes no space */
  }
</style>
```

- **Padding** is inside: it is filled by the background and it pushes content away from the edge.
- **Border** sits on the boundary and can be styled and coloured.
- **Margin** is outside and always transparent — it pushes other elements away.
- **Outline** is drawn outside the border but **occupies no space**, so it never shifts layout. That's why it's the right tool for focus rings.

# The sizing trap

By default, `width` sets the width of the **content box only**. Padding and border are added *on top*.

```html run title="content-box vs border-box"
<div class="a">width: 200px; padding: 20px; border: 5px<br>→ actually 250px wide</div>
<div class="b">Same values with border-box<br>→ exactly 200px wide</div>

<style>
  body { font-family: system-ui; font-size: 14px; }
  .a, .b {
    width: 200px; padding: 20px; border: 5px solid #2b6cb0;
    background: #bee3f8; margin-bottom: 12px;
  }
  .a { box-sizing: content-box; }  /* the default */
  .b { box-sizing: border-box; }   /* the sane option */
</style>
```

With `content-box`: 200 + 20 + 20 + 5 + 5 = **250px**.
With `border-box`: the 200px *includes* padding and border. Content shrinks to fit.

This is why essentially every project starts with:

```css
*, *::before, *::after { box-sizing: border-box; }
```

:::tip Why border-box matters so much
Try making three columns of `width: 33.33%` with padding, under `content-box`. They overflow, because the padding is added after the percentage is calculated. With `border-box` they just work. Set it once at the top of every project and never think about it again.
:::

# Margin collapsing

Vertical margins between block elements **merge** into one — the larger wins, they don't add up.

```html run title="Collapsing margins"
<div class="a">margin-bottom: 40px</div>
<div class="b">margin-top: 20px</div>
<p>The gap above is 40px, not 60px.</p>

<style>
  body { font-family: system-ui; }
  .a { margin-bottom: 40px; background: #bee3f8; padding: 8px; }
  .b { margin-top: 20px;    background: #fed7d7; padding: 8px; }
</style>
```

Three situations where it happens:

1. **Between siblings** — as above.
2. **Parent and first/last child** — a child's `margin-top` can escape a parent that has no padding or border, pushing the *parent* down. This causes the classic "why is there a gap above my container?".
3. **Empty elements** — top and bottom margins collapse together.

It does **not** happen with: horizontal margins (never collapse), flex and grid items, absolutely positioned elements, floats, or anything with `overflow` other than `visible`.

:::gotcha The mysterious gap at the top of a container
```css
.card { background: white; }
.card h2 { margin-top: 24px; }   /* escapes the card and pushes it down */
```
Fixes: give `.card` `padding-top` (even 1px), a border, `display: flow-root`, or use `display: flex`/`grid`. Modern layouts avoid the whole issue because flex and grid items never collapse — one of the quiet reasons `gap` is so pleasant.
:::

# Useful margin tricks

```css
.centred { width: 600px; margin: 0 auto; }   /* horizontal centring for a fixed-width block */

.pull-left { margin-left: -12px; }            /* negative margins pull elements outward */

.stack > * + * { margin-top: 1rem; }          /* "owl" — space between siblings, not around them */
```

That last one is worth keeping: it adds space *between* children only, so there's no stray margin at the top or bottom of the container to fight with.

# Width and height controls

```html run title="min, max and fit-content"
<div class="fixed">width: 300px — overflows on small screens</div>
<div class="fluid">max-width: 300px — shrinks when it must</div>
<div class="fit">width: fit-content — as wide as its text</div>
<div class="clamped">min-width: 150px; max-width: 60ch</div>

<style>
  body { font-family: system-ui; font-size: 14px; }
  div { background: #bee3f8; padding: 8px; margin-bottom: 8px; }
  .fixed   { width: 300px; }
  .fluid   { max-width: 300px; }
  .fit     { width: fit-content; }
  .clamped { min-width: 150px; max-width: 60ch; background: #c6f6d5; }
</style>
```

**Prefer `max-width` to `width`.** `width: 800px` breaks on a 375px phone; `max-width: 800px` is 800px when there's room and fluid when there isn't. This single habit prevents most horizontal-scroll bugs.

# Overflow

```html run title="Handling content that doesn't fit"
<div class="visible">overflow: visible (default) — spills out</div>
<div class="hidden">overflow: hidden — clipped and unreachable</div>
<div class="auto">overflow: auto — scrollbars appear only when needed. This box has a lot of text in it so that it definitely needs to scroll.</div>
<div class="ellipsis">overflow with text-overflow: ellipsis on one line</div>

<style>
  body { font-family: system-ui; font-size: 14px; }
  div { width: 220px; height: 52px; background: #bee3f8; margin-bottom: 14px; padding: 6px; }
  .visible  { overflow: visible; }
  .hidden   { overflow: hidden; }
  .auto     { overflow: auto; }
  .ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
```

:::warn `overflow: hidden` hides bugs rather than fixing them
It's the usual quick fix for horizontal scrolling, and it makes the overflowing content unreachable — including focused form fields, which then scroll into a void. Find *what* is too wide (DevTools → select `body` → look for an element wider than the viewport) and fix that instead.
:::

# Display and the box

`display` decides what kind of box an element generates:

| Value | Behaviour |
|---|---|
| `block` | Full width available, starts on a new line, honours width/height |
| `inline` | Flows with text; **ignores width, height and vertical margins** |
| `inline-block` | Flows like inline, but sizes like block |
| `flex` / `grid` | Block-level container with flex/grid children |
| `none` | Removed entirely — no space, not announced |

:::gotcha Width on an inline element does nothing
```css
span { width: 200px; }   /* ignored */
```
`<span>`, `<a>` and `<em>` are inline. Give them `display: inline-block` (or make them flex/grid items) before sizing them. This catches everyone once.
:::

:::quiz
? An element has `width: 300px; padding: 20px; border: 2px`. How wide is it with default box-sizing?
- 300px
- 344px *
- 340px
- 322px
> 300 + 20 + 20 + 2 + 2 = 344. `border-box` would make it exactly 300.

? Two stacked divs have `margin-bottom: 30px` and `margin-top: 20px`. What is the gap?
- 50px
- 30px *
- 20px
- 10px
> Adjacent vertical margins collapse to the larger of the two.

? Your heading's margin-top is pushing the whole card down instead of moving the heading. Why?
- The margin is negative
- Parent and first-child margins collapsed *
- The card has display: inline
- Margins don't work on headings
> Add padding, a border, `display: flow-root`, or make the parent flex/grid.

? Which is generally safer for a container's width?
- `width: 1000px`
- `max-width: 1000px` *
- `min-width: 1000px`
- `width: 100vw`
> `max-width` caps the size on large screens and shrinks on small ones.

? Why is `outline` used for focus rings rather than `border`?
- It is more visible
- It takes up no space, so adding it never shifts the layout *
- Borders cannot be dashed
- It inherits the text colour
> A border on focus would nudge everything around it by a pixel or two.

? `<span class="btn">` won't take a width. What's wrong?
- Spans cannot have classes
- Inline elements ignore width/height — use `inline-block` *
- The width needs `!important`
- You need to set position
> Or, better, use a `<button>`, which is inline-block-ish by default and accessible.
:::

:::exercise Build a debug helper
Add this to any page:

```css
* { outline: 1px solid rgba(255,0,0,.25); }
```

Every box on the page becomes visible. Use it on a layout you've built and look for boxes that are wider than you expected, unexpected margins, and elements that aren't where you think. Then remove it. Many developers keep this as a toggleable class permanently.
:::
