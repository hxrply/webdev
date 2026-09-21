"Why isn't my CSS working?" is nearly always answered by this lesson. Two rules are fighting, and you don't yet know which wins or why.

# Three questions, in order

When two rules set the same property on the same element, the browser asks:

1. **Origin and importance** — who wrote the rule, and is it `!important`?
2. **Specificity** — how precisely does the selector target the element?
3. **Source order** — which came last?

Only if the first is tied does it consider the second, and so on.

# Specificity: counting

Specificity is a three-part score: **(ids, classes, elements)**. Bigger wins, compared left to right.

| Selector | Score | Notes |
|---|---|---|
| `p` | 0-0-1 | one element |
| `.card` | 0-1-0 | one class |
| `#header` | 1-0-0 | one id |
| `p.card` | 0-1-1 | class + element |
| `.card .title` | 0-2-0 | two classes |
| `#header .nav a:hover` | 1-2-1 | id + class + pseudo-class + element |
| `[type="text"]` | 0-1-0 | attribute counts as a class |
| `:hover`, `:focus` | 0-1-0 | pseudo-classes count as classes |
| `::before` | 0-0-1 | pseudo-**elements** count as elements |
| `*`, `>`, `+`, `~` | 0-0-0 | combinators and `*` count nothing |
| `:not(.x)`, `:is(.x)` | 0-1-0 | the *argument* is counted, not the function |
| `:where(.x)` | 0-0-0 | always zero — that's the point |
| `style="…"` | inline | beats any selector |

Crucially, **the comparison is left to right and one id beats any number of classes.** `#nav a` (1-0-1) defeats `.header .menu .item .link` (0-4-0). It's not a sum.

```html run title="Specificity in action"
<p id="one" class="highlight special">Which colour wins?</p>
<p class="highlight">And here?</p>

<style>
  p                    { color: grey;      }  /* 0-0-1 */
  .highlight           { color: orange;    }  /* 0-1-0 */
  .highlight.special   { color: seagreen;  }  /* 0-2-0 */
  #one                 { color: crimson;   }  /* 1-0-0  ← wins for the first */
</style>
```

# Source order: the tiebreaker

Equal specificity? The last one declared wins.

```css
.btn { background: blue; }
.btn { background: green; }   /* green wins — same specificity, later */
```

This is why the order of your `<link>` tags matters, and why a framework loaded *after* your stylesheet overrides you.

# Inheritance vs the cascade

An **inherited** value always loses to *any* directly matching rule, no matter how weak:

```html run title="Inheritance is weak"
<div class="parent">
  <p>I am red, not blue. A direct match beats any inherited value.</p>
</div>

<style>
  .parent { color: blue; }  /* inherited by the p */
  p       { color: red; }   /* 0-0-1, but it matches the p directly — it wins */
</style>
```

This surprises people constantly, especially with browser default styles (`a { color: -webkit-link }` beats your inherited `color` — which is why links need styling explicitly).

# !important

```css
.btn { color: red !important; }
```

`!important` jumps the queue entirely, above normal declarations regardless of specificity. And the layering is stranger than most people know:

1. User-agent (browser) normal
2. User normal
3. Author (you) normal
4. **Author `!important`**
5. **User `!important`**
6. **User-agent `!important`**

Note that a *user's* `!important` beats *yours* — deliberately, so people who need large text or specific colours can always get them.

:::warn `!important` is a debt, not a tool
It works, so it's tempting. But the only thing that overrides `!important` is another `!important` with higher specificity, so you get an arms race, and six months later nobody can change a colour without breaking three pages.

Legitimate uses: overriding inline styles you don't control (a third-party widget), and utility classes in a framework where the override is intentional and documented. Otherwise fix the specificity instead.
:::

# Cascade layers: the modern answer

`@layer` lets you declare priority explicitly, and layer order beats specificity entirely:

```css
@layer reset, base, components, utilities;

@layer reset {
  #very .specific #selector { margin: 0; }   /* 2-1-1 but still loses */
}

@layer utilities {
  .m-0 { margin: 0; }                        /* 0-1-0 and wins */
}
```

Any rule in a later layer beats any rule in an earlier layer, whatever the selectors. This finally solves "my framework's reset is overriding my component" without specificity hacks. Unlayered styles rank *above* all layers, which makes adopting layers gradually safe.

# Debugging: what to actually do

1. **Inspect the element.** DevTools' Styles pane lists every matching rule in cascade order, with overridden declarations struck through.
2. **Check Computed.** It shows the final value and, expanded, exactly which rule and file produced it.
3. Struck-through property? Something more specific or later won — it's shown right there above.
4. Rule not listed at all? Your **selector doesn't match**. Check spelling, check the element really has that class, check whether it's inside the parent you assumed.
5. Still nothing? Check the stylesheet actually loaded (Network tab, 404s) and that there's no syntax error above the rule — one unclosed brace kills everything after it.

:::gotcha The silent killer: one bad rule
```css
.header {
  color: blue
  background: white;   /* missing semicolon above */
}
.footer { color: grey; }  /* this still works */
```
CSS recovers at the next `}`, so a missing semicolon usually eats only the following declaration. But a missing `}` swallows every rule after it, and the browser says nothing. If a whole block of CSS is "not working", look for an unclosed brace above it.
:::

# Practical strategy

- **Keep specificity low and flat.** Prefer a single class: `.card-title`, not `.page .content .card h2`.
- **Don't style with ids.** 1-0-0 is nearly impossible to override cleanly.
- **Use `:where()`** for defaults meant to be overridden.
- **Let source order do the work.** Load resets first, components next, utilities last.
- **Reserve `!important`** for genuinely uncontrollable third-party CSS.

:::quiz
? Which selector wins: `#sidebar p` or `.content .post .text p`?
- `.content .post .text p`, it has more parts
- `#sidebar p` — one id beats any number of classes *
- Whichever is declared last
- They tie
> Specificity compares column by column: 1-0-1 vs 0-3-1. The id column decides it.

? `.parent { color: blue }` and `p { color: red }`. What colour is a `<p>` inside `.parent`?
- Blue, the parent is more specific
- Red — a direct match always beats an inherited value *
- Black
- Depends on source order
> Inherited values sit below every matching declaration, regardless of specificity.

? Two rules have identical specificity. Which applies?
- The first one
- The last one declared *
- The shorter one
- Neither
> Source order is the final tiebreaker — hence the "cascade".

? What is the main problem with `!important`?
- It is slow
- Only another `!important` can override it, so overrides escalate *
- It does not work in all browsers
- It breaks inheritance
> It removes your ability to reason about precedence and compounds over time.

? In `@layer reset, components;`, which wins?
- The more specific selector
- Anything in `components`, regardless of specificity *
- Whichever loads first
- The one with `!important` only
> Layer order outranks specificity — which is exactly why layers are useful.

? Your rule doesn't appear at all in DevTools' Styles pane. What does that mean?
- It was overridden
- The selector does not match this element (or the file failed to load) *
- It needs `!important`
- The property is invalid
> Overridden rules appear struck through. Absent means no match — check the selector and the file.
:::

:::exercise Predict, then verify
Write this and predict the colour before running it:

```html
<div id="box" class="card">
  <p class="text important">What colour am I?</p>
</div>
<style>
  p { color: black; }
  .text { color: blue; }
  .card .text { color: green; }
  #box p { color: purple; }
  .important { color: orange; }
</style>
```

Work out each score, decide, then check in DevTools. (`#box p` = 1-0-1 wins.) Now add `@layer` and see if you can make `.important` win without `!important`.
:::
