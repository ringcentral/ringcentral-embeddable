import React from 'react';

jest.mock('@ringcentral-integration/micro-core/src/app/components', () => ({
  AppProvider: ({ children }) => children,
  useAppFooter: () => ({ footer: null }),
  useAppHeader: () => ({ nav: null }),
}));

jest.mock('../src/app/views/ExpandedView', () => ({
  ExpandedView: class ExpandedView {},
}));

const {
  SideWidgetView,
} = require('../src/app/views/SideWidgetView/SideWidget.view');
const {
  RoutedSideWidgetView,
} = require('../src/app/views/RoutedSideWidgetView/RoutedSideWidget.view');

const CALL_CONTACT = { phoneNumber: '+16505550100' };
const CONVERSATION_PATH = '/conversations/conversation-id';
const CALL_DETAILS_PATH = '/history/telephony-session';

const conversationConfig = {
  id: 'conversation',
  name: 'Conversation',
  scope: 'contact',
  backgroundPath: '/messages',
};

const callDetailsConfig = {
  id: 'call-details',
  name: 'Call details',
  scope: 'contact',
  backgroundPath: '/dialer',
};

function createApp({
  autoOpenRoutedPage = true,
  collapseGate,
  contactByPath,
  navigationGate,
} = {}) {
  const expandedHandles = new Map();
  const expandedView = {
    activeContentId: null,
    create: jest.fn((options) => {
      const handle = { options };
      expandedHandles.set(options.id, handle);
      return handle;
    }),
    open: jest.fn(function open(handle) {
      this.activeContentId = handle.options.id;
    }),
    close: jest.fn(async function close() {
      this.activeContentId = null;
      if (collapseGate) {
        await collapseGate.promise;
      }
    }),
  };
  const sideWidgetView = new SideWidgetView(
    expandedView,
    { apps: [], pinAppIds: [], toggleAppPin: jest.fn(), loadAppPage: jest.fn() },
    { themeType: 'light' },
    { enableSideWidget: true },
  );
  const routes = {
    [CONVERSATION_PATH]: conversationConfig,
    [CALL_DETAILS_PATH]: callDetailsConfig,
  };
  const router = {
    currentPath: '/dialer',
    // the app re-mounts the routed page component on every navigation, which
    // re-opens its side widget page
    push: jest.fn(async (path) => {
      if (navigationGate) {
        await navigationGate.promise;
      }
      router.currentPath = path;
      const config = routes[path];
      if (config && autoOpenRoutedPage) {
        openPage(config, path);
      }
    }),
  };
  const routedSideWidgetView = new RoutedSideWidgetView(
    sideWidgetView,
    router,
    { expanded: true },
  );
  function openPage(config, path) {
    const contact = contactByPath ? contactByPath[path] : CALL_CONTACT;
    routedSideWidgetView.open({
      config,
      ...(contact === undefined ? {} : { contact }),
      detailComponent: () => null,
      detailProps: {},
      path,
      routePath:
        config === conversationConfig
          ? '/conversations/:conversationId'
          : '/history/:callLogId',
    });
  }
  return {
    expandedView,
    openPage,
    routedSideWidgetView,
    router,
    sideWidgetView,
  };
}

test('keeps sibling tabs while closing tabs navigates between routed pages', async () => {
  const { openPage, routedSideWidgetView, router, sideWidgetView } =
    createApp();

  // post call: the call details page and the AI assistant share the widget
  router.currentPath = CALL_DETAILS_PATH;
  openPage(callDetailsConfig, CALL_DETAILS_PATH);
  const smartNotesHandle = sideWidgetView.createContent({
    id: 'smart-notes',
    name: 'AI Assistant',
    view: () => <div>AI Assistant</div>,
  });
  sideWidgetView.openContent(smartNotesHandle);

  // the user opens an SMS conversation of the same contact
  router.currentPath = CONVERSATION_PATH;
  openPage(conversationConfig, CONVERSATION_PATH);
  expect(sideWidgetView.tabs.map(({ id }) => id)).toEqual([
    'conversation',
    'smart-notes',
    'call-details',
  ]);

  // the shared contact context can be dropped while the tabs stay open, for
  // example when the widget receives a state update from another tab
  sideWidgetView.currentContact = null;

  // closing the AI assistant activates the call details page, which navigates
  // back to its route: that must not drop the conversation tab
  sideWidgetView.selectTab('smart-notes');
  sideWidgetView.closeTab('smart-notes');
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(router.currentPath).toBe(CALL_DETAILS_PATH);
  expect(sideWidgetView.tabs.map(({ id }) => id)).toEqual([
    'conversation',
    'call-details',
  ]);
  expect(sideWidgetView.currentTabId).toBe('call-details');

  // closing the call details tab falls back to the conversation page
  sideWidgetView.closeTab('call-details');
  await new Promise((resolve) => setTimeout(resolve, 0));
  // The outgoing route can render once more after the URL changes but before
  // AppView synchronizes the new route. It must not recreate the closed tab.
  openPage(callDetailsConfig, CALL_DETAILS_PATH);
  routedSideWidgetView.syncPath(CONVERSATION_PATH, true);
  // The outgoing component can also render after synchronization has released
  // the close tombstone. Its stale path must still prevent registration.
  openPage(callDetailsConfig, CALL_DETAILS_PATH);
  expect(router.currentPath).toBe(CONVERSATION_PATH);
  expect(sideWidgetView.tabs.map(({ id }) => id)).toEqual(['conversation']);
  expect(sideWidgetView.currentTabId).toBe('conversation');

  // Conversation's back action changes the route before AppView removes the
  // final routed tab. A delayed Call Details render must not reopen the widget.
  router.currentPath = '/messages';
  routedSideWidgetView.syncPath('/messages');
  await new Promise((resolve) => setTimeout(resolve, 0));
  openPage(callDetailsConfig, CALL_DETAILS_PATH);
  expect(sideWidgetView.tabs).toEqual([]);
  expect(router.currentPath).toBe('/messages');
});

