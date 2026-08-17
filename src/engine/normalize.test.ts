import { describe, expect, it } from 'vitest';

import { normalizeKey, normalizeWord } from './normalize';

describe('normalizeWord', () => {
  it('lowercases and keeps plain letters', () => {
    expect(normalizeWord('Kern')).toBe('kern');
    expect(normalizeWord('TRAINER')).toBe('trainer');
  });

  it('drops separators that carry no meaning on the board', () => {
    expect(normalizeWord('  raten ')).toBe('raten');
    expect(normalizeWord('rein-rein')).toBe('reinrein');
    expect(normalizeWord("kern's")).toBe('kerns');
    expect(normalizeWord('kern’s')).toBe('kerns');
  });

  it('rejects umlauts and ß instead of stripping or transliterating them', () => {
    // Stripping would turn "Käse" into "kse"; transliterating would collide
    // "mochte" with "möchte". Both spellings are simply not playable.
    expect(normalizeWord('Käse')).toBeNull();
    expect(normalizeWord('möchte')).toBeNull();
    expect(normalizeWord('Straße')).toBeNull();
    expect(normalizeWord('ÜBER')).toBeNull();
  });

  it('rejects anything that is not a letter', () => {
    expect(normalizeWord('kern2')).toBeNull();
    expect(normalizeWord('')).toBeNull();
    expect(normalizeWord('   ')).toBeNull();
    expect(normalizeWord('café')).toBeNull();
  });
});

describe('normalizeKey', () => {
  it('accepts single ASCII letters in any case', () => {
    expect(normalizeKey('R')).toBe('r');
    expect(normalizeKey('a')).toBe('a');
  });

  it('rejects umlauts, multi-character keys and control keys', () => {
    expect(normalizeKey('ä')).toBeNull();
    expect(normalizeKey('ss')).toBeNull();
    expect(normalizeKey('Enter')).toBeNull();
    expect(normalizeKey(' ')).toBeNull();
  });
});
