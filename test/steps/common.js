const { IframeWidget } = require('./IframeWidget');
const { LoginWindow } = require('./LoginWindow');

export async function setBrowserPermission(permissions = ['notifications', 'microphone']) {
  const context = browser.defaultBrowserContext();
  await context.overridePermissions(__HOST_URI__, permissions);
}

export async function visitIndexPage() {
  await page.goto(__HOST_URI__, {
    waituntil: 'networkidle0',
    timeout: 120000,
  });
}

export async function getLoginedWidget(username, password) {
  const widgetIframe = new IframeWidget();
  await widgetIframe.loadElement();
  await widgetIframe.waitForLoginPage();
  await page.click('#setEnvironment');
  await widgetIframe.enableSandboxEnvironment();
  await widgetIframe.waitForLoginPage();

  const popupPage = await widgetIframe.clickLoginButtonToGetLoginWindow();
  const popupWindow = new LoginWindow(popupPage, username, password);
  await popupWindow.submitCredential();
  await popupWindow.authorize();
  await page.waitForTimeout(1000);
  return widgetIframe;
}
