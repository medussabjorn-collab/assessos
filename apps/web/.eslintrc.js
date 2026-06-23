/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['plugin:@typescript-eslint/recommended'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  rules: {
    // Downgrade to warn so existing `any` doesn't block CI on day 1.
    // Tighten to 'error' once codebase is annotated.
    '@typescript-eslint/no-explicit-any': 'warn',
    // Unused vars are real bugs; allow underscore-prefixed intentional ignores.
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    // React 17+ JSX transform — no need to import React.
    'react/react-in-jsx-scope': 'off',
    // empty-object-type triggers on Next.js PageProps pattern.
    '@typescript-eslint/no-empty-object-type': 'off',
  },
  ignorePatterns: ['.next/', 'node_modules/', 'dist/', '*.config.js', '*.config.ts', 'e2e/'],
};
