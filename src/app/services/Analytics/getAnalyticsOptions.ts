import type { EmbeddableAnalyticsOptions } from "./Analytics.interface";

type AnalyticsConfigInput = {
  appName: string;
  appVersion: string;
  analyticsKey: string;
  enableAnalytics: boolean;
};

/**
 * Builds the analytics DI options from the public runtime configuration.
 */
export function getAnalyticsOptions({
  appName,
  appVersion,
  analyticsKey,
  enableAnalytics,
}: AnalyticsConfigInput): EmbeddableAnalyticsOptions {
  return {
    appName,
    appVersion,
    analyticsKey,
    enableExternalAnalytics: enableAnalytics,
  };
}
