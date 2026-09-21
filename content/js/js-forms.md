Forms are where most real front-end work happens: reading input, validating it, giving feedback, and sending it somewhere without a page reload.

# Reading values

```html run title="Getting what the user typed"
<form id="demo">
  <input type="text" name="username" value="ada">
  <input type="number" name="age" value="36">
  <input type="checkbox" name="subscribe" checked>
  <select name="plan"><option value="free">Free</option><option value="pro" selected>Pro</option></select>
  <button type="button" id="read">Read values</button>
</form>
<pre id="out"></pre>

<style>
  body { font-family: system-ui; font-size: 14px; }
  form { display: grid; gap: 8px; max-width: 260px; }
  input, select, button { padding: 6px; font: inherit; }
  pre { background: #f7fafc; padding: 8px; font-size: 12px; }
</style>

<script>
  const form = document.getElementById('demo');
  document.getElementById('read').addEventListener('click', () => {
    const out = [];
    out.push('username: ' + JSON.stringify(form.username.value));
    out.push('age (string): ' + JSON.stringify(form.age.value));
    out.push('age (number): ' + form.age.valueAsNumber);
    out.push('subscribe: ' + form.subscribe.checked);
    out.push('plan: ' + form.plan.value);
    document.getElementById('out').textContent = out.join('\n');
  });
</script>
```

Key points:

- **`.value` is always a string**, even from `type="number"`. Use `valueAsNumber`, or `Number(input.value)`.
- **Checkboxes and radios use `.checked`**, not `.value`.
- `form.fieldName` works because named form controls become properties of the form.

# FormData: the whole form at once

```html run title="FormData"
<form id="signup">
  <input name="name" value="Ada">
  <input name="email" type="email" value="ada@example.com">
  <label><input type="checkbox" name="interests" value="css" checked> CSS</label>
  <label><input type="checkbox" name="interests" value="js" checked> JS</label>
  <button>Submit</button>
</form>
<pre id="out"></pre>

<style>
  body { font-family: system-ui; font-size: 14px; }
  form { display: grid; gap: 8px; max-width: 260px; }
  input:not([type=checkbox]), button { padding: 6px; font: inherit; }
  pre { background: #f7fafc; padding: 8px; font-size: 12px; }
</style>

<script>
  document.getElementById('signup').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.target);

    const plain = Object.fromEntries(data);            // note: only the LAST 'interests'
    const all = data.getAll('interests');              // all checked values

    document.getElementById('out').textContent =
      'Object.fromEntries:\n' + JSON.stringify(plain, null, 2) +
      '\n\ngetAll("interests"): ' + JSON.stringify(all);
  });
</script>
```

`FormData` collects every named field, handles file inputs, and can be sent directly:

```js
await fetch('/api/signup', { method: 'POST', body: formData });          // multipart
await fetch('/api/signup', {                                              // or as JSON
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(Object.fromEntries(formData))
});
```

:::gotcha Only *named* fields are included
A field with no `name` attribute is invisible to `FormData` and to normal form submission. Also, unchecked checkboxes are absent entirely — not `false`, absent. Handle that explicitly:
```js
const subscribed = formData.has('subscribe');
```
:::

# The Constraint Validation API

The browser's built-in validation is available to JavaScript, so you can use its rules while controlling the presentation.

```html run title="Custom messages, native rules"
<form id="f" novalidate>
  <label>Email <input type="email" name="email" required></label>
  <span class="err" id="email-err"></span>

  <label>Password <input type="password" name="password" required minlength="8"></label>
  <span class="err" id="password-err"></span>

  <button>Sign up</button>
</form>
<p id="result"></p>

<style>
  body { font-family: system-ui; font-size: 14px; }
  form { display: grid; gap: 4px; max-width: 280px; }
  label { display: grid; gap: 3px; }
  input, button { padding: 7px; font: inherit; }
  input:user-invalid { border: 2px solid crimson; }
  .err { color: crimson; font-size: 12px; min-height: 1em; }
  #result { color: green; font-weight: 600; }
</style>

<script>
  const form = document.getElementById('f');

  function messageFor(input) {
    const v = input.validity;
    if (v.valueMissing)  return 'This field is required.';
    if (v.typeMismatch)  return 'Please enter a valid email address.';
    if (v.tooShort)      return `At least ${input.minLength} characters (you have ${input.value.length}).`;
    if (v.patternMismatch) return 'That format is not accepted.';
    return input.validationMessage;
  }

  function validateField(input) {
    const errEl = document.getElementById(input.name + '-err');
    errEl.textContent = input.checkValidity() ? '' : messageFor(input);
    return input.checkValidity();
  }

  form.querySelectorAll('input').forEach(input => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      if (document.getElementById(input.name + '-err').textContent) validateField(input);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const inputs = [...form.querySelectorAll('input')];
    const allValid = inputs.map(validateField).every(Boolean);   // map first — validate all
    if (!allValid) { inputs.find(i => !i.checkValidity()).focus(); return; }
    document.getElementById('result').textContent = '✓ Submitted successfully';
  });
</script>
```

