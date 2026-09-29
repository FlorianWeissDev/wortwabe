# Dictionary & Puzzle Generation

The word list decides whether the game is delightful or infuriating. Two failure modes to avoid:

- **Too permissive** — the solution set is full of words nobody knows, so reaching the top rank
  feels arbitrary and unfair.
- **Too strict** — the player types an obviously real German word and gets „Kein Wort in der
  Liste". This is the more damaging failure; it makes the game feel broken.

## Source

The word source is the **CC0** npm package `open-crossword-bank` (German enriched subset, ~18k
entries carrying part-of-speech tags). CC0 means the generated dictionary and puzzle files ship
without conditions. Origin, licensing and known limitations are recorded in
`data/dictionary/SOURCES.md`.

hunspell `de_DE` was considered and rejected for now: better inflection coverage, but GPL and it
needs unmunching. ZEIT's own list is **never** used — not scraped, not referenced.

## Pipeline (`tools/build-dictionary.ts` + `tools/dictionary/filters.ts`)

```
open-crossword-bank (German enriched subset)
  → keep POS: noun, verb, adjective, adverb
  → keep length ≥ 4
  → keep a–z only   (drops every word with ä, ö, ü, ß — see 03-game-rules.md)
  → drop ß-origin keys (source uppercases ß to SS): clue-text evidence + eszett-stems.txt
  → display form: nouns capitalized, everything else lowercase
  → apply allowlist.txt / blocklist.txt
  → emit data/dictionary/words.json  { key: displayForm }   (13,347 words)
```

Two hand-maintained files sit at the end of the pipeline and are the main quality lever over
time:

- `data/dictionary/allowlist.txt` — words players legitimately tried that the source lacks,
  including function words (see Coverage).
- `data/dictionary/eszett-stems.txt` — hand-curated substrings (in ss form) that always come from
  ß. Applied to source entries only, never to the allowlist. Each stem must not match a genuine
  `ss` word (_aussenden_, _kreissparkasse_).
- `data/dictionary/blocklist.txt` — proper nouns that leak through, slurs, unpleasant surprises,
  and technically-valid-but-absurd entries. Reviewed by a human, never generated.

### Coverage

A **coverage probe** (`tools/dictionary/coverage.test.ts`) guards against the most damaging
failure, a real word being rejected. It checks ~200 common German words in common inflections
against the built dictionary, with a target hit rate of **≥ 95 %**.

Function words — prepositions, conjunctions, pronouns, articles, numerals (e.g. _seit_, _oder_,
_eine_, _zehn_, _dies_) — are dropped by the POS filter, so they are added via `allowlist.txt`.

If coverage stays poor, reconsider the source later.

### Size impact of the umlaut exclusion

Dropping every word with ä/ö/ü/ß is a large cut — plurals (_Bäume_), comparatives (_größer_) and
many common stems disappear. The surviving 13,347 words still satisfy the quality gates below.

## Puzzle generation (`tools/puzzle/generate.ts`)

1. **Candidate pangrams:** every dictionary word with **exactly 7 distinct letters**. This
   guarantees each puzzle has at least one pangram.
2. **Letter set:** the 7 distinct letters of a randomly chosen candidate.
3. **Center letter:** try each of the 7; keep those producing an acceptable puzzle.
4. **Solve:** all dictionary words using only those letters, containing the center, length ≥ 4.
5. **Score:** compute `maxScore` and pangram list.
6. **Accept/reject** against quality gates.

### Quality gates

| Gate                    | Target                               | Reason                                                               |
| ----------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| Solution count          | 30–90                                | A puzzle has to carry a whole week, so aim higher than a daily would |
| Pangram count           | 1–4                                  | At least one, but not a giveaway                                     |
| `maxScore`              | 80–350                               | Keeps rank thresholds meaningful                                     |
| Share of 4-letter words | ≤ 60 %                               | Otherwise the puzzle is padding                                      |
| Letter set              | no repeat within the last 52 puzzles | Avoids déjà-vu (a year at one per week)                              |
| Center letter           | not `q`/`y`/`x`                      | Too restrictive in German                                            |

Measured: **1,163 letter sets** pass the gates — about 22 years of weekly puzzles.

Generation is deterministic given a seed, so a puzzle set is reproducible from the seed + the
dictionary version.

### Difficulty signal (post-MVP)

Rate a puzzle by pangram obscurity and word familiarity, then spread difficulty evenly across
consecutive weeks instead of letting the seed cluster three hard ones in a row. Nice to have, not
v1.

## Regeneration policy

The dictionary is versioned. Changing it does **not** retroactively change already-published
puzzles — a puzzle file is immutable once shipped, because a player's saved progress refers to
its solution set. New dictionary versions affect newly generated puzzles only.
