import js from '@eslint/js';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier'; // 用于禁用冲突规则
import prettierPlugin from 'eslint-plugin-prettier';

const FILES_TO_CHECK = ['**/*.ts'];

export default [
  {
    ignores: ['**/*.config.*', '**/*dist/', 'node_modules/', '**/*.json', '**/*.md'],
  },

  // -------------------------------------------------------
  // 1. 基础配置 (仅适用于 TS/TSX 文件)
  // -------------------------------------------------------
  {
    files: FILES_TO_CHECK,
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        es2021: true,
      },
    },
    rules: {
      'no-unused-vars': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // -------------------------------------------------------
  // 2. TypeScript / React 核心配置
  // -------------------------------------------------------
  {
    files: FILES_TO_CHECK,
    languageOptions: {
      parser: typescriptParser,
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
    },
    rules: {
      // TypeScript 规则
      ...typescriptPlugin.configs.recommended.rules,

      // 不检查 @ts-ignore, @ts-expect-error 等注释
      '@typescript-eslint/ban-ts-comment': 'off',

      // 允许使用 any 类型
      '@typescript-eslint/no-explicit-any': 'off',

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },

  // -------------------------------------------------------
  // 3. Prettier 配置 (仅适用于 TS/TSX 文件)
  // -------------------------------------------------------
  {
    files: FILES_TO_CHECK,
    ...prettierConfig, // 禁用冲突规则
  },

  {
    files: FILES_TO_CHECK, // 关键：只匹配 .ts 和 .tsx
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'off',
    },
  },
];
