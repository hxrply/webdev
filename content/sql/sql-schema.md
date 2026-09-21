A good schema makes correct data easy and incorrect data impossible. A bad one is a source of bugs for years, because data outlives code.

# CREATE TABLE

```sql run
CREATE TABLE IF NOT EXISTS authors (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  email       TEXT    NOT NULL UNIQUE,
  bio         TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS articles (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id   INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  title       TEXT    NOT NULL,
  slug        TEXT    NOT NULL UNIQUE,
  body        TEXT    NOT NULL,
  status      TEXT    NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'review', 'published')),
  word_count  INTEGER NOT NULL DEFAULT 0 CHECK (word_count >= 0),
  published_at TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO authors (name, email) VALUES ('Ada Lovelace', 'ada@example.com');
INSERT INTO articles (author_id, title, slug, body, status, word_count)
  VALUES (1, 'On Analytical Engines', 'on-analytical-engines', 'Text…', 'published', 1200);

SELECT a.title, a.status, au.name AS author FROM articles a JOIN authors au ON au.id = a.author_id;
```

# Constraints: rules the database enforces

| Constraint | Guarantees |
|---|---|
| `PRIMARY KEY` | Unique and not null — identifies the row |
| `NOT NULL` | A value is required |
| `UNIQUE` | No duplicates in this column (or combination) |
| `FOREIGN KEY` / `REFERENCES` | The referenced row exists |
| `CHECK` | An arbitrary condition holds |
| `DEFAULT` | Value used when none is supplied |

```sql run
-- The database refuses invalid data
INSERT INTO articles (author_id, title, slug, body, status)
VALUES (1, 'Bad status', 'bad-status', 'x', 'nonsense');
```

That fails with a CHECK constraint violation — good. The alternative is discovering in six months that `status` contains `'draft'`, `'Draft'`, `'DRAFT'`, `'d'` and `'pubished'`.

:::tip Constraints are cheaper than bug reports
Application code can be bypassed: a migration script, an admin console, a colleague's one-off query, a second service. **The database is the last line of defence, and the only one everything goes through.** Every constraint you add is a class of bug that can never happen.
:::

# Foreign keys and referential actions

```sql
author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE
```

`ON DELETE` decides what happens when the referenced row is deleted:

| Action | Effect |
|---|---|
| `RESTRICT` / `NO ACTION` | Refuse the delete while children exist (a safe default) |
| `CASCADE` | Delete the children too |
| `SET NULL` | Null the reference (the column must be nullable) |
| `SET DEFAULT` | Use the column's default |

