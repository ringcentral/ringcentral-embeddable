module.exports = {
  displayName: 'unit',
  testEnvironment: 'node',
  modulePathIgnorePatterns: [
    '<rootDir>/packages/jsonschema-page/npm-package',
    '<rootDir>/packages/jsonschema-spring-page/npm-package',
  ],
  setupFiles: ['<rootDir>/test/unit/setup.js'],
  moduleNameMapper: {
    '^react-router$': 'react-router-v3',
    '^\\./loadLocale$': '<rootDir>/test/mocks/loadLocaleMock.js',
  },
  testMatch: [
    '<rootDir>/test/unit/**/*.test.[jt]s?(x)',
    '<rootDir>/test/unit/**/*.test.ts?(x)',
  ],
};
