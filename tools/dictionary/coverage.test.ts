import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { COMMON_WORDS } from './__fixtures__/common-words';

const dictionary: Record<string, string> = JSON.parse(
  readFileSync(new URL('../../data/dictionary/words.json', import.meta.url), 'utf8'),
);

describe('dictionary coverage', () => {
  it('contains at least 95% of a probe of common German words', () => {
    const words = [...new Set(COMMON_WORDS)];
    const missing = words.filter((w) => !(w in dictionary));
    const rate = 1 - missing.length / words.length;
    expect(
      rate,
      `hit rate ${(rate * 100).toFixed(1)}% of ${words.length}; missing: ${missing.join(' ')}`,
    ).toBeGreaterThanOrEqual(0.95);
  });

  it('excludes words spelled with ß, which the source stores as ss', () => {
    const eszettWords = [
      'strasse',
      'gross',
      'grosse',
      'weiss',
      'heissen',
      'fuss',
      'dreissig',
      'aussen',
      'schliessen',
      'bloss',
      'spass',
      'draussen',
      'fleissig',
      'beissen',
      'giessen',
    ];
    expect(eszettWords.filter((w) => w in dictionary)).toEqual([]);
  });
});
