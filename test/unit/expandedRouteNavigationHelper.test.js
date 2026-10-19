import {
  isSideWidgetRoutePath,
  resolveExpandedRouteBackgroundPath,
} from '../../src/app/ExpandedRouteNavigation.helper';

const settingsSideWidget = {
  id: 'settings',
  name: 'Settings',
  scope: 'global',
  backgroundPath: '/settings',
};

const routes = [
  {
    path: '/customized/:pageId',
    exact: true,
    preserveBackground: true,
    sideWidget: {
      id: 'customized-page',
      name: 'Page',
      scope: 'global',
      backgroundPath: '/dialer',
      preserveBackground: true,
    },
  },
  {
    path: '/settings',
    exact: true,
  },
  {
    path: '/settings/region',
    sideWidget: settingsSideWidget,
  },
];

describe('isSideWidgetRoutePath', () => {
  test('recognizes an opted-in routed side-widget page', () => {
    expect(
      isSideWidgetRoutePath('/history/call-id', [
        ...routes,
        {
          path: '/history/:callLogId',
          sideWidget: {
            id: 'call-details',
            name: 'Call details',
            scope: 'contact',
            backgroundPath: '/dialer',
          },
        },
      ]),
    ).toBe(true);
  });

  test('does not treat a main page as a side-widget page', () => {
    expect(isSideWidgetRoutePath('/settings', routes)).toBe(false);
  });

  test('uses the first matching route like Router Switch', () => {
    expect(
      isSideWidgetRoutePath('/settings/region', [
        { path: '/settings' },
        ...routes,
      ]),
    ).toBe(false);
  });
});

describe('resolveExpandedRouteBackgroundPath', () => {
  test('keeps the previous main route for a customized page', () => {
    expect(
      resolveExpandedRouteBackgroundPath({
        currentPath: '/customized/crm-details',
        previousBackgroundPath: '/messages',
        routes,
      }),
    ).toBe('/messages');
  });

  test('keeps the original main route between customized pages', () => {
    expect(
      resolveExpandedRouteBackgroundPath({
        currentPath: '/customized/second-page',
        previousBackgroundPath: '/contacts',
        routes,
      }),
    ).toBe('/contacts');
  });

  test('uses the current route for pages that do not preserve it', () => {
    expect(
      resolveExpandedRouteBackgroundPath({
        currentPath: '/settings/region',
        previousBackgroundPath: '/messages',
        routes,
      }),
    ).toBe('/settings/region');
  });

  test('falls back to the route background when no main page preceded it', () => {
    expect(
      resolveExpandedRouteBackgroundPath({
        currentPath: '/customized/crm-details',
        previousBackgroundPath: null,
        routes,
      }),
    ).toBe('/dialer');
  });

  test('keeps the previous background across a page outside the shell', () => {
    const isOutsideShellPath = (path) => path === '/calling';
    // The call page closes with its call, so the page a call returns to, such
    // as a log page, keeps what was behind it before the call.
    const duringCall = resolveExpandedRouteBackgroundPath({
      currentPath: '/calling',
      previousBackgroundPath: '/messages',
      routes,
      isOutsideShellPath,
    });
    expect(duringCall).toBe('/messages');
    expect(
      resolveExpandedRouteBackgroundPath({
        currentPath: '/customized/crm-details',
        previousBackgroundPath: duringCall,
        routes,
        isOutsideShellPath,
      }),
    ).toBe('/messages');
  });

  test('does not preserve the background for a customized tab', () => {
    expect(
      resolveExpandedRouteBackgroundPath({
        currentPath: '/customizedTabs/crm-tab',
        previousBackgroundPath: '/messages',
        routes,
      }),
    ).toBe('/customizedTabs/crm-tab');
  });
});
