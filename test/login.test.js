const {
  setBrowserPermission,
  visitIndexPage,
} = require('./steps/common');

const { IframeWidget } = require('./steps/IframeWidget');
const { LoginWindow } = require('./steps/LoginWindow');

describe('Widget login test', () => {
  it('should login successfully', async () => {
    await setBrowserPermission();
    await visitIndexPage();

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
    page.waitFor(1000);
    await widgetIframe.waitForDialPage();
    const dialButton = await widgetIframe.getDialButton();
    expect(!!dialButton).toEqual(true);
  }, 100000);
});
