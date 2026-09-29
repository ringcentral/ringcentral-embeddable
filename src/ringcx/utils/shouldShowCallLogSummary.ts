/**
 * Summary is backed by GET /activities. Hide it on the create/update call
 * log page when that request is forbidden or failed, and for a server-only
 * row when no activity record came back: there is nothing holding a summary
 * and nowhere to save an edited one.
 */
export function shouldShowCallLogSummary({
  isHistoryMode,
  isActivitiesAccessible,
  hasHistoryActivity,
  isServerOnlyHistoryCall,
  isSessionSummaryEnabled,
}: {
  readonly isHistoryMode: boolean;
  readonly isActivitiesAccessible: boolean;
  readonly hasHistoryActivity: boolean;
  readonly isServerOnlyHistoryCall: boolean;
  readonly isSessionSummaryEnabled: boolean;
}): boolean {
  if (isHistoryMode && !isActivitiesAccessible) {
    return false;
  }
  if (isServerOnlyHistoryCall) {
    return hasHistoryActivity;
  }
  return isSessionSummaryEnabled;
}
