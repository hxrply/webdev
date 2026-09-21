Forms are where your page stops talking and starts listening. They are also the part of HTML with the most built-in behaviour — a great deal of which people reimplement in JavaScript without realising it already exists.

# The basic shape

```html run title="A minimal form"
<form action="/subscribe" method="post">
  <label for="email">Email address</label>
  <input type="email" id="email" name="email" required>

  <button type="submit">Subscribe</button>
</form>

<style>
  form { display: grid; gap: 8px; max-width: 320px; font-family: system-ui; }
  input, button { padding: 8px; font: inherit; }
</style>
```

- **`action`** — where to send the data. Omit it and it posts to the current URL.
- **`method`** — `get` puts the data in the query string (searches, filters — bookmarkable); `post` puts it in the request body (anything that changes something, anything private).
- **`name`** — the key the value is sent under. **A field with no `name` is not submitted at all.** This is the single most common "my form isn't sending anything" bug.

# Labels: non-negotiable

```html run title="Two ways to label"
<!-- Explicit: for matches id -->
<label for="user">Username</label>
<input type="text" id="user" name="user">

<!-- Implicit: input nested inside the label -->
<label>
  Password
  <input type="password" name="pass">
</label>

<style>label { display: block; margin-bottom: 10px; font-family: system-ui; }</style>
```

A correctly associated label:

- is announced by screen readers when the field is focused;
- makes the field focus when you click the label text — a noticeably larger hit target, which matters a lot on touchscreens, especially for checkboxes.

:::gotcha Placeholder is not a label
`<input placeholder="Email">` looks tidy and fails badly: the text vanishes the moment someone types, so they can no longer check what the field was; it is often too low-contrast; and support in assistive tech is inconsistent. Use a real `<label>`. A placeholder can supplement it with an example format, never replace it.
:::

# Input types

The `type` attribute changes validation, and on mobile it changes the keyboard that appears — a real usability win for free.

```html run title="Input types you should know"
<form>
  <label>Text <input type="text" name="a"></label>
  <label>Email <input type="email" name="b"></label>
  <label>Password <input type="password" name="c"></label>
  <label>Number <input type="number" name="d" min="0" max="10" step="1"></label>
  <label>Tel <input type="tel" name="e"></label>
  <label>URL <input type="url" name="f"></label>
  <label>Date <input type="date" name="g"></label>
  <label>Time <input type="time" name="h"></label>
  <label>Colour <input type="color" name="i"></label>
  <label>Range <input type="range" name="j" min="0" max="100"></label>
  <label>File <input type="file" name="k" accept="image/*"></label>
  <label>Search <input type="search" name="l"></label>
</form>

<style>
  form { display: grid; gap: 10px; font-family: system-ui; max-width: 320px; }
  label { display: grid; gap: 3px; font-size: 14px; }
  input { padding: 6px; font: inherit; }
</style>
```

:::warn `type="number"` is for quantities, not digit strings
Phone numbers, card numbers, postcodes and OTP codes are *not* numbers — they can have leading zeros, spaces and letters, and a spinner is nonsense on them. Use `type="text"` with `inputmode="numeric"` and a `pattern` instead.
:::

# Checkboxes, radios and selects

```html run title="Choices"
<fieldset>
  <legend>Notifications</legend>
  <label><input type="checkbox" name="notify" value="email" checked> Email</label>
  <label><input type="checkbox" name="notify" value="sms"> SMS</label>
</fieldset>

<fieldset>
  <legend>Delivery speed</legend>
  <label><input type="radio" name="speed" value="standard" checked> Standard</label>
  <label><input type="radio" name="speed" value="express"> Express</label>
</fieldset>

<label for="country">Country</label>
<select id="country" name="country">
  <optgroup label="Europe">
    <option value="uk">United Kingdom</option>
    <option value="fr">France</option>
  </optgroup>
  <optgroup label="Americas">
    <option value="us" selected>United States</option>
  </optgroup>
</select>

<style>
  fieldset { margin-bottom: 12px; font-family: system-ui; }
  label { display: block; margin: 4px 0; }
  select { padding: 6px; font: inherit; }
</style>
```

Key points:

- **Radios in the same group share one `name`.** That is what makes them mutually exclusive. Different names = several independent radios, none of which switch each other off.
- **Checkboxes need a `value`**, otherwise they submit the string `"on"`.
- **`<fieldset>` + `<legend>`** group related controls and give the group an accessible name. Essential for radio groups: without it, a screen reader announces "Standard, radio button" with no hint of what question it answers.
- **Unchecked checkboxes are not submitted at all.** Servers must treat "absent" as "false".

# Textarea and other controls

```html run title="Longer input"
<label for="msg">Message</label>
<textarea id="msg" name="message" rows="4" maxlength="500"
          placeholder="Tell us what happened…"></textarea>

<label for="pw">New password</label>
<input type="password" id="pw" name="pw" autocomplete="new-password">

<datalist id="langs">
  <option value="JavaScript"><option value="Python"><option value="SQL">
</datalist>
<label for="lang">Favourite language</label>
<input list="langs" id="lang" name="lang">

<style>
  label { display:block; margin-top:10px; font-family: system-ui; }
  textarea, input { width: 100%; padding: 6px; font: inherit; box-sizing: border-box; }
</style>
```

Note that `<textarea>` has no `value` attribute — its content sits between the tags, and it is whitespace-sensitive, so don't indent the closing tag.

# Built-in validation

The browser will validate before submitting, for free:

