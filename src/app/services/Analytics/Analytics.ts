import {
  Analytics as AnalyticsBase,
  Environment,
  KeepBeat,
  TrackPropsService,
} from "@ringcentral-integration/micro-auth/src/app/services";
import type { TrackRouter } from "@ringcentral-integration/micro-auth/src/app/services/Analytics/Analytics.interface";
import {
  delegate,
  dynamic,
  fromWatchValue,
  inject,
  injectable,
  optional,
  PortManager,
  RouterPlugin,
  takeUntilAppDestroy,
} from "@ringcentral-integration/next-core";
import {
  BehaviorSubject,
  defer,
  filter,
  firstValueFrom,
  map,
  mergeMap,
  retry,
  switchMap,
  tap,
  timer,
  type Observable,
} from "rxjs";

import {
  LEGACY_ANALYTICS,
  LEGACY_TRACK_ROUTERS_MAP,
} from "./Analytics.constants";
import type {
  EmbeddableAnalyticsOptions,
  LegacyAnalyticsIdentity,
} from "./Analytics.interface";
import type { EmbeddableTrackProps } from "./EmbeddableTrackProps";
import { formatExternalAnalyticsEvent } from "./formatExternalAnalyticsEvent";
import { getLegacyTrackRoute } from "./getLegacyTrackRoute";
import { LegacyMixpanel } from "./LegacyMixpanel";
import { toLegacyPageView } from "./toLegacyPageView";

const MIXPANEL_LOAD_RETRY_COUNT = 3;
const MIXPANEL_LOAD_RETRY_DELAY = 500;

/**
 * Keeps the legacy Embeddable analytics contract on top of the upstream
 * analytics flow: legacy event names and page views, the host-visible
 * analytics event, and a Mixpanel transport with hashed legacy identities.
 *
 * The upstream Mixpanel transport is disabled because it identifies users by
 * raw owner id. The upstream flow still collects the track props and emits
 * `track$` on the window client, which feeds the legacy transport.
 */
@injectable({
  name: "Analytics",
})
class Analytics extends AnalyticsBase {
  @dynamic("AdditionalTrackProps")
  private _additionalTrackProps?: EmbeddableTrackProps;

  private readonly _enableExternalAnalytics: boolean;

  private readonly _mixpanelToken: string;

  private readonly _legacyMixpanel$ =
    new BehaviorSubject<LegacyMixpanel | null>(null);

  private readonly _legacyIdentity$: Observable<LegacyAnalyticsIdentity> =
    fromWatchValue(
      this,
      () => [
        this._additionalTrackProps?.hashedUserId ?? null,
        this._additionalTrackProps?.hashedAccountId ?? null,
        this._additionalTrackProps?.environmentName ?? "",
      ] as const,
      { multiple: true }
    ).pipe(
      map(([hashedUserId, hashedAccountId, environment]) => ({
        hashedUserId,
        hashedAccountId,
        environment,
      }))
    );

  constructor(
    keepBeat: KeepBeat,
    private _routerPlugin: RouterPlugin,
    trackPropsService: TrackPropsService,
    private _analyticsPortManager: PortManager,
    @inject("AnalyticsOptions")
    analyticsOptions: EmbeddableAnalyticsOptions,
    @optional() environment?: Environment
  ) {
    super(
      keepBeat,
      _routerPlugin,
      trackPropsService,
      _analyticsPortManager,
      {
        ...analyticsOptions,
        enableMixpanel: false,
        // upstream only emits `track$` when Mixpanel or logging is enabled
        useLog: true,
      },
      environment
    );
    this._enableExternalAnalytics =
      analyticsOptions.enableExternalAnalytics ?? false;
    this._mixpanelToken = analyticsOptions.analyticsKey;
    if (typeof document !== "undefined") {
      this._bindLegacyMixpanel();
      if (this._analyticsPortManager.shared) {
        this._analyticsPortManager.onClient(() => {
          this._bindLegacyPageViewTrack();
        });
      } else {
        this._bindLegacyPageViewTrack();
      }
    }
  }

