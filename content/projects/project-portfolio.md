Time to build something whole. This project uses HTML semantics, modern CSS layout, responsive design, accessibility and a little JavaScript — and it ends with a page on the real internet.

Build it yourself as you read. Copying the finished code teaches your clipboard.

# What we're building

A single-page personal site with a header and navigation, a hero, an about section, a project grid, a contact section and a footer. Responsive from 320px up, accessible by keyboard, dark mode included.

# Step 1: the structure

Start with semantic HTML and no styling at all. If the content reads sensibly now, the styled version will too.

```html file="index.html"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ada Lovelace — Front-end developer</title>
  <meta name="description" content="Front-end developer in London, building fast and accessible websites.">
  <link rel="stylesheet" href="css/style.css">
  <script src="js/main.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>

  <header class="site-header">
    <a class="logo" href="#">AL</a>
    <nav aria-label="Main">
      <ul>
        <li><a href="#about">About</a></li>
        <li><a href="#work">Work</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
    <button id="theme-toggle" aria-label="Switch to dark theme">🌙</button>
  </header>

  <main id="main">
    <section class="hero">
      <h1>I build fast, accessible websites.</h1>
      <p>Front-end developer in London. Currently working on design systems and making slow pages quick.</p>
      <a class="btn" href="#work">See my work</a>
    </section>

    <section id="about">
      <h2>About</h2>
      <p>I've spent the last few years…</p>
    </section>

    <section id="work">
      <h2>Selected work</h2>
      <ul class="project-grid">
        <li class="project">
          <h3><a href="https://example.com">Project name</a></h3>
          <p>One sentence on what it is and what you did.</p>
          <ul class="tags"><li>HTML</li><li>CSS</li><li>JavaScript</li></ul>
        </li>
        <!-- more projects -->
      </ul>
    </section>

    <section id="contact">
      <h2>Contact</h2>
      <p>The quickest way to reach me is <a href="mailto:ada@example.com">email</a>.</p>
    </section>
  </main>

  <footer class="site-footer">
    <p>© 2025 Ada Lovelace</p>
  </footer>
</body>
</html>
```

Points worth noticing:

- A **skip link** as the first focusable element.
- One `<h1>`, describing the page.
- `<nav aria-label="Main">` — navigation is a list of links, because that's what it is.
- The project grid is a `<ul>`; screen readers announce "list, 6 items".
- Each project's heading contains the link, so the link text is meaningful out of context.

:::exercise Check it unstyled
Open it now, before any CSS. Tab through it: can you reach every link? Does the reading order make sense? A page that works unstyled is a page that works for everyone.
:::

# Step 2: tokens and a reset

```css file="css/style.css"
/* ---------- design tokens ---------- */
:root {
  color-scheme: light dark;

  --bg: #ffffff;
  --surface: #f6f8fb;
  --text: #16191f;
  --text-dim: #566072;
  --border: #dde3ec;
  --accent: #0a68d8;

  --space-1: .25rem; --space-2: .5rem;  --space-3: 1rem;
  --space-4: 1.5rem; --space-5: 2.5rem; --space-6: 4rem;

  --radius: 12px;
  --measure: 62ch;
  --font: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

:root[data-theme="dark"] {
  --bg: #0e1116; --surface: #161b23; --text: #e7edf5;
  --text-dim: #9aa6b8; --border: #232b36; --accent: #57a6ff;
}

/* ---------- reset ---------- */
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font);
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}

img, svg { display: block; max-width: 100%; }
input, button, textarea, select { font: inherit; }
h1, h2, h3 { line-height: 1.15; text-wrap: balance; }
p { text-wrap: pretty; }

a { color: var(--accent); }

:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; border-radius: 4px; }

.skip-link {
  position: absolute; left: var(--space-2); top: -4rem; z-index: 10;
  background: var(--accent); color: #fff;
  padding: var(--space-2) var(--space-3); border-radius: var(--radius);
  text-decoration: none; transition: top .15s;
}
.skip-link:focus { top: var(--space-2); }
```

