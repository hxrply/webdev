Roughly one in five people has a disability. Accessibility is not a niche concern, a legal box-tick, or something to retrofit at the end — and the good news is that most of it is just doing HTML properly, which you're already learning.

# Who you are building for

- **Blind users** navigating with a screen reader (VoiceOver, NVDA, JAWS) — by headings, landmarks and links, not by scrolling.
- **Low-vision users** zooming to 200–400%, or using high-contrast modes.
- **Colour-blind users** — around 1 in 12 men — who cannot distinguish your red error state from your green success state.
- **Motor-impaired users** using a keyboard only, a switch device, or voice control.
- **Deaf and hard-of-hearing users** needing captions and transcripts.
- **Cognitive** differences: clear language, predictable layout, no time limits.
- **And everyone else**: on a phone in bright sun, with a broken trackpad, in a noisy train without headphones. Accessibility fixes are usability fixes.

# The POUR principles

WCAG, the standard, organises everything under four headings:

- **Perceivable** — people can perceive the content (alt text, captions, contrast).
- **Operable** — they can use the interface (keyboard access, enough time, no seizure risks).
- **Understandable** — it behaves predictably and says what it means.
- **Robust** — it works with assistive technologies, now and later.

# Keyboard access: the fastest test you can run

**Put your mouse away and press Tab.** Right now, on whatever you've built.

- Can you reach every interactive thing?
- Can you *see* where you are at all times?
- Does the order follow the visual layout?
- Can you activate things with Enter/Space?
- Can you get *out* of anything you get into (a modal, a menu)?

If any answer is no, you have an accessibility bug that also affects power users.

```html run title="Focus styles: never remove, always improve"
<p><button class="bad">Focus removed (bad)</button>
   <button class="good">Focus improved (good)</button></p>
<p>Press Tab to move between them.</p>

<style>
  body { font-family: system-ui; }
  button { padding: 10px 16px; font: inherit; border-radius: 6px; cursor: pointer; }
  .bad:focus { outline: none; }
  .good:focus-visible {
    outline: 3px solid #0a68d8;
    outline-offset: 2px;
  }
</style>
```

:::warn `outline: none` is the most damaging line in CSS
It is everywhere, because default outlines are ugly. Removing focus indication makes a site unusable for keyboard users — they cannot see where they are. If you dislike the default, **replace it**, don't delete it. `:focus-visible` shows the ring for keyboard users while sparing mouse users, which is the compromise everyone actually wanted.
:::

## tabindex, briefly

- `tabindex="0"` — put this in the natural tab order. For custom widgets only.
- `tabindex="-1"` — focusable by script, not by Tab. Useful for moving focus to a heading or error summary.
- `tabindex="1"` (or higher) — **don't.** It jumps ahead of everything else and wrecks the order.

# Images, forms and links (recap, because they matter most)

Most real-world accessibility failures are these three:

```html
<!-- Images: meaningful alt, or alt="" if decorative -->
<img src="chart.png" alt="Revenue rose 40% from 2023 to 2025">

<!-- Forms: every input labelled -->
<label for="email">Email</label>
<input type="email" id="email" name="email">

<!-- Links: describe the destination -->
<a href="/report.pdf">2025 annual report (PDF, 2.4 MB)</a>
```

# Colour and contrast

```html run title="Contrast in practice"
<p class="poor">Grey on white — 2.3:1. Fails.</p>
<p class="ok">Darker grey — 7.4:1. Passes comfortably.</p>
<p class="colour-only">Error: <span style="color:crimson">this field is required</span></p>
<p class="with-icon">Error: <span style="color:crimson">⚠ this field is required</span></p>

<style>
  body { font-family: system-ui; background: #fff; }
  .poor { color: #aaa; }
  .ok { color: #444; }
</style>
```

The thresholds worth memorising:

| Content | Minimum ratio (WCAG AA) |
|---|---|
| Body text | **4.5:1** |
| Large text (18pt / 14pt bold) | **3:1** |
| UI components, focus indicators, icons | **3:1** |

And: **never use colour as the only signal.** Add an icon, text, underline or pattern. The red/green status dot is invisible to a colour-blind user; red dot + "✕ Failed" is not.

:::tip Check contrast in DevTools
Inspect an element, click the colour swatch in the Styles pane, and the picker shows the contrast ratio with a pass/fail tick — plus a line on the spectrum showing where it would start passing.
:::

# Headings and structure

Screen-reader users navigate by heading. A logical, unbroken outline is one of the highest-impact things you can do. One `<h1>`, no skipped levels, and headings that describe what follows.

