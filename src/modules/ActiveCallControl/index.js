import ActiveCallControl from 'ringcentral-integration/modules/ActiveCallControl';
import { Module } from 'ringcentral-integration/lib/di';

@Module({
  name: 'NewActiveCallControl',
  deps: []
})
export default class NewActiveCallControl extends ActiveCallControl {
  get _hasPermission() {
    return this._rolesAndPermissions.hasActiveCallControlPermission;
  }

  async _onStateChange() {
    if (this._shouldInit()) {
      this.store.dispatch({
        type: this.actionTypes.init,
      });
      this._connectivity = this._connectivityMonitor.connectivity;
      await this._init();
      this.store.dispatch({
        type: this.actionTypes.initSuccess,
      });
    } else if (this._shouldReset()) {
      this._resetModuleStatus();
    } else if (this.ready && this._hasPermission) {
      this._subscriptionHandler();
      this._checkConnectivity();
      this._checkTabActive();
    }
  }
}
