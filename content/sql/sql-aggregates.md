Aggregate functions collapse many rows into one value. `GROUP BY` does it per group. Together they turn raw rows into answers.

# The aggregate functions

```sql run
SELECT
  COUNT(*)          AS total_products,
  SUM(stock)        AS total_stock,
  ROUND(AVG(price), 2) AS average_price,
  MIN(price)        AS cheapest,
  MAX(price)        AS dearest
FROM products;
```

| Function | Returns |
|---|---|
| `COUNT(*)` | Number of rows |
| `COUNT(column)` | Number of rows where that column is **not NULL** |
| `COUNT(DISTINCT col)` | Number of distinct non-NULL values |
| `SUM(col)` | Total |
| `AVG(col)` | Mean — **ignores NULLs** |
| `MIN` / `MAX` | Smallest / largest |

:::gotcha COUNT(*) vs COUNT(column)
```sql
SELECT COUNT(*), COUNT(city) FROM customers;
```
Run it: 8 and 7. `COUNT(*)` counts rows; `COUNT(city)` counts rows where `city` isn't NULL. The same applies to `AVG` — a NULL price is *excluded* from the average rather than counted as zero, which can be either exactly right or badly wrong depending on what you meant.
:::

```sql run
SELECT COUNT(*) AS rows, COUNT(city) AS with_city, COUNT(DISTINCT country) AS countries
FROM customers;
```

# GROUP BY

Without it, aggregates collapse the whole table to one row. With it, you get one row per group.

```sql run
SELECT
  category,
  COUNT(*)              AS products,
  ROUND(AVG(price), 2)  AS avg_price,
  SUM(stock)            AS total_stock
FROM products
GROUP BY category
ORDER BY products DESC;
```

```sql run
SELECT country, COUNT(*) AS customers
FROM customers
GROUP BY country
ORDER BY customers DESC;
```

## The rule everyone breaks first

**Every column in the `SELECT` list must either be in the `GROUP BY` or be inside an aggregate function.**

```sql
-- Wrong: which name? There are several per category.
SELECT category, name, COUNT(*) FROM products GROUP BY category;
```

PostgreSQL rejects that outright. SQLite and older MySQL silently pick an *arbitrary* row's value — which is worse, because you get plausible-looking nonsense. If you want the name of the most expensive product per category, that's a window function or a join, not a stray column.

# Grouping by several columns

```sql run
SELECT
  country,
  city,
  COUNT(*) AS customers
FROM customers
GROUP BY country, city
ORDER BY country, customers DESC;
```

One row per unique *combination*. Note the NULL city forms its own group — for grouping purposes, NULLs are treated as equal to each other, even though `NULL = NULL` is unknown in a WHERE clause. An inconsistency, but a useful one.

# HAVING: filtering groups

```sql run
SELECT
  category,
  COUNT(*)             AS products,
  ROUND(AVG(price), 2) AS avg_price
FROM products
GROUP BY category
HAVING COUNT(*) > 1
ORDER BY products DESC;
```

**`WHERE` filters rows before grouping. `HAVING` filters groups after.** That difference is the single most-asked SQL interview question.

```sql run
SELECT
  category,
  COUNT(*)   AS in_stock_products,
  SUM(stock) AS units
FROM products
WHERE stock > 0                -- first: drop out-of-stock rows
GROUP BY category
HAVING SUM(stock) > 50         -- then: keep only well-stocked categories
ORDER BY units DESC;
```

You can't use an aggregate in `WHERE` — at that point the groups don't exist yet. `WHERE COUNT(*) > 1` is always an error.

# Conditional aggregation

A genuinely useful trick: aggregate *selectively* by putting a `CASE` inside the function.

```sql run
SELECT
  COUNT(*)                                              AS total_orders,
  SUM(CASE WHEN status = 'shipped'   THEN 1 ELSE 0 END) AS shipped,
  SUM(CASE WHEN status = 'pending'   THEN 1 ELSE 0 END) AS pending,
  SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
  ROUND(100.0 * SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) / COUNT(*), 1) AS pct_shipped
FROM orders;
```

That's a pivot table in one query — counts across categories as *columns* rather than rows. Note `100.0` rather than `100`: integer division would truncate the percentage to 0.

