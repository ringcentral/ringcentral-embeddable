module.exports = {
  server: {
    command: 'NODE_ENV=developement yarn start',
    port: 8080,
    launchTimeout: 100000
  },
  launch: {
    dumpio: true,
    headless: process.env.TEST_HEADLESS === 'true'
    // TODO: widget will check visible before init app,
    // so in headless mode, widget will keep loadding.
  },
};
