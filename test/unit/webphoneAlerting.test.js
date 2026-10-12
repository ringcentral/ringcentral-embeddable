const { watch, systemRoles } = require('@ringcentral-integration/next-core');
const { BehaviorSubject } = require('rxjs');

const {
  WebphoneAlerting,
} = require('../../src/app/services/WebphoneAlerting/WebphoneAlerting');
const {
  lastInteractedClientRole,
} = require('../../src/app/services/ClientInteraction');

const RINGING = {
  id: 'call-1',
  direction: 'Inbound',
  callStatus: 'webphone-session-connecting',
};
const ANSWERED = {
  id: 'call-1',
  direction: 'Inbound',
  callStatus: 'webphone-session-connected',
};

const owned = (role, clientId) => ({
  phase: 'owned',
  role,
  revision: 1,
  owners: [{ clientId }],
});

function installAudio({ fail = false } = {}) {
  const instances = [];
  globalThis.Audio = class FakeAudio {
    constructor() {
      this.src = '';
      this.loop = false;
      this.volume = 1;
      this.currentTime = 0;
      this.setSinkId = jest.fn(async () => undefined);
      this.pause = jest.fn();
      this.load = jest.fn();
      this.removeAttribute = jest.fn();
      this.play = jest.fn(async () => {
        if (fail) {
          const error = new Error('play() failed because the user agent ...');
          error.name = 'NotAllowedError';
          throw error;
        }
      });
      instances.push(this);
    }
  };
  return instances;
}

function create({ shared = false, isServer = true, sessions = [] } = {}) {
  const subjects = new Map();
  const subjectFor = (role) => {
    if (!subjects.has(role)) {
      subjects.set(role, new BehaviorSubject({
        phase: 'unavailable',
        role,
        revision: 0,
        owners: [],
      }));
    }
    return subjects.get(role);
  };
  const webphone = { sessions, incomingAudio: 'data:audio/mp3;base64,AAA' };
  const audioSettings = { ringtoneDeviceId: 'default', ringtoneVolume: 0.7 };
  const portManager = {
    shared,
    isServer,
    isClient: !isServer,
    subjectFor,
    getRoleStateStreams: jest.fn((role) => ({
      roleState$: subjectFor(role),
      roleTransition$: subjectFor(role),
    })),
  };
  watch.mockClear();
  const alerting = new WebphoneAlerting(webphone, audioSettings, portManager);
  alerting.logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  return {
    alerting,
    webphone,
    audioSettings,
    portManager,
    // The mocked `watch` records but never invokes its callback.
    emitSessions: (next) => {
      const call = watch.mock.calls.at(-1);
      call[2](next);
    },
  };
}

const flush = async () => {
  for (let i = 0; i < 12; i += 1) await Promise.resolve();
};

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'Audio');
  Reflect.deleteProperty(globalThis, 'Notification');
});

it('stays inactive on a shared client', () => {
  const { alerting, portManager } = create({ shared: true, isServer: false });
  alerting.onInit();
  expect(portManager.getRoleStateStreams).not.toHaveBeenCalled();
  expect(watch).not.toHaveBeenCalled();
});

it('plays the ringtone when an inbound call starts ringing', async () => {
  const audios = installAudio();
  const { alerting, emitSessions } = create();
  alerting.onInit();

  emitSessions([RINGING]);
  await flush();

  expect(audios).toHaveLength(1);
  expect(audios[0].play).toHaveBeenCalled();
  expect(audios[0].loop).toBe(true);
  expect(audios[0].volume).toBe(0.7);
});

it('stops the ringtone once the call is no longer ringing', async () => {
  const audios = installAudio();
  const { alerting, emitSessions } = create();
  alerting.onInit();

  emitSessions([RINGING]);
  await flush();
  emitSessions([ANSWERED]);
  await flush();

  expect(audios[0].pause).toHaveBeenCalled();
});

