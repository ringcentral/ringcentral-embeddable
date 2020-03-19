import url from 'url';

function getMessageOrigin() {
  const currentOrigin = window.location.origin;
  const refererURI = document.referrer;
  let messageOrigin = currentOrigin;
  if (refererURI && refererURI.indexOf(currentOrigin) !== 0) {
    if (refererURI.indexOf('https://apps.ringcentral.com') === 0) {
      messageOrigin = 'https://apps.ringcentral.com';
    }
    if (refererURI.indexOf('https://ringcentral.github.io') === 0) {
      messageOrigin = 'https://ringcentral.github.io';
    }
  }
  return messageOrigin;
}

const messageOrigin = getMessageOrigin();

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
          window.opener.postMessage({
            callbackUri
          }, messageOrigin);
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
            window.parent.postMessage({
              callbackUri,
            }, messageOrigin);
          } else {
            // Hidden refresh iframe
            window.parent.postMessage({
              refreshCallbackUri: callbackUri,
            }, messageOrigin);
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
