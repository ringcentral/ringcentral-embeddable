import { Module } from '@ringcentral-integration/commons/lib/di';
import { ContactMatcher as ContactMatcherBase } from '@ringcentral-integration/commons/modules/ContactMatcher';
import { action, state, storage, computed } from '@ringcentral-integration/core';

@Module({
  name: 'NewContactMatcher',
  deps: []
})
export class ContactMatcher extends ContactMatcherBase {
  @state
  manualRefreshNumber = null;

  @action
  setManualRefreshNumber(phoneNumber) {
    this.manualRefreshNumber = phoneNumber;
  }

  @action
  resetManualRefreshNumber() {
    this.manualRefreshNumber = null;
  }

  @storage
  @state
  callMatchedList = [];

  @action
  setCallMatched({ telephonySessionId, toEntityId }) {
    const matched = this.callMatchedList.find(
      (call) => {
        return call.telephonySessionId === telephonySessionId;
      }
    );
    if (matched) {
      matched.toEntityId = toEntityId;
    } else {
      if (this.callMatchedList.length > 200) {
        this.callMatchedList.shift();
      }
      this.callMatchedList.push({
        telephonySessionId,
        toEntityId,
      });
    }
  }

  @computed((that: ContactMatcher) => [that.callMatchedList])
  get callMatched() {
    return this.callMatchedList.reduce((acc, call) => {
      acc[call.telephonySessionId] = call.toEntityId;
      return acc;
    }, {});
  }
}
