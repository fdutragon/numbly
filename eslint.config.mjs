import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      '.next/**/*',
      'out/**/*',
      'build/**/*',
      'dist/**/*',
      'node_modules/**/*',
      '*.log',
      'coverage/**/*',
      'public/sw.js',
      'public/sw.js.map',
      'public/workbox-*.js',
      'public/workbox-*.js.map',
    ],
  },
  {
    files: [
      'src/app/**/*.{js,ts,tsx}',
      'src/components/**/*.{js,ts,tsx}',
      'src/lib/**/*.{js,ts,tsx}',
    ],
    rules: {
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
];

export default eslintConfig;
