import { AppFeatures as AppFeaturesBase } from '@ringcentral-integration/commons/modules/AppFeatures';
import { Module } from '@ringcentral-integration/commons/lib/di';

@Module({
  name: 'AppFeatures',
  deps: []
})
export class AppFeatures extends AppFeaturesBase {
  get ringtonePermission() {
    return !!this.config.RingtoneSettings;
  }

  get hasMeetingsPermission() {
    return (
      super.hasMeetingsPermission &&
      this.appScopes.indexOf('Meetings') > -1
    )
  }

  get appScopes() {
    return (
      this._deps.auth.token &&
      this._deps.auth.token.scope
    ) || '';
  }

  get hasGlipPermission() {
    return (
      super.hasGlipPermission && (
        this.appScopes.indexOf('Glip') > -1 ||
        this.appScopes.indexOf('TeamMessaging') > -1
      )
    );
  }

  get hasPersonalContactsPermission() {
    return (
      this.config.Contacts && (
        this.appScopes.indexOf('Contacts') > -1 ||
        this.appScopes.indexOf('ReadContacts') > -1
      )
    );
  }

  get hasReadExtensionCallLog() {
    return !!(
      super.hasReadExtensionCallLog && (
        this.appScopes.indexOf('ReadCallLog') > -1 ||
        this.appScopes.indexOf('ReadCallRecording') > -1
      )
    );
  }

  get showSignUpButton(){
    return !!this.config.SignUpButton;
  }
}
