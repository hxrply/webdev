# Webcraft

A hands-on course in web development: HTML, CSS, JavaScript, SQL, and the
tools around them. 67 lessons across 7 tracks, with code you can edit and
run on the page.

**Live: https://hxrply.github.io/webdev/**

It's a static site — no build step, no framework, no dependencies to
install. Clone it, serve the folder, and it works.

## Running it

Browsers block pages from reading local files over `file://`, so the site
needs a web server. Any of these will do, from the project root:

```bash
python3 -m http.server 8000     # then open http://localhost:8000
npx serve
# or: VS Code → right-click index.html → "Open with Live Server"
```

## Deployment

Pushing to the default branch publishes the site to GitHub Pages via
`.github/workflows/deploy.yml`. The workflow runs both checkers first, so a
broken lesson or a failing SQL block stops the deploy rather than shipping.

It publishes only the runtime files — `index.html`, `curriculum.js`,
`assets/` and `content/` — plus a `.nojekyll` marker so Pages serves the
files as-is instead of running them through Jekyll.

Because the site is served from a subpath (`/webdev/`), every path in the
project is relative. Introducing a root-relative path like `/assets/style.css`
would work locally and 404 once deployed.

Netlify, Vercel and Cloudflare Pages need no configuration either — point
them at the repo with no build command and the repository root as the
publish directory.

## What's in it

| Track | Lessons | Covers |
|---|---|---|
| Foundations | 6 | How the web works, HTTP, front/back end, tooling, DevTools, debugging |
| HTML | 8 | Structure, text, links and media, tables, forms, semantics, accessibility, metadata |
| CSS | 13 | Selectors, cascade, box model, typography, Flexbox, Grid, responsive, animation, architecture |
| JavaScript | 16 | Types, functions, arrays, objects, DOM, events, forms, async, fetch, storage, classes, modules, errors |
| SQL & databases | 11 | Relational model, SELECT through JOINs and CTEs, transactions, schema design, indexes, using SQL from code |
| Backend & tooling | 10 | Git, Node, building an API, REST, auth, security, performance, testing, deployment, frameworks |
| Build & next steps | 3 | Two full projects and a roadmap |

Every lesson has runnable examples, a quiz, and an exercise. In total:
**204 live playgrounds, 110 SQL consoles, 371 quiz questions.**

## Features

- **Live code playgrounds.** HTML/CSS/JS blocks marked `run` are editable and
  execute in a sandboxed iframe, with `console.log` output shown underneath.
- **A real SQL database.** SQL lessons run against SQLite compiled to
  WebAssembly ([sql.js](https://sql.js.org), vendored locally, MIT), seeded
  with a sample shop schema. All blocks on a page share one database and run
  in order, so a lesson can create an index in one block and `EXPLAIN` it in
  the next.
- **Progress tracking** in `localStorage`, per lesson and per track.
- **Search** over lesson titles, summaries and tags (press `/`).
- **Light and dark themes**, following the OS by default.
- **Works offline** once loaded — no CDN, no external assets. (The `fetch`
  lesson is the one exception: it deliberately calls live public APIs.)

## How it's built

```text
index.html               the app shell
curriculum.js            the syllabus — tracks, lessons, metadata
assets/css/style.css     design tokens and all styling
assets/js/
  markdown.js            Markdown renderer + syntax highlighter + ::: directives
  playground.js          editable snippets running in a sandboxed iframe
  sqlplay.js             SQLite console, shared DB per lesson
  quiz.js                multiple-choice checks parsed from lesson Markdown
  app.js                 hash router, sidebar, progress, search, theme
assets/vendor/sql.js/    SQLite compiled to WebAssembly (MIT)
content/<track>/*.md     the lessons themselves
tools/                   content and SQL checkers
```

Lessons are plain Markdown fetched at runtime and rendered client-side.

### Adding a lesson

1. Write `content/<track>/my-lesson.md`.
2. Add an entry to the matching track in `curriculum.js`:

```js
{ id: 'my-lesson', title: 'My lesson', minutes: 10, tags: ['css'],
  summary: 'One line shown in search and lists.',
  file: 'content/css/my-lesson.md' }
```

3. Run the checkers.

### Markdown extensions

Beyond standard Markdown:

````text
```html run title="Optional title"     → editable live playground
```js run                              → JS playground, console output below
```sql run                             → runs against the sample database
```js file="src/app.js"                → static block labelled with a filename

:::note / :::tip / :::warn / :::gotcha  → callouts
:::exercise Title                       → exercise box
:::quiz                                 → interactive quiz
? Question text
- Wrong answer
- Right answer *
> Explanation shown after answering
:::
````

Headings in lesson files start at `#`, which renders as `<h2>` — the `<h1>`
comes from the lesson title in `curriculum.js`.

## Checks

```bash
node tools/check-content.js   # curriculum/file agreement, fences, quiz structure
node tools/check-sql.js       # executes every SQL block against the sample DB
```

`check-content.js` verifies each lesson has a file, ids are unique, code
fences and `:::` directives are balanced, the renderer doesn't throw, and
every quiz question has exactly one correct answer. `check-sql.js` runs all
110 SQL blocks in lesson order and reports any that error.

## Licence

Course content and site code: use them however you like.
`assets/vendor/sql.js/` is MIT-licensed; its licence is included alongside it.
