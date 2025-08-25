# Demoblaze Cypress Tests

This repository contains end-to-end tests for **demoblaze.com** written with **Cypress**.  
The suite covers two critical user journeys: **Login** (positive and negative) and **Purchase** (add to cart , checkout and receipt).

---

## Quick start

### Prerequisites
- Node.js 16+ and npm
- macOS/Linux/Windows
- Optional: VS Code (this repo was authored in VS Code)

### Install
```bash
npm install
```

### Open Cypress GUI (interactive)
```bash
npx cypress open
```
Then run the specs from the Cypress runner.

### Run headless (CI mode)
```bash
npx cypress run
# or a single spec:
npx cypress run --spec cypress/e2e/purchase.cy.js
```

---

## Running in Chrome

### GUI (interactive)
Run the runner, then select Chrome in the browser list:
```bash
npx cypress open
```

### CLI (launch Chrome directly / CI)
```bash
npx cypress open --browser chrome
npx cypress run --browser chrome
npx cypress run --browser chrome --headed
```

### Optional npm scripts (package.json)
```json
{
  "scripts": {
    "cy:open": "cypress open",
    "cy:open:chrome": "cypress open --browser chrome",
    "cy:run": "cypress run",
    "cy:run:chrome": "cypress run --browser chrome",
    "cy:run:chrome:headed": "cypress run --browser chrome --headed"
  }
}
```

---

## Running from VS Code

- Open VS Code and use the integrated terminal:
  ```bash
  npx cypress open
  # or specifically in Chrome:
  npx cypress open --browser chrome
  ```
- Saving a test file auto-reloads in the Cypress runner.
- For debugging:
  - Add `cy.pause()` to stop at a step.
  - Use `cy.get('selector').debug()` to inspect subjects.
  - Open DevTools (F12) and watch Console/Network.

---

## Project structure

```
cypress/
  e2e/
    login.cy.js           # positive + negative login tests
    purchase.cy.js        # end-to-end purchase flow
  pages/
    LoginPage.js          # page object for login
    PurchasePage.js       # page object for purchase/cart/receipt
  support/
    commands.js           # custom commands (e.g., cy.safeType)
    e2e.js                # global hooks, intercepts, logs
cypress.config.js          # Cypress config (baseUrl, etc.)
package.json
README.md
```

**Config:** `cypress.config.js` defines:
```js
const { defineConfig } = require('cypress');
module.exports = defineConfig({
  e2e: { baseUrl: 'https://www.demoblaze.com' }
});
```

---

## How to run specific tests

- **Login only**
  ```bash
  npx cypress run --spec cypress/e2e/login.cy.js
  ```

- **Purchase only (dynamic product)**
  - If you want to run with a specific product:
    ```bash
    npx cypress run --spec cypress/e2e/purchase.cy.js --env product="Sony vaio i5"
    # or GUI
    npx cypress open --env product="Sony vaio i5"
    ```
  - If you don't pass `--env product=...`, the test picks the **first laptop** in the list dynamically.

---

## Test data

For demo purposes the tests use:
- User: `Firdevs`
- Password: `12345`

You can change them in the spec files if needed.

---
## Test Approach
I focused on **critical paths with highest business impact**: login and purchase.  

## What I considered essential to test — and why

1. **Login flow**
   - Positive: valid username/password shows `Welcome <user>`.
   - Negative: wrong username → `User does not exist.`; wrong password → `Wrong password.`  
   **Why:** Authentication is the entry point; verifying both success and error handling is essential.

2. **Purchase flow (end-to-end)**
   - Add product → assert native alert (“Product added.”).
   - Cart → assert product name and **total amount** (taken dynamically from UI).
   - Place Order modal → fill all fields reliably.
   - Purchase to  assert receipt (“Thank you for your purchase!”), parse **Amount** and **Name**, then click **OK**.
   - Finally verify the cart is empty (fresh cart page).  
   **Why:** This is the core revenue path; we assert UI, data integrity, and server-side effects.

---

## How I designed the tests

### Page Object Model (POM)
- `LoginPage.js` and `PurchasePage.js` encapsulate selectors and actions.
- Keeps specs readable and centralizes selector maintenance.

### Dynamic product & totals
- Product name is **dynamic**: via `--env product="..."` or fallback to **first** item in the Laptops list.
- Expected totals are **not hardcoded**: the price is captured from the product detail (`h3.price-container`) and reused to validate the cart total and receipt Amount.

### Robust selectors & network guards
- Category navigation uses text-based locator and waits for the backend (`bycat`) to finish before asserting the list.
- Cart navigation waits for `viewcart` before asserting totals.
- Purchase button is a modal-scoped selector guarded with button text.

### Reliable typing (`cy.safeType`)
- Custom command with a small delay and final value check—prevents partial inputs inside modals and with special characters.

### Assertion-based waiting (no arbitrary sleeps)
- Avoids static waits; relies on visible states (`show` class, enabled buttons) and network intercepts.

### Alerts & popups
- Add to cart: stub `window.alert` and assert “Product added.”
- Receipt (SweetAlert): assert exact title; parse the whole popup text with regex to extract **Amount** and **Name**. For SweetAlert v1 (node remains in DOM), assert **not visible** rather than **not exist**.

### Network assertions
- After Purchase, wait for `POST **/deletecart` to confirm the server flow executed.

### Noise reduction
- Intercept `https://hls.demoblaze.com/**` in `support/e2e.js` to silence 403 video requests.

---

## Tests list (high-level)

### `login.cy.js`
- Logs in successfully (valid username + valid password) — asserts welcome banner.
- Fails with wrong username + correct password — asserts `User does not exist.`
- Fails with correct username + wrong password — asserts `Wrong password.`

### `purchase.cy.js`
- Purchases a laptop successfully (dynamic):
  1) Open Laptops (waits for `bycat`)
  2) Select product (env override or first item)
  3) Read price from detail page
  4) Add to cart → go to cart (waits for `viewcart`)
  5) Assert product name + total equals captured price
  6) Place Order → fill form → Purchase (waits for `deletecart`)
  7) Receipt → assert title; parse and validate **Amount** and **Name**
  8) Confirm → click **OK** and assert SweetAlert hidden
  9) Cart is empty (fresh `/cart.html`)

---

## Troubleshooting

- 403 on `index.m3u8`: expected (video CDN). Silenced via `cy.intercept` in `support/e2e.js`.
- Purchase button doesn't click: ensure the order modal has class `show`; selector is modal-scoped and `click({ force: true })` is allowed.
- Inputs truncate (Unicode/fast typing): `cy.safeType` handles delays and verification.
- Cart not empty assertion fails: navigate directly to `/cart.html` (fresh render) and assert there.

---

## AI Tool Usage and Disclosure
I mainly relied on the Cypress docs and website (https://www.cypress.io). I used an AI assistant only for brainstorming, debugging ideas, minor setup tips (e.g., the support file), and README wording; all final code, the Page Object structure (aligned with my current project’s POM), and decisions are my own and were reviewed and run locally.

---

## License
For demo/testing purposes only. This project interacts with a public demo site.
