import type { AudioHelper } from 'ringcentral-web-phone/lib/audioHelper';

interface AudioElementWithPlayPromise extends HTMLAudioElement {
  playPromise?: Promise<void>;
}

// @ts-ignore
interface PatchedAudioHelper extends AudioHelper {
  _audio: Record<string, AudioElementWithPlayPromise>;
  _enabled: boolean;
  _playSound(url: string, val: boolean, volume: number): PatchedAudioHelper;
  _originalPlaySound(url: string, val: boolean, volume: number): PatchedAudioHelper;
  _deviceId?: string;
  setDeviceId(deviceId?: string): void;
  _incoming: string;
  _outgoing: string;
  playIncoming(val: boolean): PatchedAudioHelper;
  playOutgoing(val: boolean): PatchedAudioHelper;
}

function playSound(this: PatchedAudioHelper, url: string, val: boolean, volume: number): PatchedAudioHelper {
  if (!this._enabled || !url) return this;

  let audio = this._audio[url];
  if (!audio) {
    if (val) {
      audio = new Audio();
      this._audio[url] = audio
      audio.src = url;
      audio.loop = true;
      audio.volume = volume;
      if (this._deviceId && typeof audio.setSinkId === 'function') {
        audio.setSinkId(this._deviceId).catch((error: any) => {
          console.error('setSinkId error:', error);
        });
      }
      audio.playPromise = audio.play().catch((error: any) => {
        console.error('playAudio error:', error);
      });
    }
  } else {
    if (val) {
      audio.currentTime = 0;
      audio.src = url;
      if (typeof audio.setSinkId === 'function' && audio.sinkId !== this._deviceId) {
        audio.setSinkId(this._deviceId || '').catch((error: any) => {
          console.error('setSinkId error:', error);
        });
      }
      audio.playPromise = audio.play().catch((error: any) => {
        console.error('playAudio error:', error);
      });
    } else {
      if (audio.playPromise !== undefined) {
        audio.playPromise.then(function() {
          audio.pause();
        }).finally(() => {
          audio.src = ''; // release audio resource
        });
      }
    }
  }
  return this;
}

function playIncoming(this: PatchedAudioHelper, val: boolean) {
  return this._playSound(this._incoming, val, this.volume ?? 0.5);
}

function playOutgoing(this: PatchedAudioHelper, val: boolean) {
  return this._playSound(this._outgoing, val, this.volume ?? 1);
}

function setDeviceId(this: PatchedAudioHelper, deviceId?: string) {
  this._deviceId = deviceId || '';
  if (Object.keys(this._audio).length === 0) {
    return;
  }
  for (const url in this._audio) {
    const audio = this._audio[url];
    if (typeof audio.setSinkId !== 'function') {
      continue;
    }
    if (audio.playPromise !== undefined) {
      audio.playPromise.then(function() {
        audio.setSinkId(deviceId || '').catch((error: any) => {
          console.error('setSinkId error:', error);
        });
      });
    }
  }
}

export function patchAudioHelper(audioHelper: PatchedAudioHelper) {
  if (audioHelper._originalPlaySound) {
    return;
  }
  audioHelper._deviceId = '';
  audioHelper._originalPlaySound = audioHelper._playSound;
  audioHelper._playSound = playSound.bind(audioHelper);
  audioHelper.setDeviceId = setDeviceId.bind(audioHelper);
  audioHelper.playIncoming = playIncoming.bind(audioHelper);
  audioHelper.playOutgoing = playOutgoing.bind(audioHelper);
}
