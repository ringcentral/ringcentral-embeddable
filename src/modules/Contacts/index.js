import Contacts from 'ringcentral-integration/modules/Contacts';
import { Module } from 'ringcentral-integration/lib/di';
import { createSelector } from 'reselect';
import getter from 'ringcentral-integration/lib/getter';
import isBlank from 'ringcentral-integration/lib/isBlank';
import { AllContactSourceName } from 'ringcentral-integration/lib/contactHelper';

// TODO: To fix this bug in widgets librrary
export function filterContacts(contacts, searchFilter) {
  const items = contacts;
  if (!searchFilter || isBlank(searchFilter)) {
    return items;
  }
  const searchText = searchFilter.toLowerCase();
  return items.filter((item) => {
    const name = `${item.firstName} ${item.lastName} ${item.name}`;
    if (
      name.toLowerCase().indexOf(searchText) >= 0 ||
      (item.extensionNumber && item.extensionNumber.indexOf(searchText) >= 0) ||
      (item.phoneNumbers && item.phoneNumbers.find(x => x.phoneNumber.indexOf(searchText) >= 0))
    ) {
      return true;
    }
    return false;
  });
}

@Module({
  name: 'NewContacts',
  deps: []
})
export default class NewContacts extends Contacts {
  @getter
  filteredContacts = createSelector(
    () => this.searchFilter,
    () => this.sourceFilter,
    () => this._checkSourceUpdated(),
    (searchFilter, sourceFilter) => {
      let contacts;
      if (
        isBlank(searchFilter) &&
        (sourceFilter === AllContactSourceName || isBlank(sourceFilter))
      ) {
        return this.allContacts;
      }
      if (sourceFilter !== AllContactSourceName && !isBlank(sourceFilter)) {
        const source = this._contactSources.get(sourceFilter);
        if (source && source.sourceReady) {
          /* eslint { "prefer-destructuring": 0 } */
          contacts = source.contacts;
        } else {
          contacts = [];
        }
      } else {
        contacts = this.allContacts;
      }
      if (!isBlank(searchFilter)) {
        contacts = filterContacts(contacts, searchFilter);
      }
      return contacts;
    }
  )
}
