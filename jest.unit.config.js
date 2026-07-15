module.exports = {
  displayName: 'unit',
  testEnvironment: 'node',
  modulePathIgnorePatterns: [
    '<rootDir>/packages/jsonschema-page/npm-package',
  ],
  moduleNameMapper: {
    '^\\./loadLocale$': '<rootDir>/test/mocks/loadLocaleMock.js',
  },
  testMatch: [
    '<rootDir>/test/unit/**/*.test.[jt]s?(x)',
    '<rootDir>/test/unit/**/*.test.ts?(x)',
  ],
};
