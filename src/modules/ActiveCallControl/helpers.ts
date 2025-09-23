import type CallRecording from '@rc-ex/core/lib/definitions/CallRecording';
import type ExtensionTelephonySessionsEvent from '@rc-ex/core/lib/definitions/ExtensionTelephonySessionsEvent';
import type GetExtensionInfoResponse from '@rc-ex/core/lib/definitions/GetExtensionInfoResponse';
// eslint-disable-next-line import/no-named-as-default
import activeCallControlStatus from '@ringcentral-integration/commons/enums/activeCallControlStatus';
import { callDirection } from '@ringcentral-integration/commons/enums/callDirections';
// eslint-disable-next-line import/no-named-as-default
import callResults from '@ringcentral-integration/commons/enums/callResults';
import { telephonyStatus } from '@ringcentral-integration/commons/enums/telephonyStatus';
import type {
  CallerInfo,
  Call as ICall,
} from '@ringcentral-integration/commons/interfaces/Call.interface';
import { find } from 'ramda';
import {
  Party,
  PartyStatusCode,
  PartyToFrom,
  ReplyWithPattern,
  ReplyWithTextParams,
  Session as TelephonySession,
} from 'ringcentral-call-control/lib/Session';
import {
  type NormalizedSession,
  type Session,
} from '@ringcentral-integration/commons/interfaces/Webphone.interface';
import { recordStatus } from '@ringcentral-integration/commons/modules/Webphone/recordStatus';

import type {
  ActiveCallControlSessionData,
  ActiveSession,
} from '@ringcentral-integration/commons/modules/ActiveCallControl/ActiveCallControl.interface';

// telephony session status match presence telephonyStatus
export function mapTelephonyStatus(telephonySessionStatus: PartyStatusCode) {
  switch (telephonySessionStatus) {
    case PartyStatusCode.setup:
    case PartyStatusCode.proceeding:
      return telephonyStatus.ringing;
    case PartyStatusCode.hold:
      return telephonyStatus.onHold;
    case PartyStatusCode.answered:
      return telephonyStatus.callConnected;
    case PartyStatusCode.parked:
      return telephonyStatus.parkedCall;
    default:
      return telephonyStatus.noCall;
  }
}

export function isHangUp(code: string) {
  return code === callResults.disconnected;
}

export function isRejectCode({
  direction,
  code,
}: {
  direction: string;
  code: string;
}) {
  return (
    direction === callDirection.inbound &&
    (code === activeCallControlStatus.setUp ||
      code === activeCallControlStatus.proceeding)
  );
}

export function isOnRecording(recordings: Array<CallRecording>) {
  if (!recordings || recordings.length === 0) {
    return false;
  }
  const recording = recordings[0];
  return recording.active;
}

export function normalizeSession(
  session: ActiveCallControlSessionData,
  webphoneSession: NormalizedSession | undefined,
) {
  const { party, creationTime, sessionId } = session;
  const { id: partyId, direction, from, to, status, muted, recordings } = party;

  const formatValue: ActiveSession = {
    telephonySessionId: session.id,
    partyId,
    direction,
    from: from?.phoneNumber!,
    fromNumber: from?.phoneNumber!,
    fromUserName: from?.name!,
    to: to?.phoneNumber!,
    toNumber: to?.phoneNumber!,
    toUserName: to?.name!,
    id: session.id,
    sessionId,
    callStatus: mapTelephonyStatus(status?.code!),
    startTime: new Date(creationTime).getTime(),
    creationTime,
    recordStatus: isOnRecording(recordings!)
      ? recordStatus.recording
      : recordStatus.idle,
    isReject: isRejectCode({ direction, code: status?.code! }),
    toMatches: [],
    fromMatches: [],
    isOnMute: Boolean(
      /**
       * the server muted state
       */
      muted ||
        /**
         * the local muted state
         */
        webphoneSession?.isOnMute,
    ),
    isOnHold: status?.code === activeCallControlStatus.hold,
    isForwarded: false,
    isOnFlip: false,
    isOnTransfer: false,
    isReplied: false,
    isToVoicemail: false,
    lastHoldingTime: 0,
    minimized: false,
    removed: false,
  };
  return formatValue;
}

