import activeCallControlStatus from '@ringcentral-integration/commons/enums/activeCallControlStatus';
import { callDirection } from '@ringcentral-integration/commons/enums/callDirections';
import callResults from '@ringcentral-integration/commons/enums/callResults';
import { telephonyStatus } from '@ringcentral-integration/commons/enums/telephonyStatus';
import { recordStatus } from '@ringcentral-integration/commons/modules/Webphone/recordStatus';
import {
  PartyStatusCode,
  ReplyWithPattern,
} from 'ringcentral-call-control/lib/Session';

import {
  getValidAttachments,
  setOutputDeviceWhenCall,
  trackWebphoneCallEnded,
} from '../../src/modules/Adapter/helper';
import {
  checkThirdPartySettings,
  findSettingItem,
  formatContacts,
  getImageUri,
  getTranscriptText,
} from '../../src/modules/ThirdPartyService/helper';
import {
  checkIfConferenceCall,
  checkRingOutCallDirection,
  conflictError,
  findConferenceParticipants,
  getDisplayCallQueueName,
  getInboundSwitchedParty,
  getWebphoneReplyMessageOption,
  isAtMainNumberPromptToneStage,
  isConnectedCall,
  isFaxSession,
  isForwardedToVoiceMail,
  isHangUp,
  isHolding,
  isHoldingCall,
  isOnRecording,
  isOnSetupStage,
  isOtherDeviceCall,
  isProceeding,
  isQueueCall,
  isRecording,
  isRejectCode,
  isRingingCall,
  mapTelephonyStatus,
  normalizeSession,
  normalizeTelephonySession,
  normalizeToActiveCallControlSession,
  WEBPHONE_REPLY_TYPE,
} from '../../src/modules/ActiveCallControl/helpers';

