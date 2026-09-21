`WHERE` decides which rows come back. It runs before `SELECT`, so it filters the raw table rows.

# Comparison operators

```sql run
SELECT name, country FROM customers WHERE country = 'UK';
```

```sql run
SELECT name, price FROM products WHERE price > 100;
```

| Operator | Meaning |
|---|---|
| `=` | Equal (**one** equals sign, not two) |
| `<>` or `!=` | Not equal |
| `<`, `>`, `<=`, `>=` | Ordering |
| `BETWEEN a AND b` | Inclusive range |
| `IN (…)` | Matches any in a list |
| `LIKE` | Pattern match |
| `IS NULL` / `IS NOT NULL` | Missing values |

# Combining conditions

```sql run
SELECT name, category, price, stock
FROM products
WHERE price < 100 AND stock > 20;
```

```sql run
SELECT name, country
FROM customers
WHERE country = 'UK' OR country = 'Finland';
```

:::gotcha AND binds tighter than OR
```sql
WHERE country = 'UK' OR country = 'USA' AND city = 'London'
```
reads as `country = 'UK' OR (country = 'USA' AND city = 'London')` — probably not what you meant. **Always parenthesise** when you mix them:
```sql
WHERE (country = 'UK' OR country = 'USA') AND city = 'London'
```
This silently returns wrong results rather than erroring, which makes it a genuinely dangerous bug.
:::

```sql run
-- Try removing the parentheses and see how the result changes
SELECT name, country, city
FROM customers
WHERE (country = 'UK' OR country = 'USA')
  AND joined >= '2024-01-01';
```

# IN and BETWEEN

```sql run
SELECT name, category, price
FROM products
WHERE category IN ('peripherals', 'audio');
```

```sql run
SELECT name, price
FROM products
WHERE price BETWEEN 30 AND 90;     -- inclusive of both ends
```

`IN` is far cleaner than a chain of `OR`s, and it works with a subquery — which the subqueries lesson covers.

```sql run
SELECT name, country
FROM customers
WHERE country NOT IN ('UK', 'USA');
```

# LIKE: pattern matching

```sql run
SELECT name FROM products WHERE name LIKE '%Monitor%';    -- contains
```

```sql run
SELECT name, email FROM customers WHERE email LIKE 'a%';   -- starts with 'a'
```

Two wildcards:

- `%` — any sequence of characters, including none
- `_` — exactly one character

```sql run
SELECT name FROM products WHERE name LIKE '___ %';   -- three chars, then a space
```

:::note Case sensitivity varies
In SQLite, `LIKE` is case-insensitive for ASCII by default. In PostgreSQL it is case-**sensitive** — use `ILIKE` there, or `LOWER(col) LIKE LOWER(?)`. MySQL depends on the column's collation. Check before relying on it.
:::

:::warn `LIKE '%term%'` cannot use an index
A leading wildcard forces a full table scan, because the database can't use a sorted index to find "ends with this". On a large table that's slow. For real text search use your database's full-text index (`tsvector` in PostgreSQL, `FTS5` in SQLite, `MATCH … AGAINST` in MySQL).
:::

# NULL, carefully

```sql run
SELECT name, city FROM customers WHERE city IS NULL;
```

```sql run
-- This returns NOTHING, even though a customer has no city:
SELECT name, city FROM customers WHERE city = NULL;
```

NULL means "unknown". `unknown = unknown` isn't true, it's *unknown* — and WHERE only keeps rows where the condition is definitively true. So `= NULL` matches nothing, ever.

The same logic catches people with negation:

```sql run
-- Customers NOT in London — but the NULL-city customer is missing!
SELECT name, city FROM customers WHERE city <> 'London';
```

```sql run
-- Include them explicitly
SELECT name, city FROM customers
WHERE city <> 'London' OR city IS NULL;
```

:::gotcha NULL disappears from negative filters
This is one of the most common sources of quietly wrong reports: "customers not in London" silently excludes everyone whose city is unknown. Whenever you write `<>`, `NOT IN` or `!=`, ask what should happen to NULLs — and handle them explicitly.

`NOT IN` is worse still: if the list contains a NULL, `NOT IN` returns no rows at all.
:::

# Filtering dates

```sql run
SELECT name, joined FROM customers WHERE joined >= '2024-01-01';
```

```sql run
SELECT id, ordered_on, status
FROM orders
WHERE ordered_on BETWEEN '2024-05-01' AND '2024-12-31'
ORDER BY ordered_on;
```

ISO-format dates (`YYYY-MM-DD`) compare correctly as strings — another reason that format is the right default everywhere.

```sql run
-- All orders in 2024
SELECT COUNT(*) AS orders_2024
FROM orders
WHERE STRFTIME('%Y', ordered_on) = '2024';
```

:::tip Avoid functions on the filtered column
`WHERE STRFTIME('%Y', ordered_on) = '2024'` forces the database to compute the function for **every row**, so no index on `ordered_on` can be used. The index-friendly version is a range:

```sql
WHERE ordered_on >= '2024-01-01' AND ordered_on < '2025-01-01'
```
Same answer, and it can use an index. This is a habit worth forming early.
:::

# Putting it together

```sql run
SELECT
  name,
  category,
  price,
  stock,
  CASE WHEN stock = 0 THEN 'reorder' ELSE 'ok' END AS action
FROM products
WHERE (category = 'peripherals' OR price < 50)
  AND stock < 70
ORDER BY stock;
```

```sql run
-- Customers who joined in 2024 and have a city recorded
SELECT name, city, country, joined
FROM customers
WHERE joined >= '2024-01-01'
  AND joined <  '2025-01-01'
  AND city IS NOT NULL
ORDER BY joined;
```

:::quiz
? Why does `WHERE city = NULL` return no rows?
- NULL is not a valid value
- Comparing to NULL yields "unknown", which WHERE treats as not true *
- You need quotes around NULL
- It only works with strings
> Use `IS NULL` / `IS NOT NULL`.

? `WHERE a = 1 OR b = 2 AND c = 3` is interpreted as?
- `(a = 1 OR b = 2) AND c = 3`
- `a = 1 OR (b = 2 AND c = 3)` *
- Left to right
- An error
> AND binds tighter than OR. Parenthesise whenever you mix them.

? Why is `LIKE '%term%'` slow on large tables?
- LIKE is always slow
- A leading wildcard prevents the use of an index, forcing a full scan *
- It is case-insensitive
- It returns too many rows
> Use full-text search for real text queries.

? `WHERE status <> 'shipped'` on a table where some statuses are NULL. What happens to those rows?
- They are included
- They are excluded *
- They cause an error
- They are returned as NULL
> Add `OR status IS NULL` if you want them.

? Which is more index-friendly?
- `WHERE STRFTIME('%Y', d) = '2024'`
- `WHERE d >= '2024-01-01' AND d < '2025-01-01'` *
- They are identical
- Neither can use an index
> Wrapping the column in a function disables index use.

? What does `BETWEEN 30 AND 90` include?
- 31 to 89
- 30 to 90 inclusive *
- 30 to 89
- Depends on the database
> BETWEEN is inclusive at both ends — which matters for date ranges especially.
:::

:::exercise Ten filters
Write queries for:

1. Products costing more than £50.
2. Customers in the UK who joined before 2024.
3. Products with zero stock.
4. Orders that are not cancelled (careful with NULLs).
5. Products whose name contains "Monitor".
6. Customers whose email starts with a letter before 'k'.
7. Products priced between £30 and £90 in the peripherals category.
8. Customers with no city recorded.
9. Orders placed in the second half of 2024, using an index-friendly range.
10. Products that are either out of stock **or** cost over £400.
:::
