import js from '@eslint/js';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';

export default [
  js.configs.recommended,
  {
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // Require .js extension on relative imports
      'import/extensions': ['error', 'ignorePackages', { js: 'always', jsx: 'never' }],

      // Enforce architectural boundaries
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            // controllers cannot import repositories
            {
              group: ['**/**.repository*'],
              message: 'Controllers may not import repositories directly.',
            },
            // repositories cannot import services
            {
              group: ['**/**.service*'],
              message: 'Repositories may not import services.',
            },
            // @prisma/client allowed only in specific files
            {
              group: ['@prisma/client'],
              message:
                '@prisma/client may only be imported by *.repository.js, prisma/seed.js, src/lib/prisma.js, src/common/errors/prismaErrorMapper.js, and server/tests/ files.',
            },
            // ioredis allowed only in src/lib/redis.js
            {
              group: ['ioredis'],
              message: 'ioredis may only be imported by src/lib/redis.js.',
            },
            // client features must import through the feature index
            {
              group: ['../*/components/*', '../*/hooks/*', '../*/pages/*', '../*/context/*'],
              message: "Import from the feature's index.js only.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.jsx'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },
  {
    ignores: ['node_modules/', 'dist/', 'coverage/', '*.config.cjs'],
  },
];
