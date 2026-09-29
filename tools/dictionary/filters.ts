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
  clues?: { text: string }[];
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

export interface EszettEvidence {
  /** Keys seen in clue texts written with ß, transliterated to ss. */
  eszettEvidence: Set<string>;
  /** Keys seen in clue texts written with a genuine ss. */
  ssEvidence: Set<string>;
}

/**
 * The source stores words in uppercase, where ß becomes SS, so Straße arrives
 * as "strasse" and cannot be told apart from Wasser. Clue texts are normal
 * mixed-case sentences and still carry the real spelling.
 */
export function extractEszettEvidence(entries: readonly SourceEntry[]): EszettEvidence {
  const eszettEvidence = new Set<string>();
  const ssEvidence = new Set<string>();
  for (const entry of entries) {
    for (const clue of entry.clues ?? []) {
      for (const token of clue.text.toLowerCase().match(/[a-zäöüß]+/g) ?? []) {
        if (token.includes('ß')) {
          eszettEvidence.add(token.replaceAll('ß', 'ss'));
        } else if (token.includes('ss')) {
          ssEvidence.add(token);
        }
      }
    }
  }
  return { eszettEvidence, ssEvidence };
}

export interface EszettContext extends EszettEvidence {
  /** Substrings (in ss form) that always originate from ß. */
  stems: readonly string[];
}

/**
 * True for keys that stem from a word spelled with ß. Genuine ss evidence
 * always wins, so ambiguous words (Masse/Maße, schoss) are kept.
 */
export function isEszettWord(key: string, context: EszettContext): boolean {
  if (context.ssEvidence.has(key)) {
    return false;
  }
  return context.eszettEvidence.has(key) || context.stems.some((stem) => key.includes(stem));
}

export interface BuildOptions {
  /** Words to remove, matched case-insensitively. */
  blocklist?: readonly string[];
  /** Extra words written in their display spelling, e.g. "Kaffee". */
  allowlist?: readonly string[];
  /** ß-origin detection; entries are dropped when isEszettWord matches. */
  eszettStems?: readonly string[];
}

export function buildDictionary(
  entries: readonly SourceEntry[],
  options: BuildOptions = {},
): Dictionary {
  const blocked = new Set((options.blocklist ?? []).map((word) => word.toLowerCase()));
  const dictionary: Dictionary = new Map();
  const eszett: EszettContext = {
    ...extractEszettEvidence(entries),
    stems: options.eszettStems ?? [],
  };
  const nounKeys = new Set<string>();

  for (const entry of entries) {
    if (!isCommonPos(entry.pos) || !isPlayableWord(entry.word)) {
      continue;
    }
    const key = entry.word.toLowerCase();
    if (blocked.has(key) || isEszettWord(key, eszett)) {
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
