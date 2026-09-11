interface SmartNotesHistoryCallId {
  telephonySessionId?: string;
}

export function getVisibleTelephonySessionIds(
  calls: SmartNotesHistoryCallId[],
  startIndex: number,
  endIndex: number
): string[] {
  return calls
    .slice(startIndex, endIndex + 1)
    .map((call) => call.telephonySessionId)
    .filter((id): id is string => Boolean(id));
}
