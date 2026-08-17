import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

import svelteConfig from './svelte.config.js';

export default ts.config(
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
        svelteConfig,
      },
    },
  },
  {
    // German user-facing text belongs in src/locale only (see CLAUDE.md).
    // Tests and fixtures are exempt: German words are the data under test.
    files: ['src/**/*.ts', 'src/**/*.svelte'],
    ignores: ['src/locale/**', '**/*.test.ts', '**/__fixtures__/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/[äöüÄÖÜß]/]',
          message: 'German text belongs in src/locale/de.ts, not in components or logic.',
        },
      ],
    },
  },
  {
    ignores: ['dist/', 'dev-dist/', 'node_modules/', 'data/'],
  },
);
