const {
  setBrowserPermission,
  visitIndexPage,
  getLoginedWidget,
} = require('./steps/common');

const hasUserLoginInfo = global.__USER_PASSWORD__ && global.__USER_NAME__;
if (!hasUserLoginInfo) {
  console.log('THOSE TESTS ARE SKIPED BECAUSE NO USER LOGIN INFO PROVIDED');
}
const conditionalDescribe = !hasUserLoginInfo ? describe.skip : describe;

conditionalDescribe('Index page test', () => {
  let widgetIframe;

  beforeAll(async () => {
    await setBrowserPermission();
    await visitIndexPage();
    widgetIframe = await getLoginedWidget(__USER_NAME__, __USER_PASSWORD__);
  });

  it('should login successfully', async () => {
    await widgetIframe.waitForDialButton();
    const dialButton = await widgetIframe.getDialButton();
    expect(!!dialButton).toEqual(true);
  });

  it('should goto history page successfully', async () => {
    await widgetIframe.clickNavigationButton('History');
    const callItems = await widgetIframe.getCallItemList();
    const noCallsText = await widgetIframe.getNoCallsText();
    const isNoCalls = noCallsText === 'No results found.';
    expect(callItems.length > 0 || isNoCalls).toEqual(true);
  });

  it('should goto messages page successfully', async () => {
    await widgetIframe.clickNavigationButton('Messages');
    const allTabText = await widgetIframe.getMessageAllTabText();
    expect(allTabText).toEqual('All');
  });

  it('should goto contacts page successfully', async () => {
    await widgetIframe.clickNavigationButton('More Menu');
    await widgetIframe.clickDropdownNavigationMenu('Contacts');
    const contactSearchInput = await widgetIframe.getContactSearchInput();
    expect(!!contactSearchInput).toEqual(true);
  });

  it('should goto settings page successfully', async () => {
    await widgetIframe.clickNavigationButton('More Menu');
    await widgetIframe.clickDropdownNavigationMenu('Settings');
    const eluaText = await widgetIframe.getELUAText();
    expect(eluaText).toEqual('End User License Agreement');
  });

  it('should goto calling setting page successfully', async () => {
    await widgetIframe.clickNavigationButton('More Menu');
    await widgetIframe.clickDropdownNavigationMenu('Settings');
    await widgetIframe.clickSettingSection('Calling');
    const headerLabel = await widgetIframe.getHeaderLabel();
    expect(headerLabel).toEqual('Calling');
  });

  it('should goto region setting page successfully', async () => {
    await widgetIframe.clickNavigationButton('More Menu');
    await widgetIframe.clickDropdownNavigationMenu('Settings');
    await widgetIframe.clickSettingSection('Region');
    const headerLabel = await widgetIframe.getHeaderLabel();
    expect(headerLabel).toEqual('Region');
  });

  it('should goto Compose Text page when click SMS link', async () => {
    await widgetIframe.waitForNavigations();
    await widgetIframe.dismissMessages();
    await page.click('a[href="sms:+12345678901"]');
    const recipientNumber = await widgetIframe.getSMSRecipientNumber();
    expect(recipientNumber).toEqual('+12345678901');
  });
});
