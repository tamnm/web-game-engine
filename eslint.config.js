import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      'node_modules/**',
      '.turbo/**',
      'plugins/**',
      'docs/**',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, eslintConfigPrettier],
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },
  {
    files: ['**/*.{js,cjs,mjs}'],
    extends: [js.configs.recommended, eslintConfigPrettier],
    languageOptions: {
      globals: {
        ...globals.node,
        console: true,
      },
    },
  }
);
