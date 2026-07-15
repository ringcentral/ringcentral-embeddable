module.exports = {
  displayName: 'integration',
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'require', 'default'],
  },
  setupFiles: [
    '@ringcentral-integration/mock/setup.ts',
  ],
  setupFilesAfterEnv: [
    '<rootDir>/test/integration/setup.js',
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!@ringcentral-integration/mock/)',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/packages/jsonschema-page/npm-package',
  ],
  moduleNameMapper: {
    '^@ringcentral-integration/commons/modules/SleepDetector$': '<rootDir>/test/mocks/SleepDetectorMock.js',
    '^\\./loadLocale$': '<rootDir>/test/mocks/loadLocaleMock.js',
    '^quill$': '<rootDir>/test/mocks/quillMock.js',
    '^quill-mention$': '<rootDir>/test/mocks/quillMentionMock.js',
    '^react-markdown$': '<rootDir>/test/mocks/reactMarkdownMock.js',
    '\\.(css|scss|sass)$': '<rootDir>/test/mocks/styleMock.js',
    '\\.(png|jpg|jpeg|gif|svg|mp3|wav|ogg)(\\?urlLoader)?$': '<rootDir>/test/mocks/fileMock.js',
  },
  testMatch: [
    '<rootDir>/test/integration/**/*.test.[jt]s?(x)',
    '<rootDir>/test/integration/**/*.test.ts?(x)',
  ],
};
