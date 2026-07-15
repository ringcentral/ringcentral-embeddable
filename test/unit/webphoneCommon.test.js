const { EventEmitter } = require('events');

const callDirections = require('@ringcentral-integration/commons/enums/callDirections').default;
const { extendedControlStatus } = require('@ringcentral-integration/commons/enums/extendedControlStatus');
const { recordStatus } = require('@ringcentral-integration/commons/modules/Webphone/recordStatus');
const { sessionStatus } = require('@ringcentral-integration/commons/modules/Webphone/sessionStatus');
const { webphoneErrors } = require('@ringcentral-integration/commons/modules/Webphone/webphoneErrors');
const { setStagedState } = require('@ringcentral-integration/core/lib/usm-redux/utils');

jest.mock('../../src/modules/WebphoneV2/audio/incoming.mp3', () => 'incoming.mp3');
jest.mock('../../src/modules/WebphoneV2/audio/outgoing.mp3', () => 'outgoing.mp3');

const { Webphone } = require('../../src/modules/WebphoneV2/WebphoneCommon');
const { normalizeSession } = require('../../src/modules/WebphoneV2/webphoneHelper');
const { EVENTS } = require('../../src/modules/WebphoneV2/events');

jest.mock('ringcentral-web-phone', () => jest.fn());

jest.mock('@ringcentral-integration/utils', () => ({
  ...jest.requireActual('@ringcentral-integration/utils'),
  sleep: jest.fn(async () => {}),
}));

const { sleep } = require('@ringcentral-integration/utils');

