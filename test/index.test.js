const {
  setBrowserPermission,
  visitIndexPage,
} = require('./steps/common');

const { IframeWidget } = require('./steps/IframeWidget');
const { LoginWindow } = require('./steps/LoginWindow');

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
    await page.waitFor(1000);
    const loginText = await widgetIframe.getLoginButtonText();
    expect(loginText).toEqual('Sign In');
  });

  it('should login successfully', async () => {
    const widgetIframe = new IframeWidget();
    await widgetIframe.loadElement();
    await widgetIframe.waitForLoginPage();
    await page.click('#setEnvironment');
    await widgetIframe.enableSandboxEnvironment();
    await widgetIframe.waitForLoginPage();

    const popupPage = await widgetIframe.clickLoginButtonToGetLoginWindow();
    const popupWindow = new LoginWindow(popupPage);
    await popupWindow.submitCredential();
    await popupWindow.authorize();
    await page.waitFor(1000);
    await widgetIframe.waitForDialPage();
    const dialButton = await widgetIframe.getDialButton();
    expect(!!dialButton).toEqual(true);
  });
});
