const LOGIN_BUTTON = 'button[data-sign="loginButton"]:not([disabled])';
const WIDGET_FRAME = 'iframe#rc-widget-adapter-frame';
const ELEMENT_TIMEOUT_MS = 30000;

async function waitForElement(
  target,
  selector,
  { visible = false, hidden = false } = {},
) {
  await target
    .waitForFunction(
      ({ selector, visible, hidden }) => {
        const element = document.querySelector(selector);
        if (!element) {
          return hidden;
        }
        const rect = element.getBoundingClientRect();
        const isVisible =
          getComputedStyle(element).visibility !== 'hidden' &&
          rect.width > 0 &&
          rect.height > 0;
        return hidden ? !isVisible : !visible || isVisible;
      },
      // Minimized iframes can stop animation frames; use an interval for readiness.
      { polling: 100, timeout: ELEMENT_TIMEOUT_MS },
      { selector, visible, hidden },
    )
    .catch((error) => {
      if (error.name !== 'TimeoutError') {
        throw error;
      }
      const state = hidden ? 'hidden' : visible ? 'visible' : 'present';
      throw new Error(`Timed out waiting for ${selector} to become ${state}`, {
        cause: error,
      });
    });
}

async function visitPage(path = '/') {
  await page
    .browserContext()
    .overridePermissions(__HOST_URI__, ['notifications', 'microphone']);
  await page.goto(new URL(path, __HOST_URI__).href, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
}

async function clickElement(target, selector) {
  await waitForElement(target, selector, { visible: true });
  const scrollTarget = await target.$(selector);
  // Reveal clipped links before checking whether another element covers them.
  await scrollTarget.evaluate((node) =>
    node.scrollIntoView({ block: 'nearest', behavior: 'instant' }),
  );
  const readyTarget = await target
    .waitForFunction(
      (selector) => {
        const node = document.querySelector(selector);
        if (!node) {
          return false;
        }
        const rect = node.getBoundingClientRect();
        const hit = document.elementFromPoint(
          rect.x + rect.width / 2,
          rect.y + rect.height / 2,
        );
        return hit !== null && node.contains(hit);
      },
      { polling: 100, timeout: ELEMENT_TIMEOUT_MS },
      selector,
    )
    .catch((error) => {
      if (error.name !== 'TimeoutError') {
        throw error;
      }
      throw new Error(
        `Timed out waiting for an unobstructed click target: ${selector}`,
        {
          cause: error,
        },
      );
    });
  await readyTarget.dispose();
  await scrollTarget.dispose();
  await target
    .locator(selector)
    .setTimeout(ELEMENT_TIMEOUT_MS)
    .click()
    .catch((error) => {
      if (error.name !== 'TimeoutError') {
        throw error;
      }
      throw new Error(`Timed out preparing to click ${selector}`, {
        cause: error,
      });
    });
}

async function getWidgetFrame() {
  await waitForElement(page, WIDGET_FRAME);
  const element = await page.$(WIDGET_FRAME);
  const frame = await element.contentFrame();
  if (!frame) {
    throw new Error('The widget iframe has no browsing context.');
  }
  await waitForElement(frame, LOGIN_BUTTON);
  return frame;
}

async function expandWidget() {
  await page.evaluate(() => window.RCAdapter.setMinimized(false));
  await page.waitForFunction(() => window.RCAdapter.minimized === false, {
    polling: 100,
  });
}

async function navigateWidget(frame, dataSign) {
  const selector = `button[data-sign="${dataSign}"]`;
  if (await frame.$(selector)) {
    await clickElement(frame, selector);
  } else {
    await clickElement(frame, 'button[data-sign="moreTab"]');
    const overflowSelector = `[data-sign="overflow-${dataSign}"]`;
    await waitForElement(frame, overflowSelector, { visible: true });
    await clickElement(frame, overflowSelector);
  }
}

module.exports = {
  LOGIN_BUTTON,
  WIDGET_FRAME,
  clickElement,
  expandWidget,
  getWidgetFrame,
  navigateWidget,
  visitPage,
  waitForElement,
};
