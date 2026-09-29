import { resolvePuzzleDate } from '../engine';
import type { Puzzle, PuzzleDate, PuzzleResolution } from '../engine';

const modules = import.meta.glob<Puzzle>('/data/puzzles/*.json', {
  eager: true,
  import: 'default',
});

/** All bundled puzzles keyed by release date (taken from the file name). */
export const puzzles: ReadonlyMap<PuzzleDate, Puzzle> = new Map(
  Object.entries(modules).flatMap(([path, puzzle]) => {
    const date = /(\d{4}-\d{2}-\d{2})\.json$/.exec(path)?.[1];
    return date === undefined ? [] : [[date, puzzle] as const];
  }),
);

export interface OpenedPuzzle {
  resolution: PuzzleResolution;
  puzzle: Puzzle | null;
}

/** Resolves which puzzle to show from the `?date=` query and the current time. */
export function openPuzzle(now: Date, search: string): OpenedPuzzle {
  const requested = new URLSearchParams(search).get('date');
  const resolution = resolvePuzzleDate([...puzzles.keys()], requested, now);
  const puzzle = resolution.status === 'NONE' ? null : (puzzles.get(resolution.date) ?? null);
  return { resolution, puzzle };
}
