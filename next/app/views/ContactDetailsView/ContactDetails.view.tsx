/* eslint-disable react-hooks/rules-of-hooks */
import {
  AccountInfo,
  AppFeatures,
  ConnectivityManager,
  ExtensionInfo,
  RateLimiter,
  RegionSettings,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { Locale } from '@ringcentral-integration/micro-core/src/app/services';
import { ModalView } from '@ringcentral-integration/micro-core/src/app/views';
import { IntegrationConfig } from '@ringcentral-integration/micro-setting/src/app/services';
import {
  ContactDetailsView as ContactDetailsViewBase,
} from '@ringcentral-integration/micro-contacts/src/app/views';
import type {
  ContactDetailsViewOptions,
  ContactDetailsViewProps,
} from '@ringcentral-integration/micro-contacts/src/app/views/ContactDetailsView/ContactDetails.view.interface';
import { ContactMatcher, Contacts, ContactSearch } from '@ringcentral-integration/micro-contacts/src/app/services';
import {
  injectable,
  optional,
  RouterPlugin,
  useConnector,
} from '@ringcentral-integration/next-core';
import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router';

import { ContactDetailsPanel } from './ContactDetailsPanel';

@injectable({
  name: 'ContactDetailsView',
})
export class ContactDetailsView extends ContactDetailsViewBase {
  constructor(
    protected _modalView: ModalView,
    protected _contactMatcher: ContactMatcher,
    protected _locale: Locale,
    protected _router: RouterPlugin,
    protected _contactSearch: ContactSearch,
    protected _contacts: Contacts,
    protected _extensionInfo: ExtensionInfo,
    protected _appFeatures: AppFeatures,
    protected _rateLimiter: RateLimiter,
    protected _regionSettings: RegionSettings,
    protected _connectivityManager: ConnectivityManager,
    protected _accountInfo: AccountInfo,
    protected _integrationConfig: IntegrationConfig,
    @optional('ContactDetailsViewOptions')
    protected _contactDetailsViewOptions?: ContactDetailsViewOptions,
  ) {
    super(
      _modalView,
      _contactMatcher,
      _locale,
      _router,
      _contactSearch,
      _contacts,
      _extensionInfo,
      _appFeatures,
      _rateLimiter,
      _regionSettings,
      _connectivityManager,
      _accountInfo,
      _integrationConfig,
      _contactDetailsViewOptions,
    );
  }
  override component(props: Partial<ContactDetailsViewProps>) {
    const params = useParams<{ contactType?: string; contactId?: string }>();
    (this as any).params = params;

    useEffect(() => {
      this.initCurrentContact(params);
      return () => {
        this.resetCurrentContact();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.contactType, params.contactId]);

    const { current: uiFunctions } = useRef(this.getUIFunctions(props));

    const _props = useConnector(() => this.getUIProps(props));

    return (
      <ContactDetailsPanel
        currentLocale={_props.currentLocale}
        contact={_props.contact}
        showSpinner={_props.showSpinner}
        isMultipleSiteEnabled={_props.isMultipleSiteEnabled}
        isCallButtonDisabled={_props.isCallButtonDisabled}
        disableLinks={_props.disableLinks}
        formatNumber={uiFunctions.formatNumber}
        canCallButtonShow={uiFunctions.canCallButtonShow}
        canTextButtonShow={uiFunctions.canTextButtonShow}
        onBackClick={uiFunctions.onBackClick}
        onClickToDial={uiFunctions.onClickToDial}
        onClickToSMS={uiFunctions.onClickToSMS}
      />
    );
  }
}
