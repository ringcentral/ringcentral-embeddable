import { matchPath } from '@ringcentral-integration/next-core';

import type { Route } from './AppView.interface';

type DetailRoute = Pick<
  Route,
  'exact' | 'layout' | 'path' | 'preserveBackground'
>;

interface ShouldCollapseExpandedLayoutOptions {
  currentPath: string;
  expanded: boolean;
  previousPath: string;
  routes: readonly DetailRoute[];
}

interface ResolveExpandedRouteBackgroundPathOptions {
  currentPath: string;
  previousBackgroundPath: string | null;
  routes: readonly DetailRoute[];
}

function findRoute(
  path: string,
  routes: readonly DetailRoute[],
): DetailRoute | undefined {
  return routes.find((route) =>
    Boolean(
      matchPath(path, {
        exact: route.exact,
        path: route.path,
      }),
    ),
  );
}

function isDetailPath(path: string, routes: readonly DetailRoute[]): boolean {
  const matchedRoute = findRoute(path, routes);
  return matchedRoute?.layout === 'detail';
}

/**
 * Resolves the main-column route to retain behind an expanded detail page.
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
