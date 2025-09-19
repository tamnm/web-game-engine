import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/coverage/**', 'node_modules/**', '.turbo/**', 'plugins/**'],
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
  }
);
