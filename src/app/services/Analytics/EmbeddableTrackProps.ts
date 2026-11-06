import type { SDKConfig } from "@ringcentral-integration/commons/lib/createSdkConfig";
import {
  Environment,
  type Auth,
  type ExtensionDevice,
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

import type { AppFeatures } from "../AppFeatures";
import { LEGACY_ANALYTICS } from "./Analytics.constants";
import type {
  AnalyticsUserType,
  EmbeddableAnalyticsOptions,
  LegacyAnalyticsIdentity,
} from "./Analytics.interface";
import { hashAnalyticsId } from "./hashAnalyticsId";

/**
 * Provides the legacy Embeddable super properties for every analytics event
 * through the upstream `AdditionalTrackProps` extension point, plus the
 * Mixpanel identity.
 */
@injectable({
  name: "AdditionalTrackProps",
})
class AdditionalTrackProps extends RcModule implements IAdditionalTrackProps {
  @dynamic("Auth")
  private _auth?: Auth;

  @dynamic("ExtensionInfo")
  private _extensionInfo?: ExtensionInfo;

  @dynamic("AppFeatures")
  private _appFeatures?: AppFeatures;

  @dynamic("ExtensionDevice")
  private _extensionDevice?: ExtensionDevice;

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
   * Raw account id, used as the Mixpanel `accountId` profile property and
   * group. Events get it from the upstream `accountId` track prop.
   */
  get accountId(): string | null {
    const accountId = this._extensionInfo?.accountId;
    return accountId ? String(accountId) : null;
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
   * Products the user is licensed for: RingEX when the extension has a
   * digital line, RingCX when it is a contact center account. `null` until
   * either is known.
   */
  @computed((that: AdditionalTrackProps) => [
    that._extensionDevice?.devices,
    that._appFeatures?.hasRingCXPermission,
  ])
  get userType(): AnalyticsUserType | null {
    const hasRingEX = (this._extensionDevice?.devices.length ?? 0) > 0;
    const hasRingCX = this._appFeatures?.hasRingCXPermission ?? false;
    if (hasRingEX && hasRingCX) {
      return "EX+CX";
    }
    if (hasRingEX) {
      return "EX";
    }
    return hasRingCX ? "CX" : null;
  }

  /**
   * Current legacy Mixpanel identity.
   */
  get identity(): LegacyAnalyticsIdentity {
    return {
      hashedUserId: this.hashedUserId,
      hashedAccountId: this.hashedAccountId,
      accountId: this.accountId,
      environment: this.environmentName,
      userType: this.userType,
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
      userType: this.userType,
    };
  }
}

export { AdditionalTrackProps as EmbeddableTrackProps };
