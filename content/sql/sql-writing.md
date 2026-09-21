Reading data is safe. Writing it is where mistakes become permanent, so this lesson is as much about habits as syntax.

# INSERT

```sql run
INSERT INTO products (name, category, price, stock)
VALUES ('Cable Tidy', 'accessories', 12.50, 200);

SELECT * FROM products WHERE name = 'Cable Tidy';
```

```sql run
-- Several rows in one statement — much faster than many statements
INSERT INTO products (name, category, price, stock) VALUES
  ('Mouse Mat',    'accessories', 9.99,  340),
  ('Laptop Sleeve','accessories', 29.00, 55),
  ('HDMI Cable',   'accessories', 14.00, 120);

SELECT name, price, stock FROM products WHERE category = 'accessories' ORDER BY price;
```

:::tip Always name your columns
```sql
INSERT INTO products VALUES (11, 'Thing', 'misc', 10, 5);     -- ✗ fragile
INSERT INTO products (name, category, price, stock) VALUES (…); -- ✓
```
The first depends on column *order*. Someone adds a column, and every unnamed insert in the codebase silently starts putting data in the wrong place.
:::

```sql run
-- INSERT from a SELECT: copy or derive rows
INSERT INTO products (name, category, price, stock)
SELECT name || ' (refurbished)', category, ROUND(price * 0.6, 2), 5
FROM products
WHERE price > 200 AND name NOT LIKE '%refurbished%';

SELECT name, price FROM products WHERE name LIKE '%refurbished%';
```

# UPDATE

```sql run
UPDATE products
SET price = 94.00
WHERE name = 'Mechanical Keyboard';

SELECT name, price FROM products WHERE name = 'Mechanical Keyboard';
```

```sql run
-- Several columns, and expressions referring to the current value
UPDATE products
SET price = ROUND(price * 1.1, 2),
    stock = stock + 10
WHERE category = 'peripherals';

SELECT name, price, stock FROM products WHERE category = 'peripherals';
```

:::warn UPDATE without WHERE changes every row
```sql
UPDATE products SET price = 0;     -- every product, instantly free
```
There is no confirmation and no undo outside a transaction. The professional habit:

1. Write the `WHERE` clause **first**, as a `SELECT`, and check what it matches.
2. Change `SELECT *` to `UPDATE … SET …`.
3. Run inside a transaction so you can `ROLLBACK`.

Many teams set `SET SQL_SAFE_UPDATES = 1` (MySQL) or use a client that refuses unqualified updates. Everyone who has done this once does it for the rest of their career.
:::

```sql run
-- Step 1: check the target rows
SELECT id, name, stock FROM products WHERE stock = 0;
```

```sql run
-- Step 2: now the update, confident about what it touches
UPDATE products SET stock = 25 WHERE stock = 0;
SELECT id, name, stock FROM products WHERE id IN (4);
```

# DELETE

```sql run
DELETE FROM products WHERE name LIKE '%refurbished%';
SELECT COUNT(*) AS remaining FROM products;
```

The same warning applies, more so: `DELETE FROM products;` empties the table.

:::note Soft deletes
Production systems frequently don't delete at all. Instead:

```sql
ALTER TABLE products ADD COLUMN deleted_at TIMESTAMP;
UPDATE products SET deleted_at = CURRENT_TIMESTAMP WHERE id = 7;
-- and every query adds: WHERE deleted_at IS NULL
```

You keep history and can undo mistakes; the cost is that every query must remember the filter, and "unique" constraints get complicated. Worth it for anything a user might want back.
:::

# UPSERT

"Insert, or update if it already exists":

```sql run
INSERT INTO products (id, name, category, price, stock)
VALUES (1, 'Mechanical Keyboard', 'peripherals', 99.00, 50)
ON CONFLICT(id) DO UPDATE SET
  price = excluded.price,
  stock = excluded.stock;

SELECT id, name, price, stock FROM products WHERE id = 1;
```

`excluded` refers to the row you tried to insert. PostgreSQL uses the same `ON CONFLICT` syntax; MySQL uses `ON DUPLICATE KEY UPDATE`. It saves a read-then-write round trip and avoids a race between checking and inserting.

# RETURNING

```sql run
INSERT INTO products (name, category, price, stock)
VALUES ('Desk Mat', 'accessories', 24.00, 80)
RETURNING id, name, price;
```

