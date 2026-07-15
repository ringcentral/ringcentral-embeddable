import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import { recordStatus } from '@ringcentral-integration/commons/modules/Webphone/recordStatus';
import { sessionStatus } from '@ringcentral-integration/commons/modules/Webphone/sessionStatus';

import {
  isDroppingVoicemail,
  isOnHold,
  isRing,
  isSharedWorkerSupported,
  normalizeSession,
  rejectSession,
  sortByCreationTimeDesc,
  sortByLastActiveTimeDesc,
} from '../../src/modules/WebphoneV2/webphoneHelper';
import voicemailDropStatus from '../../src/modules/WebphoneV2/voicemailDropStatus';

function createSession(overrides = {}) {
  return {
    callId: 'call-1',
    direction: 'inbound',
    state: 'ringing',
    localNumber: '101',
    remoteNumber: '+16505550100',
    remotePeer: '"Remote User" <sip:+16505550100@example.com>;tag=remote-tag',
    localPeer: '"Local User" <sip:101@example.com>;tag=local-tag',
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
    rcApiCallInfo: {
      queueName: 'Support',
    },
    __rc_creationTime: 123,
    __rc_fromNumber: '+16505550101',
    __rc_isOnMute: true,
    __rc_isOnFlip: true,
    __rc_isOnTransfer: true,
    __rc_isToVoicemail: true,
    __rc_isForwarded: true,
    __rc_isReplied: true,
    __rc_recordStatus: recordStatus.recording,
    __rc_contactMatch: { id: 'contact-id' },
    __rc_minimized: true,
    __rc_lastActiveTime: 456,
    __rc_transferSessionId: 'warm-transfer-id',
    __rc_localHold: true,
    __rc_originalLocalNumber: '102',
    __rc_originalLocalName: 'Original Local',
    ...overrides,
  };
}

describe('WebphoneV2 helpers', () => {
  afterEach(() => {
    delete global.SharedWorker;
  });

  it('normalizes inbound sessions with call parties and derived state', () => {
    const normalized = normalizeSession(createSession());

    expect(normalized).toEqual(
      expect.objectContaining({
        id: 'call-1',
        callId: 'call-1',
        direction: callDirections.inbound,
        callStatus: sessionStatus.connecting,
        to: '101',
        toUserName: 'Local User',
        from: '+16505550100',
        fromUserName: 'Remote User',
        fromTag: 'remote-tag',
        toTag: 'local-tag',
        startTime: new Date('2026-01-02T03:04:05.000Z').getTime(),
        creationTime: 123,
        isOnMute: true,
        isOnFlip: true,
        isOnTransfer: true,
        isToVoicemail: true,
        isForwarded: true,
        isReplied: true,
        recordStatus: recordStatus.recording,
        contactMatch: { id: 'contact-id' },
        minimized: true,
        partyData: {
          partyId: 'party-id',
          sessionId: 'session-id',
        },
        lastActiveTime: 456,
        cached: false,
        removed: false,
        callQueueName: 'Support - ',
        warmTransferSessionId: 'warm-transfer-id',
        isOnHold: true,
        originalLocalNumber: '102',
        originalLocalName: 'Original Local',
      }),
    );
    expect(isRing(normalized)).toBe(true);
    expect(isOnHold(normalized)).toBe(true);
  });

  it('normalizes outbound and transferred sessions with fallbacks', () => {
    const normalized = normalizeSession(createSession({
      direction: 'outbound',
      state: 'answered',
      remoteNumber: '+16505550200',
      localNumber: '+16505550199',
      __rc_originalRemoteNumber: '+16505550201',
      __rc_originalRemoteName: 'Original Remote',
      __rc_isReceivedTransfer: true,
      __rc_voicemailDropStatus: voicemailDropStatus.sending,
      __rc_recordStatus: undefined,
      rcApiCallInfo: null,
      partyId: null,
    }));

    expect(normalized).toEqual(
      expect.objectContaining({
        direction: callDirections.outbound,
        callStatus: sessionStatus.connected,
        to: '+16505550201',
        toUserName: 'Original Remote',
        from: '+16505550199',
        fromUserName: 'Local User',
        fromTag: 'local-tag',
        toTag: 'remote-tag',
        partyData: null,
        callQueueName: null,
        recordStatus: recordStatus.idle,
        isOnHold: false,
        isReceivedTransfer: true,
        receivedTransferFromNumber: '+16505550200',
        receivedTransferFromName: 'Remote User',
      }),
    );
    expect(isRing(normalized)).toBe(false);
  });

  it('handles empty sessions, sort helpers, voicemail drop statuses, and SharedWorker support', () => {
    expect(normalizeSession()).toBeUndefined();
    expect(isDroppingVoicemail(voicemailDropStatus.waitingForGreetingEnd)).toBe(true);
    expect(isDroppingVoicemail(voicemailDropStatus.sending)).toBe(true);
    expect(isDroppingVoicemail(voicemailDropStatus.finished)).toBe(true);
    expect(isDroppingVoicemail(voicemailDropStatus.terminated)).toBe(true);
    expect(isDroppingVoicemail(voicemailDropStatus.greetingDetectionFailed)).toBe(true);
    expect(isDroppingVoicemail('idle')).toBe(false);
    expect(sortByCreationTimeDesc({ startTime: 1 }, { startTime: 3 })).toBe(2);
    expect(sortByLastActiveTimeDesc(null, { lastActiveTime: 3 })).toBe(0);
    expect(sortByLastActiveTimeDesc(
      { lastActiveTime: 2, startTime: 10 },
      { lastActiveTime: 2, startTime: 12 },
    )).toBe(2);
    expect(isSharedWorkerSupported()).toBe(false);
    global.SharedWorker = function SharedWorker() {};
    expect(isSharedWorkerSupported()).toBe(true);
  });

  it('rejects sessions and removes matching webphone call sessions', async () => {
    const session = createSession();
    const otherSession = { callId: 'other-call' };
    session.dispose = jest.fn();
    session.webPhone = {
      sipClient: {
        reply: jest.fn(async () => {}),
      },
      callSessions: [otherSession, session],
    };

    await rejectSession(session);

    expect(session.webPhone.sipClient.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'SIP/2.0 480 Temporarily Unavailable',
      }),
    );
    expect(session.webPhone.callSessions).toEqual([otherSession]);
    expect(session.dispose).toHaveBeenCalled();
  });

  it('does not dispose a rejected session when it is already absent from call sessions', async () => {
    const session = createSession();
    session.dispose = jest.fn();
    session.webPhone = {
      sipClient: {
        reply: jest.fn(async () => {}),
      },
      callSessions: [],
    };

    await rejectSession(session);

    expect(session.webPhone.sipClient.reply).toHaveBeenCalled();
    expect(session.dispose).not.toHaveBeenCalled();
  });
});
