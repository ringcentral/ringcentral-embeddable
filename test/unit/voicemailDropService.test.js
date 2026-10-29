import { EventEmitter } from 'events';

import { VoicemailDrop } from '../../src/app/services/VoicemailDrop/VoicemailDrop';
import {
  isVoicemailDropRunning,
  voicemailDropStatus,
} from '../../src/app/services/WebphoneV2/voicemailDropStatus';

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
    // Chrome only feeds a remote track into Web Audio while it is attached to a
    // media element, so the detector primes it through a muted element plus a
    // zero gain node.
    createGain: jest.fn(() => ({
      gain: { value: 1 },
      connect: jest.fn(),
      disconnect: jest.fn(),
    })),
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

  test('primes the remote track so detection hears the real greeting', async () => {
    // Without this, Chrome delivers silence into Web Audio and the detector
    // fires after exactly `noBeepSilenceDuration`, cutting into the greeting —
    // the callee then loses the start of the recorded message.
    const { service } = createVoicemailDrop();
    const context = createAudioContext();
    const gainNode = {
      gain: { value: 1 },
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
    context.createGain.mockReturnValue(gainNode);
    global.MediaStream = jest.fn((tracks) => ({ tracks }));
    global.AudioWorkletNode = jest.fn(() => ({
      port: {},
      connect: jest.fn(),
      disconnect: jest.fn(),
    }));
    const session = createSession();

    const pending = service._waitVoicemailGreetingEnd({
      webphoneSession: session,
      audioContext: context,
      endCall: jest.fn(async () => {}),
    });

    expect(context.createGain).toHaveBeenCalled();
    // Silent: the local user must not hear the greeting twice.
    expect(gainNode.gain.value).toBe(0);
    expect(gainNode.connect).toHaveBeenCalledWith(context.destination);

    session.emit('disposed');
    await pending;
    expect(gainNode.disconnect).toHaveBeenCalled();
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

  test('terminates sending when no sender or replacement tracks are available', async () => {
    const { service } = createVoicemailDrop();
    const trackFailed = jest.spyOn(service, '_trackVoicemailDropFailed');
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
    expect(updateStatus).toHaveBeenCalledWith(voicemailDropStatus.terminated);
    expect(trackFailed).toHaveBeenCalledWith('terminated');

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
    expect(updateStatus).not.toHaveBeenCalledWith(voicemailDropStatus.failed);
    expect(trackFailed).toHaveBeenCalledTimes(3);
    expect(trackFailed.mock.calls).toEqual([
      ['terminated'],
      ['terminated'],
      ['terminated'],
    ]);
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
    session.restoreSessionAudio = jest.fn();
    const context = createAudioContext();
    context.source.stop = jest.fn();
    const updateStatus = jest.fn();
    const endCall = jest.fn();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    await service._sendAudioData({
      webphoneSession: session,
      audioContext: context,
      audioBuffer: {},
      endCall,
      updateStatus,
    });
    session.emit('disposed');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(updateStatus).toHaveBeenCalledWith(voicemailDropStatus.terminated);
    expect(session.off).toHaveBeenCalled();
    expect(context.audioTrack.stop).toHaveBeenCalled();
    // The peer connection is closed, so the microphone track is not restored.
    expect(session.rtcSender.replaceTrack.mock.calls).toEqual([[context.audioTrack]]);
    expect(session.restoreSessionAudio).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    expect(context.source.onended).toBeNull();
    expect(context.source.stop).toHaveBeenCalledTimes(1);
    expect(endCall).not.toHaveBeenCalled();
    consoleError.mockRestore();
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

  describe('cancelling with an AbortSignal', () => {
    const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

    function createSendArgs(signal) {
      const webphoneSession = createSession();
      webphoneSession.restoreSessionAudio = jest.fn();
      const audioContext = createAudioContext();
      audioContext.source.stop = jest.fn();
      return {
        webphoneSession,
        audioContext,
        audioBuffer: { duration: 5 },
        endCall: jest.fn(async () => {}),
        updateStatus: jest.fn(),
        signal,
      };
    }

    test('restores the microphone and reports cancelled when aborted during the greeting wait', async () => {
      const { service } = createVoicemailDrop();
      const processor = createProcessorNode();
      global.MediaStream = jest.fn();
      global.AudioWorkletNode = jest.fn(() => processor);
      const sendAudioData = jest.spyOn(service, '_sendAudioData');
      const trackFailed = jest.spyOn(service, '_trackVoicemailDropFailed');
      const controller = new AbortController();
      const args = createSendArgs(controller.signal);

      const pending = service.dropVoicemailMessage(args);
      controller.abort();
      await pending;

      // The detector is torn down instead of waiting for the 45s timeout.
      expect(processor.disconnect).toHaveBeenCalled();
      expect(args.webphoneSession.restoreSessionAudio).toHaveBeenCalledTimes(1);
      expect(args.updateStatus.mock.calls).toEqual([
        [voicemailDropStatus.cancelled],
      ]);
      expect(sendAudioData).not.toHaveBeenCalled();
      expect(trackFailed).not.toHaveBeenCalled();
      expect(args.endCall).not.toHaveBeenCalled();
    });

    test('reports cancelled when the signal is aborted before the drop starts', async () => {
      const { service } = createVoicemailDrop();
      global.AudioWorkletNode = jest.fn();
      const controller = new AbortController();
      controller.abort();
      const args = createSendArgs(controller.signal);

      await service.dropVoicemailMessage(args);

      expect(global.AudioWorkletNode).not.toHaveBeenCalled();
      expect(args.webphoneSession.restoreSessionAudio).toHaveBeenCalledTimes(1);
      expect(args.updateStatus.mock.calls).toEqual([
        [voicemailDropStatus.cancelled],
      ]);
    });

    test('restores the microphone before reporting a greeting detection failure', async () => {
      const { service } = createVoicemailDrop();
      jest.spyOn(service, '_waitVoicemailGreetingEnd').mockResolvedValue(false);
      const args = createSendArgs();

      await service.dropVoicemailMessage(args);

      // A session that outlives the drop would otherwise keep a silenced mic.
      expect(args.webphoneSession.restoreSessionAudio).toHaveBeenCalledTimes(1);
      expect(args.updateStatus).toHaveBeenCalledWith(
        voicemailDropStatus.greetingDetectionFailed,
      );
      expect(
        args.webphoneSession.restoreSessionAudio.mock.invocationCallOrder[0],
      ).toBeLessThan(args.updateStatus.mock.invocationCallOrder[0]);
    });

    test('passes the signal to both pipeline steps', async () => {
      const { service } = createVoicemailDrop();
      const waitGreetingEnd = jest
        .spyOn(service, '_waitVoicemailGreetingEnd')
        .mockResolvedValue(true);
      const sendAudioData = jest
        .spyOn(service, '_sendAudioData')
        .mockResolvedValue();
      const { signal } = new AbortController();
      const args = createSendArgs(signal);

      await service.dropVoicemailMessage(args);

      expect(waitGreetingEnd).toHaveBeenCalledWith(
        expect.objectContaining({ signal }),
      );
      expect(sendAudioData).toHaveBeenCalledWith(
        expect.objectContaining({ signal }),
      );
    });

    test('puts the microphone back and keeps the call when aborted while sending', async () => {
      const { service } = createVoicemailDrop();
      const trackCompleted = jest.spyOn(
        service,
        '_trackVoicemailDropCompleted',
      );
      const controller = new AbortController();
      const args = createSendArgs(controller.signal);
      const { webphoneSession: session, audioContext: context } = args;
      const originalTrack = session.rtcSender.track;

      await service._sendAudioData(args);
      expect(context.source.start).toHaveBeenCalled();
      controller.abort();
      await flush();

      expect(context.audioTrack.stop).toHaveBeenCalled();
      expect(session.rtcSender.replaceTrack).toHaveBeenLastCalledWith(
        originalTrack,
      );
      expect(session.restoreSessionAudio).toHaveBeenCalledTimes(1);
      expect(args.updateStatus.mock.calls).toEqual([
        [voicemailDropStatus.cancelled],
      ]);
      // Stopping the source fires `onended`; its handler is cleared first so
      // the call is not hung up and `finished` is not reported.
      expect(context.source.onended).toBeNull();
      expect(context.source.stop).toHaveBeenCalledTimes(1);
      expect(context.source.stop.mock.invocationCallOrder[0]).toBeGreaterThan(
        args.updateStatus.mock.invocationCallOrder[0],
      );
      expect(args.endCall).not.toHaveBeenCalled();
      expect(trackCompleted).not.toHaveBeenCalled();

      // The disposed listener is gone, so a later hang-up reports nothing more.
      session.emit('disposed');
      await flush();
      expect(args.updateStatus).toHaveBeenCalledTimes(1);
    });

    test('cancels right away when the signal is already aborted at send start', async () => {
      const { service } = createVoicemailDrop();
      const controller = new AbortController();
      controller.abort();
      const args = createSendArgs(controller.signal);
      const { webphoneSession: session, audioContext: context } = args;
      const originalTrack = session.rtcSender.track;

      await service._sendAudioData(args);
      await flush();

      expect(session.rtcSender.replaceTrack.mock.calls).toEqual([
        [context.audioTrack],
        [originalTrack],
      ]);
      expect(context.audioTrack.stop).toHaveBeenCalled();
      expect(session.restoreSessionAudio).toHaveBeenCalledTimes(1);
      expect(args.updateStatus.mock.calls).toEqual([
        [voicemailDropStatus.cancelled],
      ]);
      expect(context.source.onended).toBeNull();
      expect(context.source.stop).toHaveBeenCalledTimes(1);
      expect(args.endCall).not.toHaveBeenCalled();
    });

    test('tolerates a source that is already stopped', async () => {
      const { service } = createVoicemailDrop();
      const controller = new AbortController();
      const args = createSendArgs(controller.signal);
      args.audioContext.source.stop.mockImplementation(() => {
        throw new Error('InvalidStateError');
      });

      await service._sendAudioData(args);
      controller.abort();
      await flush();

      expect(args.updateStatus).toHaveBeenCalledWith(
        voicemailDropStatus.cancelled,
      );
      expect(args.endCall).not.toHaveBeenCalled();
    });
  });
});

describe('isVoicemailDropRunning', () => {
  test.each([
    [voicemailDropStatus.waitingForGreetingEnd, true],
    [voicemailDropStatus.sending, true],
    [voicemailDropStatus.finished, false],
    [voicemailDropStatus.terminated, false],
    [voicemailDropStatus.cancelled, false],
    [voicemailDropStatus.greetingDetectionFailed, false],
    ['', false],
    [null, false],
    [undefined, false],
  ])('returns %p => %p', (status, expected) => {
    expect(isVoicemailDropRunning(status)).toBe(expected);
  });
});

function createProcessorNode() {
  return {
    port: { onmessage: null },
    connect: jest.fn(),
    disconnect: jest.fn(),
  };
}
