/**
 * Step of the progressive dialer, synced to every port for the Leads tab
 * - `idle`: not running
 * - `connecting`: starting; checking availability and connecting the line
 * - `fetching`: getting a new batch of leads
 * - `countdown`: waiting the dial group delay before dialing `nextLeadRequestId`
 * - `dialing`: the dial request for the lead was sent
 * - `waiting`: on a call, in pending disposition, or not available
 * - `noLeads`: no leads came back; fetching again at `nextDialAt`
 */
export type ProgressiveDialPhase =
  | 'idle'
  | 'connecting'
  | 'fetching'
  | 'countdown'
  | 'dialing'
  | 'waiting'
  | 'noLeads';

/**
 * Why the progressive dialer stopped, or did not start
 */
export type ProgressiveDialStopReason =
  | 'stopped'
  | 'notProgressive'
  | 'busy'
  | 'notAvailable'
  | 'offhookFailed'
  | 'offhookEnded'
  | 'manualOutdial'
  | 'inboundCall'
  | 'agentState'
  | 'dialGroupChanged'
  | 'dialFailed'
  | 'logout';

/**
 * Who asked to start or stop the dialer, for analytics
 */
export type ProgressiveDialSource = 'widget' | 'thirdParty';

export interface ProgressiveDialCommandParams {
  source?: ProgressiveDialSource;
}

/**
 * Progressive dialer status reported to host pages
 */
export interface ProgressiveDialStatus {
  running: boolean;
  phase: ProgressiveDialPhase;
  /** Epoch milliseconds of the next dial or lead fetch, during a countdown */
  nextDialAt: number | null;
  /** Request id of the lead the countdown dials */
  nextLeadRequestId: string | null;
  /** Set when the dialer stopped or refused to start */
  reason: ProgressiveDialStopReason | null;
}

export interface CxProgressiveDialOptions {
  // Optional configuration options
}
