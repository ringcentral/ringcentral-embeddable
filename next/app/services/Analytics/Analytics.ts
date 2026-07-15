import {
  Analytics as AnalyticsBase,
  Environment,
  KeepBeat,
  TrackPropsService,
} from "@ringcentral-integration/micro-auth/src/app/services";
import {
  delegate,
  inject,
  injectable,
  optional,
  PortManager,
  RouterPlugin,
} from "@ringcentral-integration/next-core";

import type { EmbeddableAnalyticsOptions } from "./Analytics.interface";
import { formatExternalAnalyticsEvent } from "./formatExternalAnalyticsEvent";

/**
 * Restores the legacy host-visible analytics event without changing the
 * upstream analytics transport.
 */
@injectable({
  name: "Analytics",
})
class Analytics extends AnalyticsBase {
  private readonly _enableExternalAnalytics: boolean;

  constructor(
    keepBeat: KeepBeat,
    router: RouterPlugin,
    trackPropsService: TrackPropsService,
    portManager: PortManager,
    @inject("AnalyticsOptions")
    analyticsOptions: EmbeddableAnalyticsOptions,
    @optional() environment?: Environment
  ) {
    super(
      keepBeat,
      router,
      trackPropsService,
      portManager,
      analyticsOptions,
      environment
    );
    this._enableExternalAnalytics =
      analyticsOptions.enableExternalAnalytics ?? false;
  }

  override async track(
    event: string,
    properties: Record<string, unknown> = {}
  ): Promise<void> {
    const formatted = formatExternalAnalyticsEvent(event, properties);
    if (!formatted) {
      return;
    }

    if (!isNextRouteTrackingEvent(event)) {
      this._postExternalEvent(formatted.event, formatted.properties);
    }
    await super.track(formatted.event, formatted.properties);
  }

  @delegate("mainClient")
  override async trackOnMainTab(
    event: string,
    properties: Record<string, unknown> = {}
  ): Promise<void> {
    if (!isNextRouteTrackingEvent(event)) {
      this._postExternalEvent(event, properties);
    }
    await super.trackOnMainTab(event, properties);
  }

  private _postExternalEvent(
    event: string,
    properties: Record<string, unknown>
  ): void {
    if (
      !this._enableExternalAnalytics ||
      typeof window === "undefined" ||
      !window.parent
    ) {
      return;
    }
    window.parent.postMessage(
      {
        type: "rc-analytics-track",
        event,
        properties,
      },
      "*"
    );
  }
}

function isNextRouteTrackingEvent(event: string): boolean {
  return (
    event.startsWith("Navigation: Click/") ||
    event.startsWith("Navigation: Linger/")
  );
}

export { Analytics, Analytics as EmbeddableAnalytics };
