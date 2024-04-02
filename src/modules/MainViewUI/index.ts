import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2 } from '@ringcentral-integration/core';

@Module({
  name: 'MainViewUI',
  deps: [
    'Locale',
    'RouterInteraction',
    'MessageStore',
    'AppFeatures',
    'GlipGroups',
    'GlipCompany',
    'GenericMeeting',
    'ThirdPartyService',
    'Brand',
    'PhoneTabsUI',
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
      glipCompany,
      genericMeeting,
      brand,
      thirdPartyService,
      phoneTabsUI,
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
      showGlip: (appFeatures.hasGlipPermission && !!glipCompany.name),
      glipUnreadCounts: glipGroups.unreadCounts,
      currentPath: routerInteraction.currentPath,
      rcvProductName: brand.rcvProductName,
      settingsUnreadCount,
      phoneTabPath: phoneTabsUI.currentPath,
      showText: appFeatures.ready && appFeatures.hasReadTextPermission,
      showNewComposeText: appFeatures.hasComposeTextPermission,
      smsUnreadCounts: messageStore.textUnreadCounts || 0,
      showFax: appFeatures.ready && appFeatures.hasReadFaxPermission,
      faxUnreadCounts: messageStore.faxUnreadCounts || 0,
      voiceUnreadCounts: messageStore.voiceUnreadCounts || 0,
    };
  }
  
  getUIFunctions() {
    return {
      goTo: (path) => {
        if (path) {
          this._deps.routerInteraction.push(path);
        }
      },
    };
  }
}