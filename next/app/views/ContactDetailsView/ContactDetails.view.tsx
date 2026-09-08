import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router';
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
  RouteParams,
} from '@ringcentral-integration/micro-contacts/src/app/views/ContactDetailsView/ContactDetails.view.interface';
import { contactReadyStates } from '@ringcentral-integration/micro-contacts/src/app/views/ContactDetailsView/contactReadyStates';
import { ContactMatcher, Contacts, ContactSearch } from '@ringcentral-integration/micro-contacts/src/app/services';
import {
  action,
  delegate,
  injectable,
  optional,
  RouterPlugin,
  state,
  useConnector,
} from '@ringcentral-integration/next-core';
import { ContactDetailsPanel } from './ContactDetailsPanel';

interface ContactDetailsRouteParams extends RouteParams {
  returnPath?: string;
}

@injectable({
  name: 'ContactDetailsView',
})
export class ContactDetailsView extends ContactDetailsViewBase {
  @state
  private _returnPath: string | null = null;

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

  @delegate('server')
  async showContactDetails({
    id,
    type,
    direct = false,
    returnPath,
  }: ContactDetailsRouteParams): Promise<void> {
    this._setReturnPath(
      direct ? (returnPath ?? this._router.currentPath) : null,
    );
    await this._router.push(
      `/contacts/${type}/${id}${direct ? '?direct=true' : ''}`,
    );
  }

  @action
  private _setReturnPath(returnPath: string | null): void {
    this._returnPath = returnPath;
  }

  @delegate('server')
  private async _navigateBack(): Promise<void> {
    const returnPath = this._returnPath;
    this._setReturnPath(null);
    if (returnPath) {
      await this._router.replace(returnPath);
      return;
    }
    await this._router.goBack();
  }

  override getUIProps(props: Partial<ContactDetailsViewProps>) {
    const uiProps = super.getUIProps(props);

    return {
      ...uiProps,
      showSpinner: !(
        this.currentContactReadyState === contactReadyStates.loaded &&
        this._locale.ready &&
        this._appFeatures.ready
      ),
    };
  }

  override getUIFunctions(props: Partial<ContactDetailsViewProps>) {
    const uiFunctions = super.getUIFunctions(props);
    return {
      ...uiFunctions,
      onBackClick: () => {
        void this._navigateBack();
      },
    };
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
