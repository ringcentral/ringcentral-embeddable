import type { NormalizedSession } from '@ringcentral-integration/commons/interfaces/Webphone.interface';
import type { WebphoneSession } from './Webphone.interface';
import { sessionStatus } from '@ringcentral-integration/commons/modules/Webphone/sessionStatus';
import { recordStatus } from '@ringcentral-integration/commons/modules/Webphone/recordStatus';
import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import RequestMessage from "ringcentral-web-phone/sip-message/outbound/request";
import callControlCommands from "ringcentral-web-phone/rc-message/call-control-commands";
import RcMessage from "ringcentral-web-phone/rc-message/rc-message";
import type InboundMessage from "ringcentral-web-phone/sip-message/inbound";
import voicemailDropStatus from './voicemailDropStatus';

// peer: '"User Name" <sip:16503621111*103@8.8.8>;tag=2ba03ca1-61ef-416d-80d6-ebe2d66f4111'
const extractName = (peer: string) => peer.match(/"(.*)"/)?.[1] || '';

function getCallStatus(webphoneState) {
  if (webphoneState === 'init') {
    return sessionStatus.setup;
  }
  if (webphoneState === 'ringing') {
    return sessionStatus.connecting;
  }
  if (webphoneState === 'answered') {
    return sessionStatus.connected;
  }
  if (webphoneState === 'disposed') {
    return sessionStatus.finished;
  }
  return sessionStatus.finished;
}

export function isDroppingVoicemail(dropStatus) {
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
  // const toUserName = session.request?.to?.displayName;
  // const fromUserName = session.request?.from?.displayName;
  const fromPeer = session.direction === 'inbound' ? session.remotePeer : session.localPeer;
  const toPeer = session.direction === 'inbound' ? session.localPeer : session.remotePeer;
  const queueName = session.rcApiCallInfo ? session.rcApiCallInfo.queueName : null;
  const rcHeaders = session.sipMessage?.headers["p-rc-api-ids"];
  const remoteTag = session.remotePeer ? session.remoteTag : null;
  const localTag = session.localPeer ? session.localTag : null;
  const remoteNumber = session.__rc_replaceNumber || session.remoteNumber;
  return {
    id: session.callId, // for backward compatibility
    callId: session.callId,
    direction: callDirections[session.direction],
    callStatus: getCallStatus(session.state),
    to: session.direction === 'inbound' ? session.localNumber : remoteNumber,
    toUserName: toPeer ? extractName(toPeer) : '',
    from: session.direction === 'inbound' ? remoteNumber : session.localNumber,
    fromNumber: session.__rc_fromNumber,
    fromUserName: fromPeer ? extractName(fromPeer) : '',
    fromTag: session.direction === 'inbound' ? remoteTag : localTag,
    toTag: session.direction === 'inbound' ? localTag : remoteTag,
    startTime: session.startTime && new Date(session.startTime).getTime(),
    creationTime: session.__rc_creationTime,
    isOnMute: !!session.__rc_isOnMute,
    isOnFlip: !!session.__rc_isOnFlip,
    isOnTransfer: !!session.__rc_isOnTransfer,
    isToVoicemail: !!session.__rc_isToVoicemail,
    isForwarded: !!session.__rc_isForwarded,
    isReplied: !!session.__rc_isReplied,
    recordStatus: session.__rc_recordStatus || recordStatus.idle,
    contactMatch: session.__rc_contactMatch,
    minimized: !!session.__rc_minimized,
    partyData: rcHeaders && session.partyId ? {
      partyId: session.partyId,
      sessionId: session.sessionId,
    } : null,
    lastActiveTime: session.__rc_lastActiveTime,
    cached: false,
    removed: false,
    callQueueName: queueName ? `${queueName} - ` : null,
    warmTransferSessionId: session.__rc_transferSessionId,
    voicemailDropStatus: session.__rc_voicemailDropStatus,
    isOnHold: !!session.__rc_localHold && !isDroppingVoicemail(session.__rc_voicemailDropStatus),
  };
}

export function isOnHold(session: NormalizedSession) {
  return !!(session && session.isOnHold);
}

export function isRing(session: NormalizedSession) {
  return !!(
    session &&
    session.direction === callDirections.inbound &&
    session.callStatus === sessionStatus.connecting
  );
}

export function sortByCreationTimeDesc(
  l: NormalizedSession,
  r: NormalizedSession,
) {
  return r.startTime - l.startTime;
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
  return sortByCreationTimeDesc(l, r);
}

export function isSharedWorkerSupported() {
  return typeof SharedWorker !== 'undefined';
}

export async function rejectSession(session: WebphoneSession) {
  const requestMessage = new RequestMessage(
    `SIP/2.0 480 Temporarily Unavailable`,
    {
      Via: session.sipMessage.headers.Via,
      To: session.sipMessage.headers.To,
      From: session.sipMessage.headers.From,
      "Call-Id": session.callId,
      CSeq: session.sipMessage.headers.CSeq,
      Supported: 'outbound',
    },
  );
  await session.webPhone.sipClient.reply(requestMessage);
  const sessionIndex = session.webPhone.callSessions.findIndex(x => x.callId === session.callId);
  if (sessionIndex !== -1) {
    session.webPhone.callSessions.splice(sessionIndex, 1);
    session.dispose();
  }
}

interface ReplyOptions {
  replyType: number; //TODO Use enum
  replyText: string;
  timeValue: string;
  timeUnits: string;
  callbackDirection: string;
}
export async function replyWithMessage(session: WebphoneSession, replyOptions: ReplyOptions) {
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
  await session.sendRcMessage(callControlCommands.ClientReply, body);
  return new Promise((resolve) => {
    const sessionCloseHandler = async (inboundMessage: InboundMessage) => {
      if (inboundMessage.subject.startsWith("MESSAGE sip:")) {
        const rcMessage = await RcMessage.fromXml(inboundMessage.body);
        if (
          rcMessage.headers.Cmd ===
            callControlCommands.SessionClose.toString()
        ) {
          session.webPhone.sipClient.off("inboundMessage", sessionCloseHandler);
          resolve(rcMessage);
          // no need to dispose session here, session will dispose unpon CANCEL or BYE
        }
      }
    };
    session.webPhone.sipClient.on("inboundMessage", sessionCloseHandler);
  });
}
