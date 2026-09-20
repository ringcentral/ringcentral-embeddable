/**
 * Decide whether a call answered since a disposition was submitted has taken
 * over the view.
 *
 * Submitting a disposition schedules a teardown -- route back to the dialer,
 * clear `activityCallId`, drop the dialout status -- that is decided before
 * the request goes out and applied a second after it returns. A queued call
 * auto-answered inside that window has already pointed `activityCallId` at
 * itself and opened its own call-control page, so running the teardown
 * afterwards replaces the live call's page and empties the pointer its banner
 * reads, leaving a dialer showing a hangup button for a call it cannot
 * describe.
 *
 * Both signals are needed because they fail at different moments: the pointer
 * moves when the answer is routed, while `callIds` holds the live sessions
 * even in the gap before that happens. Neither fires while the agent is
 * dispositioning a call that is still their own, so a mid-call submit -- and a
 * transfer that leaves a second session open -- still returns the way it did.
 *
 * @param submittedCallId encoded id (`<uii>$<sessionId>`) of the dispositioned call.
 * @param activityCallId encoded id the view currently points at.
 * @param callIds encoded ids of the agent's live calls.
 */
export function hasNewCallTakenOver({
  submittedCallId,
  activityCallId,
  callIds,
}: {
  submittedCallId: string;
  activityCallId: string;
  callIds: readonly string[];
}): boolean {
  if (activityCallId && activityCallId !== submittedCallId) {
    return true;
  }
  return callIds.length > 0 && !callIds.includes(submittedCallId);
}
