import { describe, expect, it } from 'vitest';

import { testPuzzle } from './__fixtures__/puzzle';
import {
  PANGRAM_BONUS,
  indexPuzzle,
  isPangram,
  puzzleLetters,
  scoreWord,
  totalScore,
} from './score';

const index = indexPuzzle(testPuzzle);
const letters = puzzleLetters(testPuzzle);

describe('scoreWord', () => {
  it('gives a four-letter word one point and longer words their length', () => {
    expect(scoreWord('kern', false)).toBe(1);
    expect(scoreWord('raten', false)).toBe(5);
    expect(scoreWord('trainer', false)).toBe(7);
  });

  it('adds the pangram bonus on top of the word score', () => {
    expect(scoreWord('traktieren', true)).toBe(10 + PANGRAM_BONUS);
    // A four-letter pangram is impossible on a seven-letter board, but the
    // bonus must stack on the flat one point rather than replace it.
    expect(scoreWord('kern', true)).toBe(1 + PANGRAM_BONUS);
  });
});

describe('isPangram', () => {
  it('requires every board letter, allowing repeats', () => {
    expect(isPangram('traktieren', letters)).toBe(true);
  });

  it('rejects words that miss a letter', () => {
    expect(isPangram('trainer', letters)).toBe(false);
    expect(isPangram('kern', letters)).toBe(false);
  });
});

describe('totalScore', () => {
  it('sums the scores of the words given', () => {
    expect(totalScore([], index)).toBe(0);
    expect(totalScore(['kern', 'raten'], index)).toBe(6);
    expect(totalScore(['traktieren'], index)).toBe(17);
  });
});

describe('indexPuzzle', () => {
  it('derives pangrams and the maximum score from the word list', () => {
    expect([...index.pangrams]).toEqual(['traktieren']);
    expect(index.maxScore).toBe(43);
  });

  it('finds a capitalized noun by its lowercase key and keeps its display form', () => {
    expect(index.solutions.has('krater')).toBe(true);
    expect(index.solutions.has('Krater')).toBe(false);
    expect(index.displayForms.get('krater')).toBe('Krater');
  });
});
