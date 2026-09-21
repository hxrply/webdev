CSS has no built-in scoping — every rule is global, and they all fight. On a small site that's fine. On a real project it's the difference between a stylesheet you can change confidently and one everybody is afraid of.

# Why CSS goes bad

The failure mode is always the same:

1. Someone writes `.header .nav ul li a { color: blue }` because it's the quickest way to reach that link.
2. Someone else needs a different colour and can't override it, so writes something more specific.
3. Repeat for eighteen months.
4. Now nobody can delete anything, because nobody knows what any rule affects.

Everything below is a defence against that.

# Name things by what they are

**BEM** (Block, Element, Modifier) is the most widely used convention:

```css
.card              { }   /* Block: a standalone component */
.card__title       { }   /* Element: a part of the block */
.card__image       { }
.card--featured    { }   /* Modifier: a variant */
.card__title--long { }
```

```html
<article class="card card--featured">
  <img class="card__image" src="…" alt="">
  <h3 class="card__title">Title</h3>
</article>
```

It looks verbose, and that's the point: every selector is a single class (specificity 0-1-0, always), every class says exactly what it styles, and searching for `card__title` finds every usage instantly.

You don't have to use BEM specifically. You *do* need *a* convention that the whole team follows.

# Keep specificity flat

```css
/* Fragile: tied to structure, hard to override */
.sidebar .widget ul li a:hover { color: red; }     /* 0-4-2 */

/* Robust: one class, trivially overridable */
.widget-link:hover { color: red; }                  /* 0-1-1 */
```

Guidelines:

- **One class per selector** where you can manage it.
- **Never style by id.**
- **Avoid element selectors in components** — `.card h3` breaks the moment someone uses an `h2`.
- **No `!important`**, except to override third-party CSS you don't control.
- Use `:where()` for defaults meant to be overridden: `:where(.prose) p { margin-block: 1em; }`.

# Cascade layers

`@layer` gives you explicit, readable priority, and layer order beats specificity entirely:

```css
@layer reset, base, layout, components, utilities;

@layer reset     { /* normalise */ }
@layer base      { /* element defaults: body, headings, links */ }
@layer layout    { /* page structure: .container, .grid */ }
@layer components{ /* .card, .btn, .nav */ }
@layer utilities { /* .mt-0, .sr-only — must win */ }
```

Now a utility class with specificity 0-1-0 beats a component rule with 0-3-1, because layers outrank specificity. That is precisely the behaviour you always wanted and previously faked with `!important`.

# File organisation

```text
css/
├── main.css            ← imports everything, declares the layer order
├── base/
│   ├── reset.css
│   ├── tokens.css      ← custom properties: colour, spacing, type scale
│   └── typography.css
├── layout/
│   ├── container.css
│   └── grid.css
├── components/
│   ├── button.css
│   ├── card.css
│   └── nav.css
└── utilities.css
```

```css
/* main.css */
@layer reset, base, layout, components, utilities;

@import url("base/reset.css")      layer(reset);
@import url("base/tokens.css")     layer(base);
@import url("components/card.css") layer(components);
```

:::note @import and performance
`@import` in CSS is serial — the browser must fetch the parent file before it discovers the children. Fine in development; in production, bundle them into one file with a build tool, or use `<link>` tags which download in parallel.
:::

# Design tokens

Put every repeated value in one place and never type a raw hex code in a component again:

```css
/* tokens.css */
:root {
  /* colour */
  --colour-brand: oklch(62% .19 250);
  --colour-text: #14181f;
  --colour-muted: #56616f;
  --colour-surface: #f7f9fc;
  --colour-border: #d8e0ea;

  /* spacing — a consistent scale, not arbitrary numbers */
  --space-1: 0.25rem;  --space-2: 0.5rem;   --space-3: 0.75rem;
  --space-4: 1rem;     --space-6: 1.5rem;   --space-8: 2rem;

  /* type */
  --font-sans: system-ui, sans-serif;
  --text-sm: 0.875rem; --text-base: 1rem; --text-lg: 1.25rem; --text-xl: 1.75rem;

  /* other */
  --radius: 8px;
  --shadow-sm: 0 1px 3px rgb(0 0 0 / .08);
  --transition: 150ms ease;
}
```

