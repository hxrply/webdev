/* ============================================================
   sqlplay.js — a real SQL console in the browser.
   Uses sql.js (SQLite compiled to WebAssembly), loaded lazily
   from a CDN the first time a SQL lesson is opened. Every block
   gets its own seeded copy of the sample database, so writes in
   one lesson can't surprise you in another.
   ============================================================ */
window.SQLPlay = (function () {
  'use strict';

  const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/';

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

  let SQLPromise = null;

  function loadEngine() {
    if (SQLPromise) return SQLPromise;
    SQLPromise = new Promise(function (resolve, reject) {
      if (window.initSqlJs) return resolve(window.initSqlJs({ locateFile: function (f) { return CDN + f; } }));
      const s = document.createElement('script');
      s.src = CDN + 'sql-wasm.js';
      s.onload = function () {
        window.initSqlJs({ locateFile: function (f) { return CDN + f; } }).then(resolve, reject);
      };
      s.onerror = function () { reject(new Error('offline')); };
      document.head.appendChild(s);
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

    let db = null;

    function openDb() {
      return loadEngine().then(function (SQL) {
        if (db) db.close();
        db = new SQL.Database();
        db.run(SEED);
        return db;
      });
    }

    function run(sql) {
      out.innerHTML = '<div class="sqlp-msg">Running…</div>';
      const t0 = Date.now();
      (db ? Promise.resolve(db) : openDb()).then(function (d) {
        try {
          renderResults(out, d.exec(sql), d, t0);
        } catch (err) {
          out.innerHTML = '<div class="sqlp-msg err">✕ ' + MD.esc(err.message) + '</div>';
        }
      }).catch(function () {
        out.innerHTML = '<div class="sqlp-msg err">✕ Could not load the SQL engine.<br>' +
          'It is fetched from a CDN the first time you open a SQL lesson, so this page needs ' +
          'an internet connection to run queries. The lesson text and answers all still work.</div>';
      });
    }

    host.querySelector('[data-run]').addEventListener('click', function () { run(ta.value); });
    host.querySelector('[data-reset]').addEventListener('click', function () {
      ta.value = original;
      openDb().then(function () {
        out.innerHTML = '<div class="sqlp-msg ok">✔ Database reset to its original state.</div>';
      }).catch(function () {});
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

    if (opts.auto !== false) run(original);
  }

  return { create: create, seed: SEED };
})();
