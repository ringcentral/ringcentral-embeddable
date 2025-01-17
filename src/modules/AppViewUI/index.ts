import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2 } from '@ringcentral-integration/core';
import { callingModes } from '@ringcentral-integration/commons/modules/CallingSettings/callingModes';

@Module({
  name: 'MainViewUI',
  deps: [
    'Locale',
    'OAuth',
    'Auth',
    'Environment',
    'Adapter',
    'AudioSettings',
    'CallingSettings',
    'AppFeatures',
    'RouterInteraction',
    'SideDrawerUI',
  ],
})
export class AppViewUI extends RcUIModuleV2 {
  constructor(deps) {
    super({ deps });
  }

  getUIProps({
    fromPopup,
    showCallBadge,
  }) {
    const {
      locale,
      oAuth,
      environment,
      adapter,
      audioSettings,
      callingSettings,
      appFeatures,
      auth,
      sideDrawerUI,
      routerInteraction,
    } = this._deps;

    return ({
      currentLocale: locale.currentLocale,
      server: environment.server,
      clientId: environment.clientId,
      clientSecret: environment.clientSecret,
      environmentEnabled: environment.enabled,
      redirectUri: oAuth.redirectUri,
      showDemoWarning: adapter.showDemoWarning,
      showAudioInit: (
        appFeatures.showAudioInitPrompt &&
        !audioSettings.autoplayEnabled && (
          fromPopup ||
          (auth.loggedIn && callingSettings.callingMode === callingModes.webphone)
        )
      ),
      showSideDrawer: sideDrawerUI.show,
      callBadgeHidden: (
        (!showCallBadge) ||
        routerInteraction.currentPath && (
          routerInteraction.currentPath.indexOf('/calls/active') > -1 ||
          routerInteraction.currentPath.indexOf('/conferenceCall') > -1
        )
      ),
    });
  }
  
  getUIFunctions({
    getAvatarUrl,
    getPresence,
  }) {
    const {
      environment,
      adapter,
      audioSettings,
      webphone,
      routerInteraction,
    } = this._deps;
    return ({
      onSetData: (options) => {
        environment.setData(options);
      },
      dismissDemoWarning: () => {
        adapter.dismissDemoWarning();
      },
      onEnableAudio: () => {
        audioSettings.setAutoPlayEnabled(true);
      },
      getAvatarUrl,
      getPresence,
      goToCallCtrl: (sessionId) => {
        const session = webphone.activeSession || webphone.ringSession || {};
        routerInteraction.push(`/calls/active/${sessionId || session.id}`);
      }
    });
  }
}