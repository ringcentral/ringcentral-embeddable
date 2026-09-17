/**
 * When the SDK rotates SIP registrars it rebuilds the user agent from
 * scratch, which destroys a standing offhook session; the leg has to be
 * created anew with an offhook init once the new registration is up. The SDK
 * reports the offhook flags it was carrying on `SIP_DIAL_DEST_CHANGED`, and
 * those flags say whether there was a leg worth rebuilding — mirroring EAG's
 * `dialDestChanged` handling.
 *
 * Mid-call audio is deliberately not recovered: EAG does not attempt it
 * either. A call whose leg died lands in pending disposition, and the agent
 * completes it from there.
 */

/** Offhook flags as reported by the SDK on `SIP_DIAL_DEST_CHANGED`. */
export interface OffhookFlags {
  /** The agent had an audio leg when the registration dropped. */
  readonly autoStartOH: boolean;
  /** The agent owns the session, so ending a call must not tear it down. */
  readonly maintainOH: boolean;
}

export interface OffhookRecoveryInputs {
  /** Only the port that owns the SDK may drive registration. */
  readonly isServer: boolean;
  readonly isIntegratedSoftphone: boolean;
  /** Whether the app still believes an offhook session is up. */
  readonly isOffhook: boolean;
  readonly flags?: OffhookFlags;
}

export interface OffhookRecoveryPlan {
  readonly shouldRestoreOffhook: boolean;
  /** Mark the restored session as agent-owned so `END_CALL` leaves it alone. */
  readonly shouldMaintainOffhook: boolean;
  readonly reason: string;
}

const SKIP = {
  shouldRestoreOffhook: false,
  shouldMaintainOffhook: false,
} as const;

/**
 * Decide whether a re-registered softphone needs a fresh offhook session.
 */
export function planOffhookRecovery({
  isServer,
  isIntegratedSoftphone,
  isOffhook,
  flags,
}: OffhookRecoveryInputs): OffhookRecoveryPlan {
  if (!isServer) {
    return { ...SKIP, reason: 'notServer' };
  }
  if (!isIntegratedSoftphone) {
    return { ...SKIP, reason: 'notIntegratedSoftphone' };
  }
  if (!flags) {
    return { ...SKIP, reason: 'noFlags' };
  }
  if (!flags.autoStartOH) {
    return { ...SKIP, reason: 'noOffhookToRestore' };
  }
  if (isOffhook) {
    // The SDK rotated registrars without the media session ever dropping, so
    // a second offhook init would displace a working leg.
    return { ...SKIP, reason: 'offhookStillUp' };
  }
  return {
    shouldRestoreOffhook: true,
    shouldMaintainOffhook: flags.maintainOH,
    reason: 'restoreOffhook',
  };
}
