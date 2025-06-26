import type { NormalizedSession } from '@ringcentral-integration/commons/interfaces/Webphone.interface';
import type { WebphoneSession } from './Webphone.interface';
import { sessionStatus } from '@ringcentral-integration/commons/modules/Webphone/sessionStatus';
import { recordStatus } from '@ringcentral-integration/commons/modules/Webphone/recordStatus';
import callDirections from '@ringcentral-integration/commons/enums/callDirections';

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
  return {
    id: session.id,
    callId: session.callId,
    direction: callDirections[session.direction],
    callStatus: getCallStatus(session.state),
    to: session.direction === 'inbound' ? session.localNumber : session.remoteNumber,
    toUserName: toPeer ? extractName(toPeer) : '',
    from: session.direction === 'inbound' ? session.remoteNumber : session.localNumber,
    fromNumber: session.__rc_fromNumber,
    fromUserName: fromPeer ? extractName(fromPeer) : '',
    fromTag: session.direction === 'inbound' ? session.remoteTag : session.localTag,
    toTag: session.direction === 'inbound' ? session.localTag : session.remoteTag,
    startTime: session.startTime && new Date(session.startTime).getTime(),
    creationTime: session.__rc_creationTime,
    isOnHold: !!session.__rc_localHold,
    isOnMute: !!session.__rc_isOnMute,
    isOnFlip: !!session.__rc_isOnFlip,
    isOnTransfer: !!session.__rc_isOnTransfer,
    isToVoicemail: !!session.__rc_isToVoicemail,
    isForwarded: !!session.__rc_isForwarded,
    isReplied: !!session.__rc_isReplied,
    recordStatus: session.__rc_recordStatus || recordStatus.idle,
    contactMatch: session.__rc_contactMatch,
    minimized: !!session.__rc_minimized,
    partyData: session.partyId ? {
      partyId: session.partyId,
      sessionId: session.sessionId,
    } : null,
    lastActiveTime: session.__rc_lastActiveTime,
    cached: false,
    removed: false,
    callQueueName: queueName ? `${queueName} - ` : null,
    warmTransferSessionId: session.__rc_transferSessionId,
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
