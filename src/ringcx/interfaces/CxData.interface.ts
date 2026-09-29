import type {
  CxAddSessionNotification,
  CxBaseCall,
  CxEndedCall,
} from '../services/CxClient/interfaces';

export type CxCallData = CxBaseCall & {
  contactMatches?: CxContactMatchItem[];
  matchedContacts?: any;
  endedCall?: CxEndedCall;
  session?: CxAddSessionNotification;
  isHold?: boolean;
  agentName?: string;
  /** transform queueDts from time zone date to timeStamp */
  timestamp?: number;
  gate?: CxRequeueCallGate;
  ivrString?: string;
  id?: string;
  recordingUrl?: string;
  CALL_UNIQUE_ID__c?: string;
};

/**
 * Salesforce entity types - local definition
 */
export type SalesforceEntityType =
  | 'Contact'
  | 'Account'
  | 'Lead'
  | 'Opportunity'
  | 'Task'
  | 'Case';

export interface CxContactMatchItem {
  id: string;
  type: SalesforceEntityType;
  name: string;
}

export interface CxRequeueCallGate {
  gateId: string;
  gateGroupId: string;
}
export interface CxIvrData {
  subject: string;
  body: string;
}
export interface CxAgentScriptData {
  onClick?: () => void;
}
