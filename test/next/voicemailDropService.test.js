import { EventEmitter } from 'events';

import { VoicemailDrop } from '../../next/app/services/VoicemailDrop/VoicemailDrop';
import { voicemailDropStatus } from '../../next/app/services/WebphoneV2/voicemailDropStatus';

function createVoicemailDrop(overrides = {}) {
  const dependencies = {
    storage: { enable: jest.fn() },
    appFeatures: { hasVoicemailDropPermission: true },
    toast: { warning: jest.fn() },
    ...overrides,
  };
  const service = new VoicemailDrop(
    dependencies.storage,
    dependencies.appFeatures,
    dependencies.toast,
  );
  return { dependencies, service };
}

function createSession({ receiver = true, sender = true } = {}) {
  const session = new EventEmitter();
  const receiverTrack = { kind: 'audio' };
  const senderTrack = { kind: 'audio' };
  const rtcSender = {
    track: senderTrack,
    replaceTrack: jest.fn(async () => {}),
  };
  session.rtcPeerConnection = {
    getReceivers: jest.fn(() => (receiver ? [{ track: receiverTrack }] : [])),
    getSenders: jest.fn(() => (sender ? [rtcSender] : [])),
  };
  session.off = jest.fn((eventName, listener) => {
    session.removeListener(eventName, listener);
  });
  session.receiverTrack = receiverTrack;
  session.rtcSender = rtcSender;
  return session;
}

function createAudioContext() {
  const audioTrack = { stop: jest.fn() };
  const source = {
    buffer: null,
    connect: jest.fn(),
    start: jest.fn(),
    onended: null,
  };
  const context = {
    state: 'running',
    destination: {},
    audioWorklet: { addModule: jest.fn(async () => {}) },
    resume: jest.fn(async () => {
      context.state = 'running';
    }),
    decodeAudioData: jest.fn(async () => ({ duration: 5 })),
    createMediaStreamSource: jest.fn(() => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
    })),
    createMediaStreamDestination: jest.fn(() => ({
      stream: { getAudioTracks: jest.fn(() => [audioTrack]) },
    })),
    createBufferSource: jest.fn(() => source),
  };
  context.audioTrack = audioTrack;
  context.source = source;
  return context;
}

