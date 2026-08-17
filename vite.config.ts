import { svelte } from '@sveltejs/vite-plugin-svelte';
// vitest/config re-exports Vite's defineConfig with the `test` block typed.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [svelte()],
  test: {
    include: ['src/**/*.test.ts', 'tools/**/*.test.ts'],
  },
});