The benefit isn't saving keystrokes — it's that "make the spacing slightly tighter everywhere" becomes a one-line change instead of a hunt through forty files.

# The main approaches

| Approach | How it works | Good for | Trade-off |
|---|---|---|---|
| **BEM + plain CSS** | Naming convention, flat specificity | Any project; no tooling needed | Verbose; discipline required |
| **Utility-first** (Tailwind) | Compose from tiny classes in the HTML | Fast iteration, consistent by construction | Cluttered markup; build step; a learning curve |
| **CSS Modules** | Build tool scopes class names per file | Component-based apps | Needs bundler |
| **CSS-in-JS** | Styles written in JavaScript | Dynamic, prop-driven styling | Runtime cost; less common now |
| **Scoped styles** | Framework-level (Vue/Svelte `<style scoped>`) | Single-file components | Framework-specific |

There is no correct answer. A well-organised BEM stylesheet and a well-organised Tailwind project are both perfectly maintainable; a badly organised anything is not.

# A reset worth using

```css
@layer reset {
  *, *::before, *::after { box-sizing: border-box; }

  * { margin: 0; }

  body {
    min-height: 100dvh;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  img, picture, video, canvas, svg {
    display: block;
    max-width: 100%;
  }

  input, button, textarea, select { font: inherit; }

  h1, h2, h3, h4, p { overflow-wrap: break-word; }

  h1, h2, h3, h4 { text-wrap: balance; line-height: 1.2; }

  :target { scroll-margin-block: 4rem; }
}
```

Twenty lines that prevent a disproportionate share of everyday annoyances. Full resets like normalize.css are mostly unnecessary now — browsers agree with each other far more than they used to.

# Practical habits

- **Delete aggressively.** Unused CSS is a liability. Chrome's Coverage panel shows what's unused on a page.
- **Comment the *why*, not the what.** `/* 3px nudge aligns with the icon baseline */` is useful; `/* set margin */` is not.
- **One component, one file.**
- **Don't style by structure.** If your CSS breaks when someone reorders the HTML, it's too coupled.
- **Review your own diffs.** Adding fifty lines to change one colour is a signal.

:::quiz
? Why does BEM use long class names like `.card__title--large`?
- Longer names render faster
- Every selector stays a single class, so specificity is flat and predictable *
- It is required by CSS
- It reduces file size
> Flat specificity means any rule can be overridden by source order or layers, not escalation.

? What beats specificity entirely?
- !important on a longer selector
- Cascade layer order *
- Inline styles
- Element selectors
> A rule in a later `@layer` wins whatever its selector, which is what makes utilities reliable.

? Why avoid `.sidebar .widget ul li a` as a selector?
- It is slow
- It is tied to the HTML structure and hard to override *
- It cannot be used with pseudo-classes
- It only works on the first match
> Structural coupling means reordering markup breaks styles. One class instead.

? What is the main benefit of design tokens?
- Smaller CSS files
- Changing a repeated value once updates everything consistently *
- Faster rendering
- Browser support
> They make systemic changes cheap, which is what maintainability actually means.

? When is `!important` defensible?
- For anything urgent
- To override third-party CSS you cannot edit *
- In component files
- To beat inline styles from your own code
> Otherwise it starts a specificity arms race you cannot win.
:::

:::exercise Refactor a stylesheet
Take any CSS file over 100 lines and:

1. Extract repeated colours, spacing and radii into tokens on `:root`.
2. Find the highest-specificity selector and flatten it to a single class.
3. Add `@layer reset, base, components, utilities;` and assign existing rules.
4. Run Chrome's Coverage panel and delete what isn't used.

Note the line count before and after. A 30% reduction is typical.
:::
