/**
 * Decide whether the current route is already the live call's activity page.
 *
 * The active-call banner hides while the agent is on that call's control,
 * transfer, or disposition page. It must still show on another call's
 * leftover disposition (or any other route) so they have a way back.
 *
 * @param currentPath route the agent is on.
 * @param liveCallId encoded id (`<uii>$<sessionId>`) of the live call.
 */
export function isOnLiveCallPage(
  currentPath: string,
  liveCallId: string,
): boolean {
  if (!currentPath || !liveCallId) {
    return false;
  }
  const liveCallPath = `/agent/calls/${liveCallId}`;
  return (
    currentPath === liveCallPath ||
    currentPath.startsWith(`${liveCallPath}/`)
  );
}
