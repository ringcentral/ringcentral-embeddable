import { CallLog as CallLogBase } from '@ringcentral-integration/commons/modules/CallLog';
import { Module } from '@ringcentral-integration/commons/lib/di';
import debounce from '@ringcentral-integration/commons/lib/debounce';

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
}
