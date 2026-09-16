import type WebPhone from 'ringcentral-web-phone-v2';

import type { WebphoneNormalizedSession } from './WebphoneApi.interface';
import { recordStatus } from './recordStatus';
import { sessionStatus } from './sessionStatus';
import { isDroppingVoicemail } from './webphoneHelper';
import type { SessionStatus } from './sessionStatus';

export type WebPhoneSession = WebPhone['callSessions'][number];

export type WebphoneV2SessionRecord = {
  readonly session: WebPhoneSession;
  normalized: WebphoneNormalizedSession;
  revision: number;
  finalized: boolean;
  extendedControls?: string;
  warmTransferSessionId?: string;
  cancelRequested?: boolean;
  pendingCancelErrorHandler?: (error: unknown) => void;
  pendingSetupErrorCode?: WebphoneNormalizedSession['errorCode'];
  pendingCleanup?: boolean;
  pendingCleanupPromise?: Promise<void>;
  cleanupDeadlineHandle?: ReturnType<typeof setTimeout>;
  pendingCleanupErrorHandler?: (error: unknown) => void;
  displayedFromNumber?: string;
  displayedFromName?: string;
  displayedToNumber?: string;
  displayedToName?: string;
  destructiveCommand?: Promise<unknown>;
  receivedTransferFromNumber?: string;
  receivedTransferFromName?: string;
};

export const getHeader = (
  message: unknown,
  name: string,
): string | undefined => {
  const headers = (message as { headers?: Record<string, unknown> })?.headers;
  if (!headers) return undefined;
  const key = Object.keys(headers).find(
    (header) => header.toLowerCase() === name.toLowerCase(),
  );
  const value = key ? headers[key] : undefined;
  return typeof value === 'string' ? value : undefined;
};

export const getPeerName = (peer: string | undefined): string => {
  if (!peer) return '';
  const delimiter = peer.indexOf('<');
  if (delimiter < 0) return '';
  const name = peer.slice(0, delimiter).trim();
  if (name.startsWith('"')) {
    return name.slice(1, name.endsWith('"') ? -1 : undefined).trim();
  }
  if (name.endsWith('"')) return name.slice(0, -1).trim();
  return name;
};

export const getPeerNumber = (peer: string | undefined): string => {
  if (!peer) return '';
  const match = peer.match(/(?:sip|tel):([^@;>\s]+)/i);
  return match?.[1] ?? '';
};

export const getTransferIdentity = (value: string) => {
  const start = value.indexOf('<');
  const end = start < 0 ? -1 : value.indexOf('>', start + 1);
  const peer = start >= 0 && end > start ? value.slice(start + 1, end) : value;
  const number = getPeerNumber(peer);
  if (!number) return null;
  const prefix = start < 0 ? '' : value.slice(0, start).trim();
  const name =
    prefix.startsWith('"') && prefix.endsWith('"')
      ? prefix.slice(1, -1).trim()
      : '';
  return { number, name };
};

export const readSessionValue = <T>(read: () => T, fallback: T): T => {
  try {
    return read() ?? fallback;
  } catch {
    return fallback;
  }
};

export const getCallStatus = (session: WebPhoneSession): SessionStatus => {
  if (session.state === 'answered') return sessionStatus.connected;
  if (session.state === 'ringing') return sessionStatus.connecting;
  if (session.state === 'failed' || session.state === 'disposed') {
    return sessionStatus.finished;
  }
  return session.direction === 'inbound'
    ? sessionStatus.connecting
    : sessionStatus.setup;
};

export const normalizeSession = ({
  session,
  previous,
  record,
  now = Date.now(),
}: {
  session: WebPhoneSession;
  previous?: WebphoneNormalizedSession;
  record?: WebphoneV2SessionRecord;
  now?: number;
}): WebphoneNormalizedSession => {
  const details = getSessionDetails(session);
  const { inbound, from, to, fromUserName, toUserName } = details;
  const displayedFromNumber = record?.displayedFromNumber ?? from;
  const displayedFromName = record?.displayedFromName ?? fromUserName;
  const displayedToNumber = record?.displayedToNumber ?? to;
  const displayedToName = record?.displayedToName ?? toUserName;
  const sessionState = getSessionState({
    session,
    previous,
    record,
    now,
    callStatus: details.callStatus,
  });

  return {
    id: details.callId,
    callId: details.callId,
    direction: inbound ? 'Inbound' : 'Outbound',
    callStatus: details.callStatus,
    to: displayedToNumber,
    toUserName: displayedToName,
    from: displayedFromNumber,
    fromNumber: displayedFromNumber,
    fromUserName: displayedFromName,
    fromTag: details.fromTag,
    toTag: details.toTag,
    ...sessionState,
    lastActiveTime: now,
    cached: false,
    removed: false,
    callQueueName: details.callQueueName ?? previous?.callQueueName ?? '',
    warmTransferSessionId: sessionState.warmTransferSessionId,
    errorCode: previous?.errorCode,
    isReceivedTransfer: Boolean(record?.receivedTransferFromNumber),
    receivedTransferFromNumber: record?.receivedTransferFromNumber,
    receivedTransferFromName: record?.receivedTransferFromName,
  };
};

