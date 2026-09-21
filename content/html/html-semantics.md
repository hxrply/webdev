Semantic HTML means choosing elements for what content *is*, not what it looks like. It costs nothing extra to type and buys you accessibility, SEO, better default behaviour and code that explains itself.

# The problem with div soup

These two produce an identical-looking page:

```html
<!-- Div soup -->
<div class="header">
  <div class="nav">…</div>
</div>
<div class="main">
  <div class="post">
    <div class="title">Bread</div>
    <div class="text">…</div>
  </div>
</div>
<div class="footer">…</div>
```

```html
<!-- Semantic -->
<header>
  <nav>…</nav>
</header>
<main>
  <article>
    <h1>Bread</h1>
    <p>…</p>
  </article>
</main>
<footer>…</footer>
```

The second version tells the browser, screen readers, search engines and the next developer what each region *is*. The first tells them nothing — `class="header"` is a note to yourself, not information any machine can act on.

# The landmark elements

```html run title="A full page skeleton"
<body>
  <header>
    <h1>The Daily Loaf</h1>
    <nav aria-label="Main">
      <ul>
        <li><a href="#">Home</a></li>
        <li><a href="#">Recipes</a></li>
      </ul>
    </nav>
  </header>

  <main>
    <article>
      <h2>Sourdough without the mystique</h2>
      <p>Published <time datetime="2025-04-02">2 April</time></p>
      <p>Bread is flour, water, salt and time…</p>

      <section>
        <h3>Ingredients</h3>
        <p>…</p>
      </section>
    </article>

    <aside>
      <h2>Related</h2>
      <p>Three loaves worth trying.</p>
    </aside>
  </main>

  <footer>
    <p>&copy; 2025 The Daily Loaf</p>
  </footer>
</body>

<style>
  body { font-family: system-ui; }
  header, main, footer, article, aside, section { border: 1px dashed #bbb; padding: 8px; margin: 6px 0; }
  nav ul { list-style: none; display: flex; gap: 12px; padding: 0; }
</style>
```

| Element | Use for | Notes |
|---|---|---|
| `<header>` | Introductory content for a page or section | Can appear more than once — one per article is fine |
| `<nav>` | A **major** block of navigation links | Not every group of links. Label it if you have several |
| `<main>` | The page's unique main content | **Exactly one per page**, not nested in other landmarks |
| `<article>` | Self-contained, independently distributable content | Blog post, comment, product card. Test: would it make sense in an RSS feed on its own? |
| `<section>` | A thematic grouping | Should have a heading. If it doesn't, you probably want a `<div>` |
| `<aside>` | Tangentially related content | Sidebar, pull quote, related links |
| `<footer>` | Closing info for a page or section | Copyright, author, related links |

:::tip `<main>` earns its place instantly
Screen-reader users and keyboard users can jump straight to `<main>`, skipping the nav they've already heard on every page. Combine it with a skip link as the first focusable element:

```html
<a class="skip-link" href="#main">Skip to content</a>
```
:::

# section vs div vs article

The distinction people struggle with most:

- **`<article>`** — would this make sense on its own, lifted out of the page? A news story, yes. A "Related products" strip, no.
- **`<section>`** — a thematic chunk *of* something, with a heading. Chapters of a document.
- **`<div>`** — no semantic meaning; you just need a box to style or a hook for JavaScript.

:::gotcha Don't reach for `<section>` as a fancy `<div>`
A `<section>` without a heading contributes an unnamed region to the accessibility tree — noise, not signal. If there is no heading, use `<div>`. That is exactly what `<div>` is for, and using it correctly is not a failure.
:::

Articles can contain sections, and sections can contain articles:

```html
<section>
  <h2>Latest posts</h2>
  <article><h3>Post one</h3>…</article>
  <article><h3>Post two</h3>…</article>
</section>
```

# Interactive semantic elements

Some elements bring real behaviour you'd otherwise write by hand:

```html run title="Built-in interactivity"
<details>
  <summary>What is hydration?</summary>
  <p>The weight of water as a percentage of the weight of flour.</p>
</details>

<details open>
  <summary>Can I start this open?</summary>
  <p>Yes — add the <code>open</code> attribute.</p>
</details>

<p>Progress: <progress value="70" max="100">70%</progress></p>
<p>Disk: <meter value="0.82" low="0.3" high="0.75" optimum="0.2">82%</meter></p>

<style>
  body { font-family: system-ui; }
  details { border: 1px solid #ddd; padding: 8px; margin-bottom: 8px; border-radius: 6px; }
  summary { cursor: pointer; font-weight: 600; }
</style>
```

`<details>`/`<summary>` is a complete accordion: keyboard accessible, announced correctly, works without JavaScript. Many accordion components are hundreds of lines reimplementing this, worse.

Also worth knowing: `<dialog>` for modals (with a real focus trap and a top layer that sits above everything, no z-index wars).

# Why this actually pays off

1. **Accessibility.** Screen readers offer a landmarks menu: "banner, navigation, main, complementary, contentinfo". Semantic elements populate it automatically. Divs don't.
2. **SEO.** Search engines weight content in `<main>` and `<article>` above boilerplate, and use heading structure to understand the page.
3. **Default behaviour.** `<button>`, `<details>`, `<dialog>`, `<a>` come with keyboard support, focus management and states that take real effort to reproduce.
4. **Reader modes and scrapers.** Safari Reader, Pocket, and preview cards look for `<article>`. Semantic markup makes your content portable.
5. **Readable code.** `</section>` tells you what just ended. `</div>` tells you nothing, and after twelve of them you're counting indentation.

:::note ARIA: a last resort, not an upgrade
`role="button"` on a div does *not* give it keyboard behaviour — it only changes what is announced, which can be worse: it now claims to be a button but ignores Enter. The first rule of ARIA is *don't use ARIA if a native element will do*. Reach for it only for patterns HTML has no element for (tabs, comboboxes, live regions), and follow the ARIA Authoring Practices when you do.
:::

:::quiz
? How many `<main>` elements should a page have?
- As many as you like
- Exactly one *
- One per section
- At least two for accessibility
> `<main>` marks *the* main content. Multiples make the landmark meaningless.

? When is `<div>` the right choice?
- Never in modern HTML
- When you need a styling or scripting container and no semantic element fits *
- Only for layout grids
- Only inside `<main>`
> `<div>` is the correct element for a purely presentational box. Misusing `<section>` instead is worse.

? Which best describes when to use `<article>`?
- Any block of text
- Content that would still make sense republished on its own *
- The main content area of the page
- A section with a heading
> The syndication test: blog post yes, sidebar widget no.

? What do you get free from `<details>`/`<summary>` that a div-based accordion needs code for?
- Animation
- Keyboard operation, correct announcement and no-JS functionality *
- Styling
- Smaller HTML
> It is a fully accessible disclosure widget built into the browser.

? What does `role="button"` on a `<div>` provide?
- Full button behaviour including keyboard activation
- Only the announced role — you must add tabindex and key handling yourself *
- Automatic focus styles
- Form submission
> ARIA changes semantics, never behaviour. This is why native elements win.
:::

:::exercise Convert div soup
Take any page you've built (or view-source a simple site) and replace generic divs with landmarks: `<header>`, `<nav>`, `<main>`, `<article>`, `<footer>`. Then open DevTools' Accessibility pane and look at the landmark structure. If you can understand the page from that tree alone, you've done it right.
:::
