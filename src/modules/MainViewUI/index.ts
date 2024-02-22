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
    } = this._deps;

    const unreadCounts = messageStore.unreadCounts || 0;
    const showCall = appFeatures.ready && (
      appFeatures.isCallingEnabled ||
      appFeatures.hasReadExtensionCallLog ||
      appFeatures.hasReadCallRecordings
    );
    const showMessages = appFeatures.ready && appFeatures.hasReadMessagesPermission;
    const showMeeting = (
      appFeatures.ready &&
      appFeatures.hasMeetingsPermission
    );

    const { currentLocale } = locale;
    const showContacts = appFeatures.ready && appFeatures.isContactsEnabled;
    const settingsUnreadCount = thirdPartyService.showAuthRedDot ? 1 : 0;
    return {
      currentLocale,
      unreadCounts,
      showCall,
      showMessages,
      showNewComposeText: appFeatures.hasComposeTextPermission,
      showMeeting,
      isRCV: genericMeeting.isRCV,
      showContacts,
      showGlip: (appFeatures.hasGlipPermission && !!glipCompany.name),
      glipUnreadCounts: glipGroups.unreadCounts,
      currentPath: routerInteraction.currentPath,
      rcvProductName: brand.rcvProductName,
      settingsUnreadCount,
      phoneTabPath: this._deps.phoneTabsUI.currentPath,
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