  override async track(
    event: string,
    properties: Record<string, unknown> = {}
  ): Promise<void> {
    if (isUpstreamNavigationEvent(event)) {
      // replaced by the legacy page view, see `_bindLegacyPageViewTrack`
      return;
    }
    const formatted = formatExternalAnalyticsEvent(event, properties);
    if (!formatted) {
      return;
    }
    this._postExternalEvent(formatted.event, formatted.properties);
    await super.track(formatted.event, formatted.properties);
  }

  @delegate("mainClient")
  override async trackOnMainTab(
    event: string,
    properties: Record<string, unknown> = {}
  ): Promise<void> {
    if (event !== LEGACY_ANALYTICS.pageViewEvent) {
      this._postExternalEvent(event, properties);
    }
    await super.trackOnMainTab(event, properties);
  }

  /**
   * Resolves the tracked page with the legacy route matching rules.
   */
  override getTrackTarget(
    currentPath: string | undefined = this._routerPlugin?.currentPath
  ): TrackRouter | null {
    const route = currentPath ? getLegacyTrackRoute(currentPath) : null;
    return route ? (LEGACY_TRACK_ROUTERS_MAP.get(route) ?? null) : null;
  }

  /**
   * Tracks a legacy page view on every route change, including the initial
   * route, without the upstream focus check.
   */
  private _bindLegacyPageViewTrack(): void {
    fromWatchValue(this, () => this._routerPlugin.currentPath)
      .pipe(
        map((currentPath) => this.getTrackTarget(currentPath)),
        filter((target): target is TrackRouter => !!target),
        mergeMap((target) =>
          super.track(LEGACY_ANALYTICS.pageViewEvent, toLegacyPageView(target))
        ),
        takeUntilAppDestroy
      )
      .subscribe();
  }

  /**
   * Loads Mixpanel whenever a Mixpanel key was built in, like legacy. Unlike
   * upstream, it is not gated by the development data tracking setting;
   * local builds use their own Mixpanel key instead.
   */
  private _bindLegacyMixpanel(): void {
    if (!this._mixpanelToken) {
      return;
    }
    defer(() => LegacyMixpanel.load(this._mixpanelToken))
      .pipe(
        retry({
          count: MIXPANEL_LOAD_RETRY_COUNT,
          delay: (error) => {
            this.logger.error("mixpanel load fail", error);
            return timer(MIXPANEL_LOAD_RETRY_DELAY);
          },
        }),
        switchMap((legacyMixpanel) =>
          this._legacyIdentity$.pipe(
            tap((identity) => {
              legacyMixpanel.syncIdentity(identity);
              // start sending events after the first identity sync
              if (this._legacyMixpanel$.value !== legacyMixpanel) {
                this._legacyMixpanel$.next(legacyMixpanel);
              }
            })
          )
        ),
        takeUntilAppDestroy
      )
      .subscribe();
    this.track$
      .pipe(
        mergeMap(({ event, trackProps }) =>
          this._sendLegacyMixpanelEvent(event, trackProps)
        ),
        takeUntilAppDestroy
      )
      .subscribe();
  }

  private async _sendLegacyMixpanelEvent(
    event: string,
    trackProps: Record<string, unknown>
  ): Promise<void> {
    const legacyMixpanel =
      this._legacyMixpanel$.value ??
      (await firstValueFrom(this._legacyMixpanel$.pipe(filter(Boolean))));
    legacyMixpanel.track(event, trackProps);
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

function isUpstreamNavigationEvent(event: string): boolean {
  return (
    event.startsWith(LEGACY_ANALYTICS.navigationClickPrefix) ||
    event.startsWith(LEGACY_ANALYTICS.navigationLingerPrefix)
  );
}

export { Analytics, Analytics as EmbeddableAnalytics };