it('does not restart the ringtone while the same call keeps ringing', async () => {
  const audios = installAudio();
  const { alerting, emitSessions } = create();
  alerting.onInit();

  emitSessions([RINGING]);
  await flush();
  emitSessions([RINGING]);
  await flush();

  expect(audios[0].play).toHaveBeenCalledTimes(1);
});

it('skips playback when the ringtone device is off', async () => {
  const audios = installAudio();
  const { alerting, audioSettings, emitSessions } = create();
  audioSettings.ringtoneDeviceId = 'off';
  alerting.onInit();

  emitSessions([RINGING]);
  await flush();

  expect(audios).toHaveLength(0);
});

it('skips playback when the ringtone is switched off', async () => {
  const audios = installAudio();
  const { alerting, webphone, emitSessions } = create();
  webphone.incomingAudio = '';
  alerting.onInit();

  emitSessions([RINGING]);
  await flush();

  expect(audios).toHaveLength(0);
});

it('applies a non-default ringtone output device', async () => {
  const audios = installAudio();
  const { alerting, audioSettings, emitSessions } = create();
  audioSettings.ringtoneDeviceId = 'speaker-2';
  alerting.onInit();

  emitSessions([RINGING]);
  await flush();

  expect(audios[0].setSinkId).toHaveBeenCalledWith('speaker-2');
});

it('falls back to the elected client and a notification when autoplay is blocked', async () => {
  // This is the Chrome autoplay case: the chosen tab had no user gesture.
  installAudio({ fail: true });
  globalThis.Notification = class FakeNotification {
    constructor(title) {
      this.title = title;
      this.close = jest.fn();
    }
  };
  globalThis.Notification.permission = 'granted';

  const { alerting, portManager, emitSessions } = create({ shared: true });
  const electedSpy = jest.spyOn(alerting, '_playRingtoneOnElectedClient');
  alerting.onInit();
  portManager
    .subjectFor(lastInteractedClientRole.role)
    .next(owned(lastInteractedClientRole.role, 'tab-1'));

  emitSessions([RINGING]);
  await flush();

  expect(alerting.logger.warn).toHaveBeenCalledWith(
    'Webphone ringtone routing failed; using fallback',
    expect.anything(),
  );
  expect(electedSpy).toHaveBeenCalled();
});

it('reports notification unavailable without permission', async () => {
  const { alerting } = create();
  await expect(alerting.showNotification('e1')).resolves.toBe(false);
});

it('ignores a stale stop so a newer ring keeps playing', async () => {
  const audios = installAudio();
  const { alerting, emitSessions } = create();
  alerting.onInit();

  emitSessions([RINGING]);
  await flush();
  await alerting.stopRingtone('not-the-current-epoch');

  expect(audios[0].pause).not.toHaveBeenCalled();
});

it('recovers onto the new interacted client when the target disappears', async () => {
  installAudio();
  const { alerting, portManager, emitSessions } = create({ shared: true });
  alerting.onInit();

  const interacted = portManager.subjectFor(lastInteractedClientRole.role);
  const connected = portManager.subjectFor(systemRoles.connectedClients.role);
  interacted.next(owned(lastInteractedClientRole.role, 'tab-1'));
  connected.next(owned(systemRoles.connectedClients.role, 'tab-1'));

  emitSessions([RINGING]);
  await flush();

  // tab-1 goes away and tab-2 becomes the interacted client.
  connected.next(owned(systemRoles.connectedClients.role, 'tab-2'));
  interacted.next(owned(lastInteractedClientRole.role, 'tab-2'));
  await flush();

  expect(alerting.logger.info).toHaveBeenCalledWith(
    'Webphone ringtone target lost; recovering alert',
  );
});

it('stops any active alert on reset', async () => {
  const audios = installAudio();
  const { alerting, emitSessions } = create();
  alerting.onInit();
  emitSessions([RINGING]);
  await flush();

  alerting.onReset();
  await flush();

  expect(audios[0].pause).toHaveBeenCalled();
});
