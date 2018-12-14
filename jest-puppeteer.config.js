module.exports = {
  server: {
    command: 'yarn start',
    port: 8080,
    launchTimeout: 100000
  },
  launch: {
    dumpio: true,
    headless: process.env.HEADLESS === 'true'
  },
};
