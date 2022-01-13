import { ContactListUI as ContactListUIBase } from '@ringcentral-integration/widgets/modules/ContactListUI';
import { Module } from '@ringcentral-integration/commons/lib/di';

import { computed } from '@ringcentral-integration/core';

@Module({
  name: 'ContactListUI',
})
export class ContactListUI extends ContactListUIBase {
  @computed((that) => [
    that.filteredContactsList,
    ...Object.values(that._deps.contactSources).map(
      (source) => source.contacts,
    ),
  ])
  get filteredContacts() {
    const contactsMap = {};
    this._deps.contactSources.forEach((source) => {
      contactsMap[source.sourceName] = {};
      source.contacts.forEach((contact) => {
        contactsMap[source.sourceName][contact.id] = contact;
      });
    });
    const filteredContactsData = [];
    this.filteredContactsList.forEach(([sourceName, id]) => {
      // TODO: fix item check in widgets lib
      if (contactsMap[sourceName][id]) {
        filteredContactsData.push(contactsMap[sourceName][id]);
      }
    });
    return filteredContactsData;
  }
}
