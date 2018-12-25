import AudioSettings from 'ringcentral-integration/modules/AudioSettings';
import { Module } from 'ringcentral-integration/lib/di';

@Module({
  name: 'NewAudioSettings',
  deps: []
})
export default class NewAudioSettings extends AudioSettings {
  get userMedia() {
    const isFirefox = navigator.userAgent.indexOf('Firefox') > -1;
    if (isFirefox) {
      return true;
    }

    return !!(this.inputDevice);
  }
}
