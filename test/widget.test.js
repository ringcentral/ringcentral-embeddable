const {
  setBrowserPermission,
  visitIndexPage,
  getLoginedWidget,
} = require('./steps/common');

describe('Index page test', () => {
  let widgetIframe;

  beforeAll(async () => {
    await setBrowserPermission();
    await visitIndexPage();
    widgetIframe = await getLoginedWidget(__USER_NAME__, __USER_PASSWORD__);
  });

  it('should login successfully', async () => {
    if (!__USER_PASSWORD__ || !__USER_NAME__) {
      console.log('THIS TEST IS SKIPED BECAUSE NO USER LOGIN INFO PROVIDED');
      return;
    }
    await widgetIframe.waitForDialButton();
    const dialButton = await widgetIframe.getDialButton();
    expect(!!dialButton).toEqual(true);
  });

  it('should goto calls page successfully', async () => {
    if (!__USER_PASSWORD__ || !__USER_NAME__) {
      console.log('THIS TEST IS SKIPED BECAUSE NO USER LOGIN INFO PROVIDED');
      return;
    }
    await widgetIframe.clickNavigationButton('Calls');
    const callItems = await widgetIframe.getCallItemList();
    const noCallsText = await widgetIframe.getNoCallsText();
    const isNoCalls = noCallsText === 'No results found.';
    expect(callItems.length > 0 || isNoCalls).toEqual(true);
  });
});
