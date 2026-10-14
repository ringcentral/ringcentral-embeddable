import { callDirection } from '@ringcentral-integration/commons/enums/callDirections';
import type { ExtensionInfo } from '@ringcentral-integration/micro-auth/src/app/services';
import type { ActiveCallControlSessionData } from '@ringcentral-integration/micro-phone/src/app/services/ActiveCallControl/ActiveCallControl.interface';
import { CONFERENCE_ORIGIN_TYPE } from '@ringcentral-integration/micro-phone/src/app/services/ActiveCallControl';
import {
  PartyStatusCode,
  type Session as TelephonySession,
} from 'ringcentral-call-control/lib/Session';

type ConferenceParticipants =
  ActiveCallControlSessionData['conferenceParticipants'];

type PeerId = {
  partyId?: string;
  sessionId?: string;
  telephonySessionId?: string;
};

type ConferencePartyStatus = {
  code?: PartyStatusCode;
  reason?: string;
  peerId?: PeerId;
};

type ConferenceParty = TelephonySession['party'] & {
  status?: ConferencePartyStatus;
  uiCallInfo?: { primary?: { type?: string; value?: string } };
};

/**
 * Lists the parties of a conference session, host first.
 *
 * Mirrors the upstream `findConferenceParticipants`, which only matches a
 * merged call leg through `peerId.telephonySessionId`. Telephony session
 * events deliver the conference id in `peerId.sessionId` instead, so upstream
 * finds no participants and the list only shows the host.
 */
export function findConferenceParticipants(
  currentSession: TelephonySession,
  sessions: TelephonySession[],
  selfExtensionInfo: ExtensionInfo['info'] | undefined,
  checkStillExist?: (session: TelephonySession, partyId: string) => boolean,
): ConferenceParticipants {
  if (currentSession.origin?.type !== CONFERENCE_ORIGIN_TYPE) {
    return [];
  }
  const participants: ConferenceParticipants = [];
  sessions.forEach((session) => {
    const party = session.party as ConferenceParty | undefined;
    const status = party?.status ?? {};
    const peerId = status.peerId ?? {};
    const peerPartyId = peerId.partyId as string;

    if (checkStillExist && !checkStillExist(session, peerPartyId)) {
      return;
    }
    if (
      session === currentSession &&
      (party?.conferenceRole === 'Host' ||
        (!party?.conferenceRole && status.reason === 'CallSwitch'))
    ) {
      participants.unshift({
        sessionId: session.data.sessionId,
        telephonySessionId: session.id,
        partyId: peerPartyId,
        isHost: true,
        sessionName: '',
        info: selfExtensionInfo
          ? {
              phoneNumber: selfExtensionInfo.contact?.businessPhone!,
              extensionNumber: selfExtensionInfo.extensionNumber!,
              name: selfExtensionInfo.name!,
              extensionId: `${selfExtensionInfo.id}`,
            }
          : {},
      });
    }

    const peerTelephonySessionId = peerId.telephonySessionId ?? peerId.sessionId;
    if (
      status.code === PartyStatusCode.gone &&
      status.reason === CONFERENCE_ORIGIN_TYPE &&
      peerTelephonySessionId === currentSession.id
    ) {
      const inbound = party?.direction === callDirection.inbound;
      const primaryCallInfo = party?.uiCallInfo?.primary;
      participants.push({
        sessionId: session.data.sessionId,
        telephonySessionId: session.id,
        partyId: peerPartyId,
        sessionName: inbound ? party?.from?.name : party?.to?.name,
        info: inbound ? party?.from : party?.to,
        queueName:
          primaryCallInfo?.type === 'QueueName'
            ? primaryCallInfo.value
            : undefined,
      });
    }
  });
  return participants;
}
