import { CallQueuePresence as CallQueuePresenceData } from '@rc-ex/core/definitions';
import { computed, track } from '@ringcentral-integration/core';

import { Module } from '@ringcentral-integration/commons/lib/di';
import { DataFetcherV2Consumer, DataSource } from '@ringcentral-integration/commons/modules/DataFetcherV2';
import { Deps } from './CallQueuePresence.interface';
import { trackEvents } from '../Analytics/trackEvents';

@Module({
  name: 'CallQueuePresence',
  deps: [
    'Client',
    'DataFetcherV2',
    'AppFeatures',
    'Alert',
    { dep: 'CallQueuePresenceOptions', optional: true }
  ],
})
export class CallQueuePresence extends DataFetcherV2Consumer<
  Deps,
  CallQueuePresenceData
> {
  private _source: DataSource<CallQueuePresenceData>;

  constructor(deps: Deps) {
    super({
      deps,
    });
    this._source = new DataSource({
      ...deps.callQueuePresenceOptions,
      key: 'callQueuePresence',
      cleanOnReset: true,
      permissionCheckFunction: () =>
        this._hasPermission,
      fetchFunction: async (): Promise<CallQueuePresenceData> => {
        const response = await this._deps.client.service
          .platform()
          .get('/restapi/v1.0/account/~/extension/~/call-queue-presence');
        return response.json();
      },
    });
    this._deps.dataFetcherV2.register(this._source);
  }

  @computed(({ data }: CallQueuePresence) => [data])
  get presences() {
    return (this.data?.records ?? []).sort(
      (a, b) => a.callQueue.id - b.callQueue.id,
    );
  }

  get _hasPermission() {
    return this._deps.appFeatures.hasReadCallQueuePresencePermission;
  }

  // interface of ContactSource
  async sync() {
    if (!this._hasPermission) {
      return;
    }
    await this._deps.dataFetcherV2.fetchData(this._source);
  }

  @track((that: CallQueuePresence, queueId: string, acceptCalls: boolean) => [
    trackEvents.updateCallQueuePresence,
    { acceptCalls },
  ])
  async updatePresence(queueId: string, acceptCalls: boolean) {
    if (!this._deps.appFeatures.hasEditCallQueuePresencePermission) {
      console.error('No permission to update call queue presence');
      return;
    }
    try {
      const response = await this._deps.client.service
        .platform()
        .put(`/restapi/v1.0/account/~/extension/~/call-queue-presence`, {
          records: [{
            callQueue: { id: queueId },
            acceptCalls,
          }],
        });
      const newData = await response.json();
      await this._deps.dataFetcherV2.updateData(
        this._source,
        newData,
        Date.now(),
      );
    } catch (e) {
      console.error(e);
      this._deps.alert.danger({
        message: 'showCustomAlertMessage',
        level: 'danger',
        payload: {
          alertMessage: 'Failed to update call queue presence',
          details: [{
            title: 'Error',
            items: [{
              id: '1',
              type: 'text',
              text: e && e.message || 'Unknown error',
            }],
          }]
        },
      });
    }
  }
}
