# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Wortwabe** — a German word puzzle (honeycomb of 7 letters, one mandatory center letter, words
of 4+ letters, pangram bonus). An independent clone of the Spelling Bee / _Buchstabiene_
mechanic, built for personal use and installed as a PWA on a phone.

**One puzzle per week, released Wednesday** — not daily. Earlier puzzles stay playable through a
picker, each with its own saved progress.

The git repository directory is still named `Buchstabiene`; the project itself is `Wortwabe`.

## Status

Done: **M0** (Vite + Svelte 5 setup), **M1** (engine, `src/engine/`), **M2** (dictionary,
`data/dictionary/words.json`, 13,281 words), **M3 generation** — `tools/generate-season.ts`
(logic in `tools/puzzle/season.ts`) wrote `data/puzzles/YYYY-MM-DD.json` for 2026-09-23 through
2027-03-17 (26 puzzles, slim format, no `index.json`; the app bundles them via
`import.meta.glob`). Published puzzle files are never overwritten; a rerun continues after the
newest one.

**M4 done:** the game is playable in `src/app/` — `game.svelte.ts` (state wrapper over the
engine reducer), `puzzles.ts`, `keys.ts`, `feedback.ts`, the layout in `src/App.svelte`, and the
components `Hive`, `Controls`, `InputLine`, `Toast`, `RankBar`, `FoundWords`. The approved visual
design is warm honey with automatic dark mode; tokens live in `src/styles/global.css`. The `?`
and `☰` header buttons open the M5 dialogs.

**M5 done:** per-puzzle `localStorage` progress (`src/storage/progress.ts`), the puzzle picker
(`src/app/picker.ts`, `PuzzlePicker.svelte`), puzzle switching via `?date=` plus Wednesday
rollover in `App.svelte`, the rules dialog, the accepted-word flash and rank-up pulse, focus
handling in sheets and dialogs, and a screen-reader live region.

**M5b done:** "Lösung anzeigen" in the found-words sheet — reveals the missed words, always
reopenable, later words still count; stored as an optional `revealed` flag per puzzle.

**M6 in progress:** GitHub Pages deployment at `https://florianweissdev.github.io/wortwabe/` (repo
`FlorianWeissDev/wortwabe`, branch `main`). GitHub Actions workflow (`.github/workflows/deploy.yml`),
vite.config conditional base path, and English README. Service worker and PWA manifest still to come.

Read `plans/` before starting work — it is the source of truth for every decision below:

| File                       | Content                                               |
| -------------------------- | ----------------------------------------------------- |
| `plans/00-overview.md`     | Scope, MVP boundary, language policy                  |
| `plans/01-tech-stack.md`   | Stack choices and rejected alternatives               |
| `plans/02-architecture.md` | Modules, data flow, directory layout                  |
| `plans/03-game-rules.md`   | **Normative** rule spec — the engine's test contract  |
| `plans/04-wordlist.md`     | Dictionary pipeline, puzzle generation, quality gates |
| `plans/05-roadmap.md`      | Milestones M0–M6 and open questions                   |

When an implementation decision contradicts a plan, update the plan in the same change.

## Language policy (hard rule)

The **UI is German**; **everything else is English** — code, identifiers, comments, docs, commit
messages, test names, JSON keys.

German user-facing strings live **only** in `src/locale/de.ts`. No German string literals
anywhere else in the codebase.

A Vitest guard in `src/locale/locale-guard.test.ts` enforces this, but only as a heuristic: it
flags string literals containing `äöüÄÖÜß` outside `src/locale/`. German text without umlauts
passes it silently, so the guard is a backstop, not a proof.

## Architectural invariant

```
tools/ (offline Node)  →  data/ (generated JSON)  →  src/app/ (browser)
                                 ↑
                        src/engine/ (pure TS)
```

`src/engine/` is pure TypeScript: **no Svelte, no DOM, no I/O**. Both the puzzle generator and
the UI depend on it, which is what guarantees the generator counts exactly the words the game
accepts. Do not let UI concerns leak into it.

Two consequences worth remembering:

- **Derived state is never stored.** Score and rank are recomputed from `foundWords` via the
  engine, both at runtime and when restoring from `localStorage`. A scoring change can therefore
  never desync from saved data.
- **Published puzzle files are immutable.** Changing the dictionary affects newly generated
  puzzles only — saved player progress refers to a puzzle's existing solution set.

## Decisions that are easy to get wrong

- **Umlauts and ß are excluded, not transliterated.** Words containing ä/ö/ü/ß are filtered out
  of the dictionary entirely and can never be solutions; typing `ä` is ignored like any other
  off-board key. Rationale and cost: `plans/03-game-rules.md`.
- **Scoring and rank thresholds are NYT-derived assumptions**, marked `[assumption]` in the rule
  spec. They are configurable on purpose — do not hardcode them into UI components.
- **The release boundary is Wednesday 00:00 `Europe/Berlin`** — a fixed zone, not UTC and not the
  device's local time. `src/engine/schedule.ts` takes "now" as an argument and never reads the
  clock, which is what makes DST and boundary cases testable. Future-dated puzzle files may exist
  in `data/puzzles/`; the engine, not the UI, is what keeps them unselectable.
- **Never use ZEIT's word list, wording, or assets.** This is an independent implementation of a
  public game mechanic.

## Testing policy

Tests catch real defects; they are not a coverage exercise. **Test things that compute
something** — scoring and rank boundaries, word validation and every rejection reason, the
Wednesday schedule math, reducer transitions, shuffle/sort/normalization, and the `tools/` filter
predicates and quality gates against small fixtures.

**Do not write tests that assert a mock was called**, that a component rendered, or whose
assertion merely restates the implementation. Persistence gets one round-trip test against an
in-memory storage stub, not call verification.

## Commands

```bash
npm run dev          # Vite dev server
npm run build        # production build → dist/
npm run preview      # serve the production build
npm test             # vitest run
npm run test:watch   # vitest watch mode
npm test -- src/engine/score.test.ts        # a single test file
npm test -- -t "pangram bonus"              # tests matching a name
npm run typecheck    # svelte-check (types in .ts and .svelte)
npm run format       # prettier --write
npm run generate:season -- --weeks 26 --seed N   # append new puzzles to data/puzzles/
```

`tools/` pipeline scripts are run directly with `tsx`, e.g. `npx tsx tools/generate-season.ts`.
