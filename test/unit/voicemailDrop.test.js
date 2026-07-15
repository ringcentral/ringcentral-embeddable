const { EventEmitter } = require('events');

const { setStagedState } = require('@ringcentral-integration/core/lib/usm-redux/utils');

jest.mock('../../src/worklets/voicemail-greeting-end-detector.worklet.js', () => 'worklet-url');

const { VoicemailDrop } = require('../../src/modules/VoicemailDrop');
const voicemailDropStatus = require('../../src/modules/WebphoneV2/voicemailDropStatus').default;

function createDeps(overrides = {}) {
  return {
    alert: {
      warning: jest.fn(),
    },
    appFeatures: {
      hasVoicemailDropPermission: true,
    },
    client: {
      service: {},
    },
    storage: {
      ready: true,
    },
    ...overrides,
  };
}

function createModule(deps = createDeps()) {
  const voicemailDrop = new VoicemailDrop(deps);
  voicemailDrop.parentModule = {
    analytics: {
      track: jest.fn(),
    },
  };
  return voicemailDrop;
}

function createWebphoneSession({
  receiver = { track: { kind: 'audio', id: 'remote-track' } },
  sender = {
    track: { kind: 'audio', id: 'local-track' },
    replaceTrack: jest.fn(async () => {}),
  },
} = {}) {
  const session = new EventEmitter();
  session.callId = 'call-1';
  session.rtcPeerConnection = {
    getReceivers: jest.fn(() => (receiver ? [receiver] : [])),
    getSenders: jest.fn(() => (sender ? [sender] : [])),
  };
  return { session, sender };
}

function installAudioGlobals(audioContext) {
  global.window = {
    AudioContext: function AudioContext() {
      return audioContext;
    },
  };
  global.MediaStream = jest.fn(function MediaStream(tracks) {
    this.tracks = tracks;
    this.getAudioTracks = () => tracks;
  });
  global.Audio = jest.fn(function Audio() {
    this.muted = false;
    this.srcObject = null;
    this.play = jest.fn(() => Promise.resolve());
  });
  global.AudioWorkletNode = jest.fn(function AudioWorkletNode(_context, name, options) {
    this.name = name;
    this.options = options;
    this.port = { onmessage: null };
    this.disconnect = jest.fn();
  });
}

function createAudioContext() {
  const mediaStreamSource = {
    connect: jest.fn(),
    disconnect: jest.fn(),
  };
  const gainNode = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    gain: { value: 1 },
  };
  const audioTrack = {
    id: 'drop-track',
    kind: 'audio',
    stop: jest.fn(),
  };
  const sourceNode = {
    buffer: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
    onended: null,
    start: jest.fn(),
    stop: jest.fn(),
  };
  const destinationNode = {
    disconnect: jest.fn(),
    stream: {
      getAudioTracks: jest.fn(() => [audioTrack]),
    },
  };
  return {
    audioContext: {
      state: 'suspended',
      audioWorklet: {
        addModule: jest.fn(async () => {}),
      },
      createBufferSource: jest.fn(() => sourceNode),
      createGain: jest.fn(() => gainNode),
      createMediaStreamDestination: jest.fn(() => destinationNode),
      createMediaStreamSource: jest.fn(() => mediaStreamSource),
      decodeAudioData: jest.fn(async () => ({ duration: 3 })),
      destination: {},
      resume: jest.fn(async function resume() {
        this.state = 'running';
      }),
    },
    audioTrack,
    destinationNode,
    gainNode,
    mediaStreamSource,
    sourceNode,
  };
}

