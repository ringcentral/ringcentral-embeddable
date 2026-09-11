import { AccountContacts as AccountContactsBase } from '@ringcentral-integration/micro-contacts/src/app/services';
import { AccountContactsViewableManager } from '@ringcentral-integration/micro-contacts/src/app/services/AccountContacts/AccountContactsViewableManager';
import {
  AccountInfo,
  AppFeatures,
  Auth,
  Client,
  ExtensionInfo,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { CompanyContacts } from '@ringcentral-integration/micro-contacts/src/app/services/CompanyContacts';
import { injectable } from '@ringcentral-integration/next-core';

/**
 * Keeps the application-level binding for the upstream AccountContacts
 * service while preserving the embeddable module identifier.
 */
@injectable({
  name: 'AccountContacts',
})
export class AccountContacts extends AccountContactsBase {
  constructor(
    _auth: Auth,
    _client: Client,
    _accountContactsViewableManager: AccountContactsViewableManager,
    _extensionInfo: ExtensionInfo,
    _appFeatures: AppFeatures,
    _accountInfo: AccountInfo,
    _companyContacts: CompanyContacts,
  ) {
    super(
      _auth,
      _client,
      _accountContactsViewableManager,
      _extensionInfo,
      _appFeatures,
      _accountInfo,
      _companyContacts,
    );
  }
}
