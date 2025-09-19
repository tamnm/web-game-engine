# Docs Site — Usage

A lightweight static documentation site lives under `docs/site`. It uses Vite for local dev/preview and a tiny Markdown loader (no extra deps).

## Quick Start

- Serve locally: `npm run docs:serve`
- Preview (production server): `npm run docs:preview`
- Open: Vite prints a local URL in the terminal.

## Generate API Reference

- Build Markdown pages from TypeScript exports: `npm run docs:api`
- Output: `docs/site/pages/api/` (includes `index.md` and per‑symbol pages)
- Rerun after API changes to regenerate pages.

## Editing Pages

- Write Markdown under `docs/site/pages/`.
- Add a page to the sidebar by inserting an entry in `docs/site/main.ts: PAGES`.
- Basic Markdown features supported: headings, lists, code fences, inline code, links.

## Styling and Theme

- Global styles: `docs/site/styles.css`
- Adjust color variables at the top of the file to retheme.

## Version Badge

- The header shows a version: by default `__DEV__`.
- Vite env variable `VITE_APP_VERSION` populates it if provided, e.g.:
  - `VITE_APP_VERSION=$(node -p "require('./package.json').version") npm run docs:serve`

## Examples Gallery

- Runnable showcases live in `packages/games/*`.
- Use workspace commands to run:
  - Super Snake: `npm run dev -w @web-game-engine/super-snake`
  - Tetris Advanced: `npm run dev -w @web-game-engine/tetris-advanced`
  - Flappy-like: `npm run dev -w @web-game-engine/flappy-like`

## Deployment

- The site is static. Build with Vite for hosting:
  - `vite build --root docs/site`
- Host the output in `docs/site/dist` on any static host (GitHub Pages, Netlify, etc.).
- If using a subpath, pass `--base /subpath/` to Vite.

## Troubleshooting

- If the sidebar doesn’t show a page, ensure it’s listed in `PAGES` in `docs/site/main.ts`.
- After adding new exported symbols, run `npm run docs:api` to refresh API pages.
