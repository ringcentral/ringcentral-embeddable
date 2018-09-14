describe('Index page test', () => {
  it('should display "RingCentral Embeddable" text on page', async () => {
    await page.goto(__HOST_URI__);
    await expect(page).toMatch('RingCentral Embeddable');
  }, 100000);

  it('should get SignIn in widget iframe', async () => {
    await page.goto(__HOST_URI__, {
      waituntil: 'networkidle0'
    });
    await page.waitForSelector('iframe#rc-widget-adapter-frame', { timeout: 45000 });
    await page.waitFor(2000);
    const widgetIframe = await page.frames().find(f => f.name() === 'rc-widget-adapter-frame');
    await widgetIframe.waitForSelector('button.LoginPanel_loginButton', { timeout: 45000 });
    await page.waitFor(1000);
    const loginText = await widgetIframe.$eval('button.LoginPanel_loginButton', el => el.innerText);
    expect(loginText).toEqual('Sign In');
  }, 100000);
});
