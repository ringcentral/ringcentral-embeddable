import {
  AccountInfo,
  ConnectivityManager,
  ExtensionFeatures,
  RateLimiter,
  RegionSettings,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { ContactSearch } from '@ringcentral-integration/micro-contacts/src/app/services';
import { AppHeaderNav } from '@ringcentral-integration/micro-core/src/app/components';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { Locale, Toast } from '@ringcentral-integration/micro-core/src/app/services';
import {
  AudioSettings,
  Call,
  CallingSettings,
  callingModes,
  Webphone,
} from '@ringcentral-integration/micro-phone/src/app/services';
import {
  DialerView as BaseDialerView,
  type DialerViewCallParams,
  type DialerViewOptions,
} from '@ringcentral-integration/micro-phone/src/app/views';
import type {
  DialerViewPanelProps,
  DialerViewProps,
} from '@ringcentral-integration/micro-phone/src/app/views/DialerView/Dialer.view.interface';
import dialerI18n from '@ringcentral-integration/micro-phone/src/app/views/DialerView/i18n';
import {
  injectable,
  optional,
  PortManager,
  useConnector,
  type UIProps,
} from '@ringcentral-integration/next-core';
import React, { useRef } from 'react';

import { DoNotContact } from '../../services/DoNotContact';
import { RingCX } from '../../services/RingCX';
import { t as ringCXT } from '../../services/RingCX/i18n';
import type { AdapterOptions } from '../../services/Adapter/AdapterOptions';
import { DialerPage } from './DialerPage';

/** Adds third-party Do Not Call verification and the RingCX call guard to the Spring dialer. */
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
    @optional() private _ringCX?: RingCX,
    @optional() protected override _webphone?: Webphone,
    @optional() protected override _audioSettings?: AudioSettings,
    @optional() protected override _contactSearch?: ContactSearch,
    @optional('DialerViewOptions')
    protected override _dialerViewOptions?: DialerViewOptions,
    @optional('AdapterOptions')
    private _adapterOptions?: AdapterOptions,
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

  override get isCallButtonDisabled() {
    return super.isCallButtonDisabled || Boolean(this._ringCX?.hasActiveCall);
  }

  override getUIProps(
    props: DialerViewProps,
  ): UIProps<DialerViewPanelProps> {
    const uiProps = super.getUIProps(props);
    const showRingoutCallerId = Boolean(
      this._adapterOptions?.enableRingoutCallerId &&
        uiProps.callingMode === callingModes.ringout,
    );
    const callButtonDisabledTooltip = this._ringCX?.hasActiveCall
      ? ringCXT('finishRingCXCallFirst')
      : undefined;
    const nextProps = {
      ...uiProps,
      isWebphoneMode: uiProps.isWebphoneMode || showRingoutCallerId,
      callButtonDisabledTooltip,
    };
    return nextProps;
  }

  override component(props: DialerViewProps): React.ReactElement {
    const { current: uiFunctions } = useRef(this.getUIFunctions(props));
    const { t } = useLocale(dialerI18n);
    const panelProps = useConnector(() => ({
      ...props,
      ...this.getUIProps(props),
    }));
    return (
      <>
        <AppHeaderNav title={t('phoneTitle')}>{null}</AppHeaderNav>
        <DialerPage
          {...panelProps}
          {...uiFunctions}
          ContactSearch={this._contactSearchView?.component}
        />
        {this._connectingView ? <this._connectingView.component /> : null}
      </>
    );
  }
}
