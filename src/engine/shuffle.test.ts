import { describe, expect, it } from 'vitest';

import { shuffled } from './shuffle';

/** Returns the given values in order, then 0 forever. */
function scriptedRandom(values: readonly number[]): () => number {
  let call = 0;
  return () => values[call++] ?? 0;
}

describe('shuffled', () => {
  const letters = ['a', 'e', 'i', 'k', 'n', 't'] as const;

  it('keeps every letter exactly once', () => {
    const result = shuffled(letters, scriptedRandom([0.9, 0.1, 0.5, 0.99, 0.3]));
    expect([...result].sort()).toEqual([...letters].sort());
  });

  it('does not mutate the input', () => {
    const input = [...letters];
    shuffled(input, scriptedRandom([0.7, 0.2, 0.4]));
    expect(input).toEqual([...letters]);
  });

  it('is deterministic for a given random sequence', () => {
    const sequence = [0.9, 0.1, 0.5, 0.99, 0.3];
    expect(shuffled(letters, scriptedRandom(sequence))).toEqual(
      shuffled(letters, scriptedRandom(sequence)),
    );
  });

  it('actually reorders rather than returning the input order', () => {
    const result = shuffled(letters, scriptedRandom([0.9, 0.1, 0.5, 0.99, 0.3]));
    expect(result).not.toEqual([...letters]);
  });

  it('handles empty and single-item lists', () => {
    expect(shuffled([])).toEqual([]);
    expect(shuffled(['r'])).toEqual(['r']);
  });
});
