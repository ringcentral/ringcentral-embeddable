import React, { useEffect, useRef } from 'react';
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
import { CALLING_ROUTE_PATH } from '@ringcentral-integration/micro-phone/src/app/services';
import {
  action,
  autobind,
  delegate,
  injectable,
  optional,
  Route as RouterRoute,
  RouterPlugin,
  state,
  Switch,
  useConnector,
  useLocation,
  useParams,
} from '@ringcentral-integration/next-core';

import { t } from '../../i18n';
import {
  ThirdParty,
  type ThirdPartyContact,
} from '../../services/ThirdParty';
import {
  type SideWidgetContentHandle,
  SideWidgetView,
} from '../SideWidgetView';
import type {
  ContactActivity,
  ContactThirdPartyProps,
} from './ContactDetails.interface';
import { ContactDetailsPanel } from './ContactDetailsPanel';

const CONTACT_DETAILS_ROUTE_PATH = '/contacts/:contactType/:contactId';

interface CallPageContact {
  id: string;
  type: string;
}

interface ContactDetailsRouteParams extends RouteParams {
  returnPath?: string;
}

@injectable({
  name: 'ContactDetailsView',
})
export class ContactDetailsView extends ContactDetailsViewBase {
  @state
  private _returnPath: string | null = null;

  /** The contact shown in the tab opened from the call page. */
  @state
  private _callPageContact: CallPageContact | null = null;

  private readonly _callPageContactHandle: SideWidgetContentHandle | null;

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
    @optional() protected _sideWidgetView?: SideWidgetView,
    @optional() private _thirdParty?: ThirdParty,
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
    this._callPageContactHandle =
      this._sideWidgetView?.createContent({
        id: 'call-page-contact-details',
        name: t('contact'),
        getName: () => t('contact'),
        scope: 'contact',
        onBack: () => this._closeCallPageContact(),
        onClose: () => this._setCallPageContact(null),
        view: this.CallPageContactDetails,
      }) ?? null;
  }

  @delegate('server')
  async showContactDetails({
    id,
    type,
    direct = false,
    returnPath,
  }: ContactDetailsRouteParams): Promise<void> {
    if (
      this._callPageContactHandle &&
      this._router.currentPath === CALLING_ROUTE_PATH
    ) {
      // Leaving the call page closes the call on it, so the contact opens in
      // the side widget while the call page stays in the main column.
      this._setCallPageContact({ id, type });
      this._sideWidgetView!.openContent(this._callPageContactHandle);
      return;
    }
    this._closeCallPageContact();
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

  @action
  private _setCallPageContact(contact: CallPageContact | null): void {
    this._callPageContact = contact;
  }

  /** The routed contact page replaces the call page's tab for a contact. */
  private _closeCallPageContact(): void {
    if (this._callPageContactHandle && this._callPageContact) {
      void this._sideWidgetView!.closeTabFromPanel(
        this._callPageContactHandle.options.id,
      );
    }
  }

  /**
   * Renders the details for the call page's contact at its contact route,
   * which the router is not on, so the page reads its params as usual.
   */
  @autobind
  private CallPageContactDetails(): React.ReactElement | null {
    const location = useLocation();
    const contact = useConnector(() => this._callPageContact);
    if (!contact) {
      return null;
    }
    return (
      <Switch
        location={{
          ...location,
          pathname: `/contacts/${contact.type}/${contact.id}`,
        }}
      >
        <RouterRoute
          path={CONTACT_DETAILS_ROUTE_PATH}
          component={this.component}
        />
      </Switch>
    );
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

  /** The service's contact actions and activities for the contact page. */
  private get _thirdPartyUIProps(): Pick<
    ContactThirdPartyProps,
    | 'additionalActions'
    | 'showActivities'
    | 'activitiesTabName'
    | 'activities'
    | 'activitiesLoaded'
  > {
    const thirdParty = this._thirdParty;
    return {
      additionalActions: thirdParty?.additionalContactActions ?? [],
      showActivities: Boolean(thirdParty?.activitiesRegistered),
      activitiesTabName:
        thirdParty?.activityName || thirdParty?.serviceName || '',
      activities: (thirdParty?.activities ?? []) as ContactActivity[],
      activitiesLoaded: thirdParty?.activitiesLoaded ?? true,
    };
  }

  private _formatActivityTime(time: number): string {
    try {
      return new Date(time).toLocaleString(this._locale.currentLocale, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return new Date(time).toLocaleString();
    }
  }

  override getUIProps(props: Partial<ContactDetailsViewProps>) {
    const uiProps = super.getUIProps(props);

    return {
      ...uiProps,
      ...this._thirdPartyUIProps,
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
      onClickAdditionalAction: (
        buttonId: string,
        resource: Record<string, unknown>,
      ) => {
        void this._thirdParty?.onClickAdditionalButton(buttonId, resource);
      },
      loadActivities: () => {
        if (this.currentContact) {
          void this._thirdParty?.fetchActivities(
            this.currentContact as unknown as ThirdPartyContact,
          );
        }
      },
      openActivity: (activity: ContactActivity) => {
        void this._thirdParty?.openActivity(activity);
      },
      formatActivityTime: (time: number) => this._formatActivityTime(time),
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
        additionalActions={_props.additionalActions}
        onClickAdditionalAction={uiFunctions.onClickAdditionalAction}
        showActivities={_props.showActivities}
        activitiesTabName={_props.activitiesTabName}
        activities={_props.activities}
        activitiesLoaded={_props.activitiesLoaded}
        loadActivities={uiFunctions.loadActivities}
        openActivity={uiFunctions.openActivity}
        formatActivityTime={uiFunctions.formatActivityTime}
      />
    );
  }
}
