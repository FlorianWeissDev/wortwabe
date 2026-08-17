import { describe, expect, it } from 'vitest';

import { RANK_THRESHOLDS, pointsForRank, rankForScore } from './rank';

const MAX = 43;

describe('pointsForRank', () => {
  it('floors the percentage so a rank is never one point out of reach', () => {
    // 70% of 43 is 30.1 — requiring 31 would make "Genie" harder on some puzzles
    // than on others purely through rounding.
    expect(pointsForRank({ id: 'GENIUS', percentOfMax: 70 }, MAX)).toBe(30);
    expect(pointsForRank({ id: 'QUEEN_BEE', percentOfMax: 100 }, MAX)).toBe(43);
    expect(pointsForRank({ id: 'BEGINNER', percentOfMax: 0 }, MAX)).toBe(0);
  });

  it('keeps ranks above the first from being free on a low-scoring puzzle', () => {
    // 2% of 43 floors to 0, which would hand out the second rank before the
    // player has found a single word.
    expect(pointsForRank({ id: 'GOOD_START', percentOfMax: 2 }, MAX)).toBe(1);
    expect(pointsForRank({ id: 'GOOD_START', percentOfMax: 2 }, 200)).toBe(4);
  });
});

describe('rankForScore', () => {
  it('starts at the lowest rank with no points', () => {
    const rank = rankForScore(0, MAX);
    expect(rank.id).toBe('BEGINNER');
    expect(rank.index).toBe(0);
  });

  it('promotes exactly at the threshold, not one point later', () => {
    expect(rankForScore(29, MAX).id).toBe('AMAZING');
    expect(rankForScore(30, MAX).id).toBe('GENIUS');
  });

  it('reaches the top rank at the full score and reports no next rank', () => {
    const rank = rankForScore(MAX, MAX);
    expect(rank.id).toBe('QUEEN_BEE');
    expect(rank.index).toBe(RANK_THRESHOLDS.length - 1);
    expect(rank.nextRank).toBeNull();
  });

  it('reports how far the next rank is', () => {
    const rank = rankForScore(25, MAX);
    expect(rank.nextRank).toEqual({ id: 'GENIUS', pointsRequired: 30, pointsAway: 5 });
  });

  it('never reports a negative distance when a rank is overshot', () => {
    // Scores jump by up to 17 points, so landing past a threshold is normal.
    const rank = rankForScore(29, MAX);
    expect(rank.nextRank?.pointsAway).toBe(1);
    expect(rankForScore(MAX - 1, MAX).nextRank?.pointsAway).toBe(1);
  });

  it('walks the whole ladder in order as the score grows', () => {
    const seen = new Set<string>();
    for (let score = 0; score <= MAX; score += 1) {
      seen.add(rankForScore(score, MAX).id);
    }
    expect([...seen]).toEqual(RANK_THRESHOLDS.map((threshold) => threshold.id));
  });
});
