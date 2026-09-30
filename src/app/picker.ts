import { indexPuzzle, rankForScore, releasedDates, totalScore, currentPuzzleDate } from '../engine';
import type { Puzzle, PuzzleDate, RankId } from '../engine';

export interface PickerEntry {
  date: PuzzleDate;
  rankId: RankId;
  score: number;
  maxScore: number;
  foundCount: number;
  totalWords: number;
  isCurrent: boolean;
  isSelected: boolean;
}

/** One entry per released puzzle, newest first. Progress is recomputed from the saved words. */
export function pickerEntries(
  puzzles: ReadonlyMap<PuzzleDate, Puzzle>,
  now: Date,
  load: (date: PuzzleDate) => string[],
  selected: PuzzleDate | null,
): PickerEntry[] {
  const current = currentPuzzleDate(now);
  return releasedDates([...puzzles.keys()], now).flatMap((date) => {
    const puzzle = puzzles.get(date);
    if (!puzzle) {
      return [];
    }
    const index = indexPuzzle(puzzle);
    const found = load(date).filter((word) => index.solutions.has(word));
    const score = totalScore(found, index);
    return [
      {
        date,
        rankId: rankForScore(score, index.maxScore).id,
        score,
        maxScore: index.maxScore,
        foundCount: found.length,
        totalWords: index.solutions.size,
        isCurrent: date === current,
        isSelected: date === selected,
      },
    ];
  });
}
