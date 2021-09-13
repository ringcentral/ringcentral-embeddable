const {
  setBrowserPermission,
  visitIndexPage,
} = require('./steps/common');

const { IframeWidget } = require('./steps/IframeWidget');

describe('Index page test', () => {
  beforeAll(async () => {
    await setBrowserPermission();
    await visitIndexPage();
  });

  it('should display "RingCentral Embeddable" text on page', async () => {
    expect(page).toMatch('RingCentral Embeddable');
  });

  it('should get SignIn in widget iframe', async () => {
    const widgetIframe = new IframeWidget();
    await widgetIframe.loadElement();
    await widgetIframe.waitForLoginPage();
    await page.waitForTimeout(1000);
    const loginText = await widgetIframe.getLoginButtonText();
    expect(loginText).toEqual('Sign In');
  });
});
