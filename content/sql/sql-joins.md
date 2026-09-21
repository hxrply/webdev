Data lives in separate tables so it isn't duplicated. `JOIN` is how you put it back together for a query. This is the lesson where SQL clicks — or doesn't — so we'll take it slowly.

# The mental model

A join **matches rows from two tables** using a condition, producing a combined row for every match.

```text
orders                          customers
id    customer_id               id   name
1001  1          ─────────────→ 1    Ada Lovelace
1002  2          ─────────────→ 2    Grace Hopper
1003  1          ─────────────↗
```

```sql run
SELECT
  o.id        AS order_id,
  o.ordered_on,
  c.name      AS customer,
  c.country
FROM orders AS o
JOIN customers AS c ON c.id = o.customer_id
ORDER BY o.id;
```

Read it as: *take each order, find the customer whose `id` matches its `customer_id`, and give me columns from both.*

The `ON` clause is the matching rule. Aliases (`o`, `c`) save typing and make it clear which table each column comes from.

# INNER JOIN: only matches

```sql run
SELECT c.name, o.id AS order_id, o.status
FROM customers AS c
INNER JOIN orders AS o ON o.customer_id = c.id
ORDER BY c.name;
```

`JOIN` and `INNER JOIN` are the same thing. It returns **only rows that match on both sides**. Notice who's missing from that result: Radia Perlman has no orders, so she doesn't appear at all.

# LEFT JOIN: keep everything on the left

```sql run
SELECT
  c.name,
  o.id     AS order_id,
  o.status
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.id
ORDER BY c.name;
```

Now every customer appears. Those with no orders get `NULL` in the order columns. That's the defining behaviour of a `LEFT JOIN`: **all rows from the left table, plus matches from the right where they exist.**

This is how you answer "who has no orders?":

```sql run
SELECT c.name, c.country
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.id
WHERE o.id IS NULL;                  -- no match was found
```

That "LEFT JOIN … WHERE right.id IS NULL" pattern — an **anti-join** — finds records *without* related records. Customers with no orders, products never sold, users who never logged in.

:::gotcha Putting a right-table condition in WHERE kills your LEFT JOIN
```sql
-- Intended: all customers, with their shipped orders
SELECT c.name, o.id
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.status = 'shipped';          -- ✗ silently becomes an INNER JOIN
```
Rows with no match have `o.status = NULL`, and `NULL = 'shipped'` isn't true — so they're filtered out, and you've lost exactly the rows the LEFT JOIN was preserving.

**The fix: put the condition in the `ON` clause.**
```sql
LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'shipped'   -- ✓
```
Conditions on the *left* table still belong in `WHERE`. This distinction is subtle, extremely common, and produces wrong numbers rather than errors.
:::

```sql run
-- Correct: every customer, plus their shipped orders if any
SELECT c.name, o.id AS shipped_order
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.id AND o.status = 'shipped'
ORDER BY c.name;
```

# The join types

| Type | Returns |
|---|---|
| `INNER JOIN` | Only rows matching in both tables |
| `LEFT JOIN` | All left rows + matching right rows (NULLs where none) |
| `RIGHT JOIN` | All right rows + matching left rows |
| `FULL OUTER JOIN` | All rows from both sides |
| `CROSS JOIN` | Every combination (Cartesian product) |

In practice: **INNER and LEFT cover well over 95% of real queries.** `RIGHT JOIN` is just a LEFT JOIN with the tables swapped, and swapping is clearer. (SQLite supports RIGHT and FULL only in recent versions.)

# Joining three or more tables

```sql run
SELECT
  o.id            AS order_id,
  o.ordered_on,
  c.name          AS customer,
  p.name          AS product,
  oi.quantity,
  oi.unit_price,
  ROUND(oi.quantity * oi.unit_price, 2) AS line_total
FROM orders AS o
JOIN customers   AS c  ON c.id = o.customer_id
JOIN order_items AS oi ON oi.order_id = o.id
JOIN products    AS p  ON p.id = oi.product_id
ORDER BY o.id, p.name;
```

Each `JOIN` adds one table and one `ON` condition. Build these **one join at a time**, running the query after each addition — if the row count explodes, you know exactly which join did it.

# Joins with aggregates

```sql run
SELECT
  c.name,
  c.country,
  COUNT(DISTINCT o.id)                              AS orders,
  ROUND(SUM(oi.quantity * oi.unit_price), 2)        AS lifetime_value
FROM customers AS c
LEFT JOIN orders      AS o  ON o.customer_id = c.id AND o.status <> 'cancelled'
LEFT JOIN order_items AS oi ON oi.order_id = o.id
GROUP BY c.id, c.name, c.country
ORDER BY lifetime_value DESC NULLS LAST;
```

