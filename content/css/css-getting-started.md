CSS — Cascading Style Sheets — decides how your HTML looks. HTML without CSS is a Word document from 1994: functional, legible, and nobody's idea of a product.

# The shape of a rule

```text
selector {
  property: value;
  property: value;
}
```

```css
h1 {
  color: navy;
  font-size: 2rem;
  margin-bottom: 0.5em;
}
```

- The **selector** picks which elements to style.
- Each `property: value;` pair is a **declaration**.
- The braces contain the **declaration block**.
- Semicolons separate declarations. The last one's semicolon is optional but include it anyway — you'll add another line eventually.

Comments are `/* like this */`. There is no `//` line comment in CSS.

# Three ways to apply CSS

```html run title="Inline, internal and external"
<!-- 1. Inline: on the element. Avoid. -->
<p style="color: crimson;">Inline styling.</p>

<!-- 2. Internal: a style block in the document -->
<style>
  .internal { color: seagreen; font-weight: 600; }
</style>
<p class="internal">Internal stylesheet.</p>

<!-- 3. External: a separate file, linked in the head. The real answer. -->
<!-- <link rel="stylesheet" href="css/style.css"> -->
<p>External stylesheets are what you'll use in real projects.</p>
```

**Always prefer external stylesheets.** One file styles every page, the browser caches it, and your HTML stays about content. Inline styles are hard to override (very high specificity), impossible to reuse and unaffected by media queries — reserve them for values computed by JavaScript.

# Selectors: the first five

```html run title="Basic selectors"
<h2>A heading</h2>
<p class="lead">A paragraph with class "lead".</p>
<p id="special">A paragraph with id "special".</p>
<p>An ordinary paragraph with a <a href="#">link</a>.</p>

<style>
  p           { color: #333; }          /* element */
  .lead       { font-size: 1.3em; }     /* class    */
  #special    { color: crimson; }       /* id       */
  p a         { color: seagreen; }      /* descendant */
  h2, .lead   { font-family: Georgia, serif; }  /* group */
</style>
```

| Selector | Matches |
|---|---|
| `p` | every `<p>` |
| `.lead` | every element with `class="lead"` |
| `#special` | the one element with `id="special"` |
| `p a` | every `<a>` inside a `<p>` |
| `h2, .lead` | both, sharing one rule |

:::tip Class for styling, id for linking and scripting
Ids must be unique and are hard to override thanks to their specificity. Classes are reusable and predictable. Use classes for styling almost always; use ids for `#anchors` and `getElementById`.
:::

# Properties you'll use constantly

```html run title="The everyday properties"
<div class="card">
  <h3>A card</h3>
  <p>Edit any value and press Run to see what changes.</p>
</div>

<style>
  body { background: #f3f4f6; font-family: system-ui, sans-serif; }

  .card {
    /* box */
    padding: 20px;
    margin: 20px auto;
    max-width: 320px;
    border: 1px solid #d5d9e0;
    border-radius: 12px;

    /* colour */
    background-color: white;
    color: #1f2430;
    box-shadow: 0 2px 10px rgba(0,0,0,.08);
  }

  .card h3 {
    margin-top: 0;
    font-size: 1.2rem;
    letter-spacing: -0.01em;
  }

  .card p {
    line-height: 1.6;
    color: #5a6472;
  }
</style>
```

Roughly grouped, the properties that cover most of what you do:

- **Text**: `color`, `font-family`, `font-size`, `font-weight`, `line-height`, `text-align`, `text-decoration`, `letter-spacing`
- **Box**: `width`, `height`, `padding`, `margin`, `border`, `border-radius`
- **Background**: `background-color`, `background-image`, `background-size`
- **Layout**: `display`, `position`, `flex`, `grid`, `gap`
- **Effects**: `box-shadow`, `opacity`, `transform`, `transition`

# Shorthands

Many properties have a shorthand that sets several at once:

```css
/* Longhand */
margin-top: 10px;  margin-right: 20px;  margin-bottom: 10px;  margin-left: 20px;

/* Shorthand — clockwise from the top */
margin: 10px 20px 10px 20px;
margin: 10px 20px;      /* vertical | horizontal */
margin: 10px;           /* all four sides */

/* Others */
border: 1px solid #ccc;          /* width style colour */
font: bold 16px/1.5 system-ui;   /* weight size/line-height family */
background: #fff url(bg.png) no-repeat center / cover;
```

:::gotcha Shorthands reset what you don't mention
```css
.btn { background-color: red; background: url(x.png); }  /* red is gone */
```
The `background` shorthand resets *every* background property, including the colour you just set. Order matters, and mixing shorthand with longhand is a classic source of "why did my colour disappear?".
:::

# Inheritance

Some properties pass down to children automatically — mostly text-related ones:

```html run title="What inherits and what doesn't"
<div class="parent">
  This text is inherited.
  <p>So is this paragraph's, including the colour and font.</p>
  <div class="child">But borders are not inherited.</div>
</div>

<style>
  .parent {
    color: #7a3e9d;
    font-family: Georgia, serif;
    font-size: 18px;
    border: 3px solid #7a3e9d;   /* not inherited */
    padding: 12px;
  }
  .child { padding: 8px; }
</style>
```

Inherited: `color`, `font-*`, `line-height`, `text-align`, `visibility`, `cursor`, `list-style`.
Not inherited: `border`, `margin`, `padding`, `background`, `width`, `height`, `display`.

You can force either way with the keywords `inherit`, `initial`, `unset` and `revert`:

```css
button { font: inherit; }   /* buttons don't inherit font by default — this is a very common fix */
```

# A tiny, sensible reset

Browsers ship default styles that differ slightly. Most projects start with something like:

```css
*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  line-height: 1.6;
  color: #1f2430;
}

img, picture, video { max-width: 100%; display: block; }

input, button, textarea, select { font: inherit; }
```

Five rules, and they prevent a disproportionate share of beginner frustration. The `box-sizing` line especially — the next lesson but one explains exactly why.

:::quiz
? Which is the best way to include CSS in a real project?
- Inline `style` attributes
- A `<style>` block in each page
- An external stylesheet linked in the head *
- A JavaScript file that injects styles
> One cached file, reusable across pages, keeps HTML about content.

? What does `margin: 10px 20px;` mean?
- Top 10, right 20, bottom 10, left 20 *
- Top 10, right 20, others 0
- Left 10, right 20
- Horizontal 10, vertical 20
> Two values = vertical then horizontal. Four values run clockwise from the top.

? Why do buttons often not match your body font?
- Buttons cannot use custom fonts
- Form controls don't inherit font by default — set `font: inherit` *
- The browser caches its own font
- `font-family` only applies to text elements
> This is why almost every reset includes `input, button, textarea, select { font: inherit; }`.

? Which property is NOT inherited by child elements?
- color
- font-size
- border *
- line-height
> Box-related properties never inherit; text-related ones generally do.

? `background-color: red;` then `background: url(x.png);` — what is the result?
- Red with an image on top
- The image, with no red — the shorthand reset the colour *
- An error
- Red only
> Shorthands reset every sub-property they cover, including ones you set earlier.
:::

:::exercise Style a card from scratch
Write HTML for a product card (image, title, price, button) and style it with an external stylesheet: padding, a border radius, a subtle shadow, a readable font stack and a hover state on the button. Resist inline styles entirely.
:::
