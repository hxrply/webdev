`SELECT` is the statement you'll write most. Its full form has six clauses, and they always appear in this order:

```sql
SELECT   columns        -- what to return
FROM     table          -- where to get it
WHERE    condition      -- which rows
GROUP BY columns        -- how to group them
HAVING   condition      -- which groups
ORDER BY columns        -- what order
LIMIT    n;             -- how many
```

This lesson covers `SELECT` and `FROM`; the rest follow.

# Choosing columns

```sql run
SELECT name, email, country FROM customers;
```

```sql run
SELECT * FROM products;
```

`*` means every column. Fine for exploring; avoid it in application code — it fetches data you don't need, and it breaks silently when someone adds a column.

# Aliases

```sql run
SELECT
  name AS customer_name,
  city AS location,
  country
FROM customers;
```

`AS` renames a column in the result. Use it when a name is cryptic, when you compute something, or when two joined tables both have a `name` column. The `AS` keyword is optional — `name customer_name` works — but including it is clearer.

# Expressions

Columns don't have to come straight from the table:

```sql run
SELECT
  name,
  price,
  stock,
  price * stock           AS inventory_value,
  ROUND(price * 0.8, 2)   AS sale_price,
  price > 100             AS is_expensive
FROM products;
```

Arithmetic, comparisons and functions all work in the `SELECT` list. Note `price > 100` returns 1 or 0 — SQLite has no separate boolean type.

# Text functions

```sql run
SELECT
  name,
  UPPER(name)                    AS shouted,
  LENGTH(name)                   AS characters,
  SUBSTR(name, 1, 3)             AS first_three,
  name || ' <' || email || '>'   AS mailto,
  REPLACE(email, '@example.com', '') AS username
FROM customers
LIMIT 5;
```

:::note Concatenation differs by database
`||` is the SQL standard and works in SQLite, PostgreSQL and Oracle. MySQL uses `CONCAT(a, b)` by default. Portable SQL is harder than it looks; check your database's docs for string, date and JSON functions especially.
:::

# Dates

```sql run
SELECT
  name,
  joined,
  STRFTIME('%Y', joined)          AS year_joined,
  STRFTIME('%d/%m/%Y', joined)    AS uk_format,
  CAST(STRFTIME('%Y', 'now') AS INTEGER) - CAST(STRFTIME('%Y', joined) AS INTEGER) AS years_ago
FROM customers;
```

SQLite stores dates as ISO-8601 text (`2024-03-02`), which sorts and compares correctly as strings — a genuinely convenient property. Other databases have real `DATE` types with their own function sets.

# DISTINCT

```sql run
SELECT DISTINCT country FROM customers;
```

```sql run
SELECT DISTINCT country, city FROM customers;
```

`DISTINCT` removes duplicate **rows**, considering every selected column together. The second query gives unique country/city *pairs*, not unique countries.

# CASE: conditional logic

```sql run
SELECT
  name,
  stock,
  CASE
    WHEN stock = 0        THEN 'Out of stock'
    WHEN stock < 20       THEN 'Low'
    WHEN stock < 100      THEN 'In stock'
    ELSE                       'Plenty'
  END AS availability,
  CASE WHEN price > 100 THEN 'premium' ELSE 'standard' END AS tier
FROM products
ORDER BY stock;
```

`CASE` is SQL's if/else. Conditions are tested top to bottom, first match wins, and `ELSE` catches the rest (without it, unmatched rows get `NULL`).

# Handling NULL

```sql run
SELECT
  name,
  city,
  COALESCE(city, 'Not recorded')   AS city_safe,
  IFNULL(city, '—')                AS city_dash,
  city IS NULL                     AS city_missing
FROM customers;
```

`COALESCE` returns the first non-NULL of its arguments — it accepts any number, so it's the more general tool:

```sql
COALESCE(nickname, first_name, email, 'Anonymous')
```

# Formatting and writing readable SQL

```sql run
SELECT
    p.name        AS product,
    p.category,
    p.price,
    p.stock,
    ROUND(p.price * p.stock, 2) AS stock_value
FROM
    products AS p
WHERE
    p.stock > 0
ORDER BY
    stock_value DESC;
```

Conventions that make SQL readable, and which you'll see in most codebases:

- **Keywords in capitals**, identifiers in lowercase. SQL is case-insensitive for keywords, but the contrast helps enormously.
- **One clause per line**, columns indented.
- **Table aliases** (`p`, `c`, `oi`) once you're joining — but keep them meaningful.
- **Comments**: `-- to end of line`, or `/* block */`.
- **Semicolon** to end a statement.

# Reading order vs writing order

SQL is written `SELECT … FROM … WHERE`, but the database evaluates it roughly:

```text
FROM      → which tables
WHERE     → filter rows
GROUP BY  → group them
HAVING    → filter groups
SELECT    → compute the output columns
ORDER BY  → sort
LIMIT     → truncate
```

This explains a common error: you can't use a `SELECT` alias in `WHERE`, because `WHERE` runs first and the alias doesn't exist yet. You *can* use it in `ORDER BY`, which runs after.

```sql run
-- This works: ORDER BY runs after SELECT
SELECT name, price * stock AS value
FROM products
ORDER BY value DESC
LIMIT 3;
```

:::gotcha Single quotes for strings
```sql
WHERE country = 'UK'    -- ✓ string literal
WHERE country = "UK"    -- ✗ in standard SQL, double quotes mean an IDENTIFIER
```
In PostgreSQL, `"UK"` means a column named UK, and you'll get "column does not exist". SQLite and MySQL are more forgiving, which teaches bad habits. Use single quotes for text, always.
:::

:::quiz
? Why avoid `SELECT *` in application code?
- It is slower to type
- It fetches unneeded data and breaks when columns are added or reordered *
- It doesn't work with WHERE
- It is invalid SQL
> Naming columns explicitly documents what your code depends on.

? What does `SELECT DISTINCT country, city` return?
- Unique countries only
- Unique combinations of country and city *
- Two separate lists
- An error
> DISTINCT always applies to the whole selected row.

? Why can't you use a SELECT alias in a WHERE clause?
- Aliases are only for display
- WHERE is evaluated before SELECT, so the alias doesn't exist yet *
- Aliases must be quoted
- You can
> ORDER BY runs after SELECT, so aliases do work there.

? What does `COALESCE(a, b, 'default')` do?
- Concatenates the values
- Returns the first argument that isn't NULL *
- Returns NULL if any argument is NULL
- Compares the values
> It's the standard way to supply a fallback for missing data.

? Which quote marks a string literal in standard SQL?
- Double quotes
- Single quotes *
- Backticks
- Either
> Double quotes denote identifiers; backticks are a MySQL extension.
:::

:::exercise Write five SELECTs
Using the console, write queries that return:

1. Every product name and price, with the price column renamed `cost`.
2. Each customer's name and the year they joined.
3. Every product with a `price_with_vat` column at 20% above the price, rounded to 2 decimals.
4. A list of unique categories.
5. Each product labelled `'cheap'` (under £40), `'mid'` (£40–150) or `'premium'` (over £150) using CASE.
:::
