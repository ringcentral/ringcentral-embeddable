require('dotenv').config({ path: '.env.test' });

module.exports = {
  displayName: 'e2e',
  preset: 'jest-puppeteer',
  testMatch: ['<rootDir>/test/e2e/**/*.test.js'],
  testTimeout: 120000,
  maxWorkers: 1,
  transform: {},
  globals: {
    __HOST_URI__: process.env.TEST_HOST_URI || 'http://localhost:8080',
    __HOST_PAGE_URI__: 'http://localhost:8081',
  },
};
