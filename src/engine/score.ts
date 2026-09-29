import { MIN_WORD_LENGTH } from './normalize';
import type { Letter, Puzzle, PuzzleIndex } from './types';

export const PANGRAM_BONUS = 7;

/** Number of distinct letters on a board — a pangram uses all of them. */
export const BOARD_LETTER_COUNT = 7;

export function puzzleLetters(puzzle: Puzzle): Set<Letter> {
  return new Set<Letter>([puzzle.centerLetter, ...puzzle.outerLetters]);
}

export function indexPuzzle(puzzle: Puzzle): PuzzleIndex {
  const letters = puzzleLetters(puzzle);
  const displayForms = new Map<string, string>();
  const pangrams = new Set<string>();
  for (const word of puzzle.words) {
    const key = word.toLowerCase();
    displayForms.set(key, word);
    if (isPangram(key, letters)) {
      pangrams.add(key);
    }
  }
  const solutions = new Set(displayForms.keys());
  return {
    puzzle,
    letters,
    solutions,
    displayForms,
    pangrams,
    maxScore: totalScore(solutions, { pangrams }),
  };
}

export function isPangram(word: string, letters: ReadonlySet<Letter>): boolean {
  const used = new Set(word);
  if (used.size !== letters.size) {
    return false;
  }
  for (const letter of used) {
    if (!letters.has(letter as Letter)) {
      return false;
    }
  }
  return true;
}

/** Four letters are worth one point; beyond that a word scores its length. */
export function scoreWord(word: string, pangram: boolean): number {
  const base = word.length === MIN_WORD_LENGTH ? 1 : word.length;
  return pangram ? base + PANGRAM_BONUS : base;
}

export function scoreWordIn(word: string, index: Pick<PuzzleIndex, 'pangrams'>): number {
  return scoreWord(word, index.pangrams.has(word));
}

export function totalScore(words: Iterable<string>, index: Pick<PuzzleIndex, 'pangrams'>): number {
  let total = 0;
  for (const word of words) {
    total += scoreWordIn(word, index);
  }
  return total;
}
