import { find, filter } from 'ramda';
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
  autoplayEnabled = false;

  @action
  setAutoPlayEnabled(enabled) {
    this.autoplayEnabled = enabled;
  }

  enableAutoPlay() {
    this.setAutoPlayEnabled(true);
  }

  get inputDeviceId() {
    const saved = this.data.inputDeviceId;
    if (saved !== 'default') {
      return saved;
    }
    const availableInputDevices = this.availableInputDevices;
    if (availableInputDevices.length === 0) {
      return saved;
    }
    const defaultDevice = find(
      (device) => device.deviceId === 'default',
      availableInputDevices,
    );
    if (!defaultDevice) {
      return saved;
    }
    let defaultGroupId = defaultDevice.groupId;
    if (!defaultGroupId) {
      return saved;
    }
    const otherGroupDevices = filter(
      (device) => (
        device.groupId === defaultGroupId &&
        device.deviceId !== 'default'
      ),
      availableInputDevices,
    );
    if (otherGroupDevices.length === 0) {
      return saved;
    }
    if (otherGroupDevices.length === 1) {
      return otherGroupDevices[0].deviceId;
    }
    const defaultDeviceLabel = defaultDevice.label;
    if (!defaultDeviceLabel) {
      return saved;
    }
    const reactDevice = otherGroupDevices.find((device) =>
      defaultDeviceLabel.includes(device.label)
    );
    if (!reactDevice) {
      return saved;
    }
    return reactDevice.deviceId;
  }

  get audioConstraints() {
    // just in case the inputDeviceId is somehow empty, we can return true to let browser use anything
    return this.inputDeviceId
      ? {
          deviceId: {
            exact: this.inputDeviceId,
          },
        }
      : true;
  }
}
