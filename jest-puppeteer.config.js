module.exports = {
  server: {
    command: 'NODE_ENV=development yarn start', // use development babel setting
    port: 8080,
    launchTimeout: 100000
  },
  launch: {
    dumpio: true,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
    headless: process.env.TEST_HEADLESS === 'true'
    // TODO: widget will check visible before init app,
    // so in headless mode, widget will keep loadding.
  },
  browserContext: 'incognito',
};
