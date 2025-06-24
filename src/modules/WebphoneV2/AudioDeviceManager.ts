import type { DeviceManager } from 'ringcentral-web-phone-beta-2/dist/esm/types';

export class AudioDeviceManager implements DeviceManager {
  public async getInputDeviceId(): Promise<string> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const defaultInputDevice = devices.find((device) =>
      device.kind === "audioinput"
    );
    return defaultInputDevice!.deviceId;
  }

  public async getOutputDeviceId(): Promise<string | undefined> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const defaultOutputDevice = devices.find((device) =>
      device.kind === "audiooutput"
    );
    return defaultOutputDevice?.deviceId;
  }
}