import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  eslint.configs.recommended,
  {
    languageOptions: {
      globals: globals.node,
    },
  },
  eslintConfigPrettier,
];
