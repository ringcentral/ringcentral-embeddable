import { matchPath } from '@ringcentral-integration/next-core';

import type { Route } from './AppView.interface';

type DetailRoute = Pick<
  Route,
  'exact' | 'layout' | 'path' | 'preserveBackground' | 'sideWidget'
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

interface ShouldRenderExpandedViewOptions {
  currentPath: string;
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

export function isDetailRoutePath(
  path: string,
  routes: readonly DetailRoute[],
): boolean {
  const matchedRoute = findRoute(path, routes);
  return matchedRoute?.layout === 'detail' && !matchedRoute.sideWidget;
}

export function isSideWidgetRoutePath(
  path: string,
  routes: readonly DetailRoute[],
): boolean {
  return Boolean(findRoute(path, routes)?.sideWidget);
}

/**
 * Prevents transient expanded content from competing with a routed detail page
 * for the shared expanded-column portal.
 */
export function shouldRenderExpandedView({
  currentPath,
  routes,
}: ShouldRenderExpandedViewOptions): boolean {
  return !isDetailRoutePath(currentPath, routes);
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
    isDetailRoutePath(previousPath, routes) &&
    !isDetailRoutePath(currentPath, routes)
  );
}
