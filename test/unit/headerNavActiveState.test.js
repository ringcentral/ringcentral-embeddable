jest.mock('@ringcentral-integration/micro-core/src/app/views', () => ({
  HeaderNavViewSpring: class HeaderNavViewSpring {
    constructor(locale, router, options) {
      this._locale = locale;
      this._router = router;
      this._headerNavViewOptions = options;
    }

    get dialTab() {
      return { title: 'Phone', to: '/dialer', active: false };
    }

    get textTab() {
      // The base tab memoizes this flag, so it can arrive stale.
      return { title: 'Text', to: '/messages', active: false };
    }

    get faxTab() {
      return { title: 'Fax', to: '/fax' };
    }

    get settingsTab() {
      return { title: 'Settings', to: '/settings', active: false };
    }

    getUIProps() {
      return { tabs: this.tabs, currentPath: this._router.currentPath };
    }
  },
}));

jest.mock(
  '../../src/app/views/HeaderNavView/components/HeaderNavWithOverflow',
  () => ({
    HeaderNavWithOverflow: () => null,
  }),
);

jest.mock('../../src/app/views/RoutedSideWidgetView', () => ({
  RoutedSideWidgetView: class RoutedSideWidgetView {},
}));

import { HeaderNavViewSpring } from '../../src/app/views/HeaderNavView';

/**
 * `mainColumnPath` is where the main column renders, the current path on a
 * main page and the page behind it on a routed side widget page.
 */
function createView(currentPath, mainColumnPath = currentPath) {
  const view = new HeaderNavViewSpring(
    {},
    { currentPath, push: jest.fn() },
    { isRCV: true },
    { customizedTabs: [] },
    { themeType: 'light' },
    { getMainColumnPath: () => mainColumnPath, navigateMain: jest.fn() },
    { enableVideoTab: true },
  );
  view._appFeatures = {
    isCallingEnabled: true,
    hasReadExtensionCallLog: true,
    hasReadTextPermission: true,
    hasReadFaxPermission: true,
    hasMeetingsPermission: true,
    isContactsEnabled: true,
    showAgentTab: true,
  };
  return view;
}

function activeTabs(currentPath, mainColumnPath) {
  return createView(currentPath, mainColumnPath)
    .getUIProps()
    .tabs.filter(({ active }) => active)
    .map(({ to }) => to);
}

describe('header nav active state', () => {
  test.each([
    ['/dialer', '/dialer'],
    ['/messages', '/messages'],
    ['/conversations/first', '/messages'],
    ['/composeText', '/messages'],
    ['/contacts/personal/1', '/contacts'],
    ['/meeting', '/meeting'],
    ['/fax', '/fax'],
    ['/settings/calling', '/settings'],
  ])('lights one tab for %s', (currentPath, expected) => {
    expect(activeTabs(currentPath)).toEqual([expected]);
  });

  test('keeps agent sub routes on the agent tab alone', () => {
    expect(activeTabs('/agent/home/dialer')).toEqual(['/agent']);
  });

  test('follows the main column over the routed page', () => {
    expect(activeTabs('/conversations/first', '/dialer')).toEqual(['/dialer']);
    expect(activeTabs('/history/call-1', '/dialer')).toEqual(['/dialer']);
  });

  test('lights the agent tab for an agent home parked behind a routed page', () => {
    expect(activeTabs('/history/call-1', '/agent/home')).toEqual(['/agent']);
  });

  test('ignores a main path that belongs to no tab', () => {
    expect(activeTabs('/conversations/first', '/customizedTabs/gone')).toEqual([
      '/messages',
    ]);
  });
});
