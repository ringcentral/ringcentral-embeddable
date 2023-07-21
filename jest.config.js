const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '.env.test'),
});

module.exports = {
  setupFiles: [
    '<rootDir>/test/setup.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  preset: 'jest-puppeteer',
  globals: {
    __HOST_URI__: process.env.TEST_HOST_URI,
    __JWT_TOKEN__: process.env.TEST_JWT_TOKEN,
    __THIRD_PARTY_URI__: process.env.TEST_THIRD_PARTY_URI,
  },
  testMatch: [
    '**/test/**/*.test.js'
  ],
  reporters: ['default'],
  maxConcurrency: 1,
};
