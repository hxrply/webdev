Almost every application needs to remember things between visits. A **database** is software built for exactly that: storing data, keeping it consistent, and answering questions about it quickly.

# Why not just a spreadsheet, or a file?

Spreadsheets are fine until:

- Two people edit at once and one overwrites the other.
- You have 500,000 rows and everything crawls.
- The same customer's name is spelled three different ways.
- You need "all orders over £100 from UK customers last quarter" in milliseconds.
- You need a guarantee that money leaving one account arrives in another, even if the power fails mid-operation.

Databases solve all of those, and the last one — **transactions** — is the reason banks don't run on spreadsheets.

# The relational model

A **relational database** stores data in **tables**. A table has:

- **Columns** (fields) — each with a name and a type. `price` is a number, `name` is text.
- **Rows** (records) — one entity each: one customer, one order.
- A **primary key** — a column whose value uniquely identifies each row.

```text
customers
┌────┬───────────────────┬──────────────────────┬────────────┬─────────┐
│ id │ name              │ email                │ city       │ country │
├────┼───────────────────┼──────────────────────┼────────────┼─────────┤
│  1 │ Ada Lovelace      │ ada@example.com      │ London     │ UK      │
│  2 │ Grace Hopper      │ grace@example.com    │ New York   │ USA     │
│  3 │ Alan Turing       │ alan@example.com     │ Manchester │ UK      │
└────┴───────────────────┴──────────────────────┴────────────┴─────────┘
  ↑ primary key
```

# Relationships and foreign keys

The power of "relational" is linking tables. An order doesn't repeat the customer's name, email and address — it stores their `id`:

```text
orders
┌──────┬─────────────┬────────────┬───────────┐
│ id   │ customer_id │ ordered_on │ status    │
├──────┼─────────────┼────────────┼───────────┤
│ 1001 │ 1           │ 2024-03-02 │ shipped   │
│ 1002 │ 2           │ 2024-03-05 │ shipped   │
│ 1003 │ 1           │ 2024-04-17 │ cancelled │
└──────┴──────┬──────┴────────────┴───────────┘
              └──── foreign key → customers.id
```

That `customer_id` is a **foreign key**. It means:

- Ada's email is stored **once**. Change it in one place and every order reflects it.
- The database can *refuse* an order referencing a customer who doesn't exist.
- No duplication means no contradictions.

# The database you'll use here

Every SQL lesson on this site runs against a real SQLite database in your browser, with four tables:

```text
customers (id, name, email, city, country, joined)
   │
   └──< orders (id, customer_id, ordered_on, status)
             │
             └──< order_items (id, order_id, product_id, quantity, unit_price)
                             │
                products (id, name, category, price, stock)
```

Read `──<` as "has many": one customer has many orders; one order has many items; each item refers to one product.

Try it — this is a live database, and you can edit and re-run anything:

```sql run
SELECT * FROM customers;
```

```sql run
SELECT * FROM products;
```

:::tip The Schema button
The SQL console above has a **Schema** button that shows every table's definition, and a **Reset** button that restores the original data if you change something. Experiment freely — you cannot break anything.
:::

# SQL

**SQL** (Structured Query Language) is how you talk to a relational database. It's *declarative*: you describe the result you want, not the steps to get it. The database's query planner works out how.

```sql
SELECT name, city FROM customers WHERE country = 'UK';
```

You didn't say "loop over every row, check the country, collect the matches". You said what you wanted. That's the whole idea.

SQL statements fall into groups:

| Group | Statements | Purpose |
|---|---|---|
| **Query** | `SELECT` | Read data. 90% of what you write. |
| **DML** | `INSERT`, `UPDATE`, `DELETE` | Change data |
| **DDL** | `CREATE`, `ALTER`, `DROP` | Define structure |
| **Control** | `BEGIN`, `COMMIT`, `ROLLBACK`, `GRANT` | Transactions and permissions |

# Data types

Types vary a little between databases, but the categories are universal:

| Category | Examples | For |
|---|---|---|
| Integer | `INTEGER`, `BIGINT` | Counts, ids |
| Decimal | `DECIMAL(10,2)`, `NUMERIC` | **Money** — exact, no floating-point error |
| Floating point | `REAL`, `DOUBLE` | Measurements, scientific values |
| Text | `TEXT`, `VARCHAR(255)` | Names, descriptions |
| Boolean | `BOOLEAN` | True/false flags |
| Date/time | `DATE`, `TIMESTAMP` | When things happened |

:::warn Money is never a float
`REAL` and `DOUBLE` are binary floating point: `0.1 + 0.2` doesn't equal `0.3`. Over thousands of transactions, those errors accumulate into real discrepancies. Use `DECIMAL(10,2)`, or store integer pence/cents. (Our sample database uses `REAL` for simplicity — do not copy that in production.)
:::

# NULL

`NULL` means **unknown or absent** — not zero, not an empty string:

```sql run
SELECT id, name, city FROM customers WHERE city IS NULL;
```

Radia Perlman has no city recorded. Note the syntax: `IS NULL`, never `= NULL`. Comparing anything to an unknown value gives... unknown, which is not true, so `city = NULL` matches nothing at all — including actual NULLs. This trips up everyone once.

# Relational or not?

| | Relational (SQL) | Document (NoSQL) |
|---|---|---|
| Examples | PostgreSQL, MySQL, SQLite | MongoDB, DynamoDB, Firestore |
| Structure | Fixed schema, tables | Flexible JSON-like documents |
| Relationships | Joins, enforced by the DB | Embed or reference manually |
| Guarantees | Strong (ACID) | Varies |
| Suits | Most applications, anything with relationships | Rapidly changing shapes, huge scale, simple access patterns |

The practical advice: **start relational.** It's a safe default for the overwhelming majority of applications, the constraints protect you from bad data, and SQL is a transferable skill you'll use for the rest of your career. PostgreSQL is the usual recommendation; SQLite is perfect for learning, small apps and local storage (it is, by file count, the most deployed database in the world — it's in your phone, your browser and your car).

:::quiz
? What does a foreign key do?
- Encrypts a column
- Links a row to a row in another table, and can enforce that it exists *
- Makes a column unique
- Speeds up sorting
> It is how relational databases avoid duplicating data across tables.

? Why shouldn't money be stored as a floating-point number?
- Floats are slower
- Binary floating point can't represent decimal fractions exactly, so errors accumulate *
- Floats don't allow negatives
- SQL doesn't support floats
> Use DECIMAL, or store integer minor units (pence, cents).

? What does NULL mean?
- Zero
- An empty string
- Unknown or absent *
- False
> Which is why `= NULL` never matches — you must use `IS NULL`.

? What makes SQL "declarative"?
- It uses semicolons
- You describe the result you want, not how to compute it *
- It is case-insensitive
- It runs on a server
> The query planner decides how to execute it efficiently.

? Which is the better default for a new application?
- MongoDB, because schemas are restrictive
- A relational database, because most data has relationships and constraints prevent bad data *
- A spreadsheet
- Plain text files
> Start relational; reach for something else when you have a specific reason.
:::

:::exercise Explore the database
Run each of these in the console above and read the results:

```sql
SELECT * FROM orders;
SELECT * FROM order_items;
SELECT COUNT(*) AS how_many FROM products;
SELECT DISTINCT country FROM customers;
```

Then answer, by reading the data: how many orders has customer 1 placed, and which products are in order 1006?
:::
