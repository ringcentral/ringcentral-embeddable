import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2, action, state, watch } from '@ringcentral-integration/core';

@Module({
  name: 'SideDrawerUI',
  deps: [
    'Locale',
    'SmartNotes',
    'Alert',
    'Theme',
  ],
})
export class SideDrawerUI extends RcUIModuleV2 {
  constructor(deps) {
    super({
      deps,
    });

    watch(
      this,
      () => this._deps.smartNotes.session,
      (smartNoteSession) => {
        this.setShow(!!smartNoteSession);
      },
    );
  }

  @state
  show = false;

  @action
  setShow(show: boolean) {
    this.show = show;
  }

  getUIProps() {
    const { locale, smartNotes, theme } = this._deps;
    return {
      currentLocale: locale.currentLocale,
      smartNoteSession: smartNotes.session,
      show: this.show,
      smartNoteClient: smartNotes.smartNoteClient,
      smartNoteRemoteEntry: smartNotes.smartNoteMFERemoteEntry,
      themeType: theme.themeType,
    };
  }

  onClose = () => {
    this.setShow(false);
    this._deps.smartNotes.setSession(null);
  }

  onAlert = ({ level, message }) => {
    this._deps.alert.alert({
      message: 'showCustomAlertMessage',
      level,
      payload: {
        alertMessage: message
      }
    });
  }

  getUIFunctions() {
    return {
      onClose: this.onClose,
      onAlert: this.onAlert
    };
  }
}
