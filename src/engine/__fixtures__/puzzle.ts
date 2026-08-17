import type { Puzzle } from '../types';

/**
 * A hand-written puzzle used across the engine tests. Center `r`, outer
 * `a e i k n t`, with `traktieren` as the single pangram.
 *
 * Scores: kern/rein/irre 1 each, raten/arten 5 each, krater 6, trainer 7,
 * traktieren 10 + 7 bonus = 17. Total 43.
 */
export const testPuzzle: Puzzle = {
  schemaVersion: 1,
  date: '2026-08-19',
  centerLetter: 'r',
  outerLetters: ['a', 'e', 'i', 'k', 'n', 't'],
  solutions: ['kern', 'rein', 'irre', 'raten', 'arten', 'krater', 'trainer', 'traktieren'],
  displayForms: {
    kern: 'Kern',
    rein: 'rein',
    irre: 'irre',
    raten: 'raten',
    arten: 'Arten',
    krater: 'Krater',
    trainer: 'Trainer',
    traktieren: 'traktieren',
  },
  pangrams: ['traktieren'],
  maxScore: 43,
};
