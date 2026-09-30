# Wortwabe

A German weekly word puzzle — an independent implementation of the honeycomb word-game mechanic. This is not affiliated with ZEIT or the New York Times.

**Play it:** [florianweissdev.github.io/wortwabe](https://florianweissdev.github.io/wortwabe/)

## Features

- **One puzzle per week**, released every Wednesday at 00:00 Europe/Berlin
- **Older puzzles playable** through the puzzle picker — progress is kept separate for each week
- **Offline-first** — works as a PWA without a network connection
- **Progress saved locally** in the browser — no account needed

## Development

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
npm run build:dictionary                    # rebuild the word list
```

## Puzzle Upkeep

Committed puzzle files run through 2027-03-17. To generate additional puzzles:

```bash
npm run generate:season -- --weeks 26 --seed N
```

Published puzzle files are immutable — changing the dictionary affects newly generated puzzles only. Player progress refers to a puzzle's existing solution set.

## Deployment

Pushes to `main` automatically deploy via GitHub Actions. The Pages source is set to "GitHub Actions".

## Project Layout

- `src/engine/` — Pure TypeScript game logic (scoring, validation, rank calculation, schedule)
- `src/app/` — Svelte components and game state wrapper
- `src/locale/` — German UI strings (the only German in the codebase)
- `data/dictionary/` — Word list (CC0 via `open-crossword-bank`)
- `data/puzzles/` — Weekly puzzle definitions
- `tools/` — Offline Node pipeline (dictionary building, puzzle generation)
- `plans/` — Architecture and design decisions

For detailed design rationale, see the files in `plans/`.

## Data License

The dictionary (`data/dictionary/words.json`) is derived from the CC0 `open-crossword-bank`. See `data/dictionary/SOURCES.md` for full attribution.

## License

License: not yet chosen.
