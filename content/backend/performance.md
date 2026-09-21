Performance is a feature. Users abandon slow pages, search engines rank them lower, and the effect is largest on the cheap phones and poor connections most of the world actually uses.

# What to measure

Core Web Vitals are Google's three headline metrics, and they're reasonable proxies for "does this feel good":

| Metric | Measures | Good |
|---|---|---|
| **LCP** (Largest Contentful Paint) | When the main content appears | < 2.5s |
| **INP** (Interaction to Next Paint) | How quickly the page responds to input | < 200ms |
| **CLS** (Cumulative Layout Shift) | How much the layout jumps around | < 0.1 |

Plus **TTFB** (time to first byte — server speed) and **total bytes transferred**.

:::tip Measure on a real phone, on a real network
Your development machine on fibre is the best-case scenario nobody experiences. In DevTools, throttle to "Slow 4G" and set CPU to 4× or 6× slowdown. The result is often shocking, and it's closer to the truth. Field data (Chrome UX Report, or your own RUM) beats lab data — it reflects your actual users.
:::

# The biggest wins, roughly in order

## 1. Send fewer bytes

Images are usually the largest thing on a page by a wide margin.

```html
<img src="hero-800.avif"
     srcset="hero-400.avif 400w, hero-800.avif 800w, hero-1600.avif 1600w"
     sizes="(max-width: 700px) 100vw, 800px"
     width="800" height="450"
     alt="…" loading="lazy" decoding="async">
```

- **Modern formats**: AVIF or WebP instead of JPEG/PNG — often 50–70% smaller.
- **Right size**: don't ship 3000px to a 400px slot.
- **`loading="lazy"`** below the fold; never on the LCP image.
- **`width`/`height`** always — they prevent layout shift (CLS).
- **SVG** for icons and logos.

Then: compress everything (brotli), minify CSS/JS, and remove unused code. Chrome's Coverage panel shows what proportion of your CSS and JS never runs — on a typical site built with a framework it's alarming.

## 2. Load JavaScript carefully

JavaScript is the most expensive kind of byte: it must be downloaded, parsed, compiled *and* executed, and all of that competes with rendering on the main thread.

```html
<script src="app.js" defer></script>         <!-- the default choice -->
<script src="analytics.js" async></script>    <!-- independent -->
```

```js
// Code-split: load heavy things only when used
button.addEventListener('click', async () => {
  const { Chart } = await import('./chart.js');
  new Chart(data);
});
```

- Audit your dependencies. A 300KB date library for one `format()` call is a bad trade.
- Ship modern syntax to modern browsers rather than transpiling everything to ES5.
- Remove polyfills for browsers you no longer support.

## 3. Don't block the first render

The browser cannot paint until it has processed the CSS. That makes stylesheets render-blocking by design.

```html
<!-- Inline the critical CSS for above-the-fold content -->
<style>/* ~14KB of the styles needed for the first screen */</style>
<!-- Load the rest without blocking -->
<link rel="stylesheet" href="full.css" media="print" onload="this.media='all'">
```

For fonts:

```html
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
```
```css
@font-face { font-family: Inter; src: url(/fonts/inter.woff2) format('woff2'); font-display: swap; }
```

`font-display: swap` shows fallback text immediately rather than leaving a blank space.

## 4. Cache aggressively

```text
Cache-Control: public, max-age=31536000, immutable    # hashed assets: app.a3f9c1.js
Cache-Control: no-cache                                # HTML: always revalidate
```

The pattern: put a content hash in asset filenames and cache them forever; never cache the HTML that references them. A new deploy changes the hashes, so clients fetch the new files and reuse everything unchanged.

A **CDN** puts those files physically near your users, which removes a large chunk of latency for anyone not next door to your server.

## 5. Fix the server side

- **The N+1 query problem** — usually the single biggest server-side cost. One join instead of 200 queries.
- **Missing indexes** on filtered and joined columns.
- **Cache expensive computations** (Redis, or in-memory for a single server).
- **Don't block the event loop** in Node: no synchronous file I/O, no giant JSON parses, no heavy loops in a request handler.
- **Paginate.** Always.
- **Compress responses.**

