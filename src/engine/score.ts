import { MIN_WORD_LENGTH } from './normalize';
import type { Letter, Puzzle, PuzzleIndex } from './types';

export const PANGRAM_BONUS = 7;

/** Number of distinct letters on a board — a pangram uses all of them. */
export const BOARD_LETTER_COUNT = 7;

export function puzzleLetters(puzzle: Puzzle): Set<Letter> {
  return new Set<Letter>([puzzle.centerLetter, ...puzzle.outerLetters]);
}

export function indexPuzzle(puzzle: Puzzle): PuzzleIndex {
  return {
    puzzle,
    letters: puzzleLetters(puzzle),
    solutions: new Set(puzzle.solutions),
    pangrams: new Set(puzzle.pangrams),
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

export function scoreWordIn(word: string, index: PuzzleIndex): number {
  return scoreWord(word, index.pangrams.has(word));
}

export function totalScore(words: Iterable<string>, index: PuzzleIndex): number {
  let total = 0;
  for (const word of words) {
    total += scoreWordIn(word, index);
  }
  return total;
}

/**
 * The score of a complete solution set. Written from the solution list rather
 * than read from the puzzle file so the generator and the game cannot disagree.
 */
export function computeMaxScore(index: PuzzleIndex): number {
  return totalScore(index.puzzle.solutions, index);
}
