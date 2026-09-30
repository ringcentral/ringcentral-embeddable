import type { EmbeddableAnalyticsOptions } from "./Analytics.interface";

type AnalyticsConfigInput = {
  appName: string;
  appVersion: string;
  analyticsKey: string;
  enableAnalytics: boolean;
  userAgent?: string;
  clientId?: string;
};

/**
 * Builds the analytics DI options from the public runtime configuration.
 *
 * Mixpanel is sent by the Embeddable analytics transport whenever a Mixpanel
 * key was built in; `enableAnalytics` only controls the host-visible event.
 */
export function getAnalyticsOptions({
  appName,
  appVersion,
  analyticsKey,
  enableAnalytics,
  userAgent,
  clientId,
}: AnalyticsConfigInput): EmbeddableAnalyticsOptions {
  return {
    appName,
    appVersion,
    analyticsKey,
    enableExternalAnalytics: enableAnalytics,
    externalAppName: userAgent ? userAgent.split("/")[0] : undefined,
    externalClientId: clientId,
  };
}