Notice the interaction design here, which matters as much as the code:

- **Validate on blur**, not on every keystroke — telling someone their email is invalid while they're still typing the first character is hostile.
- **Once an error is shown**, re-validate on input so it clears as soon as they fix it.
- **On submit, focus the first invalid field** so keyboard users aren't stranded.
- `novalidate` on the form disables the browser's own bubbles while keeping the validation *rules* available to `checkValidity()`.

The ValidityState flags: `valueMissing`, `typeMismatch`, `patternMismatch`, `tooShort`, `tooLong`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch`, `badInput`, `customError`.

## Custom rules

```js
function checkPasswordMatch(pw, confirm) {
  if (pw.value !== confirm.value) {
    confirm.setCustomValidity('Passwords do not match.');
  } else {
    confirm.setCustomValidity('');     // must clear it, or the field stays invalid forever
  }
}
```

:::warn setCustomValidity must be cleared
A field with a non-empty custom validity message is permanently invalid until you set it back to `''`. Forgetting this produces a form that can never be submitted, with no visible reason.
:::

# Useful CSS pseudo-classes

```css
input:invalid { }                        /* invalid from page load — often too eager */
input:user-invalid { }                   /* invalid only after the user has interacted ✓ */
input:placeholder-shown { }              /* still empty */
input:required { }
.field:has(input:user-invalid) { }       /* style the whole wrapper */
```

`:user-invalid` is what you usually want: it avoids splashing red across a blank form the moment it loads.

# Submitting without a reload

```js
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;                          // prevent double-submit
  button.textContent = 'Sending…';

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    });

    if (!res.ok) throw new Error(`Server said ${res.status}`);

    form.reset();
    status.textContent = 'Thanks — we’ll be in touch.';
  } catch (err) {
    status.textContent = 'Something went wrong. Please try again.';
    console.error(err);
  } finally {
    button.disabled = false;
    button.textContent = 'Send';
  }
});
```

That shape — disable, try, catch, finally re-enable — is worth memorising. The `finally` block is what stops a failed request leaving your button stuck on "Sending…" forever.

:::tip Announce status changes
Put the status message in a live region so screen-reader users hear it:
```html
<p id="status" role="status" aria-live="polite"></p>
```
:::

# Other form bits

```js
form.reset();                       // back to default values
input.focus();  input.select();     // focus and select all text
input.setSelectionRange(2, 5);      // select a range

// File inputs
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  console.log(file.name, file.size, file.type);
  if (file.size > 5_000_000) return alert('Max 5 MB');
  const url = URL.createObjectURL(file);      // preview without uploading
  preview.src = url;
});
```

:::warn Client validation is UX, not security
Everything in this lesson can be bypassed with DevTools or a direct HTTP request. **Every rule must be enforced again on the server.** Client-side validation exists to save users a round trip, not to protect your data.
:::

:::quiz
? What type does `input.value` return for `<input type="number">`?
- number
- string *
- number or NaN
- Depends on the browser
> Use `valueAsNumber` or `Number(input.value)`.

? How do you get all values of several checkboxes sharing a name?
- `formData.get('name')`
- `formData.getAll('name')` *
- `Object.fromEntries(formData)`
- `form.name.value`
> `get` and `fromEntries` keep only the last one.

? Why use `:user-invalid` instead of `:invalid`?
- It is better supported
- It only applies after the user has interacted, so blank forms don't turn red on load *
- It works on all elements
- It includes custom validity
> Showing errors before anyone has typed anything is bad UX.

? What must you do after `setCustomValidity('error')` once the problem is fixed?
- Nothing
- Call `setCustomValidity('')` to clear it *
- Call `form.reset()`
- Remove the required attribute
> Otherwise the field stays permanently invalid and the form can never submit.

? Why put the button re-enable in a `finally` block?
- It runs faster
- So the button is restored whether the request succeeded or failed *
- finally runs before catch
- It is required syntax
> Without it, a network error leaves the UI stuck in its loading state.

? A checkbox is unchecked. What does FormData contain for it?
- `false`
- `'off'`
- Nothing — the key is absent *
- `null`
> Use `formData.has('name')` to test it.
:::

:::exercise Build a validated sign-up form
Fields: name (required), email (required, valid), password (min 8 chars, must contain a digit — use `pattern`), confirm password (must match, via `setCustomValidity`), and a required terms checkbox.

Requirements: validate on blur, clear errors on input, show messages in elements associated with `aria-describedby`, focus the first invalid field on submit, and simulate submission with a disabled button and a status message in a live region.
:::
