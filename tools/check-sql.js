// Runs every ```sql run block in content/sql against the seeded sample
// database, in the same order the site does, and reports any that error.
// Usage: node tools/check-sql.js
const fs = require('fs'), path = require('path');
global.window = global; // sql-wasm.js UMD
const initSqlJs = require(require('path').resolve(__dirname, '../assets/vendor/sql.js/sql-wasm.js'));

// Pull the SEED out of sqlplay.js so the check uses exactly the site's data.
const src = fs.readFileSync('assets/js/sqlplay.js', 'utf8');
const SEED = src.slice(src.indexOf('const SEED = `') + 14, src.indexOf('`;\n\n  let SQLPromise'));

function blocks(md) {
  const out = [];
  const re = /```sql\s+run\s*\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(md))) out.push(m[1]);
  return out;
}

(async () => {
  const SQL = await initSqlJs({ locateFile: f => require('path').resolve(__dirname, '../assets/vendor/sql.js/') + '/' + f });
  const dir = 'content/sql';
  let total = 0, failed = 0;

  for (const file of fs.readdirSync(dir).sort()) {
    const md = fs.readFileSync(path.join(dir, file), 'utf8');
    const bs = blocks(md);
    if (!bs.length) continue;
    const db = new SQL.Database();
    db.run(SEED);                       // fresh DB per lesson, shared by its blocks
    bs.forEach((sql, i) => {
      total++;
      try {
        db.exec(sql);
      } catch (e) {
        // A block that deliberately demonstrates a constraint failure is fine.
        const intentional = /refuses invalid data|fails with|deliberately|terrifying/i.test(sql) ||
          /refuses invalid data|fails with|deliberately/i.test(md.slice(Math.max(0, md.indexOf(sql) - 400), md.indexOf(sql)));
        if (intentional) { console.log(`  (expected error) ${file} #${i + 1}: ${e.message}`); return; }
        failed++;
        console.log(`✗ ${file} block ${i + 1}: ${e.message}\n    ${sql.trim().split('\n')[0]}`);
      }
    });
    db.close();
  }
  console.log(`\n${total} SQL blocks checked, ${failed} failing.`);
  process.exit(failed ? 1 : 0);
})();
