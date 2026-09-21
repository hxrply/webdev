You need remarkably little to build for the web: a text editor and a browser. Everything else is comfort. But a few good habits set up now will save you hours later.

# The editor

**Visual Studio Code** is the default choice for good reasons: free, fast enough, enormous extension ecosystem. Alternatives worth knowing: Zed, Sublime Text, WebStorm (paid, batteries included), or Neovim if that's your temperament.

Extensions worth installing on day one — and *only* these, resist the urge to install forty:

- **Prettier** — formats your code automatically on save. Stop arguing with yourself about indentation.
- **ESLint** — catches JavaScript mistakes as you type.
- **Live Server** — serves your folder over `http://localhost` with auto-reload. Solves the `file://` problem instantly.
- A colour theme you like. This matters more than people admit; you'll stare at it for hundreds of hours.

:::tip Turn on format-on-save now
In VS Code: Settings → search "format on save" → tick it. Combined with Prettier, your code stays tidy without any effort, forever. This is the single highest-return five seconds in this lesson.
:::

# A sane project structure

For a small site, this is plenty:

```text
my-site/
├── index.html          ← the home page
├── about.html
├── css/
│   └── style.css
├── js/
│   └── main.js
└── images/
    └── logo.svg
```

Conventions that are worth following because everyone else does:

- **`index.html` is special.** A request for `/` or `/about/` serves `index.html` from that folder automatically. This is a web-server convention, not a browser one.
- **Lowercase, hyphenated filenames**: `contact-form.js`, not `Contact Form.js`. Most production servers are Linux and case-sensitive: `Logo.png` and `logo.png` are different files there, even though they're identical on Windows and macOS. This bites people the first time they deploy.
- **No spaces in filenames.** Spaces become `%20` in URLs and quietly break things.
- **Group by type when small, by feature when large.** Don't over-engineer a five-file project.

# Paths: the number one beginner bug

Given the structure above, inside `index.html`:

```html
<!-- Relative: looks in the css folder next to this file -->
<link rel="stylesheet" href="css/style.css">

<!-- Root-relative: starts from the site root, wherever this file is -->
<link rel="stylesheet" href="/css/style.css">

<!-- Up one level, then into css -->
<link rel="stylesheet" href="../css/style.css">
```

| Path | Means |
|---|---|
| `style.css` | Same folder as the current file |
| `css/style.css` | Into the `css` subfolder |
| `../style.css` | Up one folder, then find it |
| `/css/style.css` | From the site root (ignores current location) |
| `https://…/style.css` | A completely different server |

:::gotcha Root-relative paths and file://
`/css/style.css` means "the root of the server". Opened via `file://`, the root is your *hard drive*, so it resolves to something like `C:/css/style.css` and fails. This is yet another reason to run a local server rather than double-clicking files.
:::

# Run a local server

Pick whichever you have. From inside your project folder:

```bash
# Python (installed on macOS and most Linux systems)
python3 -m http.server 8000

# Node, no install needed
npx serve

# VS Code: right-click index.html → "Open with Live Server"
```

Then visit `http://localhost:8000`. `localhost` is your own machine; `8000` is the port. Nobody else on the internet can see it.

:::note Why bother?
Fetching data, JavaScript modules, service workers, and root-relative paths all behave differently — or refuse to work — on `file://`. A local server takes three seconds to start and removes an entire category of mysterious bugs.
:::

# A first project, end to end

Make these three files and open the folder in your editor.

```html file="index.html"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>My first site</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <h1>Hello, web</h1>
  <button id="greet">Say hi</button>
  <p id="output"></p>

  <script src="js/main.js"></script>
</body>
</html>
```

```css file="css/style.css"
body {
  font-family: system-ui, sans-serif;
  max-width: 40rem;
  margin: 3rem auto;
  padding: 0 1rem;
  line-height: 1.6;
}
button {
  padding: 0.6rem 1.2rem;
  font: inherit;
  border-radius: 6px;
  cursor: pointer;
}
```

```js file="js/main.js"
document.getElementById('greet').addEventListener('click', () => {
  document.getElementById('output').textContent = 'Hi! The time is ' + new Date().toLocaleTimeString();
});
```

Three separate files, one page. This separation — structure, style, behaviour — is the pattern you'll use forever.

:::tip Why `<script>` sits at the bottom
HTML is read top to bottom. A script in the `<head>` runs *before* the button exists, so `getElementById` returns `null` and you get a confusing error. Putting scripts just before `</body>` avoids this. (The modern alternative: `<script src="..." defer></script>` in the head — more on that later.)
:::

# Keep a scratch space

Have one folder — `sandbox/`, `playground/`, whatever — where code quality does not matter and nothing is precious. When you want to check "does `flex-wrap` do what I think?", you answer it in twenty seconds instead of contaminating a real project. Professional developers do this constantly.

:::quiz
? Why is `Logo.PNG` a risky filename?
- PNG files must be lowercase to display
- Production servers are usually case-sensitive, so it may 404 after deploying *
- Browsers cannot render uppercase extensions
- It makes the file larger
> Windows and macOS are typically case-insensitive; Linux servers are not. The mismatch causes "works locally, broken live".

? Your CSS file is at `css/style.css` and your page is at the project root. Which href works when served locally?
- `../css/style.css`
- `css/style.css` *
- `/style.css`
- `file:///css/style.css`
> The page is in the root, so it steps *into* `css/`. No `../` needed.

? What does `python3 -m http.server 8000` do?
- Uploads your site to the internet
- Serves the current folder at http://localhost:8000 on your machine only *
- Compiles your HTML
- Installs a web framework
> It is a tiny local web server — perfect for development, not intended for production.

? Where should `<script src="js/main.js">` normally go?
- In the head, first thing
- Just before `</body>`, or in the head with `defer` *
- Inside the body's first element
- It does not matter at all
> Scripts that touch the DOM need the DOM to exist first.
:::

:::exercise Build the starter
Create the three-file project above, serve it locally, and confirm the button works. Then deliberately break it: change `href="css/style.css"` to `href="style.css"`, reload, and watch the styles vanish. Open DevTools → Network and find the red 404. Recognising that failure on sight is a genuinely useful skill.
:::
