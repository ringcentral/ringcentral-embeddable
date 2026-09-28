jest.mock('@ringcentral-integration/micro-core/src/app/components', () => ({
  AppProvider: ({ children }) => children,
  useAppFooter: () => ({ footer: null }),
  useAppHeader: () => ({ nav: null }),
}));

jest.mock('../src/app/views/ExpandedView', () => ({
  ExpandedView: class ExpandedView {},
}));

const { createTwoPortSideWidget } = require('./helpers/twoPortSideWidget');

const CALL_CONTACT = { phoneNumber: '+16505550100' };
const OTHER_CONTACT = { id: 'contact-2', phoneNumber: '+16505550199' };

const settings = {
  id: 'settings',
  name: 'Settings',
  scope: 'global',
  backgroundPath: '/settings',
  keepBackNavigation: true,
};

const routes = [
  {
    config: {
      id: 'call-details',
      name: 'Call details',
      scope: 'contact',
      backgroundPath: '/dialer',
    },
    routePath: '/history/:callLogId',
  },
  {
    config: {
      id: 'conversation',
      name: 'Conversation',
      scope: 'contact',
      backgroundPath: '/messages',
    },
    routePath: '/conversations/:conversationId',
  },
  {
    config: {
      id: 'contact-details',
      name: 'Contact',
      scope: 'contact',
      backgroundPath: '/contacts',
    },
    routePath: '/contacts/:contactType/:contactId',
  },
  {
    config: {
      id: 'log-call',
      name: 'Log call',
      scope: 'contact',
      backgroundPath: '/history',
      closeWhenLeft: true,
    },
    routePath: '/log/call/:callSessionId',
  },
  { config: { ...settings, keepBackNavigation: false }, routePath: '/settings/region' },
  { config: settings, routePath: '/settings/theme' },
];

function createApp(options = {}) {
  const contacts = {
    'call-details': CALL_CONTACT,
    conversation: CALL_CONTACT,
    'log-call': CALL_CONTACT,
  };
  const app = createTwoPortSideWidget({
    initialPath: '/history',
    routes,
    resolveContact: (tabId) => contacts[tabId],
    ...options,
  });
  return { ...app, contacts };
}

function expectPorts(app, check) {
  check(app.server, 'server');
  check(app.client, 'client');
}

