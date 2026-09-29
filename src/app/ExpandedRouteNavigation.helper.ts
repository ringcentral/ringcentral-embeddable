import { matchPath } from '@ringcentral-integration/next-core';

import type { Route } from './AppView.interface';

type SideWidgetRoute = Pick<
  Route,
  'exact' | 'path' | 'preserveBackground' | 'sideWidget'
>;

interface ResolveExpandedRouteBackgroundPathOptions {
  currentPath: string;
  previousBackgroundPath: string | null;
  routes: readonly SideWidgetRoute[];
}

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

/**
 * Resolves the main-column route to retain behind a side widget page that
 * preserves the page it was opened from.
 */
export function resolveExpandedRouteBackgroundPath({
  currentPath,
  previousBackgroundPath,
  routes,
}: ResolveExpandedRouteBackgroundPathOptions): string | null {
  const matchedRoute = findRoute(currentPath, routes);
  return matchedRoute?.preserveBackground
    ? previousBackgroundPath
    : currentPath;
}
