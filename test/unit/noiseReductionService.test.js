import { NoiseReduction } from '../../src/app/services/NoiseReduction/NoiseReduction';

jest.mock('../../src/app/services/NoiseReduction/i18n', () => ({
  t: (key) =>
    key === 'noiseReductionNotSupported'
      ? "Noise reduction isn't available in your current environment."
      : key,
}));

function createFilterNode() {
  return {
    isReady: true,
    connect: jest.fn(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    enable: jest.fn(),
    disable: jest.fn(),
  };
}

function createAudioContext(filterNode) {
  const cleanTrack = { stop: jest.fn() };
  const context = {
    state: 'running',
    suspend: jest.fn(async () => {
      context.state = 'suspended';
    }),
    resume: jest.fn(async () => {
      context.state = 'running';
    }),
    close: jest.fn(async () => {
      context.state = 'closed';
    }),
    createMediaStreamSource: jest.fn((stream) => ({
      mediaStream: stream,
      connect: jest.fn((node) => node),
      disconnect: jest.fn(),
    })),
    createMediaStreamDestination: jest.fn(() => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
      stream: {
        getAudioTracks: jest.fn(() => [cleanTrack]),
        getTracks: jest.fn(() => [cleanTrack]),
      },
    })),
  };
  context.filterNode = filterNode;
  return context;
}

function createKrispConstructor({ supported = true, failInit = false } = {}) {
  const filterNode = createFilterNode();
  const KrispSdk = jest.fn(function KrispSdk(options) {
    this.options = options;
    this.init = jest.fn(async () => {
      if (failInit) {
        throw new Error('init failed');
      }
    });
    this.createNoiseFilter = jest.fn(async (_context, onReady) => {
      onReady();
      return filterNode;
    });
  });
  KrispSdk.isSupported = jest.fn(() => supported);
  KrispSdk.filterNode = filterNode;
  return KrispSdk;
}

function createDependencies(overrides = {}) {
  return {
    storage: { enable: jest.fn() },
    auth: { loggedIn: true },
    appFeatures: { showNoiseReductionSetting: true },
    toast: { warning: jest.fn() },
    portManager: { shared: false, isServer: true },
    ...overrides,
  };
}

function createNoiseReduction(overrides = {}) {
  const dependencies = createDependencies(overrides);
  const service = new NoiseReduction(
    dependencies.storage,
    dependencies.auth,
    dependencies.appFeatures,
    dependencies.toast,
    dependencies.portManager,
  );
  service.logger = { error: jest.fn() };
  return { dependencies, service };
}

function createStream(id = 'stream') {
  const sourceTrack = { stop: jest.fn() };
  return {
    id,
    sourceTrack,
    getAudioTracks: jest.fn(() => [sourceTrack]),
    removeTrack: jest.fn(),
    addTrack: jest.fn(),
  };
}

