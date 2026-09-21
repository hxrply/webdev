Before Flexbox and Grid, there is **normal flow** — the default way the browser stacks things. Most layout bugs are normal flow doing exactly what it was designed to do while you expected something else.

# Block and inline

```html run title="Block vs inline behaviour"
<div class="block">I am block: full width, new line, width and height obey.</div>
<div class="block">Another block.</div>

<span class="inline">I am inline.</span>
<span class="inline">I sit beside my neighbour and ignore width/height.</span>

<style>
  body { font-family: system-ui; font-size: 14px; }
  .block  { background: #bee3f8; margin: 4px 0; padding: 6px; width: 60%; }
  .inline { background: #fed7d7; padding: 6px; width: 300px; /* ignored */ margin: 20px; /* vertical ignored */ }
</style>
```

| | Block | Inline |
|---|---|---|
| Starts on a new line | Yes | No |
| Default width | Fills the container | As wide as its content |
| `width`/`height` | Respected | **Ignored** |
| Vertical margin/padding | Respected | Padding draws but doesn't push; margin ignored |
| Examples | `div`, `p`, `h1`, `section` | `span`, `a`, `em`, `img`* |

`inline-block` is the hybrid: flows inline, but sizes and takes vertical spacing like a block.

:::gotcha The mysterious gap between inline-blocks
```html
<span class="box"></span>
<span class="box"></span>   <!-- a ~4px gap appears between them -->
```
That gap is the **whitespace in your HTML** — the newline between the tags is a text node, rendered as a space. Historic hacks included setting `font-size: 0` on the parent or writing `</span><span>` with no space.

The modern answer: use Flexbox or Grid, where whitespace between items is ignored entirely.
:::

# Normal flow in one sentence

Block boxes stack vertically, each taking the full available width; inline boxes flow horizontally within a line box, wrapping when they run out of room.

Everything else — floats, positioning, flex, grid — is a deviation from that.

# position

```html run title="The five position values"
<div class="wrap">
  <div class="box static">static (default)</div>
  <div class="box relative">relative: nudged 20px right, space kept</div>
  <div class="box absolute">absolute: positioned in .wrap</div>
  <div class="box normal">a normal box</div>
</div>
<div class="sticky-demo">
  <div class="sticky">sticky: scroll this box</div>
  <p>Scroll…</p><p>…keep…</p><p>…scrolling…</p><p>…to see it stick.</p>
</div>

<style>
  body { font-family: system-ui; font-size: 13px; }
  .wrap { position: relative; border: 2px dashed #999; padding: 8px; height: 150px; margin-bottom: 16px; }
  .box { background: #bee3f8; padding: 6px; margin-bottom: 6px; }
  .relative { position: relative; left: 20px; background: #fbd38d; }
  .absolute { position: absolute; top: 8px; right: 8px; width: 140px; background: #c6f6d5; }
  .sticky-demo { height: 120px; overflow: auto; border: 2px dashed #999; padding: 8px; }
  .sticky { position: sticky; top: 0; background: #fed7d7; padding: 6px; }
</style>
```

| Value | Behaviour |
|---|---|
| `static` | Default. `top`/`left` etc. do nothing. |
| `relative` | Offset from where it *would* have been. **Its original space is preserved.** |
| `absolute` | Removed from flow. Positioned against the nearest **positioned ancestor** (see below). |
| `fixed` | Removed from flow. Positioned against the viewport; doesn't scroll. |
| `sticky` | Normal until it hits the given offset, then sticks. Needs a `top`/`bottom` value **and** a scrollable ancestor. |

:::tip The absolute-positioning rule everyone needs
An absolutely positioned element is placed relative to its nearest ancestor with `position` other than `static`. If there isn't one, it uses the page itself — which is why your "positioned in the corner" badge ends up in the corner of the *document*.

The fix is nearly always: `position: relative` on the parent, `position: absolute` on the child. That pair is the foundation of badges, overlays, dropdowns and custom checkboxes.
:::

```html run title="The relative/absolute pair"
<div class="card">
  <img src="assets/img/wide.svg" alt="">
  <span class="badge">NEW</span>
</div>

<style>
  body { font-family: system-ui; }
  .card { position: relative; width: 240px; }
  .card img { display: block; border-radius: 8px; }
  .badge {
    position: absolute; top: 8px; right: 8px;
    background: crimson; color: white;
    padding: 3px 8px; border-radius: 999px; font-size: 12px; font-weight: 700;
  }
</style>
```

# z-index and stacking

