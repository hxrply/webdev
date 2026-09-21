A subquery is a query inside another query. They let you answer questions in steps — and CTEs let you write those steps in a readable order.

# Subqueries in WHERE

```sql run
-- Products priced above the average
SELECT name, price
FROM products
WHERE price > (SELECT AVG(price) FROM products)
ORDER BY price DESC;
```

The inner query returns a single value (a **scalar subquery**) that the outer query compares against. You couldn't write this with `WHERE price > AVG(price)` — aggregates aren't allowed in `WHERE`.

```sql run
-- Customers who have placed at least one order
SELECT name, country
FROM customers
WHERE id IN (SELECT customer_id FROM orders);
```

```sql run
-- …and those who haven't
SELECT name, country
FROM customers
WHERE id NOT IN (SELECT customer_id FROM orders WHERE customer_id IS NOT NULL);
```

:::warn NOT IN with NULLs returns nothing
If the subquery returns even one `NULL`, `NOT IN` evaluates to unknown for **every** row and you get an empty result — silently.

```sql
WHERE id NOT IN (SELECT customer_id FROM orders)   -- ✗ if any customer_id is NULL
```

Defend with `WHERE customer_id IS NOT NULL` in the subquery, or use `NOT EXISTS`, which handles NULLs correctly.
:::

# EXISTS

```sql run
-- Customers with at least one shipped order
SELECT c.name
FROM customers AS c
WHERE EXISTS (
  SELECT 1
  FROM orders AS o
  WHERE o.customer_id = c.id
    AND o.status = 'shipped'
);
```

```sql run
-- Customers with no orders at all — the NULL-safe anti-join
SELECT c.name
FROM customers AS c
WHERE NOT EXISTS (
  SELECT 1 FROM orders AS o WHERE o.customer_id = c.id
);
```

`EXISTS` asks only "are there any rows?" and stops at the first one — so `SELECT 1` is conventional; the columns are irrelevant.

This is a **correlated subquery**: it references `c.id` from the outer query, so it runs conceptually once per outer row. Query planners usually optimise this well, but it's worth knowing what you're asking for.

| For "is there a related row?" | Notes |
|---|---|
| `EXISTS` | NULL-safe, often fastest, reads clearly |
| `IN` | Fine for a small, NULL-free list |
| `JOIN` | Use when you also need columns from the other table |

# Subqueries in FROM

A subquery can stand in for a table — a **derived table**. This is how you aggregate, then filter or join on the result.

```sql run
SELECT
  customer_name,
  order_count
FROM (
  SELECT
    c.name          AS customer_name,
    COUNT(o.id)     AS order_count
  FROM customers AS c
  LEFT JOIN orders AS o ON o.customer_id = c.id
  GROUP BY c.id, c.name
)
WHERE order_count >= 2
ORDER BY order_count DESC;
```

# Subqueries in SELECT

```sql run
SELECT
  c.name,
  (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id)      AS orders,
  (SELECT MAX(o.ordered_on) FROM orders o WHERE o.customer_id = c.id) AS last_order
FROM customers AS c
ORDER BY orders DESC;
```

Convenient, and each one runs per row — so a page of 1,000 rows with three such subqueries can mean 3,000 extra queries. For more than a couple of values, a `LEFT JOIN … GROUP BY` is usually better.

# CTEs: the readable way

A **Common Table Expression** names a subquery up front with `WITH`, so complex queries read as a sequence of steps.

```sql run
WITH order_totals AS (
  SELECT
    o.id           AS order_id,
    o.customer_id,
    o.status,
    SUM(oi.quantity * oi.unit_price) AS total
  FROM orders AS o
  JOIN order_items AS oi ON oi.order_id = o.id
  GROUP BY o.id, o.customer_id, o.status
)
SELECT
  c.name,
  COUNT(*)              AS orders,
  ROUND(SUM(t.total),2) AS lifetime_value,
  ROUND(AVG(t.total),2) AS avg_order
FROM order_totals AS t
JOIN customers AS c ON c.id = t.customer_id
WHERE t.status <> 'cancelled'
GROUP BY c.id, c.name
ORDER BY lifetime_value DESC;
```

Compare that to the same logic as a nested subquery — the CTE version reads top to bottom: *first compute order totals, then summarise by customer.*

## Several CTEs

