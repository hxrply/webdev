A query that's instant on 100 rows can take minutes on 10 million. Indexes are the main reason databases stay fast — and the main thing beginners never think about until something breaks in production.

# The problem

Without an index, finding rows means reading **every row** — a *full table scan*. On 10 million rows that's 10 million comparisons, every time.

An index is a separate, sorted data structure (usually a B-tree) that maps values to row locations. Looking something up becomes a handful of steps instead of millions — the difference between reading a book cover to cover and using its index.

# Creating one

```sql run
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%';
```

```sql run
-- EXPLAIN shows how the database plans to run a query
EXPLAIN QUERY PLAN
SELECT * FROM orders WHERE customer_id = 1;
```

Compare with a column that has no index:

```sql run
EXPLAIN QUERY PLAN
SELECT * FROM orders WHERE status = 'shipped';
```

One says `USING INDEX`, the other `SCAN`. On a small table the difference is unmeasurable; on a large one it's everything. (PostgreSQL's equivalent is `EXPLAIN ANALYZE`, which also gives real timings.)

# What to index

**Index these:**

- **Foreign keys.** Almost always. Every join and every "find the children of this row" uses them. Many databases don't create them automatically — PostgreSQL and SQLite don't.
- **Columns you filter on frequently** — `email` for login, `status` for dashboards.
- **Columns you sort by** on large tables.
- **Columns with a `UNIQUE` constraint** — you get the index automatically.

**Don't index:**

- Small tables — a scan of 500 rows is already fast.
- Columns with very few distinct values (a boolean `is_active` where 95% are true). The index doesn't narrow anything down, and the planner will ignore it.
- Columns you never filter, join or sort on.
- Everything, reflexively. Which brings us to the cost.

:::warn Indexes are not free
Every index must be **updated on every INSERT, UPDATE and DELETE** to that table. A table with eight indexes writes nine structures per insert. They also consume disk and memory.

The trade is: **faster reads, slower writes, more space.** Most applications read far more than they write, so indexes usually win — but "add an index to everything" is a real way to make a write-heavy system slow.
:::

# Composite indexes and column order

```sql run
CREATE INDEX IF NOT EXISTS idx_orders_customer_date ON orders(customer_id, ordered_on);

EXPLAIN QUERY PLAN
SELECT * FROM orders WHERE customer_id = 1 ORDER BY ordered_on DESC;
```

A composite index covers several columns, and **order matters enormously**. An index on `(customer_id, ordered_on)` is like a phone book sorted by surname then first name. It can serve:

- `WHERE customer_id = 1` ✓
- `WHERE customer_id = 1 AND ordered_on > '2024-01-01'` ✓
- `WHERE customer_id = 1 ORDER BY ordered_on` ✓ (no separate sort needed)

But **not** `WHERE ordered_on > '2024-01-01'` alone — that's like finding everyone named "Ada" in a phone book sorted by surname. This is the **leftmost prefix rule**: an index can only be used from its first column onwards.

:::tip Order your composite index columns
Equality conditions first, then range conditions, then sort columns:
```sql
-- For: WHERE status = ? AND created_at > ? ORDER BY created_at
CREATE INDEX idx ON orders(status, created_at);
```
:::

# Things that stop an index being used

```sql
-- ✗ A function on the column
WHERE LOWER(email) = 'ada@example.com'
-- ✓ Store it normalised, or create an expression index:
CREATE INDEX idx_email_lower ON customers(LOWER(email));

-- ✗ Leading wildcard
WHERE name LIKE '%keyboard%'
-- ✓ Trailing wildcard can use an index
WHERE name LIKE 'Mech%'

-- ✗ Implicit type conversion
WHERE customer_id = '1'          -- string compared to integer column

-- ✗ OR across different columns often defeats indexes
WHERE city = 'London' OR country = 'UK'
-- ✓ Sometimes better as a UNION of two indexed queries
```

The general principle: **keep the indexed column bare on one side of the comparison.** The moment you wrap it in a function or arithmetic, the sorted order no longer helps.

