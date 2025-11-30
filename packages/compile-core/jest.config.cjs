module.exports = {
  displayName: "compile-core",
  testEnvironment: "node",
  transform: {
    "^.+\\.ts$": "ts-jest"
  },
  moduleFileExtensions: ["ts", "js"],
  testMatch: ["<rootDir>/src/**/__tests__/**/*.(test|spec).ts"],
};
