import { AccountContacts as AccountContactsBase } from '@ringcentral-integration/commons/modules/AccountContacts';
import { Module } from '@ringcentral-integration/commons/lib/di';

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
}
