An API is a user interface for programmers. The same care you'd put into a screen — predictability, clear errors, no surprises — applies here.

# REST, plainly

REST is a set of conventions for structuring HTTP APIs:

- **Resources are nouns**, identified by URLs: `/users`, `/orders/42`.
- **HTTP methods are the verbs**: GET reads, POST creates, PATCH updates, DELETE removes.
- **Status codes carry meaning**.
- **Stateless**: every request contains everything needed to serve it.

```text
GET    /api/articles          list articles
POST   /api/articles          create one
GET    /api/articles/42       fetch one
PATCH  /api/articles/42       partially update
PUT    /api/articles/42       replace entirely
DELETE /api/articles/42       remove

GET    /api/articles/42/comments     comments on article 42
POST   /api/articles/42/comments     add one
```

Rules that follow from this:

- **Plural nouns**, consistently. `/users`, not `/user` and `/getUsers`.
- **No verbs in URLs.** `POST /articles` — not `/createArticle`. The method *is* the verb.
- **Lowercase, hyphenated** paths: `/blog-posts`, not `/blogPosts`.
- **Nest one level at most.** `/articles/42/comments` is fine; `/users/1/articles/42/comments/7/replies` is not — use `/replies?comment_id=7`.

:::note Not everything is a resource
Some operations genuinely aren't CRUD: `POST /auth/login`, `POST /orders/42/refund`, `POST /emails/send`. Forcing these into pure REST produces worse APIs than just being pragmatic. Treat them as actions on a resource and move on.
:::

# Status codes, used properly

| Code | When |
|---|---|
| **200** OK | Successful GET, PATCH, PUT |
| **201** Created | Successful POST, with a `Location` header |
| **204** No Content | Successful DELETE, or a PUT with nothing to return |
| **400** Bad Request | Malformed — unparseable JSON, missing required parameter |
| **401** Unauthorized | Not authenticated (no or invalid credentials) |
| **403** Forbidden | Authenticated, but not permitted |
| **404** Not Found | No such resource |
| **409** Conflict | Clashes with current state (duplicate email) |
| **422** Unprocessable | Well-formed but semantically invalid (validation failures) |
| **429** Too Many Requests | Rate limited — include `Retry-After` |
| **500** Internal Server Error | Your bug |
| **503** Service Unavailable | Temporarily down, e.g. maintenance |

:::warn Never return 200 with an error inside
```json
HTTP/1.1 200 OK
{ "success": false, "error": "User not found" }
```
This breaks every client that checks the status code, defeats HTTP caching, and makes monitoring useless — your error rate reads as zero while users see failures. **Use the status code. That's what it's for.**
:::

# Designing the response shape

```json
{
  "data": {
    "id": 42,
    "title": "Learning REST",
    "published_at": "2025-03-14T15:09:00Z",
    "author": { "id": 7, "name": "Ada Lovelace" }
  }
}
```

```json
{
  "data": [ { "id": 42, "…": "…" } ],
  "meta": { "total": 137, "limit": 20, "offset": 0 },
  "links": { "next": "/api/articles?offset=20&limit=20" }
}
```

Consistency matters more than which convention you choose. Pick one and apply it everywhere:

