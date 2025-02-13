
import mixpanel from 'mixpanel-browser';

mixpanel._$$track = mixpanel.track;
mixpanel.track = (...params) => {
  const props = params[1] || {};
  props['$current_url'] = `${window.location.origin}${window.location.pathname}`;
  props['current_url_search'] = '';
  if (params.length === 1) {
    params.push(props);
  } else {
    params[1] = props;
  }
  return mixpanel._$$track(...params);
}

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

  page(name = '', data = {}) {
    if (!this._mixpanel) {
      return;
    }
    let formatName = name.toLowerCase();
    // make first letter uppercase
    if (formatName.length > 0){
      formatName = formatName.charAt(0).toUpperCase() + formatName.slice(1);
    }
    try {
      this._mixpanel.track_pageview(
        {
          ...data,
          pageName: formatName,
        },
        {
          event_name: 'Viewed page',
        }
      );
    }
    catch (e) {
      console.log(e)
    }
  }
}
