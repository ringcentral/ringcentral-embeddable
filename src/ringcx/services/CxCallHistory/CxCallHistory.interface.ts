/**
 * Call party info (agent or contact)
 */
export interface CallParty {
  name: string;
  phoneNumber: string;
}

/**
 * Formatted call entry - compatible with CallsListPage from micro-phone
 */
export interface FormattedCall {
  id: string;
  direction: string;
  /** Agent party info */
  agent: CallParty;
  /** Contact party info */
  contact: CallParty;
  from: CallParty;
  to: CallParty;
  fromName: string;
  toName: string;
  fromMatches: ContactMatch[];
  toMatches: ContactMatch[];
  activityMatches: ActivityMatch[];
  startTime: number;
  isDisposed?: boolean;
  /** Call result status - used for filtering (e.g., 'Missed', 'Answered', 'Answered Elsewhere') */
  result?: string;
  /** Whether the call is logged in CRM */
  isLogged?: boolean;
  /** Telephony session ID */
  telephonySessionId?: string;
  /** Session ID */
  sessionId?: string;

  // --- Server call-history fields (absent on locally derived calls) ---

  /** Interaction id, shared by every leg of the call. */
  uii?: string;
  /** This agent leg's segment id — the key for the activity lookup. */
  segmentId?: string;
  /** Dialog id. Not invariant per call: a cold transfer starts a new dialog. */
  dialogId?: string;
  queueName?: string;
  campaignName?: string;
  /** Secondary line: queue name, else campaign name, else "Manual". */
  infoLine?: string;
  /** Outbound dial type from history (`LEAD` / `MANUAL`). */
  outboundType?: 'LEAD' | 'MANUAL';
  /** Dialog state from the history endpoint (e.g. COMPLETE, ACTIVE). */
  dialogState?: string;
  /** Raw history destination used for callback dialing. */
  dialableNumber?: string;
  dnis?: string;
  termParty?: string;
  termReason?: string;
  /** Disposition recorded on the server for this segment. */
  disposition?: string;
  durationMs?: number;
  recordingUrl?: string;
  /** The interaction was still active when the page was fetched. */
  isActive?: boolean;
  /**
   * The local `${uii}$${sessionId}` id, when this browser also handled the
   * call. Resolved from the segment id; absent for rows that only exist
   * server-side, which therefore cannot use the local disposition flow.
   */
  localCallId?: string;
}

/**
 * Contact match
 */
export interface ContactMatch {
  id: string;
  name: string;
  type: string;
  profileImageUrl?: string;
}

/**
 * Activity match
 */
export interface ActivityMatch {
  contactId?: string;
  [key: string]: any;
}
