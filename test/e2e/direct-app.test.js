const { setBrowserPermission } = require('../steps/common');

describe('Direct app page', () => {
  beforeAll(async () => {
    await setBrowserPermission();
    await page.goto(`${__HOST_URI__}/app.html`, {
      waitUntil: 'networkidle0',
      timeout: 150000,
    });
  });

  it('should display the Sign In button', async () => {
    await page.waitForSelector('button[data-sign="loginButton"]:not([disabled])', {
      timeout: 100000,
    });
    const loginText = await page.$eval(
      'button[data-sign="loginButton"]',
      (el) => el.innerText,
    );
    expect(loginText).toEqual('Sign In');
  });
});
