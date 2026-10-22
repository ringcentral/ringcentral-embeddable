const {
  BrowserWebRtcSession,
  createIceServers,
} = require('../../src/app/services/WebphoneMedia/WebphoneMedia');

/** Minimal RTCPeerConnection double: enough for SDP + track plumbing. */
function createPeerConnectionClass(overrides = {}) {
  return class FakePeerConnection {
    constructor(config) {
      this.config = config;
      this.iceGatheringState = overrides.iceGatheringState ?? 'complete';
      this.localDescription = undefined;
      this.remoteDescription = undefined;
      this.senders = [];
      this.receivers = overrides.receivers ?? [];
      this.closed = false;
      this.listeners = new Map();
      this.ontrack = undefined;
      FakePeerConnection.instances.push(this);
    }

    static instances = [];

    addEventListener(type, handler) {
      this.listeners.set(type, handler);
    }

    removeEventListener(type) {
      this.listeners.delete(type);
    }

    emit(type, event) {
      this.listeners.get(type)?.(event);
    }

    async createOffer(options) {
      this.offerOptions = options;
      return { type: 'offer', sdp: 'v=0 local-offer' };
    }

    async createAnswer() {
      return { type: 'answer', sdp: 'v=0 local-answer' };
    }

    async setLocalDescription(description) {
      this.localDescription = description;
    }

    async setRemoteDescription(description) {
      this.remoteDescription = description;
    }

    addTrack(track, stream) {
      const sender = {
        track,
        stream,
        dtmf: { insertDTMF: jest.fn() },
        replaceTrack: jest.fn(async (next) => {
          sender.track = next;
        }),
      };
      this.senders.push(sender);
      return sender;
    }

    getSenders() {
      return this.senders;
    }

    getReceivers() {
      return this.receivers;
    }

    close() {
      this.closed = true;
    }
  };
}

function createTrack(label = 'mic') {
  return { kind: 'audio', label, enabled: true, stop: jest.fn() };
}

function createStream(track = createTrack()) {
  const tracks = [track];
  return {
    tracks,
    getTracks: () => tracks,
    getAudioTracks: () => tracks.filter((item) => item.kind === 'audio'),
  };
}

function installMedia({ peerConnection, stream } = {}) {
  const PeerConnection = peerConnection ?? createPeerConnectionClass();
  globalThis.RTCPeerConnection = PeerConnection;
  const getUserMedia = jest.fn(async () => stream ?? createStream());
  Object.defineProperty(globalThis.navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia, enumerateDevices: jest.fn(async () => []) },
  });
  const audioElements = [];
  globalThis.Audio = class FakeAudio {
    constructor() {
      this.volume = 1;
      this.srcObject = null;
      this.pause = jest.fn();
      this.load = jest.fn();
      this.setSinkId = jest.fn(async () => undefined);
      audioElements.push(this);
    }
  };
  return { PeerConnection, getUserMedia, audioElements };
}

const audioSettings = (overrides = {}) => ({
  callVolume: 0.4,
  inputDeviceId: '',
  outputDeviceId: '',
  checkDevices: jest.fn(async () => undefined),
  ...overrides,
});

const context = (overrides = {}) => ({
  callId: 'call-1',
  direction: 'outbound',
  stunServers: ['stun.example.com'],
  ...overrides,
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'RTCPeerConnection');
  Reflect.deleteProperty(globalThis, 'Audio');
  Reflect.deleteProperty(globalThis.navigator, 'mediaDevices');
});

describe('createIceServers', () => {
  it('maps stun hosts to ICE server urls', () => {
    expect(createIceServers(['a.example', 'b.example'])).toEqual([
      { urls: 'stun:a.example' },
      { urls: 'stun:b.example' },
    ]);
  });
});