Get the generated id back without a second query. Supported by PostgreSQL, SQLite and MariaDB.

# Transactions

A transaction groups statements so they succeed or fail **together**.

```sql run
BEGIN TRANSACTION;

UPDATE products SET stock = stock - 2 WHERE id = 1;
INSERT INTO orders (id, customer_id, ordered_on, status)
  VALUES (2001, 1, '2025-06-01', 'pending');
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
  VALUES (2001, 1, 2, 94.00);

COMMIT;

SELECT * FROM orders WHERE id = 2001;
```

If anything between `BEGIN` and `COMMIT` fails, `ROLLBACK` undoes **all** of it. Without a transaction, a failure halfway through leaves stock reduced for an order that doesn't exist.

```sql run
BEGIN TRANSACTION;
DELETE FROM products;              -- terrifying
SELECT COUNT(*) AS during_transaction FROM products;
ROLLBACK;
SELECT COUNT(*) AS after_rollback FROM products;
```

That's the safety net: inside a transaction, you can look before you leap.

## ACID

Transactions give four guarantees:

| Property | Meaning |
|---|---|
| **Atomicity** | All statements apply, or none do |
| **Consistency** | Constraints hold before and after |
| **Isolation** | Concurrent transactions don't see each other's half-finished work |
| **Durability** | Once committed, it survives a crash |

The classic example is a bank transfer: debit one account, credit another. Atomicity is what stops money vanishing when the server dies between the two statements.

```sql
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
```

## Concurrency and locking

When two transactions touch the same rows, the database serialises them — one waits. That's correct, but it means:

- **Keep transactions short.** Never hold one open across a network call or user input.
- **Touch tables in a consistent order** across your codebase, or two transactions can deadlock, each holding what the other wants.
- **Beware read-modify-write.** `SELECT stock`, then `UPDATE stock = 4` in application code loses updates under concurrency. Do it in one statement — `UPDATE … SET stock = stock - 1 WHERE stock > 0` — or lock the row with `SELECT … FOR UPDATE`.

:::gotcha The classic overselling bug
```js
const { stock } = await db.get('SELECT stock FROM products WHERE id = 1');
if (stock > 0) await db.run('UPDATE products SET stock = ? WHERE id = 1', stock - 1);
```
Two simultaneous requests both read `stock = 1`, both decide it's fine, and both write `0`. You've sold two of your last one item.

```sql
UPDATE products SET stock = stock - 1 WHERE id = 1 AND stock > 0;
```
One atomic statement. Check the affected row count: 0 means it was out of stock.
:::

:::quiz
? What does UPDATE without a WHERE clause do?
- Nothing
- Updates the first row
- Updates every row in the table *
- Raises an error
> Test the WHERE clause as a SELECT first, and work inside a transaction.

? Why name columns explicitly in an INSERT?
- It is faster
- Positional inserts break silently when the table's columns change *
- It is required by the standard
- To allow NULLs
> A column added in the middle sends every value to the wrong place.

? What does ROLLBACK do?
- Undoes the last statement
- Undoes every change made since BEGIN *
- Reverts the table to yesterday
- Closes the connection
> Atomicity: all or nothing.

? Which is safe under concurrent requests?
- SELECT stock, then UPDATE with the new value
- `UPDATE products SET stock = stock - 1 WHERE id = ? AND stock > 0` *
- Checking stock in application code
- Using a longer timeout
> Read-modify-write across two statements loses updates.

? What is a soft delete?
- Deleting only some columns
- Marking a row deleted (e.g. `deleted_at`) instead of removing it *
- Deleting inside a transaction
- A cascading delete
> It preserves history at the cost of filtering every query.

? What does `ON CONFLICT … DO UPDATE` accomplish?
- Prevents errors
- Inserts, or updates the existing row if a key conflicts, in one atomic statement *
- Deletes duplicates
- Locks the table
> It avoids a race between "does it exist?" and "insert it".
:::

:::exercise Practise writing data — safely
Using the console (hit **Reset** if you want the original data back):

1. Insert a new customer, then find their generated id with `RETURNING`.
2. Insert an order for them with two line items, all inside one transaction.
3. Write a `SELECT` that identifies products under £30, check it, then convert it to an `UPDATE` raising those prices by 5%.
4. Deliberately start a transaction, delete all orders, count them, then `ROLLBACK` and count again.
5. Write an atomic stock decrement that cannot oversell.
:::
