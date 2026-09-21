Classes package data and the functions that work on it. JavaScript's version sits on top of **prototypes**, which is genuinely different from most languages — and explains the famous `this` confusion.

# Classes

```js run
class Book {
  #timesRead = 0;                    // # means genuinely private

  constructor(title, author, pages) {
    this.title = title;
    this.author = author;
    this.pages = pages;
  }

  describe() {
    return `${this.title} by ${this.author} (${this.pages}pp)`;
  }

  read() {
    this.#timesRead++;
    return `Read ${this.#timesRead} time(s)`;
  }

  get isLong() {                     // getter — accessed like a property
    return this.pages > 400;
  }

  static compare(a, b) {             // called on the class, not an instance
    return a.pages - b.pages;
  }
}

const book = new Book('Ada, the Enchantress', 'Toole', 464);
console.log(book.describe());
console.log(book.isLong);            // no parentheses
console.log(book.read());
console.log(book.read());
// console.log(book.#timesRead);     // SyntaxError — truly private

const shorter = new Book('Short', 'Someone', 120);
console.log([book, shorter].sort(Book.compare).map(b => b.title));
```

- `constructor` runs on `new`.
- `this` refers to the instance being created.
- `#field` is real privacy, enforced by the language (unlike the old `_name` convention, which was just a polite request).
- `static` members belong to the class itself — factory methods, comparators, constants.

# Inheritance

```js run
class Animal {
  constructor(name) { this.name = name; }
  speak() { return `${this.name} makes a sound`; }
  toString() { return `${this.constructor.name}(${this.name})`; }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);                     // MUST call before using `this`
    this.breed = breed;
  }
  speak() {                          // override
    return `${this.name} barks`;
  }
  fetch() {
    return `${super.speak()} — and fetches`;   // call the parent's version
  }
}

const rex = new Dog('Rex', 'collie');
console.log(rex.speak());
console.log(rex.fetch());
console.log(String(rex));
console.log(rex instanceof Dog, rex instanceof Animal);
```

:::tip Prefer composition to deep inheritance
Three or more levels of inheritance tend to become rigid — a change to a base class ripples everywhere, and behaviour is scattered across files. Objects that *contain* other objects, or plain functions operating on data, are usually easier to change. Inheritance is a tool, not a goal.
:::

# Prototypes: what's underneath

Classes are syntax over prototypes. Every object has a hidden link to a **prototype** object, and property lookups walk that chain.

```js run
const animal = {
  speak() { return `${this.name} makes a sound`; }
};

const dog = Object.create(animal);   // dog's prototype IS animal
dog.name = 'Rex';

console.log(dog.speak());                         // found on the prototype
console.log(Object.hasOwn(dog, 'speak'));         // false — it's inherited
console.log(Object.getPrototypeOf(dog) === animal);

// The chain: dog → animal → Object.prototype → null
console.log([1,2].hasOwnProperty === Object.prototype.hasOwnProperty);
```

Methods live on the prototype, shared by every instance — so a thousand `Book` objects share **one** `describe` function rather than each carrying a copy. That's the memory win prototypes provide.

```js run
// The pre-class syntax, still worth recognising in older code
function Person(name) { this.name = name; }
Person.prototype.greet = function () { return 'Hi, ' + this.name; };

const p = new Person('Ada');
console.log(p.greet());
console.log(Object.getPrototypeOf(p) === Person.prototype);
```

# `this`, definitively

`this` is decided by **how a function is called**, not where it's written. Five rules, in priority order:

```js run
function show() { return this?.label ?? 'undefined'; }

// 1. new binding — this is the new object
function Thing() { this.label = 'from new'; }
console.log(new Thing().label);

// 2. Explicit binding — call, apply, bind
console.log(show.call({ label: 'from call' }));
console.log(show.bind({ label: 'from bind' })());

// 3. Method call — this is the object before the dot
const obj = { label: 'from method', show };
console.log(obj.show());

// 4. Plain call — undefined in strict mode / modules
console.log(show());

// 5. Arrow functions — no own `this`; inherited from where they're DEFINED
const arrow = () => this?.label ?? 'lexical (module scope)';
console.log(arrow());
```

## The classic bug

