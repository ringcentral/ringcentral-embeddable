import {
  AppFeatures,
  Auth,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import {
  action,
  delegate,
  injectable,
  PortManager,
  RcModule,
  state,
  storage,
  StoragePlugin,
} from '@ringcentral-integration/next-core';

import { Denoiser } from './Denoiser';
import { isSameOrigin } from './NoiseReduction.helper';
import { t } from './i18n';
import type {
  KrispNoiseFilterNode,
  KrispSdk,
  KrispSdkConstructor,
} from './NoiseReduction.interface';

import type { AppFeatures as EmbeddableAppFeatures } from '../AppFeatures';

const KRISP_SDK_SCRIPT_ID = 'noise-reduction-krisp-sdk';
const KRISP_SDK_LOAD_TIMEOUT = 15000;

@injectable({
  name: 'NoiseReduction',
})
export class NoiseReduction extends RcModule {
  private readonly _denoiserMap = new Map<string, Denoiser>();
  private _krispSdk: KrispSdk | null = null;
  private _audioContext: AudioContext | null = null;
  private _filterNode: KrispNoiseFilterNode | null = null;
  private _isSdkInitialized = false;
  private _sdkLoadPromise: Promise<KrispSdkConstructor | null> | null = null;
  private _sdkInitializationPromise: Promise<boolean> | null = null;

  constructor(
    private readonly _storage: StoragePlugin,
    private readonly _auth: Auth,
    private readonly _appFeatures: AppFeatures,
    private readonly _toast: Toast,
    private readonly _portManager: PortManager,
  ) {
    super();
    this._storage.enable(this);
  }

  private get _embeddableAppFeatures(): EmbeddableAppFeatures {
    return this._appFeatures as EmbeddableAppFeatures;
  }

  @storage
  @state
  enabled = true;

  @action
  private _setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  get isFeatureEnabled(): boolean {
    return this._embeddableAppFeatures.showNoiseReductionSetting;
  }

  get showNoiseReductionSetting(): boolean {
    return this.isFeatureEnabled;
  }

  override _shouldInit(): boolean {
    return Boolean(
      super._shouldInit() && this._auth.loggedIn && this.isFeatureEnabled,
    );
  }

  override _shouldReset(): boolean {
    return Boolean(
      super._shouldReset() ||
        (this.ready && (!this._auth.loggedIn || !this.isFeatureEnabled)),
    );
  }

  override async onInit(): Promise<void> {
    if (!this._isRuntimeOwner() || !this.enabled) {
      return;
    }
    const initialized = await this._applyEnabledInMainClient(true);
    if (!initialized) {
      this._setEnabled(false);
    }
  }

  override async onReset(): Promise<void> {
    if (this._isRuntimeOwner()) {
      await this._applyEnabledInMainClient(false);
    }
  }

  private _isRuntimeOwner(): boolean {
    return !this._portManager.shared || this._portManager.isServer;
  }

  private _showNotSupportedAlert(): void {
    this._toast.warning({
      message: t('noiseReductionNotSupported'),
      ttl: 0,
    });
  }

  @delegate('server')
  async setEnabled(enabled: boolean): Promise<void> {
    const applied = await this._applyEnabledInMainClient(enabled);
    if (enabled && !applied) {
      this._setEnabled(false);
      this._showNotSupportedAlert();
      return;
    }
    this._setEnabled(enabled);
  }

  @delegate('mainClient')
  private async _applyEnabledInMainClient(enabled: boolean): Promise<boolean> {
    if (!enabled) {
      this._disableKrisp();
      return true;
    }
    return this._initializeKrisp();
  }

  private async _loadKrispSdk(): Promise<KrispSdkConstructor | null> {
    if (!globalThis.window || !globalThis.document) {
      return null;
    }
    const sdkBaseUrl = process.env.NOISE_REDUCTION_SDK_URL;
    if (!sdkBaseUrl || !isSameOrigin(sdkBaseUrl, window.location)) {
      return null;
    }
    if (window.KrispSDK) {
      return window.KrispSDK;
    }
    if (!this._sdkLoadPromise) {
      this._sdkLoadPromise = new Promise<KrispSdkConstructor | null>(
        (resolve) => {
          const existingScript = document.getElementById(
            KRISP_SDK_SCRIPT_ID,
          ) as HTMLScriptElement | null;
          const script = existingScript ?? document.createElement('script');
          const finishLoading = (sdk: KrispSdkConstructor | null): void => {
            window.clearTimeout(loadTimeout);
            if (!sdk) {
              script.remove();
            }
            resolve(sdk);
          };
          const resolveSdk = (): void => finishLoading(window.KrispSDK ?? null);
          const loadTimeout = window.setTimeout(
            () => finishLoading(null),
            KRISP_SDK_LOAD_TIMEOUT,
          );
          script.addEventListener('load', resolveSdk, { once: true });
          script.addEventListener('error', () => finishLoading(null), {
            once: true,
          });
          if (!existingScript) {
            script.id = KRISP_SDK_SCRIPT_ID;
            script.async = true;
            script.src = `${sdkBaseUrl}/krispsdk.es5.js`;
            document.head.appendChild(script);
          }
        },
      );
    }
    const sdkConstructor = await this._sdkLoadPromise;
    if (!sdkConstructor) {
      this._sdkLoadPromise = null;
    }
    return sdkConstructor;
  }

  private async _initializeKrisp(): Promise<boolean> {
    if (this._isSdkInitialized) {
      this._enableKrisp();
      return true;
    }
    if (!this._sdkInitializationPromise) {
      this._sdkInitializationPromise = this._createKrispResources();
    }
    try {
      return await this._sdkInitializationPromise;
    } finally {
      this._sdkInitializationPromise = null;
    }
  }

  private async _createKrispResources(): Promise<boolean> {
    const sdkBaseUrl = process.env.NOISE_REDUCTION_SDK_URL;
    if (!sdkBaseUrl) {
      return false;
    }
    const KrispSDK = await this._loadKrispSdk();
    if (!KrispSDK?.isSupported()) {
      return false;
    }
    this._krispSdk = new KrispSDK({
      params: {
        debugLogs: false,
        models: {
          model8: `${sdkBaseUrl}/models/model_8.kw`,
          model16: `${sdkBaseUrl}/models/model_16.kw`,
          model32: `${sdkBaseUrl}/models/model_32.kw`,
        },
        workerUrl: `${sdkBaseUrl}/worker.es5.js`,
        workletUrl: `${sdkBaseUrl}/worklet.es5.js`,
      },
    });
    try {
      await this._krispSdk.init();
      this._audioContext = new AudioContext({ sampleRate: 16000 });
      await this._audioContext.suspend();
      let resolveFilterReady: (() => void) | null = null;
      const filterReadyPromise = new Promise<void>((resolve) => {
        resolveFilterReady = resolve;
      });
      this._filterNode = await this._krispSdk.createNoiseFilter(
        this._audioContext,
        () => resolveFilterReady?.(),
      );
      await filterReadyPromise;
      this._isSdkInitialized = true;
      this._enableKrisp();
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize noise reduction', error);
      await this._disposeKrispResources();
      return false;
    }
  }

  private _enableKrisp(): void {
    this._filterNode?.enable();
  }

  private _disableKrisp(): void {
    this._denoiserMap.forEach((denoiser) => denoiser.disconnect());
    this._filterNode?.disable();
  }

  private async _disposeKrispResources(): Promise<void> {
    this._filterNode?.disconnect();
    this._filterNode?.dispose();
    this._filterNode = null;
    if (this._audioContext && this._audioContext.state !== 'closed') {
      await this._audioContext.close();
    }
    this._audioContext = null;
    this._krispSdk = null;
    this._isSdkInitialized = false;
  }

  async activateAudioContext(): Promise<void> {
    if (!this._audioContext) {
      throw new Error('Noise reduction audio context is not initialized');
    }
    if (this._audioContext.state === 'suspended') {
      await this._audioContext.resume();
    }
    if (this._audioContext.state === 'running') {
      return;
    }
    await this._disposeKrispResources();
    throw new Error('AudioContext is not running');
  }

  async denoiser(sessionId: string, stream: MediaStream): Promise<MediaStream> {
    if (!globalThis.window || !this.enabled || !this.isFeatureEnabled) {
      return stream;
    }
    try {
      const initialized = await this._initializeKrisp();
      if (!initialized || !this._audioContext || !this._filterNode) {
        return stream;
      }
      await this.activateAudioContext();
      let denoiser = this._denoiserMap.get(sessionId);
      if (!denoiser) {
        denoiser = new Denoiser({
          audioContext: this._audioContext,
          filterNode: this._filterNode,
        });
        this._denoiserMap.set(sessionId, denoiser);
      }
      return denoiser.connect(stream);
    } catch (error) {
      this.logger.error('Failed to apply noise reduction', error);
      return stream;
    }
  }

  reset(sessionId: string): void {
    const denoiser = this._denoiserMap.get(sessionId);
    if (!denoiser) {
      return;
    }
    denoiser.disconnect();
    this._denoiserMap.delete(sessionId);
  }
}
