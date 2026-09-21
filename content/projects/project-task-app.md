This project is about **architecture**: how to structure an interactive application so it stays comprehensible as it grows. The task list is an excuse; the pattern is the point.

# The pattern

```text
   state  ──────►  render()  ──────►  DOM
     ▲                                  │
     └──────── event handlers ◄─────────┘
```

One rule, and it makes everything else easy:

> **State is the truth. The DOM is a picture of it. Never edit the picture — change the state and redraw.**

The alternative — updating state *and* patching the DOM in every handler — is how UIs drift out of sync with their data. This is the same idea React automates, which is why building it by hand first makes frameworks obvious later.

# Step 1: state and a render function

```js
// ---- STATE: everything the UI needs to know -------------------------
let state = {
  tasks: [],                 // { id, text, done, createdAt }
  filter: 'all',             // 'all' | 'active' | 'done'
  editingId: null
};

// ---- RENDER: state in, DOM out. No logic, no mutation ---------------
function render() {
  const visible = visibleTasks();

  listEl.replaceChildren(...visible.map(taskElement));
  countEl.textContent = `${state.tasks.filter(t => !t.done).length} left`;
  emptyEl.hidden = visible.length > 0;

  for (const btn of filterEls) {
    const active = btn.dataset.filter === state.filter;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', String(active));
  }
}

// ---- UPDATE: one place that changes state and redraws ---------------
function setState(patch) {
  state = { ...state, ...patch };
  save();
  render();
}
```

Every handler now ends with `setState({ ... })`. Nothing else touches the DOM. If the screen is wrong, the bug is in `render` or in the state — you never have to wonder which of nine handlers forgot to update the counter.

# Step 2: the working app