```js run
class Counter {
  constructor() { this.count = 0; }

  incrementBroken() {
    this.count++;
    return this.count;
  }

  incrementFixed = () => {           // class field with an arrow — bound to the instance
    this.count++;
    return this.count;
  }
}

const c = new Counter();

const broken = c.incrementBroken;    // detached from the object!
try { broken(); } catch (e) { console.log('broken:', e.message); }

const fixed = c.incrementFixed;      // arrow field keeps `this`
console.log('fixed:', fixed());

const bound = c.incrementBroken.bind(c);   // or bind explicitly
console.log('bound:', bound());
```

This is exactly what happens with `button.addEventListener('click', this.handleClick)` — the method is detached, `this` becomes the element (or undefined), and everything breaks. The fixes: an arrow class field, `.bind(this)` in the constructor, or wrapping in an arrow at the call site.

# A realistic example

```js run
class ShoppingCart {
  #items = new Map();

  add(product, qty = 1) {
    const existing = this.#items.get(product.id);
    this.#items.set(product.id, {
      product,
      qty: (existing?.qty ?? 0) + qty
    });
    return this;                     // returning this enables chaining
  }

  remove(id) { this.#items.delete(id); return this; }

  get count() {
    return [...this.#items.values()].reduce((n, i) => n + i.qty, 0);
  }

  get total() {
    return [...this.#items.values()].reduce((sum, i) => sum + i.product.price * i.qty, 0);
  }

  get isEmpty() { return this.#items.size === 0; }

  *[Symbol.iterator]() {             // makes the cart usable in for...of
    yield* this.#items.values();
  }

  toString() { return `Cart(${this.count} items, £${(this.total / 100).toFixed(2)})`; }
}

const cart = new ShoppingCart();
cart.add({ id: 1, name: 'Keyboard', price: 8900 })
    .add({ id: 2, name: 'Hub', price: 3999 }, 2)
    .add({ id: 1, name: 'Keyboard', price: 8900 });

console.log(String(cart));
for (const item of cart) console.log(`  ${item.qty} × ${item.product.name}`);
console.log('empty?', cart.isEmpty);
```

# Do you need classes?

Often, no. A factory function with closures gives you private state with no `this` to worry about:

```js run
function createCounter(start = 0) {
  let count = start;                             // private by closure
  return {
    increment: () => ++count,
    decrement: () => --count,
    get value() { return count; }
  };
}

const counter = createCounter(10);
counter.increment();
const detached = counter.increment;              // works fine — no `this` involved
detached();
console.log(counter.value);
```

| Use classes when | Use functions/objects when |
|---|---|
| Many instances with shared behaviour | One-off objects |
| Natural inheritance hierarchy | Simple data transformation |
| Working with a class-based library | You want to avoid `this` entirely |
| `instanceof` checks matter | Composing small behaviours |

Both are idiomatic JavaScript. Frameworks have largely moved from classes to functions (React hooks being the prominent example), but classes remain common in Node, game code and anywhere with genuine object modelling.

:::quiz
? What determines the value of `this` in a regular function?
- Where the function is defined
- How the function is called *
- The file it is in
- The class it belongs to
> Arrow functions are the exception — they inherit `this` from the defining scope.

? Why does `element.addEventListener('click', this.handleClick)` often break?
- Listeners can't be methods
- The method is detached from the instance, so `this` is no longer the object *
- addEventListener is async
- Methods aren't hoisted
> Use `.bind(this)`, an arrow wrapper, or an arrow class field.

? What does `#privateField` provide that `_privateField` does not?
- Better performance
- Enforcement by the language — it is genuinely inaccessible outside the class *
- Shorter syntax
- Automatic getters
> The underscore was only ever a naming convention.

? Where do class methods live?
- On every instance
- On the prototype, shared by all instances *
- In the constructor
- In global scope
> Which is why a thousand instances don't carry a thousand copies of each method.

? In a subclass constructor, what must come before using `this`?
- `return`
- `super()` *
- A property assignment
- Nothing
> Accessing `this` before `super()` throws a ReferenceError.

? What is an advantage of a factory function with closures over a class?
- It is faster
- No `this` to bind, and private state comes free *
- It supports inheritance better
- It works with instanceof
> Detached methods keep working, which removes an entire category of bug.
:::

:::exercise Model something real
Build an `EventEmitter` class with:

- `on(event, handler)` — register a listener
- `off(event, handler)` — remove one
- `once(event, handler)` — fire at most once
- `emit(event, ...args)` — call every listener for that event

Store handlers in a private `#listeners` Map. Then write the same thing as a factory function with closures and compare which you prefer.
:::
