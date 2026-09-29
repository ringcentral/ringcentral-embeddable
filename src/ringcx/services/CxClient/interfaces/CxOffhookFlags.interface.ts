/**
 * The softphone SDK's reconnect hints, mirrored from the app's offhook state.
 *
 * The SDK stores these on its own model and hands them back on
 * `SIP_DIAL_DEST_CHANGED` once it has rotated registrars; the SDK never sets
 * them itself. They cover the idle-agent recovery case — an agent on an
 * active call is recovered from the call state instead, since these flags are
 * zeroed the moment the dying leg drives the offhook state down.
 */
export interface CxOffhookFlags {
  /** Keep the offhook session alive after the call ends. */
  maintainOH: boolean;
  /** Start a fresh offhook session once the softphone re-registers. */
  autoStartOH: boolean;
}
