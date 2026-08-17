import type { Letter } from './types';

export const MIN_WORD_LENGTH = 4;

/** Characters that are dropped rather than rejected: they never carry meaning here. */
const SEPARATORS = /[\s\-‐-―'’.]/g;

const ASCII_LETTERS = /^[a-z]+$/;

/**
 * Lowercases and drops separators, then requires plain a–z.
 *
 * Umlauts and ß make the whole word invalid instead of being stripped or
 * transliterated: stripping would silently turn "Käse" into "kse", and
 * transliterating would make two spellings collide (see plans/03-game-rules.md).
 * Returns null when the word cannot be represented on an ASCII board.
 */
export function normalizeWord(raw: string): string | null {
  const stripped = raw.toLowerCase().replace(SEPARATORS, '');
  if (stripped.length === 0 || !ASCII_LETTERS.test(stripped)) {
    return null;
  }
  return stripped;
}

export function isLetter(value: string): value is Letter {
  return value.length === 1 && value >= 'a' && value <= 'z';
}

/** Lowercases a single typed key, or null if it is not a board-representable letter. */
export function normalizeKey(raw: string): Letter | null {
  const lower = raw.toLowerCase();
  return isLetter(lower) ? lower : null;
}
