/**
 * Builds data/dictionary/words.json from the word bank.
 *
 * Run with: npx tsx tools/build-dictionary.ts
 */
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getEntries } from 'open-crossword-bank/de';

import {
  buildDictionary,
  parseWordListFile,
  toSortedRecord,
  type SourceEntry,
} from './dictionary/filters';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const dictionaryDir = join(projectRoot, 'data', 'dictionary');

function readListFile(name: string): string[] {
  const path = join(dictionaryDir, name);
  return existsSync(path) ? parseWordListFile(readFileSync(path, 'utf8')) : [];
}

async function main(): Promise<void> {
  // The enriched subset is the one carrying part-of-speech tags, which is what
  // lets us drop proper nouns and capitalize the rest correctly.
  const entries = getEntries({ count: Number.MAX_SAFE_INTEGER }) as SourceEntry[];
  const allowlist = readListFile('allowlist.txt');
  const blocklist = readListFile('blocklist.txt');
  const eszettStems = readListFile('eszett-stems.txt');

  const dictionary = buildDictionary(entries, { allowlist, blocklist, eszettStems });
  const words = toSortedRecord(dictionary);

  await mkdir(dictionaryDir, { recursive: true });
  await writeFile(join(dictionaryDir, 'words.json'), `${JSON.stringify(words, null, 0)}\n`, 'utf8');

  const lengths = new Map<number, number>();
  for (const key of Object.keys(words)) {
    lengths.set(key.length, (lengths.get(key.length) ?? 0) + 1);
  }
  const byLength = [...lengths.entries()]
    .sort(([a], [b]) => a - b)
    .map(([length, count]) => `${String(length)}:${String(count)}`)
    .join(' ');

  process.stdout.write(
    [
      `source entries:   ${String(entries.length)}`,
      `allowlist:        ${String(allowlist.length)}`,
      `blocklist:        ${String(blocklist.length)}`,
      `eszett stems:     ${String(eszettStems.length)}`,
      `dictionary words: ${String(Object.keys(words).length)}`,
      `by length:        ${byLength}`,
      '',
    ].join('\n'),
  );
}

await main();
