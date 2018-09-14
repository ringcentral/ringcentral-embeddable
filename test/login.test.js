describe('Widget login test', () => {
  it('should get SignIn in widget iframe', async () => {
    await page.goto(__HOST_URI__, {
      waituntil: 'networkidle0'
    });
    await page.waitForSelector('iframe#rc-widget-adapter-frame', { timeout: 45000 });
    await page.waitFor(2000);
    const widgetIframe = await page.frames().find(f => f.name() === 'rc-widget-adapter-frame');
    const loginButton = await widgetIframe.$('button.LoginPanel_loginButton');
    await loginButton.click();
    await page.waitFor(2000);
    const pages = await browser.pages();
    const popup = pages[pages.length - 1];
    console.log(popup);
    debugger;
  }, 100000);
});
