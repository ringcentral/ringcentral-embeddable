import type { DeviceManager } from 'ringcentral-web-phone/dist/esm/types';
import type { AudioSettings } from '@ringcentral-integration/commons/modules/AudioSettings';
import { Logger } from './logger';
export class AudioDeviceManager implements DeviceManager {
  private _audioSettings: AudioSettings;

  constructor(audioSettings: AudioSettings) {
    this._audioSettings = audioSettings;
  }

  public async getInputDeviceId(): Promise<string> {
    return this._audioSettings.inputDeviceId;
  }

  public async getOutputDeviceId(): Promise<string | undefined> {
    return this._audioSettings.outputDeviceId
  }
}

export class RingtoneHelper {
  private _audioUri: string;
  private _deviceId: string;
  private _audio: HTMLAudioElement;
  private _enabled: boolean;
  private _volume: number;
  private _playPromise: Promise<void>;
  private _logger: Logger;

  constructor({
    audioUri,
    logger,
  }: {
    audioUri: string;
    logger: Logger;
  }) {
    this._audioUri = audioUri;
    this._enabled = true;
    this._volume = 1;
    this._logger = logger;
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

  setEnabled(enabled: boolean) {
    this._enabled = enabled;
    if (this._audio) {
      this._audio.volume = enabled ? this._volume : 0;
    }
  }

  loadAudio(uri: string) {
    this._audioUri = uri;
  }

  setDeviceId(deviceId: string) {
    this._deviceId = deviceId;
    if (this._audio) {
      if (this._playPromise !== undefined) {
        this._playPromise.then(() => {
          this._audio.setSinkId(deviceId).catch((error: any) => {
            this._logger.error('setSinkId error:', error);
          });
        });
      } else {
        this._audio.setSinkId(deviceId).catch((error: any) => {
          this._logger.error('setSinkId error:', error);
        });
      }
    }
  }

  play() {
    if (!this._enabled || !this._audioUri) {
      return;
    }
    if (!this._audio) {
      this._audio = new Audio();
      this._audio.loop = true;
    }
    this._audio.src = this._audioUri;
    this._audio.volume = this._volume;
    if (this._deviceId && typeof this._audio.setSinkId === 'function') {
      this._audio.setSinkId(this._deviceId).catch((error: any) => {
        this._logger.error('setSinkId error:', error);
      });
    }
    this._audio.currentTime = 0;
    this._playPromise = this._audio.play();
    this._playPromise.catch((error: any) => {
      this._logger.error('playAudio error:', error);
    });
  }

  stop() {
    if (this._playPromise !== undefined) {
      this._playPromise.then(() => {
        this._audio.pause();
      }).finally(() => {
        this._audio.src = ''; // release audio resource
      });
    }
  }
}