CSS changed enormously between 2020 and now. If you learned it earlier — or from an older tutorial — a lot of the workarounds you were taught are obsolete. This lesson is the catch-up.

# Custom properties (CSS variables)

```html run title="Custom properties"
<div class="card">Default theme</div>
<div class="card danger">Overridden on this element only</div>

<style>
  :root {
    --brand: #4299e1;
    --radius: 10px;
    --space: 16px;
    --shadow: 0 2px 8px rgb(0 0 0 / .1);
  }

  .card {
    background: var(--brand);
    border-radius: var(--radius);
    padding: var(--space);
    box-shadow: var(--shadow);
    color: white;
    margin-bottom: 10px;
    font-family: system-ui;
  }

  .danger { --brand: #e53e3e; }   /* cascades to this element and its children */
</style>
```

These are not like Sass variables. They're **live values in the cascade**:

- They inherit and can be overridden per element or per media query.
- JavaScript can read and set them: `el.style.setProperty('--brand', 'tomato')`.
- They accept fallbacks: `var(--brand, #333)`.
- Changing one at runtime restyles everything that uses it — which is how theming works now.

```css
/* Theming in eight lines */
:root { --bg: white; --text: #1a202c; }
[data-theme="dark"] { --bg: #0d1117; --text: #e6edf3; }
body { background: var(--bg); color: var(--text); }
```

:::tip Register a custom property to animate it
```css
@property --angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}
```
Plain custom properties can't be transitioned because the browser doesn't know their type. `@property` tells it, and then gradients and angles animate properly.
:::

# Native nesting

```css
.card {
  padding: 16px;
  border-radius: 8px;

  & h3 {
    margin-top: 0;
  }

  &:hover {
    box-shadow: 0 4px 12px rgb(0 0 0 / .1);
  }

  .dark-mode & {
    background: #1a202c;
  }

  @media (min-width: 640px) {
    padding: 24px;
  }
}
```

Nesting is built into CSS now — no preprocessor needed. `&` is the parent selector. The same warning as always applies: **nest two levels at most**. Deep nesting generates absurd specificity and selectors nobody can override.

# Modern colour

```css
:root {
  --brand: oklch(62% 0.19 250);
  --brand-light: oklch(from var(--brand) calc(l + 0.15) c h);   /* relative colours */
  --tint: color-mix(in oklab, var(--brand) 20%, white);
}
```

- **`oklch()`** — perceptually uniform, so equal lightness values look equally light across hues. Wide-gamut capable.
- **`color-mix()`** — blend two colours in CSS. Perfect for hover states derived from a brand colour.
- **Relative colour syntax** — derive a colour from another by adjusting one channel. An entire palette from one value.

# Logical properties

```css
/* Physical — assumes left-to-right, top-to-bottom */
margin-left: 1rem;  padding-top: 2rem;  border-bottom: 1px solid;

/* Logical — follows the writing direction */
margin-inline-start: 1rem;  padding-block-start: 2rem;  border-block-end: 1px solid;

margin-inline: auto;        /* both horizontal sides — centring, shorter */
padding-block: 2rem;        /* both vertical sides */
inset: 0;                   /* top/right/bottom/left all at once */
```

In Arabic or Hebrew, `inline-start` becomes the right. Your layout mirrors correctly with no separate RTL stylesheet. Even in English-only projects, `margin-inline: auto` and `padding-block` are simply shorter to write.

# Layout and sizing additions

```css
.video  { aspect-ratio: 16 / 9; }            /* no more padding-top hacks */
.avatar { aspect-ratio: 1; object-fit: cover; }
.wrap   { width: min(70ch, 100% - 2rem); margin-inline: auto; }  /* the whole container pattern */
.grid   { grid-template-columns: subgrid; }  /* align nested grids to the parent */
.gallery { columns: 3; column-gap: 1rem; }   /* CSS multi-column, for masonry-ish text */
```

```html run title="aspect-ratio and object-fit"
<div class="row">
  <img class="cover" src="https://picsum.photos/id/1035/300/200" alt="">
  <img class="contain" src="https://picsum.photos/id/1035/300/200" alt="">
</div>
<p style="font-family:system-ui;font-size:13px">Both are forced square. Left: <code>object-fit: cover</code> (crops). Right: <code>contain</code> (letterboxes).</p>

<style>
  .row { display: flex; gap: 12px; }
  .row img { width: 130px; aspect-ratio: 1; border-radius: 8px; background: #edf2f7; }
  .cover { object-fit: cover; }
  .contain { object-fit: contain; }
</style>
```

