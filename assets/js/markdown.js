/* ============================================================
   markdown.js — a small Markdown renderer built for this site.
   Supports the usual blocks plus three custom directives:
     :::note / :::tip / :::warn / :::gotcha / :::exercise   callouts
     :::quiz ... :::                                        interactive quiz
     ```lang run                                            live playground
     ```sql run                                             live SQL console
   Interactive blocks are returned as placeholders in `blocks`
   so app.js can hydrate them after insertion.
   ============================================================ */
window.MD = (function () {
  'use strict';

  /* ---------- escaping ---------- */
  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- syntax highlighting ----------
     Tokenises the RAW source (escaping each token as it is emitted) so
     HTML entities can never be mangled by a later regex pass. */
  const KW_JS = /^(?:const|let|var|function|return|if|else|for|while|of|in|do|switch|case|default|break|continue|new|class|extends|super|this|typeof|instanceof|null|undefined|true|false|async|await|try|catch|finally|throw|import|export|from|delete|void|yield|static)\b/;
  const KW_SQL = /^(?:SELECT|FROM|WHERE|AND|OR|NOT|NULL|IS|IN|LIKE|BETWEEN|ORDER|GROUP|BY|HAVING|LIMIT|OFFSET|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|CROSS|ON|AS|DISTINCT|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|VIEW|INDEX|DROP|ALTER|ADD|COLUMN|PRIMARY|KEY|FOREIGN|REFERENCES|UNIQUE|CHECK|DEFAULT|AUTOINCREMENT|INTEGER|TEXT|REAL|BLOB|BOOLEAN|VARCHAR|DATE|TIMESTAMP|CASE|WHEN|THEN|ELSE|END|UNION|ALL|EXISTS|WITH|RECURSIVE|BEGIN|COMMIT|ROLLBACK|TRANSACTION|DESC|ASC|COUNT|SUM|AVG|MIN|MAX|ROUND|COALESCE|CAST|LENGTH|UPPER|LOWER|SUBSTR|REPLACE|STRFTIME|IFNULL|NULLIF|OVER|PARTITION|ROW_NUMBER|RANK|EXPLAIN|PRAGMA|IF)\b/i;

  const RULES = {
    js: [
      [/^\/\/[^\n]*/, 'com'], [/^\/\*[\s\S]*?\*\//, 'com'],
      [/^"(?:[^"\\\n]|\\.)*"?/, 'str'], [/^'(?:[^'\\\n]|\\.)*'?/, 'str'],
      [/^`(?:[^`\\]|\\.)*`?/, 'str'],
      [/^\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?\b/, 'num'],
      [KW_JS, 'key'],
      [/^[A-Za-z_$][\w$]*(?=\s*\()/, 'fn'],
      [/^[{}()[\];,.]/, 'pun']
    ],
    css: [
      [/^\/\*[\s\S]*?\*\//, 'com'],
      [/^"(?:[^"\\\n]|\\.)*"/, 'str'], [/^'(?:[^'\\\n]|\\.)*'/, 'str'],
      [/^@[\w-]+/, 'key'],
      [/^[-a-zA-Z]+(?=\s*:)/, 'atr'],
      [/^[.#][\w-]+/, 'tag'],
      [/^-?\d*\.?\d+(?:px|r?em|%|vh|vw|vmin|vmax|s|ms|deg|fr|ch|ex|pt|cm|mm|in)?\b/, 'num'],
      [/^#[0-9a-fA-F]{3,8}\b/, 'num'],
      [/^[{}();,]/, 'pun']
    ],
    html: [
      [/^<!--[\s\S]*?-->/, 'com'],
      [/^<\/?[A-Za-z][\w-]*/, 'tag'],
      [/^"(?:[^"\\\n]|\\.)*"/, 'str'], [/^'(?:[^'\\\n]|\\.)*'/, 'str'],
      [/^[A-Za-z_:@][\w\-:.]*(?=\s*=)/, 'atr'],
      [/^\/?>/, 'tag']
    ],
    sql: [
      [/^--[^\n]*/, 'com'], [/^\/\*[\s\S]*?\*\//, 'com'],
      [/^'(?:[^'\\]|\\.|'')*'/, 'str'],
      [KW_SQL, 'key'],
      [/^\b\d+(?:\.\d+)?\b/, 'num'],
      [/^[(),;*]/, 'pun']
    ],
    bash: [
      [/^#[^\n]*/, 'com'],
      [/^"(?:[^"\\\n]|\\.)*"/, 'str'], [/^'[^'\n]*'/, 'str'],
      [/^\$\w+|^\$\{[^}]*\}/, 'atr'],
      [/^\b(?:npm|npx|node|git|cd|mkdir|ls|cat|curl|echo|sudo|python3?|pip|docker|export|rm|cp|mv|touch|chmod)\b/, 'key'],
      [/^\s-{1,2}[\w-]+/, 'num']
    ],
    json: [
      [/^"(?:[^"\\]|\\.)*"(?=\s*:)/, 'atr'],
      [/^"(?:[^"\\]|\\.)*"/, 'str'],
      [/^\b(?:true|false|null)\b/, 'key'],
      [/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/, 'num'],
      [/^[{}[\],:]/, 'pun']
    ]
  };

  const ALIAS = {
    javascript: 'js', jsx: 'js', ts: 'js', typescript: 'js', node: 'js',
    shell: 'bash', sh: 'bash', console: 'bash', terminal: 'bash',
    markup: 'html', xml: 'html', svg: 'html', text: null, txt: null, plain: null
  };

  function highlight(code, lang) {
    const key = ALIAS[lang] !== undefined ? ALIAS[lang] : lang;
    const rules = RULES[key];
    if (!rules) return esc(code);
    let out = '', i = 0;
    while (i < code.length) {
      const rest = code.slice(i);
      let matched = false;
      for (let r = 0; r < rules.length; r++) {
        const m = rules[r][0].exec(rest);
        if (m && m[0].length) {
          out += '<span class="tok-' + rules[r][1] + '">' + esc(m[0]) + '</span>';
          i += m[0].length;
          matched = true;
          break;
        }
      }
      if (!matched) { out += esc(code[i]); i++; }
    }
    return out;
  }

  /* ---------- inline ---------- */
  function inline(text) {
    // Split out code spans first so their contents are never re-parsed.
    const parts = text.split(/(`+)((?:(?!\1)[\s\S])+?)\1/g);
    let out = '';
    for (let i = 0; i < parts.length; i++) {
      if (i % 3 === 0) out += inlineFmt(parts[i]);
      else if (i % 3 === 2) out += '<code>' + esc(parts[i]) + '</code>';
    }
    return out;
  }

  function inlineFmt(s) {
    s = esc(s);
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, label, href) {
      const ext = /^https?:/.test(href);
      return '<a href="' + href + '"' + (ext ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + label + '</a>';
    });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>');
    s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    return s;
  }

  function slug(s) {
    return s.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\w\s-]/g, '')
            .trim().replace(/\s+/g, '-').slice(0, 60);
  }

  /* ---------- block parser ---------- */
  function render(src) {
    const blocks = [];            // interactive blocks for app.js to hydrate
    let uid = 0;
    const lines = src.replace(/\r\n?/g, '\n').replace(/\t/g, '  ').split('\n');
    let out = '';
    let i = 0;

    function id() { return 'md-blk-' + (++uid); }

    while (i < lines.length) {
      const line = lines[i];

      /* blank */
      if (!line.trim()) { i++; continue; }

      /* fenced code */
      const fence = /^(`{3,}|~{3,})\s*([\w-]*)\s*(.*)$/.exec(line);
      if (fence) {
        const close = fence[1][0].repeat(3);
        const lang = (fence[2] || '').toLowerCase();
        const meta = (fence[3] || '').trim();
        const body = [];
        i++;
        while (i < lines.length && !new RegExp('^' + close).test(lines[i])) { body.push(lines[i]); i++; }
        i++;
        const code = body.join('\n');

        if (/\brun\b/.test(meta) && lang === 'sql') {
          const bid = id();
          blocks.push({ kind: 'sql', id: bid, code: code });
          out += '<div id="' + bid + '"></div>';
        } else if (/\brun\b/.test(meta)) {
          const bid = id();
          blocks.push({ kind: 'play', id: bid, code: code, lang: lang || 'html', title: /title="([^"]*)"/.exec(meta) ? /title="([^"]*)"/.exec(meta)[1] : '' });
          out += '<div id="' + bid + '"></div>';
        } else {
          const label = /file="([^"]*)"/.exec(meta);
          out += '<div class="code-wrap"><div class="code-head"><span class="code-lang">' +
                 esc(label ? label[1] : (lang || 'code')) + '</span>' +
                 '<button class="copy-btn" type="button" data-copy>Copy</button></div>' +
                 '<pre><code>' + highlight(code, lang) + '</code></pre></div>';
        }
        continue;
      }

      /* directives ::: */
      const dir = /^:::(\w+)\s*(.*)$/.exec(line);
      if (dir) {
        const kind = dir[1].toLowerCase();
        const title = dir[2].trim();
        const body = [];
        i++;
        let depth = 1;
        while (i < lines.length) {
          if (/^:::\w/.test(lines[i])) depth++;
          else if (/^:::\s*$/.test(lines[i])) { depth--; if (!depth) break; }
          body.push(lines[i]); i++;
        }
        i++;
        const inner = body.join('\n');

        if (kind === 'quiz') {
          const bid = id();
          blocks.push({ kind: 'quiz', id: bid, source: inner, title: title });
          out += '<div id="' + bid + '"></div>';
        } else if (kind === 'exercise') {
          out += '<div class="exercise"><div class="exercise-title">' +
                 esc(title || 'Your turn') + '</div>' + render(inner).html + '</div>';
        } else {
          const icons = { note: 'ℹ️', tip: '💡', warn: '⚠️', gotcha: '🐛' };
          const heads = { note: 'Note', tip: 'Tip', warn: 'Watch out', gotcha: 'Common mistake' };
          const k = icons[kind] ? kind : 'note';
          out += '<div class="callout callout-' + k + '"><span class="callout-icon" aria-hidden="true">' +
                 icons[k] + '</span><div class="callout-body"><div class="callout-title">' +
                 esc(title || heads[k]) + '</div>' + render(inner).html + '</div></div>';
        }
        continue;
      }

      /* heading */
      const h = /^(#{1,6})\s+(.*)$/.exec(line);
      if (h) {
        const lvl = Math.min(h[1].length + 1, 6);   // '#' in content renders as <h2>
        const txt = inline(h[2]);
        const anchor = slug(h[2]);
        out += '<h' + lvl + ' id="' + anchor + '" class="anchor-h">' +
               '<a class="anchor-link" href="#' + anchor + '" aria-hidden="true">#</a>' + txt + '</h' + lvl + '>';
        i++;
        continue;
      }

      /* hr */
      if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { out += '<hr>'; i++; continue; }

      /* table */
      if (/^\|/.test(line) && i + 1 < lines.length && /^\|?[\s:|-]+\|/.test(lines[i + 1])) {
        const cells = function (row) {
          return row.replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); });
        };
        const head = cells(line);
        const aligns = cells(lines[i + 1]).map(function (c) {
          if (/^:-+:$/.test(c)) return ' style="text-align:center"';
          if (/-+:$/.test(c)) return ' style="text-align:right"';
          return '';
        });
        i += 2;
        let html = '<div class="table-wrap"><table><thead><tr>';
        head.forEach(function (c, n) { html += '<th' + (aligns[n] || '') + '>' + inline(c) + '</th>'; });
        html += '</tr></thead><tbody>';
        while (i < lines.length && /^\|/.test(lines[i])) {
          html += '<tr>';
          cells(lines[i]).forEach(function (c, n) { html += '<td' + (aligns[n] || '') + '>' + inline(c) + '</td>'; });
          html += '</tr>';
          i++;
        }
        out += html + '</tbody></table></div>';
        continue;
      }

      /* blockquote */
      if (/^>\s?/.test(line)) {
        const body = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) { body.push(lines[i].replace(/^>\s?/, '')); i++; }
        out += '<blockquote>' + render(body.join('\n')).html + '</blockquote>';
        continue;
      }

      /* lists (supports nesting by indentation) */
      if (/^\s*(?:[-*+]|\d+\.)\s+/.test(line)) {
        const res = parseList(lines, i, 0);
        out += res.html;
        i = res.next;
        continue;
      }

      /* paragraph */
      const para = [];
      while (i < lines.length && lines[i].trim() &&
             !/^(#{1,6}\s|>|:::|\||\s*(?:[-*+]|\d+\.)\s|(`{3,}|~{3,}))/.test(lines[i]) &&
             !/^(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i])) {
        para.push(lines[i]); i++;
      }
      if (para.length) out += '<p>' + inline(para.join('\n')) + '</p>';
      else { out += '<p>' + inline(lines[i]) + '</p>'; i++; }
    }

    return { html: out, blocks: blocks };

    /* nested list helper */
    function parseList(ls, start, indent) {
      const first = /^(\s*)(?:([-*+])|(\d+)\.)\s+/.exec(ls[start]);
      const ordered = !first[2];
      const tag = ordered ? 'ol' : 'ul';
      let html = '<' + tag + '>';
      let n = start;
      while (n < ls.length) {
        const m = /^(\s*)(?:([-*+])|(\d+)\.)\s+(.*)$/.exec(ls[n]);
        if (!m) {
          if (!ls[n].trim() && n + 1 < ls.length && /^\s*(?:[-*+]|\d+\.)\s+/.test(ls[n + 1])) { n++; continue; }
          break;
        }
        const ind = m[1].length;
        if (ind < indent) break;
        if (ind > indent) {                       // nested list
          const sub = parseList(ls, n, ind);
          html = html.replace(/<\/li>$/, '') + sub.html + '</li>';
          n = sub.next;
          continue;
        }
        // continuation lines belonging to this item
        const item = [m[4]];
        n++;
        while (n < ls.length && ls[n].trim() && !/^\s*(?:[-*+]|\d+\.)\s+/.test(ls[n]) &&
               /^\s{2,}/.test(ls[n])) { item.push(ls[n].trim()); n++; }
        html += '<li>' + inline(item.join(' ')) + '</li>';
      }
      return { html: html + '</' + tag + '>', next: n };
    }
  }

  return { render: render, highlight: highlight, esc: esc, inline: inline, slug: slug };
})();
