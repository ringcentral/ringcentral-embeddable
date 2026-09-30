import type { TrackRouter } from "@ringcentral-integration/micro-auth/src/app/services/Analytics/Analytics.interface";

export type LegacyPageViewProperties = {
  pageName: string;
  currentURL: string;
};

/**
 * Builds the properties of the legacy `Viewed page` event for a tracked
 * route: the page name gets only its first letter capitalized.
 */
export function toLegacyPageView({
  eventPostfix,
  router,
}: TrackRouter): LegacyPageViewProperties {
  const pageName = eventPostfix.toLowerCase();
  return {
    pageName: pageName.charAt(0).toUpperCase() + pageName.slice(1),
    currentURL: router,
  };
}