`CASCADE` is convenient and occasionally catastrophic — deleting one account can silently remove a million rows. Use `RESTRICT` unless the child genuinely cannot exist without the parent (an order's line items, say).

:::warn SQLite needs foreign keys switched on
```sql
PRAGMA foreign_keys = ON;
```
For backwards compatibility, SQLite ignores foreign keys **by default**, per connection. Many people have shipped a schema full of `REFERENCES` clauses that enforced nothing at all.
:::

# Choosing types

```sql
id          INTEGER PRIMARY KEY          -- or BIGINT for large tables
email       VARCHAR(255) NOT NULL        -- length caps are documentation as much as limits
price_pence INTEGER NOT NULL             -- money as integer minor units
rating      DECIMAL(3,2)                 -- exact decimal when you need fractions
is_active   BOOLEAN NOT NULL DEFAULT TRUE
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()   -- always store UTC with a timezone
metadata    JSONB                        -- PostgreSQL: structured but schemaless corners
```

Rules of thumb:

- **Money**: integer minor units, or `DECIMAL`. Never `FLOAT`.
- **Timestamps**: always with a timezone, always stored UTC, converted for display only.
- **Text**: `TEXT` where supported; `VARCHAR(n)` where a genuine limit exists. Don't guess "names are under 50 characters" — they aren't.
- **Booleans**: a real boolean type; avoid `'Y'`/`'N'` strings.
- **Enumerated values**: a `CHECK` constraint or a lookup table. A native `ENUM` is awkward to change later.

# Normalisation

Normalisation means organising data so each fact is stored **once**.

## The problem it solves

```text
orders (denormalised — don't do this)
┌──────┬──────────────┬───────────────────┬────────────┬─────────────┬───────┐
│ id   │ customer     │ customer_email    │ city       │ product     │ price │
├──────┼──────────────┼───────────────────┼────────────┼─────────────┼───────┤
│ 1001 │ Ada Lovelace │ ada@example.com   │ London     │ Keyboard    │ 89.00 │
│ 1002 │ Ada Lovelace │ ada@exmaple.com   │ London     │ Monitor     │249.50 │  ← typo
│ 1003 │ Ada Lovelace │ ada@example.com   │ Manchester │ Hub         │ 39.99 │  ← moved? or wrong?
└──────┴──────────────┴───────────────────┴────────────┴─────────────┴───────┘
```

Three problems, with traditional names:

- **Update anomaly** — changing Ada's email means finding every row. Miss one, and the data contradicts itself.
- **Insertion anomaly** — you can't record a customer until they place an order.
- **Deletion anomaly** — delete their last order and the customer disappears entirely.

## The normal forms, practically

- **1NF** — one value per cell. No `"css,js,html"` in a single column; no `phone1`, `phone2`, `phone3`.
- **2NF** — every non-key column depends on the *whole* primary key (matters with composite keys).
- **3NF** — no column depends on another non-key column. If `city` determines `postcode_region`, that belongs elsewhere.

The informal version that gets you 95% of the way: **every fact in exactly one place, and a row for every distinct thing.** If you're copying the same text into many rows, it probably wants its own table.

## When to denormalise

Deliberately duplicating data is sometimes right:

- **Historical accuracy.** `order_items.unit_price` duplicates `products.price` *on purpose* — the price when ordered must not change when you update the catalogue. Our sample database does exactly this.
- **Read performance.** A cached `comment_count` on a post beats counting a million rows on every page view.

Both need a plan for keeping the copy correct — a trigger, a background job, or accepting it's a snapshot.

# Designing a schema: a worked example

A library system. Start with the *nouns*:

- Books, Authors, Copies, Members, Loans.

Then the relationships:

- A book has one or more authors; an author writes many books → **many-to-many**, needs a join table.
- A book has many physical copies → **one-to-many**.
- A copy is loaned to a member, many times over → **one-to-many**, twice.

```sql run
CREATE TABLE IF NOT EXISTS lib_books (
  id     INTEGER PRIMARY KEY,
  isbn   TEXT NOT NULL UNIQUE,
  title  TEXT NOT NULL,
  year   INTEGER CHECK (year BETWEEN 1400 AND 2100)
);

CREATE TABLE IF NOT EXISTS lib_authors (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

-- The join table for many-to-many
CREATE TABLE IF NOT EXISTS lib_book_authors (
  book_id   INTEGER NOT NULL REFERENCES lib_books(id)   ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES lib_authors(id) ON DELETE CASCADE,
  position  INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (book_id, author_id)          -- composite key prevents duplicates
);

CREATE TABLE IF NOT EXISTS lib_copies (
  id       INTEGER PRIMARY KEY,
  book_id  INTEGER NOT NULL REFERENCES lib_books(id) ON DELETE RESTRICT,
  barcode  TEXT NOT NULL UNIQUE,
  acquired TEXT NOT NULL DEFAULT (date('now'))
);

CREATE TABLE IF NOT EXISTS lib_loans (
  id        INTEGER PRIMARY KEY,
  copy_id   INTEGER NOT NULL REFERENCES lib_copies(id),
  member_id INTEGER NOT NULL,
  loaned_on TEXT NOT NULL DEFAULT (date('now')),
  due_on    TEXT NOT NULL,
  returned_on TEXT,
  CHECK (returned_on IS NULL OR returned_on >= loaned_on)
);

INSERT INTO lib_books (id, isbn, title, year) VALUES (1, '9780000000001', 'Structure and Interpretation', 1985);
INSERT INTO lib_authors (id, name) VALUES (1, 'Abelson'), (2, 'Sussman');
INSERT INTO lib_book_authors (book_id, author_id, position) VALUES (1, 1, 1), (1, 2, 2);

SELECT b.title, GROUP_CONCAT(a.name, ' & ') AS authors
FROM lib_books b
JOIN lib_book_authors ba ON ba.book_id = b.id
JOIN lib_authors a ON a.id = ba.author_id
GROUP BY b.id, b.title;
```

The `PRIMARY KEY (book_id, author_id)` on the join table is the key detail: it makes the same author-book pair physically impossible to record twice.

# ALTER TABLE and migrations

```sql run
ALTER TABLE lib_books ADD COLUMN publisher TEXT;
SELECT * FROM lib_books;
```

```sql
ALTER TABLE books RENAME COLUMN year TO published_year;
ALTER TABLE books DROP COLUMN publisher;              -- limited in older SQLite
```

In real projects, schema changes go through **migrations** — numbered, version-controlled scripts applied in order:

```text
migrations/
├── 001_create_users.sql
├── 002_add_email_index.sql
└── 003_add_soft_delete.sql
```

The rules that matter:

- **Never edit an applied migration.** Write a new one.
- **Test on a copy of production data**, not an empty database.
- **Additive changes are safe**; dropping columns and renaming are not — deploy in stages (add new → write both → backfill → read new → drop old).
- Adding a NOT NULL column to a large table without a default can lock it for a long time.

:::quiz
? Why enforce rules with database constraints rather than only in application code?
- Constraints are faster
- The database is the one layer every writer passes through, including scripts and other services *
- Application validation doesn't work
- It reduces storage
> Constraints make whole categories of bad data impossible rather than unlikely.

? What is an update anomaly?
- Two users updating at once
- The same fact stored in many rows, so an update can leave contradictory copies *
- An update with no WHERE clause
- A failed transaction
> It's the main problem normalisation solves.

? Why does `order_items` store `unit_price` when `products.price` exists?
- Poor design
- To preserve the price at the time of the order, independent of later catalogue changes *
- For faster joins
- It is required by the foreign key
> Deliberate denormalisation for historical accuracy.

? What does `PRIMARY KEY (book_id, author_id)` on a join table achieve?
- Faster inserts
- It makes duplicate pairings impossible *
- It allows NULLs
- It creates two tables
> A composite key is the standard way to enforce uniqueness of a relationship.

? A row is deleted and you want its children to remain but lose the link. Which action?
- CASCADE
- RESTRICT
- SET NULL *
- NO ACTION
> The child column must be nullable for this to work.

? What is the rule about migrations already applied?
- Edit them to fix mistakes
- Never edit them; write a new migration instead *
- Delete and regenerate them
- Apply them in any order
> Editing breaks every environment that already ran the old version.
:::

:::exercise Design a schema
Design tables for a simple event-booking system: events, venues, ticket types, customers and bookings.

Requirements: an event happens at one venue; a venue hosts many events; an event has several ticket types at different prices; a booking is made by a customer for several tickets of possibly different types; ticket prices must be preserved as they were at booking time; a venue cannot be deleted while events reference it.

Write the `CREATE TABLE` statements with appropriate types, keys, foreign keys and CHECK constraints, then test them by inserting sample data — including a deliberately invalid row to confirm the constraints work.
:::
