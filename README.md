# arulhealth.org

The social-impact home for Arul Health. A single static page laid out after bostonjcc.org/who-we-are: a split hero (copy left, photo fading into a tint on the right), the three focus areas as alternating photo / copy rows with an offset color block behind each photo, a four-up "What we believe" row, the impact figures on a tinted band, the eight programs as a card grid, a "Why we exist" story row, a resources row, and the footer. Headings are Lora; body text is Google Sans Text. The header, footer and article sheets are unchanged from the earlier google.org-style design.

**Tagline:** Unlocking healthcare for everyone, everywhere.

## Stack

Plain HTML, CSS, and a few lines of JavaScript. No build step, no dependencies. Fonts are Google Sans / Google Sans Text from Google Fonts (Arial fallback).

```
index.html       the page
scholars.html    Arul Scholars (chapters & campus initiatives), served at /scholars via cleanUrls; linked from the header menu
styles.css       tokens + layout (measurements from a 1512px google.org capture)
script.js        mobile menu, article sheets
assets/          logo, favicon
assets/photos/   card and section photos
assets/photos/scholars/  event photos for the Scholars page
research/        the Research tab: index.html (mosaic of papers), one .html per paper, research.css, research.js; see "Research" below
firebase.json    Firebase Hosting config (site `arulhealth-org`; README, dotfiles and .github are not uploaded)
```

## Article sheets

Only two things on the home page send visitors to arulhealth.com, both in a new tab: **Try Arul** (header) opens `arulhealth.com/get-started`, and **View resources** (and the resources image) opens `arulhealth.com/blog`. Every other clickable item opens a full article in a bottom sheet. The articles are written as a record of work done (past tense, impact first); Project Life is named with its agreement; other partners, pharmaceutical sponsors and investors are not:

| Trigger | Article id |
|---|---|
| "Up next" chain only (the "Our work" grid was removed) | `clinical-trials`, `rides-and-lodging`, `financial-aid`, `denials-and-appeals`, `pediatric-cancer`, `metastatic-breast-cancer`, `peer-navigators`, `medical-records` |
| The three focus cards | `access-to-care`, `healthy-habits`, `stronger-communities` |
| "Up next" chain only | `get-started` (contact by email to support@arulhealth.com) |
| Footer: About Arul Health, Help | `about`, `help` |

How it works:

- Each article is a `<template id="sheet-<id>">` at the bottom of `index.html`. Any element with `data-sheet="<id>"` opens it, including links inside other articles.
- The sheet is a native `<dialog>` (focus trap, Esc). It slides up to ~90% of the viewport and closes with the X, Esc, a click on the dimmed page, a swipe down on the grab bar, or the Back button.
- The open article is in the URL hash, so `arulhealth.org/#financial-aid` opens that article directly.
- Template order is the "Up next" order at the end of each article; `data-next` on an `<article>` overrides it.
- To add an article: add a template, then put `data-sheet="<id>"` on the trigger. No script change needed.

The articles were written on 2026-10-22 from the Arul Health knowledge vault. They name no partners or investors on purpose; add one only with that organization's sign-off.

## Research

`/research` is the research index: a mosaic of tiles (`.tile` in `research/index.html`). A tile is a paper, a single finding that deep-links into a paper section, or a "Coming next" placeholder; `data-kind` (`paper`, `finding`, `next`) drives the filter chips. Tile art is drawn by `research.js` from `data-art` (`people`, `rings`, `columns`, `ticks`).

Each paper is one HTML file in `research/`, served at `/research/<slug>`. The template has a dark hero, a sticky section bar with scrollspy and a reading-progress line, numbered figures, one sticky "scrolly" figure whose dot grid changes as the steps scroll past, and a method-and-limits section with a citation block.

- Every chart value is written in the HTML (`--v` on a bar or segment, `data-on` / `data-hot` on a scrolly step). `research.js` only animates; with JS off the page still shows every number.
- Chart colors are the `--c-*` tokens at the top of `research.css`. They were checked for color-blind separation; check any new ones the same way before adding them.
- To add a paper: copy `hidden-work-of-being-sick.html`, change the sections and figures, add a tile to `research/index.html`, and update the counts in the index hero.
- Paper 001 is written from the January 2026 survey of 400 adults (the same one cited in the Access to Care article). It does not name the research partner, and its limits section says the survey was not independent.

## Email list

