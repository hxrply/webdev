/* ============================================================
   quiz.js — multiple-choice checks parsed from lesson Markdown.

     :::quiz
     ? Which element is the top-level heading?
     - <h1> *
     - <header>
     > There is one <h1> per page: the page's title.
     :::

   A trailing "*" marks the correct option; "> ..." is the
   explanation shown once the learner answers.
   ============================================================ */
window.Quiz = (function () {
  'use strict';

  function parse(src) {
    const questions = [];
    let cur = null;
    src.split('\n').forEach(function (raw) {
      const line = raw.trim();
      if (!line) return;
      if (line[0] === '?') {
        cur = { text: line.slice(1).trim(), options: [], explain: '' };
        questions.push(cur);
      } else if (cur && /^[-*+]\s+/.test(line)) {
        const body = line.replace(/^[-*+]\s+/, '');
        const correct = /\s\*$/.test(body);
        cur.options.push({ text: correct ? body.replace(/\s\*$/, '') : body, correct: correct });
      } else if (cur && line[0] === '>') {
        cur.explain += (cur.explain ? ' ' : '') + line.slice(1).trim();
      } else if (cur && cur.options.length && cur.explain) {
        cur.explain += ' ' + line;
      }
    });
    return questions.filter(function (q) { return q.options.length; });
  }

  const LETTERS = 'ABCDEFGH';

  function create(host, opts) {
    const questions = parse(opts.source);
    if (!questions.length) { host.remove(); return; }

    let answered = 0, right = 0;

    host.className = 'quiz';
    let html = '<div class="quiz-head"><h3>' + MD.esc(opts.title || 'Check yourself') + '</h3>' +
               '<span class="quiz-score" data-score>0 / ' + questions.length + '</span></div>';

    questions.forEach(function (q, qi) {
      html += '<div class="q" data-q="' + qi + '">' +
              '<div class="q-text">' + MD.inline(q.text) + '</div><div class="opts">';
      q.options.forEach(function (o, oi) {
        html += '<button class="opt" type="button" data-opt="' + oi + '">' +
                '<span class="mark" aria-hidden="true">' + LETTERS[oi] + '</span>' +
                '<span>' + MD.inline(o.text) + '</span></button>';
      });
      html += '</div></div>';
    });
    host.innerHTML = html;

    const score = host.querySelector('[data-score]');

    host.addEventListener('click', function (e) {
      const btn = e.target.closest('.opt');
      if (!btn || btn.disabled) return;
      const qEl = btn.closest('.q');
      const q = questions[+qEl.dataset.q];
      const chosen = q.options[+btn.dataset.opt];

      qEl.querySelectorAll('.opt').forEach(function (b, i) {
        b.disabled = true;
        if (q.options[i].correct) { b.classList.add('correct'); b.querySelector('.mark').textContent = '✓'; }
      });
      if (!chosen.correct) { btn.classList.add('wrong'); btn.querySelector('.mark').textContent = '✕'; }

      answered++;
      if (chosen.correct) right++;
      score.textContent = right + ' / ' + questions.length;
      if (answered === questions.length) {
        score.style.color = right === questions.length ? 'var(--ok)' : '';
      }

      if (q.explain) {
        const ex = document.createElement('div');
        ex.className = 'q-explain';
        ex.innerHTML = '<strong>' + (chosen.correct ? 'Correct. ' : 'Not quite. ') + '</strong>' + MD.inline(q.explain);
        qEl.appendChild(ex);
      }
    });
  }

  return { create: create, parse: parse };
})();
