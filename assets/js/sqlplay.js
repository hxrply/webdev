/* ============================================================
   sqlplay.js — a real SQL console in the browser.
   Uses sql.js (SQLite compiled to WebAssembly), loaded lazily
   from a locally vendored copy (no network needed). All blocks on a
   lesson page share one database and auto-run in document order, so a
   lesson reads like a real console session: create something in one
   block, query it in the next. Moving to another lesson re-seeds.
   ============================================================ */
window.SQLPlay = (function () {
  'use strict';

  // sql.js is vendored locally (assets/vendor/sql.js, MIT) so the SQL lessons
  // work offline and on networks that block CDNs. The CDN is a fallback only.
  const LOCAL = 'assets/vendor/sql.js/';
  const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.13.0/';

  /* ---- the sample database every SQL lesson talks about ---- */
  const SEED = `
CREATE TABLE customers (
  id       INTEGER PRIMARY KEY,
  name     TEXT    NOT NULL,
  email    TEXT    NOT NULL UNIQUE,
  city     TEXT,
  country  TEXT    NOT NULL,
  joined   TEXT    NOT NULL
);
CREATE TABLE products (
  id       INTEGER PRIMARY KEY,
  name     TEXT    NOT NULL,
  category TEXT    NOT NULL,
  price    REAL    NOT NULL,
  stock    INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE orders (
  id          INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  ordered_on  TEXT    NOT NULL,
  status      TEXT    NOT NULL
);
CREATE TABLE order_items (
  id         INTEGER PRIMARY KEY,
  order_id   INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity   INTEGER NOT NULL,
  unit_price REAL    NOT NULL
);

INSERT INTO customers (id, name, email, city, country, joined) VALUES
 (1,'Ada Lovelace','ada@example.com','London','UK','2023-01-14'),
 (2,'Grace Hopper','grace@example.com','New York','USA','2023-02-02'),
 (3,'Alan Turing','alan@example.com','Manchester','UK','2023-02-27'),
 (4,'Katherine Johnson','kj@example.com','Hampton','USA','2023-05-09'),
 (5,'Linus Torvalds','linus@example.com','Helsinki','Finland','2024-01-30'),
 (6,'Radia Perlman','radia@example.com',NULL,'USA','2024-03-18'),
 (7,'Tim Berners-Lee','tim@example.com','London','UK','2024-07-01'),
 (8,'Margaret Hamilton','margaret@example.com','Paoli','USA','2025-02-11');

INSERT INTO products (id, name, category, price, stock) VALUES
 (1,'Mechanical Keyboard','peripherals',89.00,42),
 (2,'27in Monitor','displays',249.50,12),
 (3,'USB-C Hub','peripherals',39.99,130),
 (4,'Laptop Stand','accessories',24.00,0),
 (5,'Noise-cancelling Headphones','audio',179.00,7),
 (6,'Webcam 1080p','peripherals',59.00,23),
 (7,'Standing Desk','furniture',420.00,3),
 (8,'Desk Lamp','accessories',32.50,58),
 (9,'Ergonomic Mouse','peripherals',45.00,64),
 (10,'Monitor Arm','accessories',78.00,19);

INSERT INTO orders (id, customer_id, ordered_on, status) VALUES
 (1001,1,'2024-03-02','shipped'),
 (1002,2,'2024-03-05','shipped'),
 (1003,1,'2024-04-17','cancelled'),
 (1004,3,'2024-05-21','shipped'),
 (1005,5,'2024-06-01','pending'),
 (1006,2,'2024-06-14','shipped'),
 (1007,4,'2024-08-09','shipped'),
 (1008,7,'2025-01-22','pending'),
 (1009,1,'2025-02-03','shipped'),
 (1010,8,'2025-03-30','pending');

INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES
 (1,1001,1,1,89.00),(2,1001,3,2,39.99),
 (3,1002,2,2,249.50),
 (4,1003,5,1,179.00),
 (5,1004,7,1,420.00),(6,1004,10,1,78.00),
 (7,1005,9,3,45.00),
 (8,1006,1,1,89.00),(9,1006,6,1,59.00),(10,1006,8,2,32.50),
 (11,1007,2,1,249.50),(12,1007,10,2,78.00),
 (13,1008,5,1,179.00),(14,1008,3,1,39.99),
 (15,1009,4,2,24.00),
 (16,1010,7,1,420.00),(17,1010,1,2,89.00);
`;

  let SQLPromise = null;   // the wasm engine, loaded once
  let dbPromise = null;    // the database shared by this page's blocks
  let chain = Promise.resolve();   // keeps auto-runs in document order

  function loadEngine() {
    if (SQLPromise) return SQLPromise;

    function initFrom(base) {
      return window.initSqlJs({ locateFile: function (f) { return base + f; } });
    }

    function loadScript(base) {
      return new Promise(function (resolve, reject) {
        const s = document.createElement('script');
        s.src = base + 'sql-wasm.js';
        s.onload = function () { resolve(base); };
        s.onerror = function () { reject(new Error('could not load ' + s.src)); };
        document.head.appendChild(s);
      });
    }

    SQLPromise = (window.initSqlJs ? Promise.resolve(LOCAL) : loadScript(LOCAL))
      .then(initFrom)
      .catch(function () {
        // Local copy missing or the wasm failed — try the CDN before giving up.
        return (window.initSqlJs ? Promise.resolve(CDN) : loadScript(CDN)).then(initFrom);
      });

    return SQLPromise;
  }

  function cell(v) {
    if (v === null || v === undefined) return '<td class="null">NULL</td>';
    return '<td>' + MD.esc(String(v)) + '</td>';
  }

  function renderResults(out, results, db, t0) {
    if (!results.length) {
      const changed = db.getRowsModified();
      out.innerHTML = '<div class="sqlp-msg ok">✔ Statement ran. ' +
        (changed ? changed + ' row' + (changed === 1 ? '' : 's') + ' affected.' : 'No rows returned.') + '</div>';
      return;
    }
    let html = '';
    results.forEach(function (r) {
      html += '<table><thead><tr>' +
              r.columns.map(function (c) { return '<th>' + MD.esc(c) + '</th>'; }).join('') +
              '</tr></thead><tbody>';
      r.values.forEach(function (row) {
        html += '<tr>' + row.map(cell).join('') + '</tr>';
      });
      html += '</tbody></table>';
      html += '<div class="sqlp-foot">' + r.values.length + ' row' + (r.values.length === 1 ? '' : 's') +
              ' · ' + (Date.now() - t0) + ' ms</div>';
    });
    out.innerHTML = html;
  }

  /** The page's shared database, seeded on first use. */
  function getDb() {
    if (!dbPromise) {
      dbPromise = loadEngine().then(function (SQL) {
        const db = new SQL.Database();
        db.run(SEED);
        return db;
      });
    }
    return dbPromise;
  }

  /** Throw the current database away and build a fresh one. */
  function reseed() {
    const previous = dbPromise;
    dbPromise = null;
    if (previous) previous.then(function (db) { try { db.close(); } catch (e) {} }, function () {});
    return getDb();
  }

  /** Called when leaving a lesson so the next one starts clean. */
  function discard() {
    const previous = dbPromise;
    dbPromise = null;
    chain = Promise.resolve();
    if (previous) previous.then(function (db) { try { db.close(); } catch (e) {} }, function () {});
  }

  function create(host, opts) {
    const original = opts.code;
    host.className = 'sqlp';
    host.innerHTML =
      '<div class="pg-head"><span class="dot"></span><span class="pg-title">SQL console — sample shop database</span>' +
      '<div class="pg-actions">' +
        '<button class="pg-btn" type="button" data-schema>Schema</button>' +
        '<button class="pg-btn" type="button" data-reset>Reset</button>' +
        '<button class="pg-btn pg-btn-run" type="button" data-run>▶ Run</button>' +
      '</div></div>' +
      '<textarea class="pg-editor" spellcheck="false" aria-label="Editable SQL"></textarea>' +
      '<div class="sqlp-out"><div class="sqlp-msg">Press <strong>Run</strong> to execute (or Ctrl/⌘ + Enter).</div></div>';

    const ta = host.querySelector('.pg-editor');
    const out = host.querySelector('.sqlp-out');
    ta.value = original;
    ta.style.height = Math.min(320, Math.max(90, original.split('\n').length * 22 + 26)) + 'px';

    function run(sql) {
      out.innerHTML = '<div class="sqlp-msg">Running…</div>';
      const t0 = Date.now();
      return getDb().then(function (db) {
        try {
          renderResults(out, db.exec(sql), db, t0);
        } catch (err) {
          out.innerHTML = '<div class="sqlp-msg err">✕ ' + MD.esc(err.message) + '</div>';
        }
      }).catch(function () {
        out.innerHTML = '<div class="sqlp-msg err">✕ Could not start the SQL engine.<br>' +
          'It loads from <code>assets/vendor/sql.js/</code>. Check that folder exists, and that ' +
          'you are viewing this over http:// rather than file:// — browsers refuse to load ' +
          'WebAssembly from the file system. The lesson text and answers still work.</div>';
      });
    }

    host.querySelector('[data-run]').addEventListener('click', function () { run(ta.value); });
    host.querySelector('[data-reset]').addEventListener('click', function () {
      ta.value = original;
      out.innerHTML = '<div class="sqlp-msg">Re-seeding…</div>';
      reseed().then(function () {
        out.innerHTML = '<div class="sqlp-msg ok">✔ Database reset to its original state. ' +
          'Other blocks on this page share it, so re-run them if you need their results back.</div>';
      });
    });
    host.querySelector('[data-schema]').addEventListener('click', function () {
      run("SELECT name AS table_name, sql AS definition FROM sqlite_master WHERE type='table' ORDER BY name;");
    });
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); run(ta.value); }
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const s = ta.selectionStart;
        ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(ta.selectionEnd);
        ta.selectionStart = ta.selectionEnd = s + 2;
      }
    });

    // Queue the first run so blocks execute top to bottom, not all at once.
    if (opts.auto !== false) chain = chain.then(function () { return run(original); });
  }

  return { create: create, seed: SEED, discard: discard, reseed: reseed };
})();
