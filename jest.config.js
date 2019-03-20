require('dotenv').config();

module.exports = {
  setupFiles: [
    '<rootDir>/test/setup.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  preset: 'jest-puppeteer',
  globals: {
    __HOST_URI__: process.env.TEST_HOST_URI,
    __USER_NAME__: process.env.TEST_USER_NAME,
    __USER_PASSWORD__: process.env.TEST_USER_PASSWORD,
  },
  testMatch: [
    '**/test/**/*.test.js'
  ],
  reporters: ['default'],
  maxConcurrency: 1,
};
