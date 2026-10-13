import {
  Auth,
  Client,
  DataFetcher,
  NumberFormatter,
  type WebSocketSubscription as Subscription,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { SmsOptOut as SmsOptOutBase } from '@ringcentral-integration/micro-message/src/app/services';
import { injectable, optional } from '@ringcentral-integration/next-core';

import { AppFeatures } from '@ringcentral-integration/micro-auth/src/app/services/AppFeatures';
import type { AppFeatures as EmbeddableAppFeatures } from '../AppFeatures';

@injectable({
  name: 'SmsOptOut',
})
export class SmsOptOut extends SmsOptOutBase {
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
      (this._appFeatures as EmbeddableAppFeatures).hasSMSOptOutPermission;
    // The base keys opt-outs by formatted numbers. A custom phone number
    // format can hide digits, so two numbers could share a key; key by the
    // normalized numbers instead, the same way.
    (this as any).getOptOutKey = ({ from, to }: { from: string; to: string }) => {
      const [a, b] = [
        _numberFormatter.normalizeNumber(from) || from,
        _numberFormatter.normalizeNumber(to) || to,
      ].sort();
      return `${a}__${b}`;
    };
  }
}
