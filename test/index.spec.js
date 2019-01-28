/* global $ */
describe('Index page test', () => {
  test({
    title: 'should display "RingCentral Embeddable" text on page',
  }, async ({ page }) => {
    const app = await $(page).waitForFrames(['#rc-widget-adapter-frame']);
    const text = await $(app).getText('@loginButton');
    expect(text).toBe('loginButton');
  });
});
