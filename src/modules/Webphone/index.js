import WebphoneBase from 'ringcentral-integration/modules/Webphone';
import { Module } from 'ringcentral-integration/lib/di';

@Module({
  name: 'Webphone',
  deps: []
})
export default class Webphone extends WebphoneBase {
  // override initialize to instead unload with beforeunload
  initialize() {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        window.addEventListener('load', () => {
          this._prepareVideoElement();
        });
      } else {
        this._prepareVideoElement();
      }
      window.addEventListener('beforeunload', () => {
        if (this.connected) {
          // set timeout to reconnect web phone is before unload cancel
          setTimeout(() => {
            this.connect({
              force: true,
              skipConnectDelay: true,
              skipDLCheck: true,
            });
          }, 3000);
        }
        this._disconnect();
        this._removeCurrentInstanceFromActiveWebphone();
      });
    }
    this.store.subscribe(() => this._onStateChange());
    this._auth.addBeforeLogoutHandler(async () => {
      await this._disconnect();
    });
    this._createOtherWebphoneInstanceListener();
  }
}
