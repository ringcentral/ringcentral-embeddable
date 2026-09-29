/**
 * Pick the encoded id of the live call the view should keep pointing at.
 *
 * Prefers `activityCallId` when it still names a live session. Otherwise the
 * first remaining live id is used, so a teardown that emptied the pointer
 * (or left it on a call that has already ended) can still find the session
 * the banner and hangup button are describing.
 *
 * @param activityCallId encoded id the view currently points at.
 * @param callIds encoded ids of the agent's live calls.
 * @param excludeCallId encoded id that must not be treated as live, such as
 * a disposition the agent is leaving.
 */
export function resolveLiveActivityCallId({
  activityCallId,
  callIds,
  excludeCallId = '',
}: {
  activityCallId: string;
  callIds: readonly string[];
  excludeCallId?: string;
}): string {
  if (
    activityCallId &&
    activityCallId !== excludeCallId &&
    callIds.includes(activityCallId)
  ) {
    return activityCallId;
  }
  return callIds.find((callId) => callId !== excludeCallId) ?? '';
}
