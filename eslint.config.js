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

      // Enforce architectural boundaries globally
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
            // @prisma/client allowed ONLY in specific files (overridden below)
            {
              group: ['@prisma/client'],
              message:
                '@prisma/client may only be imported by *.repository.js, prisma/seed.js, src/lib/prisma.js, src/common/errors/prismaErrorMapper.js, and server/tests/ files.',
            },
            // ioredis allowed ONLY in src/lib/redis.js (overridden below)
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
  // Allow @prisma/client in designated files per architecture
  {
    files: [
      '**/*.repository.js',
      '**/prisma/seed.js',
      '**/src/lib/prisma.js',
      '**/src/common/errors/prismaErrorMapper.js',
      '**/server/tests/**/*',
      '**/*.test.js',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/**.repository*'],
              message: 'Controllers may not import repositories directly.',
            },
            {
              group: ['**/**.service*'],
              message: 'Repositories may not import services.',
            },
            {
              group: ['ioredis'],
              message: 'ioredis may only be imported by src/lib/redis.js.',
            },
            {
              group: ['../*/components/*', '../*/hooks/*', '../*/pages/*', '../*/context/*'],
              message: "Import from the feature's index.js only.",
            },
          ],
        },
      ],
    },
  },
  // Allow ioredis in src/lib/redis.js
  {
    files: ['**/src/lib/redis.js', '**/server/tests/setup/test-redis.js'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@prisma/client'],
              message: '@prisma/client is not allowed in redis files.',
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
