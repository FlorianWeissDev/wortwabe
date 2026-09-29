import { describe, expect, it } from 'vitest';

import type { Puzzle } from '../../src/engine/types';
import { DEFAULT_GATES, countBits, indexWords, letterMask, letterSetKey } from './generate';
import {
  LETTER_SET_WINDOW,
  MAX_SHARED_LETTERS,
  SIMILARITY_WINDOW,
  planSeason,
  seedForDate,
} from './season';

const BOARD_A = ['traktieren', 'kern', 'rein', 'irre', 'raten', 'arten', 'krater', 'trainer'];
const BOARD_B = ['sternchen', 'stern', 'ernst', 'erst', 'sterne', 'rechen', 'nehmt'];
const BOARD_C = ['zauberei', 'zauber', 'bauer', 'zaubere', 'beize', 'reize', 'raue'];

const gates = {
  ...DEFAULT_GATES,
  minSolutions: 3,
  minScore: 10,
  maxFourLetterShare: 1,
};

function fixture(...boards: string[][]) {
  const words = boards.flat();
  return {
    indexed: indexWords(words),
    displayForms: new Map(words.map((word) => [word, word])),
  };
}

function setOf(puzzle: Puzzle): string {
  return letterSetKey([puzzle.centerLetter, ...puzzle.outerLetters]);
}

function puzzleFor(date: string, letters: string): Puzzle {
  const [center = 'a', ...outer] = letters.split('');
  return {
    schemaVersion: 1,
    date,
    centerLetter: center,
    outerLetters: outer,
    words: [],
  } as Puzzle;
}

const dates = ['2026-09-23', '2026-09-30', '2026-10-07'];

describe('planSeason', () => {
  it('produces identical puzzles for identical inputs', () => {
    const input = { dates, existing: [], seed: 7, gates, ...fixture(BOARD_A, BOARD_B, BOARD_C) };
    expect(planSeason(input)).toEqual(planSeason(input));
  });

  it('never repeats a letter set across the planned puzzles', () => {
    const planned = planSeason({
      dates,
      existing: [],
      seed: 3,
      gates,
      ...fixture(BOARD_A, BOARD_B, BOARD_C),
    });
    expect(planned.map((puzzle) => puzzle.date)).toEqual(dates);
    expect(new Set(planned.map(setOf)).size).toBe(3);
  });

  it('avoids letter sets of existing puzzles inside the window', () => {
    const existing = [puzzleFor('2026-09-16', 'aeiknrt')];
    const planned = planSeason({
      dates: dates.slice(0, 2),
      existing,
      seed: 3,
      gates,
      ...fixture(BOARD_A, BOARD_B, BOARD_C),
    });
    expect(planned.map(setOf)).not.toContain('aeiknrt');
    expect(new Set(planned.map(setOf)).size).toBe(2);
  });

  it('allows a letter set again once it has left the window', () => {
    const existing = [
      puzzleFor('2020-01-01', 'aeiknrt'),
      ...Array.from({ length: LETTER_SET_WINDOW }, (_, week) =>
        puzzleFor(`2021-01-${String(week + 1).padStart(2, '0')}`, 'cehnrst'),
      ),
    ];
    const [planned] = planSeason({
      dates: ['2026-09-23'],
      existing,
      seed: 1,
      gates,
      ...fixture(BOARD_A, BOARD_B),
    });
    expect(planned && setOf(planned)).toBe('aeiknrt');
  });

  it('keeps boards within the similarity window from sharing too many letters', () => {
    // BOARD_A and `similar` differ by one letter, so they may not both fall in one window.
    const boardD = ['sternchen', 'stern', 'ernst', 'erst', 'sterne', 'rechen', 'nehmt'];
    const similar = ['tramtieren', 'mern', 'rein', 'raten', 'arten', 'trainer', 'marter'];
    const { indexed, displayForms } = fixture(BOARD_A, similar, BOARD_C, boardD);
    const planned = planSeason({ dates, existing: [], seed: 6, gates, indexed, displayForms });
    const masks = planned.map((puzzle) =>
      letterMask([puzzle.centerLetter, ...puzzle.outerLetters].join('')),
    );
    for (let i = 0; i < masks.length; i += 1) {
      for (let j = Math.max(0, i - SIMILARITY_WINDOW); j < i; j += 1) {
        expect(countBits((masks[i] ?? 0) & (masks[j] ?? 0))).toBeLessThanOrEqual(
          MAX_SHARED_LETTERS,
        );
      }
    }
  });

  it('names the date it cannot fill', () => {
    expect(() =>
      planSeason({ dates, existing: [], seed: 1, gates, ...fixture(BOARD_A, BOARD_B) }),
    ).toThrow('2026-10-07');
  });
});

describe('seedForDate', () => {
  it('differs per date and per base seed', () => {
    expect(seedForDate(1, '2026-09-23')).not.toBe(seedForDate(1, '2026-09-30'));
    expect(seedForDate(1, '2026-09-23')).not.toBe(seedForDate(2, '2026-09-23'));
  });
});
