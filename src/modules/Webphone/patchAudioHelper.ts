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
      audio.playPromise = audio.play();
    }
  } else {
    if (val) {
      audio.currentTime = 0;
      audio.src = url;
      audio.playPromise = this._audio[url].play();
    } else {
      if (audio.playPromise !== undefined) {
        audio.src = '';
        audio.playPromise.then(function() {
          audio.pause();
        });
      }
    }
  }
  return this;
}

export function patchAudioHelper(audioHelper: PatchedAudioHelper) {
  if (audioHelper._originalPlaySound) {
    return;
  }
  audioHelper._originalPlaySound = audioHelper._playSound;
  audioHelper._playSound = playSound.bind(audioHelper);
}
