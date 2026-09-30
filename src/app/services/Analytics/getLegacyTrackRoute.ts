import { LEGACY_ANALYTICS } from "./Analytics.constants";

const SECOND_LEVEL_ROUTES: readonly string[] =
  LEGACY_ANALYTICS.secondLevelRoutes;

/**
 * Normalizes a router path to the route key used by legacy page tracking.
 */
export function getLegacyTrackRoute(currentPath: string): string | null {
  const routes = currentPath.split("/");
  if (routes.length >= 3 && SECOND_LEVEL_ROUTES.includes(routes[1])) {
    return routes[1] === "contacts"
      ? "/contacts/details"
      : `/${routes[1]}/${routes[2]}`;
  }
  return routes.length > 1 ? `/${routes[1]}` : null;
}
