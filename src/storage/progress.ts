import type { PuzzleDate } from '../engine';

export type ProgressStorage = Pick<Storage, 'getItem' | 'setItem'>;

const SCHEMA_VERSION = 1;

export function progressKey(date: PuzzleDate): string {
  return `wortwabe:progress:${date}`;
}

export interface SavedProgress {
  foundWords: string[];
  revealed: boolean;
}

/**
 * Returns saved normalized words plus the reveal flag; a missing, corrupt or unknown-schema entry
 * yields an empty, unrevealed state. `revealed` is optional in the stored value.
 */
export function loadProgress(storage: ProgressStorage, date: PuzzleDate): SavedProgress {
  const empty = (): SavedProgress => ({ foundWords: [], revealed: false });
  try {
    const raw = storage.getItem(progressKey(date));
    if (raw === null) {
      return empty();
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return empty();
    }
    const { schemaVersion, foundWords, revealed } = parsed as Record<string, unknown>;
    if (
      schemaVersion !== SCHEMA_VERSION ||
      !Array.isArray(foundWords) ||
      !foundWords.every((word) => typeof word === 'string')
    ) {
      return empty();
    }
    return { foundWords: foundWords as string[], revealed: revealed === true };
  } catch {
    return empty();
  }
}

/** Best effort: storage may be full or blocked (private mode), which must not break play. */
export function saveProgress(
  storage: ProgressStorage,
  date: PuzzleDate,
  progress: { foundWords: readonly string[]; revealed: boolean },
): void {
  try {
    storage.setItem(
      progressKey(date),
      JSON.stringify({
        schemaVersion: SCHEMA_VERSION,
        foundWords: progress.foundWords,
        revealed: progress.revealed,
      }),
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
