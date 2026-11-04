# Climbora Digital

Marketing website for [Climbora Digital](https://climboradigital.com) — organic content, landing pages & websites, and online stores for small businesses.

**Live site:** https://climboradigital.com

## Stack

Static HTML/CSS/JS. No framework, no build step, no dependencies. Each page is one `.html` file with its base styles inline; the design system and interactions are shared through `site.css` and `site.js`.

## Structure

```
├── index.html        Home
├── services.html       Services overview
├── organic-content.html  Organic Content
├── websites.html        Landing Pages & Websites
├── online-stores.html   Online Stores
├── about.html         About
├── privacy.html        Privacy policy
├── pricing.html        Packages and prices
├── links.html          Link-in-bio page for social profiles
├── 404.html            Page not found
├── site.css            Shared design system
├── site.js             Shared interactions
├── climbora-reel.mp4   Brand video (poster: climbora-reel.jpg)
├── favicon.svg
├── og-image.png         Social share card (1200×630)
├── og-image.svg         Source for og-image.png — re-export the PNG if you edit it
├── robots.txt
└── sitemap.xml
```

## Running locally

No build step — open any `.html` file directly in a browser, or serve the folder with any static file server, e.g.:

```bash
npx serve .
```

## Notes

- Fully responsive, tested down to ~375px.
- Accessibility: `prefers-reduced-motion` support, `:focus-visible` states, semantic landmarks.
- SEO: per-page meta/Open Graph/Twitter cards, JSON-LD (`ProfessionalService` + `FAQPage`), `sitemap.xml`, `robots.txt`.
- Only external dependency is Google Fonts (Inter + JetBrains Mono).

## Deployment

Hosted on GitHub Pages, served at the custom domain in the `CNAME` file. Pushing to `main` deploys automatically, usually live within a minute.

## License

All rights reserved. This code and its content are proprietary to Climbora Digital and not licensed for reuse or redistribution.
