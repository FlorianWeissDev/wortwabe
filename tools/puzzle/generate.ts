import { BOARD_LETTER_COUNT, scoreWord } from '../../src/engine/score';
import type { Letter, Puzzle, PuzzleDate } from '../../src/engine/types';

/**
 * Puzzle generation, kept pure: it takes a word list and a seed and returns
 * puzzles. Writing files is the caller's job.
 *
 * Scoring comes from the engine rather than a second implementation, so a
 * generated `maxScore` can never disagree with what the game awards.
 */

const LETTER_A = 'a'.charCodeAt(0);

export interface IndexedWord {
  word: string;
  /** Bit per distinct letter, `a` = bit 0. */
  mask: number;
  distinctLetters: number;
}

export function letterMask(word: string): number {
  let mask = 0;
  for (const character of word) {
    mask |= 1 << (character.charCodeAt(0) - LETTER_A);
  }
  return mask;
}

export function countBits(mask: number): number {
  let count = 0;
  let rest = mask;
  while (rest !== 0) {
    rest &= rest - 1;
    count += 1;
  }
  return count;
}

export function maskToLetters(mask: number): Letter[] {
  const letters: Letter[] = [];
  for (let bit = 0; bit < 26; bit += 1) {
    if (mask & (1 << bit)) {
      letters.push(String.fromCharCode(LETTER_A + bit) as Letter);
    }
  }
  return letters;
}

export function indexWords(words: Iterable<string>): IndexedWord[] {
  const indexed: IndexedWord[] = [];
  for (const word of words) {
    const mask = letterMask(word);
    indexed.push({ word, mask, distinctLetters: countBits(mask) });
  }
  return indexed;
}

/** Words with exactly seven distinct letters — each one defines a possible board. */
export function pangramCandidates(indexed: readonly IndexedWord[]): IndexedWord[] {
  return indexed.filter((entry) => entry.distinctLetters === BOARD_LETTER_COUNT);
}

/** Stable identity of a letter set, independent of which letter is the center. */
export function letterSetKey(letters: readonly Letter[]): string {
  return [...letters].sort().join('');
}

export interface BoardEvaluation {
  centerLetter: Letter;
  outerLetters: Letter[];
  solutions: string[];
  pangrams: string[];
  maxScore: number;
  fourLetterShare: number;
}

export function evaluateBoard(
  indexed: readonly IndexedWord[],
  boardMask: number,
  centerLetter: Letter,
): BoardEvaluation {
  const centerMask = 1 << (centerLetter.charCodeAt(0) - LETTER_A);
  const solutions: string[] = [];
  const pangrams: string[] = [];
  let maxScore = 0;
  let fourLetterWords = 0;

  for (const entry of indexed) {
    // Every letter of the word must be on the board, and the center must be used.
    if ((entry.mask & ~boardMask) !== 0 || (entry.mask & centerMask) === 0) {
      continue;
    }
    const isPangram = entry.mask === boardMask;
    solutions.push(entry.word);
    if (isPangram) {
      pangrams.push(entry.word);
    }
    if (entry.word.length === 4) {
      fourLetterWords += 1;
    }
    maxScore += scoreWord(entry.word, isPangram);
  }

  solutions.sort();
  pangrams.sort();

  return {
    centerLetter,
    outerLetters: maskToLetters(boardMask).filter((letter) => letter !== centerLetter),
    solutions,
    pangrams,
    maxScore,
    fourLetterShare: solutions.length === 0 ? 1 : fourLetterWords / solutions.length,
  };
}

export interface QualityGates {
  minSolutions: number;
  maxSolutions: number;
  minPangrams: number;
  maxPangrams: number;
  minScore: number;
  maxScore: number;
  maxFourLetterShare: number;
  /** Letters too restrictive to sit in the center of a German board. */
  forbiddenCenterLetters: readonly Letter[];
}

export const DEFAULT_GATES: QualityGates = {
  minSolutions: 30,
  maxSolutions: 90,
  minPangrams: 1,
  maxPangrams: 4,
  minScore: 80,
  maxScore: 350,
  maxFourLetterShare: 0.6,
  forbiddenCenterLetters: ['q', 'x', 'y'],
};

/** Returns the reasons a board is unusable; empty means it passes. */
export function gateFailures(
  evaluation: BoardEvaluation,
  gates: QualityGates = DEFAULT_GATES,
): string[] {
  const failures: string[] = [];
  const { solutions, pangrams, maxScore, fourLetterShare, centerLetter } = evaluation;

  if (solutions.length < gates.minSolutions) failures.push('too few solutions');
  if (solutions.length > gates.maxSolutions) failures.push('too many solutions');
  if (pangrams.length < gates.minPangrams) failures.push('no pangram');
  if (pangrams.length > gates.maxPangrams) failures.push('too many pangrams');
  if (maxScore < gates.minScore) failures.push('score too low');
  if (maxScore > gates.maxScore) failures.push('score too high');
  if (fourLetterShare > gates.maxFourLetterShare) failures.push('too many four-letter words');
  if (gates.forbiddenCenterLetters.includes(centerLetter)) failures.push('forbidden center letter');

  return failures;
}

/** Deterministic PRNG (mulberry32), so a seed reproduces a whole season. */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface GenerateOptions {
  seed: number;
  /** Letter sets to avoid, keyed by `letterSetKey`. */
  usedLetterSets?: ReadonlySet<string>;
  gates?: QualityGates;
}

/**
 * Walks pangram candidates in a seeded order and returns the first board that
 * passes every gate, or null when the dictionary cannot produce one.
 */
export function generateBoard(
  indexed: readonly IndexedWord[],
  options: GenerateOptions,
): BoardEvaluation | null {
  const gates = options.gates ?? DEFAULT_GATES;
  const used = options.usedLetterSets ?? new Set<string>();
  const random = createRandom(options.seed);

  const candidates = pangramCandidates(indexed);
  // Fisher-Yates on a copy, driven by the seeded source.
  for (let i = candidates.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const a = candidates[i];
    const b = candidates[j];
    if (a && b) {
      candidates[i] = b;
      candidates[j] = a;
    }
  }

  for (const candidate of candidates) {
    const letters = maskToLetters(candidate.mask);
    if (used.has(letterSetKey(letters))) {
      continue;
    }
    for (const centerLetter of letters) {
      const evaluation = evaluateBoard(indexed, candidate.mask, centerLetter);
      if (gateFailures(evaluation, gates).length === 0) {
        return evaluation;
      }
    }
  }

  return null;
}

export function toPuzzle(
  evaluation: BoardEvaluation,
  date: PuzzleDate,
  displayForms: ReadonlyMap<string, string>,
): Puzzle {
  return {
    schemaVersion: 1,
    date,
    centerLetter: evaluation.centerLetter,
    outerLetters: evaluation.outerLetters,
    // `solutions` is already sorted by key, so the file stays alphabetical regardless of case.
    words: evaluation.solutions.map((word) => displayForms.get(word) ?? word),
  };
}
