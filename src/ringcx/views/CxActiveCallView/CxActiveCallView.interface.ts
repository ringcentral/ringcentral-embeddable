import type { IvrAlertData } from '../../components/IvrAlertPanel';

export interface CxSideWidgetItem {
  readonly nameKey: string;
}

/**
 * Basic call info with follow-up info
 */
export interface BasicCallInfo {
  /** Customer-side number, unformatted. */
  phoneNumber?: string;
  formattedPhoneNumber: string;
  /** Contact matches for `phoneNumber`, from the shared ContactMatcher. */
  contactMatches: unknown[];
  queueName?: string;
}

/**
 * Call control permission flags
 */
export interface ActiveCallPermissions {
  allowTransferCall: boolean;
  allowHoldCall: boolean;
  allowHangupCall: boolean;
  allowRecordControl: boolean;
  allowPauseRecord: boolean;
}

/**
 * The kind of an end call option, which decides how the call is ended.
 */
export type EndCallOptionType = 'everyone' | 'justMe' | 'cancelTransfer';

/**
 * One way to end a multi-party call, before it is given a translated label.
 */
export interface EndCallOptionData {
  /** Stable id, unique across the transfer legs. */
  id: string;
  type: EndCallOptionType;
  /** The leg to hang up. */
  sessionId: string;
  /** Transfer destination to name in the label, for `cancelTransfer` only. */
  destination?: string;
}

/**
 * CxActiveCallView external props
 */
export interface CxActiveCallViewProps {
  // Currently no external props needed
}

/**
 * CxActiveCallView UI state props
 */
export interface CxActiveCallViewUIProps {
  activityCallId: string;
  currentCall: any;
  isMuted: boolean;
  isOnHold: boolean;
  isRecording: boolean;
  isKeypadOpen: boolean;
  keypadValue: string;
  ivrAlertData: IvrAlertData[];
  callControlPermissions: ActiveCallPermissions;
  isIntegratedSoftphone: boolean;
  recordPauseCount: number | undefined;
  timeStamp: number | null;
  basicInfo: BasicCallInfo | null;
  isMultipleCalls: boolean;
  /** Parties on the call, including the agent, when it is a conference. */
  participantCount: number;
  endCallOptions: EndCallOptionData[];
  isInComingCall: boolean;
  isCallDisposed: boolean;
  allowTransfer: boolean;
  isDefaultRecord: boolean;
  isInbound: boolean;
  notes: string;
  /** Side widgets registered for this call, shown or hidden. */
  sideWidgets: CxSideWidgetItem[];
  sideWidgetVisible: boolean;
}

/**
 * CxActiveCallView UI action functions
 */
export interface CxActiveCallViewUIFunctions {
  setCallId: (id: string) => Promise<void>;
  setViewCallId: (id: string) => void;
  onBack: () => void;
  onMute: () => void;
  onUnmute: () => void;
  onHold: () => void;
  onUnhold: () => void;
  onHangup: () => Promise<void>;
  onEndCall: (optionId: string) => Promise<void>;
  onRecord: () => Promise<void>;
  onStopRecord: () => Promise<void>;
  onPauseRecord: () => Promise<void>;
  onResumeRecord: () => void;
  onRestartTimer: () => Promise<void>;
  onActiveCall: () => void;
  onTransfer: () => void;
  onDisposition: () => void;
  setKeypadOpen: (isOpen: boolean) => void;
  handleKeypadChange: (value: string) => void;
  handleKeypadKeyPress: (digit: string) => void;
  onUpdateNotes: (value: string) => void;
  onToggleSideWidget: () => Promise<void>;
}
