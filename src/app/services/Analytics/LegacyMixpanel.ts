import type mixpanel from "mixpanel-browser";

import { LEGACY_ANALYTICS } from "./Analytics.constants";
import type { LegacyAnalyticsIdentity } from "./Analytics.interface";

type Mixpanel = typeof mixpanel;

/**
 * Mixpanel transport that keeps the legacy Embeddable identity and URL
 * handling: hashed distinct id, hashed `rcAccountId` and raw `accountId`
 * groups, `localStorage` persistence, and no app URL query string in event
 * properties.
 */
export class LegacyMixpanel {
  private _identifiedUserId: string | null = null;

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
   * Identifies the hashed user and links the hashed and raw account groups
   * once per user, account, environment and user type. The user type is set
   * on the profile only once it is known.
   */
  syncIdentity({
    hashedUserId,
    hashedAccountId,
    accountId,
    environment,
    userType,
  }: LegacyAnalyticsIdentity): void {
    if (!hashedUserId) {
      return;
    }
    // identify once per page load even when the persisted distinct id already
    // matches: Mixpanel only sends profile updates after `identify` was called
    // in the current page, and queues them otherwise
    if (hashedUserId !== this._identifiedUserId) {
      this._identifiedUserId = hashedUserId;
      this._mixpanel.identify(hashedUserId);
    }
    const profileKey = `${hashedUserId}:${accountId}:${environment}:${userType}`;
    if (!hashedAccountId || !accountId || profileKey === this._profileKey) {
      return;
    }
    this._profileKey = profileKey;
    this._mixpanel.people.set({
      rcAccountId: hashedAccountId,
      accountId,
      environment,
      ...(userType ? { userType } : {}),
    });
    this._linkGroup(LEGACY_ANALYTICS.accountGroupKey, hashedAccountId);
    this._linkGroup(LEGACY_ANALYTICS.rawAccountGroupKey, accountId);
  }

  private _linkGroup(groupKey: string, groupId: string): void {
    this._mixpanel.add_group(groupKey, groupId);
    this._mixpanel.set_group(groupKey, groupId);
  }

  /**
   * Sends one event. The legacy page view is sent as a Mixpanel page view.
   */
  track(event: string, properties: Readonly<Record<string, unknown>>): void {
    const eventProps = {
      ...properties,
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
