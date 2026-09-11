import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import type { HistoryCall } from '@ringcentral-integration/micro-phone/src/app/services';

import type { SmartNoteSession } from '../../services/SmartNotes';

/** Creates the disconnected Smart Notes session embedded in call history. */
export function createEmbeddedHistorySmartNoteSession(
  call: HistoryCall | undefined,
): SmartNoteSession | null {
  if (!call?.telephonySessionId) {
    return null;
  }
  const isOutbound = call.direction === callDirections.outbound;
  const participant = isOutbound ? call.to : call.from;
  const matchedContact = (isOutbound ? call.toMatches : call.fromMatches)?.[0];
  const phoneNumber =
    participant?.phoneNumber ?? participant?.extensionNumber ?? '';
  return {
    id: call.telephonySessionId,
    status: 'Disconnected',
    direction: call.direction,
    phoneNumber,
    contact: matchedContact
      ? {
          ...matchedContact,
          name: matchedContact.name ?? participant?.name,
          phoneNumber,
        }
      : {
          name: participant?.name,
          phoneNumber,
        },
    startTime: call.startTime
      ? new Date(call.startTime).toISOString()
      : undefined,
  };
}
