# Prelim — marketing site

Enterprise talent-assessment marketing site for **Prelim**. Built with Next.js 14 (App Router, TypeScript) and exported to static HTML.

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
```

## Build (static export)

```bash
npm run build      # outputs static site to ./out
```

Deploy the contents of `out/` to any static host (Namecheap `public_html`, Netlify, Cloudflare Pages, S3, …).

> Going dynamic later (SSR, API routes, real auth) = remove `output: "export"` from `next.config.mjs` and host on a Node platform (Vercel/VPS). No rewrite needed.

## Configuration

Copy `.env.local.example` to `.env.local` and set:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_CONTACT_ENDPOINT` | AssessOS API endpoint that accepts new leads — makes the **contact form** (`/contact`) send. |
| `NEXT_PUBLIC_REGISTRATION_ENDPOINT` | AssessOS API endpoint that accepts new student registrations — makes the **student registration** (`/students`) send. |
| `NEXT_PUBLIC_APP_LOGIN_URL` | URL of the real Prelim assessment app. The **student login** (`/students`) hands off here on submit (auth never happens on this site). |

Values are inlined at build time — re-run `npm run build` after changing them.

## Structure

```
app/
  layout.tsx            # root: fonts (Plus Jakarta Sans + JetBrains Mono), metadata
  globals.css           # design tokens + all component styles
  (site)/               # shared chrome (nav + footer + scroll effects) wraps every page
    page.tsx            # home
    solutions/…         # overview + leadership / technical / non-it hiring
    industries/         # overview + [slug] (18 industry segment pages, SSG)
    platform, products, security, pricing, about, contact, students
components/             # Nav, Footer, Hero, Sections, page kit, forms, icons
lib/industries.tsx     # industry data → drives mega-menu, cards, and [slug] pages
design-system/prelim/  # design system reference (MASTER.md)
```

## Design system

- **Brand:** Prelim — logo ring + green→blue check swoosh, lowercase wordmark.
- **Palette:** blue `#1F72B4` + green `#5FA234`, with a live accent switcher and light/dark mode.
- **Type:** Plus Jakarta Sans (display/body) + JetBrains Mono (data/labels).
