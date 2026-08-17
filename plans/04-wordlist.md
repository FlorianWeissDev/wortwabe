# Dictionary & Puzzle Generation

The word list decides whether the game is delightful or infuriating. Two failure modes to avoid:

- **Too permissive** — the solution set is full of words nobody knows, so reaching the top rank
  feels arbitrary and unfair.
- **Too strict** — the player types an obviously real German word and gets „Kein Wort in der
  Liste". This is the more damaging failure; it makes the game feel broken.

## Source candidates

| Source | License | Assessment |
| --- | --- | --- |
| **igerman98 / hunspell `de_DE`** | GPL/LGPL/MPL tri-license | **Primary.** Broad coverage, actively maintained, ships as base words + affix rules that must be *unmunched* into full forms |
| **DWDS / Leipzig Corpora frequency lists** | CC BY-SA / CC BY-NC (varies per set) | **Frequency signal only** — used to rank and cut, not as the word source. License per dataset must be checked before committing derived data |
| **German Wiktionary dump** | CC BY-SA 3.0 | Fallback for display forms and part-of-speech tags; heavy to process |
| ZEIT's own list | — | **Never.** Not scraped, not referenced |

Licenses of whatever we ship get recorded in `data/dictionary/SOURCES.md` with attribution.

## Pipeline (`tools/build-dictionary.ts`)

```
raw source
  → unmunch affixes into surface forms
  → drop: proper nouns, abbreviations, hyphenated, apostrophes, non-letter chars
  → drop: any word containing ä, ö, ü or ß   (see 03-game-rules.md)
  → drop: length < 4
  → normalize (lowercase) → key
  → keep the most common display form per key (Käse, not käse/KÄSE)
  → join with frequency list; drop below cutoff
  → apply manual allowlist / blocklist
  → emit data/dictionary/words.json  { key: displayForm }
```

Two hand-maintained files sit at the end of the pipeline and are the main quality lever over
time:

- `data/dictionary/allowlist.txt` — words players legitimately tried that the source lacks.
- `data/dictionary/blocklist.txt` — slurs, unpleasant surprises, and technically-valid-but-absurd
  entries. Reviewed by a human, never generated.

**Frequency cutoff** is a tunable knob, not a fixed number. Start permissive, then tighten by
inspecting generated puzzles: if a puzzle's solution list contains words we cannot recognize,
the cutoff is too low.

### Size impact of the umlaut exclusion

Dropping every word with ä/ö/ü/ß is a large cut — plurals (*Bäume*), comparatives (*größer*) and
many common stems disappear. Measure the surviving word count at the end of M2: if it is too
small to satisfy the puzzle quality gates below, the lever to pull first is the frequency cutoff,
not the umlaut rule.

## Puzzle generation (`tools/generate-puzzle.ts`)

1. **Candidate pangrams:** every dictionary word with **exactly 7 distinct letters**. This
   guarantees each puzzle has at least one pangram.
2. **Letter set:** the 7 distinct letters of a randomly chosen candidate.
3. **Center letter:** try each of the 7; keep those producing an acceptable puzzle.
4. **Solve:** all dictionary words using only those letters, containing the center, length ≥ 4.
5. **Score:** compute `maxScore` and pangram list.
6. **Accept/reject** against quality gates.

### Quality gates

| Gate | Target | Reason |
| --- | --- | --- |
| Solution count | 30–90 | A puzzle has to carry a whole week, so aim higher than a daily would |
| Pangram count | 1–4 | At least one, but not a giveaway |
| `maxScore` | 80–350 | Keeps rank thresholds meaningful |
| Share of 4-letter words | ≤ 60 % | Otherwise the puzzle is padding |
| Letter set | no repeat within the last 52 puzzles | Avoids déjà-vu (a year at one per week) |
| Center letter | not `q`/`y`/`x` | Too restrictive in German |

Generation is deterministic given a seed, so a puzzle set is reproducible from the seed + the
dictionary version.

### Difficulty signal (post-MVP)

Rate a puzzle by average word frequency and pangram obscurity, then spread difficulty evenly
across consecutive weeks instead of letting the seed cluster three hard ones in a row. Nice to
have, not v1.

## Regeneration policy

The dictionary is versioned. Changing it does **not** retroactively change already-published
puzzles — a puzzle file is immutable once shipped, because a player's saved progress refers to
its solution set. New dictionary versions affect newly generated puzzles only.
