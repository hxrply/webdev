Choosing the right unit is the difference between a layout that adapts and one that shatters at the first zoom or long word.

# Absolute vs relative

| Unit | Relative to | Use for |
|---|---|---|
| `px` | Nothing (device pixels, roughly) | Borders, small fixed details, shadows |
| `%` | The parent's corresponding size | Widths, fluid layouts |
| `em` | The **element's own** font size (or the parent's, for `font-size` itself) | Spacing that should scale with local text |
| `rem` | The **root** font size (default 16px) | Font sizes, spacing, almost everything |
| `vw` / `vh` | 1% of viewport width/height | Full-screen sections, fluid type |
| `dvh` / `svh` / `lvh` | Dynamic/small/large viewport height | Mobile full-height without the address-bar jump |
| `ch` | Width of the `0` character | Line lengths (`max-width: 65ch`) |
| `fr` | A fraction of free space (grid only) | Grid tracks |

```html run title="em compounds, rem doesn't"
<div class="em-parent">
  1.5em of the parent
  <div class="em-parent">nested — 1.5em again, so it compounds
    <div class="em-parent">and again…</div>
  </div>
</div>

<div class="rem-parent">
  1.5rem
  <div class="rem-parent">nested — still 1.5rem
    <div class="rem-parent">stable, always</div>
  </div>
</div>

<style>
  body { font-family: system-ui; font-size: 16px; }
  .em-parent  { font-size: 1.5em;  padding-left: 10px; border-left: 2px solid crimson; }
  .rem-parent { font-size: 1.5rem; padding-left: 10px; border-left: 2px solid seagreen; }
</style>
```

That compounding is `em`'s defining feature: useful for component-internal spacing (padding that grows with the button's own text size), a menace for font sizes in nested structures.

:::tip The practical rule
**`rem` for font sizes and layout spacing. `em` for padding/margins inside a component that should scale with its text. `px` for hairlines and shadows. `%` and `fr` for fluid widths. `ch` for text measure.**

And: users who set a larger default font size in their browser get larger text with `rem` and are ignored by `px`. That alone is a good reason to prefer `rem` for type.
:::

# Viewport units

```css
.hero { min-height: 100vh; }    /* full screen… but see below */
.hero { min-height: 100dvh; }   /* accounts for mobile browser chrome */
```

:::gotcha `100vh` on mobile
On phones, `100vh` traditionally meant the viewport *with the address bar hidden*, so content got cut off, and the page visibly jumped as the bar slid away while scrolling. `dvh` (dynamic), `svh` (small) and `lvh` (large) fix this. `100dvh` is usually what you meant.
:::

# calc(), min(), max(), clamp()

```html run title="Functional values"
<div class="a">calc(100% - 40px)</div>
<div class="b">min(600px, 100%) — never overflows</div>
<div class="c">clamp(1rem, 4vw, 2rem) font size — resize the preview</div>

<style>
  body { font-family: system-ui; }
  div { background: #bee3f8; padding: 10px; margin-bottom: 10px; }
  .a { width: calc(100% - 40px); }
  .b { width: min(600px, 100%); }
  .c { font-size: clamp(1rem, 4vw, 2rem); }
</style>
```

- `calc()` mixes units: `calc(100% - 2rem)`. **Spaces around `+` and `-` are mandatory.**
- `min(a, b)` picks the smaller — an effective max-width.
- `max(a, b)` picks the larger — an effective min-width.
- `clamp(min, preferred, max)` — the fluid-design workhorse: `font-size: clamp(1.5rem, 5vw, 3rem)` scales with the viewport but never gets silly at either extreme.

# Colour notation

```html run title="Every way to say red"
<div style="background: red">named</div>
<div style="background: #ff0000">#ff0000 (hex)</div>
<div style="background: #f00">#f00 (short hex)</div>
<div style="background: #ff000080">#ff000080 (hex + alpha)</div>
<div style="background: rgb(255 0 0)">rgb(255 0 0)</div>
<div style="background: rgb(255 0 0 / 50%)">rgb with alpha</div>
<div style="background: hsl(0 100% 50%)">hsl(0 100% 50%)</div>
<div style="background: oklch(62.8% 0.258 29.2)">oklch — perceptually uniform</div>

<style>
  body { font-family: system-ui; }
  div { padding: 8px; margin-bottom: 4px; color: white; font-size: 14px; }
</style>
```

