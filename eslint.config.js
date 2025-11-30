import js from '@eslint/js';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier'; // 用于禁用冲突规则
import prettierPlugin from 'eslint-plugin-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

const FILES_TO_CHECK = ['**/*.{ts,tsx}'];

export default [
  {
    ignores: ['**/*.config.*', '**/lib/', 'node_modules/', '**/node_modules/', '**/*.json', '**/*.md', '__tests__/', '**/__tests__/'],
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
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: {
        version: 'detect', // 自动检测 React 版本
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
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

      // 启用 React Hooks 推荐规则 (包含 rules-of-hooks 和 exhaustive-deps)
      ...reactHooksPlugin.configs.recommended.rules,
      // 不检查 hook 的使用方式
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'warn',
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
