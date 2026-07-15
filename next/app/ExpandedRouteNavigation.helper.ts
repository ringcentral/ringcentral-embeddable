import { matchPath } from '@ringcentral-integration/next-core';

import type { Route } from './AppView.interface';

type DetailRoute = Pick<Route, 'exact' | 'layout' | 'path'>;

interface ShouldCollapseExpandedLayoutOptions {
  currentPath: string;
  expanded: boolean;
  previousPath: string;
  routes: readonly DetailRoute[];
}

function isDetailPath(path: string, routes: readonly DetailRoute[]): boolean {
  const matchedRoute = routes.find((route) =>
    Boolean(
      matchPath(path, {
        exact: route.exact,
        path: route.path,
      }),
    ),
  );
  return matchedRoute?.layout === 'detail';
}

/**
 * Determines whether leaving a detail route should close the expanded layout.
 */
export function shouldCollapseExpandedLayout({
  currentPath,
  expanded,
  previousPath,
  routes,
}: ShouldCollapseExpandedLayoutOptions): boolean {
  if (!expanded || currentPath === previousPath) {
    return false;
  }
  return (
    isDetailPath(previousPath, routes) && !isDetailPath(currentPath, routes)
  );
}
