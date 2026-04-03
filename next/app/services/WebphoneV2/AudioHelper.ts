/* eslint-disable no-console */

type ManagedAudioElement = HTMLAudioElement & {
  playPromise?: Promise<void>;
  setSinkId?: (deviceId: string) => Promise<void>;
  sinkId?: string;
};

type AudioCollection = Record<string, ManagedAudioElement>;

type LoadAudioOptions = {
  incoming?: string;
  outgoing?: string;
};

type AudioHelperOptions = LoadAudioOptions & {
  enabled?: boolean;
  volume?: number;
};

// Compatibility layer for micro-phone, which still imports the removed
// `ringcentral-web-phone/lib/audioHelper` module from the 0.8 SDK layout.
export class AudioHelper {
  protected _audio: AudioCollection = {};
  protected _enabled = true;
  protected _incoming = '';
  protected _outgoing = '';
  volume?: number;

  constructor(options: AudioHelperOptions = {}) {
    const { enabled = true, incoming = '', outgoing = '', volume } = options;
    this._enabled = enabled;
    this._incoming = incoming;
    this._outgoing = outgoing;
    this.volume = volume;
  }

  loadAudio({ incoming, outgoing }: LoadAudioOptions = {}) {
    if (incoming !== undefined) {
      this._incoming = incoming;
    }
    if (outgoing !== undefined) {
      this._outgoing = outgoing;
    }
    return this;
  }

  setVolume(volume: number) {
    if (Number.isNaN(volume)) {
      return this;
    }
    this.volume = Math.min(1, Math.max(0, volume));
    Object.values(this._audio).forEach((audio) => {
      audio.volume = this.volume!;
    });
    return this;
  }

  setEnabled(enabled: boolean) {
    this._enabled = enabled;
    return this;
  }

  protected _playSound(url: string, val: boolean, volume: number) {
    if (!this._enabled || !url) {
      return this;
    }
    let audio = this._audio[url];
    if (!audio) {
      if (!val) {
        return this;
      }
      audio = new Audio() as ManagedAudioElement;
      this._audio[url] = audio;
      audio.loop = true;
    }
    if (val) {
      audio.src = url;
      audio.volume = volume;
      audio.currentTime = 0;
      audio.playPromise = audio.play().catch((error: unknown) => {
        console.error('playAudio error:', error);
      });
      return this;
    }
    if (audio.playPromise !== undefined) {
      audio.playPromise
        .then(() => {
          audio.pause();
        })
        .finally(() => {
          audio.src = '';
        });
    }
    return this;
  }

  playIncoming(val: boolean): AudioHelper {
    return this._playSound(this._incoming, val, this.volume ?? 0.5);
  }

  playOutgoing(val: boolean): AudioHelper {
    return this._playSound(this._outgoing, val, this.volume ?? 1);
  }

  get audio() {
    return this._audio;
  }

  get enabled() {
    return this._enabled;
  }
}

export class WebphoneAudioHelper extends AudioHelper {
  private _deviceId = 'default';

  override _playSound(url: string, val: boolean, volume: number) {
    if (!this.enabled || !url || this._deviceId === '') {
      return this;
    }
    let audio = this._audio[url];
    if (!audio) {
      if (val) {
        audio = new Audio() as ManagedAudioElement;
        this._audio[url] = audio;
        audio.src = url;
        audio.loop = true;
        audio.volume = volume;
        if (this._deviceId && typeof audio.setSinkId === 'function') {
          audio.setSinkId(this._deviceId).catch((error: unknown) => {
            console.error('setSinkId error:', error);
          });
        }
        audio.playPromise = audio.play().catch((error: unknown) => {
          console.error('playAudio error:', error);
        });
      }
    } else if (val) {
      audio.src = url;
      audio.currentTime = 0;
      if (
        typeof audio.setSinkId === 'function' &&
        audio.sinkId !== this._deviceId
      ) {
        audio.setSinkId(this._deviceId || '').catch((error: unknown) => {
          console.error('setSinkId error:', error);
        });
      }
      audio.playPromise = audio.play().catch((error: unknown) => {
        console.error('playAudio error:', error);
      });
    } else if (audio.playPromise !== undefined) {
      audio.playPromise
        .then(() => {
          audio.pause();
        })
        .finally(() => {
          audio.src = '';
        });
    }
    return this;
  }

  override playIncoming(val: boolean): AudioHelper {
    return this._playSound(this._incoming, val, this.volume ?? 0.5);
  }

  override playOutgoing(val: boolean): AudioHelper {
    return this._playSound(this._outgoing, val, this.volume ?? 1);
  }

  setDeviceId(val = 'default') {
    const deviceId = val === 'off' ? '' : val;
    this._deviceId = deviceId;
    if (Object.keys(this.audio).length === 0) {
      return;
    }
    Object.values(this.audio).forEach((audio) => {
      if (typeof audio.setSinkId !== 'function') {
        return;
      }
      if (audio.playPromise !== undefined) {
        audio.playPromise.then(() => {
          audio.setSinkId?.(deviceId).catch((error: unknown) => {
            console.error('setSinkId error:', error);
          });
        });
      }
    });
  }
}
