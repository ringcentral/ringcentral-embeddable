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
