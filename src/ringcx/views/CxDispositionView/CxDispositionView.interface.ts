import type { IvrAlertData } from '../../components/IvrAlertPanel';
import type { CallInfoItem } from '../../components/CallInfoHeader';
import type { DispositionItem, DispositionData, DispositionValidation, DispositionRequired } from '../../components/DispositionForm';
import type { SaveStatus } from './CxDispositionView.view';

/**
 * Basic call info with follow-up info
 */
export interface DispositionBasicInfo {
  subject: string;
  followInfos: string[];
  callInfos: CallInfoItem[];
}

/**
 * CxDispositionView external props
 */
export interface CxDispositionViewProps {
  // Currently no external props needed
}

/**
 * CxDispositionView UI state props
 */
export interface CxDispositionViewUIProps {
  /**
   * A voicemail drop runs on a "Hangup on Disp" call: submitting now would
   * make the server end the call and cut the message off.
   */
  submitBlockedByVoicemailDrop: boolean;
  currentCall: any;
  callStatus: 'active' | 'callEnd';
  saveStatus: SaveStatus;
  dispositionPickList: DispositionItem[];
  validated: DispositionValidation;
  required: DispositionRequired;
  dispositionData: DispositionData | undefined;
  basicInfo: DispositionBasicInfo | null;
  isInbound: boolean;
  isDisposed: boolean;
  isHistoryMode: boolean;
  /** History row with no local call data; disposition saves via the activity. */
  isServerOnlyHistoryCall: boolean;
  /** True while the history activity request is in flight. */
  isHistoryActivityLoading: boolean;
  /**
   * History row id whose activity is loaded. Differs from the route id while
   * a fetch is pending or before the first load.
   */
  historyActivityRowId: string;
  /** The RingCX activity behind a history row, when one was found. */
  historyActivity: import('../../services/CxClient/interfaces').ActivityLog | null;
  /** Pending edits to a server-only history row. */
  historyActivityDraft: { agentNotes: string; agentSummary: string };
  /**
   * Disposition label for the history call-log form (activity, else history
   * row).
   */
  historyDispositionName: string;
  /** True when the history list still has a row for this route id. */
  hasHistoryCall: boolean;
  showSubmitStep: boolean;
  hideCallNote: boolean;
  showSummary: boolean;
  segmentId: string;
  summary: string;
  isSummaryFinal: boolean;
  isSummaryLoading: boolean;
  isSummaryEdited: boolean;
  /** Whether the call has a lead the Lead tab can show. */
  hasLeadInfo: boolean;
}

/**
 * CxDispositionView UI action functions
 */
export interface CxDispositionViewUIFunctions {
  setViewCallId: (id: string) => void;
  loadHistoryActivity: (id: string) => void;
  onUpdateHistoryActivityDraft: (
    field: 'agentNotes' | 'agentSummary',
    value: string,
  ) => void;
  onBack: () => void;
  onUpdateCallLog: (field: string, value: string) => void;
  onUpdateSummary: (value: string) => void;
  disposeCall: () => Promise<void>;
  /** Opens the call's lead in the Lead side widget tab. */
  onViewLead: () => Promise<void>;
}
