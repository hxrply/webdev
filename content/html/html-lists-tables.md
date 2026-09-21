Lists and tables are how you present structured information. Both are frequently misused — lists for layout, tables for layout, tables without headers — so getting them right puts you ahead of a lot of production code.

# Lists

Three kinds, each meaning something different.

```html run title="The three list types"
<h3>Unordered — order doesn't matter</h3>
<ul>
  <li>Flour</li>
  <li>Water</li>
  <li>Salt</li>
</ul>

<h3>Ordered — sequence is meaningful</h3>
<ol>
  <li>Mix the dough</li>
  <li>Rest for 30 minutes</li>
  <li>Fold four times</li>
</ol>

<h3>Description — term and definition pairs</h3>
<dl>
  <dt>Hydration</dt>
  <dd>The ratio of water to flour, by weight.</dd>
  <dt>Autolyse</dt>
  <dd>A rest period after mixing flour and water, before adding salt.</dd>
</dl>
```

Only `<li>` may be a direct child of `<ul>` or `<ol>`. Put anything else — a `<div>`, a stray `<p>` — directly inside and it is invalid.

## Nesting

Nested lists go **inside the `<li>`**, not between them:

```html run title="Nested list, done correctly"
<ul>
  <li>Dry ingredients
    <ul>
      <li>Flour</li>
      <li>Salt</li>
    </ul>
  </li>
  <li>Wet ingredients
    <ul>
      <li>Water</li>
    </ul>
  </li>
</ul>
```

## Useful attributes

```html run title="Ordered list controls"
<ol start="5">
  <li>Fifth step</li>
  <li>Sixth step</li>
</ol>

<ol type="a">
  <li>Alpha</li>
  <li>Bravo</li>
</ol>

<ol reversed>
  <li>Third place</li>
  <li>Second place</li>
  <li>First place</li>
</ol>
```

:::tip Lists are everywhere, including where you don't see them
Navigation menus, tag clouds, breadcrumbs and card galleries are all lists of things. Marking them up as `<ul>` and removing the bullets with `list-style: none` is correct and helpful: screen readers announce "list, 6 items", which is real information. A pile of `<div>`s announces nothing.
:::

# Tables

Tables are for **tabular data** — information with a genuine row/column relationship. They were abused for page layout throughout the 1990s, which gave them a bad reputation; that reputation should not stop you using them for actual tables. A spreadsheet-shaped thing belongs in a table.

```html run title="A properly structured table"
<table>
  <caption>Quarterly revenue by region (£000s)</caption>
  <thead>
    <tr>
      <th scope="col">Region</th>
      <th scope="col">Q1</th>
      <th scope="col">Q2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">North</th>
      <td>120</td>
      <td>145</td>
    </tr>
    <tr>
      <th scope="row">South</th>
      <td>98</td>
      <td>102</td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <th scope="row">Total</th>
      <td>218</td>
      <td>247</td>
    </tr>
  </tfoot>
</table>

<style>
  table { border-collapse: collapse; }
  th, td { border: 1px solid #ccc; padding: 6px 12px; text-align: left; }
  caption { text-align: left; font-weight: 600; padding-bottom: 6px; }
</style>
```

The parts:

| Element | Purpose |
|---|---|
| `<caption>` | The table's title. First child of `<table>`. Announced by screen readers before the data. |
| `<thead>` / `<tbody>` / `<tfoot>` | Groups of rows. Let browsers repeat headers when printing long tables. |
| `<tr>` | A row |
| `<th>` | A header cell |
| `<td>` | A data cell |
| `scope="col"` / `scope="row"` | **Which cells this header describes** |

:::warn `scope` is what makes a table accessible
A sighted reader sees that "120" sits under "Q1" and beside "North". A screen-reader user gets cells read one at a time. With `scope` set, the software announces "North, Q1, 120" — the cell plus its headers. Without it, they hear "120" and have to reconstruct the grid from memory. Two attributes; enormous difference.
:::

## Spanning cells

```html run title="colspan and rowspan"
<table border="1" cellpadding="6" style="border-collapse:collapse">
  <tr>
    <th scope="col">Day</th>
    <th scope="col" colspan="2">Sessions</th>
  </tr>
  <tr>
    <th scope="row" rowspan="2">Monday</th>
    <td>Morning</td>
    <td>Intro to HTML</td>
  </tr>
  <tr>
    <td>Afternoon</td>
    <td>CSS layout</td>
  </tr>
</table>
```

`colspan` stretches a cell across columns, `rowspan` down rows. Note how the second body row has only two cells — the `rowspan` cell from the row above is still occupying the first column. Miscounting here is the classic source of mangled tables.

## Making tables work on small screens

Tables do not shrink gracefully. The most robust fix is to let them scroll horizontally rather than squashing them:

```html run title="A responsive table wrapper"
<div class="table-scroll" tabindex="0" role="region" aria-label="Revenue table">
  <table>
    <tr><th>Region</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th><th>Total</th></tr>
    <tr><td>North</td><td>120</td><td>145</td><td>131</td><td>160</td><td>556</td></tr>
  </table>
</div>

<style>
  .table-scroll { overflow-x: auto; max-width: 300px; border: 1px solid #ddd; }
  table { border-collapse: collapse; }
  th, td { padding: 6px 12px; border: 1px solid #eee; white-space: nowrap; }
</style>
```

`tabindex="0"` matters: a scrollable region must be reachable by keyboard, or keyboard users cannot scroll it.

:::gotcha Don't use tables for layout
It sounds obvious, but email templates still do it and the habit leaks. Layout tables confuse screen readers (which announce "table with 3 columns" for what is visually just a sidebar), resist responsive design, and are far harder to maintain than Grid or Flexbox. Use CSS for layout, `<table>` for data.
:::

:::quiz
? Which is valid as a direct child of `<ul>`?
- `<div>`
- `<p>`
- `<li>` *
- `<span>`
> Only `<li>` (and script/template) may be direct children. Other content goes inside an `<li>`.

? What does `scope="row"` do on a `<th>`?
- Makes the header bold
- Tells assistive tech that this header describes the cells in its row *
- Spans the header across the row
- Freezes the row when scrolling
> It's the association between headers and data that makes a table navigable non-visually. Use `colspan` for spanning.

? You want a nav menu with no bullets. What is the best markup?
- A series of `<div>`s
- A `<ul>` of `<li>`s with `list-style: none` in CSS *
- A `<table>` with one row
- `<p>` tags separated by `<br>`
> The list semantics still help ("list, 6 items"). Removing the bullet is purely visual.

? Where must `<caption>` appear?
- After `</table>`
- As the first child of `<table>` *
- Inside `<thead>`
- Anywhere inside the table
> It must come first, and it's announced before the data — a genuinely useful orientation cue.

? Why is a `<div>`-based grid a bad substitute for a data table?
- It is slower to render
- It loses the row/column relationships assistive tech relies on *
- Divs cannot be styled into a grid
- It breaks in older browsers
> Visual alignment is not structure. Screen readers need the real table semantics.
:::

:::exercise Build a real table
Mark up a small timetable or price list with: a `<caption>`, `<thead>` and `<tbody>`, `scope` on every header, and at least one `colspan`. Then wrap it in a scrollable region and shrink your window to check it doesn't burst the layout.
:::
