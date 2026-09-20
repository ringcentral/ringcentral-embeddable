/**
 * Prefix of a live CX call's activity pages in this host.
 *
 * Source CX Embeddable uses `/activityCallLog/`; here the same pages live
 * under `cxPath.call`, which is `/agent/calls/${id}`.
 */
const CALL_ACTIVITY_PATH_PREFIX = '/agent/calls/';

/**
 * Decide whether answering a call should replace the current activity page.
 *
 * A queued inbound that answers while the agent is still on the previous
 * call's disposition (or any other `/agent/calls/` page) must not be
 * pushed on top of that page. Leaving the new call with Back would otherwise
 * reopen the finished disposition, whose teardown then drops the live call
 * pointer the banner reads.
 *
 * Coming from the dialer or another non-activity route still pushes, so Back
 * returns to where the agent was when the call arrived.
 *
 * @param currentPath route the agent is on when the new call is answered.
 */
export function shouldReplaceActivityCallRoute(currentPath: string): boolean {
  return currentPath.startsWith(CALL_ACTIVITY_PATH_PREFIX);
}
