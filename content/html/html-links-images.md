Hyperlinks are the *hypertext* in HTML — the invention that made the web a web rather than a collection of documents.

# Links

```html run title="Link varieties"
<p><a href="https://developer.mozilla.org">An absolute link</a></p>
<p><a href="/about">Root-relative — the site's /about page</a></p>
<p><a href="contact.html">Relative — a file beside this one</a></p>
<p><a href="#section-2">A fragment — jumps within this page</a></p>
<p><a href="mailto:hi@example.com">Email me</a></p>
<p><a href="tel:+441234567890">Call us</a></p>
<p><a href="report.pdf" download>Download the PDF</a></p>
```

# Opening in a new tab

```html
<a href="https://example.com" target="_blank" rel="noopener noreferrer">External site</a>
```

- `target="_blank"` opens a new tab.
- `rel="noopener"` prevents the new page from getting a reference to yours via `window.opener` — a real security issue known as tabnabbing. Modern browsers imply it, but be explicit.
- `rel="noreferrer"` additionally withholds the referring URL.

:::warn Use `target="_blank"` sparingly
It takes control away from the user, and it breaks the back button as a way to return. The usual justification — "so they don't leave my site" — is not a user benefit. Reasonable exceptions: links in a long form the user is mid-way through, and documents that open in a viewer.
:::

# Link text that works

Screen-reader users can call up a list of every link on the page, stripped of surrounding context. Judge your link text by that standard.

```html
<!-- Useless out of context -->
<p>To read the annual report, <a href="/report.pdf">click here</a>.</p>

<!-- Useful -->
<p>Read the <a href="/report.pdf">2025 annual report (PDF, 2.4 MB)</a>.</p>
```

Rules of thumb: describe the destination, front-load the distinguishing words, and warn about file type and size when linking to downloads.

# Images

```html run title="Images and alt text"
<img src="https://picsum.photos/id/1025/400/260"
     alt="A pug wrapped in a blanket, looking directly at the camera"
     width="400" height="260">
```

Every attribute there is doing work:

- **`src`** — where the file is.
- **`alt`** — a text alternative, read aloud by screen readers and shown if the image fails to load. **Required.**
- **`width`/`height`** — the image's intrinsic dimensions. Supplying them lets the browser reserve the right space before the image arrives, which prevents the page from jumping around as it loads. CSS can still resize it.

## Writing good alt text

| Situation | What to write |
|---|---|
| Informative image | Describe the information it conveys: `alt="Sales grew 40% between 2023 and 2025"` |
| Purely decorative | `alt=""` — empty, so screen readers skip it entirely |
| Image inside a link | Describe the *destination*: `alt="Home"` |
| Complex chart | Short alt plus a full description in nearby text |
| Image of text | The text itself (and reconsider — real text is better) |

:::gotcha `alt=""` and no alt are completely different
Missing `alt` makes a screen reader announce the filename — `"D S C underscore 0 4 2 1 dot J P G"`. Empty `alt=""` correctly says nothing. Decorative images need `alt=""`, not nothing.

Also: don't start with "Image of…". The screen reader already says "image".
:::

# Responsive images

Shipping a 3000px photo to a phone wastes the user's data and your ranking. Two tools:

```html
<!-- Same image, different sizes: let the browser choose -->
<img src="photo-800.jpg"
     srcset="photo-400.jpg 400w, photo-800.jpg 800w, photo-1600.jpg 1600w"
     sizes="(max-width: 600px) 100vw, 50vw"
     alt="Sunset over the harbour">
```

`srcset` lists candidates with their real widths; `sizes` tells the browser how wide the image will *display* at various viewport widths. The browser then picks, accounting for screen density too.

```html
<!-- Different images or formats: you choose -->
<picture>
  <source srcset="hero.avif" type="image/avif">
  <source srcset="hero.webp" type="image/webp">
  <img src="hero.jpg" alt="The workshop at dawn">
</picture>
```

