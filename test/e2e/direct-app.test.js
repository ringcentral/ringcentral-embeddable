const {
  LOGIN_BUTTON,
  visitPage,
  waitForElement,
} = require('./helpers/browser');

describe('Direct app page', () => {
  beforeAll(async () => {
    await visitPage('/app.html');
    await waitForElement(page, LOGIN_BUTTON);
  });

  test('displays an enabled Sign In button', async () => {
    const label = await page.$eval(
      LOGIN_BUTTON,
      (element) => element.innerText,
    );
    expect(label).toBe('Sign In');
  });

  test('keeps the login screen after reloading the direct app', async () => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForElement(page, LOGIN_BUTTON);
    expect(await page.$eval(LOGIN_BUTTON, (element) => element.disabled)).toBe(
      false,
    );
  });
});
