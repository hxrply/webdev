At some point every developer asks "should I learn React?" The better question is "what problem do frameworks solve, and do I have it?"

# The problem they solve

Here's what keeping the DOM in sync with data looks like by hand:

```js
let todos = [];

function addTodo(text) {
  todos.push({ id: Date.now(), text, done: false });
  // Now: create an li, set its text, add a checkbox, wire a listener,
  // append it, update the "3 items left" counter, toggle the empty state,
  // re-apply the current filter, and update the "clear completed" button.
}

function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  todo.done = !todo.done;
  // Now: find that li, toggle a class, update the counter, maybe hide
  // it if a filter is active, update the clear button…
}
```

Every action needs manual DOM updates in several places. Miss one and the UI contradicts the data. That bug class — *state and display drifting apart* — is what frameworks exist to eliminate.

The framework answer: **describe what the UI should look like for a given state, and let the framework work out the DOM changes.**

```jsx
function TodoList({ todos, onToggle }) {
  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id} className={todo.done ? 'done' : ''}>
          <input type="checkbox" checked={todo.done} onChange={() => onToggle(todo.id)} />
          {todo.text}
        </li>
      ))}
    </ul>
  );
}
```

Change `todos`, and the list updates. You never touch the DOM.

# How React thinks

Three ideas, and they're most of it:

**1. Components** — functions returning UI, composed like elements.

```jsx
function Card({ title, children }) {
  return (
    <article className="card">
      <h3>{title}</h3>
      {children}
    </article>
  );
}

<Card title="Hello"><p>Body text</p></Card>
```

**2. State** — data that, when it changes, re-renders the component.

```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}
```

**3. Props flow down, events flow up** — a component receives data from its parent and notifies the parent of changes. Data has one direction, which makes it traceable.

```jsx
function App() {
  const [todos, setTodos] = useState([]);

  const toggle = (id) => setTodos(todos.map(t =>
    t.id === id ? { ...t, done: !t.done } : t      // new array, new object — never mutate
  ));

  return <TodoList todos={todos} onToggle={toggle} />;
}
```

:::gotcha Never mutate state directly
```jsx
todos.push(newTodo);   setTodos(todos);   // ✗ same array reference — no re-render
setTodos([...todos, newTodo]);            // ✓ new array
```
React decides whether to re-render by comparing references. Mutating in place changes the contents without changing the reference, so nothing happens — one of the most common beginner confusions, and why the spread operator appears everywhere in React code.
:::

# The landscape

| Framework | Character |
|---|---|
| **React** | Largest ecosystem and job market. A library, so you assemble the rest |
| **Vue** | Gentler learning curve, excellent docs, more batteries included |
| **Svelte** | Compiles away — no runtime framework, very little boilerplate |
| **Angular** | Full framework, TypeScript-first, opinionated. Common in enterprises |
| **Solid** | React-like syntax, fine-grained reactivity, very fast |
| **htmx / Alpine** | Enhance server-rendered HTML instead of replacing it |

And the **meta-frameworks** built on top — Next.js (React), Nuxt (Vue), SvelteKit, Remix — which add routing, server rendering, data loading and a build pipeline. In practice, most new React projects start from Next.js rather than React alone.

:::note They're more alike than they look
Components, props, state, and declarative rendering are common to all of them. Learn one properly and the next takes a week, not a year. The syntax differs; the ideas don't.
:::

# When you don't need one

Frameworks cost something: a build step, a dependency tree, a runtime download, and a learning curve. That cost is worth paying when the application is genuinely stateful and interactive.

It's often *not* worth it for:

- A marketing site or portfolio.
- A blog or documentation.
- A page with a few interactions.
- Anything where a server-rendered page plus a little JavaScript will do.

This site is a case in point: 67 lessons, a router, live code playgrounds, a SQL engine, progress tracking and search — no framework, no build step. That was a deliberate choice, and for this shape of project it's the simpler one.

The industry over-reached on client-side frameworks for a while, and the pendulum is swinging back toward server rendering with selective interactivity. Both extremes are wrong as universal rules.

# What to learn first

**Learn vanilla JavaScript and the DOM properly first** — which you have, if you've worked through this course. Reasons:

1. Frameworks are built on the DOM. When something breaks, you debug at that level.
2. You'll recognise when a framework isn't needed.
3. Framework APIs change; the platform is stable. `querySelector` has worked for fifteen years.
4. Interviews still ask about closures, `this`, event delegation and the event loop.

Then pick **one** framework and build two or three real things with it. The specific choice matters less than going deep: React for the job market, Vue for the gentlest path, Svelte for the most pleasant experience.

# What a framework won't fix

- **Bad data modelling.** Confused state is confused in any framework.
- **Accessibility.** `<div onClick>` is just as broken in React as in vanilla JS.
- **Performance.** Frameworks add weight; they don't remove your 4MB hero image.
- **Not knowing JavaScript.** Every framework bug eventually bottoms out in the language.

:::quiz
? What core problem do UI frameworks solve?
- Making pages load faster
- Keeping the DOM synchronised with application state automatically *
- Replacing CSS
- Providing HTTP clients
> Manual DOM updates scattered across handlers are where UI bugs breed.

? Why does `todos.push(x); setTodos(todos)` fail to re-render in React?
- push is deprecated
- The array reference didn't change, so React sees no update *
- setTodos must be awaited
- Arrays can't be state
> Create a new array: `setTodos([...todos, x])`.

? Which direction does data flow in React?
- Both ways automatically
- Props down from parent to child; events back up *
- Up only
- Through a global store only
> One-way data flow is what makes state changes traceable.

? When is a framework probably unnecessary?
- Any app with a database
- A largely static site with a few interactions *
- Anything with forms
- Multi-page applications
> Server-rendered HTML plus a little JavaScript is often simpler and faster.

? What is the benefit of learning vanilla JS before a framework?
- Frameworks require it technically
- You can debug at the platform level and judge when a framework isn't needed *
- It's faster to learn
- Employers forbid frameworks
> Every framework bug eventually becomes a JavaScript question.

? What does a meta-framework like Next.js add to React?
- A different component model
- Routing, server rendering, data loading and a build pipeline *
- A CSS framework
- A database
> React itself is only the view layer.
:::

:::exercise Build the same thing twice
Build a small todo app — add, toggle, delete, filter by all/active/done, and a count — **twice**:

1. In vanilla JavaScript, with a render function that redraws from state.
2. In React (`npm create vite@latest -- --template react`).

Compare: how much code is each? Where did each get awkward? Which would you rather extend with drag-and-drop reordering?

You'll notice your vanilla version already uses the framework's central idea — a single state object and a render function. That's not a coincidence; it's the pattern frameworks formalise.
:::
