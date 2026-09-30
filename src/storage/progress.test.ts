import { describe, expect, it } from 'vitest';

import { loadProgress, progressKey, saveProgress } from './progress';
import type { ProgressStorage } from './progress';

function memoryStorage(): ProgressStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

describe('progress storage', () => {
  it('round-trips saved words and keeps puzzles independent', () => {
    const storage = memoryStorage();
    saveProgress(storage, '2026-09-23', ['kern', 'rein']);
    saveProgress(storage, '2026-09-30', ['irre']);
    expect(loadProgress(storage, '2026-09-23')).toEqual(['kern', 'rein']);
    expect(loadProgress(storage, '2026-09-30')).toEqual(['irre']);
    expect(loadProgress(storage, '2026-10-07')).toEqual([]);
  });

  it('discards corrupt JSON', () => {
    const storage = memoryStorage();
    storage.data.set(progressKey('2026-09-23'), '{not json');
    expect(loadProgress(storage, '2026-09-23')).toEqual([]);
  });

  it('discards an unknown schema version or malformed shape', () => {
    const storage = memoryStorage();
    storage.data.set(progressKey('a'), JSON.stringify({ schemaVersion: 2, foundWords: ['x'] }));
    storage.data.set(progressKey('b'), JSON.stringify({ schemaVersion: 1, foundWords: [1] }));
    storage.data.set(progressKey('c'), 'null');
    expect(loadProgress(storage, 'a')).toEqual([]);
    expect(loadProgress(storage, 'b')).toEqual([]);
    expect(loadProgress(storage, 'c')).toEqual([]);
  });
});