test('closes the call details tab when a different contact page opens', async () => {
  const { openPage, router, sideWidgetView } = createApp({
    contactByPath: {
      [CALL_DETAILS_PATH]: CALL_CONTACT,
      [CONVERSATION_PATH]: { phoneNumber: '+16505550999' },
    },
  });

  router.currentPath = CALL_DETAILS_PATH;
  openPage(callDetailsConfig, CALL_DETAILS_PATH);
  expect(sideWidgetView.tabs.map(({ id }) => id)).toEqual(['call-details']);

  router.currentPath = CONVERSATION_PATH;
  openPage(conversationConfig, CONVERSATION_PATH);

  expect(sideWidgetView.tabs.map(({ id }) => id)).toEqual(['conversation']);
});

test('reopens a call details page that an earlier contact change closed', async () => {
  const { openPage, router, sideWidgetView } = createApp({
    contactByPath: {
      [CALL_DETAILS_PATH]: CALL_CONTACT,
      [CONVERSATION_PATH]: { phoneNumber: '+16505550999' },
    },
  });

  router.currentPath = CALL_DETAILS_PATH;
  openPage(callDetailsConfig, CALL_DETAILS_PATH);
  router.currentPath = CONVERSATION_PATH;
  openPage(conversationConfig, CONVERSATION_PATH);
  expect(sideWidgetView.tabs.map(({ id }) => id)).toEqual(['conversation']);

  // Going back to the call details page must register it again: the close it
  // went through must not keep blocking its own route.
  router.currentPath = CALL_DETAILS_PATH;
  openPage(callDetailsConfig, CALL_DETAILS_PATH);

  expect(sideWidgetView.tabs.map(({ id }) => id)).toEqual(['call-details']);
  expect(sideWidgetView.currentTabId).toBe('call-details');
});

test('serializes closing routed tabs while the next route is pending', async () => {
  let resolveNavigation;
  const navigationGate = {
    promise: new Promise((resolve) => {
      resolveNavigation = resolve;
    }),
  };
  const { expandedView, openPage, router, sideWidgetView } = createApp({
    autoOpenRoutedPage: false,
    navigationGate,
  });

  router.currentPath = CALL_DETAILS_PATH;
  openPage(callDetailsConfig, CALL_DETAILS_PATH);
  router.currentPath = CONVERSATION_PATH;
  openPage(conversationConfig, CONVERSATION_PATH);
  router.currentPath = CALL_DETAILS_PATH;
  sideWidgetView.currentTabId = 'call-details';

  sideWidgetView.closeTab('call-details');
  await Promise.resolve();
  sideWidgetView.closeTab('conversation');

  expect(expandedView.close).not.toHaveBeenCalled();

  resolveNavigation();
  await navigationGate.promise;
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(router.currentPath).toBe('/messages');
  expect(expandedView.close).toHaveBeenCalledTimes(1);
});

test('restores the background after collapse receives a stale routed path', async () => {
  let resolveCollapse;
  const collapseGate = {
    promise: new Promise((resolve) => {
      resolveCollapse = resolve;
    }),
  };
  const {
    openPage,
    routedSideWidgetView,
    router,
    sideWidgetView,
  } = createApp({ collapseGate });

  router.currentPath = CALL_DETAILS_PATH;
  openPage(callDetailsConfig, CALL_DETAILS_PATH);
  router.currentPath = CONVERSATION_PATH;
  openPage(conversationConfig, CONVERSATION_PATH);
  sideWidgetView.closeTab('call-details');
  await new Promise((resolve) => setTimeout(resolve, 0));

  router.currentPath = '/messages';
  routedSideWidgetView.syncPath('/messages');
  await Promise.resolve();

  // Simulate the worker applying the route snapshot that existed before the
  // expanded-layout collapse completed.
  router.currentPath = CALL_DETAILS_PATH;
  routedSideWidgetView.syncPath(CALL_DETAILS_PATH, true);
  openPage(callDetailsConfig, CALL_DETAILS_PATH);
  expect(sideWidgetView.tabs).toEqual([]);

  resolveCollapse();
  await collapseGate.promise;
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(router.currentPath).toBe('/messages');
  expect(sideWidgetView.tabs).toEqual([]);
});
