import type { PuzzleDate } from '../engine';

export type ProgressStorage = Pick<Storage, 'getItem' | 'setItem'>;

const SCHEMA_VERSION = 1;

export function progressKey(date: PuzzleDate): string {
  return `wortwabe:progress:${date}`;
}

/** Returns saved normalized words; a missing, corrupt or unknown-schema entry yields `[]`. */
export function loadProgress(storage: ProgressStorage, date: PuzzleDate): string[] {
  try {
    const raw = storage.getItem(progressKey(date));
    if (raw === null) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return [];
    }
    const { schemaVersion, foundWords } = parsed as Record<string, unknown>;
    if (
      schemaVersion !== SCHEMA_VERSION ||
      !Array.isArray(foundWords) ||
      !foundWords.every((word) => typeof word === 'string')
    ) {
      return [];
    }
    return foundWords as string[];
  } catch {
    return [];
  }
}

/** Best effort: storage may be full or blocked (private mode), which must not break play. */
export function saveProgress(
  storage: ProgressStorage,
  date: PuzzleDate,
  foundWords: readonly string[],
): void {
  try {
    storage.setItem(
      progressKey(date),
      JSON.stringify({ schemaVersion: SCHEMA_VERSION, foundWords }),
    );
  } catch {
    // Progress simply stays in memory for this session.
  }
}

/** `localStorage`, or an in-memory stand-in when even touching it throws. */
export function browserStorage(): ProgressStorage {
  try {
    const storage = window.localStorage;
    storage.getItem(progressKey('probe'));
    return storage;
  } catch {
    const memory = new Map<string, string>();
    return {
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => {
        memory.set(key, value);
      },
    };
  }
}
