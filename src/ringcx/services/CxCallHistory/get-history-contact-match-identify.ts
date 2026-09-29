import type { HistoryItemResponse } from '../CxClient/interfaces';

/**
 * ContactMatcher query for a server history row.
 *
 * The host matcher is queried with the plain phone number. Direction stays on
 * the call, not in the match key.
 */
export function getHistoryContactMatchIdentify(
  item: HistoryItemResponse,
): string | undefined {
  const phoneNumber = item.dialog?.sessionInformation?.phoneNumber;
  return phoneNumber || undefined;
}
