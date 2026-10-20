import { matchPath } from '@ringcentral-integration/next-core';

import type { Route } from './AppView.interface';

type SideWidgetRoute = Pick<Route, 'exact' | 'path' | 'sideWidget'>;

function findRoute(
  path: string,
  routes: readonly SideWidgetRoute[],
): SideWidgetRoute | undefined {
  return routes.find((route) =>
    Boolean(
      matchPath(path, {
        exact: route.exact,
        path: route.path,
      }),
    ),
  );
}

export function isSideWidgetRoutePath(
  path: string,
  routes: readonly SideWidgetRoute[],
): boolean {
  return Boolean(findRoute(path, routes)?.sideWidget);
}
