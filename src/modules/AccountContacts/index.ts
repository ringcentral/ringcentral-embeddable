import { filter, reduce } from 'ramda';
import { AccountContacts as AccountContactsBase } from '@ringcentral-integration/commons/modules/AccountContacts';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { isBlank } from '@ringcentral-integration/commons/lib/isBlank';
import { phoneTypes } from '@ringcentral-integration/commons/enums/phoneTypes';
import { computed } from '@ringcentral-integration/core';
import type {
  Contact,
  DirectoryContacts,
} from '@ringcentral-integration/commons/modules/AccountContacts/AccountContacts.interface';
import {
  convertUsageTypeToPhoneType,
  isSupportedPhoneNumber,
} from '@ringcentral-integration/commons/lib/phoneTypeHelper';

@Module({
  name: 'NewAccountContacts',
  deps: ['Auth']
})
export class AccountContacts extends AccountContactsBase {
  async getProfileImage(contact) {
    if (
      !contact ||
      !contact.id ||
      contact.type !== 'company' ||
      !contact.hasProfileImage
    ) {
      return null;
    }
    const profileImageUrl = contact.profileImage?.uri;
    return `${profileImageUrl}?access_token=${this._deps.auth.accessToken}`
  }

  searchForPhoneNumbers(searchString: string) {
    const result = super.searchForPhoneNumbers(searchString);
    return result.map((contact) => {
      let profileImageUrl = contact.profileImageUrl;
      if (profileImageUrl && profileImageUrl.indexOf('access_token') === -1) {
        profileImageUrl = `${profileImageUrl}?access_token=${this._deps.auth.accessToken}`;
      }
      return {
        ...contact,
        profileImageUrl,
        presence: this.presences[contact.contactId] && this.presences[contact.contactId].presence,
      };
    });
  }

  @computed((that: AccountContacts) => [
    that._deps.companyContacts.filteredContacts,
    that._deps.auth.accessToken, // TODO: remove this
    that.presences,
    that._deps.accountContactsOptions,
  ])
  get directoryContacts(): DirectoryContacts {
    return reduce(
      (result, item) => {
        if (!isBlank(item.extensionNumber)) {
          const id = `${item.id}`;
          let profileImageUrl;
          if (item.profileImage?.uri) {
            profileImageUrl = `${item.profileImage.uri}?access_token=${this._deps.auth.accessToken}`;
          }
          const contact: Contact = {
            ...item,
            type: this.sourceName,
            id,
            name: item.name
              ? item.name
              : `${item.firstName || ''} ${item.lastName || ''}`,
            emails: [item.email!],
            extensionNumber: item.extensionNumber,
            hasProfileImage: !!item.profileImage,
            phoneNumbers: [
              {
                phoneNumber: item.extensionNumber,
                phoneType: phoneTypes.extension,
              },
            ],
            profileImageUrl,
            presence: this.presences[id] && this.presences[id].presence,
            contactStatus: item.status,
          };

          if (item.phoneNumbers && item.phoneNumbers.length > 0) {
            item.phoneNumbers.forEach((phone) => {
              isSupportedPhoneNumber(phone) &&
                contact.phoneNumbers!.push({
                  ...phone,
                  phoneType: convertUsageTypeToPhoneType(phone?.usageType),
                });
            });
          }
          result.all.push(contact);
          if (!contact.hidden) {
            const cdcContact = {
              ...contact,
              phoneNumbers: filter(
                (number) => !number.hidden,
                contact.phoneNumbers ?? [],
              ),
            };
            result.cdc.push(cdcContact);
          }
        }
        return result;
      },
      {
        all: [],
        cdc: [],
      } as DirectoryContacts,
      this._deps.companyContacts.filteredContacts,
    );
  }
}
