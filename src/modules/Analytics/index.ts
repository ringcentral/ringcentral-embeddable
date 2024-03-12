import crypto from 'crypto';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { watch } from '@ringcentral-integration/core';
import {
  Analytics as AnalyticsBase,
} from '@ringcentral-integration/commons/modules/AnalyticsV2';
import type { TrackRouter } from '@ringcentral-integration/commons/modules/AnalyticsV2/Analytics.interface';
import { AnalyticsBrowser } from './AnalyticsBrowser';
import { trackRouters } from './trackRouters';

const FILTERED_EVENTS = [
  'WebRTC registration',
  'Meeting: Click Schedule/Meeting schedule page',
  'Call: Outbound RingOut Call connected',
];

function getHashId(id) {
  if (!id) {
    return null;
  }
  const secretKey = process.env.ANALYTICS_SECRET_KEY;
  return crypto.createHash('sha256').update(
    `${id}:${secretKey}`
  ).digest('hex');
}

@Module({
  name: 'Analytics',
  deps: [
    'Environment',
    { dep: 'AnalyticsOptions', optional: true }
  ]
})
export class Analytics extends AnalyticsBase {
  protected _trackRouters: TrackRouter[];
  protected _enableExternalAnalytics: boolean;
  protected _segment: AnalyticsBrowser;
  protected _hashedAccountId: string | null;

  constructor(deps) {
    super(deps);
    if (deps.analyticsOptions.analyticsKey) {
      this._segment = new AnalyticsBrowser(deps.analyticsOptions.analyticsKey);
    }
    this._trackRouters = trackRouters;
    this._enableExternalAnalytics = !!deps.analyticsOptions.enableExternalAnalytics;
    this._hashedAccountId = null;
  }

  override onInitOnce() {
    if (this._deps.analyticsOptions.analyticsKey) {
      this._segment.load(); // load segment
    }
    if (this._deps.routerInteraction) {
      // make sure that track if refresh app
      this.trackRouter();
      watch(
        this,
        () => this._deps.routerInteraction!.currentPath,
        (currentPath) => {
          this.trackRouter(currentPath);
        },
      );
    }
  }

  identify(options) {
    const hashedAccountId = getHashId(options.accountId);
    this._identify({
      userId: options.userId,
      rcAccountId: hashedAccountId,
      environment: this._deps.environment.environmentName,
    });
    if (options.accountId) {
      this._hashedAccountId = hashedAccountId;
      this.analytics?.group(hashedAccountId);
    }
  }

  track(event, properties = {}) {
    if (FILTERED_EVENTS.indexOf(event) !== -1) {
      return;
    }
    if (this._enableExternalAnalytics && window && window.parent) {
      window.parent.postMessage({
        type: 'rc-analytics-track',
        event,
        properties,
      }, '*');
    }
    if (!this.analytics) {
      return;
    }
    const trackProps = {
      ...this.trackProps,
      ...properties,
      ...this.extendedProps.get(event),
    };

    this.analytics.track(event, trackProps);
  }

  protected _identify({ userId, ...props }) {
    const hashedUserId = getHashId(userId);
    this.analytics?.identify(hashedUserId, props);
  }

  trackRouter(currentPath = this._deps.routerInteraction?.currentPath) {
    const target = this.getTrackTarget(currentPath);
    if (!target) {
      return;
    }
    this.analytics?.page(target.eventPostfix, {
      path: target.router,
      ...this.trackProps,
    });
  }

  getTrackTarget(
    currentPath = this._deps.routerInteraction?.currentPath,
  ) {
    if (!currentPath) {
      return null;
    }
    const routes = currentPath.split('/');
    let formatRoute: string | null = null;
    const needMatchSecondRoutes = ['calls', 'settings', 'conferenceCall', 'meeting', 'glip', 'contacts', 'log'];
    if (routes.length >= 3 && needMatchSecondRoutes.indexOf(routes[1]) !== -1) {
      formatRoute = `/${routes[1]}/${routes[2]}`;
      if (routes[1] === 'contacts') {
        formatRoute = '/contacts/details'
      }
    } else if (routes.length > 1) {
      formatRoute = `/${routes[1]}`;
    }
    const target = this._trackRouters.find(
      (target) => formatRoute === target?.router,
    );
    return target;
  }

  get trackProps() {
    return {
      appName: 'RingCentral Embeddable',
      appVersion: this._deps.analyticsOptions.appVersion,
      brand: this._deps.brand.defaultConfig.code,
      osPlatform: navigator.platform,
      externalAppName: this._deps.analyticsOptions.externalAppName,
      externalClientId: this._deps.analyticsOptions.externalClientId,
      rcAccountId: this._hashedAccountId,
      environment: this._deps.environment.environmentName,
    };
  }

  get analytics() {
    return this._segment;
  }
}