# :has(), the parent selector

```css
.card:has(img)            { padding-top: 0; }
.field:has(input:invalid) { border-color: crimson; }
label:has(:checked)       { font-weight: 700; }
body:has(dialog[open])    { overflow: hidden; }
form:has(#terms:checked) button[type="submit"] { opacity: 1; pointer-events: auto; }
```

A great deal of small JavaScript — toggling classes on parents based on child state — is now a CSS selector.

# Dark mode, properly

```html run title="A complete dark mode setup"
<div class="app">
  <h3>Respects your OS setting</h3>
  <p>Switch your system theme and this reflects it.</p>
</div>

<style>
  :root {
    color-scheme: light dark;
    --bg: #ffffff; --surface: #f7f9fc; --text: #14181f; --muted: #56616f;
  }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #0d1117; --surface: #161b22; --text: #e6edf3; --muted: #9aa7b6; }
  }
  .app {
    background: var(--surface); color: var(--text);
    padding: 16px; border-radius: 10px; font-family: system-ui;
  }
  .app p { color: var(--muted); margin-bottom: 0; }
</style>
```

`color-scheme: light dark` is the line people miss: it tells the browser to render **native UI** — form controls, scrollbars, the default background — in the matching theme. Without it you get white scrollbars on a dark page.

A complete implementation offers all three states (light / dark / follow the system), stores the choice, and applies it before first paint to avoid a flash:

```html
<script>
  // In the <head>, before any CSS renders
  const saved = localStorage.getItem('theme');
  if (saved) document.documentElement.dataset.theme = saved;
</script>
```

# Other recent additions worth knowing

```css
.headline { text-wrap: balance; }      /* even line lengths in headings */
p         { text-wrap: pretty; }        /* avoids orphan words */
.sticky   { position: sticky; top: 0; }
.scroll   { scroll-snap-type: x mandatory; }
.item     { scroll-snap-align: start; }
html      { scroll-behavior: smooth; scroll-padding-top: 4rem; }
.modal    { /* <dialog> gives you a real top layer — no z-index wars */ }
@supports (backdrop-filter: blur(4px)) { .glass { backdrop-filter: blur(8px); } }
```

`@supports` is the right way to use anything cutting-edge: write the fallback first, then enhance inside the query.

:::note What you can now stop doing
- Floats for layout → Grid and Flexbox
- Clearfix hacks → `display: flow-root`, or just use flex/grid
- `padding-top: 56.25%` for aspect ratios → `aspect-ratio`
- JS for "does this contain X?" class toggling → `:has()`
- Vendor prefixes on everything → only a handful still need them; check caniuse
- Sass purely for variables and nesting → both are native now
:::

:::quiz
? How do CSS custom properties differ from Sass variables?
- They are faster
- They live in the cascade: they inherit, can be overridden per element, and change at runtime *
- They support more data types
- They must be declared in :root
> That runtime behaviour is what makes theming and JS-driven styling possible.

? What does `color-scheme: light dark` do?
- Sets the page background
- Tells the browser to render native controls and scrollbars in the matching theme *
- Enables prefers-color-scheme
- Defines two custom properties
> Without it, form controls and scrollbars stay light on a dark page.

? What replaced the `padding-top: 56.25%` hack?
- object-fit
- aspect-ratio *
- clamp()
- container queries
> `aspect-ratio: 16 / 9` does it directly.

? Which lets you style an element based on what it contains?
- :is()
- :where()
- :has() *
- :not()
> The long-requested parent selector, now supported everywhere.

? What is the benefit of `margin-inline: auto` over `margin: 0 auto`?
- It is faster
- It follows the writing direction and adapts to RTL languages automatically *
- It works on inline elements
- It includes padding
> Logical properties mirror correctly without a separate RTL stylesheet.

? How deep should you nest native CSS?
- As deep as the HTML
- Two levels at most *
- Never nest
- Five levels
> Deep nesting produces high specificity and selectors nobody can override.
:::

:::exercise Modernise a stylesheet
Take an older stylesheet and: pull the repeated colours and spacing into custom properties on `:root`; add a dark-mode block with `color-scheme`; replace any aspect-ratio hack with `aspect-ratio`; find one JavaScript class toggle you can replace with `:has()`; and swap `margin: 0 auto` for `margin-inline: auto`. Compare the line count before and after.
:::
