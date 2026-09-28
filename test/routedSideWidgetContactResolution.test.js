jest.mock('@ringcentral-integration/next-core', () => ({
  action: (_target, _key, descriptor) => descriptor,
  delegate: () => (_target, _key, descriptor) => descriptor,
  injectable: () => (target) => target,
  matchPath: require('react-router-dom').matchPath,
  RcViewModule: class RcViewModule {},
  Root: class Root {},
  Route: require('react-router-dom').Route,
  RouterPlugin: class RouterPlugin {},
  state: (_target, _key, descriptor) => descriptor,
  watch: jest.fn(() => jest.fn()),
}));

jest.mock('../src/app/views/SideWidgetView', () => ({
  SideWidgetView: class SideWidgetView {},
}));

const {
  RoutedSideWidgetView,
} = require('../src/app/views/RoutedSideWidgetView/RoutedSideWidget.view');

const CALL_DETAILS_PATH = '/history/call-log-id';

const callDetailsConfig = {
  id: 'call-details',
  name: 'Call details',
  scope: 'contact',
  backgroundPath: '/dialer',
};

function createRoutedSideWidget(resolveContact) {
  const handles = new Map();
  const sideWidgetView = {
    currentTabId: 'side-widget-apps',
    tabs: [],
    currentContact: null,
    createOrUpdateContent: jest.fn((options) => {
      const handle = handles.get(options.id) ?? { options };
      handle.options = options;
      handles.set(options.id, handle);
      return handle;
    }),
    openContent: jest.fn(),
    selectTab: jest.fn(),
    closeContent: jest.fn(),
    setMainPathResolver: jest.fn(),
  };
  const router = {
    currentPath: CALL_DETAILS_PATH,
    push: jest.fn(),
    replace: jest.fn(),
  };
  const view = new RoutedSideWidgetView(sideWidgetView, router, {
    expanded: true,
  });
  view.registerRoutes(
    [
      {
        config: callDetailsConfig,
        detailComponent: () => null,
        routePath: '/history/:callLogId',
      },
    ],
    resolveContact,
  );
  return { handles, sideWidgetView, view };
}

// The shared worker runs these modules without React, so route registration
// has to resolve the contact from app state. A contactless registration keeps
// the previous contact's tab, and the worker's state replaces the client's on
// the next full state sync.
test('router-driven registration applies the resolved contact', () => {
  const resolveContact = jest.fn(() => ({ phoneNumber: '+16505550100' }));
  const { handles, sideWidgetView, view } =
    createRoutedSideWidget(resolveContact);

  view.onInit();

  expect(resolveContact).toHaveBeenCalledWith('call-details', {
    callLogId: 'call-log-id',
  });
  expect(sideWidgetView.openContent).toHaveBeenCalledWith(
    handles.get('call-details'),
    { contact: { phoneNumber: '+16505550100' } },
  );
});

test('router-driven registration omits a contact it cannot resolve', () => {
  const { handles, sideWidgetView, view } = createRoutedSideWidget(() =>
    undefined,
  );

  view.onInit();

  expect(sideWidgetView.openContent).toHaveBeenCalledWith(
    handles.get('call-details'),
    {},
  );
});
