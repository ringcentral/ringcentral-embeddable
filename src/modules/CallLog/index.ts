import { CallLog as CallLogBase } from '@ringcentral-integration/commons/modules/CallLog';
import { Module } from '@ringcentral-integration/commons/lib/di';
import debounce from '@ringcentral-integration/commons/lib/debounce';
import { action, state, computed } from '@ringcentral-integration/core';
import {
  sortByStartTime,
} from '@ringcentral-integration/commons/lib/callLogHelpers';
import { EventEmitter } from 'events';

function getQueryDateToFromList(list): number {
  if (!list || list.length === 0) {
    return (new Date()).getTime();
  }
  const oldestItem = list[list.length - 1];
  return oldestItem.startTime - 1;
}

type CallLogQueryParams = {
  dateFrom: string;
  dateTo: string;
  perPage: number;
  recordingType?: string;
  direction?: string;
  type: string;
};

@Module({
  name: 'NewCallLog',
  deps: []
})
export class CallLog extends CallLogBase {
  private _eventEmitter: EventEmitter;
  constructor(options) {
    super(options);

    this.sync = debounce(this.sync, 5000, false);
    this._eventEmitter = new EventEmitter();
  }

  syncSuccess({
    timestamp,
    syncToken,
    records = [],
    supplementRecords = [],
    daySpan,
  }) {
    const newRecords = records.filter((record) => {
      if (record.type === 'Fax') {
        // Fax message will be received from message store. We don't need to sync it here in call log.
        return false;
      }
      if (record.direction === 'Outbound' && record.result === 'IP Phone Offline') {
        // filter out IP phone offline call logs, it is not useful for us. Following call log will override it.
        return false;
      }
      return true;
    });
    const newSupplementRecords = supplementRecords.filter((record) => record.type !== 'Fax');
  
    super.syncSuccess({
      timestamp,
      syncToken,
      records: newRecords,
      supplementRecords: newSupplementRecords,
      daySpan,
    });
    if (newRecords.length > 0 || newSupplementRecords.length > 0) {
      this._eventEmitter.emit('syncSuccess');
    }
  }

  onSyncSuccess(callback) {
    this._eventEmitter.on('syncSuccess', callback);
  }

  @state
  oldCalls = [];

  @state
  hasMoreOldCalls = true;

  @state
  loadingOldCalls = false;

  @action
  pushOldCalls(oldCalls, hasMore) {
    this.oldCalls = this.oldCalls.concat(oldCalls);
    this.hasMoreOldCalls = hasMore;
  }

  @action
  setLoadingOldCalls(loading) {
    this.loadingOldCalls = loading;
  }

  @action
  setHasMoreOldCalls(hasMore) {
    this.hasMoreOldCalls = hasMore;
  }

  @action
  resetOldCalls() {
    this.oldCalls = [];
    this.hasMoreOldCalls = true;
    this.loadingOldCalls = false;
  }

  clearOldCalls() {
    this.resetOldCalls();
  }

  async fetchOldCalls({
    isRecording = false,
    direction = undefined,
  }) {
    if (this.loadingOldCalls) {
      return;
    }
    if (!this.hasMoreOldCalls) {
      return;
    }
    if (!this._deps.appFeatures.hasReadExtensionCallLog) {
      if (this.hasMoreOldCalls) {
        this.setHasMoreOldCalls(false);
      }
      return;
    }
    this.setLoadingOldCalls(true);
    try {
      const dateToTime = getQueryDateToFromList(this.list)
      const dateFrom = new Date(dateToTime - 3 * 30 * 24 * 60 * 60 * 1000);
      const queryParams: CallLogQueryParams = {
        perPage: 20,
        dateFrom: dateFrom.toISOString(),
        dateTo: new Date(dateToTime).toISOString(),
        type: 'Voice',
      };
      if (isRecording) {
        queryParams.recordingType = 'All';
      }
      if (direction) {
        queryParams.direction = direction;
      }
      const response = await this._deps.client.account().extension().callLog().list(queryParams);
      const records = (response.records || [])
        .map(({ startTime, uri, extension, ...record}) => {
          return {
            ...record,
            startTime: startTime ? new Date(startTime).getTime() : null,
            extension: extension ? {
              id: extension.id,
            }: null,
          };
        });
      this.pushOldCalls(records, !!response.navigation.nextPage);
    } catch (error) {
      console.error(error);
    }
    this.setLoadingOldCalls(false);
  }

  @computed(({ data }: CallLog) => [data.list, data.map])
  get syncedList() {
    /**
     * old call log data structure migration
     */
    if (typeof this.data.list[0] === 'object') {
      return [];
    }

    return this.data.list.map((id) => this.data.map[id]).sort(sortByStartTime);
  }

  // override to push old calls
  @computed(({ data, oldCalls }: CallLog) => [data.list, oldCalls])
  get list() {
    return this.syncedList.concat(this.oldCalls);
  }

  override onReset() {
    super.onReset();
    this.resetOldCalls();
  }

  override async _sync(syncType) {
    if (!this._deps.appFeatures.hasReadExtensionCallLog) {
      return;
    }
    return super._sync(syncType);
  }
}
