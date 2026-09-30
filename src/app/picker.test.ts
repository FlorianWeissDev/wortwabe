import { describe, expect, it } from 'vitest';

import type { Puzzle } from '../engine';
import { testPuzzle } from '../engine/__fixtures__/puzzle';
import { pickerEntries } from './picker';

function on(date: string): Puzzle {
  return { ...testPuzzle, date };
}

const puzzles = new Map<string, Puzzle>(
  ['2026-09-09', '2026-09-16', '2026-09-23', '2026-09-30'].map((d) => [d, on(d)]),
);
// Wednesday 2026-09-23 noon Berlin: 2026-09-30 is still in the future.
const now = new Date('2026-09-23T12:00:00+02:00');

describe('pickerEntries', () => {
  it('lists released puzzles newest first and hides future ones', () => {
    const entries = pickerEntries(puzzles, now, () => [], null);
    expect(entries.map((e) => e.date)).toEqual(['2026-09-23', '2026-09-16', '2026-09-09']);
  });

  it('computes score and rank from the loaded words', () => {
    const load = (date: string) => (date === '2026-09-16' ? ['traktieren', 'trainer', 'nope'] : []);
    const entries = pickerEntries(puzzles, now, load, null);
    const entry = entries.find((e) => e.date === '2026-09-16');
    expect(entry).toMatchObject({ score: 24, maxScore: 43, foundCount: 2, totalWords: 8 });
    expect(entry?.rankId).toBe('AMAZING');
    expect(entries.find((e) => e.date === '2026-09-09')).toMatchObject({
      score: 0,
      rankId: 'BEGINNER',
    });
  });

  it('flags the current and selected puzzle', () => {
    const entries = pickerEntries(puzzles, now, () => [], '2026-09-16');
    expect(entries.map((e) => [e.isCurrent, e.isSelected])).toEqual([
      [true, false],
      [false, true],
      [false, false],
    ]);
  });
});
