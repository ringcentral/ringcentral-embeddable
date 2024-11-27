import { forEach, reject } from 'ramda';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { CompanyContacts as CompanyContactsBase } from '@ringcentral-integration/commons/modules/CompanyContacts';

const contactsRegExp = /.*\/directory\/contacts$/;

@Module({
  name: 'CompanyContacts',
  deps: []
})
export class CompanyContacts extends CompanyContactsBase {
  protected _handleSubscription(message: any) {
    if (
      this.ready &&
      (this._source.disableCache || (this._deps.tabManager?.active ?? true)) &&
      contactsRegExp.test(message?.event) &&
      message?.body?.contacts
    ) {
      let data = this.data ?? [];
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      forEach(({ eventType, oldEtag, newEtag, ...contact }) => {
        if (eventType === 'Create' || eventType === 'Update') {
          data = [...reject((item) => item.id === contact.id, data), contact];
        } else if (eventType === 'Delete') {
          data = [...reject((item) => item.id === contact.id, data)];
        }
      }, message.body.contacts);
      // TODO: fix this issue in widgets lib
      this.setCompanyContactsData(data);
    }
  }
}