# Covering indexes

```sql run
CREATE INDEX IF NOT EXISTS idx_products_cat_price ON products(category, price);

EXPLAIN QUERY PLAN
SELECT category, price FROM products WHERE category = 'peripherals';
```

If every column a query needs is *in the index*, the database never touches the table at all — it answers from the index alone. That's a **covering index**, and it can be dramatically faster. Watch for `USING COVERING INDEX` in the plan.

# Other index types

| Type | For |
|---|---|
| **B-tree** | The default. Equality, ranges, sorting |
| **Hash** | Equality only. Rarely worth choosing |
| **GIN / GiST** (PostgreSQL) | JSON, arrays, full-text search |
| **Partial** | Only some rows: `WHERE deleted_at IS NULL` |
| **Expression** | On a computed value: `LOWER(email)` |
| **Unique** | Enforces uniqueness *and* speeds lookups |

```sql
-- Partial index: smaller and faster when you only query active rows
CREATE INDEX idx_active_users ON users(email) WHERE deleted_at IS NULL;
```

# Diagnosing a slow query

1. **Find it.** Use slow query logs, your APM, or `pg_stat_statements`. Don't guess.
2. **`EXPLAIN` it.** Look for sequential scans on large tables, and for a row count estimate wildly different from reality (stale statistics — run `ANALYZE`).
3. **Check the obvious causes**, in order:
   - A missing index on a foreign key or filter column.
   - **N+1 queries** — 200 small queries in a loop instead of one join. Very often the real problem, and no index will fix it.
   - `SELECT *` fetching huge columns you don't use.
   - Missing `LIMIT` on a query feeding a paginated UI.
   - A function wrapping an indexed column.
4. **Measure before and after.** "It feels faster" is not evidence.

```sql run
-- The classic N+1 in disguise: this is ONE query doing what 8 would
SELECT
  c.name,
  COUNT(o.id) AS orders
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name;
```

:::note Premature optimisation applies here too
Don't add indexes speculatively while designing. Create the obvious ones (foreign keys, unique constraints, your known lookup columns), then add more when a real query is measurably slow. Every index you add is a permanent write cost paid on every insert.
:::

:::quiz
? What is the main trade-off of adding an index?
- More memory only
- Faster reads in exchange for slower writes and more storage *
- It locks the table permanently
- There is no downside
> Every write must update every index on that table.

? Which query can use an index on `(customer_id, ordered_on)`?
- `WHERE ordered_on > '2024-01-01'`
- `WHERE customer_id = 5` *
- `WHERE LOWER(status) = 'shipped'`
- `WHERE ordered_on = ? OR customer_id = ?`
> The leftmost prefix rule: usable from the first column onwards.

? Why does `WHERE LOWER(email) = 'x'` usually skip the index?
- LOWER is slow
- The index stores the original values, so the sorted order doesn't match the computed one *
- Strings can't be indexed
- It needs a composite index
> An expression index on `LOWER(email)` solves it.

? Which column is a poor index candidate?
- A foreign key
- An email used for login
- A boolean where 95% of rows are true *
- A frequently sorted created_at
> Low selectivity means the index doesn't narrow the search meaningfully.

? What is a covering index?
- One that covers all tables
- One containing every column a query needs, so the table is never read *
- A unique index
- An index on a view
> Look for "covering index" in the query plan.

? A page makes 200 queries in a loop. What is the fix?
- Add an index to each table
- Replace the loop with a single join or `WHERE id IN (…)` query *
- Increase the connection pool
- Add caching
> This is the N+1 problem, and indexes don't solve it.
:::

:::exercise Index a query
In the console:

1. Run `EXPLAIN QUERY PLAN` on `SELECT * FROM order_items WHERE product_id = 1;` and note the plan.
2. Create an index on `order_items(product_id)`, run it again, and compare.
3. Create `idx_orders_status_date ON orders(status, ordered_on)`, then check which of these can use it: filtering by status; filtering by date alone; filtering by status and ordering by date.
4. Write a query whose plan reports a covering index.
:::
