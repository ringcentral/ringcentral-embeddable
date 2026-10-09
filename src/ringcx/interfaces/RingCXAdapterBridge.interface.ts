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
  onDisposed?(
    call: unknown,
    extra?: {
      dispositionId?: string | null;
      dispositionName?: string;
      notes?: string;
      summary?: string;
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
      summary?: string;
    };
  }): Promise<boolean>;
  /**
   * Whether a call disposed while it was still up opens the host log page
   * when it ends.
   */
  shouldOpenLogPageAfterDisposition?(): boolean;
  /**
   * Logs a history row. `contact` is the contact the row shows, as the RingEX
   * history passes it; without it the only contact match is used, if any.
   */
  logFromHistory?(
    call: FormattedCall,
    actionType: string,
    contact?: unknown,
  ): Promise<void>;
  /**
   * Sends a click on a host-registered `callAction` button for a history row.
   */
  onClickCallAction?(buttonId: string, call: FormattedCall): Promise<void>;
  viewLead?(lead: unknown): Promise<void>;
  readonly leadViewerRegistered?: boolean;
  readonly shouldOpenLogPage?: boolean;
}
