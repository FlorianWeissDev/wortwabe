# Tech Stack

## Context that drives these choices

This is a **personal project**, self-hosted for a handful of users at most, and the primary
device is a **phone via PWA install**. That rules out anything justified by scale, and it makes
bundle size, offline behaviour and low maintenance burden the things worth optimizing for.

## Stack at a glance

| Concern           | Choice                                                                                                                                 | Why                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Language          | TypeScript (strict)                                                                                                                    | The rule engine benefits from exhaustive union types                              |
| Build             | **Vite 8**                                                                                                                             | Fast dev server, static output, first-class Svelte support                        |
| UI                | **Svelte 5** (runes)                                                                                                                   | Compiler, not runtime: ~3 kB. Scoped CSS, transitions and `animate:flip` built in |
| Styling           | Plain CSS in component `<style>` blocks + a few CSS custom properties                                                                  | Svelte scopes it automatically; no Tailwind needed at this size                   |
| State             | Engine reducer + `$state` runes                                                                                                        | Game state is one object driven by one reducer                                    |
| Offline / install | Hand-written `manifest.webmanifest` + ~30-line `sw.js`, no plugin                                                                      | Installable and offline-capable; a single static page needs nothing heavier       |
| Persistence       | `localStorage`, versioned schema                                                                                                       | Per-puzzle progress, no backend                                                   |
| Offline tooling   | Node scripts in `tools/`, run via `tsx`                                                                                                | Dictionary and puzzle generation are build-time jobs                              |
| Unit tests        | **Vitest**                                                                                                                             | Same transform pipeline as Vite, zero extra config                                |
| Lint/format       | Prettier + `prettier-plugin-svelte`; no ESLint — `svelte-check` + strict TS cover correctness, a Vitest guard enforces the locale rule | Smaller, focused toolchain                                                        |
| Hosting           | Any static host or a personal server                                                                                                   | Output is `index.html` + bundled assets (puzzles included)                        |

**No backend, no database, no accounts.** The whole game is static files plus `localStorage`.

## Why Svelte 5 over the alternatives

- **vs. React** — React + ReactDOM is ~45 kB gzip of runtime for what amounts to seven buttons,
  a text line and a list. Nothing here needs it.
- **vs. Solid** — technically very close (both are fine-grained reactive, no virtual DOM; Svelte
  5 runes are signals). Solid's advantage is plain TS + JSX with no custom file format. Svelte
  wins here on batteries: scoped CSS and `animate:flip` cover the hive's shuffle animation
  directly, which would otherwise be a hand-written FLIP implementation.
- **vs. vanilla TS** — genuinely viable at this size, but manual DOM updates and focus
  management across ~7 components is more code and more bugs than a 3 kB compiler costs.

Because the engine never imports any UI library (see `02-architecture.md`), this decision is
reversible at the cost of rewriting the components only.

## Rejected alternatives

- **SvelteKit** — a router and a server runtime for a single-screen app. Plain Svelte + Vite.
- **Tailwind** — at this component count, scoped `<style>` blocks are less indirection.
- **Canvas-rendered hive** — the honeycomb is seven buttons. DOM/SVG keeps focus management,
  screen-reader labels and hit targets for free.
- **A database of puzzles** — a directory of dated JSON files is simpler, diffable, reviewable
  and cacheable by a service worker forever.
- **Runtime dictionary lookup via API** — requires a backend and breaks offline play. The
  solution set for one puzzle is a few kilobytes; ship it with the puzzle.
- **`vite-plugin-pwa`** — Workbox is heavy for a single static page. A hand-written manifest and
  a ~30-line service worker cover the need.
- **Runtime puzzle fetching** — bundling the puzzle files with the app (`import.meta.glob`) is
  simpler: no loading or network-error states, and offline play comes for free.
- **ESLint** — 6 packages (`eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-svelte`,
  `svelte-eslint-parser`, `globals`) and significant toolchain complexity for one project-specific
  rule; a Vitest test is simpler and serves the same purpose.

## Notable dependency choices

- **No UI component library.** The interface is a hive, a text line, three buttons, a list and a
  progress bar.
- **`tsx`** for running TypeScript tooling scripts directly, so the pipeline shares types with
  the app.
