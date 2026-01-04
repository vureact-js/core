module.exports = {
  displayName: 'runtime-core',

  preset: 'ts-jest',

  testEnvironment: 'jsdom',

  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],

  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],

  transformIgnorePatterns: ['/node_modules/'],

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
