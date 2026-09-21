// Verifies the curriculum and the content files agree: every lesson has a
// file, every file is referenced, ids are unique, and the Markdown parses
// without leaving unclosed directives or fences.
// Usage: node tools/check-content.js
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');

global.window = {};
require(path.join(root, 'curriculum.js'));
require(path.join(root, 'assets/js/markdown.js'));
const C = global.window.CURRICULUM, MD = global.window.MD;

let problems = 0;
const fail = (m) => { console.log('✗ ' + m); problems++; };

const referenced = new Set();
const ids = new Set();
let lessonCount = 0, playgrounds = 0, quizzes = 0, sqlBlocks = 0, questions = 0;

for (const track of C.tracks) {
  for (const l of track.lessons) {
    lessonCount++;
    if (ids.has(l.id)) fail(`duplicate lesson id: ${l.id}`);
    ids.add(l.id);
    for (const field of ['title', 'summary', 'file']) {
      if (!l[field]) fail(`${l.id} is missing "${field}"`);
    }
    const file = path.join(root, l.file);
    if (!fs.existsSync(file)) { fail(`${l.id}: missing file ${l.file}`); continue; }
    referenced.add(path.resolve(file));

    const md = fs.readFileSync(file, 'utf8');
    if (!md.trim()) fail(`${l.id}: file is empty`);

    // Unbalanced fences or directives would swallow the rest of the lesson.
    const fences = (md.match(/^(```|~~~)/gm) || []).length;
    if (fences % 2 !== 0) fail(`${l.id}: odd number of code fences (${fences})`);
    const opens = (md.match(/^:::\w+/gm) || []).length;
    const closes = (md.match(/^:::\s*$/gm) || []).length;
    if (opens !== closes) fail(`${l.id}: ${opens} directive opens vs ${closes} closes`);

    let result;
    try { result = MD.render(md); }
    catch (e) { fail(`${l.id}: renderer threw — ${e.message}`); continue; }

    if (/<p><\/p>/.test(result.html)) fail(`${l.id}: produced an empty paragraph`);

    for (const b of result.blocks) {
      if (b.kind === 'play') playgrounds++;
      if (b.kind === 'sql') sqlBlocks++;
      if (b.kind === 'quiz') {
        quizzes++;
        const qs = global.window.Quiz ? [] : null;
        const parsed = md.slice(0); // count questions crudely from the block source
        const n = (b.source.match(/^\?\s+/gm) || []).length;
        questions += n;
        if (n === 0) fail(`${l.id}: quiz block with no questions`);
        // every question needs exactly one correct answer
        const perQuestion = b.source.split(/^\?\s+/m).slice(1);
        perQuestion.forEach((q, i) => {
          const correct = (q.match(/^[-*+]\s+.*\s\*$/gm) || []).length;
          if (correct !== 1) fail(`${l.id}: quiz question ${i + 1} has ${correct} correct answers`);
        });
      }
    }
    // Every lesson ends with a self-check, except the closing roadmap,
    // where a graded quiz would be contrived.
    const NO_QUIZ_NEEDED = new Set(['whats-next']);
    if (!NO_QUIZ_NEEDED.has(l.id) && !result.blocks.some(b => b.kind === 'quiz')) {
      fail(`${l.id}: has no quiz`);
    }
  }
}

// Orphaned content files
for (const dir of fs.readdirSync(path.join(root, 'content'))) {
  const d = path.join(root, 'content', dir);
  if (!fs.statSync(d).isDirectory()) continue;
  for (const f of fs.readdirSync(d)) {
    const full = path.resolve(d, f);
    if (!referenced.has(full)) fail(`orphan file not in curriculum: content/${dir}/${f}`);
  }
}

console.log(`\n${C.tracks.length} tracks, ${lessonCount} lessons`);
console.log(`${playgrounds} live playgrounds, ${sqlBlocks} SQL consoles, ${quizzes} quizzes (${questions} questions)`);
console.log(problems ? `\n${problems} problem(s) found.` : '\nAll content checks passed.');
process.exit(problems ? 1 : 0);
