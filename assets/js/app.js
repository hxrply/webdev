/* ============================================================
   app.js — router, navigation, progress tracking and search.
   ============================================================ */
(function () {
  'use strict';

  const C = window.CURRICULUM;
  const view = document.getElementById('view');
  const navTree = document.getElementById('navTree');
  const STORE_PROGRESS = 'webcraft.progress.v1';
  const STORE_THEME = 'webcraft.theme';
  const STORE_LAST = 'webcraft.last';

  /* ---------- flat lesson index ---------- */
  const lessons = [];
  C.tracks.forEach(function (t) {
    t.lessons.forEach(function (l, i) {
      lessons.push(Object.assign({}, l, { track: t, indexInTrack: i, order: lessons.length }));
    });
  });
  const byId = {};
  lessons.forEach(function (l) { byId[l.id] = l; });

  /* ---------- storage helpers (private mode can throw) ---------- */
  function read(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }

  let done = new Set(read(STORE_PROGRESS, []));
  function saveProgress() { write(STORE_PROGRESS, Array.from(done)); }
  function isDone(id) { return done.has(id); }

  /* ---------- theme ---------- */
  const themeBtn = document.getElementById('themeBtn');
  const savedTheme = read(STORE_THEME, null);
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    document.documentElement.dataset.theme = 'light';
  }
  themeBtn.addEventListener('click', function () {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    write(STORE_THEME, next);
  });

  /* ---------- sidebar ---------- */
  const sidebar = document.getElementById('sidebar');
  const scrim = document.getElementById('scrim');
  const menuBtn = document.getElementById('menuBtn');

  function closeNav() {
    sidebar.classList.remove('open');
    scrim.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
  }
  menuBtn.addEventListener('click', function () {
    const open = sidebar.classList.toggle('open');
    scrim.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  scrim.addEventListener('click', closeNav);

  const TICK = '<svg class="tick" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.2l2.4 2.4 4.6-4.8"/></svg>';
  const CHEV = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';

  function buildNav() {
    navTree.innerHTML = C.tracks.map(function (t) {
      const doneCount = t.lessons.filter(function (l) { return isDone(l.id); }).length;
      return '<details class="nav-track" data-track="' + t.id + '">' +
        '<summary class="nav-track-btn">' + CHEV +
          '<span class="nav-emoji" aria-hidden="true">' + t.emoji + '</span>' +
          '<span class="nav-track-name">' + MD.esc(t.name) + '</span>' +
          '<span class="nav-track-count">' + doneCount + '/' + t.lessons.length + '</span>' +
        '</summary><ul class="nav-lessons">' +
        t.lessons.map(function (l) {
          return '<li><a href="#/lesson/' + l.id + '" data-lesson="' + l.id + '"' +
                 (isDone(l.id) ? ' class="done"' : '') + '>' + TICK +
                 '<span>' + MD.esc(l.title) + '</span></a></li>';
        }).join('') +
        '</ul></details>';
    }).join('');
    highlightNav();
    updateProgressUI();
  }

  function highlightNav() {
    const id = (location.hash.match(/^#\/lesson\/(.+)$/) || [])[1];
    navTree.querySelectorAll('.nav-lessons a').forEach(function (a) {
      a.classList.toggle('current', a.dataset.lesson === id);
    });
    if (id && byId[id]) {
      const d = navTree.querySelector('[data-track="' + byId[id].track.id + '"]');
      if (d) d.open = true;
    }
  }

  function updateProgressUI() {
    const total = lessons.length;
    const n = lessons.filter(function (l) { return isDone(l.id); }).length;
    document.getElementById('progressCount').textContent = n + ' / ' + total;
    document.getElementById('progressBar').style.width = (total ? (n / total) * 100 : 0) + '%';
    navTree.querySelectorAll('.nav-track').forEach(function (d) {
      const t = C.tracks.find(function (x) { return x.id === d.dataset.track; });
      const c = t.lessons.filter(function (l) { return isDone(l.id); }).length;
      d.querySelector('.nav-track-count').textContent = c + '/' + t.lessons.length;
    });
    navTree.querySelectorAll('.nav-lessons a').forEach(function (a) {
      a.classList.toggle('done', isDone(a.dataset.lesson));
    });
  }

  document.getElementById('resetBtn').addEventListener('click', function () {
    if (!confirm('Clear every completed lesson? This cannot be undone.')) return;
    done = new Set();
    saveProgress();
    buildNav();
    route();
  });

  /* ---------- views ---------- */
  function bar(pct) { return '<div class="bar"><div class="bar-fill" style="width:' + pct + '%"></div></div>'; }

  function renderHome() {
    const total = lessons.length;
    const n = lessons.filter(function (l) { return isDone(l.id); }).length;
    const lastId = read(STORE_LAST, null);
    const next = (lastId && byId[lastId]) ? byId[lastId]
               : lessons.find(function (l) { return !isDone(l.id); }) || lessons[0];

    view.innerHTML =
      '<section class="hero">' +
        '<h1>Learn to build <span class="grad">for the web</span>,<br>one small piece at a time.</h1>' +
        '<p>' + MD.esc(C.blurb) + '</p>' +
        '<div class="hero-actions">' +
          '<a class="btn btn-primary" href="#/lesson/' + next.id + '">' +
            (n ? 'Continue: ' + MD.esc(next.title) : 'Start with lesson one') + '</a>' +
          '<a class="btn" href="#/track/' + C.tracks[0].id + '">Browse the syllabus</a>' +
        '</div>' +
        '<div class="stats">' +
          '<div><div class="stat-num">' + C.tracks.length + '</div><div class="stat-label">tracks</div></div>' +
          '<div><div class="stat-num">' + total + '</div><div class="stat-label">lessons</div></div>' +
          '<div><div class="stat-num">' + n + '</div><div class="stat-label">completed by you</div></div>' +
        '</div>' +
      '</section>' +
      '<div class="section-head"><h2>The tracks</h2>' +
        '<p>Work top to bottom, or jump to whatever you need today.</p></div>' +
      '<div class="track-grid">' +
        C.tracks.map(function (t) {
          const dc = t.lessons.filter(function (l) { return isDone(l.id); }).length;
          const pct = Math.round((dc / t.lessons.length) * 100);
          return '<a class="track-card" href="#/track/' + t.id + '">' +
            '<div class="track-card-top"><span class="track-card-emoji" aria-hidden="true">' + t.emoji + '</span>' +
            '<h3>' + MD.esc(t.name) + '</h3></div>' +
            '<p>' + MD.esc(t.blurb) + '</p>' + bar(pct) +
            '<div class="track-card-meta"><span>' + t.lessons.length + ' lessons</span><span>' + pct + '%</span></div>' +
          '</a>';
        }).join('') +
      '</div>' +
      '<div class="section-head"><h2>How to use this site</h2></div>' +
      '<div class="prose">' + MD.render(C.howto).html + '</div>';
    document.title = C.title;
  }

  function renderTrack(id) {
    const t = C.tracks.find(function (x) { return x.id === id; });
    if (!t) return renderMissing('That track does not exist.');
    const dc = t.lessons.filter(function (l) { return isDone(l.id); }).length;
    view.innerHTML =
      '<div class="crumb"><a href="#/">Home</a> / ' + MD.esc(t.name) + '</div>' +
      '<div class="lesson-head"><h1>' + t.emoji + ' ' + MD.esc(t.name) + '</h1>' +
      '<p class="lesson-summary">' + MD.esc(t.blurb) + '</p></div>' +
      '<div class="lesson-meta"><span class="pill">' + t.lessons.length + ' lessons</span>' +
      '<span class="pill' + (dc === t.lessons.length ? ' pill-accent' : '') + '">' + dc + ' completed</span></div>' +
      '<ul class="lesson-list">' +
        t.lessons.map(function (l, i) {
          return '<li><a href="#/lesson/' + l.id + '"' + (isDone(l.id) ? ' class="done"' : '') + '>' +
            '<span class="lesson-num">' + (isDone(l.id) ? '✓' : i + 1) + '</span>' +
            '<span><span class="li-title">' + MD.esc(l.title) + '</span><br>' +
            '<span class="li-sum">' + MD.esc(l.summary) + '</span></span></a></li>';
        }).join('') +
      '</ul>';
    document.title = t.name + ' — ' + C.title;
  }

  function renderMissing(msg) {
    view.innerHTML = '<div class="error-box"><h2>Not found</h2><p>' + MD.esc(msg) +
      '</p><p><a href="#/">Back to the home page</a></p></div>';
  }

  const cache = new Map();

  function renderLesson(id) {
    const l = byId[id];
    if (!l) return renderMissing('There is no lesson with the id "' + id + '".');

    write(STORE_LAST, id);
    document.title = l.title + ' — ' + C.title;
    view.innerHTML = '<div class="loading"><div class="spinner"></div>Loading lesson…</div>';

    const fetchMd = cache.has(id)
      ? Promise.resolve(cache.get(id))
      : fetch(l.file, { cache: 'no-cache' }).then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.text();
        }).then(function (txt) { cache.set(id, txt); return txt; });

    fetchMd.then(function (md) { paintLesson(l, md); }).catch(function (err) { paintLoadError(l, err); });
  }

  function paintLesson(l, md) {
    const prev = lessons[l.order - 1];
    const next = lessons[l.order + 1];
    const result = MD.render(md);
    const doneNow = isDone(l.id);

    view.innerHTML =
      '<article>' +
        '<div class="crumb"><a href="#/">Home</a> / <a href="#/track/' + l.track.id + '">' +
          MD.esc(l.track.name) + '</a></div>' +
        '<div class="lesson-head"><h1>' + MD.esc(l.title) + '</h1>' +
        '<p class="lesson-summary">' + MD.esc(l.summary) + '</p></div>' +
        '<div class="lesson-meta">' +
          '<span class="pill pill-accent">Lesson ' + (l.indexInTrack + 1) + ' of ' + l.track.lessons.length + '</span>' +
          '<span class="pill">≈ ' + (l.minutes || 8) + ' min</span>' +
          (l.tags || []).map(function (t) { return '<span class="pill">' + MD.esc(t) + '</span>'; }).join('') +
        '</div>' +
        '<div class="prose" id="prose">' + result.html + '</div>' +
        '<div class="lesson-foot">' +
          '<div class="complete-row">' +
            '<button class="complete-btn' + (doneNow ? ' is-done' : '') + '" type="button" id="completeBtn">' +
              '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l5 5 9-10"/></svg>' +
              '<span>' + (doneNow ? 'Completed' : 'Mark as complete') + '</span></button>' +
            '<span class="complete-hint">' + (doneNow ? 'Click again to un-mark it.' : 'Saved in this browser only.') + '</span>' +
          '</div>' +
          '<nav class="pager">' +
            (prev ? '<a href="#/lesson/' + prev.id + '"><span class="dir">← Previous</span>' +
                    '<span class="ttl">' + MD.esc(prev.title) + '</span></a>' : '<span></span>') +
            (next ? '<a class="next" href="#/lesson/' + next.id + '"><span class="dir">Next →</span>' +
                    '<span class="ttl">' + MD.esc(next.title) + '</span></a>' : '') +
          '</nav>' +
        '</div>' +
      '</article>';

    // Hydrate interactive blocks.
    result.blocks.forEach(function (b) {
      const host = document.getElementById(b.id);
      if (!host) return;
      if (b.kind === 'play') Playground.create(host, { code: b.code, lang: b.lang, title: b.title });
      else if (b.kind === 'sql') SQLPlay.create(host, { code: b.code });
      else if (b.kind === 'quiz') Quiz.create(host, { source: b.source, title: b.title });
    });

    // Copy buttons.
    view.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const code = btn.closest('.code-wrap').querySelector('code').innerText;
        const ok = function () {
          btn.textContent = 'Copied!'; btn.classList.add('copied');
          setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1400);
        };
        if (navigator.clipboard) navigator.clipboard.writeText(code).then(ok, function () {});
        else {
          const ta = document.createElement('textarea');
          ta.value = code; document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); ok(); } catch (e) {}
          ta.remove();
        }
      });
    });

    const cbtn = document.getElementById('completeBtn');
    cbtn.addEventListener('click', function () {
      if (isDone(l.id)) done.delete(l.id); else done.add(l.id);
      saveProgress();
      const now = isDone(l.id);
      cbtn.classList.toggle('is-done', now);
      cbtn.querySelector('span').textContent = now ? 'Completed' : 'Mark as complete';
      cbtn.nextElementSibling.textContent = now ? 'Click again to un-mark it.' : 'Saved in this browser only.';
      updateProgressUI();
      if (now && next) setTimeout(function () { location.hash = '#/lesson/' + next.id; }, 450);
    });

    highlightNav();
    // Jump to an in-page anchor if the URL carried one.
    const anchor = (location.hash.split('#')[2] || '');
    if (anchor) {
      const target = document.getElementById(anchor);
      if (target) target.scrollIntoView();
    }
  }

  function paintLoadError(l, err) {
    const isFile = location.protocol === 'file:';
    view.innerHTML = '<div class="error-box"><h2>Couldn’t load this lesson</h2>' +
      (isFile
        ? '<p>You opened this site straight from the file system, and browsers block pages ' +
          'from reading local files that way (it is a security rule called the same-origin policy).</p>' +
          '<p>Start a tiny local web server from the project folder instead:</p>' +
          '<p><code>python3 -m http.server 8000</code></p>' +
          '<p>…then open <code>http://localhost:8000</code>.</p>'
        : '<p>Tried to fetch <code>' + MD.esc(l.file) + '</code> and got: <code>' +
          MD.esc(err.message) + '</code></p>') +
      '</div>';
  }

  /* ---------- search ---------- */
  const search = document.getElementById('search');
  const results = document.getElementById('searchResults');
  let activeIdx = -1;

  function scoreLesson(l, q) {
    const title = l.title.toLowerCase();
    const summary = l.summary.toLowerCase();
    const tags = (l.tags || []).join(' ').toLowerCase();
    const track = l.track.name.toLowerCase();
    if (title.startsWith(q)) return 100;
    if (title.includes(q)) return 80;
    if (tags.includes(q)) return 60;
    if (summary.includes(q)) return 40;
    if (track.includes(q)) return 20;
    return 0;
  }

  function runSearch() {
    const q = search.value.trim().toLowerCase();
    activeIdx = -1;
    if (q.length < 2) { results.hidden = true; search.setAttribute('aria-expanded', 'false'); return; }
    const hits = lessons.map(function (l) { return { l: l, s: scoreLesson(l, q) }; })
                        .filter(function (h) { return h.s > 0; })
                        .sort(function (a, b) { return b.s - a.s || a.l.order - b.l.order; })
                        .slice(0, 12);
    results.innerHTML = hits.length
      ? hits.map(function (h) {
          return '<a class="sr-item" href="#/lesson/' + h.l.id + '" role="option">' +
            '<div class="sr-title">' + MD.esc(h.l.title) + '</div>' +
            '<div class="sr-meta">' + h.l.track.emoji + ' ' + MD.esc(h.l.track.name) + ' · ' +
            MD.esc(h.l.summary) + '</div></a>';
        }).join('')
      : '<div class="sr-empty">No lessons match “' + MD.esc(search.value) + '”.</div>';
    results.hidden = false;
    search.setAttribute('aria-expanded', 'true');
  }

  search.addEventListener('input', runSearch);
  search.addEventListener('focus', runSearch);
  search.addEventListener('keydown', function (e) {
    const items = Array.from(results.querySelectorAll('.sr-item'));
    if (e.key === 'Escape') { results.hidden = true; search.blur(); return; }
    if (!items.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      activeIdx = (activeIdx + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach(function (it, i) { it.classList.toggle('active', i === activeIdx); });
      items[activeIdx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && activeIdx > -1) {
      e.preventDefault();
      location.hash = items[activeIdx].getAttribute('href');
      search.blur();
    }
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.search-wrap')) results.hidden = true;
  });
  document.addEventListener('keydown', function (e) {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (e.key === '/' && !typing) { e.preventDefault(); search.focus(); search.select(); }
  });

  /* ---------- routing ---------- */
  function route() {
    const hash = location.hash || '#/';
    results.hidden = true;
    closeNav();

    let m;
    if ((m = hash.match(/^#\/lesson\/([^#]+)/))) renderLesson(m[1]);
    else if ((m = hash.match(/^#\/track\/([^#]+)/))) renderTrack(m[1]);
    else renderHome();

    highlightNav();
    if (!/^#\/lesson\/[^#]+#/.test(hash)) window.scrollTo(0, 0);
    document.getElementById('main').focus({ preventScroll: true });
  }

  window.addEventListener('hashchange', route);
  buildNav();
  route();
})();
