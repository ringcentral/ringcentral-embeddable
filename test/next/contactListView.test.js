import React from 'react';
import { render } from '@testing-library/react';

jest.mock('@ringcentral-integration/micro-core/src/app/components', () => ({
  AppHeaderNav: ({ children }) => children,
}));

jest.mock('@ringcentral-integration/micro-core/src/app/views', () => ({
  SyncTabView: class SyncTabView {},
}));

jest.mock('@ringcentral-integration/micro-contacts/src/app/views', () => ({
  ContactListView: class ContactListView {
    constructor(_auth, _locale, _extensionInfo, contacts) {
      this._contacts = contacts;
      this.filteredContacts = [];
      this.sourceFilter = 'all';
      this.searchFilter = '';
      this.isFiltering = false;
    }

    get contactSources() {
      return Array.from(this._contacts.contactSources.values());
    }

    get sourceNames() {
      return ['all'].concat(this.contactSources
        .filter((source) => source.sourceReady)
        .map((source) => source.sourceName));
    }

    getUIFunctions() {
      return {};
    }
  },
}));

jest.mock(
  '@ringcentral-integration/micro-contacts/src/app/views/ContactDetailsView',
  () => ({ ContactDetailsView: class ContactDetailsView {} }),
);

jest.mock('../../next/app/views/ContactListView/ContactListPanel', () => ({
  ContactListPanel: () => null,
}));

import { ContactListView } from '../../next/app/views/ContactListView/ContactList.view';

function createContactSource(sourceName) {
  return {
    sourceName,
    ready: true,
    sourceReady: true,
    contacts: [],
    rawContacts: [],
    filterContacts: jest.fn(() => []),
  };
}

function createView({
  registeredSources = [],
  isContactSourceRegistered = false,
  activeTab,
} = {}) {
  const contacts = {
    contactSources: new Map(
      registeredSources.map((source) => [source.sourceName, source]),
    ),
  };
  const thirdParty = {
    ...createContactSource('crm'),
    isContactSourceRegistered,
  };
  const syncTabComponent = jest.fn(() => null);
  const tabInfo = activeTab
    ? { contactTabs: { active: activeTab } }
    : {};
  const view = new ContactListView(
    { loggedIn: true },
    { ready: true },
    {},
    contacts,
    thirdParty,
    { component: syncTabComponent, tabInfo },
  );
  return { contacts, syncTabComponent, thirdParty, view };
}

describe('ContactListView third-party source sharing', () => {
  test('does not expose the source before server registration is shared', () => {
    const { thirdParty, view } = createView();

    expect(view.contactSources).not.toContain(thirdParty);
  });

  test('exposes the shared source without registering it in client Contacts', () => {
    const { contacts, thirdParty, view } = createView({
      isContactSourceRegistered: true,
    });

    expect(contacts.contactSources.has('crm')).toBe(false);
    expect(view.contactSources).toContain(thirdParty);
    expect(view.sourceNames).toContain('crm');
  });

  test('does not duplicate a source already registered in server Contacts', () => {
    const thirdPartySource = createContactSource('crm');
    const { view } = createView({
      registeredSources: [thirdPartySource],
      isContactSourceRegistered: true,
    });

    expect(
      view.contactSources.filter((source) => source.sourceName === 'crm'),
    ).toHaveLength(1);
  });

  test('filters the active All tab on first render and uses moreMenu tabs', () => {
    const companySource = createContactSource('company');
    const { syncTabComponent, view } = createView({
      activeTab: 'all',
      registeredSources: [companySource],
    });
    const onSearchContact = jest.fn();
    view.getUIFunctions = jest.fn(() => ({
      onItemSelect: jest.fn(),
      onSearchContact,
      setLastPosition: jest.fn(),
    }));
    const Component = view.component.bind(view);

    render(<Component />);

    expect(onSearchContact).toHaveBeenCalledWith({
      searchSource: 'all',
      searchString: '',
    });
    expect(syncTabComponent).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'moreMenu' }),
      expect.anything(),
    );
  });
});
