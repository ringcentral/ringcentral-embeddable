import type { AnalyticsOptions } from "@ringcentral-integration/micro-auth/src/app/services";

/**
 * Analytics options extended with the legacy host-event bridge toggle and
 * the legacy Embeddable track properties.
 */
export interface EmbeddableAnalyticsOptions extends AnalyticsOptions {
  enableExternalAnalytics?: boolean;
  /**
   * Host app name, parsed from the `userAgent` app parameter.
   */
  externalAppName?: string;
  /**
   * RingCentral client id of the host app.
   */
  externalClientId?: string;
}

/**
 * Legacy Mixpanel identity, with ids already hashed.
 */
export interface LegacyAnalyticsIdentity {
  hashedUserId: string | null;
  hashedAccountId: string | null;
  environment: string;
}
