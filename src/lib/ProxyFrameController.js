import popWindow from 'ringcentral-widgets/lib/popWindow';

export default class ProxyFrameController {
  constructor({
    prefix,
  } = {}) {
    window.oAuthCallback = (callbackUri) => {
      window.parent.postMessage({
        callbackUri,
      }, '*');
    };

    window.addEventListener('message', ({ data }) => {
      if (!data) {
        return;
      }
      const {
        oAuthUri,
        callbackUri,
      } = data;
      if (oAuthUri) {
        const popedWindow = popWindow(oAuthUri, 'rc-oauth', 600, 600);
        if (!popedWindow) {
          window.parent.postMessage({
            popWindowError: true,
          }, '*');
        }
      }
      if (callbackUri) {
        window.parent.postMessage({
          callbackUri,
        }, '*');
      }
    });

    const key = `${prefix}-redirect-callbackUri`;
    window.addEventListener('storage', (e) => {
      if (e.key === key && e.newValue && e.newValue !== '') {
        const callbackUri = e.newValue;
        window.parent.postMessage({
          callbackUri,
          fromLocalStorage: true,
        }, '*');
        localStorage.removeItem(key);
      }
    });
    // loaded
    window.parent.postMessage({
      proxyLoaded: true,
    }, '*');
  }
}
