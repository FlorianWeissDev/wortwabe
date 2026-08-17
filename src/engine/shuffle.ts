/**
 * Fisher-Yates over a copy. The random source is a parameter so shuffling stays
 * a pure function and can be tested with a fixed sequence.
 */
export function shuffled<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const a = result[i];
    const b = result[j];
    if (a === undefined || b === undefined) {
      continue;
    }
    result[i] = b;
    result[j] = a;
  }
  return result;
}
