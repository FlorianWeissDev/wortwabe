/**
 * Pure filtering rules for turning the raw word source into a playable
 * dictionary. Kept free of I/O so the decisions can be tested directly.
 */

/**
 * Parts of speech that make for playable words. Everything else — the source's
 * "other" bucket — is where proper nouns, abbreviations and foreign fragments
 * collect (GOETHE, WIKIPEDIA, BEARB), so it is dropped wholesale.
 */
export const COMMON_POS = ['noun', 'verb', 'adjective', 'adverb'] as const;

export type CommonPos = (typeof COMMON_POS)[number];

export interface SourceEntry {
  word: string;
  pos: string;
  freqTier: number;
}

/** Normalized key → the spelling shown to the player. */
export type Dictionary = Map<string, string>;

const PLAYABLE = /^[a-z]{4,}$/;

export function isCommonPos(pos: string): pos is CommonPos {
  return (COMMON_POS as readonly string[]).includes(pos);
}

/**
 * Playable words are plain a–z and at least four letters. Umlauts and ß fail
 * here rather than being transliterated (see plans/03-game-rules.md).
 */
export function isPlayableWord(word: string): boolean {
  return PLAYABLE.test(word.toLowerCase());
}

/** German capitalizes nouns and nothing else in this set. */
export function displayForm(word: string, pos: CommonPos): string {
  const lower = word.toLowerCase();
  if (pos !== 'noun') {
    return lower;
  }
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** Strips comments and blank lines from a hand-maintained list file. */
export function parseWordListFile(contents: string): string[] {
  return contents
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}

export interface BuildOptions {
  /** Words to remove, matched case-insensitively. */
  blocklist?: readonly string[];
  /** Extra words written in their display spelling, e.g. "Kaffee". */
  allowlist?: readonly string[];
}

export function buildDictionary(
  entries: readonly SourceEntry[],
  options: BuildOptions = {},
): Dictionary {
  const blocked = new Set((options.blocklist ?? []).map((word) => word.toLowerCase()));
  const dictionary: Dictionary = new Map();
  const nounKeys = new Set<string>();

  for (const entry of entries) {
    if (!isCommonPos(entry.pos) || !isPlayableWord(entry.word)) {
      continue;
    }
    const key = entry.word.toLowerCase();
    if (blocked.has(key)) {
      continue;
    }
    // A key can arrive as both noun and verb ("Leben" / "leben"). The noun
    // spelling wins so the found-words list reads as German prose.
    if (entry.pos === 'noun') {
      nounKeys.add(key);
      dictionary.set(key, displayForm(entry.word, entry.pos));
    } else if (!nounKeys.has(key)) {
      dictionary.set(key, displayForm(entry.word, entry.pos));
    }
  }

  for (const word of options.allowlist ?? []) {
    const key = word.toLowerCase();
    if (isPlayableWord(word) && !blocked.has(key)) {
      dictionary.set(key, word);
    }
  }

  return dictionary;
}

/** Sorted plain object, so the emitted JSON has a stable diff. */
export function toSortedRecord(dictionary: Dictionary): Record<string, string> {
  return Object.fromEntries([...dictionary.entries()].sort(([a], [b]) => a.localeCompare(b)));
}
