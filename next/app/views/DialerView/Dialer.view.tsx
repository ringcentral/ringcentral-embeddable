import {
  AccountInfo,
  ConnectivityManager,
  ExtensionFeatures,
  RateLimiter,
  RegionSettings,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { ContactSearch } from '@ringcentral-integration/micro-contacts/src/app/services';
import { Locale, Toast } from '@ringcentral-integration/micro-core/src/app/services';
import {
  AudioSettings,
  Call,
  CallingSettings,
  Webphone,
} from '@ringcentral-integration/micro-phone/src/app/services';
import {
  DialerView as BaseDialerView,
  type DialerViewCallParams,
  type DialerViewOptions,
} from '@ringcentral-integration/micro-phone/src/app/views';
import { injectable, optional, PortManager } from '@ringcentral-integration/next-core';

import { DoNotContact } from '../../services/DoNotContact';

/** Adds third-party Do Not Call verification to the Spring dialer. */
@injectable({
  name: 'DialerView',
})
export class DialerView extends BaseDialerView {
  constructor(
    protected override _callingSettings: CallingSettings,
    protected override _connectivityManager: ConnectivityManager,
    protected override _locale: Locale,
    protected override _rateLimiter: RateLimiter,
    protected override _regionSettings: RegionSettings,
    protected override _toast: Toast,
    protected override _call: Call,
    protected override _extensionFeatures: ExtensionFeatures,
    protected override _accountInfo: AccountInfo,
    protected override _portManager: PortManager,
    private _doNotContact: DoNotContact,
    @optional() protected override _webphone?: Webphone,
    @optional() protected override _audioSettings?: AudioSettings,
    @optional() protected override _contactSearch?: ContactSearch,
    @optional('DialerViewOptions')
    protected override _dialerViewOptions?: DialerViewOptions,
  ) {
    super(
      _callingSettings,
      _connectivityManager,
      _locale,
      _rateLimiter,
      _regionSettings,
      _toast,
      _call,
      _extensionFeatures,
      _accountInfo,
      _portManager,
      _webphone,
      _audioSettings,
      _contactSearch,
      _dialerViewOptions,
    );
  }

  protected override callVerify = (options: DialerViewCallParams): Promise<boolean> =>
    this._doNotContact.verifyCall(options);
}
