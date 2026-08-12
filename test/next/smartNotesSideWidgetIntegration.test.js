import { SideWidgetView } from '../../next/app/views/SideWidgetView/SideWidget.view';
import { SmartNotesView } from '../../next/app/views/SmartNotesView/SmartNotes.view';
import { RoutedSideWidgetView } from '../../next/app/views/RoutedSideWidgetView/RoutedSideWidget.view';

jest.mock('@ringcentral/mfe-react', () => ({
  dynamicLoad: jest.fn(),
  useApp: jest.fn(() => () => null),
}));

jest.mock('@ringcentral/juno/foundation', () => ({
  useTheme: jest.fn(() => ({})),
}));

jest.mock('@ringcentral-integration/micro-core/src/app/components', () => ({
  AppProvider: ({ children }) => children,
  useAppFooter: () => ({ footer: null }),
  useAppHeader: () => ({ nav: null }),
}));

jest.mock('../../next/app/services/SmartNotes', () => ({
  SmartNotes: class SmartNotes {},
}));

jest.mock('../../next/app/views/ExpandedView', () => ({
  ExpandedView: class ExpandedView {},
}));

test('opens Smart Notes alongside an existing call-details tab', async () => {
  const expandedHandles = new Map();
  const expandedView = {
    activeContentId: null,
    create: jest.fn((options) => {
      const handle = { options };
      expandedHandles.set(options.id, handle);
      return handle;
    }),
    open: jest.fn(function open(handle) {
      this.activeContentId = Array.from(expandedHandles.entries()).find(
        ([, registeredHandle]) => registeredHandle === handle,
      )?.[0];
    }),
    close: jest.fn(),
  };
  const sideWidgetView = new SideWidgetView(
    expandedView,
    {
      apps: [],
      pinAppIds: [],
      toggleAppPin: jest.fn(),
      loadAppPage: jest.fn(),
    },
    { themeType: 'light' },
    { enableSideWidget: true },
  );
  const router = {
    currentPath: '/history/telephony-session',
    push: jest.fn(async () => undefined),
  };
  const routedSideWidgetView = new RoutedSideWidgetView(
    sideWidgetView,
    router,
    { expanded: true },
  );
  routedSideWidgetView.open({
    config: {
      id: 'call-details',
      name: 'Call details',
      scope: 'contact',
      backgroundPath: '/dialer',
    },
    contact: { phoneNumber: '+16505550100' },
    detailComponent: () => null,
    detailProps: {},
    path: '/history/telephony-session',
    routePath: '/history/:callLogId',
  });
  let finishOpeningSmartNotes: (() => void) | undefined;
  const openingSmartNotes = new Promise<void>((resolve) => {
    finishOpeningSmartNotes = resolve;
  });
  const smartNotes = {
    session: null,
    viewSmartNote: jest.fn(() => openingSmartNotes),
    setSession: jest.fn(async () => undefined),
  };
  const smartNotesView = new SmartNotesView(
    expandedView,
    sideWidgetView,
    smartNotes,
    { themeType: 'light' },
    {},
  );

  const openResult = smartNotesView.open({
    id: 'telephony-session',
    status: 'Disconnected',
    direction: 'Inbound',
    phoneNumber: '+16505550100',
  });

  expect(sideWidgetView.tabs).toEqual([
    { id: 'call-details', name: 'Call details', scope: undefined },
  ]);
  expect(sideWidgetView.currentTabId).toBe('call-details');
  expect(expandedView.activeContentId).toBe('side-widget');
  expect(router.push).not.toHaveBeenCalled();

  // The delegated session update must not present the same session a second
  // time after the click already selected its SideWidget presentation.
  const sideWidgetOpenCalls = expandedView.open.mock.calls.length;
  smartNotesView._handleSessionChange({
    id: 'telephony-session',
    status: 'Disconnected',
    direction: 'Inbound',
    phoneNumber: '+16505550100',
  });
  expect(sideWidgetView.tabs.map(({ id }) => id)).toEqual([
    'call-details',
  ]);
  expect(expandedView.activeContentId).toBe('side-widget');
  expect(expandedView.open).toHaveBeenCalledTimes(sideWidgetOpenCalls);

  // The delegated session update can synchronize an older ExpandedView state
  // into this client. The requested SideWidget presentation must be restored
  // after that update completes.
  expandedView.activeContentId = null;
  finishOpeningSmartNotes?.();
  await openResult;
  expect(sideWidgetView.tabs.map(({ id }) => id)).toEqual([
    'smart-notes',
    'call-details',
  ]);
  expect(sideWidgetView.currentTabId).toBe('smart-notes');
  expect(expandedView.activeContentId).toBe('side-widget');
});
