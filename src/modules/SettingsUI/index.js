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
      showAutoLog: callLogger.ready && !thirdPartyService.callLoggerAutoLogSettingHidden,
      autoLogEnabled: callLogger.autoLog,
      autoLogReadOnly: callLogger.autoLogReadOnly,
      autoLogReadOnlyReason: callLogger.autoLogReadOnlyReason,
      autoLogTitle: thirdPartyService.callLoggerAutoSettingLabel,
      autoLogDescription: thirdPartyService.callLoggerAutoSettingDescription,
      autoLogWarning: thirdPartyService.callLoggerAutoSettingWarning,
      showAutoLogSMS: conversationLogger.loggerSourceReady && !thirdPartyService.messageLoggerAutoSettingHidden,
      autoLogSMSEnabled: conversationLogger.autoLog,
      autoLogSMSTitle: thirdPartyService.messageLoggerAutoSettingLabel || 'Auto log messages',
      autoLogSMSDescription: thirdPartyService.messageLoggerAutoSettingDescription,
      autoLogSMSReadOnly: conversationLogger.autoLogReadOnly,
      autoLogSMSReadOnlyReason: conversationLogger.autoLogReadOnlyReason,
      showFeedback: thirdPartyService.showFeedback,
      thirdPartySettings: thirdPartyService.settings,
      thirdPartyAuth: thirdPartyService.authorizationRegistered ? {
        serviceName: thirdPartyService.displayName || thirdPartyService.serviceName,
        serviceInfo: thirdPartyService.serviceInfo,
        authorized: thirdPartyService.authorized,
        contactSyncing: thirdPartyService.contactSyncing,
        authorizedTitle: thirdPartyService.authorizedTitle || 'Unauthorize',
        unauthorizedTitle: thirdPartyService.unauthorizedTitle || 'Authorize',
        authorizationLogo: thirdPartyService.authorizationLogo,
        authorizedAccount: thirdPartyService.authorizedAccount,
        showAuthRedDot: thirdPartyService.showAuthRedDot,
        showAuthButton: thirdPartyService.showAuthButton,
        licenseStatus: thirdPartyService.licenseStatus,
        licenseStatusColor: thirdPartyService.licenseStatusColor,
        licenseDescription: thirdPartyService.licenseDescription,
      } : null,
      showThemeSetting: brand.code === 'rc', // only show theme settings for rc brand now
      showSmartNoteSetting: smartNotes.hasPermission && smartNotes.clientInitialized,
      smartNoteEnabled: smartNotes.showSmartNote,
      smartNoteEnabledReadOnly: smartNotes.showSmartNoteReadOnly,
      smartNoteEnabledReadOnlyReason: smartNotes.showSmartNoteReadOnlyReason,
      smartNoteAutoStartEnabled: smartNotes.autoStartSmartNote,
      smartNoteAutoStartEnabledReadOnly: smartNotes.autoStartSmartNoteReadOnly,
      smartNoteAutoStartEnabledReadOnlyReason: smartNotes.autoStartSmartNoteReadOnlyReason,
      showCallQueuePresenceSettings: appFeatures.hasReadCallQueuePresencePermission && appFeatures.hasEditCallQueuePresencePermission,
      showText: appFeatures.hasSendSMSPermission,
      showVoicemailDropSettings: appFeatures.hasVoicemailDropPermission,
      showPhoneNumberFormatSettings: true,
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
      onThirdPartySettingChanged: (setting, newValue) => thirdPartyService.onUpdateSetting({
        ...setting,
        value: newValue,
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
      onSmartNoteAutoStartToggle: () => {
        smartNotes.toggleAutoStartSmartNote();
      },
      gotoCallQueuePresenceSettings: () => {
        routerInteraction.push('/settings/callQueuePresence');
      },
      onThirdPartyLicenseRefresh: () => {
        thirdPartyService.onClickLicenseRefreshButton();
      },
      onTextSettingsLinkClick: () => {
        routerInteraction.push('/settings/text');
      },
      gotoVoicemailDropSettings: () => {
        routerInteraction.push('/settings/voicemailDrop');
      },
      gotoPhoneNumberFormatSettings: () => {
        routerInteraction.push('/settings/phoneNumberFormat');
      },
    }
  }
}
