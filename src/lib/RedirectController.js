import url from 'url';

const origins = [
  'https://ringcentral.github.io',
  'https://apps.ringcentral.com',
];

if (origins.indexOf(window.location.origin) < 0) {
  origins.push(window.location.origin);
}

export default class RedirectController {
  constructor({
    prefix,
  } = {}) {
    window.addEventListener('load', () => {
      const callbackUri = window.location.href;
      // RCINT-3477 some devices will have reference to opener, but will throw exception
      // when tring to access opener
      try {
        if (window.opener && window.opener.oAuthCallback) {
          window.opener.oAuthCallback(callbackUri);
          window.close();
          return;
        }
      } catch (e) {
        /* ignore error */
      }

      try {
        if (window.opener && window.opener.postMessage) {
          origins.forEach((origin) => {
            window.opener.postMessage({
              callbackUri
            }, origin);
          });
          window.close();
        }
      } catch (e) {
        console.error(e);
        /* ignore error */
      }
      try {
        if (window.parent && window.parent !== window) {
          if (window.name === 'SSOIframe') {
            // SSO iframe
            origins.forEach((origin) => {
              window.parent.postMessage({
                callbackUri,
              }, origin);
            });
          } else {
            // Hidden refresh iframe
            origins.forEach((origin) => {
              window.parent.postMessage({
                refreshCallbackUri: callbackUri,
              }, origin);
            });
          }
        }
      } catch (e) {
        console.error(e);
        /* ignore error */
      }
      // fall back to use localStorage as a vessel to avoid opener is null bug

      const {
        query: {
          state,
        },
      } = url.parse(callbackUri, true);
      if (!state) {
        return;
      }
      const uuid = state.split('-').slice(1).join('-');
      const key = `${prefix}-${uuid}-redirect-callbackUri`;
      localStorage.removeItem(key);
      window.addEventListener('storage', (e) => {
        if (e.key === key && (!e.newValue || e.newValue === '')) {
          window.close();
        }
      });
      localStorage.setItem(key, callbackUri);
    });
  }
}