Every colour, space and radius is a token. Changing the accent colour later is one line, not forty.

# Step 3: layout

```css
/* ---------- layout ---------- */
.site-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border);
  position: sticky; top: 0;
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  backdrop-filter: blur(10px);
  z-index: 5;
}

.logo { font-weight: 800; letter-spacing: -.03em; text-decoration: none; color: var(--text); }

.site-header nav ul {
  list-style: none; padding: 0;
  display: flex; gap: var(--space-4);
}
.site-header nav a { color: var(--text-dim); text-decoration: none; }
.site-header nav a:hover { color: var(--text); }

#theme-toggle {
  margin-left: auto;              /* pushes it to the right */
  background: none; border: 1px solid var(--border);
  border-radius: var(--radius); padding: var(--space-1) var(--space-2);
  cursor: pointer; color: inherit;
}

main { max-width: 72rem; margin-inline: auto; padding: 0 var(--space-4); }

section { padding-block: var(--space-6); }
section + section { border-top: 1px solid var(--border); }

h2 { font-size: clamp(1.5rem, 1rem + 2vw, 2rem); margin-bottom: var(--space-3); }
section p { max-width: var(--measure); color: var(--text-dim); }
```

The header uses `margin-left: auto` on the toggle — the flexbox idiom for "push this to the far side".

# Step 4: the hero and buttons

```css
.hero { padding-block: var(--space-6) var(--space-5); }

.hero h1 {
  font-size: clamp(2rem, 1.2rem + 4vw, 3.5rem);
  letter-spacing: -.03em;
  margin-bottom: var(--space-3);
  max-width: 18ch;
}
.hero p { font-size: 1.15rem; margin-bottom: var(--space-4); }

.btn {
  display: inline-block;
  padding: .75rem 1.5rem;
  background: var(--accent); color: #fff;
  border-radius: var(--radius); text-decoration: none; font-weight: 600;
  transition: transform .15s ease, filter .15s ease;
}
@media (hover: hover) {
  .btn:hover { filter: brightness(1.1); transform: translateY(-2px); }
}
.btn:active { transform: translateY(0); }
```

`clamp()` gives fluid type with no media queries. The hover effect is gated behind `hover: hover` so it doesn't stick on touchscreens.

# Step 5: the project grid

```css
.project-grid {
  list-style: none; padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
  gap: var(--space-3);
}

.project {
  padding: var(--space-4);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  display: flex; flex-direction: column; gap: var(--space-2);
  transition: border-color .2s ease, transform .2s ease;
}
@media (hover: hover) {
  .project:hover { border-color: var(--accent); transform: translateY(-3px); }
}

.project h3 { font-size: 1.1rem; }
.project h3 a { text-decoration: none; }
.project h3 a::after { content: " ↗"; font-size: .8em; }
.project p { flex: 1; font-size: .95rem; }   /* absorbs spare height so tags align */

.tags { list-style: none; padding: 0; display: flex; flex-wrap: wrap; gap: var(--space-1); }
.tags li {
  font-size: .78rem; padding: .15rem .55rem;
  border: 1px solid var(--border); border-radius: 999px; color: var(--text-dim);
}
```

`repeat(auto-fit, minmax(17rem, 1fr))` is the whole responsive strategy for this grid — it reflows continuously with no breakpoints. `flex: 1` on the paragraph makes the tag rows line up across cards of different text lengths.

# Step 6: the theme toggle

```js file="js/main.js"
const root = document.documentElement;
const toggle = document.getElementById('theme-toggle');

/** Resolve the theme: saved choice, else the OS preference. */
function currentTheme() {
  try {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
  } catch {}
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  root.dataset.theme = theme;
  toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  toggle.setAttribute('aria-label',
    `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
}

applyTheme(currentTheme());

