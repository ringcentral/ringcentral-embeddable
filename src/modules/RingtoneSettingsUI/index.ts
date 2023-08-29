
import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2, track } from '@ringcentral-integration/core';

@Module({
  name: 'RingtoneSettingsUI',
  deps: [
    'Locale',
    'RouterInteraction',
    {
      dep: 'Webphone',
      optional: true,
    }
  ],
})
export class RingtoneSettingsUI extends RcUIModuleV2 {
  constructor(deps) {
    super({
      deps,
    });
  }

  getUIProps() {
    const {
      webphone,
      locale,
    } = this._deps;
    if (!webphone) {
      return {};
    }
    return {
      currentLocale: locale.currentLocale,
      incomingAudioFile: webphone.incomingAudioFile,
      incomingAudio: webphone.incomingAudio,
      defaultIncomingAudioFile: webphone.defaultIncomingAudioFile,
      defaultIncomingAudio: webphone.defaultIncomingAudio,
    };
  }

  getUIFunctions() {
    const {
      webphone,
      routerInteraction,
    } = this._deps;
    return {
      onSave: ({
        incomingAudio,
        incomingAudioFile,
      }) => {
        if (webphone) {
          this._onSave({
            incomingAudio,
            incomingAudioFile,
          });
        }
      },
      onBackButtonClick: () => routerInteraction.goBack(),
    };
  }

  @track(() => ['Save Ringtone'])
  _onSave({
    incomingAudio,
    incomingAudioFile,
  }) {
    this._deps.webphone.setRingtone({
      incomingAudio,
      incomingAudioFile,
      outgoingAudio:  this._deps.webphone.defaultOutgoingAudio,
      outgoingAudioFile:  this._deps.webphone.defaultOutgoingAudioFile,
    });
  }
}
