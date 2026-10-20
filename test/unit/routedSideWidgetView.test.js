import { createMemoryHistory } from 'history';
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Router, useParams } from 'react-router-dom';

import { RoutedSideWidgetView } from '../../src/app/views/RoutedSideWidgetView/RoutedSideWidget.view';

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

jest.mock('../../src/app/views/SideWidgetView', () => ({
  SideWidgetView: class SideWidgetView {},
}));

function createRoutedSideWidget(currentPath = '/messages') {
  const handles = new Map();
  const sideWidgetView = {
    currentTabId: 'side-widget-apps',
    tabs: [],
    createOrUpdateContent: jest.fn((options) => {
      const handle = handles.get(options.id) ?? { options };
      handle.options = options;
      handles.set(options.id, handle);
      return handle;
    }),
    openContent: jest.fn((handle) => {
      const { id } = handle.options;
      if (!sideWidgetView.tabs.some((tab) => tab.id === id)) {
        sideWidgetView.tabs = [{ id }, ...sideWidgetView.tabs];
      }
      sideWidgetView.currentTabId = id;
    }),
    selectTab: jest.fn((tabId) => {
      sideWidgetView.currentTabId = tabId;
    }),
    closeContent: jest.fn(),
    closeTabFromPanel: jest.fn(async () => {}),
    setMainPathResolver: jest.fn(),
  };
  const router = {
    currentPath,
    push: jest.fn(async (path) => {
      router.currentPath = path;
    }),
    replace: jest.fn(async (path) => {
      router.currentPath = path;
    }),
  };
  const root = { expanded: false };
  return {
    handles,
    router,
    sideWidgetView,
    view: new RoutedSideWidgetView(sideWidgetView, router, root),
  };
}

/** The watchers `onInit` registered last, in order: contact, path, parkable. */
function getInitWatchers() {
  const { watch } = require('@ringcentral-integration/next-core');
  const [contact, path, parkable] = watch.mock.calls.slice(-3);
  return { contact, path, parkable };
}

const conversationConfig = {
  id: 'conversation',
  name: 'Conversation',
  scope: 'contact',
  backgroundPath: '/messages',
};

