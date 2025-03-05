import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  action,
  RcUIModuleV2,
  state,
  computed,
  storage,
  track,
} from '@ringcentral-integration/core';

type CurrentContact = {
  id?: string;
  phoneNumber?: string;
  phoneNumbers?: {
    phoneNumber: string;
  }[];
}

@Module({
  name: 'ContactAppsUI',
  deps: [],
})
export class ContactAppsUI extends RcUIModuleV2 {
  constructor(deps) {
    super({
      deps,
    });
  }

  @state
  currentContact: CurrentContact | null = null;

  @action
  setCurrentContact(contact: CurrentContact) {
    this.currentContact = contact;
  }

  getUIProps() {
    return {
      currentContact: this.currentContact,
    };
  }

  getUIFunctions() {
    return {
      setCurrentContact: this.setCurrentContact,
    };
  }
}