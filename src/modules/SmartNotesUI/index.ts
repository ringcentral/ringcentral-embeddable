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
        if (smartNoteSession) {
          this._deps.sideDrawerUI.openWidget({
            widget: {
              id: 'smartNotes',
              name: 'AI Assistant',
              onClose: this.onClose,
            },
            contact: smartNoteSession.contact,
            openSideDrawer: smartNoteSession.status !== 'Disconnected',
          });
        } else {
          this._deps.sideDrawerUI.closeWidget('smartNotes');
        }
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
    const session = this._deps.smartNotes.session;
    if (session && session.status === 'Disconnected') {
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
