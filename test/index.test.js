const {
  setBrowserPermission,
  visitIndexPage,
} = require('./steps/common');
const { waitForTimeout } = require('./helpers');

const { IframeWidget } = require('./steps/IframeWidget');

describe('Index page test', () => {
  beforeAll(async () => {
    await setBrowserPermission();
    await visitIndexPage();
  });

  it('should display "RingCentral Embeddable" text on page', async () => {
    const title = await page.$eval('h1', (el) => el.innerText);
    expect(title).toContain('RingCentral Embeddable');
  });

  it('should get SignIn in widget iframe', async () => {
    const widgetIframe = new IframeWidget();
    await widgetIframe.loadElement();
    await widgetIframe.waitForLoginPage();
    await waitForTimeout(1000);
    const loginText = await widgetIframe.getLoginButtonText();
    expect(loginText).toEqual('Sign In');
  });
});