describe('third-party service helpers', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('validates settings, keeps valid nested items, and reports invalid items', () => {
    const settings = [
      { name: 'Legacy toggle', value: true },
      { id: 'boolean', name: 'Boolean', type: 'boolean', value: false },
      { id: 'bad-boolean', name: 'Bad Boolean', type: 'boolean', value: 'yes' },
      { id: 'button', name: 'Button', type: 'button', buttonLabel: 'Run' },
      { id: 'bad-button', name: 'Bad Button', type: 'button', buttonLabel: 1 },
      {
        id: 'option',
        name: 'Option',
        type: 'option',
        value: 'a',
        options: [{ id: 'a', name: 'A' }],
      },
      {
        id: 'multi-option',
        name: 'Multi Option',
        type: 'option',
        multiple: true,
        value: ['a', 'b'],
        options: [{ id: 'a', name: 'A' }],
      },
      {
        id: 'section',
        name: 'Section',
        type: 'section',
        items: [
          { id: 'section-toggle', name: 'Section Toggle', type: 'boolean', value: true },
          { id: 'section-array', name: 'Section Array', type: 'array', value: ['one'] },
          { id: 'section-bad-array', name: 'Bad Array', type: 'array', value: [1] },
        ],
      },
      {
        id: 'group',
        name: 'Group',
        type: 'group',
        items: [{ id: 'group-toggle', name: 'Group Toggle', type: 'boolean', value: true }],
      },
      { id: 'external', name: 'External', type: 'externalLink', uri: 'https://example.com' },
      { id: 'bad-external', name: 'Bad External', type: 'externalLink', uri: 'ftp://example.com' },
      { id: 'bad-order', name: 'Bad Order', type: 'boolean', value: true, order: '1' },
      { id: 'bad-name', name: 1, type: 'boolean', value: true },
    ];

    const validSettings = checkThirdPartySettings(settings);

    expect(validSettings).toEqual([
      { id: 'Legacy toggle', name: 'Legacy toggle', value: true, type: 'boolean' },
      { id: 'boolean', name: 'Boolean', type: 'boolean', value: false },
      { id: 'button', name: 'Button', type: 'button', buttonLabel: 'Run' },
      {
        id: 'option',
        name: 'Option',
        type: 'option',
        value: 'a',
        options: [{ id: 'a', name: 'A' }],
      },
      {
        id: 'section',
        name: 'Section',
        type: 'section',
        items: [
          { id: 'section-toggle', name: 'Section Toggle', type: 'boolean', value: true },
          { id: 'section-array', name: 'Section Array', type: 'array', value: ['one'] },
        ],
      },
      {
        id: 'group',
        name: 'Group',
        type: 'group',
        items: [{ id: 'group-toggle', name: 'Group Toggle', type: 'boolean', value: true }],
      },
      { id: 'external', name: 'External', type: 'externalLink', uri: 'https://example.com' },
    ]);
    expect(console.warn).toHaveBeenCalledWith(
      'Invalid settings:',
      expect.arrayContaining([
        expect.objectContaining({ id: 'bad-boolean' }),
        expect.objectContaining({ id: 'bad-button' }),
        expect.objectContaining({ id: 'multi-option' }),
        expect.objectContaining({ id: 'bad-external' }),
      ]),
    );
    expect(findSettingItem(validSettings, 'group-toggle')).toEqual(
      expect.objectContaining({ id: 'group-toggle' }),
    );
    expect(findSettingItem(validSettings, 'missing')).toBeNull();
  });

  it('formats contacts, image URIs, and transcript text', () => {
    expect(formatContacts([
      {
        id: '1',
        phoneNumbers: [
          { phoneNumber: '+1', phoneType: 'mobile' },
          { phoneNumber: '+2', phoneType: 'businessPhone' },
          { phoneNumber: '+3', phoneType: 'UnsupportedPhone' },
          { phoneNumber: '+4' },
        ],
      },
    ])).toEqual([
      {
        id: '1',
        phoneNumbers: [
          { phoneNumber: '+1', phoneType: 'mobile' },
          { phoneNumber: '+2', phoneType: 'business' },
          { phoneNumber: '+3', phoneType: 'other' },
          { phoneNumber: '+4', phoneType: 'unknown' },
        ],
      },
    ]);
    expect(getImageUri()).toBeNull();
    expect(getImageUri('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
    expect(getImageUri('https://example.com/image.png')).toBe('https://example.com/image.png');
    expect(getImageUri('ftp://example.com/image.png')).toBeNull();
    expect(getTranscriptText(null, {})).toBe('');
    expect(getTranscriptText({ context: {}, transcripts: null }, {})).toBe('');
    expect(getTranscriptText({
      context: {
        participants: [
          { participantId: 'p1', extensionId: '101', name: 'Participant One' },
          { participantId: 'p2', extensionId: '102', name: 'Participant Two' },
          { participantId: 'p3', name: 'Participant Three' },
        ],
      },
      transcripts: [
        { participantId: 'p1', text: 'hello' },
        { participantId: 'p2', text: 'hi' },
        { participantId: 'p3', text: 'done' },
      ],
    }, {
      from: { extensionId: '101', name: 'From Name' },
      to: { extensionId: '102', phoneNumber: '+16505550102' },
      fromName: 'Caller',
    })).toBe('Caller: hello\n+16505550102: hi\nParticipant Three: done');
  });
});

describe('adapter helper utilities', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('refreshes audio devices only when webphone has sessions', () => {
    const audioSettings = { getUserMedia: jest.fn() };
    setOutputDeviceWhenCall({ webphoneSessions: [] }, audioSettings);
    setOutputDeviceWhenCall({ webphoneSessions: [{}] }, audioSettings);
    expect(audioSettings.getUserMedia).toHaveBeenCalledTimes(1);
  });

  it('filters valid base64 attachments and rejects invalid data', () => {
    const validAttachments = getValidAttachments([
      null,
      { name: 1, content: 'data:image/png;base64,QQ==' },
      { name: 'missing-content' },
      { name: 'plain', content: 'hello' },
      { name: 'unsupported', content: 'data:text/plain;base64,QQ==' },
      { name: 'image.png', content: 'data:image/png;base64,QQ==' },
    ]);

    expect(getValidAttachments()).toEqual([]);
    expect(validAttachments).toHaveLength(1);
    expect(validAttachments[0]).toEqual(
      expect.objectContaining({
        name: 'image.png',
        size: 1,
      }),
    );
    expect(validAttachments[0].file).toBeInstanceOf(Blob);
    expect(console.warn).toHaveBeenCalled();
  });

  it('tracks webphone call-end analytics result priority', () => {
    jest.spyOn(Date, 'now').mockReturnValue(20000);
    const analytics = { track: jest.fn() };
    trackWebphoneCallEnded(analytics, {
      direction: 'Inbound',
      startTime: 10000,
      isToVoicemail: true,
      isOnFlip: true,
      isForwarded: true,
      isReplied: true,
      isOnTransfer: true,
    });
    trackWebphoneCallEnded(analytics, {
      direction: 'Outbound',
    });

    expect(analytics.track).toHaveBeenNthCalledWith(
      1,
      'WebRTC Call Ended',
      {
        direction: 'Inbound',
        duration: 11,
        result: 'Transfer',
      },
    );
    expect(analytics.track).toHaveBeenNthCalledWith(
      2,
      'WebRTC Call Ended',
      {
        direction: 'Outbound',
        duration: 0,
        result: 'Terminated',
      },
    );
  });
});

