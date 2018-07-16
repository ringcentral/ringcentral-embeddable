import RolesAndPermissions from 'ringcentral-integration/modules/RolesAndPermissions';
import { Module } from 'ringcentral-integration/lib/di';
import { createSelector } from 'reselect';
import getter from 'ringcentral-integration/lib/getter';

@Module({
  name: 'RolesAndPermissions',
  deps: [
    { dep: 'RolesAndPermissionsOptions', optional: true }
  ]
})
export default class NewRolesAndPermissions extends RolesAndPermissions {
  constructor({
    disableCall,
    disableMessages,
    disableConferenceInvite,
    ...options,
  }) {
    super(options);
    this._disableCall = disableCall;
    this._disableMessages = disableMessages;
    this._disableConferenceInvite = disableConferenceInvite;
  }

  @getter
  permissions = createSelector(
    () => this.data,
    () => this._disableMessages,
    (data, disableMessages) => {
      if (!data) {
        return {};
      }
      if (!disableMessages) {
        return data;
      }
      const newData = { ...data };
      delete newData.OutboundSMS;
      delete newData.InternalSMS;
      return newData;
    }
  )

  get callingEnabled() {
    return super.callingEnabled && !this._disableCall;
  }

  get webphoneEnabled() {
    return super.webphoneEnabled && !this._disableCall;
  }

  get hasReadMessagesPermission() {
    return super.hasReadMessagesPermission && !this._disableMessages;
  }

  get messagesEnabled() {
    return this.hasReadMessagesPermission;
  }

  get organizeConferenceEnabled() {
    return (
      this.permissions.OrganizeConference &&
      !this._disableConferenceInvite
    );
  }

  get contactsEnabled() {
    return this.callingEnabled || this.hasReadMessagesPermission;
  }
}
