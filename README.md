# Climbora Digital

Marketing website for [Climbora Digital](https://climboradigital.com) — organic content, landing pages & websites, and online stores for small businesses.

**Live site:** https://climboradigital.com

## Stack

Static HTML/CSS/JS. No framework, no build step, no dependencies. Each page is a single self-contained `.html` file — all CSS and JS inline, nothing to compile.

## Structure

```
├── index.html        Home
├── services.html     Services — Organic Content, Landing Pages & Websites, Online Stores
├── about.html         About / founder
├── privacy.html        Privacy policy
├── favicon.svg
├── og-image.svg         Social share card source (export to og-image.png before deploying changes to it)
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
