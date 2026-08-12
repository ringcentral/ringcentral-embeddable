import React from 'react';

jest.mock('@ringcentral-integration/micro-core/src/app/components', () => ({
  AppProvider: ({ children }) => children,
  useAppFooter: () => ({ footer: null }),
  useAppHeader: () => ({ nav: null }),
}));

jest.mock('../../next/app/views/ExpandedView', () => ({
  ExpandedView: class ExpandedView {},
}));

const {
  SideWidgetView,
} = require('../../next/app/views/SideWidgetView/SideWidget.view');
const {
  RoutedSideWidgetView,
} = require('../../next/app/views/RoutedSideWidgetView/RoutedSideWidget.view');

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

function createApp() {
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
    close: jest.fn(function close() {
      this.activeContentId = null;
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
      router.currentPath = path;
      const config = routes[path];
      if (config) {
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
    routedSideWidgetView.open({
      config,
      contact: CALL_CONTACT,
      detailComponent: () => null,
      detailProps: {},
      path,
      routePath:
        config === conversationConfig
          ? '/conversations/:conversationId'
          : '/history/:callLogId',
    });
  }
  return { openPage, router, sideWidgetView };
}

test('keeps sibling tabs while closing tabs navigates between routed pages', () => {
  const { openPage, router, sideWidgetView } = createApp();

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
  expect(router.currentPath).toBe(CALL_DETAILS_PATH);
  expect(sideWidgetView.tabs.map(({ id }) => id)).toEqual([
    'conversation',
    'call-details',
  ]);
  expect(sideWidgetView.currentTabId).toBe('call-details');

  // closing the call details tab falls back to the conversation page
  sideWidgetView.closeTab('call-details');
  expect(router.currentPath).toBe(CONVERSATION_PATH);
  expect(sideWidgetView.tabs.map(({ id }) => id)).toEqual(['conversation']);
  expect(sideWidgetView.currentTabId).toBe('conversation');
});
