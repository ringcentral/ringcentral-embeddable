/* eslint-disable react-hooks/rules-of-hooks */
import {
  AccountInfo,
  RegionSettings,
} from '@ringcentral-integration/micro-auth/src/app/services';
import {
  AccountContacts,
  AddressBook,
  Contacts,
  ContactSearch,
} from '@ringcentral-integration/micro-contacts/src/app/services';
import { ContactSearchView as ContactSearchViewBase } from '@ringcentral-integration/micro-contacts/src/app/views';
import type {
  ContactSearchViewOptions,
  ContactSearchViewProps,
} from '@ringcentral-integration/micro-contacts/src/app/views/ContactSearchView/ContactSearch.view.interface';
import type { DialerContactSearchPanelProps } from '@ringcentral-integration/micro-contacts/src/app/views/ContactSearchView/ContactSearchPanel/DialerContactSearchPanel';
import { Locale } from '@ringcentral-integration/micro-core/src/app/services';
import { IntegrationConfig } from '@ringcentral-integration/micro-setting/src/app/services';
import {
  injectable,
  optional,
  RouterPlugin,
  useConnector,
} from '@ringcentral-integration/next-core';
import React, { useRef } from 'react';

import { DialerContactSearchPanel } from './DialerContactSearchPanel';

@injectable({
  name: 'ContactSearchView',
})
export class ContactSearchView extends ContactSearchViewBase {
  constructor(
    protected _locale: Locale,
    protected _accountContacts: AccountContacts,
    protected _addressBook: AddressBook,
    protected _regionSettings: RegionSettings,
    protected _accountInfo: AccountInfo,
    protected _router: RouterPlugin,
    protected _contacts: Contacts,
    protected _integrationConfig: IntegrationConfig,
    @optional() protected _contactSearch?: ContactSearch,
    @optional('ContactSearchViewOptions')
    protected _contactSearchViewOptions?: ContactSearchViewOptions,
  ) {
    super(
      _locale,
      _accountContacts,
      _addressBook,
      _regionSettings,
      _accountInfo,
      _router,
      _contacts,
      _integrationConfig,
      _contactSearch,
      _contactSearchViewOptions,
    );
  }

  override component(props: ContactSearchViewProps) {
    if (
      process.env.THEME_SYSTEM !== 'spring-ui' ||
      props.componentType !== 'DialTextField'
    ) {
      return super.component(props);
    }

    const { current: uiFunctions } = useRef(this.getUIFunctions(props));
    const connectedProps = useConnector(() => ({
      ...props,
      ...this.getUIProps(props),
    }));
    const panelProps = {
      ...connectedProps,
      ...uiFunctions,
    } as DialerContactSearchPanelProps;

    return <DialerContactSearchPanel {...panelProps} />;
  }
}