## Why HSL is easier to think in

`hsl(hue saturation lightness)`:

- **Hue** 0–360 around the colour wheel (0 red, 120 green, 240 blue).
- **Saturation** 0% grey → 100% vivid.
- **Lightness** 0% black → 50% pure → 100% white.

Building a palette becomes arithmetic:

```css
:root {
  --brand:       hsl(210 90% 45%);
  --brand-light: hsl(210 90% 65%);   /* same hue, lighter */
  --brand-dark:  hsl(210 90% 30%);
  --brand-muted: hsl(210 30% 45%);   /* same hue, less saturated */
}
```

Try doing that with hex codes in your head.

## OKLCH, briefly

`oklch()` is perceptually uniform: equal lightness numbers *look* equally light across hues, which HSL does not manage (HSL yellow at 50% lightness looks far brighter than HSL blue at 50%). It also reaches colours outside sRGB on modern displays. Well supported now, and worth adopting for new design systems.

## Transparency and colour-mix

```css
.overlay  { background: rgb(0 0 0 / 60%); }
.tinted   { background: color-mix(in oklab, var(--brand) 20%, white); }
.current  { border-color: currentColor; }   /* matches the element's text colour */
```

`currentColor` is quietly excellent: set `color` once, and borders, SVG strokes and shadows follow it automatically.

# Sizing text for readability

```html run title="Line length and rhythm"
<article class="narrow">
  <p>This column is limited to about 65 characters. Research on legibility consistently
  lands in the 45–75 character range; beyond that the eye struggles to find the start
  of the next line.</p>
</article>
<article class="wide">
  <p>This one has no measure limit, so on a wide screen the lines run on and on and on, which is
  noticeably more tiring to read even though the font size is identical to the example above it.</p>
</article>

<style>
  body { font-family: Georgia, serif; font-size: 16px; }
  article { background: #f7f8fa; padding: 12px; margin-bottom: 12px; }
  .narrow p { max-width: 65ch; line-height: 1.6; }
  .wide p   { line-height: 1.6; }
</style>
```

:::quiz
? Which unit should you generally use for font sizes?
- px, for precision
- rem, so text scales with the user's browser setting *
- em, so it compounds
- pt, as in print
> `px` font sizes ignore a user's larger default text size; `rem` respects it.

? `font-size: 1.5em` on nested elements causes text to grow at each level. Why?
- em is a bug
- `em` is relative to the element's inherited font size, so it compounds *
- The browser caches font sizes
- em only works on the body
> Use `rem` when you want a stable reference; `em` when you want local scaling.

? What does `clamp(1rem, 4vw, 2rem)` do?
- Always 4vw
- Scales with viewport width but never below 1rem or above 2rem *
- Picks the smallest of the three
- Only applies at 4vw wide
> It is the standard pattern for fluid typography without media queries.

? Why prefer `hsl()` over hex for a design system?
- It renders faster
- Lightness and saturation can be adjusted arithmetically to build a palette *
- Hex is deprecated
- It supports more colours
> Same hue, different lightness gives coherent tints and shades with no guesswork.

? What problem does `100dvh` solve that `100vh` does not?
- It works in older browsers
- It accounts for mobile browser chrome appearing and disappearing *
- It includes scrollbars
- It is relative to the parent
> `100vh` overflows on mobile because it assumes the address bar is hidden.

? What does `max-width: 65ch` control?
- The number of words per paragraph
- The line length, in units of the `0` character's width *
- The character encoding
- The font size
> 45–75 characters is the comfortable reading range.
:::

:::exercise Convert a fixed layout
Take a component styled entirely in `px` and convert it: font sizes to `rem`, internal padding to `em`, container width to `min(72rem, 100%)`, a heading to `clamp()`. Then set your browser's default font size to 20px (Settings → Appearance) and reload. The `rem` version should grow; a `px` version wouldn't have.
:::