export function conflictError({
  message,
  response,
}: {
  message: string;
  response: any;
}) {
  const conflictErrRgx = /409/g;
  const conflictMsgRgx = /Incorrect State/g;
  return (
    conflictErrRgx.test(message) &&
    conflictMsgRgx.test(response && response._text)
  );
}

/**
 * when have webphoneSession, means that is on current device webphone call,
 * ignore fake call when when is other device call, fake call always not have webphoneSession be that is in current device
 */
export const isOtherDeviceCall = (callItem: ICall): boolean => {
  return Boolean(
    !callItem.webphoneSession &&
      // when not have id, means that is our fake call
      callItem.id,
  );
};

export const isRingingCall = (callItem: ICall | undefined): boolean => {
  return Boolean(
    callItem &&
      callItem.telephonySession &&
      isProceeding(callItem.telephonySession),
  );
};

const getTargetCallQueueName = (call: ICall) => {
  return (
    call.callQueueName ||
    call?.webphoneSession?.callQueueName ||
    // after call in call data not able to know that is from queue call, the only way is use matches to find that, maybe should have better way to do that with platform data
    (call.toMatches || []).find((match) => !!match.isCallQueueNumber)?.name ||
    ''
  );
};

export function getDisplayCallQueueName(call: ICall) {
  const isOutbound = call.direction === callDirection.outbound;
  if (isOutbound) return '';

  return getTargetCallQueueName(call);
}

/**
 * check call is department call during call connected, if you want check does call is queue call after call end, should use `isQueueHistoryCall`
 */
export const isQueueCall = (call: ICall) => {
  if (call.direction === callDirection.outbound) {
    return Boolean(
      (call.toMatches || []).some((match) => !!match.isCallQueueNumber),
    );
  }

  return Boolean(call.callQueueName || call?.webphoneSession?.callQueueName);
};

export const isHoldingCall = (callItem: ICall | undefined): boolean => {
  return Boolean(
    callItem &&
      callItem.telephonySession &&
      isHolding(callItem.telephonySession),
  );
};

export function isProceeding(
  telephonySession: ActiveCallControlSessionData | Session,
) {
  return (
    telephonySession &&
    (telephonySession.status === PartyStatusCode.proceeding ||
      telephonySession.status === PartyStatusCode.setup) &&
    telephonySession.direction === callDirection.inbound
  );
}

export function isHolding(
  telephonySession: Pick<ActiveCallControlSessionData, 'status'>,
) {
  return telephonySession.status === PartyStatusCode.hold;
}

export function isRecording(session: ActiveCallControlSessionData) {
  const { party } = session;
  return isOnRecording(party.recordings!);
}

export function isForwardedToVoiceMail(session: ActiveCallControlSessionData) {
  return session.status === PartyStatusCode.voicemail;
}

export function isOnSetupStage(session: ActiveCallControlSessionData) {
  return session.status === PartyStatusCode.setup;
}

export function isFaxSession(session: ActiveCallControlSessionData) {
  return session.status === PartyStatusCode.faxReceive;
}

// call to main company number but still at inputting extension number prompt tone stage
export function isAtMainNumberPromptToneStage(session: TelephonySession) {
  if (!session) return false;
  const { otherParties = [] } = session;
  if (
    session.party?.direction === callDirection.outbound &&
    session.party?.status.code === PartyStatusCode.answered &&
    !otherParties.length
  ) {
    return true;
  }
  return false;
}

export function getInboundSwitchedParty(parties: Party[]) {
  if (!parties.length) return false;
  const result = find((party: Party) => {
    return (
      party.direction === callDirection.inbound &&
      party.status?.code === PartyStatusCode.disconnected &&
      // TODO: should add type to PartyStatusCode at ringcentral-call-control
      // @ts-ignore
      party.status?.reason === 'CallSwitch'
    );
  }, parties);
  return result;
}