toggle.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem('theme', next); } catch {}
});
```

Note the `try/catch` around storage — private browsing can throw, and a broken theme toggle shouldn't take the page down. And the `aria-label` updates, so a screen reader announces what the button will *do*, not what it currently shows.

:::tip Avoiding the flash of wrong theme
With `defer`, the script runs after the HTML parses, so a dark-mode user may see a white flash. Fix it with a tiny **blocking** script in the `<head>`:

```html
<script>
  try {
    const t = localStorage.getItem('theme');
    if (t) document.documentElement.dataset.theme = t;
  } catch {}
</script>
```
:::

# Step 7: the whole thing, live

```html run title="The finished page — edit anything"
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <a class="logo" href="#">AL</a>
  <nav aria-label="Main"><ul>
    <li><a href="#about">About</a></li>
    <li><a href="#work">Work</a></li>
  </ul></nav>
  <button id="theme-toggle" aria-label="Switch to dark theme">🌙</button>
</header>

<main id="main">
  <section class="hero">
    <h1>I build fast, accessible websites.</h1>
    <p>Front-end developer in London.</p>
    <a class="btn" href="#work">See my work</a>
  </section>

  <section id="work">
    <h2>Selected work</h2>
    <ul class="project-grid">
      <li class="project">
        <h3><a href="#">Colour contrast checker</a></h3>
        <p>A tool that grades colour pairs against WCAG thresholds.</p>
        <ul class="tags"><li>JavaScript</li><li>a11y</li></ul>
      </li>
      <li class="project">
        <h3><a href="#">Recipe archive</a></h3>
        <p>A static site generator for a family recipe collection, with search.</p>
        <ul class="tags"><li>Node</li><li>CSS Grid</li></ul>
      </li>
      <li class="project">
        <h3><a href="#">Train delay dashboard</a></h3>
        <p>Live departures with a public API, cached and charted.</p>
        <ul class="tags"><li>API</li><li>SQL</li></ul>
      </li>
    </ul>
  </section>
</main>

<style>
  :root {
    color-scheme: light dark;
    --bg:#fff; --surface:#f6f8fb; --text:#16191f; --text-dim:#566072;
    --border:#dde3ec; --accent:#0a68d8; --radius:12px;
  }
  :root[data-theme="dark"] {
    --bg:#0e1116; --surface:#161b23; --text:#e7edf5;
    --text-dim:#9aa6b8; --border:#232b36; --accent:#57a6ff;
  }
  *,*::before,*::after { box-sizing:border-box; } * { margin:0; }
  body { background:var(--bg); color:var(--text); font-family:system-ui,sans-serif; line-height:1.6; }
  a { color:var(--accent); }
  :focus-visible { outline:3px solid var(--accent); outline-offset:3px; }
  .skip-link { position:absolute; left:8px; top:-4rem; background:var(--accent); color:#fff;
               padding:8px 14px; border-radius:8px; text-decoration:none; transition:top .15s; }
  .skip-link:focus { top:8px; }

  .site-header { display:flex; align-items:center; gap:24px; padding:14px 20px;
                 border-bottom:1px solid var(--border); }
  .logo { font-weight:800; color:var(--text); text-decoration:none; }
  .site-header nav ul { list-style:none; padding:0; display:flex; gap:20px; }
  .site-header nav a { color:var(--text-dim); text-decoration:none; }
  #theme-toggle { margin-left:auto; background:none; border:1px solid var(--border);
                  border-radius:8px; padding:4px 9px; cursor:pointer; }

  main { max-width:60rem; margin-inline:auto; padding:0 20px; }
  section { padding-block:40px; }
  .hero h1 { font-size:clamp(1.8rem,1rem + 4vw,3rem); letter-spacing:-.03em;
             margin-bottom:12px; max-width:18ch; }
  .hero p { color:var(--text-dim); margin-bottom:18px; }
  .btn { display:inline-block; padding:.7rem 1.4rem; background:var(--accent); color:#fff;
         border-radius:10px; text-decoration:none; font-weight:600; }
  h2 { margin-bottom:16px; }

  .project-grid { list-style:none; padding:0; display:grid; gap:14px;
                  grid-template-columns:repeat(auto-fit,minmax(15rem,1fr)); }
  .project { padding:18px; background:var(--surface); border:1px solid var(--border);
             border-radius:12px; display:flex; flex-direction:column; gap:8px;
             transition:border-color .2s, transform .2s; }
  .project:hover { border-color:var(--accent); transform:translateY(-3px); }
  .project h3 { font-size:1.05rem; } .project h3 a { text-decoration:none; }
  .project h3 a::after { content:" ↗"; font-size:.8em; }
  .project p { flex:1; font-size:.92rem; color:var(--text-dim); }
  .tags { list-style:none; padding:0; display:flex; flex-wrap:wrap; gap:5px; }
  .tags li { font-size:.75rem; padding:2px 9px; border:1px solid var(--border);
             border-radius:999px; color:var(--text-dim); }