The "Join our email list" band posts `{name, email, website, source}` as JSON to the Arul orchestrator's public
`POST /newsletter/subscribe` (the form's `data-endpoint`, `https://api.arulhealth.com`) and shows the result in place.
`website` is a field people never see; a bot that fills it is answered as if it worked and nothing is stored. The
endpoint is rate-limited per IP and stores the address in `newsletter_subscriber` in the Arul database. Staff copy
the whole list (these sign-ups plus patient, caregiver and staff addresses, minus unsubscribes) from the admin
console's **Growth** tab, and record unsubscribes there too.

The orchestrator only accepts the browser call from origins in its `CORS_ALLOW_ORIGINS`
(`infra/gcp/cloud-run/orchestrator.service.yaml` in the arul-health repo lists `https://arulhealth.org` and `www`).
For a local test, point `data-endpoint` at a local orchestrator that allows `http://localhost:<port>`.

## Layout reference

Measured from google.org at 1512px wide and reproduced here:

| Element | Value |
|---|---|
| Header | copied from arulhealth.com, not google.org: 80px translucent bar (20px backdrop blur, hairline rule), 64px side padding, 36px logo, Inter 17px/500 links centered on the bar, "Try Arul →" button (`#0B2A16` on `#CFFADF`, 12px radius, 10×20 padding) |
| Content column | 1296px, 108px side margins |
| Hero h1 | 60px / 72px, -0.5px tracking, centered, 80px above |
| Program rail | 302.4px square cards on a 378px pitch; active card centered, dark text; landscape cards 302 × 202 vertically centered; portrait (2:3) cards 202 × 302 horizontally centered; 50px round arrows bottom right |
| Statement | 36px / 44px, -0.25px tracking, ~700px measure |
| Feature image | 1296 × 729 (`home-visit.jpg`, a navigator with a patient at home) |
| Our focus | h2 48px / 56px; lede 28px / 36px; 3 columns, 64px gap, 3:4 images with 8px top radius; 28px titles, 16px `#5f6368` copy, "Learn more" link + chevron |
| Resources | 502px image (the arulhealth.com home page, 1812:1066) + 502px copy, 64px gap; h2 48px / 56px; 18px / 28px copy |
| Footer | `#f8f9fa`; single row: logo + About Arul Health, Help, copyright (the link columns, Privacy and Terms were removed on request) |

Google's blue (`#1a73e8`) is swapped for the violet in the Arul wordmark (`#8e4dff`); every other color is google.org's neutral palette.

## Photos

`assets/photos/home-visit.jpg`, `arul-hero.jpg` (the arulhealth.com home page) and `founding-treatment.jpg` are Arul's own. `appeals.jpg`, `financial-aid.jpg`, `pediatric.jpg`, `mbc.jpg`, `records.jpg` and `rides.jpg` are stock photos supplied on 2026-10-22. The five program and focus photos (`peer-navigators`, `trials`, `focus-access`, `focus-habits`, `focus-communities`) are **AI-generated placeholders** (Figma AI, 2026-10-16) chosen to avoid identifiable faces. Replace them with real program photography before this page is promoted; keep the same filenames and aspect ratios (1:1 and 3:2 for the rail, 3:4 for the focus cards) and nothing else needs to change.

## Run locally

```bash
python3 serve.py
```

`serve.py` mimics Firebase Hosting's `cleanUrls`, so `/scholars` resolves to `scholars.html` the way it does in production. Plain `python3 -m http.server` works too but returns 404 for the clean menu links.

## Deploy

Every push to `main` deploys to Firebase Hosting via `.github/workflows/deploy.yml`. HTML is served `no-cache`; `styles.css` and `script.js` are referenced as `?v=__ASSET_VERSION__`, which the workflow replaces with the commit SHA, so browsers never pair fresh HTML with a stale cached stylesheet. Locally the placeholder is harmless.

Firebase Hosting, site `arulhealth-org` in the `arul-health` project (`https://arulhealth-org.web.app`, custom domain `arulhealth.org`). `.github/workflows/deploy.yml` deploys on every push to `main`, and each same-repo PR gets a 7-day preview channel whose URL is commented on the PR. The workflow signs in to GCP with Workload Identity Federation (provider `github-arulhealth-org` in the `github` pool, service account `arulhealth-org-deployer`, role `roles/firebasehosting.admin`), so there is no key or repo secret.

Manual deploy: `npx firebase-tools deploy --only hosting:arulhealth-org --project arul-health`.
