const puppeteer = require('puppeteer');

function getChromeExecutablePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  try {
    return puppeteer.executablePath('chrome');
  } catch {
    // Puppeteer uses its bundled browser when Chrome is not installed.
    return undefined;
  }
}

const executablePath = getChromeExecutablePath();

// The smoke tests only need a client ID to initialize the logged-out app.
process.env.API_KEY = process.env.API_KEY || 'e2e-smoke-client';

module.exports = {
  server: [
    ...(process.env.TEST_E2E_EXTERNAL_SERVER === 'true'
      ? []
      : [
          {
            command: 'cross-env NODE_ENV=development npm start',
            port: 8080,
            usedPortAction: 'error',
            launchTimeout: 180000,
          },
        ]),
    {
      command: 'node test/e2e/fixtures/server.js',
      port: 8081,
      host: '127.0.0.1',
      usedPortAction: 'error',
      launchTimeout: 10000,
    },
  ],
  launch: {
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--no-sandbox',
    ],
    headless: process.env.TEST_HEADLESS !== 'false',
    ...(executablePath ? { executablePath } : {}),
  },
  browserContext: 'incognito',
};
