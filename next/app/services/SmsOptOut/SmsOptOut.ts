import {
  Auth,
  Client,
  DataFetcher,
  NumberFormatter,
  type WebSocketSubscription as Subscription,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { SmsOptOut } from '@ringcentral-integration/micro-message/src/app/services';
import { injectable, optional } from '@ringcentral-integration/next-core';

import { AppFeatures } from '@ringcentral-integration/micro-auth/src/app/services/AppFeatures';

@injectable({
  name: 'SmsOptOut',
})
export class SmsOptOutV2 extends SmsOptOut {
  constructor(
    _client: Client,
    _auth: Auth,
    _numberFormatter: NumberFormatter,
    _dataFetcher: DataFetcher,
    private _appFeatures: AppFeatures,
    @optional('Subscription') _subscription?: Subscription,
  ) {
    super(_client, _auth, _numberFormatter, _dataFetcher, _subscription);
    // Shadow the base class's private permissionCheckFunction at runtime.
    // The base _source lambda resolves `this.permissionCheckFunction()` dynamically,
    // so an own-property on the instance takes precedence over the prototype method.
    (this as any).permissionCheckFunction = () =>
      this._appFeatures.hasSMSOptOutPermission;
  }
}