`<picture>` tries each `<source>` in order and falls back to the `<img>`. Use it for modern formats (AVIF and WebP are much smaller than JPEG) and for **art direction** — a wide crop on desktop, a square crop on mobile, via `media` attributes.

## Lazy loading

```html
<img src="far-down-the-page.jpg" alt="…" loading="lazy" decoding="async">
```

`loading="lazy"` defers loading until the image is near the viewport. Use it for below-the-fold images; **don't** use it on your hero image, which you want as fast as possible.

# Figures and captions

```html run title="Figure with caption"
<figure>
  <img src="https://picsum.photos/id/1040/400/220" alt="A house on a wooded hillside">
  <figcaption>Fig 1. The finished cabin, six months after the first post went in.</figcaption>
</figure>
```

`<figure>` groups self-contained content with its caption. It works for code listings, diagrams and quotes too, not just images.

# Video and audio

```html
<video controls width="640" poster="thumbnail.jpg" preload="metadata">
  <source src="clip.webm" type="video/webm">
  <source src="clip.mp4" type="video/mp4">
  <track kind="captions" src="captions.vtt" srclang="en" label="English" default>
  Your browser does not support video.
</video>

<audio controls src="episode.mp3">Your browser does not support audio.</audio>
```

- `controls` gives native play/pause. Without it, there is no way to play the video unless you build one.
- `<track kind="captions">` adds subtitles — necessary for deaf and hard-of-hearing users, and useful for everyone watching without sound.
- Autoplay is blocked by browsers unless the video is also `muted`. This is a feature, not a bug.

# SVG

```html run title="Inline SVG scales perfectly"
<svg width="80" height="80" viewBox="0 0 24 24" fill="none"
     stroke="crimson" stroke-width="2" stroke-linecap="round" aria-hidden="true">
  <path d="M12 21s-7-4.6-9.3-9A5.2 5.2 0 0 1 12 6.6 5.2 5.2 0 0 1 21.3 12c-2.3 4.4-9.3 9-9.3 9z"/>
</svg>
<p>Vector graphics stay sharp at any size and can be styled with CSS.</p>
```

Use SVG for logos, icons and diagrams; raster formats (AVIF/WebP/JPEG) for photographs. Inline SVG can be styled and animated with CSS, which icon fonts cannot do nearly as well.

:::quiz
? Which alt text is best for a photo used purely as background decoration?
- `alt="decorative image"`
- `alt="background.jpg"`
- `alt=""` *
- Omit the alt attribute entirely
> Empty alt tells assistive tech to skip it. Omitting alt makes it announce the filename.

? Why supply `width` and `height` on an `<img>` even when CSS resizes it?
- It makes the file download faster
- It lets the browser reserve space, preventing layout shift as images load *
- It is required for alt text to work
- It improves image quality
> Reserved space avoids content jumping around — one of the Core Web Vitals.

? What does `rel="noopener"` protect against?
- Broken links
- The newly opened page manipulating your page via window.opener *
- Search engines following the link
- Mixed-content warnings
> It severs the scripting connection between your tab and the one you opened.

? Your hero image is the first thing users see. Should it be `loading="lazy"`?
- Yes, always lazy-load images
- No — lazy loading delays it, hurting the largest contentful paint *
- Only on mobile
- Only if it is a WebP
> Lazy loading is for below-the-fold images. Above the fold, you want it loaded eagerly.

? What is `srcset` for?
- Providing fallback formats if one fails
- Offering multiple resolutions so the browser downloads the best fit *
- Setting the image's CSS size
- Preloading images
> `srcset` + `sizes` let the browser pick by viewport and pixel density. `<picture>` is for format and art-direction choices.
:::

:::exercise Audit a page's images
Open any image-heavy site with DevTools. For three images check: is there alt text, and is it meaningful? Are width/height set? Is `srcset` used? In the Network panel, how many kilobytes did the largest image cost? Then compare that to how big it appears on screen — the gap is usually shocking.
:::
