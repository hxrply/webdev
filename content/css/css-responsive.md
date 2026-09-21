Responsive design means one codebase that works on a 320px phone and a 2560px monitor. It is not a feature you add at the end; it is a default you design from.

# Start with the viewport tag

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

Without it, nothing else in this lesson works. Mobile browsers will render your page at ~980px and shrink it.

# Mobile first

Write the small-screen styles as your base, then *add* complexity for larger screens with `min-width` queries:

```css
/* Base: mobile. No media query. */
.cards { display: grid; gap: 16px; }

/* Tablet and up */
@media (min-width: 600px) {
  .cards { grid-template-columns: repeat(2, 1fr); }
}

/* Desktop and up */
@media (min-width: 960px) {
  .cards { grid-template-columns: repeat(3, 1fr); }
}
```

Why this direction:

- Mobile styles are simpler, so your base CSS is simpler.
- You add rather than undo, which keeps specificity flat.
- Phones — often the weakest devices — parse the least CSS.
- It forces you to decide what actually matters, because you have 375px to say it in.

:::tip Choose breakpoints from your content
Don't memorise device widths — the "iPhone" width changes every year and tablets sit everywhere in between. Instead, widen your browser slowly and add a breakpoint wherever the layout *starts to look wrong*. Your design tells you where the breakpoints are.
:::

# Media query syntax

```css
@media (min-width: 768px) { }                          /* ≥ 768px */
@media (max-width: 767.98px) { }                       /* < 768px */
@media (min-width: 768px) and (max-width: 1023px) { }  /* a band */
@media (orientation: landscape) { }
@media (prefers-color-scheme: dark) { }
@media (prefers-reduced-motion: reduce) { }
@media (hover: hover) and (pointer: fine) { }          /* mouse, not touch */
@media print { }
```

Modern range syntax reads better and avoids the `.98` fudge:

```css
@media (width >= 768px) { }
@media (400px <= width <= 900px) { }
```

:::gotcha Overlapping min- and max-width
```css
@media (max-width: 768px) { .x { color: red } }
@media (min-width: 768px) { .x { color: blue } }
```
At *exactly* 768px, both match and the later one wins — usually harmless, occasionally baffling. Either use the range syntax, or pick `max-width: 767.98px`.
:::

# `hover: hover` — the one most people miss

```css
/* Only apply hover effects on devices that actually hover */
@media (hover: hover) {
  .card:hover { transform: translateY(-4px); }
}
```

On touchscreens, `:hover` styles get "stuck" after a tap until you touch elsewhere. Gating them behind `hover: hover` fixes a class of bug that is otherwise very hard to reproduce on a desktop.

# Responsive without media queries

The best responsive CSS often has no breakpoints at all.

```html run title="Intrinsically responsive patterns — resize the preview"
<div class="grid">
  <div>auto-fit grid</div><div>no media</div><div>queries</div><div>at all</div>
</div>

<div class="sidebar-layout">
  <div class="side">Sidebar (min 180px)</div>
  <div class="main">Main content. Below a threshold, these wrap onto separate lines by themselves.</div>
</div>

<p class="fluid">Fluid type with clamp()</p>

<style>
  body { font-family: system-ui; font-size: 14px; }
  .grid {
    display: grid; gap: 10px; margin-bottom: 16px;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }
  .grid > div { background: #bee3f8; padding: 14px; border-radius: 6px; text-align: center; }

  .sidebar-layout { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
  .side { flex: 1 1 180px; background: #c6f6d5; padding: 12px; border-radius: 6px; }
  .main { flex: 3 1 260px; background: #fefcbf; padding: 12px; border-radius: 6px; }

  .fluid { font-size: clamp(1rem, 4vw, 2rem); font-weight: 700; margin: 0; }
</style>
```

The toolkit:

- `repeat(auto-fit, minmax(Xpx, 1fr))` — self-arranging grids.
- `flex-wrap: wrap` with a `flex-basis` — items wrap when they'd get too narrow.
- `clamp()` — fluid type and spacing.
- `min()` / `max()` — `width: min(65ch, 100%)` never overflows.
- `max-width` instead of `width`, everywhere.

# Container queries

Media queries ask about the *viewport*. But a card doesn't care how wide the window is — it cares how much room *it* has. A card in a sidebar and the same card in a main column should look different, and media queries can't express that.

