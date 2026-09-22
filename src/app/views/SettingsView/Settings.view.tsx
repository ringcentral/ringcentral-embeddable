import {
  AccountInfo,
  AppFeatures,
  Auth,
  ExtensionFeatures,
  ExtensionInfo,
  Presence,
  RegionSettings,
  trackEvent,
  UserInfo,
} from '@ringcentral-integration/micro-auth/src/app/services';
import {
  Brand,
  Locale,
  Theme,
} from '@ringcentral-integration/micro-core/src/app/services';
import { ConversationLogger } from '@ringcentral-integration/micro-message/src/app/services';
import { CallLogger } from '@ringcentral-integration/micro-phone/src/app/services';
import {
  CallQueueManagementView,
  CPRClientView,
} from '@ringcentral-integration/micro-setting/src/app/views';
import {
  SettingsView as SettingsViewBase,
  type SettingsViewOptions,
  type SettingsViewPanelProps,
  type SettingsViewProps,
} from '@ringcentral-integration/micro-setting/src/app/views/SettingsView';
import {
  QuickAccess,
  UserGuide,
} from '@ringcentral-integration/micro-setting/src/app/services';
import {
  injectable,
  optional,
  RouterPlugin,
  type UIFunctions,
  type UIProps,
} from '@ringcentral-integration/next-core';

import { ThirdParty } from '../../services/ThirdParty';

const REGION_SETTINGS_PATH = '/settings/region';
const CALLING_SETTINGS_PATH = '/settings/calling';
const AUDIO_SETTINGS_PATH = '/settings/audio';
const APPLICATION_LOGS_SETTINGS_PATH = '/settings/applicationLogs';
const THEME_SETTINGS_PATH = '/settings/theme';
const AUTO_CALL_LOG_SETTINGS_PATH = '/settings/autoCallLogSettings';
const CALL_QUEUE_MANAGEMENT_PATH = '/settings/callQueueManagement';
const CONSENT_MANAGEMENT_PATH = '/settings/consentManagement';

type EmbeddableSettingsViewPanelProps = SettingsViewPanelProps & {
  onApplicationLogsLinkClick?: () => void;
  autoLogDescription?: string;
  autoLogReadOnlyReason?: string;
  autoLogSMSDescription?: string;
  autoLogSMSReadOnlyReason?: string;
  autoLogWarning?: string;
};

/**
 * Navigates to settings detail routes without the legacy full-page slide
 * transition because those routes are rendered in a routed side widget.
 */
@injectable({
  name: 'SettingsView',
})
export class SettingsView extends SettingsViewBase {
  constructor(
    userInfo: UserInfo,
    auth: Auth,
    theme: Theme,
    brand: Brand,
    locale: Locale,
    accountInfo: AccountInfo,
    extensionInfo: ExtensionInfo,
    regionSettings: RegionSettings,
    extensionFeatures: ExtensionFeatures,
    appFeatures: AppFeatures,
    router: RouterPlugin,
    presence: Presence,
    cPRClientView: CPRClientView,
    callQueueManagementView: CallQueueManagementView,
    private readonly _callLogger: CallLogger,
    private readonly _conversationLogger: ConversationLogger,
    private readonly _thirdParty: ThirdParty,
    @optional('Version') version?: string,
    @optional() quickAccess?: QuickAccess,
    @optional() userGuide?: UserGuide,
    @optional('SettingsViewOptions')
    settingsViewOptions?: SettingsViewOptions,
  ) {
    super(
      userInfo,
      auth,
      theme,
      brand,
      locale,
      accountInfo,
      extensionInfo,
      regionSettings,
      extensionFeatures,
      appFeatures,
      router,
      presence,
      cPRClientView,
      callQueueManagementView,
      version,
      quickAccess,
      userGuide,
      settingsViewOptions,
    );
  }

  override getUIProps(
    props: SettingsViewProps,
  ): UIProps<EmbeddableSettingsViewPanelProps> {
    return {
      ...super.getUIProps(props),
      showAutoLog:
        this._callLogger.ready &&
        !this._thirdParty.callLoggerAutoLogSettingHidden,
      autoLogEnabled: this._callLogger.autoLog,
      autoLogTitle: this._thirdParty.callLoggerAutoSettingLabel || undefined,
      autoLogDescription: this._thirdParty.callLoggerAutoSettingDescription,
      autoLogReadOnlyReason:
        this._thirdParty.callLoggerAutoSettingReadOnlyReason,
      autoLogWarning: this._thirdParty.callLoggerAutoSettingWarning,
      disableAutoLogEnabled: this._thirdParty.callLoggerAutoSettingReadOnly,
      showAutoLogSMS:
        this._thirdParty.messageLoggerRegistered &&
        !this._thirdParty.messageLoggerAutoSettingHidden,
      autoLogSMSEnabled: this._conversationLogger.autoLog,
      autoLogSMSTitle:
        this._thirdParty.messageLoggerAutoSettingLabel || 'Auto log messages',
      autoLogSMSDescription:
        this._thirdParty.messageLoggerAutoSettingDescription,
      autoLogSMSReadOnlyReason:
        this._thirdParty.messageLoggerAutoSettingReadOnlyReason,
      disableAutoLogSMSEnabled:
        this._thirdParty.messageLoggerAutoSettingReadOnly,
      showFeedback: this._thirdParty.showFeedback,
    };
  }

  override getUIFunctions(
    props: SettingsViewProps,
  ): UIFunctions<EmbeddableSettingsViewPanelProps> {
    const functions = super.getUIFunctions(props);
    const navigateTo = (path: string): void => {
      void this._router.push(path);
    };

    return {
      ...functions,
      onAutoLogChange: async (checked: boolean) => {
        await this._callLogger.setAutoLog(checked);
      },
      onAutoLogSMSChange: async (checked: boolean) => {
        await this._conversationLogger.setAutoLog(checked);
      },
      onRegionSettingsLinkClick: () =>
        navigateTo(props.regionSettingsUrl ?? REGION_SETTINGS_PATH),
      onCallingSettingsLinkClick: () =>
        navigateTo(props.callingSettingsUrl ?? CALLING_SETTINGS_PATH),
      onAutoCallLogSettingLinkClick: () =>
        navigateTo(props.autoCallLogSettingsUrl ?? AUTO_CALL_LOG_SETTINGS_PATH),
      onAudioSettingsLinkClick: () =>
        navigateTo(props.audioSettingsUrl ?? AUDIO_SETTINGS_PATH),
      onFeedbackSettingsLinkClick: () => {
        void this._thirdParty.onShowFeedback();
        this.trackOnFeedbackClick();
      },
      onApplicationLogsLinkClick: () =>
        navigateTo(APPLICATION_LOGS_SETTINGS_PATH),
      onThemeSwitchClick: () => navigateTo(THEME_SETTINGS_PATH),
      onCallQueueManagementClick: functions.onCallQueueManagementClick
        ? () => navigateTo(CALL_QUEUE_MANAGEMENT_PATH)
        : undefined,
      onConsentManagementClick: () => {
        trackEvent('Int_SMS_consentManagement', {});
        navigateTo(CONSENT_MANAGEMENT_PATH);
      },
    };
  }
}
