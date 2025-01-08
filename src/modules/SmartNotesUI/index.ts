import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2, watch } from '@ringcentral-integration/core';

@Module({
  name: 'SmartNotesUI',
  deps: [
    'SmartNotes',
    'Alert',
    'Theme',
    'SideDrawerUI',
  ],
})
export class SmartNotesUI extends RcUIModuleV2 {
  constructor(deps) {
    super({
      deps,
    });

    watch(
      this,
      () => this._deps.smartNotes.session,
      (smartNoteSession) => {
        this._deps.sideDrawerUI.setShow(!!smartNoteSession);
      },
    );
  }

  getUIProps() {
    const { smartNotes, theme } = this._deps;
    return {
      smartNoteSession: smartNotes.session,
      smartNoteClient: smartNotes.smartNoteClient,
      smartNoteRemoteEntry: smartNotes.smartNoteMFERemoteEntry,
      themeType: theme.themeType,
    };
  }

  onClose = () => {
    this._deps.sideDrawerUI.setShow(false);
    if (this._deps.smartNotes.session.status === 'Disconnected') {
      this._deps.smartNotes.setSession(null);
    }
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

  onSave = async (data) => {
    return this._deps.smartNotes.onSmartNoteSave();
  }

  getUIFunctions() {
    return {
      onClose: this.onClose,
      onAlert: this.onAlert,
      onSave: this.onSave,
    };
  }
}
