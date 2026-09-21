Results come back in no guaranteed order unless you ask for one. `ORDER BY` asks.

# ORDER BY

```sql run
SELECT name, price FROM products ORDER BY price;          -- ascending by default
```

```sql run
SELECT name, price FROM products ORDER BY price DESC;     -- highest first
```

```sql run
-- Multiple keys: category alphabetically, then price descending within each
SELECT name, category, price
FROM products
ORDER BY category ASC, price DESC;
```

:::warn Without ORDER BY, order is undefined
Rows may *appear* sorted — often by insertion order — but that is an accident of storage, not a promise. Add an index, change the query plan, or upgrade the database, and the order can change without warning. **If order matters, say so explicitly.**
:::

# Sorting by expressions and aliases

```sql run
SELECT
  name,
  price,
  stock,
  price * stock AS inventory_value
FROM products
ORDER BY inventory_value DESC;     -- aliases work here, because ORDER BY runs after SELECT
```

```sql run
SELECT name, price FROM products
ORDER BY LENGTH(name), name;       -- shortest names first, then alphabetically
```

# NULLs in sorted output

```sql run
SELECT name, city FROM customers ORDER BY city;
```

Where NULLs land differs by database: SQLite and PostgreSQL put them first when ascending (PostgreSQL actually puts them last by default — check yours), MySQL first. To be explicit and portable:

```sql run
SELECT name, city FROM customers
ORDER BY (city IS NULL), city;     -- 0 (not null) sorts before 1 (null)
```

PostgreSQL and SQLite also support `ORDER BY city NULLS LAST`, which is clearer where available.

# LIMIT and OFFSET

```sql run
SELECT name, price FROM products ORDER BY price DESC LIMIT 3;   -- three most expensive
```

```sql run
SELECT name, price FROM products ORDER BY price DESC LIMIT 3 OFFSET 3;   -- the next three
```

`LIMIT n` caps the rows returned; `OFFSET m` skips the first `m`. Together they page through results.

:::note Dialect differences
- SQLite, PostgreSQL, MySQL: `LIMIT 10 OFFSET 20`
- SQL Server: `OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY`
- Oracle (12c+): the same `OFFSET … FETCH` syntax

The standard form is `OFFSET … FETCH`, but `LIMIT` is far more common in practice.
:::

# Pagination, and why OFFSET doesn't scale

```sql run
-- Page 2, 3 items per page
SELECT id, name, price
FROM products
ORDER BY id
LIMIT 3 OFFSET 3;
```

The formula is `OFFSET = (page - 1) × page_size`. It's simple, it's what most tutorials show, and it has two real problems:

1. **It gets slower the deeper you go.** `OFFSET 100000` means the database finds 100,010 rows and throws away 100,000 of them. Page 1 is instant; page 5,000 is not.
2. **Rows shift.** If someone inserts a row while a user is reading page 1, one item slides onto page 2 and they see it twice — or an item is skipped entirely.

## Keyset pagination

The scalable alternative: remember the last row you saw and ask for what comes *after* it.

```sql run
-- First page
SELECT id, name, price FROM products ORDER BY id LIMIT 3;
```

```sql run
-- Next page: "after id 3" — no offset, uses the index directly
SELECT id, name, price FROM products
WHERE id > 3
ORDER BY id
LIMIT 3;
```

This stays fast at any depth and doesn't skip or duplicate rows when data changes. The trade-offs: you can't jump to "page 47", and you need a stable unique sort key (add the primary key as a tiebreaker if sorting by something non-unique):

```sql
WHERE (price, id) > (39.99, 3)
ORDER BY price, id
LIMIT 20;
```

Most "infinite scroll" and API cursor systems work exactly this way — that opaque `next_cursor` string an API gives you is usually an encoded keyset.

# Top-N per group

A classic question: "the most expensive product in each category."

```sql run
SELECT category, name, price
FROM (
  SELECT
    category, name, price,
    ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS rank_in_category
  FROM products
)
WHERE rank_in_category = 1
ORDER BY category;
```

`ROW_NUMBER() OVER (PARTITION BY … ORDER BY …)` is a **window function**: it numbers rows within each group without collapsing them the way `GROUP BY` does. Filter to `= 1` and you have the top row per group.

Related window functions:

```sql run
SELECT
  name,
  category,
  price,
  ROW_NUMBER() OVER (ORDER BY price DESC) AS row_num,
  RANK()       OVER (ORDER BY price DESC) AS rank_with_gaps,
  DENSE_RANK() OVER (ORDER BY price DESC) AS rank_no_gaps,
  ROUND(AVG(price) OVER (PARTITION BY category), 2) AS category_avg
FROM products
ORDER BY price DESC;
```

Window functions are one of SQL's most powerful features and are worth returning to once the basics are comfortable.

# Random and conditional ordering

```sql run
SELECT name FROM products ORDER BY RANDOM() LIMIT 3;
```

```sql run
-- Custom order: in-stock items first, then by price
SELECT name, stock, price
FROM products
ORDER BY
  CASE WHEN stock = 0 THEN 1 ELSE 0 END,   -- 0 sorts first
  price DESC;
```

:::warn ORDER BY RANDOM() is expensive
It assigns a random value to **every row** and sorts them all, just to return a handful. Fine for 100 rows, disastrous for 10 million. For large tables, pick random ids in your application and fetch those instead.
:::

:::quiz
? What happens without ORDER BY?
- Rows come back in insertion order
- Rows come back sorted by primary key
- The order is undefined and may change *
- An error
> Any apparent ordering is an implementation detail you must not rely on.

? Why does `LIMIT 10 OFFSET 100000` get slow?
- LIMIT is inefficient
- The database must produce and discard 100,000 rows first *
- OFFSET locks the table
- It re-sorts on each page
> Keyset pagination avoids the discarded work entirely.

? What is the main drawback of keyset pagination?
- It is slower
- You can't jump directly to an arbitrary page number *
- It doesn't work with ORDER BY
- It duplicates rows
> The trade for speed and stability is losing random page access.

? What does `ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC)` produce?
- The count per category
- A ranking within each category, restarting at 1 for each *
- The total ordered by price
- One row per category
> Filter to `= 1` and you have the top item per group.

? Can you use a SELECT alias in ORDER BY?
- No, never
- Yes — ORDER BY is evaluated after SELECT *
- Only in subqueries
- Only with GROUP BY
> WHERE runs before SELECT, which is why aliases don't work there.

? Why is `ORDER BY RANDOM() LIMIT 1` a problem on a huge table?
- RANDOM() isn't truly random
- It randomises and sorts every row just to return one *
- It requires an index
- It doesn't work with LIMIT
> Select random ids in application code instead.
:::

:::exercise Sorting and paging
1. The five cheapest products.
2. Products sorted by category, then most expensive first within each.
3. Customers sorted by join date, newest first, with NULL cities last.
4. Page 2 of orders (3 per page) sorted by date.
5. The same page 2 using keyset pagination instead of OFFSET.
6. The newest order for each customer, using `ROW_NUMBER()`.
:::