describe('side widget across the server and client ports', () => {
  test('back from a contact opened while docked returns to the page switched to', async () => {
    const app = createApp();
    const { client, contacts, router, server, tabIds } = app;

    await router.push('/history/call-1');
    await client.routedSideWidgetView.navigateMain('/contacts');
    // The contact page is opened by the server; the contact loads afterwards.
    await app.onServer(() => router.push('/contacts/company/contact-2'));
    contacts['contact-details'] = OTHER_CONTACT;
    await app.applyResolvedContacts();
    expectPorts(app, (port) => {
      expect(tabIds(port)).toEqual(['contact-details']);
    });

    client.sideWidgetView._contentHandles
      .get('contact-details')
      .options.onBack();
    await app.settle();

    expect(router.currentPath).toBe('/contacts');
    expect(app.root.expanded).toBe(true);
    expectPorts(app, (port) => {
      expect(tabIds(port)).toEqual([]);
      expect(port.sideWidgetView.isOpen).toBe(true);
    });
    expect(server.routedSideWidgetView.mainPath).toBeNull();
  });

  test('back from a history-back settings page closes the tab without history', async () => {
    const app = createApp({ initialPath: '/settings' });
    const { client, router, tabIds } = app;

    await router.push('/settings/region');
    expectPorts(app, (port) => {
      expect(tabIds(port)).toEqual(['settings']);
    });

    client.sideWidgetView._contentHandles.get('settings').options.onBack();
    await app.settle();

    expect(router.goBack).not.toHaveBeenCalled();
    expect(router.currentPath).toBe('/settings');
    expectPorts(app, (port) => {
      expect(tabIds(port)).toEqual([]);
      expect(port.sideWidgetView.isOpen).toBe(true);
    });
  });

  test('keeps the page back of a settings page with a fixed back target', async () => {
    const app = createApp({ initialPath: '/settings' });

    await app.router.push('/settings/theme');

    expect(
      app.client.sideWidgetView._contentHandles.get('settings').options.onBack,
    ).toBeUndefined();
  });

  test('closing the active routed tab shows the other routed tab on both ports', async () => {
    const app = createApp();
    const { client, router, tabIds } = app;

    await router.push('/history/call-1');
    await router.push('/conversations/conversation-1');
    expectPorts(app, (port) => {
      expect(tabIds(port)).toEqual(['conversation', 'call-details']);
    });

    await client.sideWidgetView.closeTabFromPanel('conversation');
    await app.settle();

    expect(router.currentPath).toBe('/history/call-1');
    expectPorts(app, (port) => {
      expect(tabIds(port)).toEqual(['call-details']);
      expect(port.sideWidgetView.currentTabId).toBe('call-details');
    });
  });

  test('selecting a routed tab routes to it on both ports', async () => {
    const app = createApp();
    const { client, router } = app;

    await router.push('/history/call-1');
    await router.push('/conversations/conversation-1');

    await client.sideWidgetView._selectTabFromPanel('call-details');
    await app.settle();

    expect(router.currentPath).toBe('/history/call-1');
    expectPorts(app, (port) => {
      expect(port.sideWidgetView.currentTabId).toBe('call-details');
    });
  });

  test('runs a closed tab’s close hook once, on the server', async () => {
    const app = createApp();
    const onClose = { server: jest.fn(), client: jest.fn() };
    const handles = {};
    ['server', 'client'].forEach((role) => {
      handles[role] = app[role].sideWidgetView.createContent({
        id: 'call-hud',
        name: 'HUD',
        scope: 'global',
        onClose: onClose[role],
        view: () => null,
      });
    });
    await app.onServer(() =>
      app.server.sideWidgetView.openContent(handles.server),
    );

    await app.client.sideWidgetView.closeTabFromPanel('call-hud');
    await app.settle();

    expect(onClose.server).toHaveBeenCalledTimes(1);
    expect(onClose.client).not.toHaveBeenCalled();
    expectPorts(app, (port) => {
      expect(app.tabIds(port)).toEqual([]);
    });
  });

  test('closing the drawer from the panel folds it on both ports', async () => {
    const app = createApp();

    await app.router.push('/history/call-1');
    await app.client.sideWidgetView._closeFromPanel();
    await app.settle();

    expect(app.root.expanded).toBe(false);
    expectPorts(app, (port) => {
      expect(port.sideWidgetView.isOpen).toBe(false);
      expect(app.tabIds(port)).toEqual([]);
    });
  });

  test('forgets a form the server closed, instead of finishing it again', async () => {
    const app = createApp();
    const { client, router, server, tabIds } = app;

    await router.push('/history/call-1');
    await router.push('/log/call/call-1');
    expectPorts(app, (port) => {
      expect(tabIds(port)).toEqual(['log-call', 'call-details']);
    });
    router.replace.mockClear();

    await client.sideWidgetView.closeTabFromPanel('log-call');
    await app.settle();

    expect(router.currentPath).toBe('/history/call-1');
    expect(router.replace).not.toHaveBeenCalled();
    expectPorts(app, (port) => {
      expect(tabIds(port)).toEqual(['call-details']);
    });
    expect(server.routedSideWidgetView._entries.has('log-call')).toBe(false);
    expect(client.routedSideWidgetView._entries.has('log-call')).toBe(false);
  });

  test('back from a folded overlay page just closes the page', async () => {
    const app = createApp({ expanded: false });
    const { client, router, tabIds } = app;

    await router.push('/history/call-1');
    expect(app.server.sideWidgetView.isOpen).toBe(true);

    client.sideWidgetView._contentHandles.get('call-details').options.onBack();
    await app.settle();

    expect(router.currentPath).toBe('/dialer');
    expectPorts(app, (port) => {
      expect(tabIds(port)).toEqual([]);
      expect(port.sideWidgetView.isOpen).toBe(false);
    });
  });
});
