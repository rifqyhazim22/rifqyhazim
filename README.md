# Rifqy Hazim · Portfolio

Source for **https://rifqyhazim.vercel.app**, the personal portfolio of Rifqy Hazim: Ads & E-commerce Specialist · AI Agent Orchestrator, based in Jakarta, Indonesia. The site is bilingual: Indonesian at `/`, English at `/en/`.

## Current roles

- **Tiga Pilar Utama Karya Sentosa** — Ads & E-commerce Specialist · Vice Director (Freelance), Apr 2026 – present
- **The Circle Digital (TCD)** — Ads Operation (Hybrid), Nov 2026 – present

There are no analytics, trackers, ads or third-party scripts.

## Stack
- [Vite](https://vite.dev) static multi-page build, vanilla JavaScript
- [Three.js](https://threejs.org) 3D desk + studio, loaded after first paint (a 2D illustration shows until it's ready)
- [GSAP](https://gsap.com) + ScrollTrigger for animation, [Lenis](https://lenis.darkroom.engineering) for smooth scrolling
- Build-time prerender (`vite-plugin-site.js`, using linkedom), which generates:
  - the full content in static HTML for both languages
  - canonical/hreflang/Open Graph tags and JSON-LD (Person, WebSite, ProfilePage, projects)
  - `sitemap.xml`, `robots.txt`, `site.webmanifest`, `llms.txt` and `404.html`
- Security headers (strict CSP, HSTS, etc.) are defined in `security-headers.js`, which also generates `vercel.json` at build time

## Develop & build
Requires Node.js 20+.

```bash
npm ci
npm run dev          # http://127.0.0.1:5173
npm run build        # → dist/
npm run preview      # http://127.0.0.1:4173 (same security headers as production)
npm run validate:seo # checks the built dist/ (JSON-LD, head tags, sitemap, robots, ...)
```

Optional browser checks (need Playwright browsers: `npx playwright install chromium`, run against `npm run preview`):
- `npm run test:fn`: functional tests
- `npm run test:qa`: layout + accessibility (axe) matrix
- `npm run og`: regenerates the Open Graph images
- `npm run icons`: regenerates the app icons from `public/favicon.svg`

## Configuration
All settings are read at **build time** only and never shipped to the browser. Set them as environment variables (e.g. in Vercel → Project → Settings → Environment Variables). All are optional.

| Variable | Purpose | Default |
|---|---|---|
| `SITE_URL` | Canonical host used by canonical/hreflang/OG/JSON-LD/sitemap/robots/llms.txt | `https://rifqyhazim.vercel.app` |
| `GOOGLE_SITE_VERIFICATION` | Google Search Console verification meta tag | empty (tag not emitted) |
| `BING_SITE_VERIFICATION` | Bing Webmaster Tools (`msvalidate.01`) meta tag | empty |
| `YANDEX_VERIFICATION` | Yandex Webmaster meta tag | empty |
| `INDEXNOW_KEY` | Writes `/<key>.txt` for IndexNow; ping with `npm run indexnow` after a deploy | empty (no key file) |

Moving to a custom domain later means: set `SITE_URL`, rebuild, and redirect the old host permanently (308).

## Content
- Facts, projects, journey and links: `src/content.js`
- UI copy (ID/EN) and page titles/descriptions: `src/i18n.js`
- Public PDFs: `public/cv/` and `public/portofolio/`

© Rifqy Hazim. All rights reserved.
