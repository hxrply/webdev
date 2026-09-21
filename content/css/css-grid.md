Grid is CSS's two-dimensional layout system: rows *and* columns at the same time. Flexbox distributes items along one axis; Grid places them in a matrix you define. They're complements, not rivals — page structure in Grid, component internals in Flexbox, most of the time.

# A first grid

```html run title="Columns and rows"
<div class="grid">
  <div>1</div><div>2</div><div>3</div>
  <div>4</div><div>5</div><div>6</div>
</div>

<style>
  body { font-family: system-ui; }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;   /* three equal columns */
    gap: 10px;
  }
  .grid > div {
    background: #805ad5; color: white;
    padding: 20px; border-radius: 6px; text-align: center;
  }
</style>
```

The `fr` unit means "one share of the free space". `1fr 1fr 1fr` is three equal columns; `2fr 1fr` gives the first twice the width of the second. Unlike percentages, `fr` accounts for `gap` automatically — no `calc(33.33% - 20px)` arithmetic.

# Defining tracks

```css
.grid {
  grid-template-columns: 200px 1fr 200px;        /* fixed, flexible, fixed */
  grid-template-columns: repeat(4, 1fr);         /* four equal */
  grid-template-columns: repeat(2, 200px 1fr);   /* repeats a pattern */
  grid-template-columns: minmax(150px, 1fr) 2fr; /* never below 150px */
  grid-template-rows: auto 1fr auto;             /* header, body, footer */

  gap: 16px;              /* both directions */
  gap: 24px 16px;         /* row-gap column-gap */
}
```

`minmax(min, max)` is the workhorse: `minmax(0, 1fr)` is the fix for grid items that refuse to shrink (same `min-width: auto` issue as Flexbox).

# The responsive grid with no media queries

```html run title="auto-fit + minmax — resize the preview"
<div class="cards">
  <div>Card 1</div><div>Card 2</div><div>Card 3</div>
  <div>Card 4</div><div>Card 5</div>
</div>

<style>
  body { font-family: system-ui; }
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;
  }
  .cards > div {
    background: #805ad5; color: white; padding: 24px 12px;
    border-radius: 8px; text-align: center;
  }
</style>
```

Read it as: *"as many columns as fit, each at least 160px, sharing leftover space equally."* Drag the divider between editor and preview — the columns reflow on their own. This single line replaces a stack of breakpoints and is probably the most useful thing in this lesson.

:::tip auto-fit vs auto-fill
With few items and lots of space: **`auto-fit`** expands the existing items to fill the row; **`auto-fill`** keeps the empty tracks, leaving a gap at the end. `auto-fit` is usually what you want for card grids.
:::

# Placing items explicitly

```html run title="Spanning rows and columns"
<div class="layout">
  <header>header</header>
  <nav>nav</nav>
  <main>main</main>
  <aside>aside</aside>
  <footer>footer</footer>
</div>

<style>
  body { font-family: system-ui; font-size: 13px; }
  .layout {
    display: grid;
    grid-template-columns: 120px 1fr 120px;
    grid-template-rows: auto 1fr auto;
    gap: 8px;
    min-height: 230px;
  }
  .layout > * { background: #e9d8fd; padding: 10px; border-radius: 6px; }

  header { grid-column: 1 / -1; }         /* first line to last line */
  footer { grid-column: 1 / -1; }
  nav    { grid-row: 2; grid-column: 1; }
  main   { grid-row: 2; grid-column: 2; }
  aside  { grid-row: 2; grid-column: 3; }
</style>
```

Grid positions are given in **line numbers**, not track numbers. A three-column grid has four vertical lines. `grid-column: 1 / -1` means "from the first line to the last" — a span across everything, whatever the column count.

```css
.item { grid-column: 2 / 4; }     /* from line 2 to line 4 (two tracks) */
.item { grid-column: span 2; }    /* two tracks from wherever it lands */
.item { grid-row: 1 / span 3; }   /* start at row line 1, cover three rows */
```

# Named areas: layout you can read

