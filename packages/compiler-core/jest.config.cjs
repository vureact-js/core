module.exports = {
  displayName: 'compiler-core',
  // 使用 ts-jest 的 ESM 预设，支持原生 ES Module 解析
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',

  // 将 .ts 和 .tsx 文件视为 ESM 模块
  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'vue'],

  moduleNameMapper: {
    // 模拟 ora 模块（终端 spinner 库，测试时无需实际展示）
    '^ora$': '<rootDir>/src/__tests__/mocks/ora.ts',
    // 路径别名映射，匹配 tsconfig 中的 paths 配置
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@compiler/(.*)$': '<rootDir>/src/compiler/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@parse/(.*)$': '<rootDir>/src/core/parse/$1',
    '^@transform/(.*)$': '<rootDir>/src/core/transform/$1',
    '^@codegen/(.*)$': '<rootDir>/src/core/codegen/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@consts/(.*)$': '<rootDir>/src/consts/$1',
    '^@plugins/(.*)$': '<rootDir>/src/plugins/$1',
    // 将相对路径中的 .js 后缀映射到实际的无后缀 TS 文件（ESM 兼容）
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // 测试文件匹配模式
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  // 忽略示例项目中的 .vureact 目录
  modulePathIgnorePatterns: ['<rootDir>/examples/.*/\\.vureact/'],

  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['json', 'json-summary', 'lcov', 'text'],
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/**/*.d.ts', // 排除类型声明文件
    '!<rootDir>/src/**/__tests__/**', // 排除测试文件自身
    '!<rootDir>/src/**/types/**', // 排除类型目录
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};
