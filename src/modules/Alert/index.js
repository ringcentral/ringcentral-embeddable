import AlertBase from '@ringcentral-integration/commons/modules/Alert';
import { Module } from '@ringcentral-integration/commons/lib/di';

import getAlertReducer from '@ringcentral-integration/commons/modules/Alert/getAlertReducer';

@Module({
  name: 'Alert',
  deps: [
    'GlobalStorage',
    { dep: 'AlertOptions', optional: true }
  ],
})
export default class Alert extends AlertBase {
  constructor({
    globalStorage,
    multipleTabsSupport = false,
    ...options
  }) {
    super(options);
    this._multipleTabsSupport = multipleTabsSupport;
    this._globalStorage = globalStorage;
    this._alertStorageKey = `${this.prefix}-alert-message`;
    if (this._multipleTabsSupport) {
      this._globalStorage.registerReducer({
        key: this._alertStorageKey,
        reducer: getAlertReducer(this.actionTypes),
      });
      this._reducer = null;
    }
  }

  get state() {
    if (!this._multipleTabsSupport) {
      return super.state;
    }
    return this._globalStorage.getItem(this._alertStorageKey);
  }
}
