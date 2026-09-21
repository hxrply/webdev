Motion done well makes an interface feel responsive and explains what just happened. Done badly it makes people wait. The difference is mostly restraint and a sense of what the browser can animate cheaply.

# Transitions

A transition animates a property *between two states* — usually a base state and `:hover`, `:focus` or a toggled class.

```html run title="Transition basics"
<button class="none">No transition</button>
<button class="fade">150ms ease</button>
<button class="slow">600ms — too slow for a button</button>

<style>
  body { font-family: system-ui; display: grid; gap: 10px; max-width: 240px; }
  button {
    padding: 12px; font: inherit; border: none; border-radius: 8px;
    background: #4299e1; color: white; cursor: pointer;
  }
  button:hover { background: #2b6cb0; transform: translateY(-2px); }

  .fade { transition: background 150ms ease, transform 150ms ease; }
  .slow { transition: background 600ms ease, transform 600ms ease; }
</style>
```

```css
transition: <property> <duration> <timing-function> <delay>;
transition: opacity 200ms ease-out 50ms;
transition: background 150ms ease, transform 150ms ease;   /* several, comma-separated */
transition: all 200ms ease;                                 /* convenient, slightly wasteful */
```

**Durations that feel right:**

| Interaction | Duration |
|---|---|
| Hover, focus, small state change | 100–200ms |
| Dropdown, tooltip, small panel | 200–300ms |
| Modal, page-level transition | 300–400ms |
| Anything longer | Usually a mistake |

Anything under ~100ms reads as instant; anything over ~400ms feels sluggish, because the user is waiting for your animation to finish before they can act.

**Timing functions:** `ease-out` for things entering (fast then settling — feels natural), `ease-in` for things leaving, `ease-in-out` for movement between two on-screen positions, `linear` only for continuous things like spinners. `cubic-bezier()` for custom curves.

:::gotcha You can't transition to or from `auto`
`height: 0` → `height: auto` does not animate — the browser has no number to interpolate towards. Options:

- `max-height` with a generous value (crude; the timing is off).
- `transform: scaleY()` (smooth, but distorts content).
- `grid-template-rows: 0fr` → `1fr` — a genuinely good trick.
- `interpolate-size: allow-keywords` plus `calc-size()` in newer browsers, which finally fixes it properly.
:::

```html run title="Animating to auto height with grid"
<button onclick="document.querySelector('.panel').classList.toggle('open')">Toggle</button>
<div class="panel">
  <div class="inner">
    <p>This content's height is unknown, yet it animates smoothly — the grid row
    goes from <code>0fr</code> to <code>1fr</code>, and those are both numbers.</p>
  </div>
</div>

<style>
  body { font-family: system-ui; font-size: 14px; }
  button { padding: 8px 14px; font: inherit; margin-bottom: 8px; cursor: pointer; }
  .panel {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 300ms ease;
    background: #edf2f7; border-radius: 6px;
  }
  .panel.open { grid-template-rows: 1fr; }
  .inner { overflow: hidden; }
  .inner p { margin: 0; padding: 0 12px; }
  .panel.open .inner p { padding: 12px; }
</style>
```

# Transforms

Transforms move, rotate, scale and skew without affecting layout — nothing else on the page shifts.

```html run title="The transform functions"
<div class="row">
  <div class="box t1">translate</div>
  <div class="box t2">rotate</div>
  <div class="box t3">scale</div>
  <div class="box t4">skew</div>
</div>
<p style="font-family:system-ui;font-size:13px">Hover each box.</p>

<style>
  body { font-family: system-ui; font-size: 12px; }
  .row { display: flex; gap: 10px; padding: 20px 0; }
  .box {
    width: 70px; height: 70px; display: grid; place-items: center;
    background: #805ad5; color: white; border-radius: 8px;
    transition: transform 250ms ease;
  }
  .t1:hover { transform: translate(8px, -8px); }
  .t2:hover { transform: rotate(12deg); }
  .t3:hover { transform: scale(1.15); }
  .t4:hover { transform: skewX(-10deg); }
</style>
```

```css
transform: translate(10px, 20px) rotate(45deg) scale(1.2);  /* combine — order matters */
transform-origin: top left;                                  /* default is center */
```

:::tip Why transform beats top/left
Animating `top`, `left`, `width` or `margin` forces the browser to recalculate layout **for every frame**. Animating `transform` and `opacity` doesn't — they're handled by the compositor, often on the GPU.

**Animate `transform` and `opacity` wherever you can.** That's the single most effective performance rule for web animation.
:::

# Keyframe animations

Transitions need a state change. Animations run on their own.

```html run title="@keyframes"
<div class="spinner"></div>
<div class="pulse">Pulsing</div>
<div class="slide">Slides in on load</div>

<style>
  body { font-family: system-ui; font-size: 13px; display: grid; gap: 16px; justify-items: start; }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%      { opacity: .35; }
  }
  @keyframes slide-in {
    from { opacity: 0; transform: translateX(-20px); }
    to   { opacity: 1; transform: none; }
  }

  .spinner {
    width: 28px; height: 28px; border-radius: 50%;
    border: 3px solid #e2e8f0; border-top-color: #4299e1;
    animation: spin 700ms linear infinite;
  }
  .pulse { animation: pulse 1.4s ease-in-out infinite; }
  .slide { animation: slide-in 400ms ease-out both; }
</style>
```

