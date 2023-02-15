import { Module } from '@ringcentral-integration/commons/lib/di';

import {
  Analytics as AnalyticsBase,
} from '@ringcentral-integration/commons/modules/AnalyticsV2';

@Module({
  name: 'Analytics',
  deps: [
    { dep: 'AnalyticsOptions', optional: true }
  ]
})
export class Analytics extends AnalyticsBase {
  constructor(deps) {
    super(deps);
    this._enableAnalytics = !!deps.analyticsOptions.enableAnalytics;
  }

  onInit() {
    // override to avoid load segment
  }

  onInitOnce() {
    // override to avoid load segment
  }

  _identify() {
    // override to avoid load segment
  }

  track(event, properties = {}) {
    if (!this._enableAnalytics) {
      return;
    }
    if (window && window.parent) {
      window.parent.postMessage({
        type: 'rc-analytics-track',
        event,
        properties,
      }, '*');
    }
  }
}