```html run title="Stacking order"
<div class="a">z-index: 1</div>
<div class="b">z-index: 3 — on top</div>
<div class="c">z-index: 2</div>

<style>
  body { font-family: system-ui; }
  div { position: absolute; width: 120px; height: 60px; padding: 8px; color: white; font-size: 13px; }
  .a { background: #2b6cb0; top: 10px; left: 10px;  z-index: 1; }
  .b { background: crimson; top: 30px; left: 50px;  z-index: 3; }
  .c { background: seagreen; top: 50px; left: 90px; z-index: 2; }
</style>
```

Three things to know:

1. **`z-index` only works on positioned elements** (not `static`) — and on flex/grid items, which is a useful exception.
2. **Stacking contexts nest.** A child can never escape its parent's stacking context. If `.parent` has `z-index: 1` and a sibling has `z-index: 2`, then `.parent`'s child with `z-index: 9999` still sits below that sibling. This is *the* reason "my modal is behind the header" happens.
3. Many properties create a stacking context without any z-index: `opacity` < 1, `transform`, `filter`, `will-change`, `isolation: isolate`, `position: fixed`.

:::gotcha z-index: 9999 is a smell
Escalating z-index numbers means someone is fighting a stacking context they haven't identified. Find the ancestor creating the context (DevTools' Layers panel helps), and fix it there. Keep a small documented scale instead:

```css
:root { --z-dropdown: 10; --z-sticky: 20; --z-modal: 100; --z-toast: 200; }
```
:::

# float

Floats were the layout tool of 2005–2015. Today their only legitimate use is the original one: **wrapping text around an image**.

```html run title="Float, used correctly"
<img src="assets/img/photo.svg" alt="" class="float">
<p>Text wraps around a floated image, which is exactly what floats were invented for.
Everything else floats were used for — columns, grids, navigation bars — is better done
with Flexbox or Grid now.</p>

<style>
  body { font-family: system-ui; font-size: 14px; }
  .float { float: left; margin: 0 12px 8px 0; border-radius: 6px; }
</style>
```

If you meet a float-based layout in old code, the `clearfix` hack and `overflow: hidden` on parents exist because floated children don't contribute to their parent's height. The modern equivalent is `display: flow-root`.

# display: none vs visibility vs opacity

```html run title="Three ways to hide"
<div class="row">
  <div class="box">visible</div>
  <div class="box none">display: none</div>
  <div class="box hidden">visibility: hidden</div>
  <div class="box transparent">opacity: 0</div>
  <div class="box">after</div>
</div>

<style>
  body { font-family: system-ui; font-size: 12px; }
  .row { display: flex; gap: 6px; }
  .box { background: #bee3f8; padding: 10px; }
  .none { display: none; }
  .hidden { visibility: hidden; }
  .transparent { opacity: 0; }
</style>
```

| Method | Takes space | Clickable | Announced by screen readers |
|---|---|---|---|
| `display: none` | No | No | No |
| `visibility: hidden` | **Yes** | No | No |
| `opacity: 0` | Yes | **Yes** — invisible click target | **Yes** |
| `.sr-only` clip | ~No | Yes | **Yes** (intended) |

`opacity: 0` alone is a trap: keyboard users can tab into invisible controls. Pair it with `visibility: hidden` or `pointer-events: none` when hiding interactive content.

:::quiz
? An absolutely positioned badge ends up in the page corner instead of the card corner. Why?
- The badge needs a higher z-index
- No ancestor is positioned, so it resolved against the page *
- Absolute positioning doesn't work inside images
- The card needs `overflow: hidden`
> Add `position: relative` to the card.

? Your modal has `z-index: 9999` but still appears behind the header. Most likely cause?
- The number is too low
- The modal is inside an element that creates a stacking context ranked below the header *
- z-index doesn't work on modals
- The header uses position: fixed
> Children cannot escape a parent's stacking context. Move the modal up the tree, or fix the context.

? Which hiding method leaves an element clickable and announced to screen readers?
- display: none
- visibility: hidden
- opacity: 0 *
- All of them hide it completely
> Invisible but focusable elements are a real accessibility bug.

? Why do two `inline-block` elements have a small gap between them?
- A default margin
- The whitespace between the tags in the HTML renders as a space *
- Border collapsing
- A browser bug
> Flex and grid containers ignore that whitespace, which is one reason to prefer them.

? `position: sticky` isn't sticking. What is the most likely reason?
- It needs `position: relative` too
- No `top`/`bottom` offset is set, or an ancestor has `overflow: hidden` *
- Sticky requires JavaScript
- The element is a flex item
> Both are extremely common causes; `overflow: hidden` on an ancestor silently kills it.
:::

:::exercise Rebuild a card with a badge
Build a card containing an image, a title, and a circular badge pinned to the top-right corner using `position: relative` on the card and `absolute` on the badge. Then add a tooltip that appears on hover, positioned above the title — and make sure it doesn't get clipped by any ancestor with `overflow: hidden`.
:::