describe('RoutedSideWidgetView', () => {
  test('opens and renders a routed page through one reusable tab', () => {
    const { handles, router, sideWidgetView, view } =
      createRoutedSideWidget('/conversations/first');
    const Detail = ({ label }) => <div>{label}</div>;

    view.open({
      config: conversationConfig,
      contact: { phoneNumber: '+16505550100' },
      detailComponent: Detail,
      detailProps: { label: 'First conversation' },
      path: '/conversations/first',
      routePath: '/conversations/:conversationId',
    });
    router.currentPath = '/conversations/second';
    view.open({
      config: conversationConfig,
      contact: { phoneNumber: '+16505550101' },
      detailComponent: Detail,
      detailProps: { label: 'Second conversation' },
      path: '/conversations/second',
      routePath: '/conversations/:conversationId',
    });

    expect(sideWidgetView.createOrUpdateContent).toHaveBeenCalledTimes(2);
    expect(handles.size).toBe(1);
    expect(sideWidgetView.openContent).toHaveBeenLastCalledWith(
      handles.get('conversation'),
      { contact: { phoneNumber: '+16505550101' } },
    );

    const Content = handles.get('conversation').options.view;
    render(
      <MemoryRouter initialEntries={['/conversations/second']}>
        <Content showCloseButton />
      </MemoryRouter>,
    );
    expect(screen.getByText('Second conversation')).toBeInTheDocument();
  });

  test('keeps the URL canonical while routed tabs are selected and closed', async () => {
    const { handles, router, view } =
      createRoutedSideWidget('/conversations/first');
    const Detail = () => null;
    view.open({
      config: conversationConfig,
      detailComponent: Detail,
      detailProps: {},
      path: '/conversations/first',
      routePath: '/conversations/:conversationId',
    });
    const conversationHandle = handles.get('conversation');
    router.currentPath = '/history/call';
    view.open({
      config: {
        id: 'call-details',
        name: 'Call details',
        scope: 'contact',
        backgroundPath: '/dialer',
      },
      detailComponent: Detail,
      detailProps: {},
      path: '/history/call',
      routePath: '/history/:callLogId',
    });

    expect(conversationHandle.options.onDeactivate).toBeUndefined();

    router.currentPath = '/messages';
    await conversationHandle.options.onActivate();
    expect(router.push).toHaveBeenLastCalledWith('/conversations/first');

    router.currentPath = '/conversations/first';
    await conversationHandle.options.onClose('call-details');
    expect(router.push).toHaveBeenCalledTimes(1);

    const backgroundNavigation = createRoutedSideWidget(
      '/conversations/first',
    );
    backgroundNavigation.view.open({
      config: conversationConfig,
      detailComponent: Detail,
      detailProps: {},
      path: '/conversations/first',
      routePath: '/conversations/:conversationId',
    });

    await backgroundNavigation.handles
      .get('conversation')
      .options.onClose('side-widget-apps');
    expect(backgroundNavigation.router.push).toHaveBeenLastCalledWith(
      '/messages',
    );
  });

  test('discards stale routed-tab navigation when the user switches again', async () => {
    const { handles, router, view } = createRoutedSideWidget('/messages');
    const Detail = () => null;
    router.currentPath = '/conversations/first';
    view.open({
      config: conversationConfig,
      detailComponent: Detail,
      detailProps: {},
      path: '/conversations/first',
      routePath: '/conversations/:conversationId',
    });
    router.currentPath = '/history/call';
    view.open({
      config: {
        id: 'call-details',
        name: 'Call details',
        scope: 'contact',
        backgroundPath: '/dialer',
      },
      detailComponent: Detail,
      detailProps: {},
      path: '/history/call',
      routePath: '/history/:callLogId',
    });
    router.push.mockClear();
    router.currentPath = '/messages';

    const conversationNavigation = handles
      .get('conversation')
      .options.onActivate();
    const callNavigation = handles.get('call-details').options.onActivate();
    await Promise.all([conversationNavigation, callNavigation]);

    expect(router.push.mock.calls).toEqual([['/history/call']]);
    expect(router.currentPath).toBe('/history/call');
  });

  test('does not recreate a closed routed tab before its route changes', async () => {
    const { handles, router, sideWidgetView, view } =
      createRoutedSideWidget('/history/call');
    const config = {
      id: 'call-details',
      name: 'Call details',
      scope: 'contact',
      backgroundPath: '/dialer',
    };
    view.open({
      config: conversationConfig,
      detailComponent: () => null,
      detailProps: {},
      path: '/conversations/first',
      routePath: '/conversations/:conversationId',
    });
    const openCallDetails = () =>
      view.open({
        config,
        detailComponent: () => null,
        detailProps: {},
        path: '/history/call',
        routePath: '/history/:callLogId',
      });
    openCallDetails();
    const handle = handles.get('call-details');

    await handle.options.onClose('conversation');
    sideWidgetView.openContent.mockClear();
    router.currentPath = '/conversations/first';
    openCallDetails();

    expect(sideWidgetView.openContent).not.toHaveBeenCalled();

    view.syncPath('/conversations/first', true);
    openCallDetails();

    expect(sideWidgetView.openContent).not.toHaveBeenCalled();

    await handle.options.onCloseComplete();
    router.currentPath = '/history/call';
    openCallDetails();

    expect(sideWidgetView.openContent).toHaveBeenCalledTimes(1);
  });

  test('keeps one page instance alive while the page is reopened', () => {
    const { handles, view } = createRoutedSideWidget('/conversations/first');
    const lifecycle = [];
    const Detail = () => {
      React.useEffect(() => {
        lifecycle.push('mount');
        return () => lifecycle.push('unmount');
      }, []);
      return <div>Conversation</div>;
    };
    const openConversation = () =>
      view.open({
        config: conversationConfig,
        contact: { phoneNumber: '+16505550100' },
        detailComponent: Detail,
        detailProps: {},
        path: '/conversations/first',
        routePath: '/conversations/:conversationId',
      });

    openConversation();
    const Content = handles.get('conversation').options.view;
    const { rerender } = render(
      <MemoryRouter initialEntries={['/conversations/first']}>
        <Content showCloseButton />
      </MemoryRouter>,
    );
    expect(lifecycle).toEqual(['mount']);

    // reopening must not swap the component type, otherwise the page is torn
    // down and its cleanup wipes the data the new instance just loaded
    openConversation();
    const ReopenedContent = handles.get('conversation').options.view;
    expect(ReopenedContent).toBe(Content);
    rerender(
      <MemoryRouter initialEntries={['/conversations/first']}>
        <ReopenedContent showCloseButton />
      </MemoryRouter>,
    );
    expect(lifecycle).toEqual(['mount']);
    expect(screen.getByText('Conversation')).toBeInTheDocument();
  });

  test('reopens an already opened page without re-applying its contact', () => {
    const { handles, router, sideWidgetView, view } =
      createRoutedSideWidget('/history/call');
    const callDetailsConfig = {
      id: 'call-details',
      name: 'Call details',
      scope: 'contact',
      backgroundPath: '/dialer',
    };
    const openCallDetails = () =>
      view.open({
        config: callDetailsConfig,
        contact: { phoneNumber: '+16505550100' },
        detailComponent: () => null,
        detailProps: {},
        path: '/history/call',
        routePath: '/history/:callLogId',
      });

    openCallDetails();
    expect(sideWidgetView.openContent).toHaveBeenLastCalledWith(
      handles.get('call-details'),
      { contact: { phoneNumber: '+16505550100' } },
    );

    // navigating back to the same page (for example because closing another
    // tab activated this one) must not reset the contact-scoped sibling tabs
    openCallDetails();
    expect(sideWidgetView.openContent).toHaveBeenLastCalledWith(
      handles.get('call-details'),
      {},
    );

    // a different call log is a new context and applies its contact again
    router.currentPath = '/history/other-call';
    view.open({
      config: callDetailsConfig,
      contact: { phoneNumber: '+16505550101' },
      detailComponent: () => null,
      detailProps: {},
      path: '/history/other-call',
      routePath: '/history/:callLogId',
    });
    expect(sideWidgetView.openContent).toHaveBeenLastCalledWith(
      handles.get('call-details'),
      { contact: { phoneNumber: '+16505550101' } },
    );
  });

  test('registers the current routed path on init', () => {
    const { handles, sideWidgetView, view } =
      createRoutedSideWidget('/conversations/first');
    view.registerRoutes([
      {
        config: conversationConfig,
        detailComponent: () => null,
        routePath: '/conversations/:conversationId',
      },
    ]);

    view.onInit();

    expect(sideWidgetView.openContent).toHaveBeenLastCalledWith(
      handles.get('conversation'),
      { expand: false },
    );
  });

  test('applies a contact that resolves after the page was pre-opened', () => {
    const { handles, sideWidgetView, view } =
      createRoutedSideWidget('/conversations/first');

    // the router opens the page before its React route resolved the contact
    view.open({
      config: conversationConfig,
      detailComponent: () => null,
      detailProps: {},
      path: '/conversations/first',
      routePath: '/conversations/:conversationId',
    });
    expect(sideWidgetView.openContent).toHaveBeenLastCalledWith(
      handles.get('conversation'),
      {},
    );

    view.open({
      config: conversationConfig,
      contact: { phoneNumber: '+16505550100' },
      detailComponent: () => null,
      detailProps: {},
      path: '/conversations/first',
      routePath: '/conversations/:conversationId',
    });
    expect(sideWidgetView.openContent).toHaveBeenLastCalledWith(
      handles.get('conversation'),
      { contact: { phoneNumber: '+16505550100' } },
    );
  });

  test('opens routed content as an overlay while the layout is folded', () => {
    const { handles, sideWidgetView, view } = createRoutedSideWidget(
      '/conversations/first',
    );

    view.open({
      config: conversationConfig,
      contact: { phoneNumber: '+16505550100' },
      detailComponent: () => null,
      detailProps: {},
      expand: false,
      path: '/conversations/first',
      routePath: '/conversations/:conversationId',
    });

    expect(sideWidgetView.openContent).toHaveBeenCalledWith(
      handles.get('conversation'),
      {
        contact: { phoneNumber: '+16505550100' },
        expand: false,
      },
    );
  });

  test('pre-opens a folded route before its React component is committed', () => {
    const { handles, router, sideWidgetView, view } =
      createRoutedSideWidget('/messages');
    view.registerRoutes([
      {
        config: conversationConfig,
        detailComponent: () => null,
        routePath: '/conversations/:conversationId',
      },
    ]);

    view.onInit();
    expect(sideWidgetView.openContent).not.toHaveBeenCalled();

    router.currentPath = '/conversations/first';
    const pathWatcher = getInitWatchers().path[2];
    pathWatcher(router.currentPath);

    expect(sideWidgetView.openContent).toHaveBeenCalledWith(
      handles.get('conversation'),
      { expand: false },
    );
  });

  test('synchronizes browser navigation with existing routed tabs', () => {
    const { handles, router, sideWidgetView, view } =
      createRoutedSideWidget('/conversations/first');
    view.open({
      config: conversationConfig,
      detailComponent: () => null,
      detailProps: {},
      path: '/conversations/first',
      routePath: '/conversations/:conversationId',
    });

    sideWidgetView.currentTabId = 'side-widget-apps';
    view.syncPath('/conversations/first');
    expect(sideWidgetView.selectTab).toHaveBeenCalledWith('conversation');

    sideWidgetView.currentTabId = 'conversation';
    router.currentPath = '/messages';
    view.syncPath('/messages');
    // Folded, the drawer is an overlay over the page, so it closes when empty.
    expect(sideWidgetView.closeContent).toHaveBeenCalledWith(
      handles.get('conversation'),
      { collapseWhenLast: true },
    );
  });

  test('does not navigate again when route synchronization closes a tab', async () => {
    const { handles, router, view } = createRoutedSideWidget(
      '/conversations/first',
    );
    view.open({
      config: conversationConfig,
      detailComponent: () => null,
      detailProps: {},
      path: '/conversations/first',
      routePath: '/conversations/:conversationId',
    });
    const conversationHandle = handles.get('conversation');

    router.currentPath = '/messages';
    view.syncPath('/messages');
    router.push.mockClear();
    await conversationHandle.options.onClose(null);

    expect(router.push).not.toHaveBeenCalled();
    expect(router.currentPath).toBe('/messages');
  });

  test('does not replace an external destination after close completion', async () => {
    const { handles, router, view } = createRoutedSideWidget(
      '/contacts/company/contact-1',
    );
    view.open({
      config: {
        id: 'contact-details',
        name: 'Contact',
        scope: 'contact',
        backgroundPath: '/contacts',
      },
      detailComponent: () => null,
      detailProps: {},
      path: '/contacts/company/contact-1',
      routePath: '/contacts/:contactType/:contactId',
    });
    const contactDetailsHandle = handles.get('contact-details');

    router.currentPath = '/history/call-1';
    view.syncPath('/history/call-1');
    router.push.mockClear();
    await contactDetailsHandle.options.onClose(null);
    await contactDetailsHandle.options.onCloseComplete();

    expect(router.push).not.toHaveBeenCalled();
    expect(router.currentPath).toBe('/history/call-1');
  });

  test('keeps call details open when main navigation changes to Text', async () => {
    const { handles, router, sideWidgetView, view } =
      createRoutedSideWidget('/history/call');
    view.open({
      config: {
        id: 'call-details',
        name: 'Call details',
        scope: 'contact',
        backgroundPath: '/dialer',
      },
      detailComponent: () => <div>Call details</div>,
      detailProps: {},
      path: '/history/call',
      routePath: '/history/:callLogId',
    });
    sideWidgetView.currentTabId = 'call-details';
    view._root.expanded = true;

    view.navigateMain('/messages');

    expect(view.mainPath).toBe('/messages');
    expect(router.currentPath).toBe('/history/call');
    expect(router.push).not.toHaveBeenCalled();
    expect(sideWidgetView.closeContent).not.toHaveBeenCalled();

    const Content = handles.get('call-details').options.view;
    render(
      <MemoryRouter initialEntries={['/history/call']}>
        <Content showCloseButton={false} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Call details')).toBeInTheDocument();

    router.push.mockClear();
    await handles.get('call-details').options.onActivate();
    expect(router.push).not.toHaveBeenCalled();
    expect(router.currentPath).toBe('/history/call');

    await handles.get('call-details').options.onClose('side-widget-apps');
    expect(router.push).toHaveBeenCalledWith('/messages');
    // The parked page stays until the router reports the move, so the main
    // column never falls back to the call's own background in between.
    expect(view.mainPath).toBe('/messages');
    view.syncPath('/messages');
    expect(view.mainPath).toBeNull();
  });

  function openDockedCallDetails() {
    const routed = createRoutedSideWidget('/history/call');
    routed.view.open({
      config: {
        id: 'call-details',
        name: 'Call details',
        scope: 'contact',
        backgroundPath: '/dialer',
      },
      detailComponent: () => null,
      detailProps: {},
      path: '/history/call',
      routePath: '/history/:callLogId',
    });
    routed.sideWidgetView.currentTabId = 'call-details';
    routed.view._root.expanded = true;
    routed.view.navigateMain('/messages');
    expect(routed.view.mainPath).toBe('/messages');
    return routed;
  }

  test('keeps a docked tab and parks the page the router moved to', () => {
    const { router, sideWidgetView, view } = openDockedCallDetails();

    router.currentPath = '/contacts';
    view.syncPath('/contacts');

    expect(view.mainPath).toBe('/contacts');
    expect(router.replace).toHaveBeenCalledWith('/history/call');
    expect(sideWidgetView.closeContent).not.toHaveBeenCalled();
  });

  test('drops the preserved main path when the router leaves a folded routed page', () => {
    const { handles, router, sideWidgetView, view } = openDockedCallDetails();
    view._root.expanded = false;

    router.currentPath = '/contacts';
    view.syncPath('/contacts');

    expect(view.mainPath).toBeNull();
    expect(sideWidgetView.closeContent).toHaveBeenCalledWith(
      handles.get('call-details'),
      { collapseWhenLast: true },
    );
  });

  test('resolves a tab name from its route params on each render', () => {
    const { handles, view } = createRoutedSideWidget('/customized/crm-page');
    const titles = { 'crm-page': 'CRM page' };
    view.open({
      config: {
        id: 'customized-page',
        name: (params) => titles[params.pageId] ?? 'Page',
        scope: 'global',
        backgroundPath: '/dialer',
      },
      detailComponent: () => null,
      detailProps: {},
      path: '/customized/crm-page',
      routePath: '/customized/:pageId',
    });
    const { options } = handles.get('customized-page');

    expect(options.name).toBe('CRM page');
    titles['crm-page'] = 'Renamed CRM page';
    expect(options.getName()).toBe('Renamed CRM page');
  });

  test('closes a routed tab from its back button through the panel path', () => {
    const { handles, sideWidgetView, view } =
      createRoutedSideWidget('/conversations/first');
    view.open({
      config: conversationConfig,
      detailComponent: () => null,
      detailProps: {},
      path: '/conversations/first',
      routePath: '/conversations/:conversationId',
    });

    handles.get('conversation').options.onBack();

    expect(sideWidgetView.closeTabFromPanel).toHaveBeenCalledWith(
      'conversation',
    );
    expect(sideWidgetView.closeContent).not.toHaveBeenCalled();
  });

  test('keeps the page back navigation for tabs with nested pages', () => {
    const { handles, view } = createRoutedSideWidget('/settings/calling');
    view.open({
      config: {
        id: 'settings',
        name: 'Settings',
        scope: 'global',
        backgroundPath: '/settings',
        keepBackNavigation: true,
      },
      detailComponent: () => null,
      detailProps: {},
      path: '/settings/calling',
      routePath: '/settings/calling',
    });

    expect(handles.get('settings').options.onBack).toBeUndefined();
  });

  test('applies a contact that loads after the router opened the page', () => {
    const contactConfig = {
      id: 'contact-details',
      name: 'Contact',
      scope: 'contact',
      backgroundPath: '/contacts',
    };
    let loadedContact;
    const { handles, router, sideWidgetView, view } =
      createRoutedSideWidget('/history/call');
    view.registerRoutes(
      [
        {
          config: contactConfig,
          detailComponent: () => null,
          routePath: '/contacts/:contactType/:contactId',
        },
      ],
      () => loadedContact,
    );
    view.onInit();
    const watchers = getInitWatchers();
    const [, contactSelector, applyContact] = watchers.contact;
    const pathWatcher = watchers.path[2];

    // The router opens the page before the contact loads, as on the shared
    // worker, which renders no route to apply it later.
    router.currentPath = '/contacts/company/contact-2';
    pathWatcher(router.currentPath);
    expect(sideWidgetView.openContent).toHaveBeenLastCalledWith(
      handles.get('contact-details'),
      { expand: false },
    );
    expect(contactSelector()).toBeNull();

    loadedContact = { id: 'contact-2', phoneNumber: '+16505550199' };
    expect(contactSelector()).toBe(
      'contact-details:/contacts/company/contact-2:contact-2|+16505550199|',
    );
    applyContact();

    expect(sideWidgetView.openContent).toHaveBeenLastCalledWith(
      handles.get('contact-details'),
      { activate: false, contact: loadedContact, expand: false },
    );
    // Applied once: the page does not re-apply it on later changes.
    expect(contactSelector()).toBeNull();
  });

  test('switches the back behavior per page within one tab', () => {
    const { handles, router, sideWidgetView, view } =
      createRoutedSideWidget('/settings/theme');
    const settings = {
      id: 'settings',
      name: 'Settings',
      scope: 'global',
      backgroundPath: '/settings',
      keepBackNavigation: true,
    };
    const openSettingsPage = (path, config) => {
      router.currentPath = path;
      view.open({
        config,
        detailComponent: () => null,
        detailProps: {},
        path,
        routePath: path,
      });
    };

    // A page whose own back goes to a fixed page keeps it.
    openSettingsPage('/settings/theme', settings);
    expect(handles.get('settings').options.onBack).toBeUndefined();

    // A page whose own back goes through history closes the tab instead.
    openSettingsPage('/settings/region', {
      ...settings,
      keepBackNavigation: false,
    });
    handles.get('settings').options.onBack();

    expect(handles.size).toBe(1);
    expect(sideWidgetView.closeTabFromPanel).toHaveBeenCalledWith('settings');
  });

  test('reopens a closed page when the router navigates to it again', async () => {
    const contactConfig = {
      id: 'contact-details',
      name: 'Contact',
      scope: 'contact',
      backgroundPath: '/contacts',
    };
    const { handles, router, sideWidgetView, view } =
      createRoutedSideWidget('/history/call');
    view.registerRoutes([
      {
        config: contactConfig,
        detailComponent: () => null,
        routePath: '/contacts/:contactType/:contactId',
      },
    ]);
    view.onInit();
    const pathWatcher = getInitWatchers().path[2];

    router.currentPath = '/contacts/company/contact-1';
    pathWatcher(router.currentPath);
    // Closed from the panel: the page leaves a record against stale renders.
    await handles.get('contact-details').options.onClose('side-widget-apps');
    sideWidgetView.openContent.mockClear();

    // A stale render of the closed page does not bring it back.
    view.open({
      config: contactConfig,
      detailComponent: () => null,
      detailProps: {},
      path: '/contacts/company/contact-1',
      routePath: '/contacts/:contactType/:contactId',
    });
    expect(sideWidgetView.openContent).not.toHaveBeenCalled();

    // The user views the same contact again; nothing renders on the server,
    // so the router's arrival alone must reopen it.
    router.currentPath = '/history/call';
    pathWatcher(router.currentPath);
    router.currentPath = '/contacts/company/contact-1';
    pathWatcher(router.currentPath);

    expect(sideWidgetView.openContent).toHaveBeenCalledWith(
      handles.get('contact-details'),
      { expand: false },
    );
  });

  test('reopens a page on a client after a call took the router and returned', async () => {
    const dispositionConfig = {
      id: 'cx-disposition',
      name: 'Disposition',
      scope: 'global',
      backgroundPath: '/agent/home/dialer',
      closeWhenLeft: true,
    };
    const dispositionPath = '/agent/calls/call-1/disposition';
    const { handles, router, sideWidgetView, view } =
      createRoutedSideWidget(dispositionPath);
    view._root.expanded = true;
    view.setRouterOwners([{ path: '/calling' }]);
    view.setOutsideShellPaths(['/calling']);
    sideWidgetView.closeContent.mockImplementation((handle) =>
      handle.options.onClose(null),
    );
    // A client runs no router watcher: only renders and `syncPath` reach it.
    const openDisposition = () =>
      view.open({
        config: dispositionConfig,
        detailComponent: () => null,
        detailProps: {},
        path: dispositionPath,
        routePath: '/agent/calls/:id/disposition',
      });
    openDisposition();
    view.syncPath(dispositionPath, true);

    // A RingEX call takes the router, which closes the disposition.
    router.currentPath = '/calling';
    view.syncPath('/calling');
    expect(sideWidgetView.closeContent).toHaveBeenCalledWith(
      handles.get('cx-disposition'),
      expect.anything(),
    );
    sideWidgetView.openContent.mockClear();

    // The call ends and the router goes back. The route renders before
    // `syncPath` hears of the move, and must still show the page.
    router.currentPath = dispositionPath;
    openDisposition();

    expect(sideWidgetView.openContent).toHaveBeenCalledWith(
      handles.get('cx-disposition'),
      {},
    );
  });

  test('returns a preserved page to the page from before a call, not the call', async () => {
    const logConfig = {
      id: 'log-call',
      name: 'Log call',
      scope: 'contact',
      backgroundPath: '/dialer',
      preserveBackground: true,
    };
    const { handles, router, view } = createRoutedSideWidget('/history');
    view.setOutsideShellPaths(['/calling']);
    view.syncPath('/history');
    router.currentPath = '/calling';
    view.syncPath('/calling');

    // The call ended and the router went back to a log page.
    router.currentPath = '/log/call/call-1';
    view.open({
      config: logConfig,
      detailComponent: () => null,
      detailProps: {},
      path: '/log/call/call-1',
      routePath: '/log/call/:callSessionId',
    });
    view.syncPath('/log/call/call-1', true);
    await handles.get('log-call').options.onClose(null);

    expect(router.push).toHaveBeenLastCalledWith('/history');
  });

  test('waits for the route component when navigating within one tab type', () => {
    const { handles, sideWidgetView, view } =
      createRoutedSideWidget('/conversations/first');
    view.open({
      config: conversationConfig,
      detailComponent: () => null,
      detailProps: {},
      path: '/conversations/first',
      routePath: '/conversations/:conversationId',
    });
    sideWidgetView.currentTabId = 'conversation';

    view.syncPath('/conversations/second', true);

    expect(sideWidgetView.closeContent).not.toHaveBeenCalled();
    expect(handles.get('conversation')).toBeDefined();
  });

  test('restores route parameters for detail components rendered in a tab', () => {
    const { handles, view } = createRoutedSideWidget(
      '/conversations/conversation-id',
    );
    function Detail() {
      const { conversationId } = useParams();
      return <div>Conversation: {conversationId ?? 'missing'}</div>;
    }
    view.open({
      config: conversationConfig,
      detailComponent: Detail,
      detailProps: {},
      path: '/conversations/conversation-id',
      routePath: '/conversations/:conversationId',
    });
    const Content = handles.get('conversation').options.view;

    render(
      <MemoryRouter initialEntries={['/conversations/conversation-id']}>
        <Route path="/">
          <Content showCloseButton />
        </Route>
      </MemoryRouter>,
    );

    expect(
      screen.getByText('Conversation: conversation-id'),
    ).toBeInTheDocument();
  });

  test('renders a selected routed tab after its asynchronous route transition', () => {
    const { handles, router, view } = createRoutedSideWidget(
      '/conversations/first',
    );
    view.open({
      config: conversationConfig,
      detailComponent: () => <div>Conversation details</div>,
      detailProps: {},
      path: '/conversations/first',
      routePath: '/conversations/:conversationId',
    });
    const Content = handles.get('conversation').options.view;
    const history = createMemoryHistory({ initialEntries: ['/history/call'] });
    router.currentPath = '/history/call';

    render(
      <Router history={history}>
        <Content showCloseButton={false} />
      </Router>,
    );
    expect(screen.queryByText('Conversation details')).toBeNull();

    act(() => {
      router.currentPath = '/conversations/first';
      history.push('/conversations/first');
    });

    expect(screen.getByText('Conversation details')).toBeInTheDocument();
  });

  describe('main column location', () => {
    const callDetailsConfig = {
      id: 'call-details',
      name: 'Call details',
      scope: 'contact',
      backgroundPath: '/dialer',
    };
    const callDetailsRoute = {
      config: callDetailsConfig,
      detailComponent: () => null,
      routePath: '/history/:callLogId',
    };

    test('renders the page behind a routed page', () => {
      const { router, view } = createRoutedSideWidget('/history/call');
      let agentTab = 'dialer';
      view.registerRoutes([
        callDetailsRoute,
        {
          config: {
            id: 'cx-call-details',
            name: 'Call details',
            scope: 'contact',
            backgroundPath: '/agent/home/history',
            resolveBackgroundPath: () => `/agent/home/${agentTab}`,
          },
          detailComponent: () => null,
          routeExact: true,
          routePath: '/agent/history/:id',
        },
      ]);

      expect(view.isOnRoutedPage()).toBe(true);
      expect(view.getMainColumnPath()).toBe('/dialer');

      // A resolved background follows the state it reads.
      router.currentPath = '/agent/history/history-1';
      expect(view.getMainColumnPath()).toBe('/agent/home/dialer');
      agentTab = 'leads';
      expect(view.getMainColumnPath()).toBe('/agent/home/leads');

      router.currentPath = '/messages';
      expect(view.isOnRoutedPage()).toBe(false);
      expect(view.getMainColumnPath()).toBe('/messages');
    });

    test('keeps a parked page, and ignores one left on a main route', () => {
      const { router, view } = openDockedCallDetails();
      view.registerRoutes([callDetailsRoute]);

      expect(view.getMainColumnPath()).toBe('/messages');

      // The router moved to a main page before the parked page was dropped.
      router.currentPath = '/contacts';
      expect(view.getMainColumnPath()).toBe('/contacts');
    });

    test('shows the page a preserved page was opened from', () => {
      const logRoute = {
        config: {
          id: 'log-call',
          name: 'Log call',
          scope: 'contact',
          backgroundPath: '/dialer',
          preserveBackground: true,
        },
        detailComponent: () => null,
        routePath: '/log/call/:callSessionId',
      };
      const opened = createRoutedSideWidget('/log/call/call-1');
      opened.view.registerRoutes([logRoute]);
      // Nothing came before it, so its own background shows.
      expect(opened.view.getMainColumnPath()).toBe('/dialer');

      const { router, view } = createRoutedSideWidget('/contacts');
      view.registerRoutes([logRoute]);
      view.syncPath('/contacts');
      router.currentPath = '/log/call/call-1';
      expect(view.getMainColumnPath()).toBe('/contacts');
    });

    test('keeps the page from before a call behind a preserved page', () => {
      const { router, view } = createRoutedSideWidget('/contacts');
      view.registerRoutes([
        {
          config: {
            id: 'log-call',
            name: 'Log call',
            scope: 'contact',
            backgroundPath: '/dialer',
            preserveBackground: true,
          },
          detailComponent: () => null,
          routePath: '/log/call/:callSessionId',
        },
      ]);
      view.setOutsideShellPaths(['/calling']);
      view.syncPath('/contacts');
      // The call page takes the main column while the call is up.
      router.currentPath = '/calling';
      view.syncPath('/calling');
      expect(view.getMainColumnPath()).toBe('/calling');

      // The call ended and the router went back past it to a log page.
      router.currentPath = '/log/call/call-1';
      expect(view.getMainColumnPath()).toBe('/contacts');
    });

    test('does not return a preserved page to a call page that cannot be parked', async () => {
      const logConfig = {
        id: 'log-call',
        name: 'Log call',
        scope: 'contact',
        backgroundPath: '/dialer',
        preserveBackground: true,
      };
      const agent = { parkable: true };
      const { handles, router, view } = createRoutedSideWidget(
        '/agent/home/dialer',
      );
      view.registerRoutes([
        {
          config: logConfig,
          detailComponent: () => null,
          routePath: '/log/call/:callSessionId',
        },
      ]);
      // Only the agent home parks, and only in a ready session; a RingCX call
      // page reads the real route.
      view.setRouterOwners([
        {
          path: '/agent',
          resolveParkedPath: (path) =>
            agent.parkable && path.startsWith('/agent/home') ? path : null,
        },
      ]);
      view.syncPath('/agent/home/dialer');
      router.currentPath = '/agent/calls/call-1';
      view.syncPath('/agent/calls/call-1');

      // The call ended, and after its disposition the host opens its log page.
      router.currentPath = '/log/call/call-1';
      expect(view.getMainColumnPath()).toBe('/agent/home/dialer');

      view.open({
        config: logConfig,
        detailComponent: () => null,
        detailProps: {},
        path: '/log/call/call-1',
        routePath: '/log/call/:callSessionId',
      });
      view.syncPath('/log/call/call-1', true);
      await handles.get('log-call').options.onClose(null);
      expect(router.push).toHaveBeenLastCalledWith('/agent/home/dialer');
    });

    test('falls back to its background once the page to return to cannot be shown', () => {
      const agent = { parkable: true };
      const { router, view } = createRoutedSideWidget('/agent/home/dialer');
      view.registerRoutes([
        {
          config: {
            id: 'log-call',
            name: 'Log call',
            scope: 'contact',
            backgroundPath: '/dialer',
            preserveBackground: true,
          },
          detailComponent: () => null,
          routePath: '/log/call/:callSessionId',
        },
      ]);
      view.setRouterOwners([
        {
          path: '/agent',
          resolveParkedPath: (path) => (agent.parkable ? path : null),
        },
      ]);
      view.syncPath('/agent/home/dialer');
      router.currentPath = '/log/call/call-1';
      expect(view.getMainColumnPath()).toBe('/agent/home/dialer');

      // The RingCX session ended, so the agent home would redirect.
      agent.parkable = false;
      expect(view.getMainColumnPath()).toBe('/dialer');
    });

    test('stays on a route that renders its own background', () => {
      const { view } = createRoutedSideWidget('/history/call');
      view.registerRoutes([{ ...callDetailsRoute, rendersOwnBackground: true }]);

      expect(view.getMainColumnPath()).toBe('/history/call');
    });
  });

  describe('router owners', () => {
    function openDockedWithAgentOwner() {
      const routed = createRoutedSideWidget('/history/call');
      const owner = { parkable: true };
      routed.owner = owner;
      routed.view.setRouterOwners([
        {
          path: '/agent',
          resolveParkedPath: (path) => {
            if (!owner.parkable) {
              return null;
            }
            return path === '/agent' ? '/agent/home' : path;
          },
        },
        { path: '/calling' },
      ]);
      routed.view.open({
        config: {
          id: 'call-details',
          name: 'Call details',
          scope: 'contact',
          backgroundPath: '/dialer',
        },
        detailComponent: () => null,
        detailProps: {},
        path: '/history/call',
        routePath: '/history/:callLogId',
      });
      routed.sideWidgetView.currentTabId = 'call-details';
      routed.view._root.expanded = true;
      return routed;
    }

    test('parks a router-owning page as the path its owner resolves', () => {
      const { router, sideWidgetView, view } = openDockedWithAgentOwner();

      view.navigateMain('/agent');

      // The home itself, so closing the page does not route through the
      // shell's redirect from `/agent`.
      expect(view.mainPath).toBe('/agent/home');
      expect(router.push).not.toHaveBeenCalled();
      expect(sideWidgetView.closeContent).not.toHaveBeenCalled();
    });

    test('routes to a router-owning page that cannot be parked', () => {
      const { owner, router, view } = openDockedWithAgentOwner();
      owner.parkable = false;

      view.navigateMain('/agent');

      expect(view.mainPath).toBeNull();
      expect(router.push).toHaveBeenCalledWith('/agent');
    });

    test('never parks an owner that resolves no parked path', () => {
      const { router, view } = openDockedWithAgentOwner();

      view.navigateMain('/calling');

      expect(view.mainPath).toBeNull();
      expect(router.push).toHaveBeenCalledWith('/calling');
    });

    test('drops a parked page that stops being parkable', () => {
      const { owner, view } = openDockedWithAgentOwner();
      view.onInit();
      view.navigateMain('/agent');
      const [, isUnparkable, onUnparkableChange] = getInitWatchers().parkable;
      expect(isUnparkable()).toBe(false);

      // The RingCX session ended while its home was parked.
      owner.parkable = false;
      expect(isUnparkable()).toBe(true);
      onUnparkableChange(true);

      expect(view.mainPath).toBeNull();
    });
  });
});