export function normalizeTelephonySession(session?: TelephonySession) {
  if (!session) {
    return {};
  }
  return {
    accountId: session.accountId,
    creationTime: session.creationTime,
    data: session.data,
    extensionId: session.extensionId,
    id: session.id,
    origin: session.origin,
    otherParties: session.otherParties,
    parties: session.parties,
    party: session.party,
    recordings: session.recordings,
    requestOptions: session.requestOptions,
    serverId: session.serverId,
    sessionId: session.sessionId,
    voiceCallToken: session.voiceCallToken,
  };
}

// fix call control api issue.
export const WEBPHONE_REPLY_TIME_UNIT = {
  Minute: '0',
  Hour: '1',
  Day: '2',
};

export const WEBPHONE_REPLY_TYPE = {
  customMessage: 0,
  callBack: 1,
  onMyWay: 2,
  inAMeeting: 5,
};

export function getWebphoneReplyMessageOption(params: ReplyWithTextParams) {
  if (params.replyWithText) {
    return {
      replyType: WEBPHONE_REPLY_TYPE.customMessage,
      replyText: params.replyWithText,
    };
  }
  if (params.replyWithPattern?.pattern === ReplyWithPattern.onMyWay) {
    return {
      replyType: WEBPHONE_REPLY_TYPE.onMyWay,
    };
  }
  if (params.replyWithPattern?.pattern === ReplyWithPattern.inAMeeting) {
    return {
      replyType: WEBPHONE_REPLY_TYPE.inAMeeting,
    };
  }
  const replyType = WEBPHONE_REPLY_TYPE.callBack;
  let callbackDirection;
  if (params.replyWithPattern?.pattern.includes('CallMe')) {
    callbackDirection = `1`;
  } else {
    callbackDirection = `0`;
  }
  return {
    replyType,
    timeValue: params.replyWithPattern?.time || '',
    timeUnits: WEBPHONE_REPLY_TIME_UNIT[params.replyWithPattern!.timeUnit!],
    callbackDirection,
  };
}

export const CONFERENCE_ORIGIN_TYPE = 'Conference';
export function checkIfConferenceCall(session: TelephonySession) {
  return session?.origin?.type === CONFERENCE_ORIGIN_TYPE;
}

export function normalizeToActiveCallControlSession(
  session: TelephonySession,
  conferenceParticipants: ActiveCallControlSessionData['conferenceParticipants'],
  getPartyExtensionNumber?: (party: PartyToFrom) => string | undefined,
): ActiveCallControlSessionData {
  const direction = session.party?.direction || callDirection.outbound;
  const status = session.party?.status.code;

  const { party, otherParties } = session;

  // workaround of bug:
  // switch an inbound call then call direction will change to outbound
  if (
    direction === callDirection.outbound &&
    status !== PartyStatusCode.disconnected
  ) {
    const inboundSwitchedParty = getInboundSwitchedParty(otherParties);
    if (inboundSwitchedParty) {
      party.direction = inboundSwitchedParty.direction;
      party.to = inboundSwitchedParty.to;
      party.from = inboundSwitchedParty.from;
    }
  }

  const isConferenceCall = session.origin?.type === CONFERENCE_ORIGIN_TYPE;
  const sessionId = isConferenceCall ? session.id : session.data.sessionId;
  const from = session.party?.from;
  const to = session.party?.to;

  return {
    ...session.data,
    direction: session.party?.direction || callDirection.outbound,
    // in session call data not include the extensionNumber or phoneNumber, so we need check that in the parties
    from: getPartyExtensionNumber
      ? {
          ...from,
          extensionNumber: getPartyExtensionNumber(from),
        }
      : from,
    to: getPartyExtensionNumber
      ? {
          ...to,
          extensionNumber: getPartyExtensionNumber(to),
        }
      : to,
    //
    id: session.id,
    otherParties: session.otherParties || [],
    party: session.party || {},
    recordings: session.recordings,
    isRecording: isOnRecording(session.recordings),
    sessionId,
    startTime: new Date(session.data.creationTime).getTime(),
    status: session.party?.status.code,
    telephonySessionId: session.id,
    telephonySession: normalizeTelephonySession(session),
    isConferenceCall,
    conferenceParticipants,
    callQueueName: getSessionQueueName(session),
  };
}

