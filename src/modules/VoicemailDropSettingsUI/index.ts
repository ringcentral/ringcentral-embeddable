import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2 } from '@ringcentral-integration/core';

@Module({
  name: 'VoicemailDropSettingsUI',
  deps: [
    'VoicemailDrop',
    'RouterInteraction',
    'Locale',
  ],
})
export class VoicemailDropSettingsUI extends RcUIModuleV2 {
  constructor(deps) {
    super({
      deps,
    });
  }

  getUIProps() {
    const { voicemailDrop, locale } = this._deps;
    return {
      voicemailMessages: voicemailDrop.voicemailMessages || [],
      externalVoicemailDropMessages: voicemailDrop.externalVoicemailDropFiles || [],
      currentLocale: locale.currentLocale,
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
      onLoadExternalVoicemailDropMessages: () => {
        voicemailDrop.fetchExternalVoicemailDropFiles();
      },
    };
  }
}
