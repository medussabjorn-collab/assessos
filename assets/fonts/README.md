# Fonts (build-time assets, not shipped to the browser)

`PlusJakartaSans-Bold.ttf` and `PlusJakartaSans-ExtraBold.ttf`, sourced from the
[tokotype/PlusJakartaSans](https://github.com/tokotype/PlusJakartaSans) repo
under the [SIL Open Font License](https://openfontlicense.org/) (free for any
use, no attribution required).

Used only to render `public/og-image.png` (see the repo root for the source
HTML used to generate it — regenerate via headless Chrome if the OG copy
changes: `chrome --headless --window-size=1200,630 --screenshot=... file.html`).

The site itself loads Plus Jakarta Sans normally via `next/font/google` in
`app/layout.tsx` — these static files aren't used at runtime.
