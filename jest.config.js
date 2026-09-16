module.exports = {
  displayName: 'app',
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['browser', 'default'],
    url: 'https://app.example.com/',
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    // AudioSettings pulls in Juno's ESM tree, which jest does not transform.
    // Heavy micro-* packages are stubbed rather than transformed here.
    '^@ringcentral-integration/micro-phone/src/app/services/AudioSettings$':
      '<rootDir>/test/mocks/audioSettingsMock.js',
    '^@ringcentral-integration/next-core$':
      '<rootDir>/test/mocks/nextCoreMock.js',
    '^@ringcentral-integration/micro-(auth|contacts|core|meeting|message|phone)/src/app/services$':
      '<rootDir>/test/mocks/microServicesMock.js',
    '^@ringcentral-integration/micro-core/src/app/hooks$':
      '<rootDir>/test/mocks/microHooksMock.js',
    '^@ringcentral-integration/micro-phone/src/app/components/ReferenceWidgetSpring$':
      '<rootDir>/test/mocks/referenceWidgetSpringMock.js',
    '^@ringcentral/spring-ui$': '<rootDir>/test/mocks/springUiMock.js',
    '^@ringcentral/spring-icon$': '<rootDir>/test/mocks/springIconMock.js',
    '^@ringcentral-integration/jsonschema-spring-page$':
      '<rootDir>/test/mocks/jsonSchemaPageMock.js',
    '^\\./loadLocale$': '<rootDir>/test/mocks/loadLocaleMock.js',
    '\\.(css|scss|sass)$': '<rootDir>/test/mocks/styleMock.js',
    '\\.(png|jpg|jpeg|gif|svg|ico|mp3|wav|ogg)(\\?url(?:Loader)?)?$':
      '<rootDir>/test/mocks/fileMock.js',
  },
  modulePathIgnorePatterns: [
    '<rootDir>/packages/jsonschema-page/npm-package',
    '<rootDir>/packages/jsonschema-spring-page/npm-package',
  ],
  testMatch: ['<rootDir>/test/**/*.test.[jt]s?(x)'],
  collectCoverageFrom: [
    '<rootDir>/src/app/services/{CallViewState,MatchedContactSelection,NoiseReduction,SmartNotes,TabManager,ThirdParty,VoicemailDrop}/**/*.{ts,tsx}',
    '<rootDir>/src/app/components/MatchedContactsTag/**/*.{ts,tsx}',
    '<rootDir>/src/app/views/{ExpandedRouteView,SettingsView,SideWidgetView,VoicemailDropSettingsView,VoicemailDropView}/**/*.{ts,tsx}',
    '<rootDir>/src/app/views/CallView/CallControlView/CallControl.helper.ts',
    '!<rootDir>/src/**/*.interface.ts',
    '!<rootDir>/src/**/index.ts',
    '!<rootDir>/src/**/i18n/**',
  ],
  coverageDirectory: '<rootDir>/coverage/app',
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
