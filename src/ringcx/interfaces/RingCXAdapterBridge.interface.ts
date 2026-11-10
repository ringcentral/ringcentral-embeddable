import type { FormattedCall } from '../services/CxCallHistory/CxCallHistory.interface';
import type { CompatibleCall } from '../../app/services/CallLogger';
import type { ThirdPartyPage } from '../../app/services/ThirdParty';
import type { CxWrapUpLogMode } from '../services/CxWrapUpLog/CxWrapUpLog.interface';

/**
 * Host Adapter / ThirdParty bridge for RingCX call events.
 * The coordinator and disposition view no-op the optional methods when the
 * bridge has not loaded.
 */
export interface RingCXAdapterBridge {
  onRingCall(call: unknown): void;
  onNewCall(call: unknown): void;
  onEndCall(call: unknown): void;
  /**
   * Reports voicemail drop progress on a RingCX call to the host, as
   * `rc-call-drop-voicemail-notify` does for RingEX calls.
   */
  onVoicemailDropped?(call: unknown, voicemailDropStatus: string): void;
  onDisposed?(
    call: unknown,
    extra?: {
      dispositionId?: string | null;
      dispositionName?: string;
      notes?: string;
      summary?: string;
    },
  ): void;
  /**
   * Logs a call that ended without a disposition step. Returns whether the
   * call is logged on its wrap-up page instead; an automatic log runs in the
   * background so the agent is not held on the ended call meanwhile.
   */
  logEndedCall?(call: unknown): boolean;
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
   * Whether a call disposed while it was still up comes back to its wrap-up
   * page when it ends, to be logged there.
   */
  shouldOpenLogPageAfterDisposition?(): boolean;
  /** Where the wrap-up page gets its call log form. */
  readonly wrapUpLogMode?: CxWrapUpLogMode;
  /** The host's name, for the wrap-up page's call log tab. */
  readonly hostName?: string;
  /** Asks an opted-in host for its call log form for an ended call. */
  prepareLogForm?(callId: string): Promise<{
    status: 'ready' | 'none' | 'failed';
    reason?: string;
  }>;
  /** The host's current `$LOG-CALL` form. */
  readonly logCallPage?: ThirdPartyPage;
  /** The call the host's `$LOG-CALL` form was asked for last. */
  readonly logCallPageOwnerId?: string | null;
  readonly callLoggerTitle?: string | null;
  getCallForLog?(id: string): Promise<CompatibleCall | null>;
  onLogFormInputChanged?(input: {
    callId: string;
    formData: Record<string, unknown>;
    keys: string[];
  }): Promise<void>;
  onLogFormButtonClick?(
    buttonId: string,
    formData: Record<string, unknown>,
  ): Promise<void>;
  /** Saves the wrap-up page's call log form; returns the host's error. */
  saveLogForm?(input: {
    callId: string;
    formData: Record<string, unknown>;
  }): Promise<{ error?: string }>;
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
