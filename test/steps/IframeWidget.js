const {
  getNewWindowPromise,
} = require('../helpers');

export class IframeWidget {
  constructor(targetPage = page) {
    this._widgetIframe = null;
    this._targetPage = targetPage;
    this._loadRetryCount = 0;
  }

  async loadElement(timeout = 200) {
    if (this._loadRetryCount > 6) {
      throw new Error('Load Element error');
    }
    await this._targetPage.waitForSelector('iframe#rc-widget-adapter-frame');
    await this._targetPage.waitForTimeout(timeout);
    const iframes = await this._targetPage.frames();
    this._widgetIframe = iframes.find((f) => f.name() === 'rc-widget-adapter-frame');
    if (!this._widgetIframe) {
      this._loadRetryCount += 1;
      await this.loadElement();
    }
    this._loadRetryCount = 0;
  }

  async waitForLoginPage() {
    await this._widgetIframe.waitForSelector('button[data-sign="loginButton"]:not([disabled])');
  }

  async enableSandboxEnvironment() {
    await this._widgetIframe.waitForSelector('.Environment_saveButton');
    await this._widgetIframe.click('label.Switch_switch');
    await this._widgetIframe.click('.Environment_saveButton');
  }

  async clickLoginButtonToGetLoginWindow() {
    const newWindowPromise = getNewWindowPromise();
    await this._widgetIframe.click('button[data-sign="loginButton"]:not([disabled])');
    const popup = await newWindowPromise;
    return popup;
  }

  async waitFor(selector, timeout = 40000) {
    await this._widgetIframe.waitForSelector(selector, { timeout });
  }

  async waitForDialButton() {
    await this.waitFor('svg[data-sign="callButton"]', 100000);
  }

  async waitForNavigations() {
    await this.waitFor('nav.NavigationBar_root');
  }

  async getLoginButtonText() {
    const loginText = await this._widgetIframe.$eval('button[data-sign="loginButton"]', (el) => el.innerText);
    return loginText;
  }

  async getDialButton() {
    const callBtn = await this._widgetIframe.$('svg[data-sign="callButton"]');
    return callBtn;
  }

  async waitDialButtonEnabled() {
    await this._widgetIframe.waitForSelector('div[data-sign="spinnerOverlay"]', { hidden: true });
    await this.waitFor('svg[data-sign="callButton"]:not(.DialerPanel_disabled)', 100000);
    const callBtn = await this._widgetIframe.$('svg[data-sign="callButton"]:not(.DialerPanel_disabled)');
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
    await this.waitFor('div[data-sign="ConversationsPanel"]');
    const allTabText = await this._widgetIframe.$eval('div[data-sign="All"]', (el) => el.innerText);
    return allTabText;
  }

  async getContactSearchInput() {
    await this.waitFor('div[data-sign="contactList"]');
    const searchInput = await this._widgetIframe.$('input[data-sign="contactsSearchInput"]');
    return searchInput;
  }

  async getELUAText() {
    await this.waitFor('.SettingsPanel_root');
    const elua = await this._widgetIframe.$eval('a[data-sign="eula"]', (el) => el.innerText);
    return elua;
  }

  async dismissMessages() {
    await this._widgetIframe.$$eval('.Message_dismiss', async (els) => {
      await Promise.all(els.map((el) => el.click()));
    });
  }

  async clickSettingSection(label) {
    await this.waitFor('.SettingsPanel_root');
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

  async getSMSRecipientInputPlaceholder() {
    await this.waitFor('.ComposeTextPanel_root');
    const value = await this._widgetIframe.$eval('input[name="receiver"]', (el) => el.placeholder);
    return value;
  }

  async clickComposeTextIcon() {
    await this._widgetIframe.click('span[title="Compose Text"]');
  }

  async typeSMSRecipientAndText({ recipientNumber, text}) {
    await this._widgetIframe.type('input[name="receiver"]', recipientNumber);
    await this._widgetIframe.type('textarea[data-sign="messageInput"]', text);
  }

  async clickSMSSendButton() {
    await this.waitFor('input[data-sign="messageButton"]:not([disabled])');
    await this._widgetIframe.click('input[data-sign="messageButton"]');
  }

  async getLastTextAtConversation() {
    await this.waitFor('div[data-sign="conversationPanel"]');
    const messages = await this._widgetIframe.$$eval('div[data-sign="OutboundText"]', (els) => els.map(el => el.innerText));
    return messages[messages.length - 1];
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
    await this.waitFor('div[data-sign="filterIconContainer"]');
    await this._widgetIframe.click('div[data-sign="filterIconContainer"]');
    const text = await this._widgetIframe.$eval('div[data-sign="contactSourceList"]', (el) => el.innerText);
    return text;
  }

  async getContactNames() {
    const texts = await this._widgetIframe.$$eval('.ContactItem_contactName', els => els.map(el => el.textContent));
    return texts;
  }
}