describe('BrowserWebRtcSession SDP', () => {
  it('produces a local offer and applies ICE config', async () => {
    const { PeerConnection } = installMedia();
    const session = new BrowserWebRtcSession(context(), audioSettings());

    await expect(session.createOffer()).resolves.toBe('v=0 local-offer');
    expect(PeerConnection.instances[0].config).toEqual({
      iceServers: [{ urls: 'stun:stun.example.com' }],
    });
  });

  it('answers a remote offer with a local answer', async () => {
    const { PeerConnection } = installMedia();
    const session = new BrowserWebRtcSession(context(), audioSettings());

    await expect(session.createAnswer('v=0 remote-offer')).resolves.toBe(
      'v=0 local-answer',
    );
    expect(PeerConnection.instances[0].remoteDescription).toEqual({
      type: 'offer',
      sdp: 'v=0 remote-offer',
    });
  });

  it('applies a remote answer', async () => {
    const { PeerConnection } = installMedia();
    const session = new BrowserWebRtcSession(context(), audioSettings());
    await session.createOffer();

    await session.applyAnswer('v=0 remote-answer');

    expect(PeerConnection.instances[0].remoteDescription).toEqual({
      type: 'answer',
      sdp: 'v=0 remote-answer',
    });
  });

  it('forwards iceRestart to the peer connection', async () => {
    const { PeerConnection } = installMedia();
    const session = new BrowserWebRtcSession(context(), audioSettings());

    await session.createOffer({ iceRestart: true });

    expect(PeerConnection.instances[0].offerOptions).toEqual({
      iceRestart: true,
    });
  });

  it('throws when the peer connection yields no SDP', async () => {
    const PeerConnection = createPeerConnectionClass();
    PeerConnection.prototype.setLocalDescription = async function () {
      this.localDescription = undefined;
    };
    installMedia({ peerConnection: PeerConnection });
    const session = new BrowserWebRtcSession(context(), audioSettings());

    await expect(session.createOffer()).rejects.toThrow(
      'WebRTC did not produce a local SDP',
    );
  });

  describe('ICE gathering', () => {
    // Fake timers keep the 500ms fallback from firing, so these two tests can
    // distinguish "resolved by the null candidate" from "resolved by timeout".
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    /** Waits until the ICE listener is attached, without advancing the clock. */
    const waitForIceListener = async (peerConnection) => {
      for (let i = 0; i < 20 && !peerConnection.listeners.has('icecandidate'); i += 1) {
        await Promise.resolve();
      }
      return peerConnection.listeners.has('icecandidate');
    };

    it('resolves on the null candidate without waiting for the timeout', async () => {
      const PeerConnection = createPeerConnectionClass({
        iceGatheringState: 'gathering',
      });
      installMedia({ peerConnection: PeerConnection });
      const session = new BrowserWebRtcSession(context(), audioSettings());

      const pending = session.createOffer();
      expect(await waitForIceListener(PeerConnection.instances[0])).toBe(true);

      PeerConnection.instances[0].emit('icecandidate', { candidate: null });

      await expect(pending).resolves.toBe('v=0 local-offer');
      // The fallback timer must have been cleared, not merely outrun.
      expect(jest.getTimerCount()).toBe(0);
      expect(PeerConnection.instances[0].listeners.has('icecandidate')).toBe(
        false,
      );
    });

    it('ignores non-null candidates and falls back to the timeout', async () => {
      const PeerConnection = createPeerConnectionClass({
        iceGatheringState: 'gathering',
      });
      installMedia({ peerConnection: PeerConnection });
      const session = new BrowserWebRtcSession(context(), audioSettings());

      const pending = session.createOffer();
      expect(await waitForIceListener(PeerConnection.instances[0])).toBe(true);

      PeerConnection.instances[0].emit('icecandidate', {
        candidate: { candidate: 'host' },
      });
      expect(jest.getTimerCount()).toBe(1);

      jest.advanceTimersByTime(500);

      await expect(pending).resolves.toBe('v=0 local-offer');
    });

    it('does not wait at all when gathering is already complete', async () => {
      const PeerConnection = createPeerConnectionClass({
        iceGatheringState: 'complete',
      });
      installMedia({ peerConnection: PeerConnection });
      const session = new BrowserWebRtcSession(context(), audioSettings());

      await expect(session.createOffer()).resolves.toBe('v=0 local-offer');
      expect(PeerConnection.instances[0].listeners.has('icecandidate')).toBe(
        false,
      );
    });
  });
});

