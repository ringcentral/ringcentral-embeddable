const {
  setBrowserPermission,
  visitIndexPage,
  getAuthorizedWidget,
} = require('./steps/common');

const hasUserLoginInfo = global.__JWT_TOKEN__;
if (!hasUserLoginInfo) {
  console.log('THOSE TESTS ARE SKIPED BECAUSE NO USER LOGIN INFO PROVIDED');
}
const conditionalDescribe = !hasUserLoginInfo ? describe.skip : describe;

conditionalDescribe('widget page test', () => {
  let widgetIframe;

  beforeAll(async () => {
    await setBrowserPermission();
    await visitIndexPage();
    widgetIframe = await getAuthorizedWidget(__JWT_TOKEN__);
  });

  it('should login successfully', async () => {
    await widgetIframe.waitForDialButton();
    const dialButton = await widgetIframe.getDialButton();
    expect(!!dialButton).toEqual(true);
  });

  it('should have dial button enabled', async () => {
    await widgetIframe.waitDialButtonEnabled();
    const noTimeout = true;
    expect(noTimeout).toEqual(true);
  });

  it('should goto calls page successfully', async () => {
    await widgetIframe.clickSubTab('Calls');
    const callItems = await widgetIframe.getCallItemList();
    const noCallsText = await widgetIframe.getNoCallsText();
    const isNoCalls = noCallsText === 'No results found.';
    expect(callItems.length > 0 || isNoCalls).toEqual(true);
  });

  it('should goto inbox page successfully', async () => {
    await widgetIframe.clickNavigationButton('Inbox');
    const allTabText = await widgetIframe.getMessageAllTabText();
    expect(allTabText).toContain('All');
  });

  it('should goto Compose Text page successfully', async () => {
    await widgetIframe.clickComposeTextIcon();
    const recipientPlaceholder = await widgetIframe.getSMSRecipientInputPlaceholder();
    expect(recipientPlaceholder).toEqual('Enter name or number');
    const text = `text ${Date.now()}`;
    await widgetIframe.typeSMSRecipientAndText({ recipientNumber: __TEST_SMS_RECEIVER_NUMBER__, text });
    await widgetIframe.clickSMSSendButton();
    const lastTextInConversation = await widgetIframe.getLastTextAtConversation();
    expect(lastTextInConversation).toEqual(text);
    await widgetIframe.clickBackButton();
  });

  it('should goto contacts page successfully', async () => {
    await widgetIframe.clickNavigationButton('Contacts');
    const contactSearchInput = await widgetIframe.getContactSearchInput();
    expect(!!contactSearchInput).toEqual(true);
  });

  it('should goto settings page successfully', async () => {
    await widgetIframe.gotoSettingsPage();
    const eluaText = await widgetIframe.getELUAText();
    expect(eluaText).toEqual('End User License Agreement');
  });

  it('should goto region setting page successfully', async () => {
    await widgetIframe.gotoSettingsPage();
    await widgetIframe.clickSettingSection('Region');
    const headerLabel = await widgetIframe.getHeaderLabel();
    expect(headerLabel).toEqual('Region');
    await widgetIframe.clickBackButton();
  });

  it('should goto Compose Text page when click SMS link', async () => {
    await widgetIframe.waitForNavigation();
    const smsLink = await page.$('a[href="sms:+12345678901"]');
    await smsLink.evaluate(l => l.click());
    const recipientNumber = await widgetIframe.getSMSRecipientNumber();
    expect(recipientNumber).toEqual('+12345678901');
    await widgetIframe.clickBackButton();
  });

  it('should goto Compose Text page when click SMS link with body', async () => {
    await widgetIframe.waitForNavigation();
    const smsLink = await page.$('a[href="sms:+12345678902?body=test_sms"]');
    await smsLink.evaluate(l => l.click());
    const recipientNumber = await widgetIframe.getSMSRecipientNumber();
    const text = await widgetIframe.getSMSText();
    expect(recipientNumber).toEqual('+12345678902');
    expect(text).toEqual('test_sms');
    await widgetIframe.clickBackButton();
  });

  it('should goto calling setting page successfully', async () => {
    await widgetIframe.gotoSettingsPage();
    await widgetIframe.clickSettingSection('Calling');
    const headerLabel = await widgetIframe.getHeaderLabel();
    expect(headerLabel).toEqual('Calling');
    await widgetIframe.clickBackButton();
  });

  it('should register service successfully', async () => {
    await widgetIframe.gotoSettingsPage();
    await page.evaluate(() => {
      const iframe = document.querySelector("#rc-widget-adapter-frame").contentWindow;
      window.addEventListener('message', function (e) {
        var data = e.data;
        if (data && data.type === 'rc-post-message-request') {
          if (data.path === '/contacts') {
            const contacts = [{
              id: '123456',
              name: 'TestService Name',
              type: 'TestService',
              phoneNumbers: [{
                phoneNumber: '+1234567890',
                phoneType: 'direct',
              }],
              company: 'CompanyName',
              jobTitle: 'Engineer',
              emails: ['test@email.com'],
              deleted: false,
            }];
            iframe.postMessage({
              type: 'rc-post-message-response',
              responseId: data.requestId,
              response: {
                data: contacts,
                nextPage: null,
                syncTimestamp: Date.now()
              },
            }, '*');
          }
        }
      });
      iframe.postMessage({
        type: 'rc-adapter-register-third-party-service',
        service: {
          name: 'TestService',
          authorizationPath: '/authorize',
          authorizedTitle: 'Unauthorize',
          unauthorizedTitle: 'Authorize',
          contactsPath: '/contacts',
          authorized: true,
        },
      }, '*');
    });
    const serviceName = await widgetIframe.getServiceNameInAuthorizationSettings();
    expect(serviceName).toEqual('TestService');
    await widgetIframe.clickNavigationButton('Contacts');
    const contactsFilters = await widgetIframe.getContactFilters();
    expect(contactsFilters).toContain('TestService');
    await page.waitForTimeout(1500);
    const contacts = await widgetIframe.getContactNames();
    expect(contacts).toEqual(expect.arrayContaining(['TestService Name']));
  });
});
