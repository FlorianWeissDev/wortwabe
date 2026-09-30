# Roadmap

Ordered so that every milestone ends with something runnable, and so the riskiest unknown (the
word list) is confronted early rather than after the UI is built.

## M0 — Project setup

**Status: done.**

- Replace the `tsc` scaffold with Vite + Svelte 5 + TypeScript, ESM, strict mode.
- Rename the package to `wortwabe`; add Vitest, Prettier (+ `prettier-plugin-svelte`), and a Vitest guard for the locale rule.
- Directory skeleton per `02-architecture.md`; `.gitignore` for `dist/` and `node_modules/`.
- **Done when:** `npm run dev`, `npm run test`, `npm run build` all work on an empty app shell.

## M1 — Engine (no UI)

**Status: done.**

- `types`, `normalize`, `validate`, `score`, `rank`, `schedule`, `reducer`.
- Tests per the testing approach in `02-architecture.md` — real logic only, no mock assertions.
  Covers every rejection reason (including umlaut input), rank boundaries, and the Wednesday
  rollover with DST cases.
- **Done when:** a hand-written fixture puzzle can be played to the top rank in a test.

## M2 — Dictionary pipeline

**Status: done.**

- `tools/build-dictionary.ts` end to end, `SOURCES.md` with attribution.
- Source: CC0 `open-crossword-bank`, filtered by POS, length and a–z; 13,281 words survive.
- **Done when:** `data/dictionary/words.json` exists and a spot check of 50 random entries turns
  up no proper nouns and no unrecognizable words.

## M3 — Puzzle generation

- `tools/puzzle/generate.ts` with the quality gates, plus `generate-season.ts` (logic in `tools/puzzle/season.ts`) writing `data/puzzles/YYYY-MM-DD.json` in the slim format (no `index.json`). Done: `npm run generate:season` produced 26 puzzles, 2026-09-23 through 2027-03-17. Boards also may not share more than 5 letters with any of the previous 8 puzzles. Existing files are never overwritten; a rerun continues after the newest one.
- Coverage probe test (`tools/dictionary/coverage.test.ts`, ≥ 95 % of ~200 common words); function words go into `allowlist.txt`.
- Generate ~26 Wednesdays (half a year) and read through them manually — this is the real test
  of M2.
- **Done when:** the committed puzzle files all pass the gates and look fun.

## M4 — Playable UI

**Status: done.** Built mockup-first (approved static HTML), then a foundation with typed stub
components, then the components in parallel.

- `Hive`, `InputLine`, `Controls`, `FoundWords`, `RankBar`, `Toast`, wired to the reducer.
- Keyboard and touch input, German locale module.
- **Done when:** the current week's puzzle is playable start to finish in a browser.

## M5 — Puzzle picker, persistence & polish

**Status: done.**

- `localStorage` progress per puzzle, restore on reload, Wednesday rollover handling.
- `PuzzlePicker` over the bundled puzzles with per-puzzle rank; deep link is a `?date=YYYY-MM-DD` query parameter.
- Rules dialog, responsive layout, focus management and screen-reader labels, the three
  animations from the animation budget.
- **Done when:** progress survives reload, switching between weeks keeps each puzzle's progress
  separate, and the game is usable one-handed on a phone.

## M5b — Reveal the solution

**Status: done.**

- "Lösung anzeigen" at the bottom of the found-words sheet, with an inline confirm step; the
  revealed sheet greys the missed words, and "Weiterraten" hides them again.
- The `revealed` flag is stored per puzzle (`src/storage/progress.ts`); the picker tags revealed
  rows "aufgelöst".
- **Done when:** a reveal survives reload, can always be undone, and later words still score.

## M6 — PWA & ship

- Hand-written `public/manifest.webmanifest`, icons and `public/sw.js` (network-first for
  navigations, cache-first for the rest), registered from `src/main.ts`. No precache of puzzle
  files needed — they are bundled.
- Verify install-to-home-screen and offline play on an actual phone, not just DevTools.
- Static hosting; README in English.
- **Done when:** the app is installed on the phone and today's puzzle plays in airplane mode.

## Post-MVP backlog

Share card · streak statistics · hint system · difficulty balancing across weeks ·
Playwright E2E · sound · log `NOT_A_WORD` attempts locally plus a „copy rejected words" action
to feed the allowlist.

## Open questions

1. **Scoring and rank thresholds** — currently NYT-derived assumptions; worth comparing against
   the original before the numbers feel canonical.
2. ~~**Frequency source licensing**~~ — resolved: CC0 via `open-crossword-bank`.
3. **Puzzle supply** — how far ahead to generate, and how the "you have caught up" state reads
   in German when the app runs past the newest generated Wednesday. Decide during M3.