function createTelephonySession(overrides = {}) {
  const party = {
    id: 'party-id',
    direction: callDirection.inbound,
    from: { phoneNumber: '+16505550101', name: 'Caller' },
    to: { phoneNumber: '+16505550102', name: 'Receiver' },
    status: { code: PartyStatusCode.proceeding },
    muted: false,
    recordings: [{ active: true }],
    ...overrides.party,
  };
  return {
    id: 'telephony-session-id',
    accountId: 'account-id',
    creationTime: '2026-01-01T10:00:00.000Z',
    data: {
      id: 'platform-session-id',
      sessionId: 'platform-session-id',
      creationTime: '2026-01-01T10:00:00.000Z',
    },
    extensionId: 'extension-id',
    origin: {},
    otherParties: [],
    parties: [party],
    party,
    recordings: [{ active: true }],
    requestOptions: { timeout: 1 },
    serverId: 'server-id',
    sessionId: 'telephony-session-id',
    voiceCallToken: 'voice-call-token',
    ...overrides,
  };
}

describe('active call control helpers', () => {
  it('maps status and basic call-state predicates', () => {
    expect(mapTelephonyStatus(PartyStatusCode.setup)).toBe(telephonyStatus.ringing);
    expect(mapTelephonyStatus(PartyStatusCode.proceeding)).toBe(telephonyStatus.ringing);
    expect(mapTelephonyStatus(PartyStatusCode.hold)).toBe(telephonyStatus.onHold);
    expect(mapTelephonyStatus(PartyStatusCode.answered)).toBe(telephonyStatus.callConnected);
    expect(mapTelephonyStatus(PartyStatusCode.parked)).toBe(telephonyStatus.parkedCall);
    expect(mapTelephonyStatus(PartyStatusCode.disconnected)).toBe(telephonyStatus.noCall);
    expect(isHangUp(callResults.disconnected)).toBe(true);
    expect(isRejectCode({
      direction: callDirection.inbound,
      code: activeCallControlStatus.setUp,
    })).toBe(true);
    expect(isRejectCode({
      direction: callDirection.outbound,
      code: activeCallControlStatus.setUp,
    })).toBe(false);
    expect(isOnRecording([{ active: true }])).toBe(true);
    expect(isOnRecording([])).toBe(false);
    expect(conflictError({ message: '409 response', response: { _text: 'Incorrect State' } })).toBe(true);
    expect(conflictError({ message: '500 response', response: { _text: 'Incorrect State' } })).toBe(false);
    expect(isOtherDeviceCall({ id: 'server-call' })).toBe(true);
    expect(isOtherDeviceCall({ id: 'server-call', webphoneSession: {} })).toBe(false);
  });

  it('normalizes active call control sessions', () => {
    const session = {
      id: 'session-id',
      sessionId: 'platform-session-id',
      creationTime: '2026-01-01T10:00:00.000Z',
      party: {
        id: 'party-id',
        direction: callDirection.inbound,
        from: { phoneNumber: '+1', name: 'From' },
        to: { phoneNumber: '+2', name: 'To' },
        status: { code: activeCallControlStatus.proceeding },
        muted: false,
        recordings: [{ active: false }],
      },
    };
    const normalized = normalizeSession(session, { isOnMute: true });

    expect(normalized).toEqual(
      expect.objectContaining({
        telephonySessionId: 'session-id',
        partyId: 'party-id',
        direction: callDirection.inbound,
        from: '+1',
        to: '+2',
        callStatus: telephonyStatus.ringing,
        isReject: true,
        isOnMute: true,
        recordStatus: recordStatus.idle,
      }),
    );
  });

  it('detects ringing, holding, queue, recording, setup, fax, and voicemail states', () => {
    expect(isRingingCall({
      telephonySession: {
        status: PartyStatusCode.proceeding,
        direction: callDirection.inbound,
      },
    })).toBe(true);
    expect(isRingingCall()).toBe(false);
    expect(isHoldingCall({ telephonySession: { status: PartyStatusCode.hold } })).toBe(true);
    expect(isHoldingCall()).toBe(false);
    expect(isProceeding({
      status: PartyStatusCode.setup,
      direction: callDirection.inbound,
    })).toBe(true);
    expect(isProceeding({
      status: PartyStatusCode.setup,
      direction: callDirection.outbound,
    })).toBe(false);
    expect(isHolding({ status: PartyStatusCode.hold })).toBe(true);
    expect(isRecording({ party: { recordings: [{ active: true }] } })).toBe(true);
    expect(isForwardedToVoiceMail({ status: PartyStatusCode.voicemail })).toBe(true);
    expect(isOnSetupStage({ status: PartyStatusCode.setup })).toBe(true);
    expect(isFaxSession({ status: PartyStatusCode.faxReceive })).toBe(true);
    expect(getDisplayCallQueueName({ direction: callDirection.outbound })).toBe('');
    expect(getDisplayCallQueueName({
      direction: callDirection.inbound,
      webphoneSession: { callQueueName: 'Support' },
    })).toBe('Support');
    expect(isQueueCall({
      direction: callDirection.outbound,
      toMatches: [{ isCallQueueNumber: true }],
    })).toBe(true);
    expect(isQueueCall({
      direction: callDirection.inbound,
      webphoneSession: { callQueueName: 'Support' },
    })).toBe(true);
  });

  it('normalizes telephony sessions and active call control session data', () => {
    const switchedParty = {
      direction: callDirection.inbound,
      status: {
        code: PartyStatusCode.disconnected,
        reason: 'CallSwitch',
      },
      from: { phoneNumber: '+3' },
      to: { phoneNumber: '+4' },
    };
    const session = createTelephonySession({
      origin: { type: 'Conference' },
      otherParties: [switchedParty],
      party: {
        direction: callDirection.outbound,
        status: { code: PartyStatusCode.answered },
        from: { phoneNumber: '+1' },
        to: { phoneNumber: '+2' },
        uiCallInfo: {
          primary: {
            type: 'QueueName',
            value: 'Support Queue',
          },
        },
      },
    });

    expect(normalizeTelephonySession()).toEqual({});
    expect(normalizeTelephonySession(session)).toEqual(
      expect.objectContaining({
        accountId: 'account-id',
        id: 'telephony-session-id',
        voiceCallToken: 'voice-call-token',
      }),
    );
    expect(getInboundSwitchedParty([])).toBe(false);
    expect(getInboundSwitchedParty([switchedParty])).toBe(switchedParty);
    expect(checkIfConferenceCall(session)).toBe(true);
    expect(normalizeToActiveCallControlSession(
      session,
      [{ partyId: 'conference-party' }],
      () => '101',
    )).toEqual(
      expect.objectContaining({
        id: 'telephony-session-id',
        direction: callDirection.inbound,
        sessionId: 'telephony-session-id',
        isRecording: true,
        isConferenceCall: true,
        callQueueName: 'Support Queue',
        conferenceParticipants: [{ partyId: 'conference-party' }],
        from: expect.objectContaining({ extensionNumber: '101' }),
        to: expect.objectContaining({ extensionNumber: '101' }),
      }),
    );
  });

  it('builds webphone reply options and checks connected call states', () => {
    expect(getWebphoneReplyMessageOption({ replyWithText: 'I will call back' })).toEqual({
      replyType: WEBPHONE_REPLY_TYPE.customMessage,
      replyText: 'I will call back',
    });
    expect(getWebphoneReplyMessageOption({
      replyWithPattern: { pattern: ReplyWithPattern.onMyWay },
    })).toEqual({ replyType: WEBPHONE_REPLY_TYPE.onMyWay });
    expect(getWebphoneReplyMessageOption({
      replyWithPattern: { pattern: ReplyWithPattern.inAMeeting },
    })).toEqual({ replyType: WEBPHONE_REPLY_TYPE.inAMeeting });
    expect(getWebphoneReplyMessageOption({
      replyWithPattern: {
        pattern: 'CallMeIn',
        time: '5',
        timeUnit: 'Minute',
      },
    })).toEqual({
      replyType: WEBPHONE_REPLY_TYPE.callBack,
      timeValue: '5',
      timeUnits: '0',
      callbackDirection: '1',
    });
    expect(getWebphoneReplyMessageOption({
      replyWithPattern: {
        pattern: 'WillCallYouIn',
        time: '1',
        timeUnit: 'Hour',
      },
    })).toEqual({
      replyType: WEBPHONE_REPLY_TYPE.callBack,
      timeValue: '1',
      timeUnits: '1',
      callbackDirection: '0',
    });
    expect(isAtMainNumberPromptToneStage(null)).toBe(false);
    expect(isAtMainNumberPromptToneStage({
      party: {
        direction: callDirection.outbound,
        status: { code: PartyStatusCode.answered },
      },
      otherParties: [],
    })).toBe(true);
    expect(isConnectedCall({ party: { status: {} } })).toBe(false);
    expect(isConnectedCall({
      party: { status: { code: PartyStatusCode.disconnected, reason: 'Normal' } },
    })).toBe(false);
    expect(isConnectedCall({
      party: { status: { code: PartyStatusCode.disconnected, reason: 'CallSwitch' } },
    })).toBe(true);
    expect(isConnectedCall({
      party: { status: { code: PartyStatusCode.gone } },
    })).toBe(false);
  });

  it('finds conference participants and fixes RingOut initiator direction', () => {
    const currentSession = createTelephonySession({
      origin: { type: 'Conference' },
      party: {
        status: { peerId: { partyId: 'host-party' }, reason: 'CallSwitch' },
        conferenceRole: 'Host',
      },
    });
    const participantSession = createTelephonySession({
      id: 'participant-session',
      data: { sessionId: 'participant-platform-session' },
      party: {
        direction: callDirection.inbound,
        status: {
          code: PartyStatusCode.gone,
          reason: 'Conference',
          peerId: {
            telephonySessionId: 'telephony-session-id',
            partyId: 'participant-party',
          },
        },
        from: { name: 'Participant From' },
        to: { name: 'Participant To' },
      },
    });

    process.env.THEME_SYSTEM = 'spring-ui';
    expect(findConferenceParticipants(
      currentSession,
      [currentSession, participantSession],
      {
        id: '101',
        name: 'Self User',
        extensionNumber: '101',
        contact: { businessPhone: '+16505550101' },
      },
      () => true,
    )).toEqual([
      expect.objectContaining({
        partyId: 'host-party',
        isHost: true,
        info: expect.objectContaining({ name: 'Self User' }),
      }),
      expect.objectContaining({
        telephonySessionId: 'participant-session',
        partyId: 'participant-party',
        sessionName: 'Participant From',
        info: { name: 'Participant From' },
      }),
    ]);
    expect(findConferenceParticipants({ origin: {} }, [], undefined)).toEqual([]);
    expect(findConferenceParticipants(
      currentSession,
      [participantSession],
      undefined,
      () => false,
    )).toEqual([]);

    const message = {
      body: {
        origin: { type: 'RingOut' },
        parties: [{
          ringOutRole: 'Initiator',
          direction: 'Inbound',
          from: { phoneNumber: '+1' },
          to: { phoneNumber: '+2' },
        }],
      },
    };
    expect(checkRingOutCallDirection(message)).toBe(message);
    expect(message.body.parties[0]).toEqual({
      ringOutRole: 'Initiator',
      direction: 'Outbound',
      from: { phoneNumber: '+2' },
      to: { phoneNumber: '+1' },
    });
    expect(checkRingOutCallDirection({ body: { origin: { type: 'Other' } } })).toEqual({
      body: { origin: { type: 'Other' } },
    });
  });
});