```html run title="Task app — the full thing"
<div class="app">
  <h1>Tasks</h1>

  <form id="new-task-form">
    <label class="sr-only" for="new-task">New task</label>
    <input id="new-task" name="text" placeholder="What needs doing?" autocomplete="off" required maxlength="200">
    <button type="submit">Add</button>
  </form>

  <div class="toolbar" role="group" aria-label="Filter tasks">
    <button data-filter="all" aria-pressed="true">All</button>
    <button data-filter="active" aria-pressed="false">Active</button>
    <button data-filter="done" aria-pressed="false">Done</button>
    <span id="count" aria-live="polite"></span>
  </div>

  <ul id="list"></ul>
  <p id="empty" hidden>Nothing here yet.</p>

  <button id="clear-done" class="link-btn">Clear completed</button>
</div>

<style>
  :root { --accent:#4f46e5; --border:#e2e6ee; --dim:#6b7280; }
  * { box-sizing:border-box; }
  body { font-family:system-ui,sans-serif; background:#f7f8fb; margin:0; padding:16px; color:#15181e; }
  .app { max-width:30rem; margin:0 auto; background:#fff; border:1px solid var(--border);
         border-radius:14px; padding:20px; }
  h1 { margin:0 0 14px; font-size:1.4rem; }

  .sr-only { position:absolute; width:1px; height:1px; overflow:hidden;
             clip:rect(0 0 0 0); white-space:nowrap; }

  form { display:flex; gap:8px; margin-bottom:14px; }
  input { flex:1; padding:9px 11px; font:inherit; border:1px solid var(--border); border-radius:8px; }
  input:focus-visible { outline:2px solid var(--accent); outline-offset:1px; }
  button { font:inherit; cursor:pointer; }
  form button { padding:9px 16px; background:var(--accent); color:#fff;
                border:none; border-radius:8px; font-weight:600; }

  .toolbar { display:flex; gap:6px; align-items:center; margin-bottom:10px; font-size:.88rem; }
  .toolbar button { padding:4px 10px; background:none; border:1px solid var(--border);
                    border-radius:999px; color:var(--dim); }
  .toolbar button.is-active { background:var(--accent); border-color:var(--accent); color:#fff; }
  #count { margin-left:auto; color:var(--dim); }

  ul { list-style:none; margin:0; padding:0; }
  li { display:flex; align-items:center; gap:10px; padding:9px 4px;
       border-bottom:1px solid var(--border); }
  li:last-child { border-bottom:none; }
  li.done .text { text-decoration:line-through; color:var(--dim); }
  .text { flex:1; cursor:pointer; }
  .edit-input { flex:1; padding:5px 8px; font:inherit; border:1px solid var(--accent); border-radius:6px; }
  .delete { background:none; border:none; color:var(--dim); font-size:1.1rem; padding:2px 6px; border-radius:6px; }
  .delete:hover { color:#dc2626; background:#fee2e2; }

  #empty { color:var(--dim); font-style:italic; text-align:center; padding:18px 0; margin:0; }
  .link-btn { background:none; border:none; color:var(--dim); text-decoration:underline;
              padding:8px 0 0; font-size:.85rem; }
</style>

<script>
  // ============ STATE ============
  let state = { tasks: [], filter: 'all', editingId: null };

  const listEl    = document.getElementById('list');
  const countEl   = document.getElementById('count');
  const emptyEl   = document.getElementById('empty');
  const formEl    = document.getElementById('new-task-form');
  const filterEls = [...document.querySelectorAll('[data-filter]')];
  const KEY = 'webcraft-tasks';

  // ============ PERSISTENCE ============
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) state.tasks = JSON.parse(raw);
    } catch { /* private mode, or corrupt data — start empty */ }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state.tasks)); } catch {}
  }

  // ============ DERIVED DATA ============
  function visibleTasks() {
    if (state.filter === 'active') return state.tasks.filter(t => !t.done);
    if (state.filter === 'done')   return state.tasks.filter(t => t.done);
    return state.tasks;
  }

  // ============ RENDER ============
  function taskElement(task) {
    const li = document.createElement('li');
    li.dataset.id = task.id;
    li.classList.toggle('done', task.done);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;
    checkbox.id = 'task-' + task.id;
    checkbox.dataset.action = 'toggle';

    if (state.editingId === task.id) {
      const input = document.createElement('input');
      input.className = 'edit-input';
      input.value = task.text;
      input.dataset.action = 'edit-input';
      li.append(checkbox, input);
      queueMicrotask(() => { input.focus(); input.select(); });
    } else {
      const label = document.createElement('label');
      label.className = 'text';
      label.htmlFor = checkbox.id;
      label.textContent = task.text;          // textContent — never innerHTML with user input

      const edit = document.createElement('button');
      edit.textContent = '✎';
      edit.className = 'delete';
      edit.dataset.action = 'start-edit';
      edit.setAttribute('aria-label', `Edit "${task.text}"`);

      const del = document.createElement('button');
      del.textContent = '×';
      del.className = 'delete';
      del.dataset.action = 'delete';
      del.setAttribute('aria-label', `Delete "${task.text}"`);

      li.append(checkbox, label, edit, del);
    }
    return li;
  }

  function render() {
    const visible = visibleTasks();
    listEl.replaceChildren(...visible.map(taskElement));

    const left = state.tasks.filter(t => !t.done).length;
    countEl.textContent = `${left} left`;
    emptyEl.hidden = visible.length > 0;

    for (const btn of filterEls) {
      const active = btn.dataset.filter === state.filter;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    }
    document.getElementById('clear-done').hidden = !state.tasks.some(t => t.done);
  }

  function setState(patch) {
    state = { ...state, ...patch };
    save();
    render();
  }

  // ============ ACTIONS ============
  const addTask = (text) => setState({
    tasks: [...state.tasks, { id: crypto.randomUUID(), text, done: false, createdAt: Date.now() }]
  });

  const toggleTask = (id) => setState({
    tasks: state.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t)
  });

  const deleteTask = (id) => setState({ tasks: state.tasks.filter(t => t.id !== id) });

  const renameTask = (id, text) => setState({
    tasks: state.tasks.map(t => t.id === id ? { ...t, text } : t),
    editingId: null
  });

  // ============ EVENTS ============
  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = formEl.elements.text;
    const text = input.value.trim();
    if (!text) return;
    addTask(text);
    input.value = '';
    input.focus();
  });

  // ONE delegated listener for every task row, now and in future
  listEl.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const id = el.closest('li').dataset.id;

    if (el.dataset.action === 'toggle') toggleTask(id);
    if (el.dataset.action === 'delete') deleteTask(id);
    if (el.dataset.action === 'start-edit') setState({ editingId: id });
  });

  listEl.addEventListener('keydown', (e) => {
    if (e.target.dataset.action !== 'edit-input') return;
    const id = e.target.closest('li').dataset.id;
    if (e.key === 'Enter') {
      const text = e.target.value.trim();
      text ? renameTask(id, text) : deleteTask(id);
    }
    if (e.key === 'Escape') setState({ editingId: null });
  });

  listEl.addEventListener('focusout', (e) => {
    if (e.target.dataset.action !== 'edit-input') return;
    const id = e.target.closest('li').dataset.id;
    const text = e.target.value.trim();
    text ? renameTask(id, text) : setState({ editingId: null });
  });

  for (const btn of filterEls) {
    btn.addEventListener('click', () => setState({ filter: btn.dataset.filter }));
  }

  document.getElementById('clear-done').addEventListener('click', () =>
    setState({ tasks: state.tasks.filter(t => !t.done) }));

  // ============ START ============
  load();
  render();
</script>
```

