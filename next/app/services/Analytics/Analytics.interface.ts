import type { AnalyticsOptions } from "@ringcentral-integration/micro-auth/src/app/services";

/**
 * Analytics options extended with the legacy host-event bridge toggle.
 */
export interface EmbeddableAnalyticsOptions extends AnalyticsOptions {
  enableExternalAnalytics?: boolean;
}
