import { Module } from '@ringcentral-integration/commons/lib/di';
import { ContactMatcher as ContactMatcherBase } from '@ringcentral-integration/commons/modules/ContactMatcher';
import { action, state } from '@ringcentral-integration/core';

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
}