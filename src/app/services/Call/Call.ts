import {
  AppFeatures,
  AvailabilityMonitor,
  ExtensionFeatures,
  RegionSettings,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { NumberValidate } from '@ringcentral-integration/micro-contacts/src/app/services';
import {
  Brand,
  Toast,
} from '@ringcentral-integration/micro-core/src/app/services';
import {
  ActiveCallControl,
  CallingSettings,
  Ringout,
  Softphone,
  Webphone as MicroPhoneWebphone,
} from '@ringcentral-integration/micro-phone/src/app/services';
import { Call as BaseCall } from '@ringcentral-integration/micro-phone/src/app/services/Call/Call';
import type {
  CallOptions,
  Recipient,
} from '@ringcentral-integration/micro-phone/src/app/services/Call/Call.interface';
import {
  fromWatchValue,
  injectable,
  optional,
  PortManager,
  StoragePlugin,
  takeUntilAppDestroy,
} from '@ringcentral-integration/next-core';
import { merge, tap } from 'rxjs';

import type { Webphone } from '../WebphoneV2';

/**
 * Divergence from upstream: the webphone is no longer needed only for browser
 * calling. RingCX integrated offhook registers the same SIP UA with Engage EPT
 * roles, so dropping it because `CallingSettings` points at another device
 * would end the agent's audio leg. Upstream re-evaluates its rule on every
 * main-tab change, which made a plain tab switch enough to do that.
 *
 * `listenWebphone` is private upstream, so replacing it needs the structural
 * clash suppressed; the base constructor still dispatches to the override at
 * runtime. Re-check this file whenever `micro-phone`'s `Call` changes.
 */
@injectable({
  name: 'Call',
})
// @ts-expect-error -- TS2415: overriding the private `listenWebphone`
export class Call<K extends Recipient = Recipient> extends BaseCall<K> {
  constructor(
    _toast: Toast,
    _storage: StoragePlugin,
    _brand: Brand,
    _softphone: Softphone,
    _ringout: Ringout,
    _regionSettings: RegionSettings,
    _callingSettings: CallingSettings,
    _extensionFeatures: ExtensionFeatures,
    _numberValidate: NumberValidate,
    _appFeatures: AppFeatures,
    _portManager: PortManager,
    _activeCallControl: ActiveCallControl,
    @optional() _webphone?: MicroPhoneWebphone,
    @optional() _availabilityMonitor?: AvailabilityMonitor,
    @optional('CallOptions') _callOptions?: CallOptions,
  ) {
    super(
      _toast,
      _storage,
      _brand,
      _softphone,
      _ringout,
      _regionSettings,
      _callingSettings,
      _extensionFeatures,
      _numberValidate,
      _appFeatures,
      _portManager,
      _activeCallControl,
      _webphone,
      _availabilityMonitor,
      _callOptions,
    );
  }

  private get _cxWebphone(): Webphone | undefined {
    return this._webphone as unknown as Webphone | undefined;
  }

  private get _needsWebphoneConnection(): boolean {
    return (
      this._callingSettings.isWebphoneMode ||
      !!this._cxWebphone?.engageAgentEptEnabled
    );
  }

  private listenWebphone() {
    const webphone = this._webphone;
    if (!webphone) return;

    merge(
      fromWatchValue(this, () => this._callingSettings.isWebphoneMode),
      fromWatchValue(this, () => this._cxWebphone?.engageAgentEptEnabled),
      this._portManager.onMainTabChange$,
      // when resetting(logout), we should disconnect the webphone
      this.resetting$,
    )
      .pipe(
        tap(async () => {
          try {
            if (this._needsWebphoneConnection) {
              await webphone.connect();
            } else {
              await webphone.disconnect();
            }
          } catch (error) {
            this.logger.error('webphone process error', error);
          }
        }),
        takeUntilAppDestroy,
      )
      .subscribe();
  }
}
