import { CallingSettings } from '@ringcentral-integration/commons/modules/CallingSettingsV2';
import { Module } from '@ringcentral-integration/commons/lib/di';

@Module({
  name: 'NewCallingSettings',
  deps: [
    { dep: 'CallingSettingsOptions', optional: true }
  ]
})
export default class NewCallingSettings extends CallingSettings {
  constructor(deps) {
    super(deps);
    this._defaultCallWith = deps.callingSettingsOptions.defaultCallWith;
  }

  _getDefaultCallWith() {
    if (this._defaultCallWith) {
      const validatedCallWith = this.callWithOptions.find(c => c === this._defaultCallWith);
      if (validatedCallWith) {
        return validatedCallWith;
      }
    }
    return this.callWithOptions && this.callWithOptions[0];
  }

  _handleFirstTimeLogin() {
    if (!this.timestamp) {
      // first time login
      const defaultCallWith = this._getDefaultCallWith();
      this.setDataAction({ callWith: defaultCallWith, timestamp: Date.now() });
      if (!this._emergencyCallAvailable) {
        this._warningEmergencyCallingNotAvailable();
      }
      if (typeof this._onFirstLogin === 'function') {
        this._onFirstLogin();
      }
    }
  }
}
