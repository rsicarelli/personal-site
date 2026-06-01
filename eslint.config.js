// Flat ESLint config (ESLint 10).
// TypeScript + Astro recommended rules; Prettier disables stylistic conflicts.
// Type-checked rules are intentionally left off for now to keep lint fast — they can be
// layered on once more app code exists. The jsx-a11y ruleset is deferred to the design
// epic (#46): eslint-plugin-astro's bundled jsx-a11y config isn't ESLint 10-compatible yet.
import { defineConfig } from 'eslint/config';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default defineConfig([
  {
    ignores: ['dist/', '.astro/', 'node_modules/', '.agents/'],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    // Astro's generated ambient types (src/env.d.ts) use a triple-slash reference by
    // convention — allow it in declaration files.
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
  // Keep last: turn off rules that conflict with Prettier formatting.
  prettier,
]);
