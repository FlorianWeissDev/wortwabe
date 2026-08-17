/** A single board letter. Umlauts and ß never appear — see plans/03-game-rules.md. */
export type Letter =
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'h'
  | 'i'
  | 'j'
  | 'k'
  | 'l'
  | 'm'
  | 'n'
  | 'o'
  | 'p'
  | 'q'
  | 'r'
  | 's'
  | 't'
  | 'u'
  | 'v'
  | 'w'
  | 'x'
  | 'y'
  | 'z';

/** `YYYY-MM-DD`. For puzzles this is always a Wednesday, the release date. */
export type PuzzleDate = string;

export interface Puzzle {
  schemaVersion: number;
  date: PuzzleDate;
  centerLetter: Letter;
  /** The six letters around the center, in canonical (unshuffled) order. */
  outerLetters: readonly Letter[];
  /** Normalized, lowercase, ASCII. */
  solutions: readonly string[];
  /** Normalized word → the spelling shown to the player (nouns are capitalized). */
  displayForms: Readonly<Record<string, string>>;
  pangrams: readonly string[];
  maxScore: number;
}

/** One entry of the generated puzzle catalog, enough to render the picker. */
export interface PuzzleSummary {
  date: PuzzleDate;
  centerLetter: Letter;
  outerLetters: readonly Letter[];
  maxScore: number;
}

export type RejectionReason =
  'TOO_SHORT' | 'INVALID_LETTER' | 'MISSING_CENTER' | 'ALREADY_FOUND' | 'NOT_A_WORD';

export type SubmitResult =
  | { status: 'ACCEPTED'; word: string; points: number; isPangram: boolean }
  | { status: 'REJECTED'; reason: RejectionReason; word: string };

/**
 * A puzzle plus the lookup structures derived from it. Built once per puzzle so
 * validation does not rebuild sets on every keystroke.
 */
export interface PuzzleIndex {
  puzzle: Puzzle;
  letters: ReadonlySet<Letter>;
  solutions: ReadonlySet<string>;
  pangrams: ReadonlySet<string>;
}

export interface GameState {
  index: PuzzleIndex;
  /** Normalized letters typed so far. */
  input: string;
  /** Current on-screen order of the six outer letters; the center never moves. */
  outerOrder: readonly Letter[];
  /** Normalized found words, in the order they were found. */
  foundWords: readonly string[];
  /** Result of the most recent submit, for transient UI feedback. */
  lastResult: SubmitResult | null;
}
