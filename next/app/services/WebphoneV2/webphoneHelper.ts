import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import type {
  NormalizedSession,
  PartyData,
} from '@ringcentral-integration/commons/interfaces/Webphone.interface';
import camelCase from 'lodash/camelCase';
import RequestMessage from 'ringcentral-web-phone/sip-message/outbound/request';
import callControlCommands from 'ringcentral-web-phone/rc-message/call-control-commands';
import RcMessage from 'ringcentral-web-phone/rc-message/rc-message';
import type InboundMessage from 'ringcentral-web-phone/sip-message/inbound';

import type {
  IncomingRequest,
  WebphoneSession,
} from './Webphone.interface';
import { recordStatus } from './recordStatus';
import { sessionStatus } from './sessionStatus';
import { voicemailDropStatus } from './voicemailDropStatus';

let environment: Window & typeof globalThis;
if (typeof window !== 'undefined') {
  environment = window;
}
if (typeof global !== 'undefined') {
  environment = global.window || global;
}

export function isChrome() {
  if (!environment.navigator) {
    return false;
  }
  const browserUa = environment.navigator.userAgent.toLowerCase();
  return !!browserUa.match(/chrom(e|ium)/);
}

export function isFirefox() {
  if (!environment.navigator) {
    return false;
  }
  const browserUa = environment.navigator.userAgent.toLowerCase();
  return browserUa.indexOf('firefox') > -1 && !isChrome();
}

export function isEnableMidLinesInSDP() {
  if (!isFirefox()) {
    return false;
  }
  const version = parseInt(
    navigator.userAgent.toLowerCase().match(/firefox\/([0-9]+)/)?.[1]!,
    10,
  );
  return version >= 63;
}

export function isWebSocketSupport() {
  return !!(environment && environment.WebSocket);
}

export function isWebRTCSupport() {
  if (!environment.navigator) {
    return false;
  }
  return !!(
    environment.MediaStream &&
    environment.RTCPeerConnection &&
    environment.navigator.mediaDevices.getUserMedia
  );
}

export function isBrowserSupport() {
  return isWebSocketSupport() && isWebRTCSupport();
}

function getHeaderValue(
  headers: Record<string, string> | undefined,
  key: string,
) {
  if (!headers) {
    return;
  }
  const loweredKey = key.toLowerCase();
  return Object.entries(headers).find(
    ([headerKey]) => headerKey.toLowerCase() === loweredKey,
  )?.[1];
}

export function readPartyDataFromHeaders(headers?: Record<string, string>) {
  const rawValue = getHeaderValue(headers, 'P-Rc-Api-Ids');
  if (rawValue) {
    const data = rawValue
      .split(';')
      .map((sub) => sub.split('='))
      .reduce((acc, [key, value]) => {
        acc[camelCase(key)] = value;
        return acc;
      }, {} as { [key: string]: string });

    if (Object.keys(data).length) {
      return data as unknown as PartyData;
    }
  }
}

export function readCallIdFromHeaders(headers?: Record<string, string>) {
  return getHeaderValue(headers, 'Call-ID');
}

export function extractHeadersData(
  session: WebphoneSession,
  headers?: Record<string, string>,
) {
  const partyData = readPartyDataFromHeaders(headers);
  if (partyData) {
    session.__rc_partyData = partyData;
  }

  const callId = readCallIdFromHeaders(headers);
  if (callId) {
    session.__rc_callId = callId;
  }
}

const extractName = (peer?: string) => peer?.match(/"(.*)"/)?.[1] || '';

function getCallStatus(webphoneState?: string) {
  if (webphoneState === 'init') {
    return sessionStatus.setup;
  }
  if (webphoneState === 'ringing') {
    return sessionStatus.connecting;
  }
  if (webphoneState === 'answered') {
    return sessionStatus.connected;
  }
  if (webphoneState === 'disposed' || webphoneState === 'failed') {
    return sessionStatus.finished;
  }
  return sessionStatus.finished;
}

export function isDroppingVoicemail(dropStatus?: string) {
  return (
    dropStatus === voicemailDropStatus.waitingForGreetingEnd ||
    dropStatus === voicemailDropStatus.sending ||
    dropStatus === voicemailDropStatus.finished ||
    dropStatus === voicemailDropStatus.terminated ||
    dropStatus === voicemailDropStatus.greetingDetectionFailed
  );
}

