import ProxyFrameController from 'ringcentral-widgets/lib/ProxyFrameController';

export default class NewProxyFrameController extends ProxyFrameController {
  constructor(options) {
    super(options);
    window.addEventListener('message', ({ data }) => {
      if (!data) {
        return;
      }
      const {
        callbackUri,
      } = data;

      if (callbackUri) {
        window.parent.postMessage({
          callbackUri,
        }, '*');
      }
    });
  }
}