```html run title="Container queries — the component decides"
<div class="wide"><div class="card"><h4>Wide container</h4><p>Side-by-side layout.</p></div></div>
<div class="narrow"><div class="card"><h4>Narrow container</h4><p>Stacked layout — same component, same CSS.</p></div></div>

<style>
  body { font-family: system-ui; font-size: 14px; }
  .wide, .narrow { container-type: inline-size; border: 2px dashed #cbd5e0; padding: 8px; margin-bottom: 12px; }
  .wide { width: 100%; }
  .narrow { width: 210px; }

  .card { background: #e9d8fd; padding: 10px; border-radius: 6px; }
  .card h4 { margin: 0 0 4px; }
  .card p { margin: 0; }

  @container (min-width: 320px) {
    .card { display: flex; gap: 12px; align-items: baseline; }
    .card h4 { flex: none; }
  }
</style>
```

Both cards use identical CSS. The one in a narrow container stacks; the one with room goes horizontal. This is what makes genuinely reusable components possible, and it's supported everywhere now.

# Responsive images, media and tables

```html
<img src="photo-800.jpg"
     srcset="photo-400.jpg 400w, photo-800.jpg 800w, photo-1600.jpg 1600w"
     sizes="(max-width: 600px) 100vw, 50vw"
     alt="…" loading="lazy">
```

```css
img, video { max-width: 100%; height: auto; }     /* never overflow */
.table-wrap { overflow-x: auto; }                  /* tables scroll rather than squash */
iframe { aspect-ratio: 16 / 9; width: 100%; height: auto; }
```

`aspect-ratio` deserves a mention of its own — it replaces the old padding-top percentage hack entirely.

# Testing properly

- **Resize the actual browser window.** Drag it narrow and watch where things break.
- **DevTools device mode** for quick checks of specific widths.
- **Test at 320px.** That's the practical floor, and it exposes overflow immediately.
- **Zoom to 200%.** A WCAG requirement, and it catches assumptions that `px` widths hide.
- **Use a real phone** at least once per project. Touch targets, sticky headers and viewport height behave differently than any simulator suggests.

:::warn Touch targets
Make anything tappable at least **44×44px** (Apple) or **48×48px** (Google, WCAG 2.5.8 asks for 24×24 minimum). A 16px-tall text link in a nav is fine with a mouse and infuriating with a thumb. Padding, not font size, is usually the fix.
:::

:::quiz
? Why write mobile-first CSS?
- Mobile browsers don't support media queries
- Base styles stay simple, you add rather than undo, and phones parse less CSS *
- It is required by HTML5
- max-width queries are deprecated
> Desktop-first means overriding complex layouts back to simple ones — more code, more specificity.

? Where should breakpoints come from?
- A standard list of device widths
- Wherever your own layout starts to look wrong *
- Always 768px and 1024px
- The framework you use
> Device widths change constantly; your content's breaking points don't.

? What problem do container queries solve that media queries cannot?
- Dark mode
- Styling a component by the space *it* occupies rather than the viewport width *
- Printing
- Reduced motion
> This is what makes a component genuinely portable between a sidebar and a main column.

? Why gate hover effects behind `@media (hover: hover)`?
- Performance
- On touch devices `:hover` styles stick after a tap *
- Hover doesn't work on mobile at all
- It reduces CSS size
> The stuck-hover bug is easy to ship and hard to notice on a desktop.

? Which is the most robust way to make a card grid responsive?
- Percentage widths with floats
- `repeat(auto-fit, minmax(200px, 1fr))` *
- Three media queries
- JavaScript resize listeners
> It adapts continuously instead of jumping at fixed widths.

? What is the minimum comfortable touch target size?
- 20×20px
- 30×30px
- 44×44px *
- 60×60px
> Add padding around small links rather than enlarging the text.
:::

:::exercise Make a page genuinely responsive
Take a fixed-width layout and convert it: add the viewport tag, replace `width` with `max-width`, convert the main columns to `repeat(auto-fit, minmax(…, 1fr))`, add `clamp()` to the headings, and cap the text at `65ch`. Then check it at 320px, 768px and 1440px, and at 200% zoom. Aim for zero media queries — you'll often get close.
:::
