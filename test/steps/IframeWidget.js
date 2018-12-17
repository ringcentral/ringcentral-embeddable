const {
  getNewWindowPromise,
} = require('../helpers');

export class IframeWidget {
  constructor(targetPage = page) {
    this._widgetIframe = null;
    this._targetPage = targetPage;
    this._loadRetryCount = 0;
  }

  async loadElement() {
    if (this._loadRetryCount > 6) {
      throw new Error('Load Element error');
    }
    await this._targetPage.waitForSelector('iframe#rc-widget-adapter-frame');
    await this._targetPage.waitFor(200);
    const iframes = await this._targetPage.frames();
    this._widgetIframe = iframes.find(f => f.name() === 'rc-widget-adapter-frame');
    if (!this._widgetIframe) {
      this._loadRetryCount += 1;
      await this.loadElement();
    }
    this._loadRetryCount = 0;
  }

  async waitForLoginPage() {
    await this._widgetIframe.waitForSelector('button.LoginPanel_loginButton:not([disabled])');
  }

  async enableSandboxEnvironment() {
    await this._widgetIframe.waitForSelector('.Environment_saveButton');
    await this._widgetIframe.click('label.Switch_switch');
    await this._widgetIframe.click('.Environment_saveButton');
  }

  async clickLoginButtonToGetLoginWindow() {
    const newWindowPromise = getNewWindowPromise();
    await this._widgetIframe.click('button.LoginPanel_loginButton:not([disabled])');
    const popup = await newWindowPromise;
    return popup;
  }

  async waitForDialPage() {
    await this._widgetIframe.waitForSelector('.DialerPanel_dialBtn', { timeout: 100000 });
  }

  async getLoginButtonText() {
    const loginText = await this._widgetIframe.$eval('button.LoginPanel_loginButton', el => el.innerText);
    return loginText;
  }

  async getDialButton() {
    const callBtn = await this._widgetIframe.$('.DialerPanel_dialBtn');
    return callBtn;
  }
}
