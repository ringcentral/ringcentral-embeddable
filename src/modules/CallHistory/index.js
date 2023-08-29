import { CallHistory as CallHistoryBase } from '@ringcentral-integration/commons/modules/CallHistory';
import { Module } from '@ringcentral-integration/commons/lib/di';

@Module({
  name: 'NewCallHistory',
  deps: []
})
export class CallHistory extends CallHistoryBase {
  // override to fix rate limit issue at multiple tabs
  _addEndedCalls(endedCalls) {
    endedCalls.forEach((call) => {
      // TODO: refactor with immutable data update
      call.result = 'Disconnected';
      call.isRecording = false;
      call.warmTransferInfo = undefined;
    });
    this.setEndedCalls(endedCalls, Date.now());
    if (!this._deps.storage || !this._deps.tabManager || this._deps.tabManager.active) {
      this._deps.callLog.sync();
    }
  }
}
