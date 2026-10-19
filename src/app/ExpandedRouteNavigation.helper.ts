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
  /**
   * Whether a path is outside the signed-in shell, such as the call page,
   * which closes with its call and so is never a page to return to.
   */
  isOutsideShellPath?: (path: string) => boolean;
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
 *
 * A page outside the signed-in shell keeps the previous background: when a
 * call ends, the router goes back past the call page to the page before it,
 * such as a log page, which must still show what was behind it before the
 * call rather than the empty call page.
 */
export function resolveExpandedRouteBackgroundPath({
  currentPath,
  previousBackgroundPath,
  routes,
  isOutsideShellPath,
}: ResolveExpandedRouteBackgroundPathOptions): string | null {
  const matchedRoute = findRoute(currentPath, routes);
  if (matchedRoute?.preserveBackground) {
    return previousBackgroundPath ?? matchedRoute.sideWidget?.backgroundPath ?? null;
  }
  if (isOutsideShellPath?.(currentPath)) {
    return previousBackgroundPath;
  }
  return currentPath;
}
