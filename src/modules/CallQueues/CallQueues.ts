import { CallQueues as CallQueuesList } from '@rc-ex/core/definitions';
import { computed } from '@ringcentral-integration/core';

import { Module } from '@ringcentral-integration/commons/lib/di';
import { DataFetcherV2Consumer, DataSource } from '@ringcentral-integration/commons/modules/DataFetcherV2';
import {
  getFilterContacts,
  getMatchContactsByPhoneNumber,
  getSearchForPhoneNumbers,
} from '@ringcentral-integration/commons/lib/contactHelper';
import { phoneTypes } from '@ringcentral-integration/commons/enums/phoneTypes';

import { Deps } from './CallQueue.interface';

@Module({
  name: 'CallerId',
  deps: [
    'Client',
    'DataFetcherV2',
    'ExtensionFeatures',
    { dep: 'CallerIdOptions', optional: true }
  ],
})
export class CallQueues extends DataFetcherV2Consumer<
  Deps,
  CallQueuesList
> {
  constructor(deps: Deps) {
    super({
      deps,
    });
    this._source = new DataSource({
      ...deps.callQueuesOptions,
      key: 'callerId',
      cleanOnReset: true,
      permissionCheckFunction: () =>
        this._hasPermission,
      fetchFunction: async (): Promise<CallQueuesList> => {
        const response = await this._deps.client.service
          .platform()
          .get('/restapi/v1.0/account/~/call-queues?perPage=1000');
        return response.json();
      },
    });
    this._deps.dataFetcherV2.register(this._source);
  }

  @computed(({ data }: CallQueues) => [data])
  get queues() {
    return this.data?.records ?? [];
  }

  // interface of ContactSource
  get sourceName() {
    return 'Call queues';
  }

  get _hasPermission() {
    return this._deps.extensionFeatures.features?.ReadExtensions
          ?.available ?? false;
  }

  // interface of ContactSource
  @computed(({ queues }: CallQueues) => [queues])
  get contacts() {
    return this.queues.map((queue) => {
      return {
        ...queue,
        type: this.sourceName,
        phoneNumbers: [{
          phoneNumber: queue.extensionNumber,
          phoneType: phoneTypes.extension,
        }],
      };
    })
  }

  // interface of ContactSource
  get sourceReady() {
    return this.ready && this._hasPermission;
  }

  // interface of ContactSource
  get rawContacts() {
    return this.queues;
  }

  // interface of ContactSource
  findContact(contactId: string) {
    return this.contacts.find((x) => x.id === contactId);
  }

  // interface of ContactSource
  filterContacts(searchFilter: string) {
    return getFilterContacts(
      this.contacts,
      searchFilter,
    );
  }

  // interface of ContactSource
  matchContactsByPhoneNumber(phoneNumber: string) {
    return getMatchContactsByPhoneNumber({
      contacts: this.contacts,
      phoneNumber,
      entityType:'Queue',
    });
  }

  // interface of ContactSource
  searchForPhoneNumbers(searchString: string) {
    return getSearchForPhoneNumbers({
      contacts: this.contacts,
      searchString,
      entityType: 'Queue',
      options: null,
    });
  }

  // interface of ContactSource
  async sync(options = {}) {
    if (!this._hasPermission) {
      return;
    }
    if (options.type === 'manual' || this.data == null) {
      // only trigger sync when user manually refresh the data
      await this._deps.dataFetcherV2.fetchData(this._source);
    }
  }
}
