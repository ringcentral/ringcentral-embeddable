import type { EmbeddableAnalyticsOptions } from "./Analytics.interface";

type AnalyticsConfigInput = {
  appName: string;
  appVersion: string;
  analyticsKey: string;
  enableAnalytics: boolean;
};

/**
 * Builds the analytics DI options from the public runtime configuration.
 *
 * The upstream analytics only loads Mixpanel and sends events when
 * `enableMixpanel` is set, so it follows whether a Mixpanel key was built in.
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
    enableMixpanel: !!analyticsKey,
    enableExternalAnalytics: enableAnalytics,
  };
}
