import Webphone from 'ringcentral-integration/modules/Webphone';
import { Module } from 'ringcentral-integration/lib/di';

@Module({
  name: 'NewWebphone',
  deps: []
})
export default class NewWebphone extends Webphone {
  async _removeWebphone() {
    if (!this._webphone || !this._webphone.userAgent) {
      return;
    }
    this._webphone.userAgent.stop();
    try {
      await this._waitUnregistered(this._webphone.userAgent);
    } catch (e) {
      console.error(e);
    }
    try {
      this._webphone.userAgent.removeAllListeners();
      this._webphone.userAgent.transport.removeAllListeners();
      if (this._webphone.userAgent.transport.isConnected()) {
        this._webphone.userAgent.transport.disconnect();
      }
      if (this._webphone.userAgent.transport.reconnectTimer) {
        clearTimeout(this._webphone.userAgent.transport.reconnectTimer);
        this._webphone.userAgent.transport.reconnectTimer = undefined;
      }
      if (this._webphone.userAgent.transport.__clearSwitchBackTimer) {
        this._webphone.userAgent.transport.__clearSwitchBackTimer();
      }
    } catch (e) {
      console.error(e);
      // ignore clean listener error
    }
    this._webphone = null;
  }
}
