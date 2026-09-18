/**
 * Host Adapter / ThirdParty bridge for RingCX call events.
 * Phase 2 leaves this token unbound; the coordinator no-ops when it is absent.
 */
export interface RingCXAdapterBridge {
  onRingCall(call: unknown): void;
  onNewCall(call: unknown): void;
  onEndCall(call: unknown): void;
  onSoftphoneStatus(status: string): void;
}
