import crypto from 'crypto';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { watch } from '@ringcentral-integration/core';
import type { TrackRouter } from '@ringcentral-integration/commons/modules/AnalyticsV2/Analytics.interface';
import { Analytics as AnalyticsBase } from './AnalyticsBase';
import { AnalyticsBrowser } from './AnalyticsBrowser';
import { trackRouters } from './trackRouters';

const FILTERED_EVENTS = [
  'WebRTC registration',
  'Meeting: Click Schedule/Meeting schedule page',
  'Call: Outbound RingOut Call connected',
];

function formatEvent(event, props) {
  let eventName = event;
  let eventProps = props;
  if (event.indexOf('Call Control:') > -1) {
    eventName = 'Call interaction';
    let callInteractionName = event.replace('Call Control: ', '');
    let callInteractionLocation = 'Call control page';
    if (callInteractionName.indexOf('/') > -1) {
      [callInteractionName, callInteractionLocation] = callInteractionName.split('/');
    }
    eventProps = {
      ...props,
      callInteractionName,
      callInteractionLocation,
    };
  } else if (event.indexOf('(All Calls)') > -1) {
    eventName = 'Call interaction';
    let callInteractionName = event.replace(' (All Calls)', '');
    let callInteractionLocation = 'All calls page';
    eventProps = {
      ...props,
      callInteractionName,
      callInteractionLocation,
    };
  } else if (event.indexOf('(Call Control)') > -1) {
    eventName = 'Call interaction';
    let callInteractionName = event.replace(' (Call Control)', '');
    let callInteractionLocation = 'Call control page';
    eventProps = {
      ...props,
      callInteractionName,
      callInteractionLocation,
    };
  } else if (
    event.indexOf('Click To Dial') > -1 ||
    event.indexOf('Click To dial') > -1
  ) {
    eventName = 'Click To dial';
    let interactionLocation = '';
    if (event.indexOf('(') > -1 && event.indexOf(')') > -1) {
      interactionLocation = event.substring(event.indexOf('(') + 1, event.indexOf(')'));
    }
    eventProps = {
      ...props,
      interactionLocation,
    };
  } else if (event.indexOf('Click To SMS') > -1) {
    eventName = 'Click to SMS';
    let interactionLocation = '';
    if (event.indexOf('(') > -1 && event.indexOf(')') > -1) {
      interactionLocation = event.substring(event.indexOf('(') + 1, event.indexOf(')'));
    }
    eventProps = {
      ...props,
      interactionLocation,
    };
  }
  return {
    formattedEvent: eventName,
    formattedProperties: eventProps,
  };
}

type AnalyticsUserType = 'EX' | 'CX' | 'EX+CX';

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
    { dep: 'AnalyticsOptions', optional: true },
    { dep: 'ExtensionDevice', optional: true },
    { dep: 'AppFeatures', optional: true },
  ]
})
export class Analytics extends AnalyticsBase {
  protected _trackRouters: TrackRouter[];
  protected _enableExternalAnalytics: boolean;
  protected _segment: AnalyticsBrowser;
  protected _hashedAccountId: string | null;
  protected _accountId: string | null;
  protected _identified: boolean;

  constructor(deps) {
    super(deps);
    // only read for the user type, which updates when they load, so
    // analytics and its dependents (Adapter...) do not wait for login data
    this._ignoreModuleReadiness(deps.extensionDevice);
    this._ignoreModuleReadiness(deps.appFeatures);
    if (deps.analyticsOptions.analyticsKey) {
      this._segment = new AnalyticsBrowser(deps.analyticsOptions.analyticsKey);
    }
    this._trackRouters = trackRouters;
    this._enableExternalAnalytics = !!deps.analyticsOptions.enableExternalAnalytics;
    this._hashedAccountId = null;
    this._accountId = null;
    this._identified = false;
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
    // devices and features can load after identify, update the profile then
    watch(
      this,
      () => this.userType,
      (userType) => {
        if (this._identified && userType) {
          this.analytics?.setUserProperties({ userType });
        }
      },
    );
  }

  identify(options) {
    const hashedAccountId = getHashId(options.accountId);
    const accountId = options.accountId ? String(options.accountId) : null;
    this._identify({
      userId: options.userId,
      rcAccountId: hashedAccountId,
      accountId,
      environment: this._deps.environment.environmentName,
      ...(this.userType ? { userType: this.userType } : {}),
    });
    this._identified = true;
    if (accountId) {
      this._hashedAccountId = hashedAccountId;
      this._accountId = accountId;
      this.analytics?.group('rcAccountId', hashedAccountId);
      this.analytics?.group('accountId', accountId);
    }
  }

  track(event, properties = {}) {
    if (FILTERED_EVENTS.indexOf(event) !== -1) {
      return;
    }
    const {
      formattedEvent,
      formattedProperties,
    } = formatEvent(event, properties);
    if (this._enableExternalAnalytics && window && window.parent) {
      window.parent.postMessage({
        type: 'rc-analytics-track',
        event: formattedEvent,
        properties: formattedProperties,
      }, '*');
    }
    if (!this.analytics) {
      return;
    }
    const trackProps = {
      ...this.trackProps,
      ...formattedProperties,
      ...this.extendedProps.get(event),
    };

    this.analytics.track(formattedEvent, trackProps);
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
      currentURL: target.router,
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
    const needMatchSecondRoutes = [
      'calls',
      'settings',
      'conferenceCall',
      'meeting',
      'glip',
      'contacts',
      'log',
      'history',
      'messages',
    ];
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
      accountId: this._accountId,
      environment: this._deps.environment.environmentName,
      userType: this.userType,
    };
  }

  /**
   * Products the user is licensed for: RingEX when the extension has a
   * digital line, RingCX when it is a contact center account. `null` until
   * either is known.
   */
  get userType(): AnalyticsUserType | null {
    const hasRingEX = (this._deps.extensionDevice?.devices.length ?? 0) > 0;
    const hasRingCX = this._deps.appFeatures?.hasRingCXPermission ?? false;
    if (hasRingEX && hasRingCX) {
      return 'EX+CX';
    }
    if (hasRingEX) {
      return 'EX';
    }
    return hasRingCX ? 'CX' : null;
  }

  get analytics() {
    return this._segment;
  }
}
