import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  SettingsUI as BaseSettingsUI,
} from '@ringcentral-integration/widgets/modules/SettingsUI';

@Module({
  name: 'SettingsUI',
  deps: [
    'CallLogger',
    'ConversationLogger',
    'ThirdPartyService',
    'AudioSettings',
    'SmartNotes',
  ]
})
export class SettingsUI extends BaseSettingsUI {
  getUIProps(props) {
    const baseProps = super.getUIProps(props);
    const {
      callLogger,
      conversationLogger,
      appFeatures,
      thirdPartyService,
      audioSettings,
      brand,
      smartNotes,
    } = this._deps;
    return {
      ...baseProps,
      version: props.appVersion,
      showAudio: audioSettings.availableDevices.length > 0 && appFeatures.isCallingEnabled,
      showAutoLog: callLogger.ready,
      autoLogEnabled: callLogger.autoLog,
      autoLogReadOnly: callLogger.autoLogReadOnly,
      autoLogReadOnlyReason: callLogger.autoLogReadOnlyReason,
      autoLogTitle: thirdPartyService.callLoggerAutoSettingLabel,
      showAutoLogSMS: conversationLogger.loggerSourceReady,
      autoLogSMSEnabled: conversationLogger.autoLog,
      autoLogSMSTitle: thirdPartyService.messageLoggerAutoSettingLabel || 'Auto log messages',
      autoLogSMSReadOnly: conversationLogger.autoLogReadOnly,
      autoLogSMSReadOnlyReason: conversationLogger.autoLogReadOnlyReason,
      authorizationRegistered: thirdPartyService.authorizationRegistered,
      thirdPartyAuthorized: thirdPartyService.authorized,
      thirdPartyContactSyncing: thirdPartyService.contactSyncing,
      authorizedTitle: thirdPartyService.authorizedTitle,
      unauthorizedTitle: thirdPartyService.unauthorizedTitle,
      thirdPartyServiceName: thirdPartyService.serviceName,
      thirdPartyServiceInfo: thirdPartyService.serviceInfo,
      authorizationLogo: thirdPartyService.authorizationLogo,
      authorizedAccount: thirdPartyService.authorizedAccount,
      showAuthRedDot: thirdPartyService.showAuthRedDot,
      showFeedback: thirdPartyService.showFeedback,
      thirdPartySettings: thirdPartyService.settings,
      thirdPartyAuth: thirdPartyService.authorizationRegistered ? {
        serviceName: thirdPartyService.displayName || thirdPartyService.serviceName,
        serviceInfo: thirdPartyService.serviceInfo,
        authorized: thirdPartyService.authorized,
        contactSyncing: thirdPartyService.contactSyncing,
        authorizedTitle: thirdPartyService.authorizedTitle,
        unauthorizedTitle: thirdPartyService.unauthorizedTitle,
        authorizationLogo: thirdPartyService.authorizationLogo,
        authorizedAccount: thirdPartyService.authorizedAccount,
        showAuthRedDot: thirdPartyService.showAuthRedDot,
      } : null,
      showThemeSetting: brand.code === 'rc', // only show theme settings for rc brand now
      showSmartNoteSetting: smartNotes.hasPermission && smartNotes.clientInitialized,
      smartNoteEnabled: smartNotes.showSmartNote,
    };
  }

  getUIFunctions(props) {
    const baseFuncs = super.getUIFunctions(props);
    const {
      callLogger,
      conversationLogger,
      thirdPartyService,
      routerInteraction,
      smartNotes,
    } = this._deps;
    return {
      ...baseFuncs,
      onAutoLogChange(autoLog) { callLogger.setAutoLog(autoLog); },
      onAutoLogSMSChange(autoLog) { conversationLogger.setAutoLog(autoLog); },
      onThirdPartyAuthorize: () => thirdPartyService.authorizeService(),
      onFeedbackSettingsLinkClick() {
        thirdPartyService.onShowFeedback();
      },
      onSettingToggle: setting => thirdPartyService.onUpdateSetting({
        ...setting,
        value: !setting.value,
      }),
      gotoThirdPartySection: (sectionId) => {
        routerInteraction.push(`/settings/thirdParty/${sectionId}`);
      },
      onThirdPartyButtonClick: (buttonId) => {
        thirdPartyService.onClickSettingButton(buttonId);
      },
      onThemeSettingsLinkClick() {
        routerInteraction.push('/settings/theme');
      },
      onSmartNoteToggle: () => {
        smartNotes.toggleShowSmartNote();
      },
    }
  }
}
