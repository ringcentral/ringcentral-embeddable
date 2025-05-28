import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2 } from '@ringcentral-integration/core';

@Module({
  name: 'VoicemailDropSettingsUI',
  deps: [
    'VoicemailDrop',
    'RouterInteraction',
  ],
})
export class VoicemailDropSettingsUI extends RcUIModuleV2 {
  constructor(deps) {
    super({
      deps,
    });
  }

  getUIProps() {
    const { voicemailDrop } = this._deps;
    return {
      voicemailMessages: voicemailDrop.voicemailMessages || [],
    };
  }

  getUIFunctions() {
    const { voicemailDrop, routerInteraction } = this._deps;
    return {
      onSave: (newVoicemailMessage) => {
        voicemailDrop.addVoicemailMessage(newVoicemailMessage);
      },
      onDelete: (voicemailMessage) => {
        voicemailDrop.deleteVoicemailMessage(voicemailMessage);
      },
      onBackButtonClick: () => {
        routerInteraction.goBack();
      },
    };
  }
}
