import js from '@eslint/js';
import ts from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
export default ts.config(
  { ignores: ['.cache', 'dist', 'node_modules', 'playwright-report', 'test-results'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': hooks },
    rules: { ...hooks.configs.recommended.rules },
  },
  { files: ['**/*.{js,mjs}'], languageOptions: { globals: globals.node } },
  {
    files: ['scripts/build-preview-atlases.mjs'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
);
