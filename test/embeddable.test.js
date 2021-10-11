const { setBrowserPermission } = require('./steps/common');
const {
  visitThirdPartyPage,
} = require('./steps/embeddable');

const { IframeWidget } = require('./steps/IframeWidget');

describe('Embeddable', () => {
  beforeAll(async () => {
    await setBrowserPermission();
  });

  it('should embed the widget successfully', async () => {
    await visitThirdPartyPage();
    await page.evaluate(() => {
      (function () {
        var rcs = document.createElement('script');
        rcs.src = 'http://localhost:8080/adapter.js';
        var rcs0 = document.getElementsByTagName('script')[0];
        rcs0.parentNode.insertBefore(rcs, rcs0);
      })();
    });
    const widgetIframe = new IframeWidget();
    await widgetIframe.loadElement(2000);
    await widgetIframe.waitForLoginPage();
    await page.waitForTimeout(1000);
    const loginText = await widgetIframe.getLoginButtonText();
    expect(loginText).toEqual('Sign In');
  });
});
