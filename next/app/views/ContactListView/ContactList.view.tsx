/* eslint-disable react-hooks/rules-of-hooks */
import type {
  IContact,
} from '@ringcentral-integration/commons/interfaces/Contact.model';
import {
  sortContactItemsByName,
  uniqueContactItems,
} from '@ringcentral-integration/commons/lib/contactHelper';
import {
  Auth,
  ExtensionInfo,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { AppHeaderNav } from '@ringcentral-integration/micro-core/src/app/components';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { Locale } from '@ringcentral-integration/micro-core/src/app/services';
import {
  SyncTabProps,
  SyncTabView,
} from '@ringcentral-integration/micro-core/src/app/views';
import {
  ContactListView as ContactListViewBase,
} from '@ringcentral-integration/micro-contacts/src/app/views';
import { ContactDetailsView as ContactDetailsViewBase } from '@ringcentral-integration/micro-contacts/src/app/views/ContactDetailsView';
import type {
  ContactListViewOptions,
  ContactListViewProps,
} from '@ringcentral-integration/micro-contacts/src/app/views/ContactListView/ContactList.view.interface';
import { Contacts } from '@ringcentral-integration/micro-contacts/src/app/services';
import {
  computed,
  injectable,
  optional,
  useConnector,
  state,
  action,
  delegate,
} from '@ringcentral-integration/next-core';
import { t as contactSourceT } from '@ringcentral-integration/widgets/components/ContactSourceFilter/i18n';
import React, { useEffect, useRef } from 'react';
import type { StateSnapshot } from 'react-virtuoso';

import { ContactListPanel } from './ContactListPanel';
import i18n from './i18n';

const CONTACT_TAB_ID = 'contactTabs';

@injectable({
  name: 'ContactListView',
})
export class ContactListView extends ContactListViewBase {
  constructor(
    protected _auth: Auth,
    protected _locale: Locale,
    protected _extensionInfo: ExtensionInfo,
    protected _contacts: Contacts,
    protected _syncTabView: SyncTabView,
    @optional() protected _contactDetailsView?: ContactDetailsViewBase,
    @optional('ContactListViewOptions')
    protected _contactListViewOptions?: ContactListViewOptions,
  ) {
    super(_auth, _locale, _extensionInfo, _contacts, _contactDetailsView, _contactListViewOptions);
  }

  /**
   * Persisted Virtuoso state snapshot per source tab.
   */
  @state
  private _lastPositions: Record<string, StateSnapshot | undefined> = {};

  @action
  private _setLastPosition(source: string, snapshot?: StateSnapshot) {
    this._lastPositions[source] = snapshot;
  }

  @delegate('server')
  async setLastPosition(source: string, snapshot?: StateSnapshot) {
    this._setLastPosition(source, snapshot);
  }

  /**
   * Flat sorted contact list (no grouping by first letter).
   */
  @computed((that: ContactListView) => [that.filteredContacts])
  get sortedContacts(): IContact[] {
    return sortContactItemsByName(uniqueContactItems(this.filteredContacts));
  }

  override getUIProps(props: ContactListViewProps) {
    return {
      sourceNames: this.sourceNames,
      contacts: this.sortedContacts,
      searchSource: this.sourceFilter,
      searchString: this.searchFilter,
      isSearching: this.isFiltering,
      showSpinner: !this._locale.ready,
      activeTab: this._syncTabView.tabInfo[CONTACT_TAB_ID]?.active as string | null,
      lastPosition: this._lastPositions[this.sourceFilter ?? ''],
    };
  }

  override getUIFunctions(props: ContactListViewProps) {
    return {
      ...super.getUIFunctions(props),
      setLastPosition: (source: string, snapshot?: StateSnapshot) => {
        this.setLastPosition(source, snapshot);
      },
    };
  }

  override component(props: ContactListViewProps) {
    const { current: uiFunctions } = useRef(this.getUIFunctions(props));
    const { t } = useLocale(i18n);

    const _props = useConnector(() => this.getUIProps(props));

    const activeTab = _props.activeTab ?? _props.sourceNames[0];

    useEffect(() => {
      if (activeTab && activeTab !== _props.searchSource) {
        uiFunctions.onSearchContact({
          searchSource: activeTab,
          searchString: _props.searchString ?? '',
        });
      }
    }, [activeTab]);

    const contactList = (
      <ContactListPanel
        contacts={_props.contacts}
        searchString={_props.searchString}
        isSearching={_props.isSearching}
        showSpinner={_props.showSpinner}
        onItemSelect={uiFunctions.onItemSelect}
        onSearchContact={uiFunctions.onSearchContact}
        searchSource={_props.searchSource}
        getPresence={uiFunctions.getPresence}
        lastPosition={_props.lastPosition}
        setLastPosition={uiFunctions.setLastPosition}
      />
    );

    const tabs: SyncTabProps['tabs'] = _props.sourceNames.map((source) => ({
      id: source,
      label: contactSourceT(source),
      component: null,
    }));

    return (
      <div
        className="flex flex-col w-full h-full overflow-hidden"
        data-sign="contactList"
      >
        <AppHeaderNav title={t('contacts')}>
          <></>
        </AppHeaderNav>
        {tabs.length > 1 ? (
          <this._syncTabView.component
            id={CONTACT_TAB_ID}
            className="[&_.sui-tab]:max-w-none [&_.sui-tab]:flex-grow"
            variant="scrollable"
            tabs={tabs}
          >
            {contactList}
          </this._syncTabView.component>
        ) : (
          contactList
        )}
      </div>
    );
  }
}