```sql run
WITH
order_totals AS (
  SELECT o.id, o.customer_id, SUM(oi.quantity * oi.unit_price) AS total
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status <> 'cancelled'
  GROUP BY o.id, o.customer_id
),
customer_stats AS (
  SELECT customer_id, COUNT(*) AS orders, SUM(total) AS lifetime
  FROM order_totals
  GROUP BY customer_id
),
average AS (
  SELECT AVG(lifetime) AS avg_lifetime FROM customer_stats
)
SELECT
  c.name,
  s.orders,
  ROUND(s.lifetime, 2) AS lifetime,
  ROUND((SELECT avg_lifetime FROM average), 2) AS company_average,
  CASE WHEN s.lifetime > (SELECT avg_lifetime FROM average)
       THEN 'above average' ELSE 'below average' END AS standing
FROM customer_stats AS s
JOIN customers AS c ON c.id = s.customer_id
ORDER BY s.lifetime DESC;
```

Each CTE can reference the ones defined before it. This is how genuinely complex reports stay maintainable: small named steps rather than five levels of nesting.

:::tip CTEs are for humans
The database usually produces the same plan for a CTE as for the equivalent subquery — modern PostgreSQL and SQLite inline them. So use them freely for clarity. (Historical note: before PostgreSQL 12, CTEs were an optimisation fence and could be slower. That's long fixed, but you'll still meet the folklore.)
:::

# Recursive CTEs

For hierarchies and sequences — an org chart, a category tree, a date range:

```sql run
WITH RECURSIVE numbers(n) AS (
  SELECT 1                       -- the anchor: where to start
  UNION ALL
  SELECT n + 1 FROM numbers WHERE n < 10    -- the recursive step
)
SELECT n, n * n AS squared FROM numbers;
```

```sql run
-- Generate a date series and count orders per day — including days with none
WITH RECURSIVE dates(d) AS (
  SELECT '2024-03-01'
  UNION ALL
  SELECT DATE(d, '+1 day') FROM dates WHERE d < '2024-03-07'
)
SELECT
  dates.d AS day,
  COUNT(o.id) AS orders
FROM dates
LEFT JOIN orders o ON o.ordered_on = dates.d
GROUP BY dates.d
ORDER BY dates.d;
```

That "generate a complete date series and LEFT JOIN to it" pattern is how you produce charts without gaps — otherwise days with no data simply vanish from the result.

:::warn Always bound your recursion
The `WHERE n < 10` is what stops it. Without a terminating condition, a recursive CTE runs until the database gives up or runs out of memory.
:::

# Set operations

```sql run
SELECT name FROM customers WHERE country = 'UK'
UNION
SELECT name FROM customers WHERE city = 'London';     -- duplicates removed
```

```sql run
SELECT country FROM customers
UNION ALL                                              -- keeps duplicates, faster
SELECT country FROM customers WHERE id < 3;
```

- `UNION` — combine and deduplicate (requires a sort, so it costs more)
- `UNION ALL` — combine, keep everything. **Prefer this** unless you need deduplication
- `INTERSECT` — rows in both
- `EXCEPT` — rows in the first but not the second

All require matching column counts and compatible types.

:::quiz
? Why does `NOT IN (subquery)` sometimes return nothing unexpectedly?
- It only works on numbers
- A NULL in the subquery makes the comparison unknown for every row *
- Subqueries can't be negated
- It needs DISTINCT
> `NOT EXISTS` handles NULLs correctly and is the safer default.

? What is a correlated subquery?
- One that returns several columns
- One that references a column from the outer query, so it runs per outer row *
- One inside a CTE
- One using UNION
> `EXISTS (SELECT 1 FROM o WHERE o.customer_id = c.id)` is the classic example.

? What is the main benefit of a CTE over a nested subquery?
- It is always faster
- Readability — named steps in the order you think about them *
- It allows recursion only
- It avoids joins
> Modern planners usually generate the same plan either way.

? When should you use UNION ALL instead of UNION?
- Never
- When duplicates are acceptable or impossible — it skips the deduplicating sort *
- When combining more than two queries
- When the columns differ
> UNION's implicit DISTINCT costs real time on large results.

? What does a recursive CTE need to avoid running forever?
- A LIMIT clause
- A terminating condition in the recursive step *
- An index
- UNION instead of UNION ALL
> Typically a `WHERE` that eventually stops producing rows.

? You need three aggregate values per customer in a list of 1,000. What's usually better than three subqueries in SELECT?
- Three separate queries
- A LEFT JOIN with GROUP BY *
- A recursive CTE
- UNION ALL
> Scalar subqueries in SELECT run once per row — here, 3,000 times.
:::

:::exercise Six subquery problems
1. Products priced above the average for their own category (correlated subquery).
2. Customers whose lifetime spend exceeds £300.
3. Products never ordered, using `NOT EXISTS`.
4. Each customer's most recent order date and its status.
5. A CTE pipeline: order totals → customer totals → the top 3 customers.
6. A recursive CTE producing every month of 2024, LEFT JOINed to order counts so empty months show 0.
:::
