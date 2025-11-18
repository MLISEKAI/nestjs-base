import tseslint from 'typescript-eslint';
import eslintPluginPrettier from 'eslint-plugin-prettier';

export default tseslint.config({
  files: ['**/*.ts'],
  ignores: ['dist/**', 'dist-v2/**', 'eslint.config.mjs'],
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      project: './tsconfig.eslint.json',
      tsconfigRootDir: import.meta.dirname,
    },
  },
  plugins: {
    prettier: eslintPluginPrettier,
  },
  rules: {
    'prettier/prettier': 'error',
  },
});
