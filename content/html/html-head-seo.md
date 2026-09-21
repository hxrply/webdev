The `<head>` contains nothing a visitor sees directly, yet it controls your tab title, search result, social preview, mobile rendering and more. A dozen lines here have outsized effect.

# A production-quality head

```html
<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <title>Sourdough for beginners — The Daily Loaf</title>
  <meta name="description" content="A no-nonsense guide to your first sourdough loaf: four ingredients, three days, no special equipment.">
  <link rel="canonical" href="https://example.com/sourdough-for-beginners">

  <link rel="icon" href="/favicon.ico" sizes="32x32">
  <link rel="icon" href="/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">

  <meta property="og:title" content="Sourdough for beginners">
  <meta property="og:description" content="Four ingredients, three days, no special equipment.">
  <meta property="og:image" content="https://example.com/images/loaf-1200x630.jpg">
  <meta property="og:url" content="https://example.com/sourdough-for-beginners">
  <meta property="og:type" content="article">
  <meta name="twitter:card" content="summary_large_image">

  <meta name="theme-color" content="#8b5a2b">

  <link rel="stylesheet" href="/css/style.css">
  <script src="/js/main.js" defer></script>
</head>
```

# The essentials, explained

## `<title>`

The most important SEO tag on the page, and the headline of your search result.

- 50–60 characters before search engines truncate it.
- Most distinctive words first: `Sourdough for beginners — The Daily Loaf`, not `The Daily Loaf | Blog | Sourdough for beginners`.
- **Unique per page.** Twenty pages titled "Home" is a common and costly mistake.

## `<meta name="description">`

Not a ranking factor, but it is often the snippet under your link — so it decides whether anyone clicks.

- Around 150–160 characters.
- Write it as ad copy for a human, not a keyword list.
- Unique per page. If you can't write one, search engines will generate one from your text, usually worse.

## `<link rel="canonical">`

Tells search engines which URL is the real one when the same content is reachable several ways (`?utm_source=…`, `/page` vs `/page/`, http vs https). Prevents your own pages competing with each other.

## The viewport tag

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

Without it, mobile browsers render at ~980px and shrink the result — all your media queries do nothing. It is the difference between a responsive site and a tiny unreadable one.

:::warn Never disable zoom
`user-scalable=no` or `maximum-scale=1` stops people zooming. For anyone with low vision that can make your site unusable, and it fails WCAG. There is no good reason for it.
:::

## Favicons

```html
<link rel="icon" href="/favicon.ico" sizes="32x32">     <!-- legacy, still wanted -->
<link rel="icon" href="/icon.svg" type="image/svg+xml">  <!-- scales, supports dark mode -->
<link rel="apple-touch-icon" href="/apple-touch-icon.png"><!-- 180×180, iOS home screen -->
<link rel="manifest" href="/site.webmanifest">           <!-- PWA metadata -->
```

An SVG favicon can even respond to dark mode using a media query inside the SVG.

# Open Graph: how links look when shared

When someone pastes your URL into Slack, WhatsApp, LinkedIn or a group chat, the preview card is built from Open Graph tags. Without them you get a bare URL, and click-through drops sharply.

| Tag | Notes |
|---|---|
| `og:title` | Can differ from `<title>` — no site-name suffix needed |
| `og:description` | One or two sentences |
| `og:image` | **1200×630px**, absolute URL, under ~1 MB. Include text if it helps |
| `og:url` | The canonical URL |
| `og:type` | `website`, `article`, `product`… |
| `twitter:card` | `summary_large_image` for a big image |

:::tip Test before you share
Use Facebook's Sharing Debugger, LinkedIn's Post Inspector or Twitter's Card Validator. Previews are cached aggressively — get it right before the link goes anywhere, or you'll be stuck with a broken card for days.
:::

# Structured data

JSON-LD describes your content in a machine-readable vocabulary, which is what produces rich results — star ratings, recipe times, FAQ dropdowns:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Recipe",
  "name": "Beginner sourdough",
  "author": { "@type": "Person", "name": "Ada Lovelace" },
  "prepTime": "PT30M",
  "cookTime": "PT45M",
  "recipeYield": "1 loaf",
  "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.7", "reviewCount": "89" }
}
</script>
```

Validate with Google's Rich Results Test. Only describe what's actually on the page — marking up ratings you don't have is a policy violation, not a growth hack.

# Loading CSS and JS well

```html
<link rel="stylesheet" href="/css/style.css">     <!-- render-blocking, by design -->
<script src="/js/main.js" defer></script>          <!-- downloads in parallel, runs after HTML -->
<script src="/js/analytics.js" async></script>     <!-- runs whenever it lands, order not guaranteed -->
```

| Attribute | Download | Executes | Use for |
|---|---|---|---|
| *(none)* | Blocks parsing | Immediately | Rarely — it stalls the page |
| `defer` | Parallel | After HTML parsing, in order | **Almost everything** |
| `async` | Parallel | As soon as it arrives | Independent scripts like analytics |
| `type="module"` | Parallel | Deferred by default | ES modules |

:::note Resource hints
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
```
`preconnect` opens the connection early; `preload` fetches a critical resource sooner. Both are easy to overuse — preloading everything prioritises nothing.
:::

# Other useful meta

```html
<meta name="robots" content="noindex, nofollow">   <!-- keep this page out of search -->
<meta name="color-scheme" content="light dark">     <!-- native controls follow the theme -->
<meta name="theme-color" content="#0d1117">         <!-- browser chrome colour on mobile -->
<meta http-equiv="refresh" content="5; url=/new">   <!-- avoid: use a 301 redirect instead -->
```

# The realistic SEO summary

Technical SEO is mostly hygiene; the rest is content.

**Worth doing:** unique descriptive titles and descriptions; semantic HTML with a clean heading outline; fast pages; mobile-friendly layout; descriptive alt text; clean readable URLs; a `sitemap.xml` and sensible `robots.txt`; HTTPS; internal links with meaningful text.

**Not worth doing:** the `keywords` meta tag (ignored since ~2009); keyword stuffing; hidden text; buying links.

The best SEO is being genuinely the most useful page on the topic, on a site that loads fast and works for everyone. Everything else is a rounding error.

:::quiz
? What happens if you omit the viewport meta tag?
- The page will not load on mobile
- Mobile browsers render at ~980px wide and zoom out, so media queries don't apply as intended *
- Text becomes unselectable
- Nothing; it is optional
> It is the foundation of mobile rendering. Missing it is the classic "why is my responsive site tiny?" bug.

? What is `rel="canonical"` for?
- Telling browsers which stylesheet is primary
- Declaring the preferred URL when the same content has several addresses *
- Setting the page language
- Preloading a resource
> It consolidates ranking signals instead of splitting them across duplicate URLs.

? Which script attribute should be your default?
- None
- `async`
- `defer` *
- `type="text/javascript"`
> `defer` downloads in parallel, preserves order and runs after parsing — right for nearly all app code.

? Your link shared in Slack shows no preview image. What is missing?
- A favicon
- `og:image` with an absolute URL *
- A canonical tag
- Structured data
> Open Graph tags drive preview cards, and `og:image` must be an absolute URL.

? Does the `keywords` meta tag help ranking?
- Yes, significantly
- No — major search engines have ignored it for well over a decade *
- Only for images
- Only on the home page
> It was abused into uselessness. Spend the effort on the title and content instead.
:::

:::exercise Write a complete head
For one page of a project, write the full head: charset, viewport, a unique title under 60 characters, a description around 155, canonical, favicon set, and all five Open Graph tags. Then check the title and description lengths — most people's first attempt is far too long.
:::
