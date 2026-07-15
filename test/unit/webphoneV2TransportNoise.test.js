/** @jest-environment jsdom */
const { EventEmitter } = require('events');
const { setStagedState } = require('@ringcentral-integration/core/lib/usm-redux/utils');
const proxyActionTypes = require('@ringcentral-integration/commons/lib/proxy/baseActionTypes').default;
const { sessionStatus } = require('@ringcentral-integration/commons/modules/Webphone/sessionStatus');

jest.mock('../../src/modules/WebphoneV2/audio/incoming.mp3', () => 'incoming.mp3');
jest.mock('../../src/modules/WebphoneV2/audio/outgoing.mp3', () => 'outgoing.mp3');
jest.mock('ringcentral-web-phone', () => jest.fn());
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'request-1'),
}));

const { MultipleTabsTransport } = require('../../src/lib/MultipleTabsTransport');
const { Denoiser } = require('../../src/modules/NoiseReduction/Denoiser');
const { NoiseReduction } = require('../../src/modules/NoiseReduction');
const { Webphone } = require('../../src/modules/WebphoneV2');
const { voicemailDropStatus } = require('../../src/modules/WebphoneV2/voicemailDropStatus');

class TestBroadcastChannel {
  constructor(name) {
    this.name = name;
    this.listeners = {};
    this.close = jest.fn();
    this.postMessage = jest.fn();
    TestBroadcastChannel.instances.push(this);
  }

  addEventListener(type, handler) {
    this.listeners[type] = handler;
  }

  removeEventListener(type, handler) {
    if (this.listeners[type] === handler) {
      delete this.listeners[type];
    }
  }

  emitMessage(message) {
    this.listeners.message(message);
  }

  static reset() {
    TestBroadcastChannel.instances = [];
  }
}

TestBroadcastChannel.reset();

function createAudioTrack(id) {
  return {
    id,
    kind: 'audio',
    stop: jest.fn(),
  };
}

function createMediaStream(id, tracks = [createAudioTrack(`${id}-track`)]) {
  return {
    id,
    addTrack: jest.fn(),
    getAudioTracks: jest.fn(() => tracks),
    getTracks: jest.fn(() => tracks),
    removeTrack: jest.fn(),
  };
}

function createAudioContext(state = 'running') {
  return {
    close: jest.fn(() => {
      createAudioContext.state = 'closed';
    }),
    createMediaStreamDestination: jest.fn(() => ({
      disconnect: jest.fn(),
      stream: createMediaStream('clean', [createAudioTrack('clean-track')]),
    })),
    createMediaStreamSource: jest.fn((stream) => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
      mediaStream: stream,
    })),
    resume: jest.fn(async () => {}),
    state,
    suspend: jest.fn(),
  };
}

function createWebphoneModule(overrides = {}) {
  const deps = {
    alert: {
      alert: jest.fn(),
    },
    appFeatures: {
      isWebPhoneEnabled: true,
    },
    audioSettings: {
      ringtoneDeviceId: 'speaker-1',
      supportDevices: true,
    },
    noiseReduction: {
      denoiser: jest.fn(),
      reset: jest.fn(async () => {}),
    },
    prefix: 'test',
    tabManager: {
      tabbie: {
        id: 'tab-id',
      },
    },
    voicemailDrop: {
      dropVoicemailMessage: jest.fn(),
      prepareVoicemailDrop: jest.fn(async () => ({
        audioBuffer: 'audio-buffer',
        audioContext: 'audio-context',
      })),
    },
  };
  const webphone = new Webphone(deps);
  Object.assign(webphone, {
    _eventEmitter: new EventEmitter(),
    _multipleTabsTransport: {
      broadcast: jest.fn(),
      events: {
        broadcast: 'broadcast',
        request: 'request',
      },
      response: jest.fn(),
    },
    _ringtoneHelper: {
      setDeviceId: jest.fn(),
    },
    _sharedSipClient: {
      active: false,
      activeTabId: 'tab-1',
    },
    _transport: null,
    _webphone: {
      callSessions: [],
    },
    sessions: [],
    _getNormalizedSession: jest.fn((session) => ({
      callId: session.callId,
      id: session.callId,
    })),
    _updateSessions: jest.fn(),
    hangup: jest.fn(async () => {}),
    ...overrides,
  });
  Object.defineProperty(webphone, 'modulePath', {
    configurable: true,
    value: 'webphone',
  });
  Object.defineProperty(webphone, 'ready', {
    configurable: true,
    value: true,
  });
  return webphone;
}

