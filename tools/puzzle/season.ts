import type { Puzzle, PuzzleDate } from '../../src/engine/types';
import {
  countBits,
  generateBoard,
  letterMask,
  letterSetKey,
  toPuzzle,
  type IndexedWord,
  type QualityGates,
} from './generate';

/** A letter set may not return within this many puzzles (about a year of weekly releases). */
export const LETTER_SET_WINDOW = 52;

export interface PlanSeasonOptions {
  /** Release dates to fill, in ascending order. */
  dates: readonly PuzzleDate[];
  /** Already published puzzles; never modified, only used to avoid repeats. */
  existing: readonly Puzzle[];
  indexed: readonly IndexedWord[];
  displayForms: ReadonlyMap<string, string>;
  seed: number;
  gates?: QualityGates;
}

/** A new board is compared against this many preceding puzzles. */
export const SIMILARITY_WINDOW = 8;

/** Most letters a board may share with any puzzle in the similarity window. */
export const MAX_SHARED_LETTERS = 5;

/** FNV-1a string hash, used to give every date its own seed. */
export function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Seed for one puzzle: depends on the base seed and the date, not on generation order. */
export function seedForDate(baseSeed: number, date: PuzzleDate): number {
  return (Math.imul(baseSeed >>> 0, 0x9e3779b1) ^ hashString(date)) >>> 0;
}

function puzzleLetterSetKey(puzzle: Puzzle): string {
  return letterSetKey([puzzle.centerLetter, ...puzzle.outerLetters]);
}

/** Generates one puzzle per date; throws if a date cannot be filled. */
export function planSeason(options: PlanSeasonOptions): Puzzle[] {
  const { dates, existing, indexed, displayForms, seed, gates } = options;
  const history = [...existing].sort((a, b) => a.date.localeCompare(b.date));
  const planned: Puzzle[] = [];

  for (const date of dates) {
    const used = new Set(history.slice(-LETTER_SET_WINDOW).map(puzzleLetterSetKey));
    const recentMasks = history
      .slice(-SIMILARITY_WINDOW)
      .map((puzzle) => letterMask([puzzle.centerLetter, ...puzzle.outerLetters].join('')));
    const board = generateBoard(indexed, {
      seed: seedForDate(seed, date),
      usedLetterSets: used,
      rejectLetterMask: (mask) =>
        recentMasks.some((recent) => countBits(recent & mask) > MAX_SHARED_LETTERS),
      ...(gates ? { gates } : {}),
    });
    if (!board) {
      throw new Error(`No board passes the quality gates for ${date}`);
    }
    const puzzle = toPuzzle(board, date, displayForms);
    planned.push(puzzle);
    history.push(puzzle);
  }

  return planned;
}
