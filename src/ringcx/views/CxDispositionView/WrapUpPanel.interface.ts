import type { ReactNode } from 'react';

import type { CompatibleCall } from '../../../app/services/CallLogger';
import type {
  ThirdPartyPage,
  UnknownRecord,
} from '../../../app/services/ThirdParty';
import type {
  DispositionData,
  DispositionItem,
  DispositionRequired,
  DispositionValidation,
} from '../../components/DispositionForm';
import type {
  CxWrapUpLogEntry,
  CxWrapUpLogMode,
} from '../../services/CxWrapUpLog';
import type { DispositionBasicInfo } from './CxDispositionView.interface';

/**
 * The call log part of a wrap-up page.
 */
export interface WrapUpUIProps {
  logMode: CxWrapUpLogMode;
  entry: CxWrapUpLogEntry | null;
  /** The host's name, which labels its tab and the footer hints. */
  hostName: string;
  /** The host's current `$LOG-CALL` form. */
  logCallPage?: ThirdPartyPage;
  /** The call a default log form is built from, once loaded. */
  logCall: CompatibleCall | null;
  logButtonTitle: string | null;
  logCallPageOwnerId: string | null;
  /** When Pending Disposition started, for the wrap-up timer. */
  wrapUpStartTime: number | null;
}

export interface WrapUpSubmitInput {
  formData: UnknownRecord | null;
  skipLog?: boolean;
}

export interface WrapUpPanelProps {
  callId: string;
  basicInfo: DispositionBasicInfo | null;
  isInbound: boolean;
  callEnded: boolean;
  viewLeadButton?: ReactNode;
  showSubmitStep: boolean;
  isDisposed: boolean;
  saveStatus: 'submit' | 'saving' | 'saved';
  submitEndsCall: boolean;
  submitBlockedByVoicemailDrop: boolean;
  dispositionPickList: DispositionItem[];
  dispositionData: DispositionData | undefined;
  validated: DispositionValidation;
  required: DispositionRequired;
  showSummary: boolean;
  summary: string;
  isSummaryFinal: boolean;
  isSummaryLoading: boolean;
  isSummaryEdited: boolean;
  wrapUp: WrapUpUIProps;
  onUpdateCallLog: (field: string, value: string) => void;
  onUpdateSummary: (value: string) => void;
  onSubmit: (input: WrapUpSubmitInput) => void;
  onLogLater: () => void;
  onPrepareLogForm: (callId: string) => void;
  onLoadLogCall: (callId: string) => void;
  onLogFormChange: (formData: UnknownRecord, keys: string[]) => void;
  onLogFormButtonClick: (buttonId: string, formData: UnknownRecord) => void;
}
