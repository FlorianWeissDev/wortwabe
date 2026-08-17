import { describe, expect, it } from 'vitest';

import {
  currentPuzzleDate,
  isReleaseWeekday,
  isReleased,
  parsePuzzleDate,
  releasedDates,
  resolvePuzzleDate,
  upcomingReleaseDates,
} from './schedule';

describe('currentPuzzleDate', () => {
  it('returns the same day during a release Wednesday', () => {
    expect(currentPuzzleDate(new Date('2026-08-19T10:00:00Z'))).toBe('2026-08-19');
  });

  it('holds the previous puzzle until Wednesday begins in Berlin', () => {
    // 21:30 UTC on Tuesday is 23:30 Berlin — still the old puzzle.
    expect(currentPuzzleDate(new Date('2026-08-18T21:30:00Z'))).toBe('2026-08-12');
  });

  it('rolls over at Berlin midnight, not UTC midnight', () => {
    // 22:30 UTC on Tuesday is already 00:30 Wednesday in Berlin. A UTC-based
    // implementation would still report the previous week here.
    expect(currentPuzzleDate(new Date('2026-08-18T22:30:00Z'))).toBe('2026-08-19');
  });

  it('uses the correct offset in winter, when Berlin is UTC+1', () => {
    expect(currentPuzzleDate(new Date('2026-01-06T22:30:00Z'))).toBe('2025-12-31');
    expect(currentPuzzleDate(new Date('2026-01-06T23:30:00Z'))).toBe('2026-01-07');
  });

  it('is unaffected by the spring DST transition', () => {
    // Clocks jump 02:00 -> 03:00 on Sunday 2026-03-29; the surrounding
    // Wednesdays must stay 2026-03-25 and 2026-04-01.
    expect(currentPuzzleDate(new Date('2026-03-29T00:30:00Z'))).toBe('2026-03-25');
    expect(currentPuzzleDate(new Date('2026-03-29T01:30:00Z'))).toBe('2026-03-25');
    expect(currentPuzzleDate(new Date('2026-04-01T00:30:00Z'))).toBe('2026-04-01');
  });

  it('is unaffected by the autumn DST transition', () => {
    // 2026-10-25 falls back 03:00 -> 02:00, repeating the same wall-clock hour.
    expect(currentPuzzleDate(new Date('2026-10-25T00:30:00Z'))).toBe('2026-10-21');
    expect(currentPuzzleDate(new Date('2026-10-25T01:30:00Z'))).toBe('2026-10-21');
  });

  it('always lands on a Wednesday, whichever day it is asked about', () => {
    for (let day = 12; day <= 25; day += 1) {
      const date = currentPuzzleDate(new Date(`2026-08-${String(day)}T12:00:00Z`));
      expect(isReleaseWeekday(date)).toBe(true);
    }
  });
});

describe('parsePuzzleDate', () => {
  it('accepts a well-formed date', () => {
    expect(parsePuzzleDate('2026-08-19')).toEqual({ year: 2026, month: 8, day: 19 });
  });

  it('rejects dates that do not exist rather than rolling them over', () => {
    expect(parsePuzzleDate('2026-02-31')).toBeNull();
    expect(parsePuzzleDate('2026-13-01')).toBeNull();
  });

  it('rejects malformed input', () => {
    expect(parsePuzzleDate('2026-8-19')).toBeNull();
    expect(parsePuzzleDate('19.08.2026')).toBeNull();
    expect(parsePuzzleDate('')).toBeNull();
  });
});

describe('isReleaseWeekday', () => {
  it('accepts Wednesdays only', () => {
    expect(isReleaseWeekday('2026-08-19')).toBe(true);
    expect(isReleaseWeekday('2026-08-20')).toBe(false);
    expect(isReleaseWeekday('2026-02-31')).toBe(false);
  });
});

describe('upcomingReleaseDates', () => {
  it('steps forward one week at a time', () => {
    expect(upcomingReleaseDates('2026-08-19', 3)).toEqual([
      '2026-08-26',
      '2026-09-02',
      '2026-09-09',
    ]);
  });

  it('crosses a DST boundary without drifting off Wednesday', () => {
    expect(upcomingReleaseDates('2026-03-25', 2)).toEqual(['2026-04-01', '2026-04-08']);
  });

  it('crosses a year boundary', () => {
    expect(upcomingReleaseDates('2025-12-31', 1)).toEqual(['2026-01-07']);
  });
});

describe('isReleased', () => {
  const now = new Date('2026-08-19T10:00:00Z');

  it('accepts the current and earlier puzzles', () => {
    expect(isReleased('2026-08-19', now)).toBe(true);
    expect(isReleased('2026-08-12', now)).toBe(true);
  });

  it('rejects a puzzle whose Wednesday has not arrived', () => {
    expect(isReleased('2026-08-26', now)).toBe(false);
  });
});

describe('releasedDates', () => {
  it('drops future puzzles and sorts newest first', () => {
    const available = ['2026-08-12', '2026-09-02', '2026-08-19', '2026-08-05', '2026-08-26'];
    expect(releasedDates(available, new Date('2026-08-19T10:00:00Z'))).toEqual([
      '2026-08-19',
      '2026-08-12',
      '2026-08-05',
    ]);
  });

  it('returns nothing when every puzzle is still in the future', () => {
    expect(releasedDates(['2026-09-02'], new Date('2026-08-19T10:00:00Z'))).toEqual([]);
  });
});

describe('resolvePuzzleDate', () => {
  const available = ['2026-08-05', '2026-08-12', '2026-08-19', '2026-08-26'];
  const now = new Date('2026-08-19T10:00:00Z');

  it('opens the current week by default', () => {
    expect(resolvePuzzleDate(available, null, now)).toEqual({
      status: 'CURRENT',
      date: '2026-08-19',
    });
  });

  it('opens an explicitly picked earlier puzzle', () => {
    expect(resolvePuzzleDate(available, '2026-08-05', now)).toEqual({
      status: 'REQUESTED',
      date: '2026-08-05',
    });
  });

  it('ignores a request for an unreleased puzzle instead of failing', () => {
    expect(resolvePuzzleDate(available, '2026-08-26', now)).toEqual({
      status: 'CURRENT',
      date: '2026-08-19',
    });
  });

  it('ignores a request for a puzzle that does not exist', () => {
    expect(resolvePuzzleDate(available, '2026-07-01', now)).toEqual({
      status: 'CURRENT',
      date: '2026-08-19',
    });
  });

  it('falls back to the newest puzzle when the current week was never generated', () => {
    expect(resolvePuzzleDate(['2026-08-05', '2026-08-12'], null, now)).toEqual({
      status: 'NEWEST_AVAILABLE',
      date: '2026-08-12',
    });
  });

  it('reports NONE when nothing has been released yet', () => {
    expect(resolvePuzzleDate(['2026-09-02'], null, now)).toEqual({ status: 'NONE' });
    expect(resolvePuzzleDate([], null, now)).toEqual({ status: 'NONE' });
  });
});
