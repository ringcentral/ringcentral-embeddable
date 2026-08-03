import {
  resolveExpandedRouteBackgroundPath,
  shouldCollapseExpandedLayout,
} from '../../next/app/ExpandedRouteNavigation.helper';

const routes = [
  {
    path: '/customized/:pageId',
    exact: true,
    layout: 'detail',
    preserveBackground: true,
  },
  {
    path: '/settings',
    exact: true,
  },
  {
    path: '/settings/region',
    layout: 'detail',
  },
  {
    path: '/settings/audio',
    layout: 'detail',
  },
  {
    path: '/settings/autoCallLogSettings',
    layout: 'detail',
  },
  {
    path: '/settings/autoCallLogSettings/callLogging',
    layout: 'detail',
  },
];

describe('shouldCollapseExpandedLayout', () => {
  test('closes expanded when leaving a detail route for its main page', () => {
    expect(
      shouldCollapseExpandedLayout({
        currentPath: '/settings',
        expanded: true,
        previousPath: '/settings/region',
        routes,
      }),
    ).toBe(true);
  });

  test('keeps expanded when navigating between detail routes', () => {
    expect(
      shouldCollapseExpandedLayout({
        currentPath: '/settings/audio',
        expanded: true,
        previousPath: '/settings/region',
        routes,
      }),
    ).toBe(false);
  });

  test('keeps expanded when returning to a parent detail route', () => {
    expect(
      shouldCollapseExpandedLayout({
        currentPath: '/settings/autoCallLogSettings',
        expanded: true,
        previousPath: '/settings/autoCallLogSettings/callLogging',
        routes,
      }),
    ).toBe(false);
  });

  test('does not change an already folded layout', () => {
    expect(
      shouldCollapseExpandedLayout({
        currentPath: '/settings',
        expanded: false,
        previousPath: '/settings/region',
        routes,
      }),
    ).toBe(false);
  });

  test('does not collapse when opening a detail route', () => {
    expect(
      shouldCollapseExpandedLayout({
        currentPath: '/settings/region',
        expanded: true,
        previousPath: '/settings',
        routes,
      }),
    ).toBe(false);
  });

  test('uses the first matching route like Router Switch', () => {
    expect(
      shouldCollapseExpandedLayout({
        currentPath: '/settings',
        expanded: true,
        previousPath: '/settings/audio',
        routes: [
          {
            path: '/settings',
          },
          {
            path: '/settings/audio',
            layout: 'detail',
          },
        ],
      }),
    ).toBe(false);
  });
});

describe('resolveExpandedRouteBackgroundPath', () => {
  test('keeps the previous main route for a customized detail page', () => {
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

  test('uses the current route for ordinary pages and detail pages', () => {
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
