# Wortwabe — Project Overview

> **Language policy:** the product UI is **German**. Everything else — code, identifiers,
 > comments, docs, commit messages, test names, JSON keys — is **English**. German user-facing
> text lives exclusively in the locale module (see `02-architecture.md`).

## What we are building

A clone of ZEIT ONLINE's *Buchstabiene* (itself a German take on the NYT Spelling Bee):
a word puzzle played on a honeycomb of seven letters, with a **new puzzle every Wednesday**.

**Core loop:** the player sees 7 letters arranged as a hexagon, one of them highlighted in the
center. They form words of 4+ letters that must contain the center letter; letters may be reused
freely. Every valid word scores points, a *pangram* (uses all 7 letters) scores a bonus, and the
accumulated score moves the player up a ladder of ranks until the top rank is reached.

## Product goals

1. **Faithful to the original feel** — same rule set, same satisfying input interaction. The
   rhythm is deliberately slower than the original's: **one puzzle per week, released Wednesday**,
   so a puzzle is something to return to over days rather than finish and forget.
   Past puzzles stay playable through a picker.
2. **Offline-capable and cheap to run** — no backend, ever. The game is fully client-side and
   puzzles are precomputed static assets, so it installs as a PWA and plays on a phone with no
   network.
3. **German-first** — a puzzle is only as good as its word list. The dictionary quality is the
   single biggest determinant of how fun this is, so it gets first-class treatment
   (see `04-wordlist.md`).

## Non-goals (explicitly out of scope for v1)

- User accounts, cloud sync, social leaderboards.
- Multiplayer or head-to-head modes.
- Native mobile apps — the PWA install is the mobile story.
- Monetization of any kind. This is a personal project for private use.
- Reusing ZEIT's assets, wording, styling or word list. This is an independent implementation
  of a well-known game mechanic under our own name and design.

## Scope of the MVP

| Included | Deferred |
| --- | --- |
| Weekly puzzle, released Wednesday | Hints / "reveal a word" |
| Picker for previously released puzzles | Share card / result image |
| Word validation, scoring, rank ladder | Statistics across weeks (streaks) |
| Found-words list, shuffle, delete, submit | Sound effects |
| Keyboard + touch input | |
| Progress persisted per puzzle in the browser | |
| Rules screen in German | |
| **PWA: installable, plays offline** | |

## Success criteria for v1

- A puzzle can be generated fully offline and shipped as a static JSON file.
- The rule engine is a pure, dependency-free TypeScript module with unit tests covering every
  rule in `03-game-rules.md`.
- The game is playable end-to-end on mobile and desktop with keyboard and touch.
- Reloading the page mid-game restores the exact session state, per puzzle.
- The current week's puzzle rolls over automatically on Wednesday, and earlier puzzles remain
  selectable with their own saved progress.
- The app installs to a phone home screen and the current puzzle plays in airplane mode.

## Plan documents

| File | Content |
| --- | --- |
| `00-overview.md` | This document — vision, scope, naming |
| `01-tech-stack.md` | Technology choices and the reasoning behind them |
| `02-architecture.md` | Modules, data flow, directory layout |
| `03-game-rules.md` | The normative rule specification |
| `04-wordlist.md` | Dictionary sourcing, filtering, puzzle generation |
| `05-roadmap.md` | Implementation order and milestones |