const getSessionDetails = (session: WebPhoneSession) => {
  const inbound = session.direction === 'inbound';
  const localPeer = session.localPeer;
  const remotePeer = session.remotePeer;
  const localNumber = readSessionValue(
    () => session.localNumber,
    getPeerNumber(localPeer),
  );
  const remoteNumber = readSessionValue(
    () => session.remoteNumber,
    getPeerNumber(remotePeer),
  );
  const from = inbound ? remoteNumber : localNumber;
  const to = inbound ? localNumber : remoteNumber;
  const fromUserName = inbound
    ? getPeerName(remotePeer)
    : getPeerName(localPeer);
  const toUserName = inbound ? getPeerName(localPeer) : getPeerName(remotePeer);
  const callId = readSessionValue(() => session.callId, '');
  const callInfo = readSessionValue(
    () =>
      (
        session as WebPhoneSession & {
          rcApiCallInfo?: { queueName?: string };
        }
      ).rcApiCallInfo,
    undefined,
  );
  return {
    inbound,
    from,
    to,
    fromUserName,
    toUserName,
    callId,
    callStatus: getCallStatus(session),
    fromTag: inbound
      ? readSessionValue(() => session.remoteTag, '')
      : readSessionValue(() => session.localTag, ''),
    toTag: inbound
      ? readSessionValue(() => session.localTag, '')
      : readSessionValue(() => session.remoteTag, ''),
    callQueueName: callInfo?.queueName ?? '',
  };
};

const getSessionState = ({
  session,
  previous,
  record,
  now,
  callStatus,
}: {
  session: WebPhoneSession;
  previous?: WebphoneNormalizedSession;
  record?: WebphoneV2SessionRecord;
  now: number;
  callStatus: SessionStatus;
}) => {
  const partyId = readSessionValue(() => session.partyId, undefined);
  const telephonySessionId = readSessionValue(
    () => session.sessionId,
    undefined,
  );
  let startTime = previous?.startTime || 0;
  if (callStatus === sessionStatus.connected && !previous?.startTime) {
    startTime = now;
  }
  let partyData = previous?.partyData ?? null;
  if (partyId && telephonySessionId) {
    partyData = { partyId, sessionId: telephonySessionId };
  }
  let warmTransferSessionId = previous?.warmTransferSessionId ?? '';
  if (record?.warmTransferSessionId !== undefined) {
    warmTransferSessionId = record.warmTransferSessionId;
  }
  return {
    startTime,
    creationTime: previous?.creationTime || now,
    isOnHold: previous?.isOnHold ?? false,
    isOnMute: previous?.isOnMute ?? false,
    isOnFlip: previous?.isOnFlip ?? false,
    isOnTransfer: previous?.isOnTransfer ?? false,
    isToVoicemail: previous?.isToVoicemail ?? false,
    isForwarded: previous?.isForwarded ?? false,
    isReplied: previous?.isReplied ?? false,
    recordStatus: previous?.recordStatus ?? recordStatus.idle,
    contactMatch: previous?.contactMatch ?? null,
    minimized: previous?.minimized ?? false,
    partyData,
    warmTransferSessionId,
  };
};

export const selectSessionIds = (
  sessions: readonly WebphoneNormalizedSession[],
) => {
  const ringing = sessions
    .filter(
      (session) =>
        session.direction === 'Inbound' &&
        session.callStatus === sessionStatus.connecting,
    )
    .sort((left, right) => right.lastActiveTime - left.lastActiveTime);
  const active = sessions
    .filter(
      (session) =>
        (session.direction === 'Outbound' ||
          session.callStatus !== sessionStatus.connecting) &&
        // Divergence from upstream, matching legacy's `_getActiveSessions`
        // override: a call playing a pre-recorded voicemail must not occupy the
        // active-call slot, or the UI stays "in a call" and blocks placing the
        // next one. Legacy allows several drops in flight at once for exactly
        // this reason. The call stays in `sessions`, so the active-call list
        // (driven by CallMonitor) still shows it with its drop status.
        !isDroppingVoicemail(session.voicemailDropStatus),
    )
    .sort((left, right) => right.lastActiveTime - left.lastActiveTime);
  return {
    activeSessionId: active[0]?.id ?? null,
    ringSessionId: ringing[0]?.id ?? null,
  };
};