# ARIA: the five rules that matter

ARIA adds semantics HTML can't express. It is powerful and easy to make things worse with.

1. **Don't use ARIA if a native element will do.** `<button>` beats `<div role="button">`, always.
2. **Don't change native semantics.** `<h2 role="button">` is a bad idea; put a button inside it.
3. **All interactive ARIA must be keyboard operable.** Role without behaviour is a lie.
4. **Don't put `aria-hidden="true"` on a focusable element.** You create an invisible trap: reachable by Tab, invisible to the screen reader.
5. **Every interactive element needs an accessible name** — from its text, `aria-label`, or `aria-labelledby`.

```html run title="Naming icon-only controls"
<!-- No accessible name: announced as just "button" -->
<button>✕</button>

<!-- Named -->
<button aria-label="Close dialog">✕</button>

<!-- Or: visible text hidden from sight but not from screen readers -->
<button><span aria-hidden="true">✕</span><span class="sr-only">Close dialog</span></button>

<style>
  body { font-family: system-ui; }
  button { font-size: 16px; padding: 6px 10px; margin-right: 8px; }
  .sr-only {
    position: absolute; width: 1px; height: 1px;
    padding: 0; margin: -1px; overflow: hidden;
    clip: rect(0 0 0 0); white-space: nowrap; border: 0;
  }
</style>
```

That `.sr-only` class is worth keeping in every project. Note it uses clipping, **not** `display: none` — hidden content is not announced at all, which defeats the purpose.

## Live regions

When content changes without a page load — a search updating, a toast appearing — screen-reader users get no notification unless you provide one:

```html
<div aria-live="polite" id="status"></div>
<!-- Setting textContent here is announced without stealing focus -->
```

Use `polite` almost always; `assertive` interrupts and should be reserved for genuine emergencies. The element must exist in the DOM *before* you put text in it.

# Motion and other courtesies

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Vestibular disorders make parallax and large motion genuinely nauseating. Respecting this OS-level preference takes five lines.

Also: `lang` on `<html>`, a sensible `<title>` per page, and text that reflows at 320px width without horizontal scrolling.

# Testing

1. **Keyboard only.** Tab through everything. Free, fast, catches a lot.
2. **Automated**: Lighthouse, axe DevTools. They catch perhaps 30–40% of issues — a floor, not a ceiling.
3. **Zoom to 200%** and check nothing is cut off or overlapping.
4. **Use a screen reader.** VoiceOver (⌘+F5 on Mac) or NVDA (free, Windows). Awkward at first, extremely clarifying.
5. **Turn off CSS.** Does the content still read in a sensible order?

:::quiz
? What is wrong with `button:focus { outline: none; }`?
- Nothing, it is standard practice
- Keyboard users lose all indication of where they are *
- It breaks click handlers
- It only affects Firefox
> If you dislike the default ring, replace it with a better one — never remove it.

? What is the minimum contrast ratio for normal body text under WCAG AA?
- 2:1
- 3:1
- 4.5:1 *
- 7:1
> 3:1 covers large text and UI components; 7:1 is the stricter AAA level.

? An icon-only button shows ✕. What do screen-reader users hear without extra work?
- "Close"
- "Button" with no name *
- "X button"
- Nothing at all
> Give it `aria-label` or visually hidden text.

? Which is the correct first move when building a custom dropdown?
- Add `role="listbox"` to a div
- Check whether `<select>` or `<details>` already does the job *
- Add tabindex="1"
- Use aria-hidden on the options
> Rule one of ARIA: prefer the native element. You inherit years of tested behaviour.

? Why is `display: none` wrong for visually hidden screen-reader text?
- It is slower
- Content hidden that way is not announced by screen readers either *
- It breaks the layout
- It cannot be undone
> Use the clip-based `.sr-only` pattern so the text stays in the accessibility tree.

? A live search updates results as you type. What do screen-reader users need?
- An alert() call
- An `aria-live="polite"` region announcing the result count *
- A page reload
- `role="search"` on the input
> Without a live region, the change is silent. Polite avoids interrupting mid-sentence.
:::

:::exercise Audit your own work
Take a page you've built and:

1. Tab through it start to finish. Note anything unreachable or invisible when focused.
2. Run Lighthouse's accessibility audit and read every issue.
3. Zoom to 200% and look for clipped content.
4. Check every image has appropriate alt and every input a label.

Fix what you find. This is the single most valuable half-hour you can spend on a project.
:::
