import {
  action,
  computed,
  injectable,
  optional,
  state,
} from '@ringcentral-integration/next-core';
import {
  AppFeatures as AppFeaturesBase,
  type AppFeaturesOptions,
  Auth,
  defaultConfiguration,
  ExtensionFeatures,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { Brand } from '@ringcentral-integration/micro-core/src/app/services';

import type { EmbeddableFeatureConfiguration } from './AppFeatures.interface';

@injectable({
  name: 'AppFeatures',
})
export class AppFeatures extends AppFeaturesBase<EmbeddableFeatureConfiguration> {
  constructor(
    _auth: Auth,
    _extensionFeatures: ExtensionFeatures,
    _brand: Brand,
    @optional('FeatureConfiguration')
    _featureConfiguration?: EmbeddableFeatureConfiguration,
    @optional('AppFeaturesOptions')
    _appFeaturesOptions?: AppFeaturesOptions,
  ) {
    super(
      _auth,
      _extensionFeatures,
      _brand,
      _featureConfiguration,
      _appFeaturesOptions,
    );
  }

  get ringtonePermission() {
    return !!this.config.RingtoneSettings;
  }

  override get hasMeetingsPermission() {
    return (
      super.hasMeetingsPermission &&
      (this.appScopes.indexOf('Meetings') > -1 ||
        this.appScopes.indexOf('Video') > -1)
    );
  }

  get hasInternalVideoScope() {
    return this.appScopes.indexOf('VideoInternal') > -1;
  }

  override get hasGlipPermission() {
    return (
      super.hasGlipPermission &&
      (this.appScopes.indexOf('Glip') > -1 ||
        this.appScopes.indexOf('TeamMessaging') > -1)
    );
  }

  get hasPersonalContactsPermission() {
    return (
      this.config.Contacts &&
      (this.appScopes.indexOf('Contacts') > -1 ||
        this.appScopes.indexOf('ReadContacts') > -1)
    );
  }

  override get hasReadExtensionCallLog() {
    return !!(
      super.hasReadExtensionCallLog &&
      (this.appScopes.indexOf('ReadCallLog') > -1 ||
        this.appScopes.indexOf('ReadCallRecording') > -1)
    );
  }

  override get hasReadCallRecordings() {
    return !!(
      this.config.CallRecording &&
      this.appScopes.indexOf('ReadCallRecording') > -1 &&
      this._extensionFeatures.features?.ReadExtensionCallRecordings?.available
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
      !!this.config.SMSTemplate &&
      (this.appScopes.indexOf('ReadAccounts') > -1 ||
        this.appScopes.indexOf('EditExtensions') > -1 ||
        this.appScopes.indexOf('EditAccounts') > -1) &&
      this.hasSMSSendingFeature
    );
  }

  get showSmsTemplateManage() {
    return (
      (this.appScopes.indexOf('EditExtensions') > -1 ||
        this.appScopes.indexOf('EditAccounts') > -1) &&
      this.hasSMSSendingFeature
    );
  }

  get hasSMSSendingFeature() {
    return this._extensionFeatures.features?.SMSSending?.available ?? false;
  }

  get hasReadCallQueuePresencePermission() {
    return (
      this.appScopes.indexOf('ReadPresence') > -1 &&
      (this._extensionFeatures.features?.CallQueuePresence?.available ?? false) &&
      (this._extensionFeatures.features?.ReadPresenceStatus?.available ?? false)
    );
  }

  get hasEditCallQueuePresencePermission() {
    return (
      this.appScopes.indexOf('EditPresence') > -1 &&
      (this._extensionFeatures.features?.EditCallQueuePresence?.available ?? false) &&
      (this._extensionFeatures.features?.EditPresenceStatus?.available ?? false)
    );
  }

  override get hasSmartNotePermission() {
    return (
      this.config.SmartNote &&
      this.appScopes.indexOf('AIInternal') > -1 &&
      this.appScopes.indexOf('TelephonySessions') > -1 &&
      (this._extensionFeatures.features?.AIGeneratedNotes?.available ?? false) &&
      (this._extensionFeatures.features?.VoiceCallsLiveTranscriptions?.available ?? false) &&
      (this._extensionFeatures.features?.VoiceCallsCloseCaptioning?.available ?? false)
    );
  }

  get hasRingSenseInsightsPermission() {
    return (
      this._extensionFeatures.features?.ReadRingSenseInsights?.available ?? false
    );
  }

  get hasRingSensePermission() {
    return this._extensionFeatures.features?.RingSenseForSales?.available ?? false;
  }

  get showAudioInitPrompt() {
    return !!this.config.AudioInitPrompt;
  }

  get allowLoadMoreCalls() {
    return this.config.LoadMoreCalls && this.hasReadExtensionCallLog;
  }

  get hasCallQueueSmsRecipientPermission() {
    return (
      this.config.SharedMessages &&
      (this._extensionFeatures.features?.CallQueueSmsRecipient?.available ?? false)
    );
  }

  get hasSharedMessageStorePermission() {
    return this.hasCallQueueSmsRecipientPermission;
  }

  @state
  configState: Partial<EmbeddableFeatureConfiguration> = {};

  @action
  setConfigState(newConfig: Partial<EmbeddableFeatureConfiguration> = {}) {
    this.configState = newConfig;
  }

  get hasVoicemailDropPermission() {
    return this.config.VoicemailDrop;
  }

  get hasHUDPermission() {
    return (
      this.appScopes.indexOf('ReadPresence') > -1 &&
      (this._extensionFeatures.features?.HUD?.available ?? false)
    );
  }

  get hasEditMonitoredExtensionsPermission() {
    return (
      this.appScopes.indexOf('EditPresence') > -1 &&
      (this._extensionFeatures.features?.EditBlfSettings?.available ?? false)
    );
  }

  get hasMessageThreadsPermission() {
    return (
      this.config.SMS &&
      this.appScopes.indexOf('SMS') > -1 &&
      (this._extensionFeatures.features?.MessageThreads?.available ?? false)
    );
  }

  get hasRingCXPermission() {
    return (
      this._extensionFeatures.features?.ContactCenterAccount?.available ?? false
    );
  }

  get hasSMSOptOutPermission() {
    return (
      this.config.SMS &&
      this.appScopes.indexOf('A2PSMS') > -1
    );
  }

  @computed((that: AppFeatures) => [that._featureConfiguration, that.configState])
  override get config(): EmbeddableFeatureConfiguration {
    return {
      ...defaultConfiguration,
      ...this._featureConfiguration,
      ...this.configState,
    };
  }
}