```html run title="Validation without JavaScript"
<form>
  <label>Email (required)
    <input type="email" name="email" required>
  </label>

  <label>Username (3–12 letters)
    <input type="text" name="user" pattern="[A-Za-z]{3,12}"
           title="3 to 12 letters, no spaces or digits" required>
  </label>

  <label>Age (18+)
    <input type="number" name="age" min="18" max="120" required>
  </label>

  <button>Submit</button>
</form>

<style>
  form { display: grid; gap: 10px; max-width: 320px; font-family: system-ui; }
  label { display: grid; gap: 3px; font-size: 14px; }
  input { padding: 6px; font: inherit; }
  input:invalid:not(:placeholder-shown) { border: 2px solid crimson; }
  input:valid { border: 2px solid green; }
</style>
```

Available constraints: `required`, `min`, `max`, `step`, `minlength`, `maxlength`, `pattern`, plus the type itself. The `title` attribute supplies the message shown when a `pattern` fails — without it the browser's message is uselessly vague.

:::warn And still, validate on the server
Browser validation is a **convenience for honest users**. Anyone can bypass it with DevTools or by sending a request directly. Every rule enforced in the browser must be enforced again on the server, where it actually counts.
:::

# Autocomplete: be generous with it

```html
<input type="text"     name="name"    autocomplete="name">
<input type="email"    name="email"   autocomplete="email">
<input type="text"     name="address" autocomplete="street-address">
<input type="text"     name="cc-num"  autocomplete="cc-number" inputmode="numeric">
<input type="password" name="current" autocomplete="current-password">
```

Correct `autocomplete` values let browsers and password managers fill forms accurately. This is a significant accessibility benefit for people with motor or cognitive disabilities, and it measurably raises completion rates. Turning autocomplete off "for security" on ordinary fields is cargo-cult advice that mostly just annoys people.

# Buttons

```html run title="Button types"
<form onsubmit="event.preventDefault(); alert('Submitted');">
  <button type="submit">Submit (default)</button>
  <button type="reset">Reset the form</button>
  <button type="button" onclick="alert('Just a button')">Does nothing to the form</button>
</form>
```

:::gotcha `<button>` inside a form defaults to `type="submit"`
A button you added just to toggle something will submit the form and reload the page, and you will spend twenty minutes wondering why. Always write `type="button"` for non-submitting buttons.
:::

# Putting it together

```html run title="A complete, accessible form"
<form action="/contact" method="post">
  <h3>Contact us</h3>

  <label for="cname">Name</label>
  <input type="text" id="cname" name="name" autocomplete="name" required>

  <label for="cemail">Email</label>
  <input type="email" id="cemail" name="email" autocomplete="email" required
         aria-describedby="email-hint">
  <small id="email-hint">We'll only use this to reply.</small>

  <fieldset>
    <legend>How urgent is this?</legend>
    <label><input type="radio" name="urgency" value="low" checked> Whenever</label>
    <label><input type="radio" name="urgency" value="high"> Today please</label>
  </fieldset>

  <label for="cmsg">Message</label>
  <textarea id="cmsg" name="message" rows="4" required minlength="10"></textarea>

  <button type="submit">Send message</button>
</form>

<style>
  form { font-family: system-ui; max-width: 340px; }
  label { display: block; margin-top: 10px; font-weight: 600; font-size: 14px; }
  input, textarea { width: 100%; padding: 7px; font: inherit; box-sizing: border-box; }
  fieldset { margin-top: 12px; }
  fieldset label { font-weight: 400; }
  fieldset input { width: auto; }
  small { color: #666; }
  button { margin-top: 14px; padding: 9px 18px; font: inherit; cursor: pointer; }
</style>
```

:::quiz
? A field's value never arrives at the server. What is the most likely cause?
- It has no `id`
- It has no `name` attribute *
- It is missing a label
- The form uses `method="post"`
> `name` is the key under which a value is submitted. No name, no data.

? Why must radio buttons in a group share the same `name`?
- To style them together
- Because that is what makes them mutually exclusive *
- So they submit as an array
- They don't need to
> Same name = one group = one value. Different names = independent radios.

? What is wrong with using a placeholder instead of a label?
- Placeholders cannot be styled
- The text disappears on typing and support in assistive tech is unreliable *
- Placeholders are deprecated
- It prevents form submission
> Labels persist, are reliably announced, and give a bigger click target.

? A button inside a form toggles a panel but keeps reloading the page. Why?
- The panel is missing an id
- Buttons in forms default to `type="submit"` *
- `onclick` is not allowed in forms
- The form needs `method="get"`
> Add `type="button"` to any button that shouldn't submit.

? Client-side validation passes. Does the server still need to validate?
- No, that would be duplicated work
- Yes — anyone can bypass the browser entirely *
- Only for file uploads
- Only if the form uses GET
> Browser validation is UX. Server validation is the actual enforcement.

? Which input type suits a phone number?
- `type="number"` with a pattern
- `type="tel"` (or text with `inputmode="numeric"`) *
- `type="text"` with `step="1"`
- `type="search"`
> Phone numbers aren't quantities: leading zeros, spaces and `+` all matter.
:::

:::exercise Build a sign-up form
Create a form with: name, email, password (with `autocomplete="new-password"`), a country `<select>`, a fieldset of radio buttons, a required terms checkbox, and a submit button. Every field labelled, `required` where appropriate, `pattern` on at least one. Then try to submit it empty and watch the browser stop you — with no JavaScript at all.
:::
