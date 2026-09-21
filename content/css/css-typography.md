Type is most of what a website *is*. Good typography is largely invisible; bad typography is the difference between a page people read and one they bounce off.

# Font stacks

```css
body {
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
```

The browser tries each in order until one is available. Always end with a generic family: `sans-serif`, `serif`, `monospace`, `cursive`.

The **system font stack** — `system-ui` and friends — uses whatever the operating system uses. It costs zero bytes, renders instantly, and looks native on every platform. For a lot of projects it's genuinely the best choice, not a compromise.

```html run title="Font families compared"
<p class="system">System UI — fast, familiar, free.</p>
<p class="serif">Georgia, serif — warmer, good for long reading.</p>
<p class="mono">Monospace — every character the same width.</p>

<style>
  p { font-size: 18px; margin: 8px 0; }
  .system { font-family: system-ui, sans-serif; }
  .serif  { font-family: Georgia, "Times New Roman", serif; }
  .mono   { font-family: ui-monospace, Menlo, Consolas, monospace; }
</style>
```

# Loading web fonts

```css
@font-face {
  font-family: "Inter";
  src: url("/fonts/inter-var.woff2") format("woff2-variations");
  font-weight: 100 900;      /* a variable font covers a whole range */
  font-display: swap;        /* show fallback text immediately, swap when ready */
}
```

Things that matter here:

- **WOFF2 only.** Every browser you care about supports it, and it's the smallest.
- **`font-display: swap`** shows text in the fallback font immediately, then swaps. The alternative — invisible text for up to three seconds — is worse.
- **Variable fonts** pack every weight into one file. One 100KB download instead of five 30KB ones, plus every weight in between.
- **Preload** the critical font: `<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>`.
- **Self-host.** Third-party font CDNs add a DNS lookup and connection, and no longer share caches between sites (browsers partition cache per-site now, so the old "they'll already have it" argument is dead).

:::gotcha FOUT and FOIT
**FOUT** (Flash of Unstyled Text) — fallback shows, then swaps. Slightly jarring, but text is readable throughout.
**FOIT** (Flash of Invisible Text) — nothing shows until the font loads. Users stare at a blank page.

`font-display: swap` chooses FOUT. To reduce the jump, pick a fallback with similar metrics and tune it with `size-adjust`, `ascent-override` and friends in a `@font-face` for the fallback.
:::

# The properties that matter

```html run title="Typographic controls"
<p class="demo">The quick brown fox jumps over the lazy dog. 0123456789</p>

<style>
  .demo {
    font-family: Georgia, serif;
    font-size: 1.25rem;        /* size */
    font-weight: 400;          /* 100–900; 400 normal, 700 bold */
    font-style: normal;        /* italic */
    line-height: 1.6;          /* unitless! see below */
    letter-spacing: 0.01em;    /* tracking */
    word-spacing: normal;
    text-align: left;          /* avoid justify on the web */
    text-transform: none;      /* uppercase, capitalize */
    text-decoration: none;     /* underline, line-through */
    font-variant-numeric: tabular-nums;  /* digits line up in columns */
  }
</style>
```

## line-height should be unitless

```css
body { line-height: 1.6; }     /* ✓ each element computes from its own size */
body { line-height: 24px; }    /* ✗ inherited as 24px everywhere, crushing headings */
```

A unitless value is inherited as a *multiplier*, so a 48px heading gets 48 × 1.6 rather than a fixed 24px. This is one of those rules that is always right.

Sensible starting values: body text 1.5–1.7, headings 1.1–1.3 (big text needs proportionally less leading), UI labels ~1.4.

# Scale and hierarchy

Pick sizes from a consistent scale rather than choosing ad hoc numbers:

```css
:root {
  --step--1: 0.833rem;
  --step-0:  1rem;      /* body */
  --step-1:  1.2rem;
  --step-2:  1.44rem;
  --step-3:  1.728rem;  /* each step × 1.2 */
  --step-4:  2.074rem;
}

h1 { font-size: var(--step-4); }
h2 { font-size: var(--step-3); }
h3 { font-size: var(--step-2); }
small { font-size: var(--step--1); }
```

