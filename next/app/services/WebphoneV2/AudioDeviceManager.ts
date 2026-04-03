import type { DeviceManager } from 'ringcentral-web-phone/types';

import type { AudioSettings } from '@ringcentral-integration/micro-phone/src/app/services/AudioSettings';

export class AudioDeviceManager implements DeviceManager {
  constructor(private _audioSettings: AudioSettings) {}

  async getInputDeviceId(): Promise<string> {
    return this._audioSettings.inputDeviceId;
  }

  async getOutputDeviceId(): Promise<string | undefined> {
    if (this._audioSettings.availableOutputDevices.length === 0) {
      return undefined;
    }
    return this._audioSettings.outputDeviceId;
  }
}

export class RingtoneHelper {
  private _audio?: HTMLAudioElement;
  private _audioUri = '';
  private _deviceId = '';
  private _playPromise?: Promise<void>;
  private _volume = 1;

  constructor(audioUri: string) {
    this._audioUri = audioUri;
  }

  setVolume(volume: number) {
    if (volume < 0 || volume > 1) {
      return;
    }
    this._volume = volume;
    if (this._audio) {
      this._audio.volume = volume;
    }
  }

  loadAudio(uri: string) {
    this._audioUri = uri;
  }

  setDeviceId(deviceId: string) {
    this._deviceId = deviceId;
    if (!this._audio || typeof this._audio.setSinkId !== 'function') {
      return;
    }
    const changeSink = () =>
      this._audio!.setSinkId(deviceId).catch((error: unknown) => {
        console.error('setSinkId error:', error);
      });
    if (this._playPromise) {
      this._playPromise.then(changeSink);
      return;
    }
    changeSink();
  }

  play() {
    if (!this._audioUri) {
      return;
    }
    if (!this._audio) {
      this._audio = new Audio();
      this._audio.loop = true;
    }
    this._audio.src = this._audioUri;
    this._audio.volume = this._volume;
    if (this._deviceId && typeof this._audio.setSinkId === 'function') {
      this._audio.setSinkId(this._deviceId).catch((error: unknown) => {
        console.error('setSinkId error:', error);
      });
    }
    this._audio.currentTime = 0;
    this._playPromise = this._audio.play();
    this._playPromise.catch((error: unknown) => {
      console.error('playAudio error:', error);
    });
  }

  stop() {
    if (!this._playPromise || !this._audio) {
      return;
    }
    this._playPromise
      .then(() => {
        this._audio?.pause();
      })
      .finally(() => {
        if (this._audio) {
          this._audio.src = '';
        }
      });
  }
}