describe('NoiseReduction service', () => {
  let originalSdkUrl;
  let audioContext;

  beforeEach(() => {
    originalSdkUrl = process.env.NOISE_REDUCTION_SDK_URL;
    process.env.NOISE_REDUCTION_SDK_URL = 'https://app.example.com/noise';
    delete window.KrispSDK;
    const filterNode = createFilterNode();
    audioContext = createAudioContext(filterNode);
    global.AudioContext = jest.fn(() => audioContext);
    window.AudioContext = global.AudioContext;
  });

  afterEach(() => {
    if (typeof originalSdkUrl === 'undefined') {
      delete process.env.NOISE_REDUCTION_SDK_URL;
    } else {
      process.env.NOISE_REDUCTION_SDK_URL = originalSdkUrl;
    }
    document.getElementById('noise-reduction-krisp-sdk')?.remove();
    delete window.KrispSDK;
    delete global.AudioContext;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('enables storage and applies lifecycle guards', async () => {
    const { dependencies, service } = createNoiseReduction();
    const applyEnabled = jest
      .spyOn(service, '_applyEnabledInMainClient')
      .mockResolvedValue(true);

    expect(dependencies.storage.enable).toHaveBeenCalledWith(service);
    expect(service.isFeatureEnabled).toBe(true);
    expect(service.showNoiseReductionSetting).toBe(true);
    expect(service._shouldInit()).toBe(true);
    expect(service._shouldReset()).toBe(false);

    await service.onInit();
    expect(applyEnabled).toHaveBeenCalledWith(true);
    await service.onReset();
    expect(applyEnabled).toHaveBeenCalledWith(false);

    dependencies.auth.loggedIn = false;
    expect(service._shouldInit()).toBe(false);
    service.status = 'ready';
    expect(service._shouldReset()).toBe(true);
    dependencies.auth.loggedIn = true;
    dependencies.appFeatures.showNoiseReductionSetting = false;
    expect(service.showNoiseReductionSetting).toBe(false);
    expect(service._shouldReset()).toBe(true);
  });

  test('skips lifecycle work outside the runtime owner or while disabled', async () => {
    const { service } = createNoiseReduction({
      portManager: { shared: true, isServer: false },
    });
    const applyEnabled = jest.spyOn(service, '_applyEnabledInMainClient');

    await service.onInit();
    await service.onReset();
    expect(applyEnabled).not.toHaveBeenCalled();

    const disabled = createNoiseReduction().service;
    disabled.enabled = false;
    const disabledApply = jest.spyOn(disabled, '_applyEnabledInMainClient');
    await disabled.onInit();
    expect(disabledApply).not.toHaveBeenCalled();
  });

  test('turns off persisted state when initialization is unsupported', async () => {
    const { service } = createNoiseReduction();
    jest.spyOn(service, '_applyEnabledInMainClient').mockResolvedValue(false);

    await service.onInit();

    expect(service.enabled).toBe(false);
  });

  test('sets enabled state and warns when activation fails', async () => {
    const { dependencies, service } = createNoiseReduction();
    const applyEnabled = jest
      .spyOn(service, '_applyEnabledInMainClient')
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    await service.setEnabled(true);
    expect(service.enabled).toBe(false);
    expect(dependencies.toast.warning).toHaveBeenCalledWith({
      message: "Noise reduction isn't available in your current environment.",
      ttl: 0,
    });

    await service.setEnabled(false);
    expect(service.enabled).toBe(false);
    // Disabling no longer goes through the main-tab hop; see the broadcast test.
    expect(applyEnabled).toHaveBeenLastCalledWith(true);
  });

  test('broadcasts disable to every port, not just the main tab', async () => {
    // The denoiser is attached wherever the call media lives, which may be a
    // tab other than the main one; a mainClient-only disable would leave the
    // filter on a live call.
    const { service } = createNoiseReduction();
    const applyEnabled = jest.spyOn(service, '_applyEnabledInMainClient');
    const disableOnPort = jest
      .spyOn(service, 'disableOnPort')
      .mockImplementation(() => undefined);

    await service.setEnabled(false);

    expect(disableOnPort).toHaveBeenCalledTimes(1);
    expect(applyEnabled).not.toHaveBeenCalled();
    expect(service.enabled).toBe(false);
  });

  test('detaches every active denoiser when disabling', async () => {
    const { service } = createNoiseReduction();
    const denoiser = { disconnect: jest.fn() };
    const filterNode = createFilterNode();
    service._denoiserMap.set('session', denoiser);
    service._filterNode = filterNode;

    service.disableOnPort();

    expect(denoiser.disconnect).toHaveBeenCalled();
    expect(filterNode.disable).toHaveBeenCalled();
  });

  test('disables active resources without reinitializing', async () => {
    const { service } = createNoiseReduction();
    const denoiser = { disconnect: jest.fn() };
    const filterNode = createFilterNode();
    service._denoiserMap.set('session', denoiser);
    service._filterNode = filterNode;

    await expect(service._applyEnabledInMainClient(false)).resolves.toBe(true);

    expect(denoiser.disconnect).toHaveBeenCalled();
    expect(filterNode.disable).toHaveBeenCalled();
  });

  test('rejects SDK loading without a browser-safe same-origin URL', async () => {
    const { service } = createNoiseReduction();
    delete process.env.NOISE_REDUCTION_SDK_URL;
    await expect(service._loadKrispSdk()).resolves.toBeNull();

    process.env.NOISE_REDUCTION_SDK_URL = 'https://cdn.example.com/noise';
    await expect(service._loadKrispSdk()).resolves.toBeNull();
  });

  test('uses an SDK constructor already present on window', async () => {
    const { service } = createNoiseReduction();
    const KrispSdk = createKrispConstructor();
    window.KrispSDK = KrispSdk;

    await expect(service._loadKrispSdk()).resolves.toBe(KrispSdk);
    expect(document.getElementById('noise-reduction-krisp-sdk')).toBeNull();
  });

  test('loads the SDK script once and resolves its constructor', async () => {
    const { service } = createNoiseReduction();
    const appendChild = jest.spyOn(document.head, 'appendChild');
    const firstPromise = service._loadKrispSdk();
    const secondPromise = service._loadKrispSdk();
    const script = document.getElementById('noise-reduction-krisp-sdk');
    const KrispSdk = createKrispConstructor();

    expect(script).toEqual(expect.any(HTMLScriptElement));
    expect(script.async).toBe(true);
    expect(script.src).toBe('https://app.example.com/noise/krispsdk.es5.js');
    expect(appendChild).toHaveBeenCalledTimes(1);
    window.KrispSDK = KrispSdk;
    script.dispatchEvent(new Event('load'));

    await expect(firstPromise).resolves.toBe(KrispSdk);
    await expect(secondPromise).resolves.toBe(KrispSdk);
  });

  test('handles an existing script, load errors, and retries', async () => {
    const existingScript = document.createElement('script');
    existingScript.id = 'noise-reduction-krisp-sdk';
    document.head.appendChild(existingScript);
    const { service } = createNoiseReduction();

    const failedLoad = service._loadKrispSdk();
    existingScript.dispatchEvent(new Event('error'));
    await expect(failedLoad).resolves.toBeNull();
    expect(existingScript.isConnected).toBe(false);
    expect(service._sdkLoadPromise).toBeNull();

    const retry = service._loadKrispSdk();
    const retryScript = document.getElementById('noise-reduction-krisp-sdk');
    const KrispSdk = createKrispConstructor();
    window.KrispSDK = KrispSdk;
    retryScript.dispatchEvent(new Event('load'));
    await expect(retry).resolves.toBe(KrispSdk);
  });

  test('times out a stalled SDK script load', async () => {
    jest.useFakeTimers();
    const { service } = createNoiseReduction();
    const promise = service._loadKrispSdk();
    const script = document.getElementById('noise-reduction-krisp-sdk');

    jest.advanceTimersByTime(15000);

    await expect(promise).resolves.toBeNull();
    expect(script.isConnected).toBe(false);
    expect(service._sdkLoadPromise).toBeNull();
  });

  test('returns unsupported when SDK resources are unavailable', async () => {
    const { service } = createNoiseReduction();
    delete process.env.NOISE_REDUCTION_SDK_URL;
    await expect(service._createKrispResources()).resolves.toBe(false);

    process.env.NOISE_REDUCTION_SDK_URL = 'https://app.example.com/noise';
    const unsupportedSdk = createKrispConstructor({ supported: false });
    jest.spyOn(service, '_loadKrispSdk').mockResolvedValue(unsupportedSdk);
    await expect(service._createKrispResources()).resolves.toBe(false);
  });

  test('creates, suspends, and enables Krisp resources', async () => {
    const { service } = createNoiseReduction();
    const KrispSdk = createKrispConstructor();
    jest.spyOn(service, '_loadKrispSdk').mockResolvedValue(KrispSdk);

    await expect(service._createKrispResources()).resolves.toBe(true);

    expect(KrispSdk).toHaveBeenCalledWith({
      params: {
        debugLogs: false,
        models: {
          model8: 'https://app.example.com/noise/models/model_8.kw',
          model16: 'https://app.example.com/noise/models/model_16.kw',
          model32: 'https://app.example.com/noise/models/model_32.kw',
        },
        workerUrl: 'https://app.example.com/noise/worker.es5.js',
        workletUrl: 'https://app.example.com/noise/worklet.es5.js',
      },
    });
    expect(audioContext.suspend).toHaveBeenCalled();
    expect(KrispSdk.filterNode.enable).toHaveBeenCalled();
    expect(service._isSdkInitialized).toBe(true);
  });

  test('disposes partially created resources after an initialization failure', async () => {
    const { service } = createNoiseReduction();
    const KrispSdk = createKrispConstructor({ failInit: true });
    jest.spyOn(service, '_loadKrispSdk').mockResolvedValue(KrispSdk);

    await expect(service._createKrispResources()).resolves.toBe(false);

    expect(service.logger.error).toHaveBeenCalledWith(
      'Failed to initialize noise reduction',
      expect.any(Error),
    );
    expect(audioContext.close).not.toHaveBeenCalled();
    expect(service._krispSdk).toBeNull();
    expect(service._isSdkInitialized).toBe(false);
  });

  test('deduplicates initialization and re-enables initialized resources', async () => {
    const { service } = createNoiseReduction();
    let resolveInitialization;
    const createResources = jest.spyOn(service, '_createKrispResources').mockImplementation(
      () => new Promise((resolve) => {
        resolveInitialization = resolve;
      }),
    );

    const first = service._initializeKrisp();
    const second = service._initializeKrisp();
    resolveInitialization(true);
    await expect(first).resolves.toBe(true);
    await expect(second).resolves.toBe(true);
    expect(createResources).toHaveBeenCalledTimes(1);
    expect(service._sdkInitializationPromise).toBeNull();

    service._isSdkInitialized = true;
    const filterNode = createFilterNode();
    service._filterNode = filterNode;
    await expect(service._initializeKrisp()).resolves.toBe(true);
    expect(filterNode.enable).toHaveBeenCalled();
  });

  test('activates suspended audio and rejects unusable audio states', async () => {
    const { service } = createNoiseReduction();
    await expect(service.activateAudioContext()).rejects.toThrow(
      'Noise reduction audio context is not initialized',
    );

    service._audioContext = audioContext;
    audioContext.state = 'suspended';
    await expect(service.activateAudioContext()).resolves.toBeUndefined();
    expect(audioContext.resume).toHaveBeenCalled();

    const unusableContext = createAudioContext(createFilterNode());
    unusableContext.state = 'interrupted';
    service._audioContext = unusableContext;
    service._filterNode = createFilterNode();
    await expect(service.activateAudioContext()).rejects.toThrow(
      'AudioContext is not running',
    );
    expect(unusableContext.close).toHaveBeenCalled();
    expect(service._audioContext).toBeNull();
  });

  test('applies and reuses a denoiser per session', async () => {
    const { service } = createNoiseReduction();
    const filterNode = createFilterNode();
    audioContext.state = 'running';
    service._audioContext = audioContext;
    service._filterNode = filterNode;
    service._isSdkInitialized = true;
    const firstStream = createStream('first');

    await expect(service.denoiser('session', firstStream)).resolves.toBe(firstStream);
    expect(firstStream.removeTrack).toHaveBeenCalledWith(firstStream.sourceTrack);
    const firstDenoiser = service._denoiserMap.get('session');

    const secondStream = createStream('second');
    await expect(service.denoiser('session', secondStream)).resolves.toBe(secondStream);
    expect(service._denoiserMap.get('session')).toBe(firstDenoiser);
    expect(firstStream.sourceTrack.stop).toHaveBeenCalled();

    service.reset('session');
    expect(service._denoiserMap.has('session')).toBe(false);
    service.reset('missing');
  });

  test('returns the original stream for guards and initialization failures', async () => {
    const stream = createStream();
    const disabled = createNoiseReduction().service;
    disabled.enabled = false;
    await expect(disabled.denoiser('session', stream)).resolves.toBe(stream);

    const { dependencies, service } = createNoiseReduction();
    dependencies.appFeatures.showNoiseReductionSetting = false;
    await expect(service.denoiser('session', stream)).resolves.toBe(stream);

    dependencies.appFeatures.showNoiseReductionSetting = true;
    jest.spyOn(service, '_initializeKrisp').mockResolvedValue(false);
    await expect(service.denoiser('session', stream)).resolves.toBe(stream);

    service._initializeKrisp.mockResolvedValue(true);
    service._audioContext = null;
    await expect(service.denoiser('session', stream)).resolves.toBe(stream);
  });

  test('logs denoiser activation failures and returns the original stream', async () => {
    const { service } = createNoiseReduction();
    const stream = createStream();
    service._audioContext = audioContext;
    service._filterNode = createFilterNode();
    jest.spyOn(service, '_initializeKrisp').mockResolvedValue(true);
    jest.spyOn(service, 'activateAudioContext').mockRejectedValue(new Error('resume failed'));

    await expect(service.denoiser('session', stream)).resolves.toBe(stream);
    expect(service.logger.error).toHaveBeenCalledWith(
      'Failed to apply noise reduction',
      expect.any(Error),
    );
  });

  test('disposes filter and open audio context resources', async () => {
    const { service } = createNoiseReduction();
    const filterNode = createFilterNode();
    audioContext.state = 'running';
    service._filterNode = filterNode;
    service._audioContext = audioContext;
    service._krispSdk = {};
    service._isSdkInitialized = true;

    await service._disposeKrispResources();

    expect(filterNode.disconnect).toHaveBeenCalled();
    expect(filterNode.dispose).toHaveBeenCalled();
    expect(audioContext.close).toHaveBeenCalled();
    expect(service._filterNode).toBeNull();
    expect(service._audioContext).toBeNull();
    expect(service._krispSdk).toBeNull();
    expect(service._isSdkInitialized).toBe(false);
  });
});
