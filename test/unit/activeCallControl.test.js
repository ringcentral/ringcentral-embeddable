const { EventEmitter } = require('events');

const { callDirection } = require('@ringcentral-integration/commons/enums/callDirections');
const { callControlError } = require('@ringcentral-integration/commons/modules/ActiveCallControl/callControlError');
const { webphoneErrors } = require('@ringcentral-integration/commons/modules/Webphone/webphoneErrors');
const { setStagedState } = require('@ringcentral-integration/core/lib/usm-redux/utils');
const {
  PartyStatusCode,
  ReplyWithPattern,
} = require('ringcentral-call-control/lib/Session');

const { ActiveCallControl } = require('../../src/modules/ActiveCallControl/ActiveCallControl');
const { CallControlEvents } = require('../../src/modules/ActiveCallControl/callControlEvents');

jest.mock('@ringcentral-integration/utils', () => ({
  ...jest.requireActual('@ringcentral-integration/utils'),
  sleep: jest.fn(async () => {}),
}));

function createAlert() {
  return {
    danger: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
  };
}

function createDeps(overrides = {}) {
  return {
    accountInfo: {
      info: { id: 'account-id' },
      mainCompanyNumber: '+16505550100',
    },
    activeCallControlOptions: {},
    alert: createAlert(),
    appFeatures: {
      hasCallControl: true,
      isEDPEnabled: false,
    },
    availabilityMonitor: {
      checkIfHAError: jest.fn(async () => false),
    },
    brand: {
      brandConfig: {
        allowRegionSettings: true,
      },
    },
    client: {
      service: {},
    },
    connectivityMonitor: {
      ready: true,
      connectivity: true,
    },
    extensionInfo: {
      info: {
        id: 'extension-id',
        extensionNumber: '101',
      },
    },
    numberValidate: {
      validate: jest.fn(() => ({ result: true })),
      validateNumbers: jest.fn(async () => ({
        result: true,
        numbers: [{ e164: '+16505550123' }],
      })),
      parseNumbers: jest.fn(async () => [{
        availableExtension: '102',
        parsedNumber: '+16505550102',
      }]),
    },
    presence: {
      calls: [{
        telephonySessionId: 'session-1',
        sessionId: 'platform-session-1',
        direction: callDirection.outbound,
        from: { phoneNumber: '+16505550100' },
        to: { phoneNumber: '+16505550123' },
        sipData: {
          fromTag: 'from-tag',
          toTag: 'to-tag',
        },
      }],
    },
    regionSettings: {
      areaCode: '650',
      countryCode: 'US',
      homeCountryId: '1',
    },
    routerInteraction: {
      currentPath: '/dialer',
    },
    subscription: {
      message: null,
      subscribe: jest.fn(async () => {}),
    },
    tabManager: {
      active: true,
    },
    webphone: {
      answer: jest.fn(async () => {}),
      device: { id: 'device-id' },
      ignore: jest.fn(async () => {}),
      makeCall: jest.fn(async () => null),
      replyWithMessage: jest.fn(async () => {}),
      sendDTMF: jest.fn(async () => {}),
      sessions: [{
        id: 'webphone-1',
        isOnMute: true,
        partyData: {
          sessionId: 'session-1',
        },
      }],
      switchCall: jest.fn(async () => ({ id: 'webphone-switched' })),
    },
    ...overrides,
  };
}

function createTelephonySession(overrides = {}) {
  const { party: partyOverrides = {}, ...sessionOverrides } = overrides;
  const session = new EventEmitter();
  const on = session.on.bind(session);
  const removeListener = session.removeListener.bind(session);
  Object.assign(session, {
    id: 'session-1',
    accountId: 'account-id',
    creationTime: '2026-01-01T10:00:00.000Z',
    data: {
      id: 'session-1',
      sessionId: 'platform-session-1',
      creationTime: '2026-01-01T10:00:00.000Z',
    },
    otherParties: [],
    party: {
      id: 'party-1',
      direction: callDirection.outbound,
      from: { phoneNumber: '+16505550100', name: 'Agent' },
      to: { phoneNumber: '+16505550123', name: 'Customer' },
      status: { code: PartyStatusCode.answered },
      muted: false,
      recordings: [{ id: 'recording-1', active: true }],
      ...partyOverrides,
    },
    recordings: [{ id: 'recording-1', active: true }],
    serverId: 'server-id',
    sessionId: 'session-1',
    voiceCallToken: 'voice-call-token',
    answer: jest.fn(async () => {}),
    bridge: jest.fn(async () => {}),
    createRecord: jest.fn(async () => {}),
    drop: jest.fn(async () => {}),
    flip: jest.fn(async () => {}),
    forward: jest.fn(async () => {}),
    hold: jest.fn(async () => {}),
    mute: jest.fn(async () => {}),
    on: jest.fn((...args) => on(...args)),
    pauseRecord: jest.fn(async () => {}),
    removeListener: jest.fn((...args) => removeListener(...args)),
    resumeRecord: jest.fn(async () => {}),
    toVoicemail: jest.fn(async () => {}),
    transfer: jest.fn(async () => {}),
    unhold: jest.fn(async () => {}),
    unmute: jest.fn(async () => {}),
    ...sessionOverrides,
  });
  return session;
}

