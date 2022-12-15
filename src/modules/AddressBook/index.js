import AddressBook from '@ringcentral-integration/commons/modules/AddressBook';
import { Module } from '@ringcentral-integration/commons/lib/di';
import sleep from '@ringcentral-integration/commons/lib/sleep';
import syncTypes from '@ringcentral-integration/commons/enums/syncTypes';

const CONTACTS_PER_PAGE = 250;

function getSyncParams(syncToken, pageId) {
  const query = {
    perPage: CONTACTS_PER_PAGE,
  };
  if (syncToken) {
    query.syncToken = syncToken;
    query.syncType = syncTypes.iSync;
  } else {
    query.syncType = syncTypes.fSync;
  }
  if (pageId) {
    query.pageId = pageId;
  }
  return query;
}

@Module({
  name: 'NewAddressBook',
  deps: ['AppFeatures'],
})
export default class NewAddressBook extends AddressBook {
  constructor(options) {
    super(options);
    this._appFeatures = options.appFeatures;
  }
  // override to fix rate limit issue when contacts count > 2500
  async _sync(syncToken, pageId, pageNum = 0) {
    const params = getSyncParams(syncToken, pageId);
    const response = await this._syncAddressBookApi(params);
    if (!response.nextPageId) {
      return response;
    }
    const nextPage = pageNum + 1;
    if (nextPage > 3) {
      await sleep(6000);
    } else {
      await sleep(2000);
    }
    const lastResponse = await this._sync(syncToken, response.nextPageId, nextPage);
    return {
      ...lastResponse,
      records: response.records.concat(lastResponse.records),
    };
  }

  get _hasPermission() {
    return (
      super._hasPermission &&
      this._appFeatures.hasPersonalContactsPermission
    );
  }

  sync() {
    if (!this._hasPermission) {
      return;
    }
    return super.sync();
  }
}