describe('VoicemailDrop module methods', () => {
  beforeEach(() => {
    setStagedState({});
    jest.useFakeTimers();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    setStagedState(undefined);
    delete global.window;
    delete global.MediaStream;
    delete global.Audio;
    delete global.AudioWorkletNode;
    delete global.fetch;
    jest.restoreAllMocks();
  });

  it('stores voicemail messages, filters external files, and tracks settings', async () => {
    const voicemailDrop = createModule();
    voicemailDrop.setNoBeepSilenceDuration(8);
    expect(voicemailDrop.noBeepSilenceDuration).toBe(8);
    expect(voicemailDrop.parentModule.analytics.track).toHaveBeenCalledWith(
      'Update voicemail drop silence duration',
      { duration: 8 },
    );

    voicemailDrop.addVoicemailMessage({
      id: 'local-1',
      label: 'Local',
      file: 'data:audio/mpeg;base64,aaa',
      fileName: 'local.mp3',
    });
    voicemailDrop.addVoicemailMessage({
      id: 'local-1',
      label: 'Updated Local',
      file: 'data:audio/wav;base64,bbb',
      fileName: 'updated.wav',
    });
    expect(voicemailDrop.voicemailMessages).toEqual([{
      id: 'local-1',
      label: 'Updated Local',
      file: 'data:audio/wav;base64,bbb',
      fileName: 'updated.wav',
    }]);

    voicemailDrop.setExternalVoicemailFetcher(jest.fn(async () => [
      { id: 'external-1', label: 'External', uri: 'https://example.com/audio.mp3', fileName: 'external.mp3' },
      { id: 'external-2', label: '', uri: 'https://example.com/empty.mp3', fileName: 'empty.mp3' },
      { id: 'external-3', label: 'Bad', uri: 'javascript:alert(1)', fileName: 'bad.mp3' },
    ]));
    await voicemailDrop.fetchExternalVoicemailDropFiles();
    expect(voicemailDrop.externalVoicemailDropFiles).toEqual([
      { id: 'external-1', label: 'External', uri: 'https://example.com/audio.mp3', fileName: 'external.mp3' },
    ]);
    expect(voicemailDrop.allMessages).toHaveLength(2);

    voicemailDrop.deleteVoicemailMessage({ id: 'local-1' });
    expect(voicemailDrop.voicemailMessages).toEqual([]);
    expect(voicemailDrop.hasVoicemailDropPermission).toBe(true);
  });

  it('prepares voicemail drop audio from local and external messages', async () => {
    const { audioContext } = createAudioContext();
    installAudioGlobals(audioContext);
    global.fetch = jest.fn(async () => ({
      arrayBuffer: async () => new ArrayBuffer(8),
    }));
    const voicemailDrop = createModule();
    const { session } = createWebphoneSession();
    voicemailDrop.addVoicemailMessage({
      id: 'local-1',
      label: 'Local',
      file: 'data:audio/mpeg;base64,aaa',
      fileName: 'local.mp3',
    });

    await expect(
      voicemailDrop.prepareVoicemailDrop(session, 'local-1'),
    ).resolves.toEqual({
      audioBuffer: { duration: 3 },
      audioContext,
    });
    expect(audioContext.resume).toHaveBeenCalled();
    expect(audioContext.audioWorklet.addModule).toHaveBeenCalledWith('worklet-url');
    expect(global.fetch).toHaveBeenCalledWith('data:audio/mpeg;base64,aaa');

    const externalDrop = createModule();
    externalDrop.setExternalVoicemailFetcher(jest.fn(async () => [
      { id: 'external-1', label: 'External', uri: 'https://example.com/audio.mp3', fileName: 'external.mp3' },
    ]));
    await expect(
      externalDrop.prepareVoicemailDrop(session, 'external-1'),
    ).resolves.toEqual({
      audioBuffer: { duration: 3 },
      audioContext,
    });

    await expect(
      voicemailDrop.prepareVoicemailDrop(session, 'missing'),
    ).rejects.toThrow('Pre-recorded message not found');
    await expect(
      voicemailDrop.prepareVoicemailDrop(createWebphoneSession({ receiver: null }).session, 'local-1'),
    ).rejects.toThrow('Receiver not found for the call session');
    await expect(
      voicemailDrop.prepareVoicemailDrop(createWebphoneSession({ sender: null }).session, 'local-1'),
    ).rejects.toThrow('Sender not found for the call session');

    global.fetch.mockRejectedValueOnce(new Error('load failed'));
    await expect(
      voicemailDrop.prepareVoicemailDrop(session, 'local-1'),
    ).rejects.toThrow('Failed to load audio data');
  });

  it('detects voicemail greeting end and handles call disposal before detection', async () => {
    const { audioContext, gainNode, mediaStreamSource } = createAudioContext();
    installAudioGlobals(audioContext);
    const voicemailDrop = createModule();
    const { session } = createWebphoneSession();

    const detectionPromise = voicemailDrop._waitVoicemailGreetingEnd({
      webphoneSession: session,
      audioContext,
      endCall: jest.fn(),
    });
    const detector = global.AudioWorkletNode.mock.instances[0];
    detector.port.onmessage({ data: 'greeting-ended' });
    await expect(detectionPromise).resolves.toBe(true);
    expect(session.listenerCount('disposed')).toBe(0);
    expect(detector.disconnect).toHaveBeenCalled();
    expect(mediaStreamSource.disconnect).toHaveBeenCalled();
    expect(gainNode.disconnect).toHaveBeenCalled();

    const disposedSession = createWebphoneSession().session;
    const disposedPromise = voicemailDrop._waitVoicemailGreetingEnd({
      webphoneSession: disposedSession,
      audioContext,
      endCall: jest.fn(),
    });
    disposedSession.emit('disposed');
    await expect(disposedPromise).resolves.toBe(false);
    expect(voicemailDrop._deps.alert.warning).toHaveBeenCalledWith({
      message: 'dropVoicemailMessageFailedAsCallEnded',
    });
  });

  it('sends voicemail audio, updates statuses, and handles failure flows', async () => {
    const { audioContext, audioTrack, destinationNode, sourceNode } = createAudioContext();
    installAudioGlobals(audioContext);
    const voicemailDrop = createModule();
    const { session, sender } = createWebphoneSession();
    const endCall = jest.fn();
    const updateStatus = jest.fn();

    await voicemailDrop._sendAudioData({
      webphoneSession: session,
      audioContext,
      audioBuffer: { duration: 3 },
      endCall,
      updateStatus,
    });
    expect(sender.replaceTrack).toHaveBeenCalledWith(audioTrack);
    expect(sourceNode.start).toHaveBeenCalled();

    sourceNode.onended();
    expect(audioTrack.stop).toHaveBeenCalled();
    expect(updateStatus).toHaveBeenCalledWith(voicemailDropStatus.finished);
    expect(endCall).toHaveBeenCalled();
    expect(voicemailDrop.parentModule.analytics.track).toHaveBeenCalledWith(
      'Voicemail drop completed',
      undefined,
    );

    destinationNode.stream.getAudioTracks.mockReturnValueOnce([]);
    await voicemailDrop._sendAudioData({
      webphoneSession: session,
      audioContext,
      audioBuffer: { duration: 3 },
      endCall,
      updateStatus,
    });
    expect(updateStatus).toHaveBeenCalledWith(voicemailDropStatus.terminated);

    voicemailDrop._waitVoicemailGreetingEnd = jest.fn(async () => false);
    await voicemailDrop.dropVoicemailMessage({
      webphoneSession: session,
      audioContext,
      audioBuffer: { duration: 3 },
      endCall,
      updateStatus,
    });
    expect(updateStatus).toHaveBeenCalledWith(
      voicemailDropStatus.greetingDetectionFailed,
    );

    voicemailDrop._waitVoicemailGreetingEnd = jest.fn(async () => true);
    voicemailDrop._sendAudioData = jest.fn(async () => {});
    await voicemailDrop.dropVoicemailMessage({
      webphoneSession: session,
      audioContext,
      audioBuffer: { duration: 3 },
      endCall,
      updateStatus,
    });
    expect(updateStatus).toHaveBeenCalledWith(voicemailDropStatus.sending);
    expect(voicemailDrop._sendAudioData).toHaveBeenCalled();
  });
});