```css
animation: <name> <duration> <timing> <delay> <iteration-count> <direction> <fill-mode>;
animation: slide-in 400ms ease-out 100ms 1 normal both;
```

`fill-mode: both` is the one people forget: it makes the element hold the `from` state before the animation starts and the `to` state after it ends. Without it, elements flash into their default state at either end.

# Respect reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

:::warn This is not optional
Vestibular disorders make large motion — parallax, sliding panels, zooming — genuinely nauseating, not merely annoying. Users set this preference at OS level; honouring it takes five lines.

The nuanced version: keep small opacity fades (which rarely cause problems) and disable movement.
:::

# Practical patterns

```html run title="Useful, restrained motion"
<button class="btn">Button with feedback</button>
<div class="card">Card that lifts</div>
<div class="tooltip-wrap">Hover for tooltip<span class="tooltip">A tooltip</span></div>
<div class="skeleton"></div>

<style>
  body { font-family: system-ui; font-size: 14px; display: grid; gap: 18px; justify-items: start; }

  .btn {
    padding: 10px 18px; font: inherit; border: none; border-radius: 8px;
    background: #4299e1; color: white; cursor: pointer;
    transition: background 150ms ease, transform 80ms ease;
  }
  .btn:hover  { background: #2b6cb0; }
  .btn:active { transform: scale(.97); }

  .card {
    padding: 16px 20px; border: 1px solid #e2e8f0; border-radius: 10px;
    transition: transform 200ms ease, box-shadow 200ms ease;
  }
  @media (hover: hover) {
    .card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,.09); }
  }

  .tooltip-wrap { position: relative; }
  .tooltip {
    position: absolute; bottom: 130%; left: 0;
    background: #2d3748; color: white; padding: 5px 9px; border-radius: 5px;
    font-size: 12px; white-space: nowrap;
    opacity: 0; visibility: hidden; transform: translateY(4px);
    transition: opacity 160ms ease, transform 160ms ease, visibility 160ms;
  }
  .tooltip-wrap:hover .tooltip { opacity: 1; visibility: visible; transform: none; }

  .skeleton {
    width: 220px; height: 16px; border-radius: 4px;
    background: linear-gradient(90deg, #edf2f7 25%, #e2e8f0 37%, #edf2f7 63%);
    background-size: 400% 100%;
    animation: shimmer 1.4s ease-in-out infinite;
  }
  @keyframes shimmer { 0% { background-position: 100% 0; } 100% { background-position: 0 0; } }
</style>
```

Note the tooltip transitions `visibility` alongside `opacity` — that keeps it out of the accessibility tree and un-clickable when hidden, which `opacity: 0` alone would not.

# A short list of don'ts

- Don't animate `width`, `height`, `top`, `left`, `margin` when `transform` will do.
- Don't animate on page load unless it communicates something.
- Don't exceed ~400ms for anything the user is waiting on.
- Don't animate `box-shadow` on many elements at once — it's expensive. Animate a pseudo-element's `opacity` instead.
- Don't use motion as the *only* signal that something changed.

:::quiz
? Which properties are cheapest to animate?
- width and height
- top and left
- transform and opacity *
- margin and padding
> They skip layout and paint, and can be composited on the GPU.

? A dropdown won't animate from `height: 0` to `height: auto`. Why?
- Transitions don't work on height
- `auto` isn't a number the browser can interpolate towards *
- The element needs `position: relative`
- You need `!important`
> Use `grid-template-rows: 0fr → 1fr`, a transform, or the newer `interpolate-size`.

? What is a good duration for a button hover effect?
- 50ms
- 150ms *
- 500ms
- 1s
> Under 100ms reads as instant; over 400ms makes the interface feel sluggish.

? Why transition `visibility` alongside `opacity` when hiding a tooltip?
- It looks smoother
- `opacity: 0` alone leaves it clickable and announced to screen readers *
- visibility animates the colour
- It is required by the spec
> Invisible but focusable elements are a genuine accessibility bug.

? What does `prefers-reduced-motion` indicate?
- The device is low-powered
- The user has asked their OS to minimise animation, often for medical reasons *
- The browser is in battery-saver mode
- Animations are unsupported
> Honour it. Large motion can cause real nausea for people with vestibular disorders.

? What does `animation-fill-mode: both` do?
- Runs the animation twice
- Applies the from-state before it starts and holds the to-state after it ends *
- Fills the element with colour
- Makes it loop
> Without it, elements snap back to their default styling when the animation finishes.
:::

:::exercise Add motion to a card
Take a card component and add: a 150ms hover lift (transform + shadow, gated behind `hover: hover`), a 100ms active press, a focus-visible ring that fades in, and a skeleton-loading shimmer. Then add the `prefers-reduced-motion` block and verify in DevTools (Rendering panel → Emulate CSS prefers-reduced-motion) that everything still works without movement.
:::
