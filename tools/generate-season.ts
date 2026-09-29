/**
 * Generates weekly puzzle files into data/puzzles/YYYY-MM-DD.json.
 *
 * Published files are immutable: existing files are never overwritten. Generation
 * continues after the newest existing puzzle, or starts with the current week.
 *
 * Run with: npm run generate:season -- [--weeks N] [--seed N]
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { indexPuzzle } from '../src/engine/score';
import { currentPuzzleDate, upcomingReleaseDates } from '../src/engine/schedule';
import type { Puzzle, PuzzleDate } from '../src/engine/types';
import { indexWords } from './puzzle/generate';
import { planSeason } from './puzzle/season';

const DEFAULT_WEEKS = 26;
const DEFAULT_SEED = 20260923;

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const puzzlesDir = join(projectRoot, 'data', 'puzzles');
const dictionaryPath = join(projectRoot, 'data', 'dictionary', 'words.json');
const PUZZLE_FILE = /^\d{4}-\d{2}-\d{2}\.json$/;

function parseIntegerFlag(args: string[], name: string, fallback: number): number {
  const position = args.indexOf(name);
  if (position === -1) {
    return fallback;
  }
  const value = Number(args[position + 1]);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} expects a non-negative integer`);
  }
  return value;
}

function readExistingPuzzles(): Puzzle[] {
  if (!existsSync(puzzlesDir)) {
    return [];
  }
  return readdirSync(puzzlesDir)
    .filter((name) => PUZZLE_FILE.test(name))
    .sort()
    .map((name) => JSON.parse(readFileSync(join(puzzlesDir, name), 'utf8')) as Puzzle);
}

function planDates(existing: readonly Puzzle[], weeks: number): PuzzleDate[] {
  const newest = existing.at(-1);
  if (newest) {
    return upcomingReleaseDates(newest.date, weeks);
  }
  const first = currentPuzzleDate(new Date());
  return weeks === 0 ? [] : [first, ...upcomingReleaseDates(first, weeks - 1)];
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const weeks = parseIntegerFlag(args, '--weeks', DEFAULT_WEEKS);
  const seed = parseIntegerFlag(args, '--seed', DEFAULT_SEED);

  const displayForms = new Map(
    Object.entries(JSON.parse(readFileSync(dictionaryPath, 'utf8')) as Record<string, string>),
  );
  const existing = readExistingPuzzles();
  const dates = planDates(existing, weeks);
  const puzzles = planSeason({
    dates,
    existing,
    indexed: indexWords(displayForms.keys()),
    displayForms,
    seed,
  });

  await mkdir(puzzlesDir, { recursive: true });
  for (const puzzle of puzzles) {
    // Flag 'wx' fails if the file exists, enforcing immutability.
    await writeFile(
      join(puzzlesDir, `${puzzle.date}.json`),
      `${JSON.stringify(puzzle, null, 2)}\n`,
      {
        encoding: 'utf8',
        flag: 'wx',
      },
    );
  }

  const out: string[] = [
    `existing puzzles: ${String(existing.length)}`,
    `new puzzles:      ${String(puzzles.length)}`,
    '',
  ];
  out.push('date        center outer    words  max  pangrams');
  for (const puzzle of puzzles) {
    const index = indexPuzzle(puzzle);
    const pangrams = [...index.pangrams].map((key) => index.displayForms.get(key) ?? key);
    out.push(
      [
        puzzle.date,
        puzzle.centerLetter.toUpperCase().padEnd(6),
        puzzle.outerLetters.join('').toUpperCase().padEnd(8),
        String(puzzle.words.length).padStart(5),
        String(index.maxScore).padStart(4),
        ` ${pangrams.join(', ')}`,
      ].join(' '),
    );
  }
  for (const puzzle of puzzles) {
    out.push('', `${puzzle.date}:`, puzzle.words.join(' '));
  }
  process.stdout.write(`${out.join('\n')}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