function createControl({ deps = createDeps(), sessions = [] } = {}) {
  const control = Object.create(ActiveCallControl.prototype);
  Object.assign(control, {
    _connectivity: false,
    _deps: deps,
    _lastSubscriptionMessage: null,
    _onCallEndFunc: jest.fn(),
    _onCallSwitchedFunc: jest.fn(),
    _permissionCheck: true,
    _polling: false,
    _promise: null,
    _rcCallControl: {
      loadSessions: jest.fn(async () => {}),
      onNotificationEvent: jest.fn(),
      sessions,
    },
    _updateSessionsHandler: () => {
      control.updateActiveSessions();
    },
    _updateSessionsStatusHandler: ({ party }) => {
      control.updateActiveSessions();
      if (party.status.code === PartyStatusCode.answered) {
        const telephonySession = control.sessions.find(
          (session) => session.party.id === party.id,
        );
        if (
          telephonySession &&
          telephonySession.telephonySessionId !== control.activeSessionId
        ) {
          control.setActiveSessionId(telephonySession.telephonySessionId);
        }
      }
    },
    _timeToRetry: 5,
    _timeoutId: null,
    _ttl: 1000,
    cachedSessions: [],
    data: {
      activeSessionId: null,
      busyTimestamp: 0,
      ringSessionId: null,
      sessions: [],
      timestamp: 0,
    },
    lastEndedSessionIds: [],
    onCallIgnoreFunc: jest.fn(),
    parentModule: {
      analytics: {
        getTrackTarget: jest.fn(() => ({ router: '/dialer' })),
        track: jest.fn(),
      },
      callLogSection: {
        show: false,
        showNotification: false,
      },
    },
    pickUpCallDataMap: {},
    transferCallMapping: {},
  });
  return control;
}

function createConflictError() {
  return {
    message: '409 Incorrect State',
    response: {
      _text: 'Incorrect State',
      clone: () => ({
        text: async () => 'Incorrect State',
      }),
    },
  };
}