const getSessionQueueName = (session: TelephonySession) => {
  const primary = session.party?.uiCallInfo?.primary;
  if (primary?.type === 'QueueName') return primary?.value;

  return undefined;
};

export const findConferenceParticipants = (
  currentSession: TelephonySession,
  sessions: TelephonySession[],
  selfExtensionInfo: GetExtensionInfoResponse | undefined,
  checkStillExist?: (session: TelephonySession, partyId: string) => boolean,
) => {
  if (currentSession.origin?.type !== CONFERENCE_ORIGIN_TYPE) {
    return [];
  }
  const conferenceParticipants: ActiveCallControlSessionData['conferenceParticipants'] =
    [];
  sessions.forEach((session) => {
    const { party = {} } = session;
    const { code, peerId = {}, reason } = party.status || {};

    if (checkStillExist && !checkStillExist(session, peerId.partyId)) {
      return;
    }
    if (session === currentSession) {
      if (
        party.conferenceRole === 'Host' ||
        (!party.conferenceRole && reason === 'CallSwitch')
      ) {
        conferenceParticipants.unshift({
          sessionId: session.data.sessionId,
          telephonySessionId: session.id,
          partyId: peerId.partyId,
          isHost: true,
          sessionName: '',
          // in new spring-ui, we need render the info of the host
          info:
            process.env.THEME_SYSTEM === 'spring-ui' && selfExtensionInfo
              ? ({
                  phoneNumber: selfExtensionInfo.contact?.businessPhone!,
                  extensionNumber: selfExtensionInfo.extensionNumber!,
                  name: selfExtensionInfo.name!,
                  extensionId: `${selfExtensionInfo.id}`,
                } satisfies CallerInfo)
              : {},
        });
      }
    }

    if (
      code === PartyStatusCode.gone &&
      reason === CONFERENCE_ORIGIN_TYPE &&
      peerId.telephonySessionId === currentSession.id
    ) {
      const inbound = party?.direction === callDirection.inbound;
      conferenceParticipants.push({
        sessionId: session.data.sessionId,
        telephonySessionId: session.id,
        partyId: peerId.partyId,
        sessionName: inbound ? party.from?.name : party.to?.name,
        info: inbound ? party.from : party.to,
        queueName: getSessionQueueName(session),
      });
    }
  });
  return conferenceParticipants;
};

export function isConnectedCall(session: TelephonySession) {
  const status = session.party?.status.code;
  const { party } = session;

  const reason = party?.status?.reason;

  if (!session?.party?.status?.code) {
    return false;
  }

  return !(
    (status === PartyStatusCode.disconnected && reason !== 'CallSwitch') ||
    status === PartyStatusCode.gone
  );
}

// fixed this bug
export const checkRingOutCallDirection = (
  message: ExtensionTelephonySessionsEvent,
) => {
  const { body } = message;
  const originType = body?.origin?.type;

  if (body && originType === 'RingOut') {
    const { parties } = body;
    if (Array.isArray(parties) && parties.length) {
      parties.forEach((party: any) => {
        if (
          party.ringOutRole &&
          party.ringOutRole === 'Initiator' &&
          party.direction === 'Inbound'
        ) {
          const tempFrom = { ...party.from };
          party.direction = 'Outbound';
          party.from = party.to;
          party.to = tempFrom;
        }
      });
    }
  }
  return message;
};
