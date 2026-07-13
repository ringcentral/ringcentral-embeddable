/** @jest-environment jsdom */
import { EventEmitter } from 'events';

import proxyActionTypes from '@ringcentral-integration/commons/lib/proxy/baseActionTypes';
import { mergeEvents } from '@ringcentral-integration/commons/modules/ConferenceCall/lib';
import { setStagedState } from '@ringcentral-integration/core/lib/usm-redux/utils';

import lockRefresh from '../../src/lib/lockRefresh';
import { AudioDeviceManager, RingtoneHelper } from '../../src/modules/WebphoneV2/AudioDeviceManager';
import { ConferenceCall } from '../../src/modules/ConferenceCall';
import { Environment } from '../../src/modules/Environment';
import { GlobalStorage } from '../../src/modules/GlobalStorage';
import { SmsTypingTimeTracker } from '../../src/modules/SmsTypingTimeTracker';

jest.mock('@ringcentral/sdk', () => ({
  SDK: jest.fn(function SDK(config) {
    this.config = config;
  }),
}));

jest.mock('../../src/lib/lockRefresh', () => jest.fn((service) => ({
  locked: service,
})));

function createAudioElement() {
  return {
    currentTime: 10,
    loop: false,
    pause: jest.fn(),
    play: jest.fn(() => Promise.resolve()),
    setSinkId: jest.fn(() => Promise.resolve()),
    src: '',
    volume: 1,
  };
}

function createConference(overrides = {}) {
  const conference = new ConferenceCall({
    conferenceCallOptions: {
      multipleTabsSupport: false,
    },
    tabManager: {},
    webphone: {
      disconnected: true,
      isWebphoneActiveTab: true,
      multipleTabsSupport: false,
    },
  });
  Object.assign(conference, {
    _deps: {
      webphone: {
        disconnected: true,
        isWebphoneActiveTab: true,
      },
    },
    _eventEmitter: new EventEmitter(),
    _multipleTabsTransport: {
      response: jest.fn(),
    },
    _proxyActionTypes: proxyActionTypes,
    conferences: [{ id: 'conference-1' }],
    conferenceCallStatus: 'connected',
    currentConferenceId: 'conference-1',
    isMerging: true,
    mergingPair: { fromSessionId: 's1', toSessionId: 's2' },
    ...overrides,
  });
  return conference;
}

function createEnvironment(overrides = {}) {
  return Object.assign(Object.create(Environment.prototype), {
    _deps: {
      client: {
        service: null,
      },
      sdkConfig: {
        clientId: 'default-client',
        clientSecret: 'default-secret',
        server: 'https://platform.ringcentral.com',
      },
    },
    clientId: '',
    clientSecret: '',
    enabled: false,
    recordingHostState: '',
    server: '',
    updateChangeCounter: jest.fn(),
    ...overrides,
  });
}

