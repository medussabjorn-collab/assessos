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
    node: true,
    es2022: true,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    // NestJS controller stubs declare params for type documentation but don't use them yet.
    // args:'none' skips unused-param errors; local vars are still enforced.
    '@typescript-eslint/no-unused-vars': ['error', { args: 'none', varsIgnorePattern: '^_' }],
    // NestJS uses interface-name conventions and explicit return types are noisy
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    // Decorators use empty interfaces for DI tokens
    '@typescript-eslint/no-empty-object-type': 'off',
    // NestJS services often receive injected deps that TypeScript types as `any`
    '@typescript-eslint/no-unsafe-assignment': 'off',
  },
  ignorePatterns: ['node_modules/', 'dist/', 'prisma/'],
};
