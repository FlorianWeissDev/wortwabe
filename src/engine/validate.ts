import { MIN_WORD_LENGTH, normalizeWord } from './normalize';
import { scoreWord } from './score';
import type { Letter, PuzzleIndex, SubmitResult } from './types';

function usesOnlyBoardLetters(word: string, letters: ReadonlySet<Letter>): boolean {
  for (const character of word) {
    if (!letters.has(character as Letter)) {
      return false;
    }
  }
  return true;
}

/**
 * Checks run cheapest-and-most-obvious first, so the player gets the most
 * actionable message: "too short" beats "not a word" for a two-letter fragment.
 */
export function validateWord(
  raw: string,
  index: PuzzleIndex,
  foundWords: Iterable<string>,
): SubmitResult {
  const word = normalizeWord(raw);
  if (word === null) {
    return { status: 'REJECTED', reason: 'INVALID_LETTER', word: raw.toLowerCase() };
  }
  if (word.length < MIN_WORD_LENGTH) {
    return { status: 'REJECTED', reason: 'TOO_SHORT', word };
  }
  if (!usesOnlyBoardLetters(word, index.letters)) {
    return { status: 'REJECTED', reason: 'INVALID_LETTER', word };
  }
  if (!word.includes(index.puzzle.centerLetter)) {
    return { status: 'REJECTED', reason: 'MISSING_CENTER', word };
  }
  for (const found of foundWords) {
    if (found === word) {
      return { status: 'REJECTED', reason: 'ALREADY_FOUND', word };
    }
  }
  if (!index.solutions.has(word)) {
    return { status: 'REJECTED', reason: 'NOT_A_WORD', word };
  }

  const pangram = index.pangrams.has(word);
  return { status: 'ACCEPTED', word, points: scoreWord(word, pangram), isPangram: pangram };
}
