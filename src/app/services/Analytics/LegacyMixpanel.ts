import type mixpanel from "mixpanel-browser";

import { LEGACY_ANALYTICS } from "./Analytics.constants";
import type { LegacyAnalyticsIdentity } from "./Analytics.interface";

type Mixpanel = typeof mixpanel;

/**
 * Mixpanel transport that keeps the legacy Embeddable identity and URL
 * handling: hashed distinct id, `rcAccountId` group, `localStorage`
 * persistence, and no app URL query string in event properties.
 */
export class LegacyMixpanel {
  private _profileKey: string | null = null;

  private constructor(private readonly _mixpanel: Mixpanel) {}

  /**
   * Loads and initializes Mixpanel, only in a window context.
   */
  static async load(token: string): Promise<LegacyMixpanel> {
    const instance = (await import("mixpanel-browser")).default;
    instance.init(token, { persistence: "localStorage" });
    return new LegacyMixpanel(instance);
  }

  /**
   * Identifies the hashed user and links the hashed account group once per
   * user, account and environment.
   */
  syncIdentity({
    hashedUserId,
    hashedAccountId,
    environment,
  }: LegacyAnalyticsIdentity): void {
    if (!hashedUserId) {
      return;
    }
    if (this._mixpanel.get_distinct_id() !== hashedUserId) {
      this._mixpanel.identify(hashedUserId);
    }
    const profileKey = `${hashedUserId}:${hashedAccountId}:${environment}`;
    if (!hashedAccountId || profileKey === this._profileKey) {
      return;
    }
    this._profileKey = profileKey;
    this._mixpanel.people.set({ rcAccountId: hashedAccountId, environment });
    this._mixpanel.add_group(LEGACY_ANALYTICS.accountGroupKey, hashedAccountId);
    this._mixpanel.set_group(LEGACY_ANALYTICS.accountGroupKey, hashedAccountId);
  }

  /**
   * Sends one event. The legacy page view is sent as a Mixpanel page view.
   */
  track(event: string, properties: Readonly<Record<string, unknown>>): void {
    // the raw account id must not be sent, `rcAccountId` carries the hashed one
    const { accountId: _accountId, ...trackProps } = properties;
    const eventProps = {
      ...trackProps,
      $current_url: `${window.location.origin}${window.location.pathname}`,
      current_url_search: "",
    };
    if (event === LEGACY_ANALYTICS.pageViewEvent) {
      this._mixpanel.track_pageview(eventProps, { event_name: event });
      return;
    }
    this._mixpanel.track(event, eventProps);
  }
}
