module.exports = {
  displayName: 'runtime-core',

  preset: 'ts-jest',

  testEnvironment: 'jsdom',

  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],

  transformIgnorePatterns: ['/node_modules/'],

  testMatch: ['<rootDir>/src/**/__tests__/**/*.(test|spec).(ts|tsx)'],
};
