import { describe, expect, it } from 'vitest';

import { testPuzzle } from './__fixtures__/puzzle';
import { indexPuzzle } from './score';
import type { RejectionReason } from './types';
import { validateWord } from './validate';

const index = indexPuzzle(testPuzzle);

function reasonFor(word: string, found: readonly string[] = []): RejectionReason | 'ACCEPTED' {
  const result = validateWord(word, index, found);
  return result.status === 'ACCEPTED' ? 'ACCEPTED' : result.reason;
}

describe('validateWord', () => {
  it('accepts a solution and scores it', () => {
    expect(validateWord('raten', index, [])).toEqual({
      status: 'ACCEPTED',
      word: 'raten',
      points: 5,
      isPangram: false,
    });
  });

  it('accepts a pangram with its bonus', () => {
    expect(validateWord('traktieren', index, [])).toEqual({
      status: 'ACCEPTED',
      word: 'traktieren',
      points: 17,
      isPangram: true,
    });
  });

  it('accepts input in any case and with stray separators', () => {
    expect(reasonFor('  Raten ')).toBe('ACCEPTED');
    expect(reasonFor('KRATER')).toBe('ACCEPTED');
  });

  it('rejects words shorter than the minimum', () => {
    expect(reasonFor('rat')).toBe('TOO_SHORT');
    expect(reasonFor('r')).toBe('TOO_SHORT');
  });

  it('rejects letters that are not on the board', () => {
    expect(reasonFor('brater')).toBe('INVALID_LETTER');
  });

  it('rejects umlauts as unplayable letters', () => {
    expect(reasonFor('räte')).toBe('INVALID_LETTER');
    expect(reasonFor('straße')).toBe('INVALID_LETTER');
  });

  it('rejects a word without the center letter', () => {
    // "kette" is a real word built only from board letters, but has no r.
    expect(reasonFor('kette')).toBe('MISSING_CENTER');
  });

  it('reports a duplicate before checking the dictionary', () => {
    expect(reasonFor('raten', ['raten'])).toBe('ALREADY_FOUND');
  });

  it('rejects a well-formed word that is not in the solution set', () => {
    expect(reasonFor('renten')).toBe('NOT_A_WORD');
  });

  it('prefers the most actionable reason when several apply', () => {
    // Too short *and* missing the center: length is the more useful hint.
    expect(reasonFor('kat')).toBe('TOO_SHORT');
    // Off-board letter *and* missing the center: the letter is the real problem.
    expect(reasonFor('katze')).toBe('INVALID_LETTER');
  });
});
