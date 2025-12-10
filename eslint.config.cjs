// eslint.config.cjs - ESLint 9 flat config

const tsParser = require('@typescript-eslint/parser')
const tsPlugin = require('@typescript-eslint/eslint-plugin')
const prettierPlugin = require('eslint-plugin-prettier')

/** @type {import('eslint').FlatConfig.ConfigArray} */
module.exports = [
  // Global ignore patterns
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**'],
  },

  // TypeScript (+ TSX for React) files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true, // ✅ allow JSX
        },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      // TS recommended rules
      ...tsPlugin.configs.recommended.rules,

      // Allow intentionally unused vars if they start with "_"
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Run Prettier as an ESLint rule
      'prettier/prettier': 'error',
    },
  },
]
