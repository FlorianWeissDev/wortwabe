import { describe, expect, it } from 'vitest';

import {
  buildDictionary,
  displayForm,
  isCommonPos,
  isPlayableWord,
  parseWordListFile,
  toSortedRecord,
  type SourceEntry,
} from './filters';

describe('isPlayableWord', () => {
  it('accepts plain words of at least four letters', () => {
    expect(isPlayableWord('KISTE')).toBe(true);
    expect(isPlayableWord('kern')).toBe(true);
  });

  it('rejects words that are too short', () => {
    expect(isPlayableWord('EIS')).toBe(false);
  });

  it('rejects umlauts, ß and anything that is not a letter', () => {
    expect(isPlayableWord('SÄTZE')).toBe(false);
    expect(isPlayableWord('STRAßE')).toBe(false);
    expect(isPlayableWord('E-MAIL')).toBe(false);
    expect(isPlayableWord('COVID19')).toBe(false);
  });
});

describe('isCommonPos', () => {
  it('accepts the four playable parts of speech', () => {
    expect(isCommonPos('noun')).toBe(true);
    expect(isCommonPos('verb')).toBe(true);
    expect(isCommonPos('adjective')).toBe(true);
    expect(isCommonPos('adverb')).toBe(true);
  });

  it('rejects the bucket that holds proper nouns and abbreviations', () => {
    expect(isCommonPos('other')).toBe(false);
    expect(isCommonPos('')).toBe(false);
  });
});

describe('displayForm', () => {
  it('capitalizes nouns, as German orthography requires', () => {
    expect(displayForm('ERKENNTNIS', 'noun')).toBe('Erkenntnis');
  });

  it('lowercases every other part of speech', () => {
    expect(displayForm('STINKT', 'verb')).toBe('stinkt');
    expect(displayForm('EKLIG', 'adjective')).toBe('eklig');
    expect(displayForm('HERAB', 'adverb')).toBe('herab');
  });
});

describe('parseWordListFile', () => {
  it('keeps words and drops comments, blanks and stray whitespace', () => {
    const contents = '# curated by hand\n\nKaffee\n  Tee  \n\n# section\nMilch\n';
    expect(parseWordListFile(contents)).toEqual(['Kaffee', 'Tee', 'Milch']);
  });

  it('returns nothing for an empty file', () => {
    expect(parseWordListFile('')).toEqual([]);
  });
});

describe('buildDictionary', () => {
  const entries: readonly SourceEntry[] = [
    { word: 'KISTE', pos: 'noun', freqTier: 1 },
    { word: 'STINKT', pos: 'verb', freqTier: 1 },
    { word: 'EKLIG', pos: 'adjective', freqTier: 2 },
    { word: 'GOETHE', pos: 'other', freqTier: 2 },
    { word: 'SÄTZE', pos: 'noun', freqTier: 1 },
    { word: 'EIS', pos: 'noun', freqTier: 1 },
  ];

  it('keeps playable words with their display spelling', () => {
    expect(toSortedRecord(buildDictionary(entries))).toEqual({
      eklig: 'eklig',
      kiste: 'Kiste',
      stinkt: 'stinkt',
    });
  });

  it('drops proper nouns via the part-of-speech bucket they land in', () => {
    expect(buildDictionary(entries).has('goethe')).toBe(false);
  });

  it('prefers the noun spelling when a word is both noun and verb', () => {
    const both: SourceEntry[] = [
      { word: 'LEBEN', pos: 'verb', freqTier: 1 },
      { word: 'LEBEN', pos: 'noun', freqTier: 1 },
    ];
    expect(buildDictionary(both).get('leben')).toBe('Leben');
    // Order of arrival must not change the outcome.
    expect(buildDictionary([...both].reverse()).get('leben')).toBe('Leben');
  });

  it('removes blocked words case-insensitively', () => {
    const dictionary = buildDictionary(entries, { blocklist: ['kiste', 'STINKT'] });
    expect(dictionary.has('kiste')).toBe(false);
    expect(dictionary.has('stinkt')).toBe(false);
    expect(dictionary.has('eklig')).toBe(true);
  });

  it('adds allowlisted words with the spelling the curator wrote', () => {
    const dictionary = buildDictionary(entries, { allowlist: ['Kaffee'] });
    expect(dictionary.get('kaffee')).toBe('Kaffee');
  });

  it('lets the blocklist win over the allowlist', () => {
    const dictionary = buildDictionary(entries, {
      allowlist: ['Kaffee'],
      blocklist: ['Kaffee'],
    });
    expect(dictionary.has('kaffee')).toBe(false);
  });

  it('ignores allowlist entries that are not playable', () => {
    const dictionary = buildDictionary(entries, { allowlist: ['Käse', 'Ei'] });
    expect(dictionary.has('käse')).toBe(false);
    expect(dictionary.has('ei')).toBe(false);
  });
});

describe('toSortedRecord', () => {
  it('sorts keys so the emitted file has a stable diff', () => {
    const dictionary = new Map([
      ['zebra', 'Zebra'],
      ['apfel', 'Apfel'],
      ['mango', 'Mango'],
    ]);
    expect(Object.keys(toSortedRecord(dictionary))).toEqual(['apfel', 'mango', 'zebra']);
  });
});
