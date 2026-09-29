import type { RouterPlugin } from '@ringcentral-integration/next-core';

interface RouterFallbackLocation {
  /** Only ports that render the app own a browser history. */
  readonly history?: unknown;
  /** Location the router seeds its state with when it has no history. */
  defaultHistory?: unknown;
}

/**
 * Loading modules at runtime rebuilds the router reducer, and the rebuilt
 * reducer seeds its state from the port's own browser history. The shared
 * worker has none, so it falls back to the router's default location and then
 * reports `/` as the current path. The login route guard runs on that port and
 * answers a `/` path by sending every window to the app's default route, which
 * drops the user on the Phone tab in the middle of an unrelated flow.
 *
 * Pointing the fallback at the route the port already holds keeps the rebuilt
 * state on the current page.
 */
export function keepRouterPathOnLoad(router: RouterPlugin): void {
  const fallback = router as unknown as RouterFallbackLocation;
  if (fallback.history || !router.router) {
    return;
  }
  fallback.defaultHistory = router.router;
}
