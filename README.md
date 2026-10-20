# arulhealth.org

The social-impact home for Arul Health. A single static page that follows the google.org homepage grid section for section: headline, program rail, mission statement, feature image, three focus areas, resources call-out, footer.

**Tagline:** Unlocking healthcare for everyone, everywhere.

## Stack

Plain HTML, CSS, and a few lines of JavaScript. No build step, no dependencies. Fonts are Google Sans / Google Sans Text from Google Fonts (Arial fallback).

```
index.html       the page
styles.css       tokens + layout (measurements from a 1512px google.org capture)
script.js        program rail (transform-driven endless slider: wheel, drag, arrows), mobile menu
assets/          logo, favicon
assets/photos/   card and section photos
firebase.json    Firebase Hosting config (site `arulhealth-org`; README, dotfiles and .github are not uploaded)
```

## Layout reference

Measured from google.org at 1512px wide and reproduced here:

| Element | Value |
|---|---|
| Header | copied from arulhealth.com, not google.org: 80px translucent bar (20px backdrop blur, hairline rule), 64px side padding, 36px logo, Inter 17px/500 links centered on the bar, "Try Arul →" button (`#0B2A16` on `#CFFADF`, 12px radius, 10×20 padding) |
| Content column | 1296px, 108px side margins |
| Hero h1 | 60px / 72px, -0.5px tracking, centered, 80px above |
| Program rail | 302.4px square cards on a 378px pitch; active card centered, dark text; landscape cards 302 × 202 vertically centered; 50px round arrows bottom right |
| Statement | 36px / 44px, -0.25px tracking, ~700px measure |
| Feature image | 1296 × 729 (the Arul Health brand image) |
| Our focus | h2 48px / 56px; lede 28px / 36px; 3 columns, 64px gap, 3:4 images with 8px top radius; 28px titles, 16px `#5f6368` copy, "Learn more" link + chevron |
| Our impact | h2 48px / 56px; lede 28px / 36px; four figures at 48px / 56px with 16px `#5f6368` labels (not on google.org's homepage; added so the "Our impact" nav link has an in-page target) |
| Resources | 502px image (the arulhealth.com home page, 1812:1066) + 502px copy, 64px gap; h2 48px / 56px; 18px / 28px copy |
| Footer | `#f8f9fa`; single row: logo + About Arul Health, Help, copyright (the link columns, Privacy and Terms were removed on request) |

Google's blue (`#1a73e8`) is swapped for the violet in the Arul wordmark (`#8e4dff`); every other color is google.org's neutral palette.

## Photos

`assets/photos/arul-health-brand.jpg`, `arul-hero.jpg` (the arulhealth.com home page) and `founding-treatment.jpg` are Arul's own. The eleven program and focus photos (`financial-aid`, `appeals`, `pediatric`, `mbc`, `peer-navigators`, `records`, `rides`, `trials`, `focus-access`, `focus-habits`, `focus-communities`) are **AI-generated placeholders** (Figma AI, 2026-10-16) chosen to avoid identifiable faces. Replace them with real program photography before this page is promoted; keep the same filenames and aspect ratios (1:1 and 3:2 for the rail, 3:4 for the focus cards) and nothing else needs to change.

## Run locally

```bash
python3 -m http.server 8080
```

## Deploy

Firebase Hosting, site `arulhealth-org` in the `arul-health` project (`https://arulhealth-org.web.app`, custom domain `arulhealth.org`). `.github/workflows/deploy.yml` deploys on every push to `main`, and each same-repo PR gets a 7-day preview channel whose URL is commented on the PR. The workflow signs in to GCP with Workload Identity Federation (provider `github-arulhealth-org` in the `github` pool, service account `arulhealth-org-deployer`, role `roles/firebasehosting.admin`), so there is no key or repo secret.

Manual deploy: `npx firebase-tools deploy --only hosting:arulhealth-org --project arul-health`.
