Before you write a single tag, it helps enormously to know what you are writing *for*. Most beginner confusion ("why does my page work on my computer but not on my friend's?") dissolves once you have a clear mental model of the machinery.

# Two computers having a conversation

The web is built on one simple idea: a **client** asks, a **server** answers.

- The **client** is usually your browser — Chrome, Firefox, Safari. Its job is to ask for things and display what comes back.
- The **server** is a computer, somewhere, that is always on and waiting. Its job is to listen for requests and send back a response.

That's it. Everything else — frameworks, databases, CDNs — is elaboration on "ask" and "answer".

:::note The word "server" means two things
It means the *physical machine* (a computer in a data centre) and the *program* running on it that listens for requests. When someone says "I started a server", they mean the program. You can run one on your own laptop in seconds — you'll do it later in this course.
:::

# What happens when you type a URL

Say you type `https://example.com/about` and hit Enter. Roughly this happens:

1. **DNS lookup.** `example.com` is a name for humans. Computers need a number — an IP address like `93.184.216.34`. Your browser asks the **Domain Name System**, the internet's phone book, to translate the name into the number. The answer gets cached, which is why the second visit is faster.
2. **TCP connection.** Your computer opens a connection to that IP address, like dialling a phone number. This involves a short back-and-forth called a handshake.
3. **TLS handshake.** Because the URL says `https`, the two machines agree on encryption keys so nobody in between can read the traffic. This is what the padlock icon means.
4. **HTTP request.** Your browser sends a small text message that essentially says: *"GET me the page at /about. I accept HTML. I'm Firefox on a Mac."*
5. **The server responds.** It sends back a status code (hopefully `200 OK`), some headers, and a body — usually HTML.
6. **The browser renders.** It reads the HTML top to bottom, builds an internal tree of the page (the DOM), and as it goes it discovers it needs more files: CSS, images, JavaScript, fonts. Each of those is *another request*, repeating steps 4–6.
7. **JavaScript runs**, possibly changing the page, possibly fetching more data.

A single page view is rarely one request. It is commonly 30–100 of them.

:::tip See it for yourself
Open any website, press **F12** (or right-click → Inspect), and click the **Network** tab. Reload the page. That waterfall of rows is every single request the page made. You'll get a whole lesson on this tool shortly.
:::

# The three languages of the front end

Every web page you have ever seen is some mix of three languages. They each have one job and do not overlap:

| Language | Job | Analogy |
|---|---|---|
| **HTML** | Structure and meaning — what things *are* | The skeleton and organs |
| **CSS** | Presentation — what things *look like* | Clothes and makeup |
| **JavaScript** | Behaviour — what things *do* | Muscles and reflexes |

Here is all three at once. Edit it and press Run:

```html run title="All three languages in one page"
<h1 id="greeting">Hello!</h1>
<button id="btn">Change the colour</button>

<style>
  #greeting { font-family: system-ui; color: navy; }
  button { padding: 8px 14px; border-radius: 6px; cursor: pointer; }
</style>

<script>
  const colours = ['crimson', 'teal', 'rebeccapurple', 'darkorange'];
  let i = 0;
  document.getElementById('btn').addEventListener('click', () => {
    i = (i + 1) % colours.length;
    document.getElementById('greeting').style.color = colours[i];
  });
</script>
```

The `<h1>` is HTML (structure). The `color: navy` is CSS (appearance). The click handler is JavaScript (behaviour). Learning web development is mostly learning these three, deeply, and then learning what runs on the server side.

# Static versus dynamic

- A **static site** serves files exactly as they sit on disk. Ask for `/about.html`, get `about.html`. Fast, cheap, hard to break. Blogs, docs and portfolios are usually static.
- A **dynamic site** builds the response when you ask for it. Ask for `/profile`, and a program looks up *who you are* in a database and assembles HTML (or JSON) just for you.

Neither is better. A surprising number of "we need a database" projects are really static sites in disguise.

# Where your code actually runs

This trips up nearly everyone at first:

- **Client-side code** (HTML, CSS, JavaScript in the browser) runs on the visitor's machine. They can read all of it. View Source is not a bug. **Never put a password or secret API key in front-end code.**
- **Server-side code** (Node, Python, Ruby, Go, PHP…) runs on your machine, and visitors only ever see its output. This is where secrets, databases and business rules live.

:::gotcha "It works on my computer"
Opening `index.html` by double-clicking gives you a URL starting `file://`. That is not a web server — it is your own file system. Some things (fetching data, modules, service workers) simply refuse to work there. When something behaves oddly, first check whether you're on `file://` instead of `http://localhost`.
:::

:::quiz
? What does DNS do?
- Translates a domain name into an IP address *
- Encrypts traffic between browser and server
- Stores the HTML files of a website
- Compresses images before sending them
> DNS is the phone book of the internet: name in, address out. Encryption is TLS's job.

? Roughly how many HTTP requests does a typical modern web page make?
- Exactly one — the HTML file
- One per language used (three)
- Dozens: HTML, then every stylesheet, script, image and font *
- Hundreds of thousands
> The HTML is just the first request. It references other files, each needing its own request.

? Where is it safe to store a secret API key?
- In a JavaScript file loaded by the page
- In an HTML comment, since comments are ignored
- On the server, never sent to the browser *
- In CSS, because CSS cannot execute
> Anything the browser downloads, the user can read. Secrets stay server-side, full stop.

? What is the difference between a static and a dynamic site?
- Static sites cannot use CSS
- Static sites serve pre-existing files; dynamic sites build responses on request *
- Dynamic sites are always faster
- Static sites do not use HTTP
> "Static" refers to how the response is produced, not how the page looks or moves.
:::

:::exercise Trace a real request
Open a site you use daily with DevTools' Network tab open. Find:

1. the very first request (the HTML document) and its status code;
2. how many total requests the page made;
3. the largest single file downloaded.

You now know more about that page's performance than most of its visitors.
:::

# What you should take away

- Client asks, server answers, over HTTP.
- One page view = many requests.
- HTML is structure, CSS is looks, JavaScript is behaviour.
- Anything sent to the browser is public. Plan accordingly.
