const {
  LOGIN_BUTTON,
  WIDGET_FRAME,
  clickElement,
  expandWidget,
  getWidgetFrame,
  visitPage,
  waitForElement,
} = require('./helpers/browser');

describe('Embedding the widget', () => {
  beforeAll(async () => {
    await visitPage(__HOST_PAGE_URI__);
    await page.addScriptTag({ url: new URL('/adapter.js', __HOST_URI__).href });
  });

  test('loads the widget when the adapter is injected into a host page', async () => {
    const frame = await getWidgetFrame();
    expect(await page.$eval('h1', (element) => element.innerText)).toBe(
      'Host application',
    );
    expect(
      await frame.$eval(LOGIN_BUTTON, (element) => element.innerText),
    ).toBe('Sign In');
    expect(await page.$$(WIDGET_FRAME)).toHaveLength(1);
    expect(new URL(page.url()).origin).not.toBe(new URL(frame.url()).origin);
  });

  test('expands and minimizes the widget using its host control', async () => {
    await expandWidget();
    const frame = await getWidgetFrame();
    await waitForElement(frame, LOGIN_BUTTON, { visible: true });
    await clickElement(page, '[data-sign="adapterToggle"]');
    await page.waitForFunction(() => window.RCAdapter.minimized === true, {
      polling: 100,
    });
    expect(await page.evaluate(() => window.RCAdapter.minimized)).toBe(true);
  });
});
