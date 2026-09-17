import { contactMatchIdentifyEncode } from '../../lib/contactMatchIdentify';
import type { HistoryItemResponse } from '../CxClient/interfaces';

/**
 * Build the ContactMatcher query key for a server history row.
 *
 * Uses the raw session phone number and dialog direction so the third-party
 * match payload matches active-call identifies (`ani` + `callType`).
 */
export function getHistoryContactMatchIdentify(
  item: HistoryItemResponse,
): string | undefined {
  const phoneNumber = item.dialog?.sessionInformation?.phoneNumber;
  if (!phoneNumber) {
    return undefined;
  }
  const isOutbound = item.dialog?.dialogOrigination === 'OUTBOUND';
  return contactMatchIdentifyEncode({
    phoneNumber,
    callType: isOutbound ? 'OUTBOUND' : 'INBOUND',
  });
}
