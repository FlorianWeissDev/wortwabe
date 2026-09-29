# Architecture

## Layering rule

```
tools/  (offline, Node)        →  data/  (generated artifacts)  →  app/  (browser)
                                        ↑
                              engine/  (pure TS, used by both)
```

The **engine** is pure TypeScript: no Svelte, no DOM, no I/O. Both the puzzle generator and the
UI depend on it, which guarantees that the words the generator counts as valid are exactly the
words the game accepts. This is the single most important structural constraint in the project.

## Components

### 1. Engine (`src/engine/`) — pure logic, fully unit-tested

| Module         | Responsibility                                                                     |
| -------------- | ---------------------------------------------------------------------------------- |
| `types.ts`     | `Puzzle`, `GameState`, `SubmitResult`, `Rank` — the shared vocabulary              |
| `normalize.ts` | Lowercasing, stripping non-letters, rejecting umlauts/ß (see `03-game-rules.md`)   |
| `validate.ts`  | Turns an input string into a `SubmitResult`: accepted, or a typed rejection reason |
| `score.ts`     | Points per word, pangram bonus, total, max score                                   |
| `rank.ts`      | Score → rank, plus points needed for the next rank                                 |
| `schedule.ts`  | Wednesday-release date math: current puzzle date, released-vs-future, listing      |
| `reducer.ts`   | `(state, action) => state` for `TYPE`, `DELETE`, `CLEAR`, `SHUFFLE`, `SUBMIT`      |

`schedule.ts` is pure date arithmetic over `Europe/Berlin` and takes "now" as an argument — it
never reads the clock itself. That is what makes the rollover testable (see `03-game-rules.md`).

Rejections are a discriminated union (`TOO_SHORT`, `MISSING_CENTER`, `INVALID_LETTER`,
`NOT_A_WORD`, `ALREADY_FOUND`) so the UI can map each to a German message without string
matching.

### 2. Puzzle data (`data/puzzles/YYYY-MM-DD.json`)

One file per **release Wednesday**, generated ahead of time and committed. Shape:

```jsonc
{
  "schemaVersion": 1,
  "date": "2026-08-19", // always a Wednesday
  "centerLetter": "r",
  "outerLetters": ["a", "e", "i", "k", "n", "t"],
  "words": ["Kanten", "kerne", "..."], // display forms: nouns capitalized, ASCII only
}
```

`words` holds display forms; the normalized key is `word.toLowerCase()`. Pangrams, `maxScore` and
the key → display-form map are **derived** by the engine's `indexPuzzle()` and never stored —
"derived state is never stored" applies to puzzle files too.

The solution set ships with the puzzle. It is trivially readable by a curious player — that is
true of the original too, and not worth building a backend to prevent.

Puzzles are **bundled, not fetched**: the app loads them with
`import.meta.glob('/data/puzzles/*.json', { eager: true })`, and the file names are the dates.
There is no `index.json`, no runtime fetch and no loading or network-error states. Future-dated
files are in the bundle too; `schedule.ts` is what keeps them unselectable. Adding puzzles means
a rebuild and deploy.

### 3. Offline tooling (`tools/`)

| Script                | Responsibility                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------- |
| `build-dictionary.ts` | Raw source → filtered, normalized word list + display forms (see `04-wordlist.md`)        |
| `puzzle/generate.ts`  | Pure library: pick a letter set, compute solutions, score it, reject bad puzzles          |
| `generate-season.ts`  | Batch-generate the next N release Wednesdays, writing only `data/puzzles/YYYY-MM-DD.json` |

These run manually or in CI, never in the browser.

### 4. UI (`src/app/`) — Svelte 5 components