function createLogger() {
  return {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

function createDeps(overrides = {}) {
  return {
    audioSettings: {
      getUserMedia: jest.fn(async () => {}),
      hasUserMedia: true,
    },
    alert: {
      warning: jest.fn(),
      danger: jest.fn(),
      success: jest.fn(),
    },
    appFeatures: {
      isEDPEnabled: false,
    },
    availabilityMonitor: {
      isVoIPOnlyMode: true,
    },
    brand: {
      brandConfig: {
        allowRegionSettings: true,
      },
    },
    contactMatcher: {
      triggerMatch: jest.fn(),
    },
    numberValidate: {
      validate: jest.fn(() => ({ result: true })),
      validateNumbers: jest.fn(async () => ({
        result: true,
        numbers: [{ e164: '+16505550123' }],
      })),
      parseNumbers: jest.fn(async () => [{
        availableExtension: '103',
        parsedNumber: '+16505550103',
      }]),
    },
    regionSettings: {
      areaCode: '650',
      countryCode: 'US',
      homeCountryId: '1',
    },
    tabManager: {
      active: true,
      id: 'tab-id',
      tabbie: {
        id: 'tabbie-id',
      },
    },
    webphoneOptions: {
      appKey: 'app-key',
    },
    ...overrides,
  };
}

function createPhone({ sessions = [], deps = createDeps() } = {}) {
  const phone = Object.create(Webphone.prototype);
  Object.assign(phone, {
    _deps: deps,
    _enableSharedState: true,
    _eventEmitter: new EventEmitter(),
    _logger: createLogger(),
    _permissionCheck: true,
    parentModule: {
      analytics: {
        track: jest.fn(),
      },
    },
    _ringtoneHelper: {
      play: jest.fn(),
      stop: jest.fn(),
      loadAudio: jest.fn(),
      setVolume: jest.fn(),
    },
    _sharedSipClient: {
      active: true,
      setActive: jest.fn(),
      setSharedState: jest.fn(),
      syncActiveTabId: jest.fn(async () => {}),
      syncSharedState: jest.fn(async () => ({})),
    },
    _webphone: {
      call: jest.fn(),
      callSessions: sessions,
    },
    activeSessionId: null,
    ringSessionId: null,
    lastEndedSessions: [],
    sessions: [],
  });
  return phone;
}

function createRawSession(overrides = {}) {
  const session = new EventEmitter();
  Object.assign(session, {
    callId: 'call-1',
    direction: 'inbound',
    state: 'answered',
    localNumber: '+16505550100',
    remoteNumber: '+16505550101',
    remotePeer: '"Remote User" <sip:+16505550101@example.com>;tag=remote-tag',
    localPeer: '"Local User" <sip:+16505550100@example.com>;tag=local-tag',
    remoteTag: 'remote-tag',
    localTag: 'local-tag',
    startTime: '2026-01-02T03:04:05.000Z',
    sipMessage: {
      headers: {
        'p-rc-api-ids': 'present',
        Via: 'via-header',
        To: 'to-header',
        From: 'from-header',
        CSeq: '1 INVITE',
      },
    },
    partyId: 'party-id',
    sessionId: 'session-id',
    rcApiCallInfo: null,
    webPhone: {
      sipClient: {
        on: jest.fn(),
        off: jest.fn(),
        reply: jest.fn(async () => {}),
      },
      callSessions: [],
    },
    answer: jest.fn(async () => {}),
    decline: jest.fn(async () => {}),
    dispose: jest.fn(),
    flip: jest.fn(async () => {}),
    forward: jest.fn(async () => {}),
    hangup: jest.fn(async () => {}),
    hold: jest.fn(async () => {}),
    mute: jest.fn(),
    park: jest.fn(async () => ({ 'park extension': '801' })),
    sendDtmf: jest.fn(async () => {}),
    sendRcMessage: jest.fn(async () => {}),
    startRecording: jest.fn(async () => {}),
    startReply: jest.fn(async () => {}),
    stopRecording: jest.fn(async () => {}),
    toVoicemail: jest.fn(async () => {}),
    transfer: jest.fn(async () => {}),
    completeWarmTransfer: jest.fn(async () => {}),
    unhold: jest.fn(async () => {}),
    unmute: jest.fn(),
    ...overrides,
  });
  session.webPhone.callSessions = [session];
  return session;
}

function createNormalizedSession(overrides = {}) {
  return {
    callId: 'session-1',
    id: 'session-1',
    direction: callDirections.outbound,
    callStatus: sessionStatus.connected,
    to: '+16505550101',
    from: '+16505550100',
    startTime: 200,
    lastActiveTime: 200,
    cached: false,
    removed: false,
    isOnHold: false,
    isOnTransfer: false,
    minimized: false,
    ...overrides,
  };
}

describe('WebphoneCommon module methods', () => {
  beforeEach(() => {
    setStagedState({});
  });

  afterEach(() => {
    setStagedState(undefined);
    jest.restoreAllMocks();
  });

  it('updates normalized session state and derived session getters', () => {
    const phone = createPhone();
    const activeSession = createNormalizedSession({
      callId: 'active',
      id: 'active',
      lastActiveTime: 300,
    });
    const olderSession = createNormalizedSession({
      callId: 'older',
      id: 'older',
      lastActiveTime: 100,
    });
    const ringSession = createNormalizedSession({
      callId: 'ring',
      id: 'ring',
      direction: callDirections.inbound,
      callStatus: sessionStatus.connecting,
      lastActiveTime: 400,
      minimized: false,
    });
    const cachedSession = createNormalizedSession({
      callId: 'cached',
      id: 'cached',
      cached: true,
      lastActiveTime: 50,
    });

    phone.sessions = [cachedSession];
    phone._updateSessionsState([olderSession, activeSession, ringSession]);

    expect(phone.sessions.map((session) => session.callId)).toEqual([
      'ring',
      'active',
      'older',
      'cached',
    ]);
    expect(phone.sessions.find((session) => session.callId === 'cached')).toEqual(
      expect.objectContaining({ removed: true }),
    );

    phone._setStateOnCallRing(ringSession);
    expect(phone.ringSession).toEqual(ringSession);
    expect(phone.ringSessions).toEqual([ringSession]);
    expect(phone.ringingCallOnView).toEqual(ringSession);

    phone._setStateOnCallStart(activeSession);
    expect(phone.activeSession).toEqual(activeSession);

    phone.sessions = [olderSession, ringSession];
    phone._setStateOnCallEnd(activeSession);
    expect(phone.activeSessionId).toBe('older');
    expect(phone.lastEndedSessions[0]).toEqual(activeSession);

    phone._setSessionCaching(['older']);
    expect(phone.cachedSessions.map((session) => session.callId)).toEqual([
      'older',
    ]);

    phone._clearSessionCaching(phone.sessions);
    expect(phone.sessions.some((session) => session.removed)).toBe(false);
    expect(phone.onHoldSessions).toEqual([]);
    expect(phone.sessionPhoneNumbers).toContain('+16505550101');
  });

  it('syncs shared state and checks whether the current tab can be active', async () => {
    const activeSession = createRawSession({ callId: 'active-call' });
    const phone = createPhone({ sessions: [activeSession] });
    const normalizedSession = normalizeSession(activeSession);
    phone.sessions = [normalizedSession];
    phone._sharedSipClient.syncSharedState.mockResolvedValue({
      activeSessionId: 'active-call',
      ringSessionId: 'ring-call',
      lastEndedSessions: [normalizedSession],
      sessions: [normalizedSession],
    });

    await phone._syncSharedState();
    expect(phone.activeSessionId).toBe('active-call');
    expect(phone.ringSessionId).toBe('ring-call');
    expect(phone.lastEndedSessions).toEqual([normalizedSession]);

    phone._onSharedStateUpdated({ ringSessionId: null });
    expect(phone.ringSessionId).toBeNull();
    await expect(phone._canBeActiveTabs()).resolves.toBe(true);

    phone._enableSharedState = false;
    phone._sharedSipClient.syncSharedState.mockClear();
    await phone._syncSharedState();
    expect(phone._sharedSipClient.syncSharedState).not.toHaveBeenCalled();
  });

  it('updates sessions from SIP UPDATE asserted identity headers', () => {
    const rawSession = createRawSession({
      callId: 'transfer-call',
      direction: 'inbound',
      remoteNumber: '+16505550000',
    });
    const phone = createPhone({ sessions: [rawSession] });

    phone._updateSessions();
    phone._onSessionUpdate({
      headers: {
        'Call-Id': 'transfer-call',
        'P-Asserted-Identity': '"Jane%20Agent" <sip:%2B16505550123@example.com>;tag=abc',
      },
      subject: 'UPDATE sip:test@example.com',
    });

    expect(rawSession.__rc_originalRemoteNumber).toBe('+16505550123');
    expect(rawSession.__rc_originalRemoteName).toBe('Jane Agent');
    expect(rawSession.__rc_isReceivedTransfer).toBe(true);
    expect(phone.sessions[0]).toEqual(
      expect.objectContaining({
        from: '+16505550123',
        fromUserName: 'Jane Agent',
        isReceivedTransfer: true,
      }),
    );
    expect(phone._deps.contactMatcher.triggerMatch).toHaveBeenCalled();
  });

  it('binds invite session events and emits call lifecycle events', () => {
    const rawSession = createRawSession({
      callId: 'ring-call',
      state: 'ringing',
      startTime: null,
      __rc_extendedControls: ['1'],
      __rc_extendedControlStatus: extendedControlStatus.pending,
    });
    const phone = createPhone({ sessions: [rawSession] });
    const callRingHandler = jest.fn();
    const callStartHandler = jest.fn();
    const callEndHandler = jest.fn();
    const acceptedHandler = jest.fn();
    const terminatedHandler = jest.fn();
    phone.onCallRing(callRingHandler);
    phone.onCallStart(callStartHandler);
    phone.onCallEnd(callEndHandler);
    phone._playExtendedControls = jest.fn();
    rawSession.on('accepted', acceptedHandler);
    rawSession.on('terminated', terminatedHandler);

    phone._onInvite(rawSession);
    expect(rawSession.__rc_creationTime).toEqual(expect.any(Number));
    expect(phone.ringSessionId).toBe('ring-call');
    expect(phone._ringtoneHelper.play).toHaveBeenCalled();
    expect(callRingHandler).toHaveBeenCalledWith(
      expect.objectContaining({ callId: 'ring-call' }),
      expect.objectContaining({ callId: 'ring-call' }),
    );

    rawSession.state = 'answered';
    rawSession.emit('answered');
    expect(phone.activeSessionId).toBe('ring-call');
    expect(phone._playExtendedControls).toHaveBeenCalledWith(rawSession);
    expect(phone._ringtoneHelper.stop).toHaveBeenCalled();
    expect(acceptedHandler).toHaveBeenCalled();
    expect(callStartHandler).toHaveBeenCalledWith(
      expect.objectContaining({ callId: 'ring-call' }),
      expect.objectContaining({ callId: 'ring-call' }),
    );

    rawSession.state = 'disposed';
    rawSession.emit('disposed');
    expect(terminatedHandler).toHaveBeenCalled();
    expect(callEndHandler).toHaveBeenCalledWith(
      expect.objectContaining({ callId: 'ring-call' }),
      expect.objectContaining({ callId: 'ring-call' }),
      null,
    );
    expect(rawSession.__rc_extendedControlStatus).toBe(
      extendedControlStatus.stopped,
    );
  });

  it('answers, mutes, holds, and resumes sessions', async () => {
    const ringingSession = createRawSession({
      callId: 'ringing',
      state: 'ringing',
      startTime: null,
    });
    const activeSession = createRawSession({
      callId: 'active',
      direction: 'outbound',
      state: 'answered',
      remoteNumber: '+16505550200',
      localNumber: '+16505550100',
    });
    const phone = createPhone({ sessions: [ringingSession, activeSession] });
    phone._trackCallAnswer = jest.fn();
    phone._updateSessions();

    await phone.answer('ringing');
    expect(phone._deps.audioSettings.getUserMedia).toHaveBeenCalled();
    expect(activeSession.hold).toHaveBeenCalled();
    expect(activeSession.__rc_localHold).toBe(true);
    expect(ringingSession.answer).toHaveBeenCalled();
    expect(phone._trackCallAnswer).toHaveBeenCalled();

    expect(await phone.mute('active')).toBe(true);
    expect(activeSession.__rc_isOnMute).toBe(true);
    expect(activeSession.mute).toHaveBeenCalled();

    await phone.unmute('active');
    expect(activeSession.__rc_isOnMute).toBe(false);
    expect(activeSession.unmute).toHaveBeenCalled();

    activeSession.__rc_localHold = false;
    expect(await phone.hold('active')).toBe(true);
    expect(activeSession.__rc_localHold).toBe(true);

    await phone.unhold('active');
    expect(activeSession.unhold).toHaveBeenCalled();
    expect(activeSession.__rc_localHold).toBe(false);
    expect(activeSession.__rc_callStatus).toBe(sessionStatus.connected);
  });

  it('records, parks, transfers, sends DTMF, and ends active calls', async () => {
    const activeSession = createRawSession({
      callId: 'active',
      direction: 'outbound',
      state: 'answered',
      remoteNumber: '+16505550200',
      localNumber: '+16505550100',
    });
    const oldTransferSession = createRawSession({
      callId: 'old-transfer',
      direction: 'outbound',
      state: 'answered',
    });
    activeSession.__rc_transferSessionId = 'old-transfer';
    const phone = createPhone({ sessions: [activeSession, oldTransferSession] });
    phone._updateSessions();

    await phone.startRecord('active');
    expect(activeSession.startRecording).toHaveBeenCalled();
    expect(activeSession.__rc_recordStatus).toBe(recordStatus.recording);

    await phone.stopRecord('active');
    expect(activeSession.stopRecording).toHaveBeenCalled();
    expect(activeSession.__rc_recordStatus).toBe(recordStatus.idle);

    await expect(phone.park('active')).resolves.toBe('*801');
    expect(phone._deps.alert.success).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { parkedNumber: '*801' },
        ttl: 0,
      }),
    );

    await expect(
      phone.parkToLocation('active', {
        id: '900',
        name: 'Park Orbit',
        extensionNumber: '8900',
      }),
    ).resolves.toBe('Park Orbit');
    expect(activeSession.transfer).toHaveBeenCalledWith('prk900');

    await phone.transfer('+16505550123', 'active');
    expect(activeSession.transfer).toHaveBeenCalledWith('+16505550123');
    expect(oldTransferSession.__rc_isOnTransfer).toBe(false);

    await phone.flip('1', 'active');
    expect(activeSession.flip).toHaveBeenCalledWith('1');
    expect(activeSession.__rc_isOnFlip).toBe(true);

    await phone.sendDTMF('5', 'active');
    expect(activeSession.sendDtmf).toHaveBeenCalledWith('5', 100);

    await phone.hangup('active');
    expect(activeSession.hangup).toHaveBeenCalled();

    await phone.toVoiceMail('active');
    expect(activeSession.toVoicemail).toHaveBeenCalled();
    expect(activeSession.__rc_isToVoicemail).toBe(true);
  });

  it('surfaces validation and session operation failures through alerts', async () => {
    const activeSession = createRawSession({
      callId: 'active',
      direction: 'outbound',
      state: 'answered',
      remoteNumber: '+16505550200',
      localNumber: '+16505550100',
    });
    const deps = createDeps();
    const phone = createPhone({ sessions: [activeSession], deps });
    phone._updateSessions();

    deps.numberValidate.validateNumbers.mockResolvedValueOnce({
      result: false,
      errors: [{ type: 'noAreaCode', phoneNumber: '123' }],
    });
    await expect(phone.forward('active', '123')).resolves.toBe(false);
    expect(deps.alert.warning).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { phoneNumber: '123' },
      }),
    );

    activeSession.hold.mockRejectedValueOnce(new Error('hold failed'));
    await expect(phone.hold('active')).resolves.toBe(false);
    expect(deps.alert.warning).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'webphone-holdError' }),
    );

    activeSession.startRecording.mockRejectedValueOnce({ code: -5 });
    await phone.startRecord('active');
    expect(activeSession.__rc_recordStatus).toBe(recordStatus.noAccess);
    expect(deps.alert.danger).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'webphone-recordDisabled' }),
    );

    deps.numberValidate.validateNumbers.mockResolvedValueOnce({
      result: false,
      errors: [{ type: 'numberParseError', phoneNumber: 'bad-number' }],
    });
    await phone.transfer('bad-number', 'active');
    expect(activeSession.__rc_isOnTransfer).toBe(false);
    expect(deps.alert.warning).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { phoneNumber: 'bad-number' },
      }),
    );
  });

  it('invites outbound, switched, and picked-up webphone calls with expected headers', async () => {
    const createdSession = createRawSession({
      callId: 'new-call',
      direction: 'outbound',
      state: 'init',
      remoteNumber: '+16505550300',
      localNumber: '+16505550100',
    });
    const heldSession = createRawSession({
      callId: 'held-call',
      direction: 'outbound',
      state: 'answered',
    });
    const phone = createPhone({ sessions: [heldSession] });
    phone._webphone.call.mockImplementation(() => {
      phone._webphone.callSessions.push(createdSession);
    });
    phone._onCallInit = jest.fn();

    const makeCallResult = await phone.makeCall({
      toNumber: '+16505550300',
      fromNumber: '+16505550100',
      homeCountryId: '1',
      extendedControls: ['1', '2'],
      transferSessionId: 'transfer-call',
    });

    expect(makeCallResult).toBe(createdSession);
    expect(heldSession.hold).toHaveBeenCalled();
    expect(phone._webphone.call).toHaveBeenCalledWith(
      '+16505550300',
      '+16505550100',
      {
        headers: {
          'Client-id': 'app-key',
          'P-rc-country-id': '1',
        },
      },
    );
    expect(createdSession.__rc_extendedControls).toEqual(['1', '2']);
    expect(createdSession.__rc_transferSessionId).toBe('transfer-call');

    phone._webphone.call.mockClear();
    await phone.switchCall(
      {
        id: 'telephony-session',
        direction: callDirections.outbound,
        from: { phoneNumber: '+16505550100' },
        to: { phoneNumber: '+16505550400' },
        sipData: {
          fromTag: 'from-tag',
          toTag: 'to-tag',
        },
      },
      '1',
    );
    expect(phone._webphone.call).toHaveBeenLastCalledWith(
      '+16505550400',
      '+16505550100',
      {
        headers: {
          'P-rc-country-id': '1',
          Replaces: 'telephony-session;to-tag=from-tag;from-tag=to-tag',
          'RC-call-type': 'replace',
        },
      },
    );

    phone._webphone.call.mockClear();
    await phone.pickOtherExtensionCall({
      extensionId: '123',
      activeCall: {
        direction: callDirections.inbound,
        from: '+16505550500',
        fromName: 'Customer',
        to: '+16505550100',
        toName: 'Agent',
        sipData: {
          fromTag: 'pick-from',
          toTag: 'pick-to',
        },
        telephonySessionId: 'pick-session',
      },
      fromNumber: '+16505550100',
      pickPrefix: 'gcp',
      overrideLocal: true,
    });
    expect(phone._webphone.call).toHaveBeenLastCalledWith(
      'gcp123',
      '+16505550100',
      {
        headers: {
          Replaces: 'pick-session;to-tag=pick-from;from-tag=pick-to;early-only',
        },
      },
    );
    expect(createdSession.__rc_originalRemoteNumber).toBe('+16505550500');
    expect(createdSession.__rc_originalLocalNumber).toBe('+16505550100');
    expect(createdSession.__rc_originalLocalName).toBe('Agent');
  });

  it('handles reject, ignore, reply, forwarding, and warm-transfer edge paths', async () => {
    const ringingSession = createRawSession({
      callId: 'ringing',
      direction: 'inbound',
      state: 'ringing',
    });
    const activeSession = createRawSession({
      callId: 'active',
      direction: 'outbound',
      state: 'answered',
      remoteNumber: '+16505550200',
      localNumber: '+16505550100',
    });
    const transferSession = createRawSession({
      callId: 'transfer',
      direction: 'outbound',
      state: 'answered',
      __rc_transferSessionId: 'active',
    });
    const phone = createPhone({
      sessions: [ringingSession, activeSession, transferSession],
    });
    phone._updateSessions();

    await phone.reject('ringing');
    expect(ringingSession.webPhone.sipClient.reply).toHaveBeenCalled();
    expect(ringingSession.dispose).toHaveBeenCalled();
    await expect(phone.reject('missing')).resolves.toBeUndefined();

    ringingSession.state = 'ringing';
    ringingSession.webPhone.callSessions = [ringingSession];
    ringingSession.decline.mockRejectedValueOnce(new Error('decline failed'));
    phone._onCallEnd = jest.fn();
    await phone.ignore('ringing');
    expect(phone._onCallEnd).toHaveBeenCalledWith(ringingSession);

    await phone.startReply('active');
    await phone.startReply('active');
    expect(activeSession.startReply).toHaveBeenCalledTimes(1);
    activeSession.__rc_isStartedReply = false;
    activeSession.startReply.mockRejectedValueOnce(new Error('reply failed'));
    await phone.startReply('active');
    expect(phone._logger.error).toHaveBeenCalledWith(expect.any(Error));

    expect(await phone.setForwardFlag('missing')).toBe(false);
    await phone.setForwardFlag('active');
    expect(activeSession.__rc_isForwarded).toBe(true);

    phone._permissionCheck = false;
    phone._onCallEnd = jest.fn();
    phone._addTrack = jest.fn();
    phone.activeSessionId = 'active';
    await expect(phone.forward('active', '+16505550123')).resolves.toBe(true);
    expect(activeSession.forward).toHaveBeenCalled();
    expect(phone._onCallEnd).toHaveBeenCalledWith(activeSession);
    expect(phone._addTrack).toHaveBeenCalledWith(activeSession);

    phone._permissionCheck = true;
    phone.makeCall = jest.fn(async () => ({ id: 'warm-call' }));
    await phone.startWarmTransfer('+16505550124', 'active');
    expect(activeSession.__rc_isOnTransfer).toBe(true);
    expect(phone.makeCall).toHaveBeenCalledWith(
      expect.objectContaining({
        fromNumber: '+16505550200',
        toNumber: '+16505550124',
        transferSessionId: 'active',
      }),
    );

    phone.makeCall.mockRejectedValueOnce(new Error('warm transfer failed'));
    await phone.startWarmTransfer('+16505550125', 'active');
    expect(activeSession.__rc_isOnTransfer).toBe(false);
    expect(phone._deps.alert.danger).toHaveBeenCalledWith({
      message: webphoneErrors.transferError,
    });

    await phone.completeWarmTransfer('transfer');
    expect(activeSession.completeWarmTransfer).toHaveBeenCalledWith(transferSession);
    activeSession.completeWarmTransfer.mockRejectedValueOnce(new Error('complete failed'));
    await phone.completeWarmTransfer('transfer');
    expect(transferSession.__rc_isOnTransfer).toBe(false);
    expect(phone._deps.alert.danger).toHaveBeenCalledWith({
      message: webphoneErrors.transferError,
    });

    activeSession.flip.mockRejectedValueOnce(new Error('flip failed'));
    await phone.flip('2', 'active');
    expect(activeSession.__rc_isOnFlip).toBe(false);
    expect(phone._deps.alert.warning).toHaveBeenCalledWith({
      message: webphoneErrors.flipError,
    });

    activeSession.toVoicemail.mockRejectedValueOnce(new Error('voicemail failed'));
    await phone.toVoiceMail('active');
    expect(phone._deps.alert.warning).toHaveBeenCalledWith({
      message: webphoneErrors.toVoiceMailError,
    });

    activeSession.sendRcMessage.mockRejectedValueOnce(new Error('reply message failed'));
    await phone.replyWithMessage('active', {
      replyType: 0,
      replyText: 'Call me later',
    });
    expect(phone._logger.error).toHaveBeenCalledWith(expect.any(Error));
  });

  it('updates matched contacts, minimized state, cache wrappers, and lifecycle listeners', async () => {
    const activeSession = createRawSession({
      callId: 'active',
      direction: 'outbound',
      state: 'answered',
      remoteNumber: '+16505550200',
      localNumber: '+16505550100',
    });
    const phone = createPhone({ sessions: [activeSession] });
    phone._updateSessions();
    const beforeEndHandler = jest.fn();
    const beforeResumeHandler = jest.fn();
    const resumeHandler = jest.fn();
    const holdHandler = jest.fn();
    const registeredHandler = jest.fn();
    const unregisteredHandler = jest.fn();
    phone.onBeforeCallEnd(beforeEndHandler);
    phone.onBeforeCallResume(beforeResumeHandler);
    phone.onCallResume(resumeHandler);
    phone.onCallHold(holdHandler);
    const offRegistered = phone.onWebphoneRegistered(registeredHandler);
    const offUnregistered = phone.onWebphoneUnregistered(unregisteredHandler);

    await phone.updateSessionMatchedContact('active', { id: 'contact-1' });
    expect(activeSession.__rc_contactMatch).toEqual({ id: 'contact-1' });
    await phone.toggleMinimized('active');
    expect(activeSession.__rc_minimized).toBe(true);
    await phone.setSessionCaching(['active']);
    expect(phone.cachedSessions).toHaveLength(1);
    await phone.clearSessionCaching();
    expect(phone.cachedSessions).toHaveLength(0);

    phone._onBeforeCallEnd(activeSession);
    phone._onBeforeCallResume(activeSession);
    phone._onCallResume(activeSession);
    phone._onCallHold(activeSession);
    expect(beforeEndHandler).toHaveBeenCalledWith(
      expect.objectContaining({ callId: 'active' }),
      expect.objectContaining({ callId: 'active' }),
    );
    expect(beforeResumeHandler).toHaveBeenCalled();
    expect(resumeHandler).toHaveBeenCalled();
    expect(holdHandler).toHaveBeenCalled();

    phone._eventEmitter.emit(EVENTS.webphoneRegistered);
    phone._eventEmitter.emit(EVENTS.webphoneUnregistered);
    expect(registeredHandler).toHaveBeenCalled();
    expect(unregisteredHandler).toHaveBeenCalled();
    offRegistered();
    offUnregistered();
    phone._eventEmitter.emit(EVENTS.webphoneRegistered);
    phone._eventEmitter.emit(EVENTS.webphoneUnregistered);
    expect(registeredHandler).toHaveBeenCalledTimes(1);
    expect(unregisteredHandler).toHaveBeenCalledTimes(1);

    await phone.pickParkLocation('801', {
      direction: callDirections.outbound,
      from: '+16505550100',
      sipData: {
        fromTag: 'from-tag',
        toTag: 'to-tag',
      },
      telephonySessionId: 'park-session',
      to: '+16505550200',
    }, '+16505550100');
    expect(phone._webphone.call).toHaveBeenLastCalledWith(
      'prk801',
      '+16505550100',
      expect.any(Object),
    );

    await phone.pickGroupCall('123', {
      direction: callDirections.inbound,
      from: '+16505550300',
      fromName: 'Customer',
      sipData: {
        fromTag: 'pick-from',
        toTag: 'pick-to',
      },
      telephonySessionId: 'group-session',
      to: '+16505550100',
      toName: 'Agent',
    }, '+16505550100', 'gcp');
    expect(phone._webphone.call).toHaveBeenLastCalledWith(
      'gcp123',
      '+16505550100',
      expect.any(Object),
    );
  });

  it('initializes constructor callbacks and contact query sources', () => {
    const handlers = {
      onBeforeCallEnd: jest.fn(),
      onBeforeCallResume: jest.fn(),
      onCallEnd: jest.fn(),
      onCallHold: jest.fn(),
      onCallInit: jest.fn(),
      onCallResume: jest.fn(),
      onCallRing: jest.fn(),
      onCallStart: jest.fn(),
    };
    const deps = createDeps({
      availabilityMonitor: {
        isVoIPOnlyMode: true,
        setSharedState: jest.fn(),
      },
      contactMatcher: {
        addQuerySource: jest.fn(),
        triggerMatch: jest.fn(),
      },
      prefix: 'test',
      webphoneOptions: {
        appKey: 'app-key',
        ...handlers,
      },
    });

    const phone = new Webphone(deps);
    phone.sessions = [createNormalizedSession({ callId: 'active' })];
    Object.defineProperty(phone, 'ready', {
      value: true,
      configurable: true,
    });

    expect(deps.contactMatcher.addQuerySource).toHaveBeenCalledWith({
      getQueriesFn: expect.any(Function),
      readyCheckFn: expect.any(Function),
    });
    const querySource = deps.contactMatcher.addQuerySource.mock.calls[0][0];
    expect(querySource.getQueriesFn()).toEqual(['+16505550101', '+16505550100']);
    expect(querySource.readyCheckFn()).toBe(true);

    phone._eventEmitter.emit(EVENTS.callEnd);
    phone._eventEmitter.emit(EVENTS.callRing);
    phone._eventEmitter.emit(EVENTS.callStart);
    phone._eventEmitter.emit(EVENTS.callResume);
    phone._eventEmitter.emit(EVENTS.callHold);
    phone._eventEmitter.emit(EVENTS.callInit);
    phone._eventEmitter.emit(EVENTS.beforeCallResume);
    phone._eventEmitter.emit(EVENTS.beforeCallEnd);

    Object.values(handlers).forEach((handler) => {
      expect(handler).toHaveBeenCalled();
    });
  });

  it('parses asserted identity updates from alternate SIP header forms', () => {
    const rawSession = createRawSession({
      callId: 'identity-call',
      direction: 'outbound',
      remoteNumber: '+16505550000',
    });
    const phone = createPhone({ sessions: [rawSession] });
    phone._updateSessions();

    phone._onSessionUpdate({
      headers: {
        'call-id': 'identity-call',
        'p-asserted-identity': 'Support%20Team <tel:%2B16505550600>',
      },
      subject: 'UPDATE sip:test@example.com',
    });
    expect(rawSession.__rc_originalRemoteNumber).toBe('+16505550600');
    expect(rawSession.__rc_originalRemoteName).toBe('Support Team');

    phone._onSessionUpdate({
      headers: {
        'Call-Id': 'identity-call',
        'P-Asserted-Identity': '"Bad%ZZ" <sip:%2B16505550700@example.com>',
      },
      subject: 'UPDATE sip:test@example.com',
    });
    expect(rawSession.__rc_originalRemoteNumber).toBe('+16505550700');
    expect(rawSession.__rc_originalRemoteName).toBe('Bad%ZZ');

    phone._deps.contactMatcher.triggerMatch.mockClear();
    phone._onSessionUpdate({
      headers: {
        'Call-Id': 'missing-call',
        'P-Asserted-Identity': '<sip:%2B16505550800@example.com>',
      },
      subject: 'UPDATE sip:test@example.com',
    });
    phone._onSessionUpdate({
      headers: {
        'Call-Id': 'identity-call',
      },
      subject: 'UPDATE sip:test@example.com',
    });
    expect(phone._deps.contactMatcher.triggerMatch).not.toHaveBeenCalled();
  });

  it('handles storage active-call changes and extended-control playback branches', async () => {
    const session = createRawSession({
      callId: 'active',
      direction: 'outbound',
      state: 'answered',
      __rc_extendedControls: ['1', ',', '2'],
      __rc_extendedControlStatus: extendedControlStatus.pending,
    });
    const phone = createPhone({ sessions: [session] });
    const basePrototype = Object.getPrototypeOf(Webphone.prototype);
    const originalStorageChange = basePrototype._onStorageChangeEvent;
    basePrototype._onStorageChangeEvent = jest.fn();
    phone._activeWebphoneActiveCallKey = 'active-call-key';
    phone._holdOtherSession = jest.fn(async () => {});

    phone._onStorageChangeEvent({
      key: 'active-call-key',
      newValue: 'active',
    });
    if (originalStorageChange) {
      basePrototype._onStorageChangeEvent = originalStorageChange;
    } else {
      delete basePrototype._onStorageChangeEvent;
    }
    expect(phone._holdOtherSession).toHaveBeenCalledWith('active');

    phone._sendDTMF = jest.fn(async () => {});
    await phone._playExtendedControls(session);
    expect(phone._sendDTMF).toHaveBeenCalledWith('1', session);
    expect(phone._sendDTMF).toHaveBeenCalledWith('2', session);
    expect(sleep).toHaveBeenCalledWith(2000);
    expect(session.__rc_extendedControlStatus).toBe(extendedControlStatus.stopped);

    session.__rc_extendedControls = ['3', '4'];
    session.__rc_extendedControlStatus = extendedControlStatus.pending;
    phone._sendDTMF = jest.fn(async () => {
      session.__rc_extendedControlStatus = extendedControlStatus.stopped;
    });
    await phone._playExtendedControls(session);
    expect(phone._sendDTMF).toHaveBeenCalledTimes(1);
  });

  it('returns early from invite guards before creating outbound calls', async () => {
    const deps = createDeps({
      availabilityMonitor: {
        isVoIPOnlyMode: false,
      },
    });
    const phone = createPhone({ deps });
    phone.errorCode = webphoneErrors.connectFailed;
    phone._webphone = null;

    await expect(phone._invite('+16505550123', {
      inviteOptions: {
        fromNumber: '+16505550100',
      },
    })).resolves.toBeNull();
    expect(deps.alert.warning).toHaveBeenCalledWith({
      message: webphoneErrors.connectFailed,
    });

    phone._webphone = {
      call: jest.fn(),
      callSessions: [],
    };
    phone._fetchDL = jest.fn(async () => []);
    await expect(phone._invite('+16505550123', {
      inviteOptions: {
        fromNumber: '+16505550100',
      },
    })).resolves.toBeNull();
    expect(deps.alert.warning).toHaveBeenCalledWith({
      message: webphoneErrors.noOutboundCallWithoutDL,
    });

    phone._fetchDL = jest.fn(async () => [{ id: 'line-1' }]);
    deps.audioSettings.hasUserMedia = false;
    await expect(phone._invite('+16505550123', {
      inviteOptions: {
        fromNumber: '+16505550100',
      },
    })).resolves.toBeNull();
    expect(phone._webphone.call).not.toHaveBeenCalled();
  });

  it('uses EDP number parsing for forward and transfer actions', async () => {
    const session = createRawSession({
      callId: 'active',
      direction: 'outbound',
      state: 'answered',
    });
    const deps = createDeps({
      appFeatures: {
        isEDPEnabled: true,
      },
    });
    const phone = createPhone({ sessions: [session], deps });
    phone._updateSessions();

    await expect(phone.forward('active', '103')).resolves.toBe(true);
    expect(deps.numberValidate.validate).toHaveBeenCalledWith(['103']);
    expect(deps.numberValidate.parseNumbers).toHaveBeenCalledWith(['103']);
    expect(session.forward).toHaveBeenCalledWith('103');

    await phone.transfer('103', 'active');
    expect(session.transfer).toHaveBeenCalledWith('103');

    session.stopRecording.mockRejectedValueOnce(new Error('stop failed'));
    await phone.stopRecord('active');
    expect(session.__rc_recordStatus).toBe(recordStatus.recording);

    session.park.mockRejectedValueOnce(new Error('park failed'));
    await expect(phone.park('active')).resolves.toBeUndefined();
    await expect(phone.parkToLocation('active', null)).resolves.toBeUndefined();
    session.transfer.mockRejectedValueOnce(new Error('park location failed'));
    await expect(phone.parkToLocation('active', {
      id: '901',
      name: '',
      extensionNumber: '8901',
    })).resolves.toBeUndefined();
  });

  it('covers guard branches and alternate webphone action fallbacks', async () => {
    const depsWithoutCallbacks = createDeps({
      availabilityMonitor: null,
      contactMatcher: null,
      tabManager: null,
      webphoneOptions: {
        appKey: 'app-key',
        enableContactMatchWhenNewCall: false,
        permissionCheck: false,
      },
    });
    const constructedPhone = new Webphone(depsWithoutCallbacks);
    expect(constructedPhone._permissionCheck).toBe(false);

    const ringingSession = createRawSession({
      callId: 'ringing',
      state: 'ringing',
      startTime: null,
    });
    const activeSession = createRawSession({
      callId: 'active',
      direction: 'outbound',
      state: 'answered',
      __rc_callStatus: sessionStatus.connected,
    });
    const cachedSession = createNormalizedSession({
      callId: 'cached',
      cached: true,
    });
    const phone = createPhone({ sessions: [ringingSession, activeSession] });
    phone.sessions = [cachedSession];
    phone._updateSessionsState([
      createNormalizedSession({ callId: 'cached' }),
    ]);
    expect(phone.sessions[0].cached).toBe(true);
    phone._setStateOnCallEnd(createNormalizedSession({
      callId: 'ringing',
      callStatus: sessionStatus.connecting,
      startTime: null,
    }));
    expect(phone.lastEndedSessions).toEqual([]);
    phone._clearSessionCaching(phone.sessions);
    phone._onHoldCachedSession();

    phone._updateSessions();
    phone._deps.tabManager.active = false;
    await expect(phone._canBeActiveTabs()).resolves.toBe(false);
    phone._deps.tabManager.active = true;
    phone.sessions = [createNormalizedSession({ callId: 'other-tab' })];
    await expect(phone._canBeActiveTabs()).resolves.toBe(false);

    await expect(phone.answer('missing')).resolves.toBeUndefined();
    phone._updateSessions();
    phone._deps.audioSettings.hasUserMedia = false;
    await expect(phone.answer('ringing')).resolves.toBeUndefined();
    expect(ringingSession.answer).not.toHaveBeenCalled();
    phone._deps.audioSettings.hasUserMedia = true;
    ringingSession.answer.mockRejectedValueOnce(new Error('answer failed'));
    await expect(phone.answer('ringing')).resolves.toBeUndefined();
    expect(phone._logger.error).toHaveBeenCalledWith(expect.any(Error));

    await expect(phone.reject('missing')).resolves.toBeUndefined();
    ringingSession.state = 'disposed';
    await expect(phone.reject('ringing')).resolves.toBeUndefined();
    await expect(phone.ignore('missing')).resolves.toBeUndefined();
    await expect(phone.ignore('ringing')).resolves.toBeUndefined();
    await expect(phone.startReply('missing')).resolves.toBeUndefined();

    await expect(phone.hold('missing')).resolves.toBe(false);
    activeSession.__rc_localHold = true;
    await expect(phone.hold('active')).resolves.toBe(true);
    activeSession.__rc_localHold = false;
    const failingHoldSession = createRawSession({
      callId: 'failing-hold',
      state: 'answered',
      hold: jest.fn(async () => {
        throw new Error('hold other failed');
      }),
    });
    phone._webphone.callSessions = [
      activeSession,
      createRawSession({
        callId: 'already-held',
        state: 'answered',
        __rc_localHold: true,
      }),
      createRawSession({
        callId: 'still-ringing',
        state: 'ringing',
      }),
      failingHoldSession,
    ];
    await expect(phone._holdOtherSession('active')).rejects.toThrow('hold other failed');
    expect(failingHoldSession.hold).toHaveBeenCalled();

    await expect(phone.unhold('missing')).resolves.toBeUndefined();
    activeSession.__rc_localHold = false;
    await expect(phone.unhold('active')).resolves.toBeUndefined();
    activeSession.__rc_localHold = true;
    activeSession.unhold.mockRejectedValueOnce(new Error('unhold failed'));
    await expect(phone.unhold('active')).resolves.toBeUndefined();
    expect(phone._logger.error).toHaveBeenCalledWith(expect.any(Error));

    await expect(phone.startRecord('missing')).resolves.toBeUndefined();
    activeSession.__rc_callStatus = sessionStatus.connecting;
    await expect(phone.startRecord('active')).resolves.toBeUndefined();
    expect(activeSession.startRecording).not.toHaveBeenCalled();
    activeSession.__rc_callStatus = sessionStatus.connected;
    activeSession.startRecording.mockRejectedValueOnce({ code: 123 });
    await phone.startRecord('active');
    expect(phone._deps.alert.danger).toHaveBeenCalledWith({
      message: webphoneErrors.recordError,
      payload: { errorCode: 123 },
    });

    await expect(phone.stopRecord('missing')).resolves.toBeUndefined();
    await expect(phone.park('missing')).resolves.toBeUndefined();
    activeSession.park.mockResolvedValueOnce({});
    await expect(phone.park('active')).resolves.toBe('*undefined');
    await expect(phone.parkToLocation('missing', {
      id: '900',
      name: 'Park',
      extensionNumber: '8900',
    })).resolves.toBeUndefined();

    await expect(phone.transfer('+16505550123', 'missing')).resolves.toBeUndefined();
    phone._permissionCheck = true;
    phone._deps.numberValidate.validateNumbers.mockResolvedValueOnce({
      result: false,
      errors: [{ type: 'numberParseError', phoneNumber: 'bad-transfer' }],
    });
    await phone.transfer('bad-transfer', 'active');
    expect(phone._deps.alert.warning).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { phoneNumber: 'bad-transfer' },
      }),
    );

    await expect(phone.startWarmTransfer('+16505550123', 'missing')).resolves.toBeUndefined();
    const transferSession = createRawSession({
      callId: 'transfer',
      state: 'answered',
      __rc_transferSessionId: 'missing-old-session',
    });
    phone._webphone.callSessions = [activeSession, transferSession];
    await expect(phone.completeWarmTransfer('missing')).resolves.toBeUndefined();
    await expect(phone.completeWarmTransfer('transfer')).resolves.toBeUndefined();

    await expect(phone.flip('1', 'missing')).resolves.toBeUndefined();
    await expect(phone.sendDTMF('1', 'missing')).resolves.toBeUndefined();
    activeSession.sendDtmf.mockRejectedValueOnce(new Error('dtmf failed'));
    await phone.sendDTMF('1', 'active');
    expect(phone._logger.error).toHaveBeenCalledWith(expect.any(Error));
    await expect(phone.hangup('missing')).resolves.toBeUndefined();
    activeSession.hangup.mockRejectedValueOnce(new Error('hangup failed'));
    phone._onCallEnd = jest.fn();
    await phone.hangup('active');
    expect(phone._onCallEnd).toHaveBeenCalledWith(activeSession);
    await expect(phone.toVoiceMail('missing')).resolves.toBeUndefined();
    await expect(phone.replyWithMessage('missing', {
      replyType: 0,
      replyText: 'Later',
    })).resolves.toBeUndefined();
    expect(phone._addTrack(null)).toBeUndefined();

    const outboundPickupSession = createRawSession({
      callId: 'pickup-outbound',
      direction: 'outbound',
      state: 'init',
    });
    phone._webphone.callSessions = [outboundPickupSession];
    phone._webphone.call.mockImplementation(() => {});
    await phone.pickGroupCall('222', {
      direction: callDirections.outbound,
      from: '+16505550100',
      fromName: 'Agent',
      sipData: {
        fromTag: 'from-tag',
        toTag: 'to-tag',
      },
      telephonySessionId: 'group-session',
      to: '+16505550300',
      toName: 'Customer',
    }, '+16505550100');
    expect(outboundPickupSession.__rc_originalRemoteNumber).toBe('+16505550300');

    await phone.pickupInboundCall({
      sessionId: 'server-session',
      serverId: 'server-id',
      toNumber: '+16505550400',
      fromNumber: '+16505550100',
    });
    expect(phone._webphone.call).toHaveBeenCalledWith(
      '+16505550400',
      '+16505550100',
      expect.objectContaining({
        headers: {
          'RC-call-type': 'inbound-pickup; session-id: server-session; server-id: server-id',
        },
      }),
    );
  });
});
