// core/packages/runtime-core/jest.config.cjs
module.exports = {
  displayName: 'runtime-core',
  preset: 'ts-jest',
  testEnvironment: 'jsdom',

  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],

  // 强制使用相同版本的react和react-dom
  moduleNameMapper: {
    '^react$': require.resolve('react'),
    '^react-dom$': require.resolve('react-dom'),
    '^react-dom/client$': require.resolve('react-dom/client'),
  },

  // 确保不忽略react相关模块
  transformIgnorePatterns: ['/node_modules/(?!(react|react-dom|@testing-library)/)'],

  testMatch: ['<rootDir>/src/**/__tests__/**/*.(test|spec).(ts|tsx)'],

  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
