import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  AppFeatures as AppFeaturesBase,
} from '@ringcentral-integration/commons/modules/AppFeatures';

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
      super.hasMeetingsPermission && (
        this.appScopes.indexOf('Meetings') > -1 ||
        this.appScopes.indexOf('Video') > -1
      )
    );
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

  get hasReadCallRecordings() {
    return !!(
      (
        this.appScopes.indexOf('ReadCallRecording') > -1
      ) && this._deps.extensionFeatures.features?.ReadExtensionCallRecordings?.available
    );
  }

  get showSignUpButton() {
    return !!this.config.SignUpButton;
  }

  get showNoiseReductionSetting() {
    return !!this.config.NoiseReduction;
  }

  get showSmsTemplate() {
    return (
      this.appScopes.indexOf('ReadAccounts') > -1 ||
      this.appScopes.indexOf('EditAccounts') > -1
    ) && (
      this.hasCompanySmsTemplateReadPermission ||
      this.hasPersonalSmsTemplatePermission
    );
  }

  get showSmsTemplateManage() {
    return (
      this.appScopes.indexOf('EditAccounts') > -1 &&
      (
        this.hasCompanySmsTemplateManagePermission ||
        this.hasPersonalSmsTemplatePermission
      )
    );
  }

  get hasCompanySmsTemplateReadPermission() {
    return this._deps.extensionFeatures.features?.ReadCompanySmsTemplates?.available ?? false;
  }

  get hasCompanySmsTemplateManagePermission() {
    return this._deps.extensionFeatures.features?.EditCompanySmsTemplates?.available ?? false;
  }

  get hasPersonalSmsTemplatePermission() {
    return this._deps.extensionFeatures.features?.SMSSending?.available ?? false;
  }
}
