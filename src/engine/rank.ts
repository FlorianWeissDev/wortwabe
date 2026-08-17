export type RankId =
  | 'BEGINNER'
  | 'GOOD_START'
  | 'MOVING_UP'
  | 'GOOD'
  | 'SOLID'
  | 'STRONG'
  | 'GREAT'
  | 'AMAZING'
  | 'GENIUS'
  | 'QUEEN_BEE';

export interface RankThreshold {
  id: RankId;
  /** Share of the puzzle's maximum score required to reach this rank. */
  percentOfMax: number;
}

/**
 * Percentages rather than absolute points, so every puzzle has the same shape of
 * progression regardless of how large its solution set is.
 */
export const RANK_THRESHOLDS: readonly RankThreshold[] = [
  { id: 'BEGINNER', percentOfMax: 0 },
  { id: 'GOOD_START', percentOfMax: 2 },
  { id: 'MOVING_UP', percentOfMax: 5 },
  { id: 'GOOD', percentOfMax: 8 },
  { id: 'SOLID', percentOfMax: 15 },
  { id: 'STRONG', percentOfMax: 25 },
  { id: 'GREAT', percentOfMax: 40 },
  { id: 'AMAZING', percentOfMax: 50 },
  { id: 'GENIUS', percentOfMax: 70 },
  { id: 'QUEEN_BEE', percentOfMax: 100 },
];

export interface RankProgress {
  id: RankId;
  index: number;
  score: number;
  maxScore: number;
  /** Points required for the next rank, or null at the top. */
  nextRank: { id: RankId; pointsRequired: number; pointsAway: number } | null;
}

/**
 * Flooring keeps a rank from being one rounding error out of reach. Any rank
 * above the first also costs at least one point: on a low-scoring puzzle several
 * percentages floor to zero, which would otherwise award them before the player
 * has found anything.
 */
export function pointsForRank(threshold: RankThreshold, maxScore: number): number {
  if (threshold.percentOfMax === 0) {
    return 0;
  }
  return Math.max(1, Math.floor((threshold.percentOfMax / 100) * maxScore));
}

export function rankForScore(score: number, maxScore: number): RankProgress {
  let index = 0;
  for (let i = 0; i < RANK_THRESHOLDS.length; i += 1) {
    const threshold = RANK_THRESHOLDS[i];
    if (threshold && score >= pointsForRank(threshold, maxScore)) {
      index = i;
    }
  }

  const current = RANK_THRESHOLDS[index];
  const next = RANK_THRESHOLDS[index + 1];
  if (!current) {
    throw new Error('RANK_THRESHOLDS must not be empty');
  }

  if (!next) {
    return { id: current.id, index, score, maxScore, nextRank: null };
  }

  const pointsRequired = pointsForRank(next, maxScore);
  return {
    id: current.id,
    index,
    score,
    maxScore,
    nextRank: {
      id: next.id,
      pointsRequired,
      pointsAway: Math.max(0, pointsRequired - score),
    },
  };
}