describe('BrowserWebRtcSession media control', () => {
  it('attaches the remote stream to its own audio element', async () => {
    const { PeerConnection, audioElements } = installMedia();
    const session = new BrowserWebRtcSession(
      context(),
      audioSettings({ outputDeviceId: 'speaker-2' }),
    );
    await session.createOffer();

    const remote = createStream(createTrack('remote'));
    PeerConnection.instances[0].ontrack({
      streams: [remote],
      track: remote.tracks[0],
    });

    expect(audioElements[0].srcObject).toBe(remote);
    expect(audioElements[0].volume).toBe(0.4);
    expect(audioElements[0].setSinkId).toHaveBeenCalledWith('speaker-2');
  });

  it('mutes and unmutes the outbound track', async () => {
    const track = createTrack();
    installMedia({ stream: createStream(track) });
    const session = new BrowserWebRtcSession(context(), audioSettings());
    await session.createOffer();

    session.setMuted(true);
    expect(track.enabled).toBe(false);
    session.setMuted(false);
    expect(track.enabled).toBe(true);
  });

  it('applies a pre-existing mute to a freshly captured track', async () => {
    const track = createTrack();
    installMedia({ stream: createStream(track) });
    const session = new BrowserWebRtcSession(context(), audioSettings());

    session.setMuted(true);
    await session.createOffer();

    expect(track.enabled).toBe(false);
  });

  it('replaces the sender track when changing input device', async () => {
    const original = createTrack('mic-1');
    const replacement = createTrack('mic-2');
    const { PeerConnection, getUserMedia } = installMedia({
      stream: createStream(original),
    });
    const session = new BrowserWebRtcSession(context(), audioSettings());
    await session.createOffer();
    getUserMedia.mockResolvedValueOnce(createStream(replacement));

    await session.changeInputDevice('mic-2');

    const [sender] = PeerConnection.instances[0].getSenders();
    expect(sender.replaceTrack).toHaveBeenCalledWith(replacement);
    expect(getUserMedia).toHaveBeenLastCalledWith({
      audio: { deviceId: { exact: 'mic-2' } },
      video: false,
    });
    // The superseded microphone must be released.
    expect(original.stop).toHaveBeenCalled();
  });

  it('stops the candidate stream when replaceTrack fails', async () => {
    const replacement = createTrack('mic-2');
    const { PeerConnection, getUserMedia } = installMedia();
    const session = new BrowserWebRtcSession(context(), audioSettings());
    await session.createOffer();
    const [sender] = PeerConnection.instances[0].getSenders();
    sender.replaceTrack.mockRejectedValueOnce(new Error('nope'));
    getUserMedia.mockResolvedValueOnce(createStream(replacement));

    await expect(session.changeInputDevice('mic-2')).rejects.toThrow('nope');
    expect(replacement.stop).toHaveBeenCalled();
  });

  it('routes output device changes through setSinkId', async () => {
    const { PeerConnection, audioElements } = installMedia();
    const session = new BrowserWebRtcSession(context(), audioSettings());
    await session.createOffer();
    const remote = createStream(createTrack('remote'));
    PeerConnection.instances[0].ontrack({
      streams: [remote],
      track: remote.tracks[0],
    });

    await session.changeOutputDevice('speaker-9');

    expect(audioElements[0].setSinkId).toHaveBeenCalledWith('speaker-9');
  });

  it('sends DTMF through the sender dtmf channel', async () => {
    const { PeerConnection } = installMedia();
    const session = new BrowserWebRtcSession(context(), audioSettings());
    await session.createOffer();

    session.sendDtmf('12#', 100, 70);

    const [sender] = PeerConnection.instances[0].getSenders();
    expect(sender.dtmf.insertDTMF).toHaveBeenCalledWith('12#', 100, 70);
  });

  it('applies volume to the audio element', async () => {
    const { PeerConnection, audioElements } = installMedia();
    const session = new BrowserWebRtcSession(context(), audioSettings());
    await session.createOffer();
    const remote = createStream(createTrack('remote'));
    PeerConnection.instances[0].ontrack({
      streams: [remote],
      track: remote.tracks[0],
    });

    session.setVolume(0.9);

    expect(audioElements[0].volume).toBe(0.9);
  });
});

