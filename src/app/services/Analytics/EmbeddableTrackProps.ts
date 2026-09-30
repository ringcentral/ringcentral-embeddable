import type { SDKConfig } from "@ringcentral-integration/commons/lib/createSdkConfig";
import {
  Environment,
  type Auth,
  type ExtensionInfo,
  type IAdditionalTrackProps,
} from "@ringcentral-integration/micro-auth/src/app/services";
import { Brand } from "@ringcentral-integration/micro-core/src/app/services";
import {
  computed,
  dynamic,
  inject,
  injectable,
  optional,
  RcModule,
} from "@ringcentral-integration/next-core";

import { LEGACY_ANALYTICS } from "./Analytics.constants";
import type {
  EmbeddableAnalyticsOptions,
  LegacyAnalyticsIdentity,
} from "./Analytics.interface";
import { hashAnalyticsId } from "./hashAnalyticsId";

/**
 * Provides the legacy Embeddable super properties for every analytics event
 * through the upstream `AdditionalTrackProps` extension point, plus the
 * hashed Mixpanel identity.
 */
@injectable({
  name: "AdditionalTrackProps",
})
class AdditionalTrackProps extends RcModule implements IAdditionalTrackProps {
  @dynamic("Auth")
  private _auth?: Auth;

  @dynamic("ExtensionInfo")
  private _extensionInfo?: ExtensionInfo;

  constructor(
    private _brand: Brand,
    @inject("AnalyticsOptions")
    private _analyticsOptions: EmbeddableAnalyticsOptions,
    @inject("SdkConfig") private _sdkConfig: SDKConfig,
    @optional() private _environment?: Environment
  ) {
    super();
  }

  /**
   * Hashed owner id, used as the Mixpanel distinct id.
   */
  @computed((that: AdditionalTrackProps) => [that._auth?.ownerId])
  get hashedUserId(): string | null {
    return hashAnalyticsId(this._auth?.ownerId);
  }

  /**
   * Hashed account id, used as `rcAccountId` property and group.
   */
  @computed((that: AdditionalTrackProps) => [that._extensionInfo?.accountId])
  get hashedAccountId(): string | null {
    return hashAnalyticsId(this._extensionInfo?.accountId);
  }

  /**
   * Legacy environment name, based on the effective RingCentral server.
   */
  get environmentName(): string {
    const server = this._environment?.enabled
      ? this._environment.server
      : this._sdkConfig.server;
    return server?.includes(LEGACY_ANALYTICS.sandboxServerKeyword)
      ? "Sandbox"
      : "Production";
  }

  /**
   * Current legacy Mixpanel identity.
   */
  get identity(): LegacyAnalyticsIdentity {
    return {
      hashedUserId: this.hashedUserId,
      hashedAccountId: this.hashedAccountId,
      environment: this.environmentName,
    };
  }

  /**
   * Legacy super properties, merged after the upstream default properties.
   */
  get trackProps(): Record<string, unknown> {
    return {
      appName: LEGACY_ANALYTICS.appName,
      appVersion: this._analyticsOptions.appVersion,
      brand: this._brand.defaultConfig.code,
      osPlatform: typeof navigator === "undefined" ? "" : navigator.platform,
      externalAppName: this._analyticsOptions.externalAppName,
      externalClientId: this._analyticsOptions.externalClientId,
      rcAccountId: this.hashedAccountId,
      environment: this.environmentName,
    };
  }
}

export { AdditionalTrackProps as EmbeddableTrackProps };