Three things to notice:

1. **`LEFT JOIN`** so customers with no orders still appear (with 0 / NULL).
2. **`COUNT(DISTINCT o.id)`** because joining to `order_items` repeats each order once per line item.
3. **The status filter is in `ON`**, not `WHERE`, preserving the LEFT JOIN.

```sql run
-- Products never ordered (anti-join)
SELECT p.name, p.category, p.price
FROM products AS p
LEFT JOIN order_items AS oi ON oi.product_id = p.id
WHERE oi.id IS NULL;
```

# Self joins

A table joined to itself — for hierarchies (employee → manager) or comparing rows to each other.

```sql run
-- Pairs of customers in the same city
SELECT
  a.name AS customer_a,
  b.name AS customer_b,
  a.city
FROM customers AS a
JOIN customers AS b
  ON a.city = b.city
 AND a.id < b.id                  -- avoids self-pairs and mirrored duplicates
WHERE a.city IS NOT NULL;
```

The `a.id < b.id` condition is the standard trick: without it you'd get every customer paired with themselves, plus each pair twice in both orders.

# Row multiplication

The number-one surprise for beginners:

```sql run
SELECT COUNT(*) AS order_rows FROM orders;
```

```sql run
SELECT COUNT(*) AS rows_after_join
FROM orders AS o
JOIN order_items AS oi ON oi.order_id = o.id;
```

Ten orders become seventeen rows, because each order matches several items. Every order's date and status is repeated once per item.

**This is correct behaviour**, not a bug — but if you then `SUM(o.some_amount)`, you'll sum it multiple times per order and get an inflated total. The defences: aggregate with `DISTINCT`, or aggregate in a subquery before joining (next lesson).

:::warn A missing ON clause is a Cartesian product
```sql
SELECT * FROM orders, customers;      -- 10 × 8 = 80 rows
```
Every row paired with every row. On two tables of 10,000 rows, that's 100 million rows and a very unhappy database. If a query suddenly returns an absurd number of rows or hangs, check that every join has an `ON`.
:::

# USING and NATURAL JOIN

```sql run
-- When the column names match exactly
SELECT o.id, oi.quantity
FROM orders AS o
JOIN order_items AS oi ON oi.order_id = o.id
LIMIT 5;
```

`USING (column_name)` is shorthand when both tables use the same column name. **`NATURAL JOIN`** — which joins on every identically-named column automatically — should be avoided: adding a `created_at` column to both tables silently changes what your query means.

:::quiz
? Which join keeps rows from the left table that have no match?
- INNER JOIN
- LEFT JOIN *
- CROSS JOIN
- JOIN
> Unmatched left rows come back with NULLs for the right table's columns.

? You LEFT JOIN orders and add `WHERE o.status = 'shipped'`. What happens?
- All customers are still returned
- It behaves like an INNER JOIN, dropping customers with no orders *
- It returns an error
- Only cancelled orders are dropped
> Move the condition into the ON clause to preserve the outer join.

? How do you find customers with no orders?
- `WHERE orders IS NULL`
- LEFT JOIN, then `WHERE o.id IS NULL` *
- INNER JOIN with NOT
- CROSS JOIN
> The anti-join pattern — also expressible with `NOT EXISTS`.

? Joining orders to order_items returns more rows than there are orders. Why?
- A bug in the join
- Each order matches several items, so its row repeats per match *
- Duplicate primary keys
- The ON clause is wrong
> Use COUNT(DISTINCT …) or aggregate before joining.

? What does a join with no ON clause produce?
- An error
- Every combination of rows from both tables *
- An empty result
- An inner join on primary keys
> A Cartesian product — catastrophic on large tables.

? Why add `a.id < b.id` to a self join?
- For performance
- To avoid pairing rows with themselves and producing each pair twice *
- It is required syntax
- To sort the results
> A standard idiom for "all distinct pairs".
:::

:::exercise Eight joins
1. Every order with its customer's name and country.
2. Every customer with their number of orders, including those with zero.
3. All line items with product name and customer name.
4. Total revenue per customer, excluding cancelled orders.
5. Products that have never been ordered.
6. The most recent order for each customer.
7. Customers who have ordered from more than one category.
8. Orders where the `unit_price` differs from the product's current `price` (the price changed since).
:::
