module.exports = {
  projects: [
    '<rootDir>/jest.unit.config.js',
    '<rootDir>/jest.integration.config.js',
    '<rootDir>/jest.e2e.config.js',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  preset: 'jest-puppeteer',
  globals: {
    __HOST_URI__: process.env.TEST_HOST_URI,
    __JWT_TOKEN__: process.env.TEST_JWT_TOKEN,
    __THIRD_PARTY_URI__: process.env.TEST_THIRD_PARTY_URI,
    __TEST_SMS_RECEIVER_NUMBER__: process.env.TEST_SMS_RECEIVER_NUMBER,
  },
  testMatch: [
    '**/test/**/*.test.js'
  ],
  testPathIgnorePatterns: ['<rootDir>/test/next/'],
  reporters: ['default'],
  maxConcurrency: 1,
};
