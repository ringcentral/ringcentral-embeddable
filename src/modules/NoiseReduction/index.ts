import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  action,
  RcModuleV2,
  state,
  storage,
} from '@ringcentral-integration/core';

import { Denoiser } from './Denoiser';

function isSameOrigin(uri) {
  if (uri.indexOf('http') !== 0) {
    return true;
  }
  const { protocol, host } = window.location;
  const url = new URL(uri);
  return protocol === url.protocol && host === url.host;
}

@Module({
  name: 'NoiseReduction',
  deps: [
    'Auth',
    'Storage',
    'AppFeatures',
    'Alert',
  ],
})
export class NoiseReduction extends RcModuleV2 {
  protected _denoiserMap: Map<string, Denoiser> = new Map();
  protected _krispSDK: any = null;
  protected _audioContext: AudioContext | null = null;
  protected _filterNode: any = null;
  protected _isSDKInitialized: boolean;

  constructor(deps) {
    super({
      deps,
      storageKey: 'noiseReduction',
      enableCache: true,
    });
    this._isSDKInitialized = false;
    if (
      deps.appFeatures.showNoiseReductionSetting &&
      process.env.NOISE_REDUCTION_SDK_URL &&
      isSameOrigin(process.env.NOISE_REDUCTION_SDK_URL)
    ) {
      const script = document.createElement('script');
      script.src = `${process.env.NOISE_REDUCTION_SDK_URL}/krispsdk.es5.js`;
      document.body.appendChild(script);
    }
  }

  @storage
  @state
  enabled = true;

  @action
  _setEnabled(enabled) {
    this.enabled = enabled;
  }

  setEnabled(enabled) {
    if (enabled && (!window.KrispSDK || !window.KrispSDK.isSupported())) {
      this._showNotSupportAlert();
      return;
    }
    this._setEnabled(enabled);
    if (enabled) {
      this._initKrisp();
    } else {
      this._disableKrisp();
    }
  }

  _showNotSupportAlert() {
    this._deps.alert.warning({
      message: 'showNoiseReductionNotSupported',
      ttl: 0,
    });
  }

  async _initKrisp() {
    if (
      window.KrispSDK &&
      window.KrispSDK.isSupported() &&
      !this._isSDKInitialized
    ) {
      this._krispSDK = new window.KrispSDK({
        params: {
          debugLogs: false,
          models: {
            model8: `${process.env.NOISE_REDUCTION_SDK_URL}/models/model_8.kw`,
            model16: `${process.env.NOISE_REDUCTION_SDK_URL}/models/model_16.kw`,
            model32: `${process.env.NOISE_REDUCTION_SDK_URL}/models/model_32.kw`,
          },
          workerUrl: `${process.env.NOISE_REDUCTION_SDK_URL}/worker.es5.js`,
          workletUrl: `${process.env.NOISE_REDUCTION_SDK_URL}/worklet.es5.js`,
        },
      });
      try {
        await this._krispSDK.init();
        if (!this._audioContext) {
          this._audioContext = new AudioContext({
            sampleRate: 16000,
          });
          this._audioContext.suspend();
        }
        let onFilterReady: () => void;
        const filterPromise = new Promise<void>((resolve) => {
          onFilterReady = resolve;
        });
        this._filterNode = await this._krispSDK.createNoiseFilter(
          this._audioContext,
          () => {
            onFilterReady();
          }
        );
        await filterPromise;
        this._isSDKInitialized = true;
      } catch (e) {
        this._audioContext.close();
        this._audioContext = null;
        throw e;
      }
    }
    this._enableKrisp();
  }

  _enableKrisp() {
    this._filterNode?.enable();
  }

  _disableKrisp() {
    this._denoiserMap.forEach((denoiser) => {
      denoiser.disconnect();
    });
    this._filterNode?.disable();
  }

  override _shouldInit() {
    return !!(super._shouldInit() && this._deps.auth.loggedIn && this._deps.appFeatures.showNoiseReductionSetting);
  }

  override async onInit() {
    if (this.enabled) {
      if (!window.KrispSDK || !window.KrispSDK.isSupported()) {
        this._setEnabled(false);
      } else {
        await this._initKrisp();
      }
    }
  }

  async activateAudioContext() {
    if (this._audioContext?.state === 'suspended') {
      await this._audioContext.resume();
    }
    if (this._audioContext.state !== 'running') {
      this._filterNode.disconnect();
      this._filterNode.dispose();
      this._filterNode = null;
      if (this._audioContext.state !== 'closed') {
        this._audioContext.close();
      }
      this._audioContext = null;
      throw new Error('AudioContext is not running');
    }
  }

  async denoiser(sessionId, stream: MediaStream) {
    if (
      !this.enabled ||
      !this._isSDKInitialized
    ) {
      return stream;
    }
    if (!this._denoiserMap.has(sessionId)) {
      this._denoiserMap.set(
        sessionId,
        new Denoiser({
          audioContext: this._audioContext,
          filterNode: this._filterNode,
        })
      );
    }
    
    try {
      this.activateAudioContext();
      const denoiser = this._denoiserMap.get(sessionId);
      denoiser.connect(stream);
    } catch (e) {
      console.error(e);
      return stream;
    }
  }

  reset(sessionId) {
    const denoiser = this._denoiserMap.get(sessionId);
    if (denoiser) {
      denoiser.disconnect();
      this._denoiserMap.delete(sessionId);
    }
  }
}
