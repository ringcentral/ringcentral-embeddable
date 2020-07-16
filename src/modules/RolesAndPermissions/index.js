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
    disableGlip,
    disableConferenceCall,
    disableMeeting,
    disableReadText,
    ...options
  }) {
    super(options);
    this._disableCall = disableCall;
    this._disableMessages = disableMessages;
    this._disableConferenceInvite = disableConferenceInvite;
    this._disableConferenceCall = disableConferenceCall;
    this._disableGlip = disableGlip;
    this._disableMeeting = disableMeeting;
    this._disableReadText = disableReadText;
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

  get organizeMeetingEnabled() {
    const scope = (this._auth.token && this._auth.token.scope) || '';
    return !this._disableMeeting && scope.indexOf('Meeting') > -1 && this.permissions.Meetings;
  }

  get contactsEnabled() {
    return this.callingEnabled || this.hasReadMessagesPermission;
  }

  get hasGlipPermission() {
    return super.hasGlipPermission && !this._disableGlip;
  }

  get hasConferenceCallPermission() {
    return super.hasConferenceCallPermission && !this._disableConferenceCall;
  }

  get hasActiveCallControlPermission() {
    if (!this.ringoutEnabled || !this.ready || !this._auth.token) {
      return false;
    }
    const scope = this._auth.token.scope || '';
    return scope.indexOf('TelephonySessions') > -1 || scope.indexOf('CallControl') > -1;
  }

  get readTextPermissions() {
    return super.readTextPermissions && !this._disableReadText;
  }
}
