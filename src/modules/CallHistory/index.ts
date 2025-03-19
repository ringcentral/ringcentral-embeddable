import { CallHistory as CallHistoryBase } from '@ringcentral-integration/commons/modules/CallHistory';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { computed } from '@ringcentral-integration/core';
import type { HistoryCall } from '@ringcentral-integration/commons/modules/CallHistory/CallHistory.interface';
import { sortByStartTime } from '@ringcentral-integration/commons/lib/callLogHelpers';

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
    that.normalizedCalls,
    that.endedCalls,
    that._deps.contactMatcher?.dataMapping,
    that._deps.activityMatcher?.dataMapping,
    that._deps.contactMatcher?.callMatched,
  ])
  get calls(): HistoryCall[] {
    const contactMapping = this._deps.contactMatcher?.dataMapping ?? {};
    const activityMapping = this._deps.activityMatcher?.dataMapping ?? {};
    const callMatched = this._deps.contactMatcher?.callMatched ?? {};
    const telephonySessionIds: Record<string, boolean> = {};
    const calls = this.normalizedCalls.map((call) => {
      telephonySessionIds[call.telephonySessionId] = true;
      const fromName = call.from.name || call.from.phoneNumber;
      const toName = call.to.name || call.to.phoneNumber;
      const { fromMatches, toMatches } = this.findMatches(contactMapping, call);
      const activityMatches = activityMapping[call.sessionId] || [];
      const matched = callMatched[call.telephonySessionId]; // override to get toNumberEntity
      return {
        ...call,
        fromName,
        toName,
        fromMatches,
        toMatches,
        activityMatches,
        toNumberEntity: matched,
      };
    });
    const filteredEndedCalls = this.endedCalls
      .filter((call) => !telephonySessionIds[call.telephonySessionId])
      .map((call) => {
        const activityMatches = activityMapping[call.sessionId] || [];
        const fromNumber =
          call.from && (call.from.phoneNumber || call.from.extensionNumber);
        const toNumber =
          call.to && (call.to.phoneNumber || call.to.extensionNumber);
        const fromMatches = (fromNumber && contactMapping[fromNumber]) || [];
        const toMatches = (toNumber && contactMapping[toNumber]) || [];
        return {
          ...call,
          activityMatches,
          fromMatches,
          toMatches,
        };
      });
    return [...filteredEndedCalls, ...calls].sort(sortByStartTime);
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