describe('BrowserWebRtcSession noise reduction', () => {
  it('runs the denoiser over the captured stream when enabled', async () => {
    installMedia();
    const noiseReduction = {
      enabled: true,
      denoiser: jest.fn(async () => undefined),
      reset: jest.fn(),
    };
    const session = new BrowserWebRtcSession(
      context(),
      audioSettings(),
      noiseReduction,
    );

    await session.createOffer();

    expect(noiseReduction.denoiser).toHaveBeenCalledWith(
      'call-1',
      expect.anything(),
    );
  });

  it('skips the denoiser when disabled', async () => {
    installMedia();
    const noiseReduction = {
      enabled: false,
      denoiser: jest.fn(),
      reset: jest.fn(),
    };
    const session = new BrowserWebRtcSession(
      context(),
      audioSettings(),
      noiseReduction,
    );

    await session.createOffer();

    expect(noiseReduction.denoiser).not.toHaveBeenCalled();
  });

  it('keeps the raw stream when the denoiser throws', async () => {
    installMedia();
    const noiseReduction = {
      enabled: true,
      denoiser: jest.fn(async () => {
        throw new Error('krisp unavailable');
      }),
      reset: jest.fn(),
    };
    const session = new BrowserWebRtcSession(
      context(),
      audioSettings(),
      noiseReduction,
    );

    await expect(session.createOffer()).resolves.toBe('v=0 local-offer');
  });

  it('resets the denoiser on dispose', async () => {
    installMedia();
    const noiseReduction = {
      enabled: true,
      denoiser: jest.fn(async () => undefined),
      reset: jest.fn(),
    };
    const session = new BrowserWebRtcSession(
      context(),
      audioSettings(),
      noiseReduction,
    );
    await session.createOffer();

    session.dispose();

    expect(noiseReduction.reset).toHaveBeenCalledWith('call-1');
  });
});

describe('stopSessionAudio / restoreSessionAudio', () => {
  it('disables the outbound track instead of stopping it', async () => {
    const track = createTrack();
    const { PeerConnection } = installMedia({ stream: createStream(track) });
    const session = new BrowserWebRtcSession(context(), audioSettings());
    await session.createOffer();

    await session.stopSessionAudio();

    // Stopping it would leave the sender with an `ended` source through the
    // greeting wait, so the encoder restarts on replaceTrack and the start of
    // the recorded message is lost.
    expect(track.enabled).toBe(false);
    expect(track.stop).not.toHaveBeenCalled();
    expect(PeerConnection.instances[0].closed).toBe(false);
  });

  it('detaches the remote audio element but keeps the receiver track live', async () => {
    const remoteTrack = createTrack('remote');
    const PeerConnection = createPeerConnectionClass({
      receivers: [{ track: remoteTrack }],
    });
    const { audioElements } = installMedia({ peerConnection: PeerConnection });
    const session = new BrowserWebRtcSession(context(), audioSettings());
    await session.createOffer();
    const remote = { getTracks: () => [remoteTrack] };
    PeerConnection.instances[0].ontrack({
      streams: [remote],
      track: remoteTrack,
    });

    await session.stopSessionAudio();

    expect(audioElements[0].srcObject).toBeNull();
    // Greeting detection reads this track, so it must stay live.
    expect(remoteTrack.stop).not.toHaveBeenCalled();
  });

  it('re-enables the outbound track on restore', async () => {
    const track = createTrack();
    installMedia({ stream: createStream(track) });
    const session = new BrowserWebRtcSession(context(), audioSettings());
    await session.createOffer();
    await session.stopSessionAudio();

    session.restoreSessionAudio();

    expect(track.enabled).toBe(true);
  });

  it('does not unmute a call the user had muted', async () => {
    const track = createTrack();
    installMedia({ stream: createStream(track) });
    const session = new BrowserWebRtcSession(context(), audioSettings());
    await session.createOffer();
    session.setMuted(true);
    await session.stopSessionAudio();

    session.restoreSessionAudio();

    expect(track.enabled).toBe(false);
  });
});