describe('VoicemailDrop service', () => {
  beforeEach(() => {
    global.fetch = jest.fn(async () => ({
      arrayBuffer: async () => new ArrayBuffer(8),
    }));
  });

  afterEach(() => {
    delete global.fetch;
    delete global.MediaStream;
    delete global.AudioWorkletNode;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('stores duration and creates, updates, and deletes local messages', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1234);
    const { dependencies, service } = createVoicemailDrop();

    expect(dependencies.storage.enable).toHaveBeenCalledWith(service);
    expect(service.hasVoicemailDropPermission).toBe(true);
    expect(service.allMessages).toEqual([]);
    await service.setNoBeepSilenceDuration(6);
    expect(service.noBeepSilenceDuration).toBe(6);

    await service.addVoicemailMessage({ label: 'Generated', file: 'data:audio/mpeg;base64,one' });
    await service.addVoicemailMessage({
      id: 'message-2',
      label: 'Second',
      file: 'data:audio/wav;base64,two',
      fileName: 'second.wav',
    });
    await service.addVoicemailMessage({
      id: 'message-2',
      label: 'Updated',
      file: '',
      fileName: '',
    });

    expect(service.voicemailMessages).toEqual([
      expect.objectContaining({ id: '1234', label: 'Generated' }),
      {
        id: 'message-2',
        label: 'Updated',
        file: 'data:audio/wav;base64,two',
        fileName: 'second.wav',
      },
    ]);
    await service.deleteVoicemailMessage({ id: '1234' });
    expect(service.voicemailMessages).toEqual([
      expect.objectContaining({ id: 'message-2' }),
    ]);

    dependencies.appFeatures.hasVoicemailDropPermission = false;
    expect(service.hasVoicemailDropPermission).toBe(false);
  });

  test('fetches and filters external voicemail messages', async () => {
    const { service } = createVoicemailDrop();
    const fetcher = jest.fn(async () => [
      { id: 'mpeg', label: 'MPEG', uri: 'data:audio/mpeg;base64,abc' },
      { id: 'wav', label: 'WAV', uri: 'data:audio/wav;base64,abc' },
      { id: 'https', label: 'HTTPS', uri: 'https://example.com/message.mp3' },
      { id: 'http', label: 'HTTP', uri: 'http://example.com/message.wav' },
      { id: 'javascript', label: 'Unsafe', uri: 'https://example.com/javascript:alert(1)' },
      { id: 'relative', label: 'Relative', uri: '/message.mp3' },
      { id: 'missing-uri', label: 'Missing URI' },
      { id: 'missing-label', uri: 'https://example.com/message.mp3' },
    ]);

    await service.fetchExternalVoicemailDropFiles();
    expect(service.externalVoicemailDropFiles).toEqual([]);

    service.setExternalVoicemailFetcher(fetcher);
    await service.fetchExternalVoicemailDropFiles();
    expect(service.externalVoicemailDropFiles.map(({ id }) => id)).toEqual([
      'mpeg',
      'wav',
      'https',
      'http',
    ]);
    expect(service.allMessages).toEqual(service.externalVoicemailDropFiles);
  });

  test('initializes, resumes, and reuses an AudioContext', async () => {
    const { service } = createVoicemailDrop();
    const context = createAudioContext();
    context.state = 'suspended';
    window.AudioContext = jest.fn(() => context);

    await expect(service.initAudioContext()).resolves.toBe(context);
    expect(context.resume).toHaveBeenCalledTimes(1);
    expect(context.audioWorklet.addModule).toHaveBeenCalledTimes(1);
    await expect(service.initAudioContext()).resolves.toBe(context);
    expect(context.audioWorklet.addModule).toHaveBeenCalledTimes(1);
  });

  test('uses the prefixed AudioContext constructor', async () => {
    const { service } = createVoicemailDrop();
    const context = createAudioContext();
    const originalAudioContext = window.AudioContext;
    window.AudioContext = undefined;
    window.webkitAudioContext = jest.fn(() => context);

    await expect(service.initAudioContext()).resolves.toBe(context);
    expect(window.webkitAudioContext).toHaveBeenCalledTimes(1);

    window.AudioContext = originalAudioContext;
    delete window.webkitAudioContext;
  });

  test('prepares a local audio message for an active call', async () => {
    const { service } = createVoicemailDrop();
    const context = createAudioContext();
    jest.spyOn(service, 'initAudioContext').mockResolvedValue(context);
    await service.addVoicemailMessage({
      id: 'message',
      label: 'Greeting',
      file: 'data:audio/mpeg;base64,abc',
    });
    const session = createSession();

    await expect(service.prepareVoicemailDrop(session, 'message')).resolves.toEqual({
      audioBuffer: { duration: 5 },
      audioContext: context,
    });
    expect(global.fetch).toHaveBeenCalledWith('data:audio/mpeg;base64,abc');
    expect(context.decodeAudioData).toHaveBeenCalledWith(expect.any(ArrayBuffer));
  });

  test('fetches an external message lazily before preparing it', async () => {
    const { service } = createVoicemailDrop();
    const context = createAudioContext();
    jest.spyOn(service, 'initAudioContext').mockResolvedValue(context);
    const fetcher = jest.fn(async () => [
      { id: 'external', label: 'External', uri: 'https://example.com/message.mp3' },
    ]);
    service.setExternalVoicemailFetcher(fetcher);

    await service.prepareVoicemailDrop(createSession(), 'external');

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('https://example.com/message.mp3');
  });

  test('rejects missing messages and call media endpoints', async () => {
    const { service } = createVoicemailDrop();

    await expect(service.prepareVoicemailDrop(createSession(), 'missing')).rejects.toThrow(
      'Pre-recorded message not found',
    );
    await service.addVoicemailMessage({
      id: 'message',
      label: 'Greeting',
      file: 'data:audio/mpeg;base64,abc',
    });
    await expect(
      service.prepareVoicemailDrop(createSession({ receiver: false }), 'message'),
    ).rejects.toThrow('Receiver not found for the call session');
    await expect(
      service.prepareVoicemailDrop(createSession({ sender: false }), 'message'),
    ).rejects.toThrow('Sender not found for the call session');
  });

  test('reports audio download and decode failures consistently', async () => {
    const { service } = createVoicemailDrop();
    const context = createAudioContext();
    jest.spyOn(service, 'initAudioContext').mockResolvedValue(context);
    await service.addVoicemailMessage({
      id: 'message',
      label: 'Greeting',
      file: 'data:audio/mpeg;base64,abc',
    });

    global.fetch.mockRejectedValueOnce(new Error('network'));
    await expect(service.prepareVoicemailDrop(createSession(), 'message')).rejects.toThrow(
      'Failed to load audio data',
    );
    context.decodeAudioData.mockRejectedValueOnce(new Error('decode'));
    await expect(service.prepareVoicemailDrop(createSession(), 'message')).rejects.toThrow(
      'Failed to load audio data',
    );
  });

  test('updates greeting failure and sending status around drop execution', async () => {
    const { service } = createVoicemailDrop();
    const updateStatus = jest.fn();
    const sendAudioData = jest.spyOn(service, '_sendAudioData').mockResolvedValue();
    jest.spyOn(service, '_waitVoicemailGreetingEnd').mockResolvedValueOnce(false);
    const args = {
      webphoneSession: createSession(),
      audioBuffer: {},
      audioContext: createAudioContext(),
      endCall: jest.fn(),
      updateStatus,
    };

    await service.dropVoicemailMessage(args);
    expect(updateStatus).toHaveBeenCalledWith(voicemailDropStatus.greetingDetectionFailed);
    expect(sendAudioData).not.toHaveBeenCalled();

    service._waitVoicemailGreetingEnd.mockResolvedValueOnce(true);
    await service.dropVoicemailMessage(args);
    expect(updateStatus).toHaveBeenCalledWith(voicemailDropStatus.sending);
    expect(sendAudioData).toHaveBeenCalledWith(args);
  });

  test('returns false when greeting detection has no audio receiver', async () => {
    const { service } = createVoicemailDrop();
    await expect(
      service._waitVoicemailGreetingEnd({
        webphoneSession: createSession({ receiver: false }),
        audioContext: createAudioContext(),
        endCall: jest.fn(),
      }),
    ).resolves.toBe(false);
  });

  test('detects greeting completion and disconnects processing nodes', async () => {
    const { service } = createVoicemailDrop();
    const session = createSession();
    const context = createAudioContext();
    const mediaSource = { connect: jest.fn(), disconnect: jest.fn() };
    context.createMediaStreamSource.mockReturnValue(mediaSource);
    const processor = createProcessorNode();
    global.MediaStream = jest.fn((tracks) => ({ tracks }));
    global.AudioWorkletNode = jest.fn(() => processor);
    const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

    const result = service._waitVoicemailGreetingEnd({
      webphoneSession: session,
      audioContext: context,
      endCall: jest.fn(),
    });
    processor.port.onmessage({ data: 'noise' });
    processor.port.onmessage({ data: 'greeting-ended' });

    await expect(result).resolves.toBe(true);
    expect(global.MediaStream).toHaveBeenCalledWith([session.receiverTrack]);
    expect(global.AudioWorkletNode).toHaveBeenCalledWith(
      context,
      'voicemail-greeting-end-detector',
      { processorOptions: { noBeepSilenceDuration: 4 } },
    );
    expect(mediaSource.connect).toHaveBeenCalledWith(processor);
    expect(processor.connect).toHaveBeenCalledWith(context.destination);
    expect(mediaSource.disconnect).toHaveBeenCalled();
    expect(processor.disconnect).toHaveBeenCalled();
    expect(consoleLog).toHaveBeenCalled();
  });

  test('ends the call when greeting detection times out', async () => {
    jest.useFakeTimers();
    const { service } = createVoicemailDrop();
    const processor = createProcessorNode();
    global.MediaStream = jest.fn();
    global.AudioWorkletNode = jest.fn(() => processor);
    const endCall = jest.fn(async () => {});
    const result = service._waitVoicemailGreetingEnd({
      webphoneSession: createSession(),
      audioContext: createAudioContext(),
      endCall,
    });

    jest.advanceTimersByTime(45000);
    await Promise.resolve();

    await expect(result).resolves.toBe(false);
    expect(endCall).toHaveBeenCalledTimes(1);
    expect(processor.disconnect).toHaveBeenCalled();
  });

  test('cancels greeting detection when the call is disposed', async () => {
    const { service } = createVoicemailDrop();
    const session = createSession();
    const processor = createProcessorNode();
    global.MediaStream = jest.fn();
    global.AudioWorkletNode = jest.fn(() => processor);
    const result = service._waitVoicemailGreetingEnd({
      webphoneSession: session,
      audioContext: createAudioContext(),
      endCall: jest.fn(),
    });

    session.emit('disposed');

    await expect(result).resolves.toBe(false);
    expect(processor.disconnect).toHaveBeenCalled();
  });

  test('fails sending when no sender or replacement tracks are available', async () => {
    const { service } = createVoicemailDrop();
    const updateStatus = jest.fn();
    const baseArgs = {
      audioBuffer: {},
      endCall: jest.fn(),
      updateStatus,
    };

    await service._sendAudioData({
      ...baseArgs,
      webphoneSession: createSession({ sender: false }),
      audioContext: createAudioContext(),
    });
    expect(updateStatus).toHaveBeenCalledWith(voicemailDropStatus.failed);

    const noAudioTrackContext = createAudioContext();
    noAudioTrackContext.createMediaStreamDestination.mockReturnValue({
      stream: { getAudioTracks: () => [] },
    });
    await service._sendAudioData({
      ...baseArgs,
      webphoneSession: createSession(),
      audioContext: noAudioTrackContext,
    });

    const noOriginalTrack = createSession();
    noOriginalTrack.rtcSender.track = null;
    await service._sendAudioData({
      ...baseArgs,
      webphoneSession: noOriginalTrack,
      audioContext: createAudioContext(),
    });
    expect(updateStatus).toHaveBeenCalledTimes(3);
  });

  test('sends audio, restores the microphone, finishes, and ends the call', async () => {
    const { service } = createVoicemailDrop();
    const session = createSession();
    const context = createAudioContext();
    const endCall = jest.fn(async () => {});
    const updateStatus = jest.fn();
    const originalTrack = session.rtcSender.track;

    await service._sendAudioData({
      webphoneSession: session,
      audioContext: context,
      audioBuffer: { duration: 5 },
      endCall,
      updateStatus,
    });

    expect(context.source.buffer).toEqual({ duration: 5 });
    expect(context.source.connect).toHaveBeenCalled();
    expect(session.rtcSender.replaceTrack).toHaveBeenCalledWith(context.audioTrack);
    expect(context.resume).toHaveBeenCalled();
    expect(context.source.start).toHaveBeenCalled();
    await context.source.onended();
    expect(session.rtcSender.replaceTrack).toHaveBeenLastCalledWith(originalTrack);
    expect(context.audioTrack.stop).toHaveBeenCalled();
    expect(updateStatus).toHaveBeenCalledWith(voicemailDropStatus.finished);
    expect(endCall).toHaveBeenCalledTimes(1);
  });

  test('cleans up with terminated status when the call is disposed', async () => {
    const { service } = createVoicemailDrop();
    const session = createSession();
    const context = createAudioContext();
    const updateStatus = jest.fn();

    await service._sendAudioData({
      webphoneSession: session,
      audioContext: context,
      audioBuffer: {},
      endCall: jest.fn(),
      updateStatus,
    });
    session.emit('disposed');
    await Promise.resolve();
    await Promise.resolve();

    expect(updateStatus).toHaveBeenCalledWith(voicemailDropStatus.terminated);
    expect(session.off).toHaveBeenCalled();
  });

  test('still updates status when restoring the original track fails', async () => {
    const { service } = createVoicemailDrop();
    const session = createSession();
    const context = createAudioContext();
    const updateStatus = jest.fn();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    session.rtcSender.replaceTrack
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('restore failed'));

    await service._sendAudioData({
      webphoneSession: session,
      audioContext: context,
      audioBuffer: {},
      endCall: jest.fn(),
      updateStatus,
    });
    await context.source.onended();

    expect(consoleError).toHaveBeenCalledWith(expect.any(Error));
    expect(updateStatus).toHaveBeenCalledWith(voicemailDropStatus.finished);
  });
});

function createProcessorNode() {
  return {
    port: { onmessage: null },
    connect: jest.fn(),
    disconnect: jest.fn(),
  };
}
