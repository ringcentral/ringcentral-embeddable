import CallingSettings from 'ringcentral-integration/modules/CallingSettings';
import callingOptions from 'ringcentral-integration/modules/CallingSettings/callingOptions';
import { Module } from 'ringcentral-integration/lib/di';

@Module({
  name: 'NewCallingSettings',
  deps: [
    { dep: 'CallingSettingsOptions', optional: true }
  ]
})
export default class NewCallingSettings extends CallingSettings {
  constructor({ defaultCallWith, ...options }) {
    super(options);
    this._defaultCallWith = callingOptions[defaultCallWith];
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

  async _init() {
    if (!this._rolesAndPermissions.callingEnabled) return;
    this._myPhoneNumbers = this.myPhoneNumbers;
    this._otherPhoneNumbers = this.otherPhoneNumbers;
    this._ringoutEnabled = this._rolesAndPermissions.ringoutEnabled;
    this._webphoneEnabled = this._rolesAndPermissions.webphoneEnabled;
    if (!this.timestamp) {
      // first time login
      const defaultCallWith = this._getDefaultCallWith();
      this.store.dispatch({
        type: this.actionTypes.setData,
        callWith: defaultCallWith,
        timestamp: Date.now(),
      });
      if (!this._emergencyCallAvailable) {
        this._warningEmergencyCallingNotAvailable();
      }
      if (typeof this._onFirstLogin === 'function') {
        this._onFirstLogin();
      }
    }
    await this._validateSettings();
    await this._initFromNumber();
  }
}
