# Roadmap

Ordered so that every milestone ends with something runnable, and so the riskiest unknown (the
word list) is confronted early rather than after the UI is built.

## M0 — Project setup

- Replace the `tsc` scaffold with Vite + Svelte 5 + TypeScript, ESM, strict mode.
- Rename the package to `wortwabe`; add Vitest, ESLint, Prettier (+ `prettier-plugin-svelte`).
- Directory skeleton per `02-architecture.md`; `.gitignore` for `dist/` and `node_modules/`.
- **Done when:** `npm run dev`, `npm run test`, `npm run build` all work on an empty app shell.

## M1 — Engine (no UI)

- `types`, `normalize`, `validate`, `score`, `rank`, `schedule`, `reducer`.
- Tests per the testing approach in `02-architecture.md` — real logic only, no mock assertions.
  Covers every rejection reason (including umlaut input), rank boundaries, and the Wednesday
  rollover with DST cases.
- **Done when:** a hand-written fixture puzzle can be played to the top rank in a test.

## M2 — Dictionary pipeline

- `tools/build-dictionary.ts` end to end, `SOURCES.md` with attribution.
- Frequency cutoff tuned by inspecting output samples; record the surviving word count after the
  umlaut exclusion.
- **Done when:** `data/dictionary/words.json` exists and a spot check of 50 random entries turns
  up no proper nouns and no unrecognizable words.

## M3 — Puzzle generation

- `tools/generate-puzzle.ts` with the quality gates, plus `generate-season.ts` and `index.json`.
- Generate ~26 Wednesdays (half a year) and read through them manually — this is the real test
  of M2.
- **Done when:** the committed puzzle files all pass the gates and look fun.

## M4 — Playable UI

- `Hive`, `InputLine`, `Controls`, `FoundWords`, `RankBar`, `Toast`, wired to the reducer.
- Keyboard and touch input, German locale module.
- **Done when:** the current week's puzzle is playable start to finish in a browser.

## M5 — Puzzle picker, persistence & polish

- `localStorage` progress per puzzle, restore on reload, Wednesday rollover handling.
- `PuzzlePicker` over `index.json` with per-puzzle rank; deep link to a picked date.
- Rules dialog, responsive layout, focus management and screen-reader labels, the three
  animations from the animation budget.
- **Done when:** progress survives reload, switching between weeks keeps each puzzle's progress
  separate, and the game is usable one-handed on a phone.

## M6 — PWA & ship

- `vite-plugin-pwa`: manifest, icons, service worker precaching the shell, `index.json` and all
  released puzzle files.
- Verify install-to-home-screen and offline play on an actual phone, not just DevTools.
- Static hosting; README in English.
- **Done when:** the app is installed on the phone and today's puzzle plays in airplane mode.

## Post-MVP backlog

Share card · streak statistics · hint system · difficulty balancing across weeks ·
Playwright E2E · sound.

## Open questions

1. **Scoring and rank thresholds** — currently NYT-derived assumptions; worth comparing against
   the original before the numbers feel canonical.
2. **Frequency source licensing** — settle before committing derived data (M2).
3. **Puzzle supply** — how far ahead to generate, and how the "you have caught up" state reads
   in German when the app runs past the newest generated Wednesday. Decide during M3.
