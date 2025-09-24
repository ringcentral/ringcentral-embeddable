import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  AudioSettingsUI as BaseAudioSettingsUI,
} from '@ringcentral-integration/widgets/modules/AudioSettingsUI';

@Module({
  name: 'AudioSettingsUI',
  deps: [
    'NoiseReduction',
    'AppFeatures',
    'Webphone',
  ]
})
export class AudioSettingsUI extends BaseAudioSettingsUI {
  override getUIProps(props) {
    const baseProps = super.getUIProps(props);
    const {
      appFeatures,
      noiseReduction,
      webphone,
      audioSettings,
    } = this._deps;
  
    return {
      ...baseProps,
      noiseReductionEnabled: noiseReduction.enabled,
      showNoiseReductionSetting: appFeatures.showNoiseReductionSetting,
      disableNoiseReductionSetting: webphone.sessions.length > 0,
      ringtoneDeviceId: audioSettings.ringtoneDeviceId,
      showRingtoneAudioSetting: appFeatures.ringtonePermission,
      inputDeviceId: audioSettings.data.inputDeviceId,
    };
  }

  override getUIFunctions(props) {
    const baseFunctions = super.getUIFunctions(props);
    const {
      noiseReduction,
      audioSettings,
      routerInteraction,
    } = this._deps;
    return {
      ...baseFunctions,
      onNoiseReductionChange: () => {
        noiseReduction.setEnabled(!noiseReduction.enabled);
      },
      onRingtoneDeviceIdChange: (deviceId) => {
        audioSettings.setRingtoneDeviceId(deviceId);
      },
      gotoRingtoneSettings: () => {
        routerInteraction.push('/settings/ringtone');
      },
    };
  }
}
