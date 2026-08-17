# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Wortwabe** — a German word puzzle (honeycomb of 7 letters, one mandatory center letter, words
of 4+ letters, pangram bonus). An independent clone of the Spelling Bee / *Buchstabiene*
mechanic, built for personal use and installed as a PWA on a phone.

**One puzzle per week, released Wednesday** — not daily. Earlier puzzles stay playable through a
picker, each with its own saved progress.

The git repository directory is still named `Buchstabiene`; the project itself is `Wortwabe`.

## Status: pre-implementation

`src/index.ts` is a `console.log` placeholder from the original `tsc` scaffold. **The only real
content in this repo is `plans/`.** Milestone M0 replaces the scaffold with the Vite + Svelte
setup described there.

Read `plans/` before starting work — it is the source of truth for every decision below:

| File | Content |
| --- | --- |
| `plans/00-overview.md` | Scope, MVP boundary, language policy |
| `plans/01-tech-stack.md` | Stack choices and rejected alternatives |
| `plans/02-architecture.md` | Modules, data flow, directory layout |
| `plans/03-game-rules.md` | **Normative** rule spec — the engine's test contract |
| `plans/04-wordlist.md` | Dictionary pipeline, puzzle generation, quality gates |
| `plans/05-roadmap.md` | Milestones M0–M6 and open questions |

When an implementation decision contradicts a plan, update the plan in the same change.

## Language policy (hard rule)

The **UI is German**; **everything else is English** — code, identifiers, comments, docs, commit
messages, test names, JSON keys.

German user-facing strings live **only** in `src/locale/de.ts`. No German string literals
anywhere else in the codebase. This is deliberately mechanical so it can be checked by a lint
rule.

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
  off-board key. The `umlautMode: "exclude" | "expand"` flag exists, but only `exclude` is
  implemented and tested. Rationale and cost: `plans/03-game-rules.md`.
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

The scaffold currently only has:

```bash
npm run build     # tsc → dist/ (placeholder; M0 replaces this with vite build)
```

After M0 the intended scripts are `dev`, `build`, `preview`, `test`, `lint`, `typecheck`, plus
`tools/` pipeline scripts run via `tsx`. Update this section when they actually exist.