</style>

<script>
  const root = document.documentElement;
  const toggle = document.getElementById('theme-toggle');
  function applyTheme(theme) {
    root.dataset.theme = theme;
    toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    toggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
  }
  applyTheme(matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  toggle.addEventListener('click', () =>
    applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));
</script>
```

Drag the divider to narrow the preview and watch the grid reflow. Click the toggle. Tab through it.

# Step 8: finish it properly

Before you call it done:

**Accessibility**
- Tab through the whole page. Everything reachable, focus always visible.
- Check contrast in both themes (DevTools colour picker shows the ratio).
- Zoom to 200% — nothing clipped or overlapping.
- Run Lighthouse's accessibility audit and fix everything it finds.

**Performance**
- Images: correct size, modern format, `width`/`height` set, `loading="lazy"` below the fold.
- Lighthouse performance on the deployed URL, not localhost.

**Metadata**
- Unique `<title>` under 60 characters and a description around 155.
- Open Graph tags — then check how it previews in a chat app.
- A favicon.

**Deploy**
- Push to GitHub, enable Pages, fix any broken paths (use relative, not root-relative).
- Open it on your phone.

:::quiz
? Why is the skip link the first focusable element on the page?
- It improves SEO
- Keyboard users can jump past the navigation instead of tabbing through it on every page *
- It preloads the main content
- It is required by HTML
> It is hidden until focused, so it costs sighted mouse users nothing.

? What does `repeat(auto-fit, minmax(17rem, 1fr))` give the project grid?
- Exactly three columns
- As many columns as fit, each at least 17rem, with no media queries *
- A fixed 17rem column width
- One column on mobile only
> The grid reflows continuously rather than jumping at breakpoints.

? Why is `flex: 1` applied to the project card's paragraph?
- To make the text bigger
- So it absorbs spare height and the tag rows line up across cards *
- To centre the text
- To enable wrapping
> The standard flex idiom for aligning card footers regardless of text length.

? Why gate the hover lift behind `@media (hover: hover)`?
- It improves performance
- On touchscreens hover styles stick after a tap *
- Hover doesn't exist on mobile
- It reduces CSS size
> A bug that's easy to ship and hard to notice from a desktop.

? The theme toggle's `aria-label` changes with the theme. Why?
- To update the icon
- So screen-reader users hear what the button will do, not what it currently shows *
- It is required for buttons
- To store the preference
> The visible emoji is decorative; the label carries the meaning.

? Why wrap the `localStorage` calls in try/catch?
- To handle JSON errors only
- Storage throws in private browsing, and a broken toggle shouldn't break the page *
- It is asynchronous
- To support older browsers
> Losing the saved preference is acceptable; an uncaught exception is not.
:::

:::exercise Extend it
Once the base works, add one or two:

1. A **filter** on the project grid by tag, using event delegation and `hidden`.
2. A **contact form** with real labels, `required`, and custom validation messages via the Constraint Validation API.
3. **Scroll-spy** navigation highlighting the current section with `IntersectionObserver`.
4. **Projects from JSON** — move the data into `projects.json`, `fetch` it, and render with a function. This is the step that turns a page into an application.
5. A `prefers-reduced-motion` block disabling the hover transforms.
:::
