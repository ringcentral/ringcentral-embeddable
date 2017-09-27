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
        console.error(e);
        /* ignore error */
      }
      try {
        if (window.opener && window.opener.postMessage) {
          window.opener.postMessage({
            callbackUri
          }, '*');
          window.close();
        }
      } catch (e) {
        console.error(e);
        /* ignore error */
      }
      // fall back to use localStorage as a vessel to avoid opener is null bug
      const key = `${prefix}-redirect-callbackUri`;
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
