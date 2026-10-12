const {
  clickElement,
  expandWidget,
  getWidgetFrame,
  navigateWidget,
  visitPage,
  waitForElement,
} = require('./helpers/browser');

const describeAuthenticated = process.env.TEST_JWT_TOKEN
  ? describe
  : describe.skip;

describeAuthenticated('Authenticated widget navigation', () => {
  let frame;

  beforeAll(async () => {
    await visitPage();
    frame = await getWidgetFrame();
    await expandWidget();
    const callbackUri = new URL('/redirect.html', __HOST_URI__);
    callbackUri.searchParams.set('jwt', process.env.TEST_JWT_TOKEN);
    await page.evaluate((uri) => {
      const iframe = document.querySelector('iframe#rc-widget-adapter-frame');
      iframe.contentWindow.postMessage(
        {
          type: 'rc-adapter-authorization-code',
          callbackUri: uri,
        },
        new URL(iframe.src).origin,
      );
    }, callbackUri.href);
    await waitForElement(frame, 'button[data-sign="callButton"]');
  });

  test('logs in and renders the dialer', async () => {
    expect(await frame.$('[data-sign="dialPad"]')).not.toBeNull();
    expect(await frame.$('button[data-sign="callButton"]')).not.toBeNull();
  });

  test.each([
    ['textTab', '[data-sign="ConversationsPage"]'],
    ['contactsTab', '[data-sign="contactList"]'],
    ['settingsTab', '[data-sign="general-settings-group"]'],
    ['dialerTab', '[data-sign="dialPad"]'],
  ])('opens %s from the navigation bar', async (tab, selector) => {
    await navigateWidget(frame, tab);
    await waitForElement(frame, selector, { visible: true });
    expect(await frame.$(selector)).not.toBeNull();
  });

  test.each([
    ['region', '[data-sign="countryCodeSelect"]'],
    ['audio', '[data-sign="audioSettingsPanel"]'],
    ['calling', '[data-sign="callingSettings"]'],
  ])('opens %s settings and returns to Settings', async (section, selector) => {
    await navigateWidget(frame, 'settingsTab');
    await waitForElement(frame, `[data-sign="${section}"]`, { visible: true });
    await clickElement(frame, `[data-sign="${section}"]`);
    await waitForElement(frame, selector, { visible: true });
    expect(await frame.$(selector)).not.toBeNull();
    await clickElement(frame, '[data-sign="backButton"]');
    await waitForElement(frame, selector, { hidden: true });
    expect(
      await frame.$('[data-sign="general-settings-group"]'),
    ).not.toBeNull();
  });
});
