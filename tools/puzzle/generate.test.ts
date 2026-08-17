import { describe, expect, it } from 'vitest';

import {
  DEFAULT_GATES,
  countBits,
  createRandom,
  evaluateBoard,
  gateFailures,
  generateBoard,
  indexWords,
  letterMask,
  letterSetKey,
  maskToLetters,
  pangramCandidates,
  toPuzzle,
  type BoardEvaluation,
} from './generate';

const BOARD_WORDS = [
  'kern',
  'rein',
  'irre',
  'raten',
  'arten',
  'krater',
  'trainer',
  'traktieren',
  'kette', // board letters only, but no r
  'brater', // uses an off-board letter
];

const indexed = indexWords(BOARD_WORDS);
const boardMask = letterMask('traktieren');

describe('letterMask and countBits', () => {
  it('collapses repeated letters into one bit', () => {
    expect(letterMask('kern')).toBe(letterMask('kkeerrnn'));
    expect(countBits(letterMask('kern'))).toBe(4);
  });

  it('counts the seven distinct letters of a pangram', () => {
    expect(countBits(letterMask('traktieren'))).toBe(7);
  });
});

describe('maskToLetters', () => {
  it('returns the letters of a mask in alphabetical order', () => {
    expect(maskToLetters(letterMask('traktieren'))).toEqual(['a', 'e', 'i', 'k', 'n', 'r', 't']);
  });
});

describe('pangramCandidates', () => {
  it('keeps only words with exactly seven distinct letters', () => {
    expect(pangramCandidates(indexed).map((entry) => entry.word)).toEqual(['traktieren']);
  });
});

describe('letterSetKey', () => {
  it('identifies a board regardless of letter order or which one is centered', () => {
    expect(letterSetKey(['t', 'r', 'a', 'k', 'i', 'e', 'n'])).toBe(
      letterSetKey(['a', 'e', 'i', 'k', 'n', 'r', 't']),
    );
  });
});

describe('evaluateBoard', () => {
  const evaluation = evaluateBoard(indexed, boardMask, 'r');

  it('collects every word built from board letters that uses the center', () => {
    expect(evaluation.solutions).toEqual([
      'arten',
      'irre',
      'kern',
      'krater',
      'raten',
      'rein',
      'trainer',
      'traktieren',
    ]);
  });

  it('excludes words without the center letter', () => {
    expect(evaluation.solutions).not.toContain('kette');
  });

  it('excludes words using letters that are not on the board', () => {
    expect(evaluation.solutions).not.toContain('brater');
  });

  it('finds the pangram', () => {
    expect(evaluation.pangrams).toEqual(['traktieren']);
  });

  it('scores the board with the engine rules, bonus included', () => {
    // kern/rein/irre 1 each, raten/arten 5, krater 6, trainer 7,
    // traktieren 10 + 7 bonus = 43.
    expect(evaluation.maxScore).toBe(43);
  });

  it('reports the outer letters without the center', () => {
    expect(evaluation.outerLetters).toEqual(['a', 'e', 'i', 'k', 'n', 't']);
    expect(evaluation.outerLetters).toHaveLength(6);
  });

  it('measures the share of four-letter words', () => {
    // kern, rein and irre of eight solutions.
    expect(evaluation.fourLetterShare).toBeCloseTo(3 / 8);
  });

  it('changes the solution set when a different letter is centered', () => {
    // "kette" is unplayable with r in the center but valid with k.
    const centeredOnK = evaluateBoard(indexed, boardMask, 'k');
    expect(centeredOnK.solutions).toEqual(['kern', 'kette', 'krater', 'traktieren']);
    expect(centeredOnK.outerLetters).not.toContain('k');
  });
});

