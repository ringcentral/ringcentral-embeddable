import { AddressBook as AddressBookBase } from '@ringcentral-integration/commons/modules/AddressBook';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { sleep } from '@ringcentral-integration/utils';


@Module({
  name: 'NewAddressBook',
  deps: ['AppFeatures'],
})
export class AddressBook extends AddressBookBase {
  constructor(deps) {
    super(deps);
    this._source._props.permissionCheckFunction = () => this._hasPermission;
  }

  // override to fix rate limit issue when contacts count > 2500
  async _sync() {
    try {
      const syncToken = this.syncToken;
      const perPage = this._perPage;
      let records = [];
      // @ts-expect-error
      let response = await this._fetch(perPage, syncToken);
      records = records.concat(response.records ?? []);
      let pageNum = 0;
      while (response.nextPageId) {
        const fetchInterval = pageNum > 3 ? 6000 : 2000; 
        await sleep(fetchInterval);
        // @ts-expect-error
        response = await this._fetch(perPage, syncToken, response.nextPageId);
        records = records.concat(response.records ?? []);
        pageNum += 1;
      }
      if (response.syncInfo!.syncType === 'ISync') {
        // @ts-expect-error
        records = this._processISyncData(records);
      }
      return {
        syncToken: response.syncInfo!.syncToken,
        records,
      };
    } catch (error) {
      if (error?.response?.status === 403) {
        return {};
      }
      throw error;
    }
  }

  get _hasPermission() {
    const hasFeature = this._deps.extensionFeatures.features?.ReadPersonalContacts?.available ?? false;
    return (
      hasFeature &&
      this._deps.appFeatures.hasPersonalContactsPermission
    );
  }

  sync() {
    if (!this._hasPermission) {
      return;
    }
    return super.sync();
  }
}