- Wrap in `data`, or don't — but be uniform.
- One key style: `snake_case` or `camelCase`, never both.
- **Dates as ISO 8601 in UTC**: `2025-03-14T15:09:00Z`. Never a locale-specific string, never a bare timestamp integer if you can help it.
- **Money as integer minor units** plus a currency code: `{ "amount": 1099, "currency": "GBP" }`. Never a float, never a pre-formatted string.
- **IDs as strings** if they might exceed 2^53 (JavaScript's safe integer limit) — this bites people with Twitter-style snowflake ids.
- Null for "no value", and be consistent about whether absent keys and null keys mean the same thing.

# Errors clients can act on

```json
{
  "error": {
    "code": "validation_failed",
    "message": "The request could not be processed.",
    "details": [
      { "field": "email", "code": "invalid_format", "message": "Must be a valid email address" },
      { "field": "age",   "code": "out_of_range",   "message": "Must be 18 or older" }
    ],
    "request_id": "req_01HQ8X..."
  }
}
```

The important parts:

- **A stable machine-readable `code`** the client can branch on. Message text will change; codes shouldn't.
- **Per-field details** for validation, so a form can highlight the right inputs.
- **A `request_id`** matching your logs, so a user's bug report becomes findable.
- **Never** a stack trace, SQL string or internal path. That's reconnaissance for an attacker.

# Pagination, filtering, sorting

```text
GET /api/articles?limit=20&offset=40
GET /api/articles?cursor=eyJpZCI6NDJ9&limit=20
GET /api/articles?status=published&author_id=7
GET /api/articles?sort=-published_at,title        ← '-' means descending
GET /api/articles?fields=id,title,author          ← sparse fieldsets
```

Always **cap the limit** server-side and always apply a default. An endpoint that returns every row when asked is a denial-of-service waiting to happen.

Cursor pagination (see the SQL sorting lesson) is the right choice for large or fast-changing datasets.

# Versioning

```text
/api/v1/articles              ← in the path: obvious, easy to route
Accept: application/vnd.myapp.v1+json    ← in a header: purer, less visible
```

Path versioning wins in practice because it's visible in logs, testable in a browser, and trivially cacheable.

**What counts as a breaking change:** removing or renaming a field, changing a type, adding a required parameter, changing status codes, tightening validation. **Not breaking:** adding an optional field or a new endpoint — which is why clients should ignore unknown fields.

# Idempotency

```text
POST   /orders          not idempotent — two calls make two orders
PUT    /orders/42       idempotent — same result however many times
DELETE /orders/42       idempotent — gone stays gone
```

For payments and other non-idempotent operations, accept an idempotency key:

```text
POST /api/payments
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
```

Store the key with the result; if the same key arrives again — because the client's connection dropped and it retried — return the original result instead of charging twice. Stripe popularised this pattern and it's worth copying wherever money is involved.

# Documentation

An undocumented API doesn't really exist. The standard is **OpenAPI** (formerly Swagger) — a machine-readable description that generates interactive docs, client libraries and request validation:

```yaml
paths:
  /articles/{id}:
    get:
      summary: Fetch one article
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: integer }
      responses:
        '200':
          description: The article
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Article' }
        '404': { description: Not found }
```

Whatever the format, document: every endpoint, every parameter, an example request and response, every error code, auth requirements and rate limits.

# Other things that make an API pleasant

- **Rate limit**, and say so in headers: `X-RateLimit-Remaining`, `Retry-After`.
- **Support conditional requests**: `ETag` and `If-None-Match` let clients skip downloads with a `304`.
- **Compress** responses (gzip/brotli).
- **HTTPS only.**
- **Return the created object** from a POST, so the client doesn't need a second request.
- **Be liberal in what you accept, strict in what you emit.**

:::quiz
? Which is the better URL for creating a user?
- `POST /api/createUser`
- `POST /api/users` *
- `GET /api/users/create`
- `POST /api/user/new`
> The HTTP method is the verb; the URL names the resource.

? A request is well-formed JSON but the email is invalid. Best status?
- 400
- 422 *
- 500
- 200 with an error field
> 400 is for malformed requests; 422 is for semantically invalid ones.

? Why is `200 OK` with `{"success": false}` a bad pattern?
- It's more bytes
- It breaks clients, caches and monitoring that rely on status codes *
- It isn't valid JSON
- It's slower
> Your error rate will look like zero while users are failing.

? What should an error response never include?
- A machine-readable code
- A request id
- A stack trace or SQL statement *
- A human-readable message
> Internal details are reconnaissance for attackers.

? Which is NOT a breaking API change?
- Renaming a field
- Adding a new optional field *
- Changing a field's type
- Adding a required parameter
> Which is why clients should ignore fields they don't recognise.

? What is an idempotency key for?
- Authentication
- Ensuring a retried request doesn't perform the operation twice *
- Caching
- Rate limiting
> Essential for payments, where a dropped connection triggers a retry.
:::

:::exercise Design an API
Design (on paper, then implement) an API for a blogging platform: posts, comments, authors, tags.

Specify every endpoint with its method, path, request body, success response and error responses. Include: pagination on lists, filtering posts by tag and author, a publish action, validation errors with per-field details, and a versioning strategy. Then critique it — which parts would confuse someone integrating without asking you a question?
:::