describe('gateFailures', () => {
  const passing: BoardEvaluation = {
    centerLetter: 'r',
    outerLetters: ['a', 'e', 'i', 'k', 'n', 't'],
    solutions: Array.from({ length: 40 }, (_, i) => `word${String(i)}`),
    pangrams: ['traktieren'],
    maxScore: 200,
    fourLetterShare: 0.3,
  };

  it('passes a board that satisfies every gate', () => {
    expect(gateFailures(passing)).toEqual([]);
  });

  it('rejects a board with too few or too many solutions', () => {
    expect(gateFailures({ ...passing, solutions: passing.solutions.slice(0, 10) })).toContain(
      'too few solutions',
    );
    expect(
      gateFailures({
        ...passing,
        solutions: Array.from({ length: 200 }, (_, i) => `w${String(i)}`),
      }),
    ).toContain('too many solutions');
  });

  it('requires at least one pangram but not a giveaway', () => {
    expect(gateFailures({ ...passing, pangrams: [] })).toContain('no pangram');
    expect(gateFailures({ ...passing, pangrams: ['a', 'b', 'c', 'd', 'e'] })).toContain(
      'too many pangrams',
    );
  });

  it('rejects scores outside the playable band', () => {
    expect(gateFailures({ ...passing, maxScore: 40 })).toContain('score too low');
    expect(gateFailures({ ...passing, maxScore: 900 })).toContain('score too high');
  });

  it('rejects a board padded with four-letter words', () => {
    expect(gateFailures({ ...passing, fourLetterShare: 0.8 })).toContain(
      'too many four-letter words',
    );
  });

  it('rejects center letters that are too restrictive in German', () => {
    for (const centerLetter of DEFAULT_GATES.forbiddenCenterLetters) {
      expect(gateFailures({ ...passing, centerLetter })).toContain('forbidden center letter');
    }
  });

  it('reports every failing gate, not just the first', () => {
    const failures = gateFailures({ ...passing, pangrams: [], maxScore: 10 });
    expect(failures).toEqual(expect.arrayContaining(['no pangram', 'score too low']));
  });
});

describe('createRandom', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createRandom(7);
    const b = createRandom(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('produces a different sequence for a different seed', () => {
    expect(createRandom(7)()).not.toBe(createRandom(8)());
  });

  it('stays within [0, 1)', () => {
    const random = createRandom(123);
    for (let i = 0; i < 500; i += 1) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('generateBoard', () => {
  // Gates relaxed to fit the tiny fixture dictionary.
  const gates = {
    ...DEFAULT_GATES,
    minSolutions: 3,
    maxSolutions: 90,
    minScore: 10,
    maxFourLetterShare: 0.9,
  };

  it('returns a board that passes the gates', () => {
    const board = generateBoard(indexed, { seed: 1, gates });
    expect(board).not.toBeNull();
    expect(gateFailures(board as BoardEvaluation, gates)).toEqual([]);
  });

  it('is deterministic for a given seed', () => {
    expect(generateBoard(indexed, { seed: 42, gates })).toEqual(
      generateBoard(indexed, { seed: 42, gates }),
    );
  });

  it('skips letter sets that were used recently', () => {
    const used = new Set([letterSetKey(['a', 'e', 'i', 'k', 'n', 'r', 't'])]);
    expect(generateBoard(indexed, { seed: 1, gates, usedLetterSets: used })).toBeNull();
  });

  it('returns null when no board can satisfy the gates', () => {
    expect(generateBoard(indexed, { seed: 1, gates: { ...gates, minSolutions: 500 } })).toBeNull();
  });

  it('returns null for a dictionary without a pangram candidate', () => {
    expect(generateBoard(indexWords(['kern', 'raten']), { seed: 1, gates })).toBeNull();
  });
});

describe('toPuzzle', () => {
  const evaluation = evaluateBoard(indexed, boardMask, 'r');
  const displayForms = new Map([
    ['kern', 'Kern'],
    ['krater', 'Krater'],
  ]);

  it('writes the puzzle file shape', () => {
    const puzzle = toPuzzle(evaluation, '2026-08-19', displayForms);
    expect(puzzle.schemaVersion).toBe(1);
    expect(puzzle.date).toBe('2026-08-19');
    expect(puzzle.centerLetter).toBe('r');
    expect(puzzle.outerLetters).toHaveLength(6);
    expect(puzzle.maxScore).toBe(evaluation.maxScore);
  });

  it('carries a display form for every solution', () => {
    const puzzle = toPuzzle(evaluation, '2026-08-19', displayForms);
    expect(Object.keys(puzzle.displayForms).sort()).toEqual([...evaluation.solutions].sort());
    expect(puzzle.displayForms['kern']).toBe('Kern');
  });

  it('falls back to the normalized spelling when none is known', () => {
    const puzzle = toPuzzle(evaluation, '2026-08-19', new Map());
    expect(puzzle.displayForms['raten']).toBe('raten');
  });
});
