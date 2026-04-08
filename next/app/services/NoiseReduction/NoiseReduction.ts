import {
  action,
  injectable,
  RcModule,
  state,
  StoragePlugin,
  storage,
  delegate,
} from '@ringcentral-integration/next-core';
import { AppFeatures } from '@ringcentral-integration/micro-auth/src/app/services';
import { Toast } from '@ringcentral-integration/micro-core/src/app/services';

import { Denoiser } from './Denoiser';

function isSameOrigin(uri: string) {
  if (uri.indexOf('http') !== 0) {
    return true;
  }
  const { protocol, host } = window.location;
  const url = new URL(uri);
  return protocol === url.protocol && host === url.host;
}

@injectable({
  name: 'NoiseReduction',
})
export class NoiseReduction extends RcModule {
  protected _denoiserMap = new Map<string, Denoiser>();
  protected _krispSDK: any = null;
  protected _audioContext: AudioContext | null = null;
  protected _filterNode: any = null;
  protected _isSDKInitialized = false;

  constructor(
    protected _storage: StoragePlugin,
    protected _appFeatures: AppFeatures,
    protected _toast: Toast,
  ) {
    super();
    this._storage.enable(this);
    if (
      globalThis.document &&
      this.isFeatureEnabled &&
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
  private _setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  get isFeatureEnabled() {
    return Boolean(
      (this._appFeatures.config as Record<string, boolean>).NoiseReduction,
    );
  }

  private _showNotSupportAlert() {
    this._toast.warning({
      message: 'showNoiseReductionNotSupported',
      ttl: 0,
    });
  }

  @delegate('server')
  async setEnabled(enabled: boolean) {
    if (enabled && !this._isSupported()) {
      this._showNotSupportAlert();
      return;
    }
    this._setEnabled(enabled);
    if (enabled) {
      this._initKrisp().catch((error) => {
        console.error(error);
      });
      return;
    }
    this._disableKrisp();
  }

  private _isSupported() {
    return Boolean(
      globalThis.window &&
        (window as any).KrispSDK &&
        (window as any).KrispSDK.isSupported(),
    );
  }

  private async _initKrisp() {
    if (!globalThis.window || !this.isFeatureEnabled || !this.enabled) {
      return;
    }
    if (this._isSDKInitialized) {
      this._enableKrisp();
      return;
    }
    if (!this._isSupported()) {
      this._setEnabled(false);
      return;
    }
    const KrispSDK = (window as any).KrispSDK;
    this._krispSDK = new KrispSDK({
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
    await this._krispSDK.init();
    if (!this._audioContext) {
      this._audioContext = new AudioContext({
        sampleRate: 16000,
      });
      await this._audioContext.suspend();
    }
    let onFilterReady: (() => void) | null = null;
    const filterPromise = new Promise<void>((resolve) => {
      onFilterReady = resolve;
    });
    this._filterNode = await this._krispSDK.createNoiseFilter(
      this._audioContext,
      () => onFilterReady?.(),
    );
    await filterPromise;
    this._isSDKInitialized = true;
    this._enableKrisp();
  }

  private _enableKrisp() {
    this._filterNode?.enable();
  }

  private _disableKrisp() {
    this._denoiserMap.forEach((denoiser) => denoiser.disconnect());
    this._filterNode?.disable();
  }

  async activateAudioContext() {
    if (!this._audioContext) {
      return;
    }
    if (this._audioContext.state === 'suspended') {
      await this._audioContext.resume();
    }
    if (this._audioContext.state !== 'running') {
      this._filterNode?.disconnect?.();
      this._filterNode?.dispose?.();
      this._filterNode = null;
      if (this._audioContext.state !== 'closed') {
        await this._audioContext.close();
      }
      this._audioContext = null;
      throw new Error('AudioContext is not running');
    }
  }

  async denoiser(sessionId: string, stream: MediaStream) {
    if (
      !globalThis.window ||
      !this.enabled ||
      !this.isFeatureEnabled ||
      !this._isSDKInitialized
    ) {
      return stream;
    }
    if (!this._denoiserMap.has(sessionId)) {
      this._denoiserMap.set(
        sessionId,
        new Denoiser({
          audioContext: this._audioContext as AudioContext,
          filterNode: this._filterNode,
        }),
      );
    }
    try {
      await this.activateAudioContext();
      this._denoiserMap.get(sessionId)?.connect(stream);
    } catch (error) {
      console.error(error);
    }
    return stream;
  }

  reset(sessionId: string) {
    const denoiser = this._denoiserMap.get(sessionId);
    if (!denoiser) {
      return;
    }
    denoiser.disconnect();
    this._denoiserMap.delete(sessionId);
  }
}
