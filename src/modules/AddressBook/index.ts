import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  AddressBook as AddressBookBase,
} from '@ringcentral-integration/commons/modules/AddressBook';
import { sleep } from '@ringcentral-integration/utils';

const INVALID_TOKEN_ERROR_CODES = [
  // 400 CMN-101 Parameter [${parameterName}] value is invalid.
  'CMN-101',
];

@Module({
  name: 'NewAddressBook',
  deps: ['AppFeatures'],
})
export class AddressBook extends AddressBookBase {
  constructor(deps) {
    super(deps);
    this._source._props.permissionCheckFunction = () => this._hasPermission;
  }

  protected async _fetchAll(syncToken?: string) {
    const perPage = this._perPage;
    let records = [];
    let response = await this._fetch(perPage, syncToken);
    records = records.concat(response.records ?? []);
    let pageNum = 0;
    while (response.nextPageId) {
      const fetchInterval = pageNum > 3 ? 6000 : 2000; 
      await sleep(fetchInterval);
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
  }

  // override to fix rate limit issue when contacts count > 2500, and sync token error issue
  async _sync() {
    try {
      const data = await this._fetchAll(this.syncToken);
      return data;
    } catch (error) {
      if (error?.response?.status === 403) {
        return {};
      }
      // try Full Sync
      const responseResult = await error.response?.clone().json();
      if (
        responseResult?.errors?.some(({ errorCode = '' } = {}) =>
          INVALID_TOKEN_ERROR_CODES.includes(errorCode),
        )
      ) {
        const data = await this._fetchAll();
        return data;
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
