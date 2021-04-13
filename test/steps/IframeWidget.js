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
    this._widgetIframe = iframes.find((f) => f.name() === 'rc-widget-adapter-frame');
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

  async waitFor(selector, timeout = 40000) {
    await this._widgetIframe.waitForSelector(selector, { timeout });
  }

  async waitForDialButton() {
    await this.waitFor('.DialerPanel_dialBtn', 100000);
  }

  async waitForNavigations() {
    await this.waitFor('nav.NavigationBar_root');
  }

  async getLoginButtonText() {
    const loginText = await this._widgetIframe.$eval('button.LoginPanel_loginButton', (el) => el.innerText);
    return loginText;
  }

  async getDialButton() {
    const callBtn = await this._widgetIframe.$('.DialerPanel_dialBtn');
    return callBtn;
  }

  async clickNavigationButton(label) {
    await this.waitFor('nav.NavigationBar_root');
    await this._widgetIframe.click(`.TabNavigationButton_iconHolder[data-sign="${label}"]`);
  }

  async clickDropdownNavigationMenu(label) {
    await this.waitFor('.DropdownNavigationView_root');
    await this._widgetIframe.click(`.DropdownNavigationItem_root[title="${label}"]`);
  }

  async getCallItemList() {
    await this.waitFor('.CallsListPanel_container');
    const callItems = await this._widgetIframe.$$('.CallItem_root');
    return callItems;
  }

  async getNoCallsText() {
    await this.waitFor('.CallsListPanel_container');
    const noCalls = await this._widgetIframe.$('.CallsListPanel_noCalls');
    if (!noCalls) {
      return null;
    }
    const noCallsText = await this._widgetIframe.$eval('.CallsListPanel_noCalls', (el) => el.innerText);
    return noCallsText;
  }

  async getMessageAllTabText() {
    await this.waitFor('.ConversationsPanel_root');
    const allTabText = await this._widgetIframe.$eval('.MessageTabButton_iconHolder[title="All"]', (el) => el.innerText);
    return allTabText;
  }

  async getContactSearchInput() {
    await this.waitFor('.ContactsView_root');
    const searchInput = await this._widgetIframe.$('.ContactsView_searchInput');
    return searchInput;
  }

  async getELUAText() {
    await this.waitFor('.SettingsPanel_root');
    const elua = await this._widgetIframe.$eval('a.SettingsPanel_eula', (el) => el.innerText);
    return elua;
  }

  async dismissMessages() {
    await this._widgetIframe.$$eval('.Message_dismiss', async (els) => {
      await Promise.all(els.map((el) => el.click()));
    });
  }

  async clickSettingSection(label) {
    await this.dismissMessages();
    await this.waitFor('.SettingsPanel_root');
    await page.waitFor(2000);
    await this.dismissMessages();
    await page.waitFor(2000);
    const textHanlders = await this._widgetIframe.$x(`//div[contains(text(), '${label}')]`);
    if (textHanlders.length > 0) {
      await textHanlders[0].click();
    } else {
      throw new Error(`click ${label} not found`);
    }
  }

  async getHeaderLabel() {
    await this.waitFor('.Header_root');
    const text = await this._widgetIframe.$eval('.Header_label', (el) => el.innerText);
    return text;
  }

  async getSMSRecipientNumber() {
    await this.waitFor('.ComposeTextPanel_root');
    const value = await this._widgetIframe.$eval('input[name="receiver"]', (el) => el.value);
    return value;
  }

  async getSMSText() {
    await this.waitFor('.ComposeTextPanel_root');
    const value = await this._widgetIframe.$eval('textarea[data-sign="messageInput"]', (el) => el.value);
    return value;
  }

  async getServiceNameInAuthorizationSettings() {
    await this.waitFor('.AuthorizeSettingsSection_serviceName');
    const text = await this._widgetIframe.$eval('.AuthorizeSettingsSection_serviceName', (el) => el.innerText);
    return text;
  }

  async getContactFilters() {
    await this.waitFor('.ContactSourceFilter_filterIconContainer');
    await this._widgetIframe.click('.ContactSourceFilter_filterIconContainer');
    const text = await this._widgetIframe.$eval('.ContactSourceFilter_contactSourceList', (el) => el.innerText);
    return text;
  }

  async getContactNames() {
    const texts = await this._widgetIframe.$$eval('.ContactItem_contactName', els => els.map(el => el.textContent));
    return texts;
  }
}
