module.exports = {
  server: {
    command: 'ON_TEST=1 NODE_ENV=development yarn start', // use development babel setting
    port: 8080,
    launchTimeout: 100000
  },
  launch: {
    product: 'chrome',
    dumpio: true,
    ignoreHTTPSErrors: true,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--disable-features=IsolateOrigins,site-per-process', '--no-sandbox'],
    headless: process.env.TEST_HEADLESS === 'true'
  },
  browserContext: 'incognito',
};