describe('WebphoneV2 transport, voicemail drop, and noise reduction', () => {
  beforeEach(() => {
    setStagedState({});
    TestBroadcastChannel.reset();
    global.BroadcastChannel = TestBroadcastChannel;
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    setStagedState(undefined);
    delete global.BroadcastChannel;
    delete window.KrispSDK;
    delete global.AudioContext;
    delete process.env.NOISE_REDUCTION_SDK_URL;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('requests, responds, broadcasts, times out, and disposes MultipleTabsTransport messages', async () => {
    const transport = new MultipleTabsTransport({
      getMainTabId: () => 'main-tab',
      name: 'webphone',
      prefix: 'test',
      tabId: 'tab-1',
      timeout: 20,
    });
    const requestHandler = jest.fn();
    const broadcastHandler = jest.fn();
    transport.on(transport.events.request, requestHandler);
    transport.on(transport.events.broadcast, broadcastHandler);

    transport._channel.emitMessage({
      data: {
        data: {
          payload: JSON.stringify({ method: 'answer' }),
          requestId: 'incoming-request',
          tabId: 'tab-1',
        },
        type: transport.events.request,
      },
    });
    expect(requestHandler).toHaveBeenCalledWith({
      payload: { method: 'answer' },
      requestId: 'incoming-request',
    });

    const circularPayload = { action: 'call' };
    circularPayload.self = circularPayload;
    const responsePromise = transport.request({
      payload: circularPayload,
    });
    expect(transport._channel.postMessage).toHaveBeenCalledWith({
      data: {
        payload: JSON.stringify({ action: 'call' }),
        requestId: 'request-1',
        tabId: 'main-tab',
      },
      type: transport.events.request,
    });
    transport._channel.emitMessage({
      data: {
        data: {
          requestId: 'request-1',
          result: JSON.stringify({ ok: true }),
        },
        type: transport.events.response,
      },
    });
    await expect(responsePromise).resolves.toEqual({ ok: true });

    const rejectedPromise = transport.request({
      tabId: 'tab-2',
      payload: { action: 'reject' },
    });
    transport._channel.emitMessage({
      data: {
        data: {
          error: JSON.stringify('remote failed'),
          requestId: 'request-1',
        },
        type: transport.events.response,
      },
    });
    await expect(rejectedPromise).rejects.toThrow('remote failed');

    const timeoutPromise = transport.request({
      payload: { action: 'timeout' },
    });
    jest.advanceTimersByTime(21);
    await expect(timeoutPromise).rejects.toThrow(transport.events.timeout);

    transport._channel.emitMessage({
      data: {
        data: JSON.stringify({ event: 'callEnd' }),
        type: transport.events.broadcast,
      },
    });
    expect(broadcastHandler).toHaveBeenCalledWith({ event: 'callEnd' });
    transport.response({
      error: 'error-message',
      requestId: 'response-1',
      result: { ok: false },
    });
    transport.broadcast({ event: 'callStart' });
    expect(transport._channel.postMessage).toHaveBeenCalledWith({
      data: {
        error: JSON.stringify('error-message'),
        requestId: 'response-1',
        result: JSON.stringify({ ok: false }),
      },
      type: transport.events.response,
    });
    transport.dispose();
    expect(transport._channel.close).toHaveBeenCalled();
  });

  it('filters and restores media streams through Denoiser', () => {
    const originalTrack = createAudioTrack('original-track');
    const stream = createMediaStream('stream-1', [originalTrack]);
    const audioContext = createAudioContext();
    const filterNode = {
      connect: jest.fn(),
      disable: jest.fn(),
      enable: jest.fn(),
      isReady: true,
    };
    const denoiser = new Denoiser({
      audioContext,
      filterNode,
    });

    denoiser.connect(stream);
    expect(audioContext.createMediaStreamSource).toHaveBeenCalledWith(stream);
    expect(stream.removeTrack).toHaveBeenCalledWith(originalTrack);
    expect(stream.addTrack).toHaveBeenCalledWith(expect.objectContaining({
      id: 'clean-track',
    }));
    denoiser.connect(stream);
    expect(audioContext.createMediaStreamSource).toHaveBeenCalledTimes(1);
    expect(denoiser.connected).toBe(true);
    denoiser.disconnect();
    expect(originalTrack.stop).toHaveBeenCalled();
    expect(denoiser.connected).toBe(false);
    denoiser.disconnect();

    const failingDenoiser = new Denoiser({
      audioContext,
      filterNode: {
        isReady: false,
      },
    });
    expect(failingDenoiser.connect(createMediaStream('stream-2'))).toEqual(
      expect.objectContaining({ id: 'stream-2' }),
    );
  });

  it('initializes NoiseReduction SDK, toggles support, denoises, resets, and handles audio context failures', async () => {
    process.env.NOISE_REDUCTION_SDK_URL = window.location.origin;
    const filterNode = {
      disable: jest.fn(),
      disconnect: jest.fn(),
      dispose: jest.fn(),
      enable: jest.fn(),
      isReady: true,
    };
    class TestKrispSDK {
      constructor(options) {
        this.options = options;
      }

      static isSupported() {
        return true;
      }

      async init() {}

      async createNoiseFilter(_audioContext, onReady) {
        onReady();
        return filterNode;
      }
    }
    window.KrispSDK = TestKrispSDK;
    global.AudioContext = jest.fn(() => createAudioContext('suspended'));
    const deps = {
      alert: {
        warning: jest.fn(),
      },
      appFeatures: {
        showNoiseReductionSetting: true,
      },
      auth: {
        loggedIn: true,
      },
    };
    const noiseReduction = new NoiseReduction(deps);
    expect(document.querySelector('script[src$="/krispsdk.es5.js"]')).toBeTruthy();
    expect(noiseReduction._shouldInit()).toBe(true);
    deps.auth.loggedIn = false;
    expect(noiseReduction._shouldInit()).toBe(false);
    deps.auth.loggedIn = true;

    noiseReduction._setEnabled(false);
    expect(noiseReduction.enabled).toBe(false);
    window.KrispSDK.isSupported = () => false;
    noiseReduction.setEnabled(true);
    expect(deps.alert.warning).toHaveBeenCalledWith({
      message: 'showNoiseReductionNotSupported',
      ttl: 0,
    });

    window.KrispSDK.isSupported = () => true;
    await noiseReduction._initKrisp();
    expect(noiseReduction._isSDKInitialized).toBe(true);
    expect(filterNode.enable).toHaveBeenCalled();
    noiseReduction._disableKrisp();
    expect(filterNode.disable).toHaveBeenCalled();

    const stream = createMediaStream('call-stream');
    noiseReduction.enabled = false;
    await expect(noiseReduction.denoiser('session-1', stream)).resolves.toBe(stream);
    noiseReduction.enabled = true;
    noiseReduction._isSDKInitialized = true;
    noiseReduction._audioContext = createAudioContext('running');
    noiseReduction._filterNode = filterNode;
    await noiseReduction.denoiser('session-1', stream);
    expect(noiseReduction._denoiserMap.has('session-1')).toBe(true);
    noiseReduction.reset('session-1');
    expect(noiseReduction._denoiserMap.has('session-1')).toBe(false);

    noiseReduction._audioContext = createAudioContext('suspended');
    noiseReduction._audioContext.state = 'closed';
    noiseReduction._filterNode = filterNode;
    await expect(noiseReduction.activateAudioContext()).rejects.toThrow(
      'AudioContext is not running',
    );
    expect(filterNode.dispose).toHaveBeenCalled();

    window.KrispSDK.isSupported = () => false;
    noiseReduction.enabled = true;
    await noiseReduction.onInit();
    expect(noiseReduction.enabled).toBe(false);
  });

  it('handles WebphoneV2 tab transport, active state, audio cleanup, and voicemail drop flows', async () => {
    const basePrototype = Object.getPrototypeOf(Webphone.prototype);
    jest.spyOn(basePrototype, '_setActive').mockImplementation(async function setActive() {
      this.baseSetActiveCalled = true;
    });
    jest.spyOn(basePrototype, '_bindSessionEvents').mockImplementation(() => {});
    const webphone = createWebphoneModule();
    webphone.answer = jest.fn(async (sessionId) => `answered-${sessionId}`);
    webphone.failAction = jest.fn(async () => {
      throw new Error('action failed');
    });

    webphone._enableProxify();
    expect(webphone.proxifyTransport).toBe(webphone.multipleTabsTransport);
    webphone._disableProxify();
    expect(webphone.proxifyTransport).toBeNull();

    await webphone._onMultipleTabsChannelRequest({
      payload: {
        args: ['session-1'],
        functionPath: 'webphone.answer',
        type: proxyActionTypes.execute,
      },
      requestId: 'request-1',
    });
    expect(webphone._multipleTabsTransport.response).toHaveBeenCalledWith({
      error: undefined,
      requestId: 'request-1',
      result: 'answered-session-1',
    });
    await webphone._onMultipleTabsChannelRequest({
      payload: {
        args: [],
        functionPath: 'webphone.failAction',
        type: proxyActionTypes.execute,
      },
      requestId: 'request-2',
    });
    expect(webphone._multipleTabsTransport.response).toHaveBeenCalledWith({
      error: 'action failed',
      requestId: 'request-2',
      result: undefined,
    });
    await webphone._onMultipleTabsChannelRequest({
      payload: {
        args: [],
        functionPath: 'other.answer',
        type: proxyActionTypes.execute,
      },
      requestId: 'request-3',
    });
    await webphone._onMultipleTabsChannelRequest({
      payload: {
        args: [],
        functionPath: 'webphone.answer',
        type: 'ignored',
      },
      requestId: 'request-4',
    });

    const callEndHandler = jest.fn();
    webphone._eventEmitter.on('callEnd', callEndHandler);
    webphone._onMultipleTabsChannelBroadcast({
      event: 'callEnd',
      message: [{ id: 'ended-session' }],
    });
    expect(callEndHandler).toHaveBeenCalledWith({ id: 'ended-session' });
    jest.advanceTimersByTime(1200);
    await Promise.resolve();
    expect(webphone.baseSetActiveCalled).toBe(true);

    const activeWebphoneHandler = jest.fn();
    webphone.onActiveWebphoneChanged(activeWebphoneHandler);
    await webphone._setActive();
    expect(activeWebphoneHandler).toHaveBeenCalledWith({
      activeId: 'tab-1',
      currentActive: false,
    });
    expect(webphone.proxifyTransport).toBe(webphone.multipleTabsTransport);
    webphone._sharedSipClient.active = true;
    await webphone._setActive();
    expect(webphone.proxifyTransport).toBeNull();
    webphone._onActiveTabIdChanged();

    const originalSession = {
      __rc_recordStatus: null,
      callId: 'session-1',
      on: jest.fn((event, handler) => {
        originalSession.handlers[event] = handler;
      }),
      handlers: {},
    };
    webphone._webphone.callSessions = [originalSession];
    webphone.updateRecordStatus('missing', 'recording');
    webphone.updateRecordStatus('session-1', 'recording');
    expect(originalSession.__rc_recordStatus).toBe('recording');
    webphone._bindSessionEvents(originalSession);
    originalSession.handlers.mediaStreamSet('stream');
    originalSession.handlers.disposed();
    expect(webphone._deps.noiseReduction.denoiser).toHaveBeenCalledWith('session-1', 'stream');
    expect(webphone._deps.noiseReduction.reset).toHaveBeenCalledWith('session-1');

    const sendTrack = createAudioTrack('send-track');
    const fallbackTrack = createAudioTrack('fallback-track');
    const outputTrack = createAudioTrack('output-track');
    const outputStream = createMediaStream('output-stream', [outputTrack]);
    await webphone._stopSessionAudio({
      audioElement: {
        srcObject: outputStream,
      },
      callId: 'session-1',
      rtcPeerConnection: {
        getReceivers: () => [{ track: outputTrack }],
        getSenders: () => [{ track: sendTrack }],
        removeTrack: jest.fn(),
      },
    });
    expect(sendTrack.stop).toHaveBeenCalled();

    await webphone._stopSessionAudio({
      audioElement: null,
      callId: 'session-2',
      rtcPeerConnection: {
        getLocalStreams: () => [createMediaStream('local-stream', [fallbackTrack])],
        getReceivers: () => [{ track: outputTrack }],
      },
    });
    expect(fallbackTrack.stop).toHaveBeenCalled();

    const voicemailSession = {
      __rc_callStatus: sessionStatus.connected,
      __rc_localHold: false,
      __rc_voicemailDropStatus: null,
      callId: 'voicemail-session',
      rtcPeerConnection: {
        getReceivers: () => [{ track: outputTrack }],
        getSenders: () => [],
        removeTrack: jest.fn(),
      },
    };
    webphone._webphone.callSessions = [voicemailSession];
    webphone._stopSessionAudio = jest.fn(async () => {});
    const voicemailDroppedHandler = jest.fn();
    webphone.onCallVoicemailDropped(voicemailDroppedHandler);
    await expect(webphone.dropVoicemailMessage('missing', 'message-1')).resolves.toBe(false);
    voicemailSession.__rc_callStatus = sessionStatus.finished;
    await expect(webphone.dropVoicemailMessage('voicemail-session', 'message-1')).resolves.toBe(false);
    voicemailSession.__rc_callStatus = sessionStatus.connected;
    voicemailSession.__rc_localHold = true;
    await expect(webphone.dropVoicemailMessage('voicemail-session', 'message-1')).resolves.toBe(false);
    voicemailSession.__rc_localHold = false;
    await expect(webphone.dropVoicemailMessage('voicemail-session', 'message-1')).resolves.toBe(true);
    expect(voicemailSession.__rc_voicemailDropStatus).toBe(
      voicemailDropStatus.waitingForGreetingEnd,
    );
    expect(voicemailDroppedHandler).toHaveBeenCalled();
    const dropArgs = webphone._deps.voicemailDrop.dropVoicemailMessage.mock.calls[0][0];
    await dropArgs.endCall();
    expect(webphone.hangup).toHaveBeenCalledWith('voicemail-session');
    dropArgs.updateStatus(voicemailDropStatus.sending);
    expect(voicemailSession.__rc_voicemailDropStatus).toBe(voicemailDropStatus.sending);

    webphone._deps.voicemailDrop.prepareVoicemailDrop.mockRejectedValueOnce(
      new Error('prepare failed'),
    );
    voicemailSession.__rc_voicemailDropStatus = null;
    voicemailSession.__rc_localHold = false;
    await expect(webphone.dropVoicemailMessage('voicemail-session', 'message-2')).resolves.toBe(false);
    expect(webphone._deps.alert.alert).toHaveBeenCalledWith({
      level: 'danger',
      message: 'showCustomAlertMessage',
      payload: {
        alertMessage: 'prepare failed',
      },
    });

    webphone.sessions = [
      { callStatus: sessionStatus.connecting, direction: 'Inbound', id: 'ring' },
      { callStatus: sessionStatus.connected, id: 'active' },
      {
        callStatus: sessionStatus.connected,
        id: 'dropping',
        voicemailDropStatus: voicemailDropStatus.sending,
      },
    ];
    expect(webphone._getActiveSessions()).toEqual([
      { callStatus: sessionStatus.connected, id: 'active' },
    ]);
    expect(webphone.shouldSetRingtoneSinkId).toEqual([true, true, 'speaker-1']);
  });
});