export function normalizeSession(
  session?: WebphoneSession,
): NormalizedSession | undefined {
  if (!session) {
    return session;
  }
  const fromPeer =
    session.direction === 'inbound' ? session.remotePeer : session.localPeer;
  const toPeer =
    session.direction === 'inbound' ? session.localPeer : session.remotePeer;
  const queueName = session.rcApiCallInfo?.queueName ?? null;
  const headers = session.sipMessage?.headers;
  const hasPartyData = Boolean(getHeaderValue(headers, 'P-Rc-Api-Ids'));
  const remoteTag = session.remotePeer ? session.remoteTag : null;
  const localTag = session.localPeer ? session.localTag : null;
  const remoteNumber = session.__rc_originalRemoteNumber || session.remoteNumber;
  return {
    id: session.callId,
    callId: session.callId,
    direction: callDirections[session.direction],
    callStatus: session.__rc_callStatus || getCallStatus(session.state),
    to: session.direction === 'inbound' ? session.localNumber : remoteNumber,
    toUserName: extractName(toPeer),
    from: session.direction === 'inbound' ? remoteNumber : session.localNumber,
    fromNumber: session.__rc_fromNumber,
    fromUserName: extractName(fromPeer),
    fromTag: session.direction === 'inbound' ? remoteTag : localTag,
    toTag: session.direction === 'inbound' ? localTag : remoteTag,
    startTime: session.startTime! && new Date(session.startTime).getTime(),
    creationTime: session.__rc_creationTime,
    isOnHold:
      !!session.__rc_localHold &&
      !isDroppingVoicemail(session.__rc_voicemailDropStatus),
    isOnMute: !!session.__rc_isOnMute,
    isOnFlip: !!session.__rc_isOnFlip,
    isOnTransfer: !!session.__rc_isOnTransfer,
    isToVoicemail: !!session.__rc_isToVoicemail,
    isForwarded: !!session.__rc_isForwarded,
    isReplied: !!session.__rc_isReplied,
    recordStatus: session.__rc_recordStatus || recordStatus.idle,
    // TODO: fix type
    // @ts-ignore
    contactMatch: session.__rc_contactMatch,
    minimized: !!session.__rc_minimized,
    partyData:
      hasPartyData && session.partyId
        ? {
            partyId: session.partyId,
            sessionId: session.sessionId,
          }
        : null,
    lastActiveTime: session.__rc_lastActiveTime,
    cached: false,
    removed: false,
    callQueueName: queueName ? `${queueName} - ` : null,
    warmTransferSessionId: session.__rc_transferSessionId || '',
    voicemailDropStatus: session.__rc_voicemailDropStatus,
    originalLocalNumber: session.__rc_originalLocalNumber,
    originalLocalName: session.__rc_originalLocalName,
  };
}

export function isRing(session: NormalizedSession) {
  return !!(
    session &&
    session.direction === callDirections.inbound &&
    session.callStatus === sessionStatus.connecting
  );
}

export function isOnHold(session: NormalizedSession) {
  return !!(session && session.isOnHold);
}

export function sortByLastActiveTimeDesc(
  l: NormalizedSession,
  r: NormalizedSession,
) {
  if (!l || !r) {
    return 0;
  }
  if (r.lastActiveTime !== l.lastActiveTime) {
    return r.lastActiveTime - l.lastActiveTime;
  }
  return r.startTime - l.startTime;
}

export function isPickupReason(e: IncomingRequest | undefined): boolean {
  return Boolean(e?.data?.includes?.('p-rc-reason: Pickup'));
}

export function getWebphoneSessionStartTime(session: NormalizedSession) {
  if (session.direction === callDirections.inbound) {
    return session.creationTime;
  }

  return session.startTime || session.creationTime;
}

export async function rejectSession(session: WebphoneSession) {
  const requestMessage = new RequestMessage(`SIP/2.0 480 Temporarily Unavailable`, {
    Via: session.sipMessage.headers.Via,
    To: session.sipMessage.headers.To,
    From: session.sipMessage.headers.From,
    'Call-Id': session.callId,
    CSeq: session.sipMessage.headers.CSeq,
    Supported: 'outbound',
  });
  await session.webPhone.sipClient.reply(requestMessage);
  const sessionIndex = session.webPhone.callSessions.findIndex(
    (callSession) => callSession.callId === session.callId,
  );
  if (sessionIndex !== -1) {
    session.webPhone.callSessions.splice(sessionIndex, 1);
    session.dispose();
  }
}

export async function replyWithMessage(
  session: WebphoneSession,
  replyOptions: {
    replyType: number;
    replyText: string;
    timeValue: string;
    timeUnits: string;
    callbackDirection: string;
  },
) {
  const body: {
    RepTp: number;
    Bdy?: string;
    Vl?: string;
    Units?: string;
    Dir?: string;
  } = {
    RepTp: replyOptions.replyType,
  };
  if (replyOptions.replyType === 0) {
    body.Bdy = replyOptions.replyText;
  } else if (replyOptions.replyType === 1 || replyOptions.replyType === 4) {
    body.Vl = replyOptions.timeValue;
    body.Units = replyOptions.timeUnits;
    body.Dir = replyOptions.callbackDirection;
  }
  await session.sendRcMessage(callControlCommands.ClientReply, body as never);
  return new Promise((resolve) => {
    const sessionCloseHandler = async (inboundMessage: InboundMessage) => {
      if (!inboundMessage.subject.startsWith('MESSAGE sip:')) {
        return;
      }
      const rcMessage = await RcMessage.fromXml(inboundMessage.body);
      if (
        rcMessage.headers.Cmd === callControlCommands.SessionClose.toString()
      ) {
        session.webPhone.sipClient.off('inboundMessage', sessionCloseHandler);
        resolve(rcMessage);
      }
    };
    session.webPhone.sipClient.on('inboundMessage', sessionCloseHandler);
  });
}
