module.exports = {
  displayName: 'next',
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['browser', 'default'],
    url: 'https://app.example.com/',
  },
  setupFilesAfterEnv: ['<rootDir>/test/next/setup.js'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@ringcentral-integration/next-core$':
      '<rootDir>/test/next/mocks/nextCoreMock.js',
    '^@ringcentral-integration/micro-(auth|contacts|core|meeting|message|phone)/src/app/services$':
      '<rootDir>/test/next/mocks/microServicesMock.js',
    '^@ringcentral-integration/micro-core/src/app/hooks$':
      '<rootDir>/test/next/mocks/microHooksMock.js',
    '^@ringcentral/spring-ui$': '<rootDir>/test/next/mocks/springUiMock.js',
    '^@ringcentral/spring-icon$': '<rootDir>/test/next/mocks/springIconMock.js',
    '^@ringcentral-integration/jsonschema-spring-page$':
      '<rootDir>/test/next/mocks/jsonSchemaPageMock.js',
    '^\\./loadLocale$': '<rootDir>/test/next/mocks/loadLocaleMock.js',
    '\\.(css|scss|sass)$': '<rootDir>/test/next/mocks/styleMock.js',
    '\\.(png|jpg|jpeg|gif|svg|ico|mp3|wav|ogg)(\\?urlLoader)?$':
      '<rootDir>/test/next/mocks/fileMock.js',
  },
  modulePathIgnorePatterns: [
    '<rootDir>/packages/jsonschema-page/npm-package',
    '<rootDir>/packages/jsonschema-spring-page/npm-package',
  ],
  testMatch: ['<rootDir>/test/next/**/*.test.[jt]s?(x)'],
  collectCoverageFrom: [
    '<rootDir>/next/app/services/{NoiseReduction,SmartNotes,TabManager,ThirdParty,VoicemailDrop}/**/*.{ts,tsx}',
    '<rootDir>/next/app/views/{SideWidgetView,VoicemailDropSettingsView,VoicemailDropView}/**/*.{ts,tsx}',
    '<rootDir>/next/app/views/CallView/CallControlView/CallControl.helper.ts',
    '!<rootDir>/next/**/*.interface.ts',
    '!<rootDir>/next/**/index.ts',
    '!<rootDir>/next/**/i18n/**',
  ],
  coverageDirectory: '<rootDir>/coverage/next',
  coverageReporters: ['text', 'json-summary', 'lcov'],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};
