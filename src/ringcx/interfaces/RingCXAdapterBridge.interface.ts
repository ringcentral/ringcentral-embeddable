import type { FormattedCall } from '../services/CxCallHistory/CxCallHistory.interface';

/**
 * Host Adapter / ThirdParty bridge for RingCX call events.
 * The coordinator and disposition view no-op the optional methods when the
 * bridge has not loaded.
 */
export interface RingCXAdapterBridge {
  onRingCall(call: unknown): void;
  onNewCall(call: unknown): void;
  onEndCall(call: unknown): void;
  onSoftphoneStatus(status: string): void;
  onDisposed?(
    call: unknown,
    extra?: {
      dispositionId?: string | null;
      dispositionName?: string;
      notes?: string;
    },
  ): void;
  logEndedCall?(call: unknown): Promise<boolean>;
  logAfterDisposition?(input: {
    call: unknown;
    note?: string;
    callId: string;
    extra?: {
      dispositionId?: string | null;
      dispositionName?: string;
      notes?: string;
    };
  }): Promise<boolean>;
  logFromHistory?(call: FormattedCall, actionType: string): Promise<void>;
  viewLead?(lead: unknown): Promise<void>;
  readonly leadViewerRegistered?: boolean;
  readonly shouldOpenLogPage?: boolean;
}
