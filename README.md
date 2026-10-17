# arulhealth.org

The social-impact home for Arul Health. A single static page, modeled on the structure of google.org: a headline, a rail of programs, a mission statement, three focus areas, impact figures, latest stories, and a resources call-out.

**Tagline:** Unlocking healthcare for everyone, everywhere.

## Stack

Plain HTML, CSS, and a few lines of JavaScript. No build step, no dependencies. Fonts load from Google Fonts (Inter, Newsreader).

```
index.html     the page
styles.css     brand tokens + layout
script.js      program rail arrows, mobile menu, footer year
assets/        logo, favicon, founder photo
CNAME          custom domain for GitHub Pages
```

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
```

## Deploy

The site is served by GitHub Pages from the `main` branch root. `CNAME` points the Pages site at `arulhealth.org`; the domain's DNS needs an `A`/`ALIAS` record at GitHub Pages' IPs (or a `CNAME` for `www`) for the custom domain to resolve.

## Editing

- Programs in the top rail are the `<li class="card">` items in `index.html`. Each has an eyebrow, a one-line description, a link, and a color tile (`tile-mint`, `tile-forest`, `tile-cream`, `tile-violet`, `tile-sand`).
- Impact figures live in the `.stats` list. They come from Arul Health's own patient and caregiver research; update the footnote if the source changes.
- Brand colors and type are the custom properties at the top of `styles.css`.
