# Change Log

All notable changes to the "bootstrap5-snippets" extension will be documented in this file.

Check [Keep a Changelog](https://github.com/adereksisusanto/bootstrap5-snippets/releases/tag/0.0.2) for recommendations on how to structure this file.

## [Released 0.0.2]

- Add Form Login

### Form Login

**Command **

> b5-form-login

**Output **

```html
<form>
    <div class="mb-3">
        <label for="email_input" class="form-label">Email</label>
        <input type="email" class="form-control" id="email_input" name="email_input" placeholder="Enter Email..." aria-describedby="email_input_Help">
        <div id="email_input_Help" class="form-text">We'll never share your email with anyone else.</div>
    </div>
    <div class="mb-3">
        <label for="password_input" class="form-label">Password</label>
        <input type="password" class="form-control" id="password_input" name="password_input" placeholder="Enter Password...">
    </div>
    <div class="mb-3 form-check">
        <input type="checkbox" class="form-check-input" id="remmember_me" name="remmember_me">
        <label class="form-check-label" for="remmember_me">Remmember me</label>
    </div>
    <button type="submit" class="btn btn-primary">Submit</button>
</form>
```