describe('ActiveCallControl module methods', () => {
  beforeEach(() => {
    setStagedState({});
    jest.useFakeTimers();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    setStagedState(undefined);
    jest.restoreAllMocks();
  });

  it('syncs call-control sessions into active session state and computed getters', async () => {
    const activeSession = createTelephonySession();
    const ringingSession = createTelephonySession({
      id: 'ring-session',
      party: {
        id: 'ring-party',
        direction: callDirection.inbound,
        status: { code: PartyStatusCode.proceeding },
        recordings: [],
      },
      recordings: [],
      sessionId: 'ring-session',
    });
    const endedSession = createTelephonySession({
      id: 'ended-session',
      party: {
        status: { code: PartyStatusCode.disconnected, reason: 'Normal' },
      },
    });
    const control = createControl({
      sessions: [activeSession, ringingSession, endedSession],
    });

    control.updateActiveSessions();

    expect(control.sessions.map((session) => session.id)).toEqual([
      'session-1',
      'ring-session',
    ]);
    expect(control.currentDeviceCallsMap).toEqual({
      'session-1': 'webphone-1',
    });
    expect(control.ringSessions).toEqual([
      expect.objectContaining({ id: 'ring-session' }),
    ]);

    control.setActiveSessionId('session-1');
    expect(control.activeSession).toEqual(
      expect.objectContaining({
        id: 'session-1',
        isOnMute: true,
        recordStatus: 'webphone-record-recording',
      }),
    );
    expect(control.getSession('session-1')).toEqual(
      expect.objectContaining({ id: 'session-1' }),
    );
    expect(control.getActiveSession('missing')).toBeUndefined();
    expect(control.sessionIdToTelephonySessionIdMapping).toEqual({
      'platform-session-1': 'session-1',
    });
    expect(control.rcCallSessions.map((session) => session.id)).toEqual([
      'session-1',
      'ring-session',
    ]);
    expect(control.hasCallInRecording).toBe(true);
    expect(control.hasPermission).toBe(true);

    ringingSession.party.status.code = PartyStatusCode.answered;
    control._newSessionHandler(ringingSession);
    ringingSession.emit(CallControlEvents.status, { party: ringingSession.party });
    expect(ringingSession.on).toHaveBeenCalledWith(
      CallControlEvents.status,
      expect.any(Function),
    );
    expect(control.activeSessionId).toBe('ring-session');

    control.removeActiveSession();
    expect(control.activeSessionId).toBeNull();
    control.resetState();
    expect(control.sessions).toEqual([]);
  });

  it('handles subscription messages, fetches data, and reacts to connectivity recovery', async () => {
    const activeSession = createTelephonySession();
    const deps = createDeps({
      presence: {
        calls: [{ telephonySessionId: 'session-1', sessionId: 'platform-session-1' }],
      },
    });
    const control = createControl({ deps, sessions: [activeSession] });
    deps.subscription.message = {
      event: '/restapi/v1.0/account/~/extension/~/telephony/sessions',
      body: {
        origin: { type: 'RingOut' },
        parties: [{
          direction: 'Inbound',
          from: { phoneNumber: '+1' },
          ringOutRole: 'Initiator',
          to: { phoneNumber: '+2' },
        }],
      },
    };

    control._subscriptionHandler();
    expect(deps.subscription.message.body.parties[0]).toEqual({
      direction: 'Outbound',
      from: { phoneNumber: '+2' },
      ringOutRole: 'Initiator',
      to: { phoneNumber: '+1' },
    });
    expect(control._rcCallControl.onNotificationEvent).toHaveBeenCalledWith(
      deps.subscription.message,
    );

    await control.fetchData();
    expect(control._rcCallControl.loadSessions).toHaveBeenCalledWith(
      deps.presence.calls,
    );
    expect(control._promise).toBeNull();
    expect(control.sessions).toHaveLength(1);

    control.fetchData = jest.fn(async () => {});
    control._connectivity = false;
    control._checkConnectivity();
    expect(control.fetchData).toHaveBeenCalled();
    expect(control._shouldFetch()).toBe(true);
  });

  it('executes active call control success flows through session and webphone APIs', async () => {
    const session = createTelephonySession({
      party: {
        muted: true,
      },
    });
    const transferSession = createTelephonySession({
      id: 'session-2',
      party: {
        id: 'party-2',
        status: { code: PartyStatusCode.answered },
      },
    });
    const deps = createDeps();
    const control = createControl({ deps, sessions: [session, transferSession] });
    control.updateActiveSessions();
    control.setWarmTransferMapping('session-1', 'session-2');

    await control.mute('session-1');
    await control.unmute('session-1');
    expect(session.mute).toHaveBeenCalled();
    expect(session.unmute).toHaveBeenCalled();

    await expect(control.startRecord('session-1')).resolves.toBe(true);
    expect(session.resumeRecord).toHaveBeenCalledWith('recording-1');
    await control.stopRecord('session-1');
    expect(session.pauseRecord).toHaveBeenCalledWith('recording-1');

    await control.hold('session-1');
    await control.unhold('session-1');
    expect(session.hold).toHaveBeenCalled();
    expect(session.unhold).toHaveBeenCalled();
    expect(control.activeSessionId).toBe('session-1');

    await control.transfer('+16505550123', 'session-1');
    expect(session.transfer).toHaveBeenCalledWith({
      phoneNumber: '+16505550123',
    });
    expect(deps.alert.success).toHaveBeenCalledWith({
      message: callControlError.transferCompleted,
    });

    await expect(control.forward('102', 'session-1')).resolves.toBe(true);
    expect(session.forward).toHaveBeenCalledWith({ extensionNumber: '102' });
    expect(control._onCallEndFunc).toHaveBeenCalled();

    await control.toVoicemail('vm-1', 'session-1');
    expect(session.transfer).toHaveBeenCalledWith({ voicemail: 'vm-1' });

    await control.completeWarmTransfer('session-1');
    expect(session.bridge).toHaveBeenCalledWith({
      partyId: 'party-2',
      telephonySessionId: 'session-2',
    });

    await control.replyWithMessage(
      { replyWithPattern: { pattern: ReplyWithPattern.inAMeeting } },
      'session-1',
    );
    expect(deps.webphone.replyWithMessage).toHaveBeenCalledWith(
      'webphone-1',
      { replyType: 5 },
    );

    await control.flip('1', 'session-1');
    expect(session.flip).toHaveBeenCalledWith({ callFlipId: '1' });

    await control.sendDTMF('5', 'session-1');
    expect(deps.webphone.sendDTMF).toHaveBeenCalledWith('5', 'webphone-1');

    await control.switch('session-1');
    expect(deps.webphone.switchCall).toHaveBeenCalledWith(
      deps.presence.calls[0],
      '1',
    );
    expect(control._onCallSwitchedFunc).toHaveBeenCalledWith(
      'webphone-switched',
    );

    await control.hangUp('session-1');
    expect(session.drop).toHaveBeenCalled();
    expect(control.busyTimestamp).toBe(0);
  });

  it('answers, ignores, and maps warm-transfer outbound webphone progress', async () => {
    const session = createTelephonySession();
    const activeSession = createTelephonySession({
      id: 'active-session',
      party: {
        status: { code: PartyStatusCode.answered },
      },
    });
    const deps = createDeps();
    const control = createControl({ deps, sessions: [session, activeSession] });
    control.pickUpCall = jest.fn(async () => {});
    control._trackWebRTCCallAnswer = jest.fn();
    control.setPickUpCallData({
      'new-session': {
        fromNumber: '+16505550100',
        serverId: 'server-id',
        sessionId: 'new-session',
        toNumber: '+16505550123',
      },
    });

    await control.answer('session-1');
    expect(deps.webphone.answer).toHaveBeenCalledWith('webphone-1');
    expect(control._trackWebRTCCallAnswer).toHaveBeenCalled();

    deps.webphone.sessions = [];
    await control.answerAndHold('new-session');
    expect(control.pickUpCall).toHaveBeenCalledWith({
      fromNumber: '+16505550100',
      serverId: 'server-id',
      sessionId: 'new-session',
      toNumber: '+16505550123',
    });

    deps.webphone.sessions = [{
      id: 'webphone-1',
      partyData: { sessionId: 'session-1' },
    }];
    await control.ignore('session-1');
    expect(deps.webphone.ignore).toHaveBeenCalledWith('webphone-1');
    expect(control.onCallIgnoreFunc).toHaveBeenCalledWith('party-1');

    await control.answerAndEnd('session-1');
    expect(activeSession.drop).toHaveBeenCalled();
    expect(session.answer).toHaveBeenCalledWith({ deviceId: 'device-id' });

    const outboundSession = new EventEmitter();
    outboundSession.id = 'webphone-outbound';
    deps.webphone.makeCall.mockResolvedValue(outboundSession);
    await control.startWarmTransfer('102', 'session-1');
    outboundSession.sessionId = 'warm-session';
    outboundSession.emit('progress');
    expect(control.activeSessionId).toBe('warm-session');
    expect(control.transferCallMapping['session-1']).toEqual({
      isOriginal: true,
      relatedTelephonySessionId: 'warm-session',
    });

    control.data.sessions = [{ telephonySessionId: 'session-1' }];
    control.cleanCurrentWarmTransferData();
    expect(control.transferCallMapping).toEqual({});
  });

  it('shows conflict, validation, and recording errors through alerts', async () => {
    const session = createTelephonySession();
    const deps = createDeps();
    const control = createControl({ deps, sessions: [session] });
    const conflictError = createConflictError();

    session.mute.mockRejectedValueOnce(conflictError);
    await control.mute('session-1');
    expect(deps.alert.warning).toHaveBeenCalledWith({
      message: callControlError.muteConflictError,
    });

    session.unmute.mockRejectedValueOnce(conflictError);
    await control.unmute('session-1');
    expect(deps.alert.warning).toHaveBeenCalledWith({
      message: callControlError.unMuteConflictError,
    });

    session.hold.mockRejectedValueOnce(conflictError);
    await control.hold('session-1');
    expect(deps.alert.warning).toHaveBeenCalledWith({
      message: callControlError.holdConflictError,
    });

    session.unhold.mockRejectedValueOnce(conflictError);
    await control.unhold('session-1');
    expect(deps.alert.warning).toHaveBeenCalledWith({
      message: callControlError.unHoldConflictError,
    });

    session.startRecording = jest.fn();
    session.recordings = [];
    session.createRecord.mockRejectedValueOnce({
      response: {
        clone: () => ({
          json: async () => ({
            errors: [{ errorCode: 'REC-1' }],
          }),
        }),
      },
    });
    await control.startRecord('session-1');
    expect(deps.alert.danger).toHaveBeenCalledWith({
      message: webphoneErrors.recordError,
      payload: { errorCode: 'REC-1' },
    });

    deps.numberValidate.validateNumbers.mockResolvedValueOnce({
      result: false,
      errors: [{ phoneNumber: 'bad', type: 'numberParseError' }],
    });
    await expect(control.getValidPhoneNumber('bad')).resolves.toBeUndefined();
    expect(deps.alert.warning).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { phoneNumber: 'bad' },
      }),
    );

    session.forward.mockRejectedValueOnce(new Error('forward failed'));
    await expect(control.forward('+16505550123', 'session-1')).resolves.toBe(false);
    expect(deps.alert.warning).toHaveBeenCalledWith({
      message: webphoneErrors.forwardError,
    });
  });

  it('covers call-control fallbacks, EDP number parsing, tracking, and error exits', async () => {
    const queueSession = createTelephonySession({
      id: 'queue-session',
      party: {
        id: 'queue-party',
        queueCall: true,
        status: { code: PartyStatusCode.proceeding },
      },
    });
    const session = createTelephonySession();
    const transferSession = createTelephonySession({
      id: 'transfer-session',
      party: {
        id: 'transfer-party',
        status: { code: PartyStatusCode.answered },
      },
    });
    const deps = createDeps({
      appFeatures: {
        hasCallControl: true,
        isEDPEnabled: true,
      },
      numberValidate: {
        validate: jest.fn(() => ({ result: true })),
        validateNumbers: jest.fn(async () => ({
          result: true,
          numbers: [{ e164: '+16505550123' }],
        })),
        parseNumbers: jest.fn(async () => [{
          availableExtension: '102',
          parsedNumber: '+16505550102',
        }]),
      },
    });
    const control = createControl({
      deps,
      sessions: [session, queueSession, transferSession],
    });
    control.updateActiveSessions();

    control.ignore = jest.fn(async () => 'ignored');
    await expect(control.reject('queue-session')).resolves.toBe('ignored');
    expect(control.ignore).toHaveBeenCalledWith('queue-session');

    await control.reject('session-1');
    expect(session.toVoicemail).toHaveBeenCalled();
    session.toVoicemail.mockRejectedValueOnce(new Error('voicemail failed'));
    await control.reject('session-1');
    expect(deps.alert.warning).toHaveBeenCalledWith({
      message: callControlError.generalError,
    });

    deps.webphone.replyWithMessage.mockRejectedValueOnce(new Error('reply failed'));
    await control.replyWithMessage({
      replyText: 'Custom reply',
    }, 'session-1');
    expect(deps.alert.warning).toHaveBeenCalledWith({
      message: callControlError.generalError,
    });

    await expect(control.toVoicemail('vm-1', 'missing')).resolves.toBe(false);
    session.transfer.mockRejectedValueOnce(new Error('transfer to voicemail failed'));
    await control.toVoicemail('vm-1', 'session-1');
    expect(deps.alert.warning).toHaveBeenCalledWith({
      message: webphoneErrors.toVoiceMailError,
    });

    control.setWarmTransferMapping('session-1', 'transfer-session');
    await control.completeWarmTransfer('session-1');
    expect(session.bridge).toHaveBeenCalledWith({
      partyId: 'transfer-party',
      telephonySessionId: 'transfer-session',
    });
    session.bridge.mockRejectedValueOnce(new Error('bridge failed'));
    await control.completeWarmTransfer('session-1');
    expect(deps.alert.warning).toHaveBeenCalledWith({
      message: callControlError.generalError,
    });

    await expect(control.getValidPhoneNumber('102', true)).resolves.toBe('+16505550100*102');
    expect(deps.numberValidate.validate).toHaveBeenCalledWith(['102']);
    expect(deps.numberValidate.parseNumbers).toHaveBeenCalledWith(['102']);

    await control.transfer('102', 'session-1');
    expect(session.transfer).toHaveBeenCalledWith({
      phoneNumber: '+16505550100*102',
    });

    await expect(control.forward('102', 'session-1')).resolves.toBe(true);
    expect(session.forward).toHaveBeenCalledWith({
      extensionNumber: '102',
    });

    deps.webphone.sessions = [];
    await expect(control.sendDTMF('8', 'session-1')).resolves.toBeUndefined();
    expect(deps.webphone.sendDTMF).not.toHaveBeenCalledWith('8', expect.any(String));

    control.ignore = ActiveCallControl.prototype.ignore.bind(control);
    await control.ignore('session-1');
    expect(console.warn).toHaveBeenCalledWith(
      'Ignore call failed, call is not in current device',
    );

    control.data.busyTimestamp = Date.now();
    await control.answerAndEnd('queue-session');
    expect(queueSession.answer).not.toHaveBeenCalled();
    control.data.busyTimestamp = 0;

    const failingControl = createControl({ deps, sessions: [session] });
    failingControl._deps.webphone.makeCall.mockRejectedValueOnce(new Error('make call failed'));
    await expect(failingControl.makeCall({ toNumber: '+16505550123' })).resolves.toBeUndefined();
    failingControl._deps.webphone.makeCall.mockResolvedValueOnce(null);
    await expect(failingControl.makeCall({ toNumber: '+16505550123' })).resolves.toBeNull();

    control.dialpadOpenTrack();
    control.dialpadCloseTrack();
    control.clickTransferTrack();
    control.clickForwardTrack();
    control.openEntityDetailLinkTrack('/contacts/1');
    control.clickSwitchTrack();
    expect(control.parentModule.analytics.track).toHaveBeenCalled();

    control._permissionCheck = false;
    await expect(control.getValidPhoneNumber('+16505550124')).resolves.toBe('+16505550124');
  });

  it('covers retry, polling, tracking context, and guard branches', async () => {
    const deps = createDeps();
    const control = createControl({ deps });

    expect(createControl({
      deps: createDeps({ webphone: null }),
    }).currentDeviceCallsMap).toEqual({});

    control.fetchData = jest.fn(async () => {});
    control._retry(5);
    jest.advanceTimersByTime(5);
    expect(control.fetchData).toHaveBeenCalled();

    control.fetchData.mockClear();
    deps.tabManager.active = false;
    control.data.timestamp = 0;
    control._retry(5);
    jest.advanceTimersByTime(5);
    expect(control.fetchData).not.toHaveBeenCalled();
    control._clearTimeout();

    control._syncData = jest.fn(async () => {
      throw new Error('sync failed');
    });
    control._retry = jest.fn();
    await expect(control._fetchData()).rejects.toThrow('sync failed');
    expect(control._retry).toHaveBeenCalled();
    expect(control._promise).toBeNull();

    control._polling = true;
    control._startPolling = jest.fn();
    await expect(control._fetchData()).rejects.toThrow('sync failed');
    expect(control._startPolling).toHaveBeenCalledWith(control.timeToRetry);

    control.parentModule.callLogSection.showNotification = true;
    expect(control._getTrackEventName('Mute')).toBe('Mute/Call notification page');
    control.parentModule.callLogSection.showNotification = false;
    control.parentModule.callLogSection.show = true;
    expect(control._getTrackEventName('Mute')).toBe('Mute/Call log page');
    control.parentModule.callLogSection.show = false;
    deps.routerInteraction.currentPath = '/calls';
    expect(control._getTrackEventName('Mute')).toBe('Mute/All calls page');
    deps.routerInteraction.currentPath = '/simplifycallctrl/active';
    expect(control._getTrackEventName('Mute')).toBe('Mute/Small call control');

    expect(control.ringSessions).toEqual([]);
    control.data.sessions = null;
    expect(control.ringSessions).toEqual([]);

    const noPermissionControl = createControl({
      deps: createDeps({
        appFeatures: {
          hasCallControl: false,
          isEDPEnabled: false,
        },
      }),
    });
    await noPermissionControl.onInit();
    expect(noPermissionControl._deps.subscription.subscribe).not.toHaveBeenCalled();
    noPermissionControl.data.sessions = [{ telephonySessionId: 'stale' }];
    noPermissionControl.data.activeSessionId = 'stale';
    noPermissionControl.onReset();
    expect(noPermissionControl.sessions).toEqual([]);
    expect(noPermissionControl.activeSessionId).toBeNull();
  });

  it('handles additional call-control success and error branches', async () => {
    const session = createTelephonySession({
      party: {
        muted: true,
        status: { code: PartyStatusCode.answered },
      },
      recordings: [],
    });
    const deps = createDeps();
    const control = createControl({ deps, sessions: [session] });
    control.updateActiveSessions();

    await control.transferUnmuteHandler('session-1');
    expect(session.unmute).toHaveBeenCalled();
    session.unmute.mockRejectedValueOnce(new Error('unmute ignored'));
    await expect(control.transferUnmuteHandler('session-1')).resolves.toBeUndefined();

    await expect(control.startRecord('session-1')).resolves.toBe(true);
    expect(session.createRecord).toHaveBeenCalled();

    session.pauseRecord.mockRejectedValueOnce(new Error('pause failed'));
    await control.stopRecord('session-1');
    expect(deps.alert.danger).toHaveBeenCalledWith({
      message: webphoneErrors.pauseRecordError,
    });

    session.drop.mockRejectedValueOnce(new Error('drop failed'));
    await control.hangUp('session-1');
    expect(deps.alert.warning).toHaveBeenCalledWith({
      message: callControlError.generalError,
    });

    deps.webphone.switchCall.mockRejectedValueOnce(new Error('switch failed'));
    await control.switch('session-1');
    expect(deps.alert.warning).toHaveBeenCalledWith({
      message: callControlError.generalError,
    });

    deps.webphone.replyWithMessage.mockClear();
    await expect(control.replyWithMessage({}, 'missing')).resolves.toBe(false);
    await expect(control.toVoicemail('vm-1', 'missing')).resolves.toBe(false);

    control.transferCallMapping = {
      'session-1': {
        isOriginal: true,
        relatedTelephonySessionId: 'missing-transfer',
      },
    };
    await expect(control.completeWarmTransfer('session-1')).resolves.toBe(false);

    deps.numberValidate.validateNumbers.mockResolvedValueOnce({
      result: false,
      errors: [{ phoneNumber: 'ha-number', type: 'numberParseError' }],
    });
    deps.availabilityMonitor.checkIfHAError.mockResolvedValueOnce(true);
    await expect(control.getValidPhoneNumber('ha-number')).resolves.toBeUndefined();
    expect(deps.alert.warning).not.toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { phoneNumber: 'ha-number' },
      }),
    );

    await control.forward('+16505550123', 'session-1');
    expect(session.forward).toHaveBeenCalledWith({
      phoneNumber: '+16505550123',
    });

    deps.webphone.sendDTMF.mockClear();
    await expect(control.sendDTMF('9', 'missing')).rejects.toThrow();
    expect(deps.webphone.sendDTMF).not.toHaveBeenCalled();

    session.flip.mockRejectedValueOnce(new Error('flip failed'));
    await expect(control.flip('2', 'session-1')).rejects.toThrow('flip failed');
    expect(control.busyTimestamp).toBe(0);

    await control.pickUpCall({
      fromNumber: '+16505550100',
      serverId: 'server-id',
      sessionId: 'session-1',
      toNumber: '+16505550123',
    });
    expect(console.warn).toHaveBeenCalledWith('pickUpCall is not implemented');
  });

  it('covers lifecycle retry choices and alternate validation/error branches', async () => {
    const session = createTelephonySession({
      recordings: [],
      party: {
        muted: false,
        status: { code: PartyStatusCode.answered },
      },
    });
    const deps = createDeps();
    const control = createControl({ deps, sessions: [session] });
    control.updateActiveSessions();

    control._initRcCallControl = jest.fn(() => control._rcCallControl);
    control.fetchData = jest.fn(async () => {
      throw new Error('fetch failed');
    });
    control._retry = jest.fn();
    await control.onInit();
    expect(deps.subscription.subscribe).toHaveBeenCalled();
    expect(control._retry).toHaveBeenCalled();

    control.fetchData = ActiveCallControl.prototype.fetchData.bind(control);
    const inactivePollingControl = createControl({
      deps: createDeps({ tabManager: { active: false } }),
    });
    inactivePollingControl._initRcCallControl = jest.fn(() => inactivePollingControl._rcCallControl);
    inactivePollingControl._polling = true;
    inactivePollingControl._startPolling = jest.fn();
    await inactivePollingControl.onInit();
    expect(inactivePollingControl._startPolling).toHaveBeenCalled();

    const inactiveRetryControl = createControl({
      deps: createDeps({ tabManager: { active: false } }),
    });
    inactiveRetryControl._initRcCallControl = jest.fn(() => inactiveRetryControl._rcCallControl);
    inactiveRetryControl._retry = jest.fn();
    await inactiveRetryControl.onInit();
    expect(inactiveRetryControl._retry).toHaveBeenCalled();

    const pendingPromise = Promise.resolve();
    control._promise = pendingPromise;
    control._fetchData = jest.fn();
    await control.fetchData();
    expect(control._fetchData).not.toHaveBeenCalled();
    control._promise = null;

    control._rcCallControl = null;
    deps.subscription.message = {
      body: {
        origin: { type: 'RingOut' },
        parties: [],
      },
      event: '/restapi/v1.0/account/~/extension/~/telephony/sessions',
    };
    control._subscriptionHandler();
    expect(control._lastSubscriptionMessage).toBe(deps.subscription.message);
    control._subscriptionHandler();
    expect(control._lastSubscriptionMessage).toBe(deps.subscription.message);
    deps.subscription.message = { event: '/presence', body: {} };
    expect(() => control._subscriptionHandler()).not.toThrow();
    expect(control._checkRingOutCallDirection({
      body: {
        origin: { type: 'Other' },
        parties: [{ direction: 'Inbound' }],
      },
    })).toEqual({
      body: {
        origin: { type: 'Other' },
        parties: [{ direction: 'Inbound' }],
      },
    });

    control.setActiveSessionId(null);
    expect(control.activeSessionId).toBeNull();
    control._deps.connectivityMonitor = null;
    expect(() => control._checkConnectivity()).not.toThrow();
    control._deps.connectivityMonitor = { ready: false, connectivity: true };
    expect(() => control._checkConnectivity()).not.toThrow();
    control._connectivity = true;
    control._deps.connectivityMonitor = { ready: true, connectivity: true };
    control.fetchData = jest.fn();
    control._checkConnectivity();
    expect(control.fetchData).not.toHaveBeenCalled();

    control._rcCallControl = {
      ...control._rcCallControl,
      sessions: [session],
    };
    const generalError = { response: { _text: 'General error' } };
    session.mute.mockRejectedValueOnce(generalError);
    await control.mute('session-1');
    session.unmute.mockRejectedValueOnce(generalError);
    await control.unmute('session-1');
    session.hold.mockRejectedValueOnce(generalError);
    await control.hold('session-1');
    session.unhold.mockRejectedValueOnce(generalError);
    await control.unhold('session-1');
    expect(deps.alert.warning).toHaveBeenCalledWith({
      message: callControlError.generalError,
    });

    session.createRecord.mockRejectedValueOnce({
      response: {
        clone: () => ({
          json: async () => ({ errors: [] }),
        }),
      },
    });
    await expect(control.startRecord('session-1')).resolves.toBeUndefined();

    deps.availabilityMonitor.checkIfHAError.mockResolvedValueOnce(true);
    session.drop.mockRejectedValueOnce(new Error('ha drop'));
    deps.alert.warning.mockClear();
    await control.hangUp('session-1');
    expect(deps.alert.warning).not.toHaveBeenCalledWith({
      message: callControlError.generalError,
    });

    deps.availabilityMonitor.checkIfHAError.mockResolvedValueOnce(true);
    session.toVoicemail.mockRejectedValueOnce(new Error('ha voicemail'));
    await control.reject('session-1');
    expect(deps.alert.warning).not.toHaveBeenCalledWith({
      message: callControlError.generalError,
    });

    deps.availabilityMonitor.checkIfHAError.mockResolvedValueOnce(true);
    deps.webphone.switchCall.mockRejectedValueOnce(new Error('ha switch'));
    await control.switch('session-1');
    expect(deps.alert.warning).not.toHaveBeenCalledWith({
      message: callControlError.generalError,
    });

    deps.numberValidate.validateNumbers.mockResolvedValueOnce({
      result: false,
      errors: [{ phoneNumber: 'bad-transfer', type: 'numberParseError' }],
    });
    session.transfer.mockClear();
    await control.transfer('bad-transfer', 'session-1');
    expect(session.transfer).not.toHaveBeenCalled();

    await expect(control.forward('102', 'missing-session')).resolves.toBe(false);
    deps.numberValidate.validateNumbers.mockResolvedValueOnce({
      result: false,
      errors: [{ phoneNumber: 'bad-forward', type: 'numberParseError' }],
    });
    await expect(control.forward('bad-forward', 'session-1')).resolves.toBe(false);
    deps.appFeatures.isEDPEnabled = true;
    deps.numberValidate.validate.mockReturnValueOnce({ result: true });
    deps.numberValidate.parseNumbers.mockResolvedValueOnce(null);
    await expect(control.forward('102', 'session-1')).resolves.toBe(true);

    const originalSession = createTelephonySession({
      id: 'original-session',
      party: {
        id: 'original-party',
        status: { code: PartyStatusCode.answered },
      },
    });
    const transferredSession = createTelephonySession({
      id: 'transferred-session',
      party: {
        id: 'transferred-party',
        status: { code: PartyStatusCode.answered },
      },
    });
    const warmControl = createControl({
      deps,
      sessions: [originalSession, transferredSession],
    });
    warmControl.updateActiveSessions();
    warmControl.transferCallMapping = {
      'transferred-session': {
        isOriginal: false,
        relatedTelephonySessionId: 'original-session',
      },
    };
    await warmControl.completeWarmTransfer('transferred-session');
    expect(originalSession.bridge).toHaveBeenCalledWith({
      partyId: 'transferred-party',
      telephonySessionId: 'transferred-session',
    });

    const outboundSession = new EventEmitter();
    outboundSession.id = 'outbound-no-transfer';
    outboundSession.sessionId = 'session-1';
    deps.webphone.makeCall.mockResolvedValueOnce(outboundSession);
    control.setActiveSessionId('session-1');
    await control.makeCall({ toNumber: '+16505550100' });
    outboundSession.emit('progress');
    expect(control.activeSessionId).toBe('session-1');

    control.transferCallMapping = {
      'session-1': {
        isOriginal: true,
        relatedTelephonySessionId: 'session-2',
      },
      'session-2': {
        isOriginal: false,
        relatedTelephonySessionId: 'session-1',
      },
    };
    control.data.sessions = [
      { telephonySessionId: 'session-1' },
      { telephonySessionId: 'session-2' },
    ];
    control.cleanCurrentWarmTransferData();
    expect(control.transferCallMapping).toEqual({
      'session-1': {
        isOriginal: true,
        relatedTelephonySessionId: 'session-2',
      },
      'session-2': {
        isOriginal: false,
        relatedTelephonySessionId: 'session-1',
      },
    });
  });
});
