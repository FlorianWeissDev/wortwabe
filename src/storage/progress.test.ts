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
    saveProgress(storage, '2026-09-23', { foundWords: ['kern', 'rein'], revealed: true });
    saveProgress(storage, '2026-09-30', { foundWords: ['irre'], revealed: false });
    expect(loadProgress(storage, '2026-09-23')).toEqual({
      foundWords: ['kern', 'rein'],
      revealed: true,
    });
    expect(loadProgress(storage, '2026-09-30')).toEqual({ foundWords: ['irre'], revealed: false });
    expect(loadProgress(storage, '2026-10-07')).toEqual({ foundWords: [], revealed: false });
  });

  it('discards corrupt JSON', () => {
    const storage = memoryStorage();
    storage.data.set(progressKey('2026-09-23'), '{not json');
    expect(loadProgress(storage, '2026-09-23')).toEqual({ foundWords: [], revealed: false });
  });

  it('discards an unknown schema version or malformed shape', () => {
    const storage = memoryStorage();
    storage.data.set(progressKey('a'), JSON.stringify({ schemaVersion: 2, foundWords: ['x'] }));
    storage.data.set(progressKey('b'), JSON.stringify({ schemaVersion: 1, foundWords: [1] }));
    storage.data.set(progressKey('c'), 'null');
    expect(loadProgress(storage, 'a')).toEqual({ foundWords: [], revealed: false });
    expect(loadProgress(storage, 'b')).toEqual({ foundWords: [], revealed: false });
    expect(loadProgress(storage, 'c')).toEqual({ foundWords: [], revealed: false });
  });

  it('reads an old entry without the revealed field, or a non-boolean one, as not revealed', () => {
    const storage = memoryStorage();
    storage.data.set(progressKey('a'), JSON.stringify({ schemaVersion: 1, foundWords: ['x'] }));
    storage.data.set(
      progressKey('b'),
      JSON.stringify({ schemaVersion: 1, foundWords: ['x'], revealed: 'yes' }),
    );
    expect(loadProgress(storage, 'a')).toEqual({ foundWords: ['x'], revealed: false });
    expect(loadProgress(storage, 'b')).toEqual({ foundWords: ['x'], revealed: false });
  });
});
