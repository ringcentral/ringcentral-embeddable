const {
  getNewWindowPromise,
  waitForTimeout,
} = require('../helpers');

export class IframeWidget {
  constructor(targetPage = page) {
    this._widgetIframe = null;
    this._targetPage = targetPage;
    this._loadRetryCount = 0;
  }

  async loadElement() {
    await this._targetPage.waitForSelector('iframe#rc-widget-adapter-frame', { timeout: 300000 });
    await waitForTimeout(3000);
    const iframeElement = await this._targetPage.$('iframe#rc-widget-adapter-frame');
    this._widgetIframe = await iframeElement.contentFrame();
  }

  async waitForLoginPage() {
    await this._widgetIframe.waitForSelector('button[data-sign="loginButton"]:not([disabled])');
  }

  async loginWithCallbackUri(callbackUri) {
    await page.evaluate((callbackUri) => {
      const iframe = document.querySelector("#rc-widget-adapter-frame").contentWindow;
      iframe.postMessage({
        type: 'rc-adapter-authorization-code',
        callbackUri,
      }, '*');
    }, callbackUri);
  }

  async enableSandboxEnvironment() {
    await this._widgetIframe.waitForSelector('div[data-sign="envSave"]');
    await this._widgetIframe.click('label[data-sign="envToggle"]');
    await this._widgetIframe.click('div[data-sign="envSave"]');
  }

  async clickLoginButtonToGetLoginWindow() {
    const newWindowPromise = getNewWindowPromise();
    await this._widgetIframe.click('button[data-sign="loginButton"]:not([disabled])');
    const popup = await newWindowPromise;
    return popup;
  }

  async waitFor(selector, timeout = 30000) {
    await this._widgetIframe.waitForSelector(selector, { timeout });
  }

  async waitForDialButton() {
    await this.waitFor('button[data-sign="callButton"]', 100000);
  }

  async waitForNavigation() {
    await this.waitFor('ul[data-sign="navigationBar"]');
  }

  async getLoginButtonText() {
    const loginText = await this._widgetIframe.$eval('button[data-sign="loginButton"]', (el) => el.innerText);
    return loginText;
  }

  async getDialButton() {
    const callBtn = await this._widgetIframe.$('button[data-sign="callButton"]');
    return callBtn;
  }

  async waitDialButtonEnabled() {
    await this._widgetIframe.waitForSelector('div[data-sign="spinnerOverlay"]', { hidden: true });
    await this.waitFor('button[data-sign="callButton"]:not([disabled])', 100000);
    const callBtn = await this._widgetIframe.$('button[data-sign="callButton"]:not([disabled])');
    return callBtn;
  }

  async clickNavigationButton(label) {
    await this.waitFor('ul[data-sign="navigationBar"]');
    const tab = await this._widgetIframe.$(`.MuiListItem-root[role="tab"][data-sign="${label}"]`);
    if (tab) {
      await this._widgetIframe.click(`.MuiListItem-root[role="tab"][data-sign="${label}"]`);
      return;
    }
    if (label === 'More') {
      throw new Error(`Navigation button not found for ${label}`);
    }
    await this._widgetIframe.click('.MuiListItem-root[role="tab"][data-sign="More"]');
    await waitForTimeout(1000);
    await this.clickNavigationSubMenu(label);
  }

  async moreButtonExist() {
    const moreButton = await this._widgetIframe.$('button[data-sign="More"]');
    return !!moreButton;
  }

  async clickSubTab(label, path) {
    await this.waitFor('.MuiTabs-flexContainer');
    const hasHidden = await this._widgetIframe.$eval(`.MuiTab-root[data-sign="${label}"]`, (element) => {
      return element.hasAttribute('aria-hidden');
    });
    if (hasHidden){
      await this._widgetIframe.click('.MuiTabs-flexContainer button[data-tab-more-button]');
      await waitForTimeout(1000);
      await this._widgetIframe.click(`li[value="${path}"]`);
    } else {
      await this._widgetIframe.click(`.MuiTab-root[data-sign="${label}"]`);
    }
  }

  async clickBackButton() {
    await this._widgetIframe.click('[data-sign="backButton"]');
  }

  async clickNavigationSubMenu(label) {
    await this.waitFor(`.MuiMenuItem-root[data-sign="${label}"]`);
    await this._widgetIframe.click(`.MuiMenuItem-root[data-sign="${label}"]`);
  }

  async gotoSettingsPage() {
    const headerText = await this.getTabHeader();
    if (headerText === 'Settings') {
      return;
    }
    await this.clickNavigationButton('Settings');
  }

