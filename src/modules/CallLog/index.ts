import { CallLog as CallLogBase } from '@ringcentral-integration/commons/modules/CallLog';
import { Module } from '@ringcentral-integration/commons/lib/di';
import debounce from '@ringcentral-integration/commons/lib/debounce';
import { action, state, computed } from '@ringcentral-integration/core';
import {
  sortByStartTime,
} from '@ringcentral-integration/commons/lib/callLogHelpers';

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
  withRecording?: string;
};

@Module({
  name: 'NewCallLog',
  deps: []
})
export class CallLog extends CallLogBase {
  constructor(options) {
    super(options);

    this.sync = debounce(this.sync, 5000, false);
  }

  syncSuccess({
    timestamp,
    syncToken,
    records = [],
    supplementRecords = [],
    daySpan,
  }) {
    super.syncSuccess({
      timestamp,
      syncToken,
      records: records.filter((record) => record.type !== 'Fax'),
      supplementRecords: supplementRecords.filter((record) => record.type !== 'Fax'),
      daySpan,
    });
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

  async fetchOldCalls(type = 'calls') {
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
      };
      if (type === 'recordings') {
        queryParams.withRecording = 'true';
      }
      const response = await this._deps.client.account().extension().callLog().list(queryParams);
      const records = (response.records || [])
        .filter((record) => record.type !== 'Fax')
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
}