describe('small module coverage', () => {
  beforeEach(() => {
    setStagedState({});
  });

  afterEach(() => {
    setStagedState(undefined);
    delete global.Audio;
    jest.restoreAllMocks();
  });

  it('resolves webphone audio devices and controls ringtone audio state', async () => {
    const audioSettings = {
      availableOutputDevices: [],
      inputDeviceId: 'microphone-1',
      outputDeviceId: 'speaker-1',
    };
    const manager = new AudioDeviceManager(audioSettings);
    await expect(manager.getInputDeviceId()).resolves.toBe('microphone-1');
    await expect(manager.getOutputDeviceId()).resolves.toBeUndefined();
    audioSettings.availableOutputDevices = [{ deviceId: 'speaker-1' }];
    await expect(manager.getOutputDeviceId()).resolves.toBe('speaker-1');

    const logger = {
      error: jest.fn(),
    };
    const audio = createAudioElement();
    global.Audio = jest.fn(() => audio);
    const ringtone = new RingtoneHelper({
      audioUri: 'ringtone.mp3',
      logger,
    });

    ringtone.setVolume(-1);
    ringtone.setVolume(0.25);
    ringtone.setEnabled(false);
    ringtone.play();
    expect(global.Audio).not.toHaveBeenCalled();

    ringtone.setEnabled(true);
    ringtone.setDeviceId('speaker-1');
    ringtone.play();
    expect(audio.loop).toBe(true);
    expect(audio.src).toBe('ringtone.mp3');
    expect(audio.volume).toBe(0.25);
    expect(audio.currentTime).toBe(0);
    expect(audio.setSinkId).toHaveBeenCalledWith('speaker-1');
    expect(audio.play).toHaveBeenCalled();

    audio.setSinkId.mockRejectedValueOnce(new Error('sink failed'));
    ringtone.setDeviceId('speaker-2');
    await Promise.resolve();
    await Promise.resolve();
    expect(logger.error).toHaveBeenCalledWith('setSinkId error:', expect.any(Error));

    ringtone.stop();
    await Promise.resolve();
    await Promise.resolve();
    expect(audio.pause).toHaveBeenCalled();
    expect(audio.src).toBe('');

    const muted = new RingtoneHelper({
      audioUri: '',
      logger,
    });
    muted.play();
    expect(global.Audio).toHaveBeenCalledTimes(1);
  });

  it('syncs conference state through localStorage and handles multiple-tab requests', async () => {
    const conference = createConference();
    ConferenceCall.prototype._syncStateToStorage.call(conference);

    Object.assign(conference, {
      conferences: [],
      conferenceCallStatus: 'idle',
      currentConferenceId: null,
      isMerging: false,
      mergingPair: null,
    });
    ConferenceCall.prototype._syncStateFromStorage.call(conference);
    expect(conference.conferences).toEqual([{ id: 'conference-1' }]);
    expect(conference.conferenceCallStatus).toBe('connected');
    expect(conference.mergingPair).toEqual({ fromSessionId: 's1', toSessionId: 's2' });
    expect(conference.currentConferenceId).toBe('conference-1');
    expect(conference.isMerging).toBe(true);

    const syncSpy = jest.fn();
    ConferenceCall.prototype._initMultipleTabsStateSyncing.call({
      _syncStateFromStorage: syncSpy,
    });
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'conference-state-sync',
    }));
    expect(syncSpy).toHaveBeenCalled();

    const mergeHandler = jest.fn();
    conference._eventEmitter.on(mergeEvents.mergeSucceeded, mergeHandler);
    conference._onMultipleTabsChannelBroadcast({
      event: mergeEvents.mergeSucceeded,
      message: ['merged-session'],
    });
    expect(mergeHandler).toHaveBeenCalledWith('merged-session');

    conference.sum = jest.fn(async (a, b) => a + b);
    await conference._onMultipleTabsChannelRequest({
      payload: {
        args: [2, 3],
        functionPath: `${conference.modulePath}.sum`,
        type: proxyActionTypes.execute,
      },
      requestId: 'request-1',
    });
    expect(conference._multipleTabsTransport.response).toHaveBeenCalledWith({
      error: undefined,
      requestId: 'request-1',
      result: 5,
    });

    conference.thrower = jest.fn(async () => {
      throw new Error('failed');
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await conference._onMultipleTabsChannelRequest({
      payload: {
        args: [],
        functionPath: `${conference.modulePath}.thrower`,
        type: proxyActionTypes.execute,
      },
      requestId: 'request-2',
    });
    expect(conference._multipleTabsTransport.response).toHaveBeenCalledWith({
      error: 'failed',
      requestId: 'request-2',
      result: undefined,
    });

    conference._multipleTabsTransport.response.mockClear();
    await conference._onMultipleTabsChannelRequest({
      payload: {
        args: [],
        functionPath: `OtherModule.sum`,
        type: proxyActionTypes.execute,
      },
      requestId: 'request-3',
    });
    await conference._onMultipleTabsChannelRequest({
      payload: {
        args: [],
        functionPath: `${conference.modulePath}.sum`,
        type: 'noop',
      },
      requestId: 'request-4',
    });
    expect(conference._multipleTabsTransport.response).not.toHaveBeenCalled();
  });

  it('builds environment SDK config and migrates legacy global storage keys', async () => {
    const environment = createEnvironment();
    expect(Environment.prototype.getSdkConfig.call(environment)).toEqual({
      clientId: 'default-client',
      clientSecret: 'default-secret',
      server: 'https://platform.ringcentral.com',
    });

    Object.assign(environment, {
      clientId: 'custom-client',
      clientSecret: '',
      enabled: true,
      server: 'https://platform.devtest.ringcentral.com',
    });
    expect(Environment.prototype.getSdkConfig.call(environment)).toEqual({
      clientId: 'custom-client',
      discoveryServer: 'https://platform.devtest.ringcentral.com',
      server: 'https://platform.devtest.ringcentral.com',
    });
    environment.clientSecret = 'custom-secret';
    const getEnvironmentName = Object.getOwnPropertyDescriptor(
      Environment.prototype,
      'environmentName',
    ).get;
    expect(getEnvironmentName.call(environment)).toBe('Sandbox');
    Environment.prototype.changeEnvironment.call(environment);
    expect(lockRefresh).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          clientId: 'custom-client',
          clientSecret: 'custom-secret',
        }),
      }),
    );
    expect(environment._deps.client.service).toEqual({
      locked: expect.any(Object),
    });

    await Environment.prototype.setData.call(environment, {
      clientId: 'custom-client-2',
      clientSecret: 'custom-secret-2',
      enabled: true,
      recordingHost: 'https://recording.example.com',
      server: 'https://platform.ringcentral.com',
    });
    expect(environment.clientId).toBe('custom-client-2');
    expect(environment.updateChangeCounter).toHaveBeenCalled();
    expect(getEnvironmentName.call(environment)).toBe('Production');

    const storage = {
      removeItem: jest.fn(async () => {}),
      setItem: jest.fn(),
    };
    const globalStorage = Object.assign(Object.create(GlobalStorage.prototype), {
      _migratedKeys: [],
      _migratedNewKeys: [],
      _storage: storage,
      storedData: {
        environmentAppKey: 'old-client',
        environmentAppSecret: 'old-secret',
        environmentEnabled: true,
        environmentServer: 'https://platform.devtest.ringcentral.com',
      },
    });
    await globalStorage._migrateOldData();
    expect(globalStorage.storedData).toMatchObject({
      'environment-clientId': 'old-client',
      'environment-clientSecret': 'old-secret',
      'environment-enabled': true,
      'environment-server': 'https://platform.devtest.ringcentral.com',
    });
    expect(storage.removeItem).toHaveBeenCalledWith('environmentServer');
    expect(storage.setItem).toHaveBeenCalledWith('environment-clientId', 'old-client');

    jest.spyOn(console, 'error').mockImplementation(() => {});
    const failingStorage = Object.assign(Object.create(GlobalStorage.prototype), {
      _migratedKeys: [],
      _migratedNewKeys: [],
      _storage: {
        removeItem: jest.fn(async () => {
          throw new Error('remove failed');
        }),
      },
      storedData: {
        environmentServer: 'https://platform.devtest.ringcentral.com',
      },
    });
    await failingStorage._migrateOldData();
    expect(console.error).toHaveBeenCalledWith(
      'migrate old region data error: ',
      expect.any(Error),
    );
  });

  it('tracks SMS typing durations across start, pause, resume, stop, and clear', () => {
    const tracker = Object.assign(Object.create(SmsTypingTimeTracker.prototype), {
      _deps: {
        smsTypingTimeTrackerOptions: {
          enableTypingTimeTracking: false,
        },
      },
      _enabledOverride: null,
      _typingStartTimes: {},
      accumulatedTypingTimes: {},
      typingTimeMap: {},
    });

    tracker.startTyping('thread-1');
    expect(tracker._typingStartTimes).toEqual({});
    tracker.setEnabled(true);
    expect(tracker.enabled).toBe(true);

    jest.spyOn(Date, 'now')
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(2500)
      .mockReturnValueOnce(5000)
      .mockReturnValueOnce(7000)
      .mockReturnValueOnce(9000);

    tracker.startTyping('thread-1');
    tracker.pauseTyping('thread-1');
    expect(tracker.accumulatedTypingTimes['thread-1']).toBe(1500);
    tracker.startTyping('thread-1');
    tracker.stopTyping('thread-1', 'message-1');
    expect(tracker.getTypingTime('message-1')).toBe(3500);
    expect(tracker.accumulatedTypingTimes['thread-1']).toBeUndefined();
    tracker.startTyping('thread-2');
    tracker.clearTyping('thread-2');
    expect(tracker._typingStartTimes['thread-2']).toBeUndefined();
    tracker.setEnabled(false);
    tracker.startTyping('thread-3');
    expect(tracker._typingStartTimes['thread-3']).toBeUndefined();
  });
});