Common ratios: 1.2 (minor third, subtle), 1.25, 1.333 (perfect fourth), 1.5 (dramatic). Consistency is what reads as "designed".

## Fluid type

```css
h1 { font-size: clamp(1.75rem, 1.2rem + 3vw, 3.5rem); }
```

One line replaces three media queries, and it scales smoothly rather than snapping at breakpoints.

# Readability essentials

```html run title="Good vs poor typography"
<article class="good">
  <h3>Readable</h3>
  <p>Measure capped at 65 characters, generous line height, left aligned, comfortable size.
     Your eye finds the next line without effort, which is the entire job.</p>
</article>

<article class="poor">
  <h3>Less readable</h3>
  <p>Justified text with a long measure and tight leading produces rivers of white space and makes the return sweep harder, and at small sizes with low contrast it becomes genuinely tiring to read for any length of time.</p>
</article>

<style>
  body { font-family: system-ui; }
  article { padding: 12px; margin-bottom: 12px; border: 1px solid #e2e8f0; }
  .good p { max-width: 65ch; line-height: 1.65; font-size: 1rem; color: #24303f; }
  .poor p { text-align: justify; line-height: 1.25; font-size: 0.85rem; color: #9aa4b2; }
</style>
```

The checklist:

- **Measure**: 45–75 characters. `max-width: 65ch`.
- **Line height**: 1.5+ for body text.
- **Contrast**: at least 4.5:1. Light grey on white is a design crime committed daily.
- **Size**: 16px minimum for body text. Smaller text on mobile also triggers zoom-on-focus in iOS Safari for inputs.
- **Alignment**: left-align (in LTR languages). `text-align: justify` without hyphenation creates ugly gaps; the web has no good hyphenation by default (though `hyphens: auto` helps).
- **Don't** set long passages in all caps, italics or a decorative face.

# Handling long words

```css
.wrap {
  overflow-wrap: break-word;   /* break only when a word can't fit */
  hyphens: auto;               /* needs lang="" on the html element */
}
```

Long URLs and German compound nouns are the usual culprits for horizontal scrollbars on mobile. `overflow-wrap: break-word` is the fix. Avoid `word-break: break-all`, which breaks words mid-syllable regardless of need.

# Little things that look professional

```css
.prices { font-variant-numeric: tabular-nums; }  /* digits align in tables */
.heading { text-wrap: balance; }                  /* even line lengths in headings */
p { text-wrap: pretty; }                          /* avoids single-word last lines */
.quote { hanging-punctuation: first; }
::selection { background: #ffe08a; }
```

`text-wrap: balance` on headings is a genuinely free upgrade — it prevents the dreaded one-word second line.

:::quiz
? Why should `line-height` be unitless?
- It renders faster
- Children inherit the ratio and compute from their own font size *
- Units are invalid on line-height
- It supports decimals
> A fixed `24px` line-height inherited by a 48px heading looks crushed.

? What does `font-display: swap` do?
- Swaps between two fonts on hover
- Shows fallback text immediately, then switches when the web font loads *
- Preloads the font
- Disables web fonts on slow connections
> The alternative is invisible text while the font downloads.

? What is a comfortable line length for body text?
- 20–30 characters
- 45–75 characters *
- 90–120 characters
- As wide as the screen
> `max-width: 65ch` lands right in the middle of the comfortable range.

? Which is the best default font stack for performance?
- A Google Fonts import
- The system font stack — zero download, instant render *
- A 600KB variable font
- Comic Sans
> System fonts cost nothing and look native. Use a web font when the brand needs it.

? A long URL causes horizontal scrolling on mobile. Best fix?
- `overflow-x: hidden` on body
- `overflow-wrap: break-word` on the text container *
- Reduce the font size
- `white-space: nowrap`
> It breaks the word only when it genuinely cannot fit, leaving normal text alone.
:::

:::exercise Set an article properly
Take three paragraphs of text and style them: system font stack, 1rem body size, 1.6 line height, 65ch measure, a modular scale for the headings, `text-wrap: balance` on the h1, and contrast checked at 4.5:1 or better. Then compare against the browser's defaults side by side.
:::
