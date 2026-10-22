# arulhealth.org

The social-impact home for Arul Health. A single static page that follows the google.org homepage grid section for section: headline, program rail, mission statement, feature image, three focus areas, resources call-out, footer.

**Tagline:** Unlocking healthcare for everyone, everywhere.

## Stack

Plain HTML, CSS, and a few lines of JavaScript. No build step, no dependencies. Fonts are Google Sans / Google Sans Text from Google Fonts (Arial fallback).

```
index.html       the page
scholars.html    Arul Scholars (chapters & campus initiatives), served at /scholars via cleanUrls; linked from the header menu
styles.css       tokens + layout (measurements from a 1512px google.org capture)
script.js        program rail (transform-driven endless slider: wheel, drag, arrows), mobile menu
assets/          logo, favicon
assets/photos/   card and section photos
assets/photos/scholars/  event photos for the Scholars page
firebase.json    Firebase Hosting config (site `arulhealth-org`; README, dotfiles and .github are not uploaded)
```

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
| Our impact | h2 48px / 56px; lede 28px / 36px; four figures at 48px / 56px with 16px `#5f6368` labels (not on google.org's homepage; added so the "Our impact" nav link has an in-page target) |
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
