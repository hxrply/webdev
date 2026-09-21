HTTP is the language clients and servers speak. You will read HTTP messages all day — in DevTools, in server logs, in API docs — so an hour spent here pays for itself many times over.

# Anatomy of a URL

```text
https://shop.example.com:443/products/42?colour=blue&size=m#reviews
└─┬──┘  └───────┬────────┘└┬┘└────┬────┘└────────┬────────┘└──┬──┘
scheme       host        port    path          query      fragment
```

| Part | What it does |
|---|---|
| **scheme** | The protocol. `https` (encrypted) or `http` (not). Use `https`. |
| **host** | Which server to talk to. Gets resolved via DNS. |
| **port** | Which door on that machine. Defaults: 80 for http, 443 for https — so it's usually hidden. |
| **path** | Which resource on that server. |
| **query** | Extra named parameters, after `?`, joined by `&`. |
| **fragment** | After `#`. **Never sent to the server** — the browser uses it to scroll to a section (or, as on this site, to route between pages). |

:::note Absolute vs relative
`https://example.com/about` is **absolute** — it works from anywhere. `/about` is **root-relative** — same site, from the top. `about.html` is **relative** — next to the current page. Relative links are why moving a file can break a page.
:::

# The request

A request is plain text. This is roughly what your browser sends:

```text
GET /products/42?colour=blue HTTP/1.1
Host: shop.example.com
Accept: text/html,application/xhtml+xml
Accept-Language: en-GB
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...
Cookie: session=abc123
```

Line one is the **method**, the **path** and the HTTP version. Everything after is **headers** — metadata about the request. Some requests also carry a **body** (the data you're sending).

# Methods: the verbs

| Method | Means | Has a body? | Safe? | Idempotent? |
|---|---|---|---|---|
| `GET` | Give me this resource | No | Yes | Yes |
| `POST` | Here is new data; create something | Yes | No | No |
| `PUT` | Replace this resource entirely | Yes | No | Yes |
| `PATCH` | Modify part of this resource | Yes | No | No |
| `DELETE` | Remove this resource | Rarely | No | Yes |
| `HEAD` | Headers only, no body | No | Yes | Yes |
| `OPTIONS` | What am I allowed to do here? | No | Yes | Yes |

Two words worth knowing:

- **Safe** means it doesn't change anything on the server. A `GET` should never delete your account.
- **Idempotent** means doing it five times has the same effect as doing it once. `DELETE /users/7` twice still leaves you with no user 7. `POST /orders` twice gives you two orders — which is exactly why double-clicking "Buy" is dangerous and why buttons get disabled on submit.

:::warn Never use GET to change data
Browsers, crawlers and link-prefetchers follow `GET` links freely and without asking. A "delete" link that works via `GET` will eventually be triggered by a search-engine bot crawling your admin page. This has happened to real companies.
:::

# The response

```text
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Length: 5120
Cache-Control: max-age=3600
Set-Cookie: session=abc123; HttpOnly; Secure

<!DOCTYPE html>
<html>…
```

Status line, headers, blank line, then the body.

# Status codes worth memorising

They come in five families, and the first digit tells you who to blame.

| Range | Meaning | Mnemonic |
|---|---|---|
| **1xx** | Informational | "Hold on…" |
| **2xx** | Success | "Here you go" |
| **3xx** | Redirection | "Look over there" |
| **4xx** | Client error | "*You* messed up" |
| **5xx** | Server error | "*I* messed up" |

The ones you will actually meet:

- **200 OK** — success, body attached.
- **201 Created** — your `POST` made something; a `Location` header says where.
- **204 No Content** — success, nothing to send back (common for `DELETE`).
- **301 Moved Permanently** — new address forever; browsers and search engines update. Aggressively cached, so be careful.
- **302 / 307 Found / Temporary Redirect** — over here for now.
- **304 Not Modified** — "your cached copy is still good." Saves enormous bandwidth.
- **400 Bad Request** — malformed input.
- **401 Unauthorized** — you are not logged in. (Misnamed: it really means *unauthenticated*.)
- **403 Forbidden** — you are logged in, but not allowed.
- **404 Not Found** — no such path. The famous one.
- **409 Conflict** — clashes with current state (e.g. that username is taken).
- **422 Unprocessable Entity** — well-formed, but semantically invalid. Common for validation errors.
- **429 Too Many Requests** — rate limited. Slow down.
- **500 Internal Server Error** — the server threw an exception. Check *your* logs.
- **502 / 503 / 504** — bad gateway, service unavailable, gateway timeout. Usually infrastructure, not your code.

:::tip 401 vs 403 in one line
401 = "Who are you?" · 403 = "I know who you are, and no."
:::

# Headers you will use constantly

**On requests:**

- `Accept` — what formats I can handle
- `Content-Type` — what format my body is in
- `Authorization` — credentials, e.g. `Bearer eyJhbGci...`
- `Cookie` — cookies previously set by this site
- `User-Agent` — what browser/app I am

**On responses:**

- `Content-Type` — what I'm sending. **Get this wrong and the browser will misbehave**: JSON labelled `text/plain` won't parse, HTML labelled wrongly may display as source.
- `Cache-Control` — how long this may be reused (`max-age=3600`, `no-store`)
- `Set-Cookie` — store this and send it back next time
- `Location` — where to redirect
- `Access-Control-Allow-Origin` — CORS: which other sites' JavaScript may read this

# Statelessness and cookies

HTTP is **stateless**: each request arrives with no memory of the last one. The server has no idea that the request for `/cart` came from the same person who just hit `/login`.

Cookies patch this. The server sends `Set-Cookie: session=abc123`, the browser stores it and attaches `Cookie: session=abc123` to every subsequent request to that site. The server looks `abc123` up and says "ah, it's Ada". That is essentially how every login on the web works.

:::note HTTP/2 and HTTP/3
Modern versions changed the *transport* — binary framing, multiplexing many requests over one connection, less head-of-line blocking — but the semantics in this lesson (methods, statuses, headers) are unchanged. You can reason in HTTP/1.1 terms and be right.
:::

:::quiz
? You submit a form and get back `422`. Whose problem is it?
- The server's — it crashed
- Yours — the data was understood but failed validation *
- The network's
- Nobody's; 422 means success
> 4xx is the client's fault. 422 specifically means "I parsed it, but the contents are invalid."

? Which part of a URL never reaches the server?
- The query string
- The path
- The fragment (after `#`) *
- The port
> Fragments are handled purely in the browser — which is what makes them usable for client-side routing.

? Why is `GET` a bad choice for deleting a record?
- GET requests are slower
- GET cannot include an id
- GET is supposed to be safe; crawlers and prefetchers follow links automatically *
- GET responses cannot be cached
> Anything that changes state needs a method that isn't safe — POST, PUT, PATCH or DELETE.

? A response returns `304 Not Modified`. What should the browser do?
- Show an error page
- Re-request the resource immediately
- Use the copy it already has in cache *
- Redirect to a new URL
> 304 carries no body. It means "your cached version is still valid", saving the download.

? Which header tells the browser how to interpret the response body?
- Accept
- Content-Type *
- User-Agent
- Cache-Control
> `Accept` is what the *client* wants; `Content-Type` is what the *server actually sent*.
:::

:::exercise Read a real conversation
In DevTools → Network, click any request and open the **Headers** panel. Identify its method, status code, `Content-Type`, and whether it set any cookies. Then find a request that returned `304` — proof that caching is working.
:::
