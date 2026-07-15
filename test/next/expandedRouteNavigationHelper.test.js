import { shouldCollapseExpandedLayout } from '../../next/app/ExpandedRouteNavigation.helper';

const routes = [
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