  async getCallItemList() {
    await this.waitFor('.CallsListPanel_container');
    await waitForTimeout(500); // for render
    const callItems = await this._widgetIframe.$$('div[data-sign="calls_item_root"]');
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

  async getMessageList(type) {
    await this.waitFor('div[data-sign="messageList"]');
    await waitForTimeout(500); // for render
    const voicemailItems = await this._widgetIframe.$$(`div[data-sign="${type}"]`);
    return voicemailItems;
  }

  async getNoMessageText() {
    await this.waitFor('div[data-sign="messageList"]');
    await waitForTimeout(500);
    const noMessage = await this._widgetIframe.$('p[data-sign="noMatch"]');
    if (!noMessage) {
      return null;
    }
    const noMessageText = await this._widgetIframe.$eval('p[data-sign="noMatch"]', (el) => el.innerText);
    return noMessageText;
  }

  async getMessageAllTabText() {
    await this.waitFor('div[data-sign="conversationsPanel"]');
    const allTabText = await this._widgetIframe.$eval('button[data-sign="All"]', (el) => el.innerText);
    return allTabText;
  }

  async getContactSearchInput() {
    await this.waitFor('div[data-sign="contactList"]');
    const searchInput = await this._widgetIframe.$('div[data-sign="contactsSearchInput"] input');
    return searchInput;
  }

  async getEULAText() {
    // await this.waitFor('.SettingsPanel_root');
    const elua = await this._widgetIframe.$eval('a[data-sign="eula"]', (el) => el.innerText);
    return elua;
  }

  async dismissMessages() {
    await this._widgetIframe.$$eval('.Message_dismiss', async (els) => {
      await Promise.all(els.map((el) => el.click()));
    });
  }

  async clickSettingSection(label, group = "general") {
    await this.waitFor('.SettingsPanel_root');
    const section = await this._widgetIframe.$(`div[data-sign="${label}"][role="button"]`);
    if (!section) {
      await this._widgetIframe.click(`div[data-sign="${group}"][role="button"]`);
      await waitForTimeout(500);
    }
    await this._widgetIframe.click(`div[data-sign="${label}"][role="button"]`);
  }

  async getSettingSection(label) {
    await this.waitFor('.SettingsPanel_root');
    const section = await this._widgetIframe.$(`div[data-sign="${label}"][role="button"]`);
    return section;
  }

  async getHeaderLabel() {
    await this.waitFor('[data-sign="headerTitle"]');
    const text = await this._widgetIframe.$eval('[data-sign="headerTitle"]', (el) => el.innerText);
    return text;
  }

  async getSMSRecipientNumber() {
    await this.waitFor('div[data-sign="composeTextPanel"]');
    const value = await this._widgetIframe.$eval('input[name="receiver"]', (el) => el.value);
    return value;
  }

  async getSMSRecipientInputPlaceholder() {
    await this.waitFor('div[data-sign="composeTextPanel"]');
    const value = await this._widgetIframe.$eval('input[name="receiver"]', (el) => el.placeholder);
    return value;
  }

  async clickComposeTextIcon() {
    await this._widgetIframe.click('button[title="Compose Text"]');
  }

  async typeSMSRecipientAndText({ recipientNumber, text}) {
    await this._widgetIframe.type('input[name="receiver"]', recipientNumber);
    await waitForTimeout(1000);
    await this._widgetIframe.type('textarea[data-sign="messageInput"]', text);
  }

  async clickSMSSendButton() {
    await this.waitFor('button[data-sign="messageButton"]:not([disabled])');
    await this._widgetIframe.click('button[data-sign="messageButton"]');
  }

  async getLastTextAtConversation() {
    await this.waitFor('div[data-sign="conversationPanel"]');
    const messages = await this._widgetIframe.$$eval('div[data-sign="OutboundText"]', (els) => els.map(el => el.innerText));
    return messages[messages.length - 1];
  }

  async getSMSText() {
    await this.waitFor('div[data-sign="composeTextPanel"]');
    const value = await this._widgetIframe.$eval('textarea[data-sign="messageInput"]', (el) => el.value);
    return value;
  }

  async getServiceNameInAuthorizationSettings() {
    await this.waitFor('div[data-sign="thirdPartyAuthSetting"]');
    const text = await this._widgetIframe.$eval('div[data-sign="thirdPartyAuthSetting"] .RcListItemText-primary', (el) => el.innerText);
    return text;
  }

  async getContactFilters() {
    await this.waitFor('div[role="tablist"]');
    const filters = await this._widgetIframe.$$eval('div[role="tablist"] button:not([data-tab-more-button])', els => els.map(el => el.innerText));
    return filters;
  }

  async clickContactFilter(label) {
    await this.waitFor('div[role="tablist"]');
    const hasHidden = await this._widgetIframe.$eval(`div[role="tablist"] button[data-sign="${label}"]`, (element) => {
      return element.hasAttribute('aria-hidden');
    });
    if (hasHidden){
      await this._widgetIframe.click('div[role="tablist"] button[data-tab-more-button]');
      await waitForTimeout(1000);
      await this._widgetIframe.click(`li[value="${label}"]`);
    } else {
      await this._widgetIframe.click(`div[role="tablist"] button[data-sign="${label}"]`);
    }
  }

  async getContactNames() {
    const texts = await this._widgetIframe.$$eval('.ContactItem_contactName', els => els.map(el => el.textContent));
    return texts;
  }

  async getTabHeader() {
    const text = await this._widgetIframe.$eval('h6[data-sign="navigationHeaderTitle"]', (el) => el.innerText);
    return text;
  }

  async waitForTimeout(timeout) {
    await waitForTimeout(timeout);
  }
}
