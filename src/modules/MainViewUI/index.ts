import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2 } from '@ringcentral-integration/core';

@Module({
  name: 'MainViewUI',
  deps: [
    'Locale',
    'RouterInteraction',
    'MessageStore',
    'Conversations',
    'AppFeatures',
    'GlipGroups',
    'GlipCompany',
    'GenericMeeting',
    'ThirdPartyService',
    'Brand',
    'PhoneTabsUI',
    'Theme',
    'SideDrawerUI',
    'ComposeTextUI',
    'MonitoredExtensions',
  ],
})
export class MainViewUI extends RcUIModuleV2 {
  constructor(deps) {
    super({ deps });
  }

  getUIProps() {
    const {
      locale,
      messageStore,
      appFeatures,
      routerInteraction,
      glipGroups,
      genericMeeting,
      brand,
      thirdPartyService,
      phoneTabsUI,
      theme,
      sideDrawerUI,
      conversations,
      monitoredExtensions,
    } = this._deps;

    const showPhone = appFeatures.ready && (
      appFeatures.isCallingEnabled ||
      appFeatures.hasReadExtensionCallLog ||
      appFeatures.hasReadCallRecordings ||
      appFeatures.hasVoicemailPermission
    );
    const showMeeting = (
      appFeatures.ready &&
      appFeatures.hasMeetingsPermission
    );

    const { currentLocale } = locale;
    const showContacts = appFeatures.ready && appFeatures.isContactsEnabled;
    const settingsUnreadCount = thirdPartyService.showAuthRedDot ? 1 : 0;
    return {
      currentLocale,
      showPhone,
      showMeeting,
      isRCV: genericMeeting.isRCV,
      showContacts,
      showGlip: appFeatures.hasGlipPermission,
      glipUnreadCounts: glipGroups.unreadCounts,
      currentPath: routerInteraction.currentPath,
      rcvProductName: brand.rcvProductName,
      settingsUnreadCount,
      phoneTabPath: phoneTabsUI.currentPath,
      showText: appFeatures.ready && appFeatures.hasReadTextPermission,
      showSharedSms: conversations.hasSharedSmsAccess,
      showNewComposeText: appFeatures.hasComposeTextPermission,
      smsUnreadCounts: messageStore.textUnreadCounts || 0,
      showFax: appFeatures.ready && appFeatures.hasReadFaxPermission,
      faxUnreadCounts: messageStore.faxUnreadCounts || 0,
      voiceUnreadCounts: messageStore.voiceUnreadCounts || 0,
      callHUDUnreadCounts: monitoredExtensions.hasPermission ? monitoredExtensions.activeExtensionLength : 0,
      customizedTabs: thirdPartyService.customizedTabs,
      themeType: theme.themeType,
      supportSideDrawer: sideDrawerUI.enabled,
      sideDrawerOpen: sideDrawerUI.extended,
    };
  }
  
  getUIFunctions() {
    const {
      routerInteraction,
      sideDrawerUI,
      composeTextUI,
    } = this._deps;
    return {
      goTo: (path) => {
        if (path) {
          routerInteraction.push(path);
        }
      },
      toggleSideDrawer: () => {
        sideDrawerUI.toggleExtended();
      },
      gotoComposeText: () => {
        composeTextUI.gotoComposeText();
      },
    };
  }
}