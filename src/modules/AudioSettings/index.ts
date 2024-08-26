import { find } from 'ramda';
import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  action,
  state,
  storage,
} from '@ringcentral-integration/core';
import { AudioSettings as AudioSettingsBase } from '@ringcentral-integration/commons/modules/AudioSettings';

@Module({
  name: 'AudioSettings',
  deps: [],
})
export class AudioSettings extends AudioSettingsBase {

  @storage
  @state
  ringtoneDeviceId = 'default'

  @action
  setRingtoneDeviceId(deviceId: string) {
    this.ringtoneDeviceId = deviceId;
  }

  @action
  override setUserMediaError() {
    super.setUserMediaError();
    this.ringtoneDeviceId = 'default';
  }

  @action
  override setAvailableDevices(devices) {
    super.setAvailableDevices(devices);
    const isRingtoneDeviceExist = find(
      (device) =>
        device.deviceId === this.ringtoneDeviceId &&
        device.kind === 'audiooutput',
      devices,
    );
    if (!isRingtoneDeviceExist) {
      // For Firefox, don't have default device id
      const hasDefaultDevice = find(
        (device) =>
          device.deviceId === 'default' && device.kind === 'audiooutput',
        devices,
      );
      const firstDevice = find(
        (device) => device.kind === 'audiooutput',
        devices,
      );
      if (!hasDefaultDevice && firstDevice) {
        this.ringtoneDeviceId = firstDevice.deviceId;
      } else {
        this.ringtoneDeviceId = 'default';
      }
    }
  }

  @state
  autoPlayEnabled = false;

  @action
  setAutoPlayEnabled(enabled) {
    this.autoPlayEnabled = enabled;
  }

  enableAutoPlay() {
    this.setAutoPlayEnabled(true);
  }

  override onInitOnce() {
    const onAutoplayButtonClick = () => {
      this.enableAutoPlay();
      window.removeEventListener('click', onAutoplayButtonClick);
    };
    window.addEventListener('click', onAutoplayButtonClick);
  }
}
