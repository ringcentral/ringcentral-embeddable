// The call page and the banner that offers a way back to it. Behind a routed
// side widget page, such as the log page a disposition submitted during the
// call hands over to, the main column still shows the call.

jest.mock('@ringcentral-integration/next-core', () =>
  jest.requireActual('../mocks/nextCoreMock'),
);
jest.mock('@ringcentral-integration/micro-core/src/app/components', () => ({
  AppAnnouncement: ({ children }) => children,
  AppFooterNav: () => null,
  AppHeaderNav: () => null,
}));
jest.mock('@ringcentral-integration/micro-core/src/app/services', () => ({
  Toast: class Toast {},
}));
jest.mock('@ringcentral-integration/next-widgets/components', () => ({
  PageHeader: () => null,
}));
jest.mock('../../src/app/views/RoutedSideWidgetView', () => ({
  RoutedSideWidgetView: class RoutedSideWidgetView {},
}));
jest.mock('../../src/ringcx/services/RingCXSideWidgets', () => ({
  RingCXSideWidgets: class RingCXSideWidgets {},
}));
jest.mock('../../src/ringcx/hooks/useCxCallContactRenderInfo', () => ({
  useCxCallContactRenderInfo: jest.fn(),
}));
[
  'CallControlGrid',
  'DialpadPanel',
  'EndCallDialog',
  'IvrAlertPanel',
  'SideWidgetToggleButton',
].forEach((name) => {
  jest.doMock(`../../src/ringcx/components/${name}`, () => ({
    [name]: () => null,
  }));
});
[
  'CxActiveCallControl',
  'CxAgentSession',
  'CxAuth',
  'CxCall',
  'CxCallDisposition',
  'CxCallMonitor',
  'CxIntegratedSoftphone',
  'CxPresence',
  'CxRequeueCall',
  'CxTransferCall',
].forEach((name) => {
  jest.doMock(`../../src/ringcx/services/${name}`, () => ({
    [name]: class {},
  }));
});

const {
  CxActiveCallView,
} = require('../../src/ringcx/views/CxActiveCallView/CxActiveCallView.view');

const CALL_ID = 'uii-1$session-1';
const CALL_PATH = `/agent/calls/${CALL_ID}`;

function createView({ currentPath, mainColumnPath }) {
  const view = Object.create(CxActiveCallView.prototype);
  view.router = { currentPath };
  view.routedSideWidgetView =
    mainColumnPath === undefined
      ? undefined
      : { getMainColumnPath: () => mainColumnPath };
  Object.defineProperty(view, 'liveActivityCallId', { value: CALL_ID });
  return view;
}

describe('CxActiveCallView call page on screen', () => {
  test.each([
    ['on the call page', CALL_PATH],
    ['on a page of the call, such as its disposition', `${CALL_PATH}/disposition`],
  ])('counts the router %s', (_name, currentPath) => {
    expect(createView({ currentPath }).isOnActiveCallPage).toBe(true);
  });

  test('counts the call page the main column shows behind a log page', () => {
    const view = createView({
      currentPath: '/log/call/session-1',
      mainColumnPath: CALL_PATH,
    });

    expect(view.isOnActiveCallPage).toBe(true);
  });

  test('offers the way back once the main column shows another page', () => {
    const view = createView({
      currentPath: '/log/call/session-1',
      mainColumnPath: '/messages',
    });

    expect(view.isOnActiveCallPage).toBe(false);
  });

  test('reads only the router without the routed side widget', () => {
    const view = createView({ currentPath: '/messages' });

    expect(view.isOnActiveCallPage).toBe(false);
  });
});

describe('CxActiveCallView Disposition button', () => {
  function createCallPage({ routedSideWidgetView } = {}) {
    const router = { currentPath: CALL_PATH, push: jest.fn() };
    const view = new CxActiveCallView(
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      router,
      {},
      { enable: jest.fn() },
      { shared: false },
      undefined,
      undefined,
      routedSideWidgetView,
    );
    Object.defineProperty(view, 'callId', { value: CALL_ID });
    return view;
  }

  test('shows the disposition through the routed side widget', () => {
    // Already open behind another side widget tab, the router is on it, so
    // pushing its path again would leave the tab behind.
    const routedSideWidgetView = { showPage: jest.fn(async () => undefined) };
    const view = createCallPage({ routedSideWidgetView });

    view.goToDispositionPage();

    expect(routedSideWidgetView.showPage).toHaveBeenCalledWith(
      `${CALL_PATH}/disposition`,
    );
    expect(view.router.push).not.toHaveBeenCalled();
  });

  test('routes to the disposition without the routed side widget', () => {
    const view = createCallPage();

    view.goToDispositionPage();

    expect(view.router.push).toHaveBeenCalledWith(`${CALL_PATH}/disposition`);
  });
});
