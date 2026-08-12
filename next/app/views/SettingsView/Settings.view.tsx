import {
  AccountInfo,
  AppFeatures,
  Auth,
  ExtensionFeatures,
  ExtensionInfo,
  Presence,
  RegionSettings,
  UserInfo,
} from '@ringcentral-integration/micro-auth/src/app/services';
import {
  Brand,
  Locale,
  Theme,
} from '@ringcentral-integration/micro-core/src/app/services';
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
} from '@ringcentral-integration/next-core';

const REGION_SETTINGS_PATH = '/settings/region';
const CALLING_SETTINGS_PATH = '/settings/calling';
const AUDIO_SETTINGS_PATH = '/settings/audio';
const FEEDBACK_SETTINGS_PATH = '/settings/feedback';
const ISSUE_TRACKING_SETTINGS_PATH = '/settings/issuesTracking';
const THEME_SETTINGS_PATH = '/settings/theme';
const AUTO_CALL_LOG_SETTINGS_PATH = '/settings/autoCallLogSettings';
const CALL_QUEUE_MANAGEMENT_PATH = '/settings/callQueueManagement';

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

  override getUIFunctions(
    props: SettingsViewProps,
  ): UIFunctions<SettingsViewPanelProps> {
    const functions = super.getUIFunctions(props);
    const navigateTo = (path: string): void => {
      void this._router.push(path);
    };

    return {
      ...functions,
      onRegionSettingsLinkClick: () =>
        navigateTo(props.regionSettingsUrl ?? REGION_SETTINGS_PATH),
      onCallingSettingsLinkClick: () =>
        navigateTo(props.callingSettingsUrl ?? CALLING_SETTINGS_PATH),
      onAutoCallLogSettingLinkClick: () =>
        navigateTo(
          props.autoCallLogSettingsUrl ?? AUTO_CALL_LOG_SETTINGS_PATH,
        ),
      onAudioSettingsLinkClick: () =>
        navigateTo(props.audioSettingsUrl ?? AUDIO_SETTINGS_PATH),
      onFeedbackSettingsLinkClick: () => {
        if (this._settingsViewOptions?.onFeedBackSettingsLink) {
          this._settingsViewOptions.onFeedBackSettingsLink();
        } else {
          navigateTo(
            props.feedbackSettingsUrl ?? FEEDBACK_SETTINGS_PATH,
          );
        }
        this.trackOnFeedbackClick();
      },
      onTrackingClick: () => navigateTo(ISSUE_TRACKING_SETTINGS_PATH),
      onThemeSwitchClick: () => navigateTo(THEME_SETTINGS_PATH),
      onCallQueueManagementClick: functions.onCallQueueManagementClick
        ? () => navigateTo(CALL_QUEUE_MANAGEMENT_PATH)
        : undefined,
    };
  }
}
