/**
 * Types for the RingCX agent history and contact-management activity REST
 * APIs, ported from the RingCX web agent
 * (`agent-service/apps/eag/src/common/services/transport`).
 *
 * These describe HTTP payloads, not agent-library socket notifications, which
 * is why they live alongside — rather than inside — the SDK response types.
 */

export type HistoryTermParty = 'SYSTEM' | 'AGENT' | 'REJECT';

export type HistoryTermReason =
  | 'AGENT-LOGOUT'
  | 'EOC'
  | 'RE-QUEUE'
  | 'DISPOSITION'
  | 'DROP';

export type HistoryProductType = 'QUEUE' | 'CAMPAIGN';

export type HistoryDialogOrigination = 'INBOUND' | 'OUTBOUND';

export enum HistoryChannelClass {
  DIGITAL = 'DIGITAL',
  VOICE = 'VOICE',
  ALL = 'ALL',
}

export type HistoryDialogState =
  | 'END-CHAT'
  | 'COMPLETE'
  | 'ACTIVE'
  | 'REJECTED'
  | 'DEQUEUING-PHASE2'
  | 'QUEUED';

export enum OutboundType {
  LEAD = 'LEAD',
  MANUAL = 'MANUAL',
}

export enum DialDispositionType {
  BUSY = 'BUSY',
  ANSWER = 'ANSWER',
  NOANSWER = 'NOANSWER',
  INTERCEPT = 'INTERCEPT',
  TERMINATED = 'TERMINATED',
  CONGESTION = 'CONGESTION',
  MACHINE = 'MACHINE',
  'VOICEMAIL-LEFT' = 'VOICEMAIL-LEFT',
  DISCONNECT = 'DISCONNECT',
  ABANDON = 'ABANDON',
}

export interface HistoryLead {
  id: number;
  externalId: string;
  title: string;
  firstName: string;
  midName?: string;
  lastName: string;
  address1: string;
  address2: string;
  aux1: string;
  aux2: string;
  aux3: string;
  aux4: string;
  aux5: string;
  gateKeeper: string;
  lastPassDisposition: string;
  leadState: string;
  leadPasses: number;
  state: string;
  suffix: string;
  email: string;
  city: string;
  zip: string;
  listDesc: string;
  extraData: Record<string, string>;
}

export interface HistoryItemResponse {
  agentSegment: {
    segmentId: string | null;
    segmentStart: string;
    segmentEnd: string | null;
    queue: {
      queueId: number;
      queueName: string;
      appUrl: string | null;
      backupAppUrl: string | null;
    } | null;
    disposition?: { value: string } | null;
    duration: number | null;
    termParty?: HistoryTermParty | null;
    termReason?: HistoryTermReason | null;
    productType: string | null;
    recordingUrl: string | null;
  };
  dialog: {
    dialogOrigination: HistoryDialogOrigination;
    dialogId: string;
    dialDisposition: DialDispositionType | null;
    uii: string;
    taskId: string | null;
    sessionInformation: {
      displayName: string | null;
      phoneNumber: string | null;
      email: string | null;
      rcExtention: boolean;
      title: string | null;
      edUuid: string | null;
      firstname: string | null;
      lastname: string | null;
    };
    channelConfiguration: {
      channelClass: HistoryChannelClass;
      channelType: string;
      dnis: string | null;
    };
    state: HistoryDialogState;
  };
  outbound:
    | null
    | {
        type: OutboundType.LEAD;
        campaignId: number | null;
        campaignName: string;
        lead: HistoryLead;
      }
    | {
        type: OutboundType.MANUAL;
        campaignId: number | null;
        campaignName: string | null;
        lead: Record<string, unknown> | null;
      };
}

export interface AgentHistoryParams {
  agentId: string;
  size?: number;
  /**
   * ISO date-time cursor, taken from the previous page's last
   * `agentSegment.segmentStart`. Sent empty for the first page.
   */
  before?: string | null;
  /** When true, filters out still-active interactions. */
  archived?: boolean;
  channelClass?: HistoryChannelClass | 'VOICE' | 'DIGITAL' | 'ALL';
}

export interface AgentHistoryResponse {
  before: string | null;
  /** `[0]` is the newest interaction, `[n]` the oldest. */
  items: HistoryItemResponse[];
  pageSize?: number;
}

/** A contact-management activity record — the RingCX-native call log. */
export interface ActivityLog {
  id: string;
  channelType: string;
  callType?: string;
  dispositionName?: string;
  agentSummary?: string;
  agentNotes?: string;
  creationTime?: string;
  completionTime?: string;
  autoSummary?: string;
  dialogId?: string;
  externalContactId?: string;
}

export interface ActivityDispositionInfo {
  dispositionName: string;
  agentSummary: string;
  agentNotes: string;
}
