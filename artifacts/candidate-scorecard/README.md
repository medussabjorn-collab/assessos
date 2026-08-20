# Prelim Candidate Scorecard — standalone artifact

A richer, interactive version of the scorecard mockup embedded in the main site's home hero. Built as a self-contained single-file HTML artifact (React + Tailwind + shadcn/ui), not part of the Next.js site build.

**`bundle.html`** is the finished, shareable artifact — open it directly in any browser, no server required.

## What's in it

- 3 sample candidates (switch via the pills at top) covering all three verdicts: Strong Hire, Consider, No Hire
- Animated radial composite-score gauge
- Overview / Evidence / Integrity tabs
- Light/dark toggle
- Real Prelim brand: logo mark, blue→green gradient (`#1F72B4` → `#5FA234`), Plus Jakarta Sans

Candidate data is illustrative only — labeled as such in the UI.

## Develop

```bash
pnpm install
pnpm dev
```

## Rebuild the bundle

```bash
pnpm exec parcel build index.html --dist-dir dist --no-source-maps
pnpm exec html-inline dist/index.html > bundle.html
```

## Notes on the toolchain

- **Fonts**: `fontsrc/*.ttf` (Plus Jakarta Sans, OFL-licensed, from [tokotype/PlusJakartaSans](https://github.com/tokotype/PlusJakartaSans)) are inlined as `@font-face` data URIs in `src/fonts.css` at build time — not fetched from a CDN, so the bundle has no external font dependency.
- **Favicon**: referenced as `./favicon.svg` (repo root), not `/favicon.svg` (Vite's `public/` convention) — Parcel doesn't auto-serve `public/` at the root URL the way Vite does. `public/favicon.svg` is kept only for the `pnpm dev` (Vite) path.
- **`pnpm.overrides`** in `package.json` pins `@radix-ui/react-use-controllable-state` to `1.2.2` — newer versions use a conditional `"development"` package-export condition Parcel doesn't resolve, which breaks the bundle build.
