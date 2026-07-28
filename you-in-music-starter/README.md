# You In Music starter site

A responsive static landing page and guided song intake prototype.

## What is included

* Emotional brand landing page
* Responsive mobile navigation
* Five step song intake
* Browser based draft saving
* Review step
* Local JSON export on submission
* No build process required

## Preview locally

Open `index.html` directly, or run a local server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy to Cloudflare Pages

Upload this folder as a static site. There is no build command. The output directory is the project root.

## Connect the real business flow

Replace the local JSON submission in `script.js` with one of these:

1. Stripe Checkout for payment
2. Airtable for intake storage
3. Resend or another email service for confirmations
4. Cloudflare Pages Functions for secure server side handling

## Brand palette

* Ink: `#19141b`
* Plum: `#4b173c`
* Deep plum: `#2e0d25`
* Berry: `#9f376c`
* Coral: `#ef7a67`
* Cream: `#f7f0e7`
