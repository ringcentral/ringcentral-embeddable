import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  action,
  RcModuleV2,
  state,
  storage,
} from '@ringcentral-integration/core';

@Module({
  name: 'NoiseReduction',
  deps: [
    'Auth',
    'Storage',
    'AppFeatures',
  ],
})
export class NoiseReduction extends RcModuleV2 {
  protected _originalTrackMap: Map<string, MediaStreamTrack[]>;

  constructor(deps) {
    super({
      deps,
      storageKey: 'noiseReduction',
      enableCache: true,
    });
    this._originalTrackMap = new Map();
    if (deps.appFeatures.showNoiseReductionSetting && process.env.NOISE_REDUCTION_SDK_URL) {
      const script = document.createElement('script');
      script.src = process.env.NOISE_REDUCTION_SDK_URL;
      script.async = true;
      document.body.appendChild(script);
    }
  }

  @storage
  @state
  enabled = false;

  @action
  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled) {
      this._initKrisp();
    }
  }

  async _initKrisp() {
    if (
      window.Krisp &&
      window.Krisp.isSupported &&
      window.Krisp.isReady() !== 'active'
    ) {
      await window.Krisp.init();
    }
  }

  override _shouldInit() {
    return !!(super._shouldInit() && this._deps.auth.loggedIn);
  }

  override async onInit() {
    if (this.enabled) {
      await this._initKrisp();
    }
  }

  denoiser(sessionId, stream: MediaStream) {
    if (
      !this.enabled ||
      !window.Krisp ||
      !window.Krisp.isSupported ||
      window.Krisp.isReady() !== 'active'
    ) {
      return stream;
    }
    const cleanStream = window.Krisp.getStream(stream);
    const originTracks = stream.getTracks();
    originTracks.forEach((track) => {
      stream.removeTrack(track);
    });
    stream.addTrack(cleanStream.getAudioTracks()[0]);
    this._originalTrackMap.set(sessionId, originTracks);
    window.Krisp.toggle(true);
  }

  clean(sessionId) {
    const originTracks = this._originalTrackMap.get(sessionId);
    if (!originTracks) {
      return;
    }
    originTracks.forEach((track) => {
      track.stop();
    });
    this._originalTrackMap.delete(sessionId);
    if (this._originalTrackMap.size === 0) {
      window.Krisp.toggle(false);
    }
  }

  reset() {
    if (this._originalTrackMap.size === 0) {
      return;
    }
    this._originalTrackMap.forEach((tracks) => {
      tracks.forEach((track) => {
        track.stop();
      });
    });
    this._originalTrackMap.clear();
    window.Krisp.toggle(false);
  }
}