```html run title="grid-template-areas"
<div class="page">
  <header>header</header>
  <nav>nav</nav>
  <main>main</main>
  <aside>aside</aside>
  <footer>footer</footer>
</div>

<style>
  body { font-family: system-ui; font-size: 13px; }
  .page {
    display: grid;
    grid-template-columns: 110px 1fr 110px;
    grid-template-rows: auto 1fr auto;
    grid-template-areas:
      "header header header"
      "nav    main   aside"
      "footer footer footer";
    gap: 8px;
    min-height: 220px;
  }
  header { grid-area: header; }
  nav    { grid-area: nav; }
  main   { grid-area: main; }
  aside  { grid-area: aside; }
  footer { grid-area: footer; }

  .page > * { background: #e9d8fd; padding: 10px; border-radius: 6px; }
</style>
```

The `grid-template-areas` block is an ASCII diagram of your layout. Restructuring for mobile then becomes obvious:

```css
@media (max-width: 600px) {
  .page {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "main"
      "nav"
      "aside"
      "footer";
  }
}
```

Use a `.` for an intentionally empty cell. Every row string must have the same number of columns, and areas must form rectangles.

# Alignment in Grid

Grid has both axes, so it has two of everything:

```css
.grid {
  justify-items: center;   /* items within their cell, inline axis */
  align-items: center;     /* items within their cell, block axis */
  place-items: center;     /* shorthand for both */

  justify-content: center; /* the whole grid within the container */
  align-content: center;
  place-content: center;
}

.item {
  justify-self: end;       /* one item, overriding justify-items */
  align-self: start;
}
```

```html run title="The two-line centring trick"
<div class="centre"><div class="thing">place-items: center</div></div>

<style>
  body { font-family: system-ui; }
  .centre { display: grid; place-items: center; height: 170px; background: #faf5ff; }
  .thing { background: #805ad5; color: white; padding: 16px 22px; border-radius: 8px; }
</style>
```

# Subgrid

When a child grid should align to its parent's tracks — card titles lining up across a row even with different content lengths:

```css
.card {
  grid-column: span 3;
  display: grid;
  grid-template-columns: subgrid;   /* inherit the parent's column lines */
}
```

Supported in all current browsers. It solves a problem that previously required fixed heights or JavaScript.

# Grid or Flexbox?

| Use Grid when | Use Flexbox when |
|---|---|
| You need rows **and** columns | It's one direction |
| The layout is defined by the container | Sizes are defined by the content |
| Items should align across both axes | Items should distribute along a line |
| Page structure, dashboards, galleries | Nav bars, button groups, card internals |

They nest happily: a Grid page layout containing a card that is a Flex column containing a Flex footer row. That's a completely normal structure.

:::gotcha Grid items overflowing
Same cause as in Flexbox: a grid item's `min-width` is `auto`, so it won't shrink below its content. A long string or a wide table then stretches the track.

```css
.grid { grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); }
/* or */
.item { min-width: 0; overflow: hidden; }
```
:::

:::quiz
? What does `repeat(auto-fit, minmax(200px, 1fr))` do?
- Creates exactly 200px columns
- Fits as many columns as possible, each at least 200px, sharing spare space *
- Repeats the grid automatically on scroll
- Creates 200 columns
> The responsive grid in one line, no media queries needed.

? A three-column grid has how many vertical grid lines?
- Three
- Four *
- Two
- Six
> Lines are the edges, so it's always tracks + 1. `grid-column: 1 / -1` spans them all.

? Which spans an item across every column, whatever the column count?
- `grid-column: span all`
- `grid-column: 1 / -1` *
- `width: 100%`
- `grid-column: 1 / 3`
> `-1` refers to the last line, so it adapts if the column count changes.

? Grid or Flexbox for a nav bar of links?
- Grid, because it is newer
- Flexbox — one axis, sizes driven by content *
- Either is equally idiomatic
- Neither; use float
> Grid shines when you're defining a two-dimensional structure up front.

? What does `place-items: center` do?
- Centres the grid container on the page
- Sets both `align-items` and `justify-items` to center *
- Centres only horizontally
- Centres text inside items
> `place-content` is the equivalent shorthand for distributing the whole grid.

? Why might a grid column stretch wider than its `1fr` share?
- fr units are unreliable
- An item's content can't shrink below its minimum size — use `minmax(0, 1fr)` *
- The gap is too large
- Grid ignores overflow
> Exactly the same `min-width: auto` trap as Flexbox.
:::

:::exercise Build a dashboard
Using named areas, build: a full-width header, a 200px sidebar, a main area, and a footer. Below 700px, restack it into a single column with the sidebar after the main content. Then put a `repeat(auto-fit, minmax(180px, 1fr))` card grid inside the main area and confirm both grids behave independently.
:::
