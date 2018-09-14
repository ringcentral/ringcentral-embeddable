module.exports = {
  setupFiles: [
    '<rootDir>/test/setup.js'
  ],
  preset: 'jest-puppeteer',
  globals: {
    __HOST_URI__: 'http://localhost:8080'
  },
  testMatch: [
    '**/test/**/*.test.js'
  ]
};
