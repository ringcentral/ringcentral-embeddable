import { CallMonitor as CallMonitorBase } from '@ringcentral-integration/commons/modules/CallMonitor';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { computed } from '@ringcentral-integration/core';
import type { Call } from '@ringcentral-integration/commons/interfaces/Call.interface';
import { map } from 'ramda';

@Module({
  name: 'NewCallMonitor',
  deps: []
})
export class CallMonitor extends CallMonitorBase {
  @computed((that: CallMonitor) => [
    that.normalizedCalls,
    that._deps.contactMatcher?.dataMapping,
    that._deps.activityMatcher?.dataMapping,
    that._deps.contactMatcher?.callMatched,
  ])
  get allCalls(): Call[] {
    const contactMapping = this._deps.contactMatcher?.dataMapping ?? {};
    const activityMapping = this._deps.activityMatcher?.dataMapping ?? {};
    const calls = map((callItem) => {
      const fromNumber = callItem.from && callItem.from.phoneNumber;
      const toNumber = callItem.to && callItem.to.phoneNumber;
      const fromMatches = (fromNumber && contactMapping[fromNumber]) || [];
      const toMatches = (toNumber && contactMapping[toNumber]) || [];
      const callMatched = this._deps.contactMatcher?.callMatched ?? {};
      const toNumberEntity = callMatched[callItem.telephonySessionId]; // override to get toNumberEntity
      return {
        ...callItem,
        fromMatches,
        toMatches,
        activityMatches: activityMapping[callItem.sessionId] || [],
        toNumberEntity,
      };
    }, this.normalizedCalls);
    return calls;
  }

  override setMatchedData({
    sessionId,
    toEntityId,
  }) {
    const session = this.allCalls.find((call) => call.sessionId === sessionId);
    if (!session) {
      return;
    }
    this._deps.contactMatcher?.setCallMatched({
      telephonySessionId: session.telephonySessionId,
      toEntityId,
    });
  }
}