Add a few tasks, edit one, filter, and reload the preview — they persist.

# What's worth studying in that code

**1. Immutable updates.** Every action builds a *new* array or object:

```js
tasks: state.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t)
```

Never `task.done = !task.done`. Mutating works here, but the habit is what makes state predictable — and it's mandatory in React, so you may as well learn it now.

**2. Event delegation.** Two listeners on the `<ul>` handle every row, including ones added later. Attaching listeners per row would mean re-attaching on every render — the classic "buttons stop working after refresh" bug.

**3. `data-action` attributes.** The handler reads the intent from the DOM rather than matching CSS classes, so restyling can't break behaviour.

**4. `textContent`, always.** A task called `<img src=x onerror=alert(1)>` renders as text, not as a script. Using `innerHTML` here would be a stored XSS vulnerability in your own app.

**5. Storage that can't crash the app.** Every `localStorage` call is wrapped — private browsing throws, and losing persistence is better than losing the whole page.

**6. Accessibility that came free from good markup.** Real `<label>` elements tied to checkboxes (so clicking the text toggles), `aria-pressed` on filters, `aria-live` on the counter, `aria-label` on icon buttons, focus returned to the input after adding.

:::gotcha Re-rendering the whole list
`replaceChildren` rebuilds every row on every change. That's fine for hundreds of items and wasteful for tens of thousands — and it loses focus and scroll position unless you handle them (note the `queueMicrotask` focus call).

Frameworks solve this with a virtual DOM or fine-grained reactivity. If you hit the limit here, the fixes are: only re-render the changed row, or use a keyed diff. Don't pre-optimise — measure first.
:::

# Step 3: make it yours

:::exercise Extend the app
In rough order of difficulty:

1. **Due dates.** Add a date input; show overdue tasks in red. (State shape, rendering, date comparison.)
2. **Reorder** with drag and drop, persisting the order.
3. **Undo.** Keep the previous state in a variable; a "Undo" button restores it. Surprisingly easy with immutable updates — that's the payoff.
4. **Search**, debounced by 300ms, filtering as you type.
5. **Tags.** Parse `#work` out of the text and let users filter by tag.
6. **Sync across tabs** with the `storage` event so two open tabs stay consistent.
7. **Split into modules**: `state.js`, `render.js`, `storage.js`, `main.js`.
8. **Swap the back end.** Replace localStorage with `fetch` calls to the Express API you built — the render layer shouldn't need to change at all. If it does, your layers were too tangled.
9. **Rebuild it in React** and compare. You'll recognise every concept.

Number 8 is the real test of the architecture. If `render()` and the event handlers survive a complete change of storage, you've separated concerns properly.
:::

:::quiz
? Why keep state as the single source of truth?
- It uses less memory
- The DOM can't drift out of sync with the data, because it's always redrawn from it *
- It is required by localStorage
- It makes rendering faster
> Manual DOM patching in every handler is where UI bugs come from.

? Why use one delegated listener on the `<ul>` instead of one per row?
- Delegated listeners are faster to write only
- It handles rows added later, and survives re-renders without re-attaching *
- Rows can't have listeners
- It avoids memory leaks entirely
> Re-rendering destroys per-row listeners; a parent listener is unaffected.

? Why `textContent` rather than `innerHTML` for the task text?
- It is faster
- User-supplied text would otherwise be parsed as HTML — a stored XSS hole *
- innerHTML doesn't work in lists
- It preserves whitespace
> Your own app's input field is still untrusted input.

? What does `{ ...t, done: !t.done }` do?
- Mutates the task
- Creates a new object with the same fields but `done` flipped *
- Deletes the done property
- Deep clones the task
> Immutable updates make undo, time-travel debugging and React all straightforward.

? Why wrap localStorage calls in try/catch?
- It is asynchronous
- It throws in private mode or when the quota is exceeded *
- JSON.parse requires it
- To support older browsers
> Losing persistence is acceptable; crashing the app is not.
:::
