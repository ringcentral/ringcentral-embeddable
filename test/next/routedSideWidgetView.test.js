import { createMemoryHistory } from 'history';
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Router, useParams } from 'react-router-dom';

import { RoutedSideWidgetView } from '../../next/app/views/RoutedSideWidgetView/RoutedSideWidget.view';

jest.mock('@ringcentral-integration/next-core', () => ({
  action: (_target, _key, descriptor) => descriptor,
  injectable: () => (target) => target,
  matchPath: require('react-router-dom').matchPath,
  RcViewModule: class RcViewModule {},
  Root: class Root {},
  Route: require('react-router-dom').Route,
  RouterPlugin: class RouterPlugin {},
  state: (_target, _key, descriptor) => descriptor,
  watch: jest.fn(() => jest.fn()),
}));

jest.mock('../../next/app/views/SideWidgetView', () => ({
  SideWidgetView: class SideWidgetView {},
}));

function createRoutedSideWidget(currentPath = '/messages') {
  const handles = new Map();
  const sideWidgetView = {
    currentTabId: 'side-widget-apps',
    createOrUpdateContent: jest.fn((options) => {
      const handle = handles.get(options.id) ?? { options };
      handle.options = options;
      handles.set(options.id, handle);
      return handle;
    }),
    openContent: jest.fn((handle) => {
      sideWidgetView.currentTabId = handle.options.id;
    }),
    selectTab: jest.fn((tabId) => {
      sideWidgetView.currentTabId = tabId;
    }),
    closeContent: jest.fn(),
  };
  const router = {
    currentPath,
    push: jest.fn(async (path) => {
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
    const { watch } = require('@ringcentral-integration/next-core');
    const pathWatcher = watch.mock.calls.at(-1)[2];
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
    expect(sideWidgetView.closeContent).toHaveBeenCalledWith(
      handles.get('conversation'),
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
    expect(view.mainPath).toBeNull();
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
});
