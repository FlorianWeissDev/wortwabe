import type { PuzzleDate } from './types';

/**
 * Releases are pinned to one zone rather than the device's. A phone that travels
 * (or is set to UTC) must not see the puzzle change underneath it.
 */
export const RELEASE_TIME_ZONE = 'Europe/Berlin';

/** Wednesday, numbered as in `Date#getUTCDay`. */
export const RELEASE_WEEKDAY = 3;

const MS_PER_DAY = 86_400_000;

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const zonedParts = new Intl.DateTimeFormat('en-US', {
  timeZone: RELEASE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

interface CivilDate {
  year: number;
  month: number;
  day: number;
}

function requirePart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): number {
  const part = parts.find((candidate) => candidate.type === type);
  if (!part) {
    throw new Error(`Intl did not return a "${type}" part for ${RELEASE_TIME_ZONE}`);
  }
  return Number(part.value);
}

/** The calendar date in the release zone at the given instant. */
function civilDateAt(instant: Date): CivilDate {
  const parts = zonedParts.formatToParts(instant);
  return {
    year: requirePart(parts, 'year'),
    month: requirePart(parts, 'month'),
    day: requirePart(parts, 'day'),
  };
}

function toUtcMidnight(date: CivilDate): number {
  return Date.UTC(date.year, date.month - 1, date.day);
}

function fromUtcMidnight(timestamp: number): CivilDate {
  const date = new Date(timestamp);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function format(date: CivilDate): PuzzleDate {
  const month = String(date.month).padStart(2, '0');
  const day = String(date.day).padStart(2, '0');
  return `${date.year}-${month}-${day}`;
}

export function parsePuzzleDate(value: PuzzleDate): CivilDate | null {
  const match = DATE_PATTERN.exec(value);
  if (!match) {
    return null;
  }
  const [, year, month, day] = match;
  if (!year || !month || !day) {
    return null;
  }
  const parsed = { year: Number(year), month: Number(month), day: Number(day) };
  // Rejects things like 2026-02-31, which Date.UTC would silently roll over.
  return format(fromUtcMidnight(toUtcMidnight(parsed))) === value ? parsed : null;
}

function weekdayOf(date: CivilDate): number {
  return new Date(toUtcMidnight(date)).getUTCDay();
}

export function isReleaseWeekday(value: PuzzleDate): boolean {
  const parsed = parsePuzzleDate(value);
  return parsed !== null && weekdayOf(parsed) === RELEASE_WEEKDAY;
}

/**
 * The release date of the puzzle in play at `now`: the most recent Wednesday on
 * or before `now`, judged by the calendar date in the release zone. Because the
 * comparison happens on civil dates, DST shifts never move the boundary.
 */
export function currentPuzzleDate(now: Date): PuzzleDate {
  const today = civilDateAt(now);
  const daysSinceRelease = (weekdayOf(today) - RELEASE_WEEKDAY + 7) % 7;
  return format(fromUtcMidnight(toUtcMidnight(today) - daysSinceRelease * MS_PER_DAY));
}

/** The next `count` release dates strictly after `after`, used by the generator. */
export function upcomingReleaseDates(after: PuzzleDate, count: number): PuzzleDate[] {
  const parsed = parsePuzzleDate(after);
  if (!parsed) {
    throw new Error(`Not a valid date: ${after}`);
  }
  const start = toUtcMidnight(parsed);
  const dates: PuzzleDate[] = [];
  for (let week = 1; week <= count; week += 1) {
    dates.push(format(fromUtcMidnight(start + week * 7 * MS_PER_DAY)));
  }
  return dates;
}

export function isReleased(date: PuzzleDate, now: Date): boolean {
  return date <= currentPuzzleDate(now);
}

/** Released puzzles only, newest first. Future-dated files stay invisible. */
export function releasedDates(available: readonly PuzzleDate[], now: Date): PuzzleDate[] {
  const current = currentPuzzleDate(now);
  return available.filter((date) => date <= current).sort((a, b) => b.localeCompare(a));
}

export type PuzzleResolution =
  | { status: 'REQUESTED'; date: PuzzleDate }
  | { status: 'CURRENT'; date: PuzzleDate }
  /** No puzzle generated for the current week; the newest released one is used. */
  | { status: 'NEWEST_AVAILABLE'; date: PuzzleDate }
  | { status: 'NONE' };

/**
 * Picks which puzzle to open. An unreleased or unknown request falls back to the
 * current week rather than erroring — a stale bookmark should still open a game.
 */
export function resolvePuzzleDate(
  available: readonly PuzzleDate[],
  requested: PuzzleDate | null,
  now: Date,
): PuzzleResolution {
  const released = releasedDates(available, now);
  const newest = released[0];
  if (!newest) {
    return { status: 'NONE' };
  }

  if (requested !== null && released.includes(requested)) {
    return { status: 'REQUESTED', date: requested };
  }

  const current = currentPuzzleDate(now);
  return released.includes(current)
    ? { status: 'CURRENT', date: current }
    : { status: 'NEWEST_AVAILABLE', date: newest };
}