describe('kept voice channel (RingCX offhook session)', () => {
  async function setUp({ muted = false } = {}) {
    const micTrack = createTrack('mic');
    const remoteTrack = createTrack('remote');
    const PeerConnection = createPeerConnectionClass({
      receivers: [{ track: remoteTrack }],
    });
    const { audioElements } = installMedia({
      peerConnection: PeerConnection,
      stream: createStream(micTrack),
    });
    const noiseReduction = {
      enabled: true,
      denoiser: jest.fn(async () => undefined),
      reset: jest.fn(async () => undefined),
    };
    const session = new BrowserWebRtcSession(
      context(),
      audioSettings(),
      noiseReduction,
    );
    if (muted) session.setMuted(true);
    await session.createOffer();
    const peerConnection = PeerConnection.instances[0];
    const remote = { getTracks: () => [remoteTrack] };
    peerConnection.ontrack({ streams: [remote], track: remoteTrack });
    const audio = audioElements[0];
    audio.play = jest.fn(async () => undefined);
    const [sender] = peerConnection.getSenders();
    return { session, sender, micTrack, remote, audio, noiseReduction };
  }

  it('only silences the outbound track when keeping the voice channel', async () => {
    const { session, micTrack, remote, audio, noiseReduction } = await setUp();

    await session.stopSessionAudio({ keepVoiceChannel: true });

    expect(micTrack.enabled).toBe(false);
    expect(micTrack.stop).not.toHaveBeenCalled();
    // Resetting noise reduction would leave the mic silent on the next call.
    expect(noiseReduction.reset).not.toHaveBeenCalled();
    // The agent keeps hearing the CX call.
    expect(audio.srcObject).toBe(remote);
  });

  it('keeps the old behaviour without the option', async () => {
    const { session, micTrack, audio, noiseReduction } = await setUp();

    await session.stopSessionAudio();

    expect(micTrack.enabled).toBe(false);
    expect(noiseReduction.reset).toHaveBeenCalledWith('call-1');
    expect(audio.srcObject).toBeNull();
  });

  it('puts the microphone track back, re-enables it and re-attaches the speaker', async () => {
    const { session, sender, micTrack, remote, audio } = await setUp();
    // A drop left its own track on the sender and the speaker detached.
    const dropTrack = createTrack('drop');
    await sender.replaceTrack(dropTrack);
    await session.stopSessionAudio();
    sender.replaceTrack.mockClear();

    await session.restoreVoiceChannel();

    expect(sender.replaceTrack).toHaveBeenCalledWith(micTrack);
    expect(sender.track).toBe(micTrack);
    expect(micTrack.enabled).toBe(true);
    expect(audio.srcObject).toBe(remote);
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  it('does not unmute a channel the agent had muted', async () => {
    const { session, micTrack } = await setUp({ muted: true });
    await session.stopSessionAudio({ keepVoiceChannel: true });

    await session.restoreVoiceChannel();

    expect(micTrack.enabled).toBe(false);
  });

  it('leaves a sender that already carries the microphone and a live speaker alone', async () => {
    const { session, sender, micTrack, remote, audio } = await setUp();
    await session.stopSessionAudio({ keepVoiceChannel: true });

    await session.restoreVoiceChannel();

    expect(sender.replaceTrack).not.toHaveBeenCalled();
    expect(micTrack.enabled).toBe(true);
    expect(audio.srcObject).toBe(remote);
    expect(audio.play).not.toHaveBeenCalled();
  });

  it('is idempotent', async () => {
    const { session, sender, micTrack, remote, audio } = await setUp();
    await sender.replaceTrack(createTrack('drop'));
    await session.stopSessionAudio();
    sender.replaceTrack.mockClear();

    await session.restoreVoiceChannel();
    await session.restoreVoiceChannel();

    expect(sender.replaceTrack).toHaveBeenCalledTimes(1);
    expect(sender.track).toBe(micTrack);
    expect(micTrack.enabled).toBe(true);
    expect(audio.srcObject).toBe(remote);
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  it('swallows a rejected speaker play', async () => {
    const { session, audio } = await setUp();
    await session.stopSessionAudio();
    audio.play.mockRejectedValueOnce(new Error('NotAllowedError'));

    await expect(session.restoreVoiceChannel()).resolves.toBeUndefined();
    await Promise.resolve();
  });

  it('is a no-op before media exists', async () => {
    installMedia();
    const session = new BrowserWebRtcSession(context(), audioSettings());

    await expect(session.restoreVoiceChannel()).resolves.toBeUndefined();
  });
});

describe('BrowserWebRtcSession teardown', () => {
  it('closes the peer connection, stops tracks and clears audio', async () => {
    const track = createTrack();
    const { PeerConnection, audioElements } = installMedia({
      stream: createStream(track),
    });
    const onDispose = jest.fn();
    const session = new BrowserWebRtcSession(
      context(),
      audioSettings(),
      undefined,
      onDispose,
    );
    await session.createOffer();
    const remote = createStream(createTrack('remote'));
    PeerConnection.instances[0].ontrack({
      streams: [remote],
      track: remote.tracks[0],
    });

    session.dispose();

    expect(PeerConnection.instances[0].closed).toBe(true);
    expect(track.stop).toHaveBeenCalled();
    expect(audioElements[0].srcObject).toBeNull();
    expect(onDispose).toHaveBeenCalledTimes(1);
    expect(session.disposed).toBe(true);
  });

  it('is idempotent', async () => {
    installMedia();
    const onDispose = jest.fn();
    const session = new BrowserWebRtcSession(
      context(),
      audioSettings(),
      undefined,
      onDispose,
    );
    await session.createOffer();

    session.dispose();
    session.dispose();

    expect(onDispose).toHaveBeenCalledTimes(1);
  });

  it('notifies disposed listeners, and fires immediately if already disposed', async () => {
    installMedia();
    const session = new BrowserWebRtcSession(context(), audioSettings());
    const handler = jest.fn();
    const removed = jest.fn();
    session.once('disposed', handler);
    session.once('disposed', removed);
    session.off('disposed', removed);

    session.dispose();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(removed).not.toHaveBeenCalled();

    const late = jest.fn();
    session.once('disposed', late);
    expect(late).toHaveBeenCalledTimes(1);
  });

  it('rejects SDP work after dispose', async () => {
    installMedia();
    const session = new BrowserWebRtcSession(context(), audioSettings());
    session.dispose();

    await expect(session.createOffer()).rejects.toThrow(
      'WebRTC session is disposed',
    );
  });

  it('exposes the audio sender and remote track for voicemail drop', async () => {
    const remoteTrack = createTrack('remote');
    const PeerConnection = createPeerConnectionClass({
      receivers: [{ track: remoteTrack }],
    });
    installMedia({ peerConnection: PeerConnection });
    const session = new BrowserWebRtcSession(context(), audioSettings());
    await session.createOffer();

    expect(session.rtcPeerConnection).toBe(PeerConnection.instances[0]);
    expect(session.audioSender).toBe(PeerConnection.instances[0].senders[0]);
    expect(session.remoteAudioTrack).toBe(remoteTrack);
  });
});
