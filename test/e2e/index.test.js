const {
  LOGIN_BUTTON,
  getWidgetFrame,
  visitPage,
} = require('./helpers/browser');

describe('Index page', () => {
  beforeAll(async () => {
    await visitPage();
  });

  test('displays the RingCentral Embeddable title', async () => {
    const title = await page.$eval(
      'header.md-header .md-header__title',
      (element) => element.innerText,
    );
    expect(title).toContain('RingCentral Embeddable');
  });

  test('loads the Sign In screen in the widget iframe', async () => {
    const frame = await getWidgetFrame();
    expect(
      await frame.$eval(LOGIN_BUTTON, (element) => element.innerText),
    ).toBe('Sign In');
    expect(new URL(frame.url()).pathname).toBe('/app.html');
  });
});