| Component             | Notes                                                                                                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Hive.svelte`         | Seven hexagons (CSS `clip-path`), center letter visually distinct, click + keyboard. Shuffle uses `animate:flip`                                               |
| `InputLine.svelte`    | The word being typed, with a caret; center letter highlighted inside the word                                                                                  |
| `Controls.svelte`     | Löschen / Mischen / Eingeben                                                                                                                                   |
| `FoundWords.svelte`   | Collapsible on mobile, alphabetically sorted, pangrams marked                                                                                                  |
| `RankBar.svelte`      | Progress ladder with the current German rank label                                                                                                             |
| `Toast.svelte`        | Transient feedback, driven by the last `SubmitResult`                                                                                                          |
| `RulesDialog.svelte`  | German rules explanation, opened from the header                                                                                                               |
| `PuzzlePicker.svelte` | Renders from the bundled puzzles: lists released puzzles newest first, marks the current week and shows per-puzzle rank; future dates are absent, not disabled |

State lives in a single `$state` object holding the engine's `GameState`; components receive it
as props and dispatch actions upward. Derived values (score, rank, progress) are `$derived` calls
into the engine — never stored.

Animation budget: word-accepted flash, shuffle transition, rank-up pulse. Nothing else.

### 4a. PWA shell

Hand-written, no `vite-plugin-pwa`/Workbox:

- `public/manifest.webmanifest` — name, icons, `display: standalone`, portrait.
- `public/sw.js` (~30 lines) — **network-first for navigations** (so a new deploy is picked up),
  **cache-first for everything else** (hashed assets and the icons), under a versioned cache name
  that is bumped to evict old caches.
- ~3 lines in `src/main.ts` registering the worker.

Puzzles are part of the JS bundle, so no separate precache of puzzle files is needed.

### 5. Persistence (`src/storage/`)

`localStorage` key `wortwabe:progress:<date>`, value `{ schemaVersion, foundWords[] }`. Score and
rank are always recomputed from `foundWords` via the engine, never stored — so a scoring change
can never desync from saved data. Unknown or older `schemaVersion` is discarded, not migrated,
in v1.

Each puzzle has its own independent entry, so switching to an older puzzle and back never
disturbs the current week's progress. The picker reads all entries to show a rank per puzzle.

### 6. Localization (`src/locale/de.ts`)

A single flat object of German strings, including rank names and rejection messages. Components
import from here; no German string literals anywhere else in the codebase. This keeps the
"artifacts in English, UI in German" rule mechanically enforceable (a Vitest guard in
`src/locale/locale-guard.test.ts` checks for non-ASCII string literals outside `locale/`).

## Testing approach

Tests exist to catch real defects, not to produce coverage. **Test logic that computes
something**; do not write tests that assert a mock was called.

Worth testing — this is essentially the whole engine:

- **Scoring and rank math** — points per length, pangram bonus, `maxScore`, threshold boundaries
  (exactly at a rank cutoff, 0 points, full score).
- **Word validation** — every rejection reason, including umlaut input and off-board letters.
- **Schedule math** — the Wednesday boundary, a Tuesday-vs-Wednesday "now", DST transitions,
  future dates rejected, fallback past the newest puzzle. Pure functions taking "now" as an
  argument, so all of this is a table test.
- **Reducer transitions** — typing, deleting, submitting a duplicate, state after an accepted
  word.
- **Array/string manipulation** — shuffle preserves the letter multiset and keeps the center
  letter in place; found-words sorting; normalization.
- **Pipeline filters** in `tools/` — the dictionary filter predicates and the puzzle quality
  gates, run against small hand-written fixtures.

Not worth testing: that a component renders, that a Svelte prop arrives, that `localStorage.setItem`
was invoked, or anything whose assertion is a restatement of the implementation. Persistence is
covered by one round-trip test against a real in-memory storage stub — save, reload, same state —
rather than by verifying calls.

## Directory layout

```
wortwabe/
├── plans/                  # these documents
├── data/
│   ├── dictionary/         # generated word list (committed)
│   └── puzzles/            # YYYY-MM-DD.json (committed)
├── tools/                  # offline Node scripts
├── src/
│   ├── engine/             # pure game logic + tests
│   ├── app/                # Svelte components
│   ├── storage/
│   ├── locale/
│   ├── App.svelte
│   └── main.ts
├── public/                 # manifest.webmanifest, sw.js, icons
└── index.html
```

## Data flow at runtime

1. App boots with every puzzle already bundled (`import.meta.glob`, no fetch).
2. `schedule.ts` picks the date from the bundled list: the current puzzle from "now" in
   Europe/Berlin, or an explicit `?date=YYYY-MM-DD` query parameter resolved by
   `resolvePuzzleDate` (no router), rejected if not yet released.
3. Loads saved `foundWords` for that date from `localStorage`.
4. Engine replays them and derives score and rank (and, via `indexPuzzle()`, pangrams and
   `maxScore`) — no stored derived state.
5. User input dispatches actions to the reducer; every accepted word triggers a persist.
6. No network traffic after load.
