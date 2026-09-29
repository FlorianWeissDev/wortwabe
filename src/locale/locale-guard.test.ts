import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { expect, it } from 'vitest';

/**
 * German user-facing text may only live in src/locale. This is a heuristic
 * backstop: it catches umlauts and ß, not German text written without them.
 */
const SRC = join(import.meta.dirname, '..');
const GERMAN_CHAR = /[äöüÄÖÜß]/;
const GERMAN_STRING = /(['"`])[^'"`]*[äöüÄÖÜß][^'"`]*\1/;
const COMMENT = /^(\/\/|\/\*|\*|<!--)/;

function isChecked(path: string): boolean {
  const rel = relative(SRC, path);
  return (
    /\.(ts|svelte)$/.test(rel) &&
    !rel.startsWith('locale/') &&
    !rel.endsWith('.test.ts') &&
    !rel.includes('__fixtures__')
  );
}

it('keeps German text out of everything but src/locale', () => {
  const violations: string[] = [];
  const files = readdirSync(SRC, { recursive: true, encoding: 'utf8' }).map((f) => join(SRC, f));

  for (const file of files.filter(isChecked)) {
    // In .svelte files markup text counts too, so any umlaut line is suspect.
    const pattern = file.endsWith('.svelte') ? GERMAN_CHAR : GERMAN_STRING;
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (!COMMENT.test(line.trim()) && pattern.test(line)) {
          violations.push(`${relative(SRC, file)}:${String(i + 1)}`);
        }
      });
  }

  expect(violations, 'German text belongs in src/locale/de.ts').toEqual([]);
});
