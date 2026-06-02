// Flat ESLint config (ESLint 10).
// TypeScript + Astro recommended rules; Prettier disables stylistic conflicts.
// Type-checked rules are intentionally left off for now to keep lint fast — they can be
// layered on once more app code exists. Accessibility (#46): eslint-plugin-astro's
// flat/jsx-a11y-recommended registers the full jsx-a11y ruleset globally (its last entry has
// no `files` filter), so the 34 a11y rules run over both .astro templates and React islands
// (.tsx) — a11y regressions fail CI. NB: eslint-plugin-jsx-a11y is a required peer dep of that
// config (devDependency), not bundled — keep it installed.
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
  // a11y rules for .astro templates and React islands (see header note).
  astro.configs['flat/jsx-a11y-recommended'],
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
