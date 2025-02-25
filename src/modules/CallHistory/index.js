import { CallHistory as CallHistoryBase } from '@ringcentral-integration/commons/modules/CallHistory';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { computed } from '@ringcentral-integration/core';

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

  @computed((that: CallHistory) => [
    that.calls,
  ])
  get callerIDMap() {
    const map = {};
    this.calls.forEach((call) => {
      if (call.from) {
        const fromNumber = call.from.phoneNumber || call.from.extensionNumber;
        if (!map[fromNumber] && call.from.name) {
          map[fromNumber] = call.from.name;
        }
      }
      if (call.to) {
        const toNumber = call.to.phoneNumber || call.to.extensionNumber;
        if (!map[toNumber] && call.to.name) {
          map[toNumber] = call.to.name;
        }
      }
    });
    return map;
  }
}
