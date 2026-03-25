// @ts-check
import eslint from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import jsdoc from 'eslint-plugin-jsdoc'

export default [
  // Base ESLint recommended config
  eslint.configs.recommended,

  // Configuration for JavaScript files
  // {
  //   files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
  //   plugins: {
  //     jsdoc,
  //   },
  //   languageOptions: {
  //     ecmaVersion: 2022,
  //     sourceType: 'module',
  //     globals: {
  //       // Node.js globals
  //       console: 'readonly',
  //       process: 'readonly',
  //       Buffer: 'readonly',
  //       __dirname: 'readonly',
  //       __filename: 'readonly',
  //       require: 'readonly',
  //       module: 'readonly',
  //       exports: 'readonly',
  //       global: 'readonly',
  //       setTimeout: 'readonly',
  //       setInterval: 'readonly',
  //       clearTimeout: 'readonly',
  //       clearInterval: 'readonly',
  //     },
  //   },
  //   rules: {
  //     // Relaxed rules for gradual migration
  //     'no-unused-vars': [
  //       'warn',
  //       {
  //         argsIgnorePattern: '^_',
  //         varsIgnorePattern: '^_',
  //         caughtErrorsIgnorePattern: '^_',
  //       },
  //     ],
  //     'no-undef': 'warn',
  //     'no-console': 'warn',
  //     'no-constant-condition': 'warn',
  //     'no-case-declarations': 'warn',

  //     // JSDoc rules (optional but helpful)
  //     'jsdoc/check-alignment': 'warn',
  //     'jsdoc/check-indentation': 'warn',
  //     'jsdoc/check-param-names': 'warn',
  //     'jsdoc/check-syntax': 'warn',
  //     'jsdoc/check-tag-names': 'warn',
  //     'jsdoc/check-types': 'warn', // TypeScript will handle this
  //     'jsdoc/require-description': 'warn',
  //     'jsdoc/require-param': 'warn',
  //     'jsdoc/require-param-description': 'warn',
  //     'jsdoc/require-param-type': 'warn',
  //     'jsdoc/require-returns': 'warn',
  //     'jsdoc/require-returns-description': 'warn',
  //     'jsdoc/require-returns-type': 'warn',
  //   },
  // },

  // Configuration for TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': tseslint,
      jsdoc,
    },
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: true,
      },
    },
    rules: {
      // Disable base rules that are covered by TypeScript
      'no-unused-vars': 'off',
      'no-undef': 'off',

      // TypeScript-specific rules (very permissive)
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/no-require-imports': 'error',

      // Keep these warnings to gradually improve code
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/await-thenable': 'warn',

      // JSDoc rules
      'jsdoc/check-alignment': 'warn',
      'jsdoc/check-indentation': 'warn',
      'jsdoc/check-param-names': 'warn',
      'jsdoc/check-syntax': 'warn',
      'jsdoc/check-tag-names': 'warn',
      'jsdoc/check-types': 'warn',
      'jsdoc/require-description': 'warn',
      'jsdoc/require-param': 'warn',
      'jsdoc/require-param-description': 'warn',
      'jsdoc/require-param-type': 'warn',
      'jsdoc/require-returns': 'warn',
      'jsdoc/require-returns-description': 'warn',
      'jsdoc/require-returns-type': 'warn',
    },
  },

  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '**/dist/**',
      'build/**',
      'logs/**',
      '.git/**',
      'coverage/**',
      '*.min.js',
      '**/.wrangler/**',
      'api/**', // API workspace has its own lint pipeline (bun api:check)
      'types/api/**', // API types use a separate tsconfig (api/tsconfig.json)
      'tests/**', // Tests use bun:test, not eslint
      'release.config.js', // CJS files
      'cli/release.config.js',
    ],
  },
]
