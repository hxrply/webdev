You've covered a lot: how the web works, HTML, CSS, JavaScript, SQL, APIs, security, testing and deployment. Here's an honest view of where you are and what to do with it.

# Where you actually are

If you've worked through this course *and built things alongside it*, you can:

- Build and style a responsive, accessible web page from nothing.
- Make it interactive with JavaScript — DOM, events, forms, async data.
- Design a sensible database schema and query it confidently.
- Build a CRUD API with validation, authentication and error handling.
- Use git, test your code, and deploy it.

That's a genuine junior-developer skill set. What you're missing is not knowledge — it's **volume**. You haven't yet hit the thousand small problems that turn knowledge into judgement: the CSS that won't centre, the race condition that only appears in production, the migration that locked a table. That comes from building, and only from building.

:::note The uncomfortable truth about tutorials
Following along feels like learning and mostly isn't. The sensation of understanding while reading is not the same as the ability to produce from a blank file. If you've been reading without typing, the single most valuable thing you can do now is close this site and build something badly.
:::

# What to build next

Pick things that force new problems rather than repeating solved ones:

**Consolidate** (a weekend each)
- A weather app using a public API — teaches fetch, error states, loading states.
- A markdown note-taker with localStorage.
- A budget tracker with charts.
- A recipe site with search and filtering.

**Stretch** (a week or two)
- A full-stack app with auth: users register, log in, and own their data.
- A URL shortener — simple, but it teaches redirects, hashing, collisions and rate limiting.
- A small blog with an admin area, drafts and image uploads.
- A real-time chat with WebSockets.

**Genuinely hard**
- Something *you* actually want to exist. Scratch your own itch.
- Contribute to an open-source project you use.
- Rebuild something you admire and compare your version.

The best project is one you'll be annoyed about if it doesn't work. Motivation is a resource; spend it on things you care about.

# Finish things

An unfinished project teaches you the first 40% of building software — the fun part. The last 20% is where the real lessons live: edge cases, error states, empty states, the deploy that fails, the mobile layout you ignored, the bug report from a friend.

**Ship three small finished things rather than one ambitious abandoned thing.** And define "finished": deployed, with a README, working on a phone, tested by someone who isn't you.

# What to learn next, in order

**1. Deepen JavaScript.** Most people's weakest link. Really understand the event loop, closures, prototypes, `this`. *JavaScript: The Definitive Guide*, or the free *You Don't Know JS* series.

**2. Pick one framework.** React for jobs, Vue for the gentlest path, Svelte for enjoyment. Go deep on one rather than sampling three.

**3. TypeScript.** Genuinely worth it once projects exceed a few hundred lines. Types catch a whole class of bug before you run the code, and make refactoring far less frightening. Start by adding it to a project you already have.

**4. Testing, properly.** You know the concepts; now practise until writing a test is your reflex when fixing a bug.

**5. Then choose a direction:**

| Direction | Learn |
|---|---|
| **Front-end depth** | Animation, design systems, accessibility specialism, performance |
| **Full-stack** | A meta-framework (Next.js, SvelteKit), background jobs, caching, queues |
| **Back-end** | Another language (Go, Python, Rust), system design, databases at scale |
| **Infrastructure** | Docker, CI/CD, cloud platforms, observability |

You don't have to choose forever. You do have to choose for the next six months.

# Resources worth your time

**Reference**
- **MDN Web Docs** — the authoritative source for HTML, CSS, JS and browser APIs.
- **caniuse.com** — browser support.
- **web.dev** — Google's guides on performance and modern practice.

**Learning**
- **JavaScript.info** — thorough and free.
- **CSS-Tricks**, **Josh Comeau's blog**, **Kevin Powell** (video) for CSS.
- **Use The Index, Luke** — free, excellent, on SQL indexing.
- **The Odin Project**, **freeCodeCamp** — full curricula with projects.

**Books**
- *Eloquent JavaScript* (free online)
- *Refactoring UI* — design for people who don't consider themselves designers
- *The Pragmatic Programmer* — about being a developer, not a language

**Keeping current**
- Follow a handful of practitioners, not an algorithm. Frontend Focus and JavaScript Weekly are low-noise newsletters.
- Ignore most framework news. The fundamentals you've learned outlast it.

# If you're aiming at a job

**A portfolio of 3–5 real projects** beats any certificate. For each: a live URL, source on GitHub, and a README explaining what it does, why you built it, and one interesting problem you solved. That README is often the only thing read.

**Your GitHub is a CV.** Readable code, real commit messages, actual READMEs.

**Contribute to open source.** Start with documentation fixes; they're welcome, they teach the PR workflow, and they get you a real code review.

**Write about what you learn.** A post explaining a bug you fixed is useful to others, proves you can communicate, and cements it for you.

**Expect interviews to cover:** JavaScript fundamentals (closures, `this`, async), CSS layout, accessibility, HTTP and REST, SQL joins, git, and "talk me through a project you built". Everything on that list is in this course.

**Apply before you feel ready.** The gap between "I know enough" and what employers hire juniors for is smaller than it feels from inside. The people who get hired first are usually not the most skilled — they're the ones who applied.

# A few things worth internalising

**Everyone googles constantly.** Senior developers look up `flex-basis` semantics weekly. Memorisation isn't the skill; knowing what to search for and evaluating the answer is.

**You will feel like a fraud.** Almost universally, at every level. It's a poor signal about your competence and a good sign you're working at the edge of what you know.

**Reading code is a skill of its own**, and an under-practised one. Clone a project you admire and trace how a feature works end to end.

**The fundamentals compound.** Frameworks come and go; HTTP, the DOM, SQL and how a browser renders a page have been stable for decades and will outlast whatever is fashionable this year.

**Slow down to go fast.** Understanding *why* a fix works is what stops you hitting the same problem monthly.

**Build for people.** Behind every page view is a person, possibly on a bad connection, possibly using a screen reader, possibly frustrated. Accessibility and performance are not chores — they're the job.

# Finally

The gap between "learning to code" and "being a developer" is not a certificate or a course. It's the accumulated experience of having built things, broken them, fixed them, and shipped them anyway.

You have the map. The territory is where the learning is.

Go build something.

:::exercise Your next 30 days
Write these down somewhere you'll see them:

1. **One project** you'll finish and deploy — small enough to complete, real enough to care about.
2. **One topic** to deepen (JavaScript fundamentals, or a framework, or SQL).
3. **A schedule** you'll actually keep. Four half-hours a week beats one heroic Saturday you'll skip next month.
4. **A deadline** for the project. Without one it becomes permanently in-progress.

Then start. Today, badly, is better than next month, properly.
:::
