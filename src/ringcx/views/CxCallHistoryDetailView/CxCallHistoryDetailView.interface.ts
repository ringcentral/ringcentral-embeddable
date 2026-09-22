/**
 * Options for CxCallHistoryDetailView customization
 */
interface CxCallHistoryDetailViewOptions {
  onSave?: () => void;
}

/**
 * Props passed to the CxCallHistoryDetailView component
 */
interface CxCallHistoryDetailViewProps {
  id?: string;
  method?: string;
}

/**
 * Extra metadata from the history row for the detail view
 */
interface CallDetailMeta {
  dnis?: string;
  queueName?: string;
  campaignName?: string;
  callId?: string;
  termParty?: string;
  termReason?: string;
  /** Disposition recorded on the server for this segment. */
  disposition?: string;
  durationMs?: number;
  recordingUrl?: string;
  /** Outbound dial type from history (`LEAD` / `MANUAL`). */
  outboundType?: 'LEAD' | 'MANUAL';
  /** Dialog state from the history endpoint. */
  dialogState?: string;
  /**
   * Display state for the detail card (e.g. `CALL-ENDED` when the dialog is
   * complete / dropped).
   */
  callState?: string;
}

/**
 * CxCallHistoryDetailView UI state props (returned by getUIProps)
 */
interface CxCallHistoryDetailViewUIProps {
  callDetail: any | undefined;
  callMeta: CallDetailMeta;
  isInbound: boolean;
  isActiveCall: boolean;
  /** The first page is still in flight, so absence is not yet a miss. */
  isLoading: boolean;
  callNotFound: boolean;
  /** Raw destination used for callback dialing from history. */
  dialableNumber?: string;
  /** Agent permission controlling callback actions from history. */
  canDial: boolean;
  /** Historical dialing is unavailable while another call is in progress. */
  isDialDisabled: boolean;
  /** Whether a disposition has already been recorded for this row. */
  isDisposed: boolean;
}

/**
 * CxCallHistoryDetailView UI action functions (returned by getUIFunctions)
 */
interface CxCallHistoryDetailViewUIFunctions {
  onBack: () => void;
  onDial: (phoneNumber: string) => void;
  onCopyNumber: (phoneNumber: string) => void;
  onCopyCallId: (callId: string) => void;
  onOpenCallLog: () => void;
  hostLogActions?: Array<{
    type: string;
    label?: string;
    disabled?: boolean;
  }>;
  onHostLogAction?: (actionType: string) => void;
}

export type {
  CxCallHistoryDetailViewOptions,
  CxCallHistoryDetailViewProps,
  CxCallHistoryDetailViewUIProps,
  CxCallHistoryDetailViewUIFunctions,
  CallDetailMeta,
};
