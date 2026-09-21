HTML — HyperText Markup Language — is not a programming language. There are no variables, no loops, no logic. It is a way of *labelling* content so a browser knows what each piece is. That's all it does, and it does it well.

# Tags, elements, attributes

```html
<a href="https://example.com" title="Visit">Click me</a>
│└┬┘ └──────────┬──────────┘              └──┬───┘ └┬┘
│ │             │                            │      └ closing tag
│ │             └ attribute (name="value")   └ content
│ └ tag name
└ opening tag
```

- A **tag** is the thing in angle brackets: `<p>`.
- An **element** is the opening tag, the content and the closing tag together.
- **Attributes** live in the opening tag and configure the element. They're always `name="value"`.

Most elements wrap content. A few — called **void elements** — have nothing to wrap and never get a closing tag:

```html
<img src="cat.jpg" alt="A sleeping cat">
<br>
<hr>
<input type="text" name="email">
<meta charset="utf-8">
```

:::note Self-closing slashes
You may see `<br />`. That's XHTML style. In HTML it is allowed but meaningless — `<br>` is correct and sufficient. Don't add slashes to void elements unless a framework (JSX) requires it.
:::

# Nesting

Elements contain other elements, forming a tree:

```html
<article>
  <h2>Sourdough for beginners</h2>
  <p>It takes <strong>time</strong>, not skill.</p>
</article>
```

The one hard rule: **close in the reverse order you opened**. This is correct:

```html
<p>Some <strong>bold <em>and italic</em></strong> text.</p>
```

This is not, and browsers will silently rearrange it into something you didn't intend:

```html
<p>Some <strong>bold <em>text</strong></em>.</p>
```

:::tip Indent as you nest
Two spaces per level. HTML doesn't care, but you will, at 11pm, trying to find which `</div>` closes which `<div>`.
:::

# The document skeleton

Every page starts the same way. Learn it once, type it forever:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Page title — shown in the tab</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <!-- Everything visible goes here -->
  <h1>Hello</h1>

  <script src="js/main.js"></script>
</body>
</html>
```

Line by line, because each of these earns its place:

| Line | Why |
|---|---|
| `<!DOCTYPE html>` | Tells the browser to use standards mode. Omit it and you get "quirks mode", which emulates 1998 browser bugs. Non-negotiable. |
| `<html lang="en">` | The language of the page. Screen readers pick pronunciation from it; translation tools use it. Genuinely important, constantly forgotten. |
| `<meta charset="utf-8">` | The character encoding. Without it, accented letters and emoji turn into `Ã©` mojibake. Must be within the first 1024 bytes. |
| `<meta name="viewport" …>` | Tells mobile browsers to use the real device width. **Without this your responsive CSS will not work on phones** — the page will render at 980px and zoom out. |
| `<title>` | Tab text, bookmark name, search result headline. |
| `<head>` vs `<body>` | Head = information *about* the page. Body = the page itself. |

Try it — edit anything and press Run:

```html run title="A complete page"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>My page</title>
</head>
<body>
  <h1>Sourdough for beginners</h1>
  <p>It takes <strong>time</strong>, not skill. You need flour, water,
     salt, and <em>patience</em>.</p>
  <hr>
  <p>Written by <a href="#">Ada</a> &middot; 12 March</p>
</body>
</html>
```

# Comments

```html
<!-- This is a comment. It is not displayed… -->
```

…but it **is** downloaded, and anyone can read it in View Source. Don't leave passwords, internal notes about customers, or unflattering remarks about clients in comments. People do. It goes badly.

# Whitespace collapses

HTML squashes every run of spaces, tabs and newlines into a single space:

```html run title="Whitespace is collapsed"
<p>These        words       are
   spread    across
        several lines.</p>

<p>Use CSS or &nbsp;entities&nbsp; when spacing matters.</p>

<pre>  In a pre element,
  whitespace  is  preserved
  exactly.</pre>
```

So you cannot lay out a page with spaces and line breaks. Layout is CSS's job — which is the entire reason CSS exists.

# Character entities

Some characters need escaping because they mean something to HTML:

| Character | Write | Why |
|---|---|---|
| `<` | `&lt;` | Would start a tag |
| `>` | `&gt;` | Would end a tag |
| `&` | `&amp;` | Would start an entity |
| `"` | `&quot;` | Inside an attribute value |
| non-breaking space | `&nbsp;` | A space that won't line-break |
| `©` | `&copy;` | Convenience |

:::gotcha Showing code on a page
To display `<div>` as text you must write `&lt;div&gt;`. Otherwise the browser creates a div. This lesson's code samples all do exactly that behind the scenes.
:::

# Validity matters less than you'd think, until it doesn't

Browsers are extraordinarily forgiving. Forget a `</p>` and the page still renders. This is deliberate — the web would have collapsed otherwise. But sloppy HTML produces bugs that are maddening to trace, because the browser's guess about your intent may differ from yours.

Run your page through the [W3C validator](https://validator.w3.org/) occasionally. It catches unclosed tags, duplicate ids and invalid nesting in seconds.

:::quiz
? What does `<!DOCTYPE html>` do?
- Imports the HTML5 library
- Switches the browser into standards mode *
- Declares the page language
- Tells the server this is HTML
> Without it browsers use "quirks mode", reproducing old layout bugs on purpose.

? Which element must be present for responsive CSS to work properly on phones?
- `<meta charset="utf-8">`
- `<meta name="viewport" content="width=device-width, initial-scale=1">` *
- `<html lang="en">`
- `<link rel="stylesheet">`
> Without the viewport meta tag, mobile browsers pretend to be a 980px desktop and scale down.

? Which of these is a void element?
- `<p>`
- `<div>`
- `<img>` *
- `<span>`
> Void elements wrap no content, so they have no closing tag.

? What happens to `<p>Hello     there</p>` on screen?
- It renders with all the spaces preserved
- The extra whitespace collapses to one space *
- It causes a validation error
- The spaces become `&nbsp;`
> HTML collapses runs of whitespace. Preserving it requires `<pre>` or CSS.

? Why write `&lt;` instead of `<` in page content?
- It renders faster
- `<` would be interpreted as the start of a tag *
- `<` is not a valid character in UTF-8
- It is required inside paragraphs
> Entities let you display characters that HTML otherwise treats as syntax.
:::

:::exercise Write a page from memory
Without looking above, type a complete HTML document containing a heading, two paragraphs, a bolded phrase, a link and a horizontal rule. Then compare against the skeleton. The bits you forgot are the bits to practise — usually `lang`, `charset` or the viewport tag.
:::
