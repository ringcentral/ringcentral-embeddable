const {
  setBrowserPermission,
  visitIndexPage,
} = require('./steps/common');

const { IframeWidget } = require('./steps/IframeWidget');

describe('Index page test', () => {
  it('should display "RingCentral Embeddable" text on page', async () => {
    await setBrowserPermission();
    await visitIndexPage();
    await expect(page).toMatch('RingCentral Embeddable');
  }, 100000);

  it('should get SignIn in widget iframe', async () => {
    await setBrowserPermission();
    await visitIndexPage();

    const widgetIframe = new IframeWidget();
    await widgetIframe.loadElement();
    await widgetIframe.waitForLoginPage();
    await page.waitFor(1000);
    const loginText = await widgetIframe.getLoginButtonText();
    expect(loginText).toEqual('Sign In');
  }, 100000);
});
