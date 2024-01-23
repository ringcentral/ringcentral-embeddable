
import mixpanel from 'mixpanel-browser';

export class AnalyticsBrowser {
  protected _mixpanel?: any = null;
  
  constructor(mixpanelToken) {
    mixpanel.init(mixpanelToken);
    this._mixpanel = mixpanel;
  }

  load() {
    // do nothing
  }

  identify(userId, props = {}) {
    mixpanel.identify(userId);
    mixpanel.people.set(props);
  }

  track(event, props) {
    if (!this._mixpanel) {
      return;
    }
    this._mixpanel.track(event, props);
  }

  group(accountId) {
    if (!this._mixpanel) {
      return;
    }
    this._mixpanel.add_group('rcAccountId', accountId);
    this._mixpanel.set_group('rcAccountId', accountId);
  }

  page(name, data = {}) {
    if (!this._mixpanel) {
      return;
    }
    try {
      this._mixpanel.track_pageview(
        {
          ...data
        },
        {
          event_name: `Viewed ${name}`
        }
      );
    }
    catch (e) {
      console.log(e)
    }
  }
}