# Avoiding layout shift

CLS is the metric that measures things jumping around as the page loads — a genuine irritation when you go to tap a link and an advert pushes it away.

```css
img, video { aspect-ratio: 16 / 9; width: 100%; height: auto; }   /* reserve space */
.ad-slot { min-height: 250px; }                                    /* reserve space */
```

- Always set image dimensions or `aspect-ratio`.
- Reserve space for adverts, embeds and banners.
- Don't insert content above existing content after load.
- Use `font-display: swap` with a metrics-matched fallback (`size-adjust`) so the swap doesn't reflow text.

# Rendering and responsiveness

```js
// ✗ Layout thrashing: read, write, read, write…
items.forEach(el => { el.style.width = el.offsetWidth + 10 + 'px'; });

// ✓ Batch reads, then writes
const widths = items.map(el => el.offsetWidth);
items.forEach((el, i) => { el.style.width = widths[i] + 10 + 'px'; });
```

```js
// Debounce/throttle expensive handlers
window.addEventListener('scroll', throttle(onScroll, 100), { passive: true });

// Better: let the browser tell you, off the main thread
new IntersectionObserver(onVisible).observe(target);

// Break up long tasks so the page stays responsive
for (const chunk of chunks) {
  await new Promise(r => setTimeout(r, 0));   // yield to the event loop
  process(chunk);
}
```

Animate only `transform` and `opacity`. Anything else forces layout or paint on every frame.

# The process

1. **Measure.** Lighthouse for a lab score, DevTools Performance for a timeline, field data for the truth.
2. **Find the biggest single cost.** It's usually images, then JavaScript, then a server query.
3. **Fix that one thing.**
4. **Measure again**, and confirm you actually improved it.
5. **Set a budget** — "the JS bundle stays under 150KB", "LCP under 2.5s" — and check it in CI so regressions get caught at the pull request, not in production.

:::warn Beware the micro-optimisation trap
`for` loops versus `forEach`, `++i` versus `i++`, clever bit tricks — these make no measurable difference in a web application. Meanwhile a 4MB hero image costs seconds. **Fix the thing that's measured in megabytes and seconds before the thing measured in nanoseconds.**
:::

:::quiz
? Which is usually the largest contributor to page weight?
- HTML
- CSS
- Images *
- Fonts
> Modern formats, correct sizing and lazy loading are the highest-return fixes.

? What does `loading="lazy"` do, and where should you avoid it?
- Delays scripts; avoid on analytics
- Defers image loading until near the viewport; avoid on the LCP image *
- Compresses the image
- Caches the image
> Lazy-loading the hero image directly delays your LCP.

? What causes a poor CLS score?
- Slow server response
- Content moving as the page loads, e.g. images without dimensions *
- Large JavaScript bundles
- Too many requests
> Reserve space with width/height or aspect-ratio.

? Which caching strategy suits hashed asset filenames?
- no-store
- max-age=0
- max-age=31536000, immutable *
- Cache only on the CDN
> The hash changes when the content does, so a long cache is safe.

? Why is JavaScript more expensive per byte than an image?
- It's less compressible
- It must be parsed, compiled and executed on the main thread *
- It can't be cached
- It requires more requests
> A megabyte of JS costs far more CPU than a megabyte of JPEG.

? What should you do before optimising anything?
- Minify everything
- Add a CDN
- Measure, ideally on a throttled connection and real device data *
- Remove dependencies
> Otherwise you optimise what's easy rather than what's slow.
:::

:::exercise Run a real audit
Pick a site you've built, or any public site:

1. Run Lighthouse; note LCP, INP and CLS.
2. In Network, sort by size and find the three biggest resources.
3. Throttle to Slow 4G with 4× CPU slowdown and reload. What appears first? How long until you can interact?
4. Open Coverage and note what percentage of CSS and JS goes unused.
5. Pick the single largest problem, fix it, and re-measure.

Write down the before and after numbers. That habit — change one thing, measure — is the whole discipline.
:::
