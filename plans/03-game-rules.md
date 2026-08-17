# Game Rules (normative specification)

This is the contract the engine implements and the unit tests assert. Where the original game's
exact behaviour is unknown to us, the rule is marked **[assumption]** and made configurable so it
can be corrected later without touching the UI.

## Release schedule

- A puzzle is identified by its **release date, which is always a Wednesday** (`YYYY-MM-DD`).
- Exactly **one new puzzle per week**. The _current_ puzzle is the one whose release date is the
  most recent Wednesday **on or before now**.
- The rollover happens at **Wednesday 00:00 Europe/Berlin**, not UTC and not the device's local
  time. A fixed zone keeps the puzzle the same for everyone regardless of where the phone thinks
  it is, and avoids a puzzle appearing to change during travel. DST is handled by resolving the
  boundary in that zone, not by adding 7 × 24 h.
- Puzzles with a **future release date are never selectable**, even though the generated files
  may already exist in `data/puzzles/`. This is enforced in the engine, not the UI.
- **Previously released puzzles remain playable** through a picker, each with its own independent
  saved progress. There is no expiry and no lock-out.
- If the current date runs past the newest generated puzzle, the app falls back to the newest
  available one and says so in German rather than showing an error.

## Board

- Exactly **7 letters**, all distinct: 1 center letter + 6 outer letters.
- Letters are drawn from the 26 basic Latin letters. **Umlauts (ä/ö/ü) and ß never appear on the
  board, and no word containing them is ever part of a solution set** (see below).
- The 6 outer letters can be shuffled; the center letter stays put.

## Valid word

A submitted word is accepted if and only if all of these hold:

1. Length ≥ **4** characters (after normalization).
2. Contains the **center letter** at least once.
3. Uses **only** board letters — repetition is unlimited.
4. Exists in the puzzle's solution set.
5. Has not already been found in this session.

## Normalization and umlauts

Input and dictionary entries are normalized before comparison:

- Lowercase.
- Strip whitespace, hyphens and apostrophes.

**Decision: umlauts and ß are excluded, not expanded.** Any word containing ä, ö, ü or ß is
filtered out of the dictionary entirely, so it can never be a solution.

Rationale: the board is ASCII, and this keeps a single unambiguous spelling per word. Expanding
(`ä → ae`) was the alternative; it yields a larger vocabulary but creates collisions
(`mochte` / `möchte` → `moechte`) and forces the player to guess whether a word is "in" as its
transliterated form. For a puzzle game, predictability beats vocabulary size.

**Cost, stated plainly:** this removes a meaningful slice of German — roughly every word with an
umlauted plural or comparative. Puzzle quality gates in `04-wordlist.md` compensate by requiring
a minimum solution count.

Typing `ä` on a physical keyboard is simply ignored at input time, like any other off-board key.
The engine keeps the filter behind `umlautMode: "exclude" | "expand"` so the decision is
reversible, but only `exclude` is implemented and tested in v1.

## Scoring **[assumption — NYT-derived]**

| Word                               | Points              |
| ---------------------------------- | ------------------- |
| 4 letters                          | 1                   |
| 5+ letters                         | 1 point per letter  |
| Pangram (uses all 7 board letters) | word points **+ 7** |

`maxScore` is the sum over the whole solution set and is stored in the puzzle file.

## Ranks

Thresholds are a **percentage of `maxScore`**, rounded down, so every puzzle has the same shape
of progression.

| % of max | German label  |
| -------- | ------------- |
| 0        | Anfang        |
| 2        | Guter Start   |
| 5        | Aufstieg      |
| 8        | Gut           |
| 15       | Solide        |
| 25       | Stark         |
| 40       | Großartig     |
| 50       | Erstaunlich   |
| 70       | Genie         |
| 100      | Bienenkönigin |

Rank labels live in `src/locale/de.ts`; the thresholds live in the engine. **[assumption]** —
the original's ladder may differ in count and naming.

## Word eligibility (what the dictionary may contain)

Included: common nouns, verbs (all forms), adjectives, adverbs, and the inflected forms a
German speaker would reasonably try.

Excluded: proper nouns, abbreviations and acronyms, words needing a hyphen or apostrophe,
single-letter-repeated interjections, offensive slurs, and words below the frequency cutoff
defined in `04-wordlist.md`.

## Input handling

- Typing a letter that is **not** on the board is rejected at input time (nothing is appended)
  with a brief shake — the player never builds an impossible word.
- Enter submits, Backspace deletes, Escape clears the line, Space shuffles.
- Submitting an empty line is a no-op.

## Feedback

| Situation             | German message                                      |
| --------------------- | --------------------------------------------------- |
| Too short             | „Zu kurz"                                           |
| Center letter missing | „Mittelbuchstabe fehlt"                             |
| Not in the list       | „Kein Wort in der Liste"                            |
| Already found         | „Schon gefunden"                                    |
| Accepted              | „Gut!" / „Stark!" / „Ausgezeichnet!" by word length |
| Pangram               | „Pangramm!" + bonus indicator                       |
