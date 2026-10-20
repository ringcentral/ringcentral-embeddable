import { isSideWidgetRoutePath } from '../../src/app/ExpandedRouteNavigation.helper';

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