```sql run
-- Orders per year, as columns
SELECT
  SUM(CASE WHEN STRFTIME('%Y', ordered_on) = '2024' THEN 1 ELSE 0 END) AS in_2024,
  SUM(CASE WHEN STRFTIME('%Y', ordered_on) = '2025' THEN 1 ELSE 0 END) AS in_2025
FROM orders;
```

# Real questions

```sql run
-- Revenue by product, from the line items
SELECT
  p.name,
  SUM(oi.quantity)                      AS units_sold,
  ROUND(SUM(oi.quantity * oi.unit_price), 2) AS revenue
FROM order_items AS oi
JOIN products AS p ON p.id = oi.product_id
GROUP BY p.id, p.name
ORDER BY revenue DESC;
```

```sql run
-- Order totals, and which are large
SELECT
  o.id,
  o.ordered_on,
  o.status,
  COUNT(oi.id)                                AS line_items,
  ROUND(SUM(oi.quantity * oi.unit_price), 2)  AS order_total
FROM orders AS o
JOIN order_items AS oi ON oi.order_id = o.id
GROUP BY o.id, o.ordered_on, o.status
HAVING SUM(oi.quantity * oi.unit_price) > 200
ORDER BY order_total DESC;
```

```sql run
-- Monthly order counts and revenue
SELECT
  STRFTIME('%Y-%m', o.ordered_on)            AS month,
  COUNT(DISTINCT o.id)                       AS orders,
  ROUND(SUM(oi.quantity * oi.unit_price), 2) AS revenue
FROM orders AS o
JOIN order_items AS oi ON oi.order_id = o.id
WHERE o.status <> 'cancelled'
GROUP BY month
ORDER BY month;
```

Note `COUNT(DISTINCT o.id)` in that last one: because joining to `order_items` multiplies each order row by its number of items, a plain `COUNT(*)` would count line items, not orders. This is an easy and common mistake once joins and aggregates meet.

# The evaluation order, again

```text
FROM      → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT
```

Which explains:

- `WHERE` can't use aggregates (groups don't exist yet).
- `HAVING` can (they do).
- `ORDER BY` can use SELECT aliases; `WHERE` and `GROUP BY` generally can't.

:::quiz
? What is the difference between WHERE and HAVING?
- None, they are interchangeable
- WHERE filters rows before grouping; HAVING filters groups after *
- HAVING is faster
- WHERE only works on text
> Which is why aggregates are legal in HAVING but not in WHERE.

? `COUNT(*)` returns 8, `COUNT(city)` returns 7. Why?
- A duplicate city
- One row has a NULL city, and COUNT(column) skips NULLs *
- COUNT(*) includes the header
- A bug
> `AVG` and `SUM` ignore NULLs the same way.

? Which is invalid?
- `SELECT category, COUNT(*) FROM products GROUP BY category`
- `SELECT category, name, COUNT(*) FROM products GROUP BY category` *
- `SELECT COUNT(*) FROM products`
- `SELECT category FROM products GROUP BY category`
> Every selected column must be grouped or aggregated. Some databases let this slide and return arbitrary values.

? `100 * shipped / total` returns 0 for a real fraction. Why?
- Operator precedence
- Integer division truncates — use `100.0` *
- COUNT returns text
- You need ROUND
> Forcing one operand to a float fixes it.

? You join orders to order_items and `COUNT(*)`. What are you counting?
- Orders
- Line items, because the join multiplies rows *
- Products
- Customers
> Use `COUNT(DISTINCT o.id)` for the number of orders.

? Where do NULLs go in a GROUP BY?
- They are excluded
- They form a single group of their own *
- They cause an error
- One group per NULL
> Grouping treats NULLs as equal to each other, unlike WHERE comparisons.
:::

:::exercise Answer six business questions
1. How many customers are in each country?
2. What is the average product price per category, to 2 decimals?
3. Which categories contain more than one product?
4. Total revenue per order status (excluding cancelled from revenue).
5. How many orders did each customer place? (Include customers with none — you'll need a LEFT JOIN from the next lesson.)
6. A single row showing total orders, shipped count, pending count and the percentage shipped.
:::
