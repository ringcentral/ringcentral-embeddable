import type { DataSourceBaseProps } from '@ringcentral-integration/micro-auth/src/app/services';

export interface MonitoredExtensionsOptions extends DataSourceBaseProps {}

export interface MonitoredExtensionRecord {
  id: string;
  uri?: string;
  notEditableOnHud?: boolean;
  extension: {
    id: string;
    uri?: string;
    extensionNumber?: string;
    type: string;
  };
}

export interface MonitoredExtensionData {
  records: MonitoredExtensionRecord[];
}

export interface PresenceActiveCall {
  id: string;
  direction: string;
  from: string;
  fromName?: string;
  to: string;
  toName?: string;
  telephonyStatus: string;
  sessionId: string;
  startTime: string;
  partyId: string;
  telephonySessionId: string;
  terminationType: string;
  sipData?: {
    fromTag: string;
    toTag: string;
  };
}

export interface PresenceData {
  activeCalls: PresenceActiveCall[];
  extensionId?: string;
  presenceStatus: string;
  telephonyStatus: string;
  meetingStatus: string;
  allowSeeMyPresence: boolean;
  ringOnMonitoredCall: boolean;
  pickUpCallsOnHold: boolean;
  totalActiveCalls: number;
  extension?: {
    id: string;
  };
  uri?: string;
}

export interface MonitoredExtensionSubscriptionMessage {
  event?: string;
  body?: PresenceData;
}

export interface MonitoredExtensionItem {
  id: string;
  extension: {
    id: string;
    extensionNumber?: string;
    type: string;
    name?: string;
    status?: string;
    profileImageUrl?: string;
  };
  presence?: PresenceData;
}

export interface MonitoredExtensionUpdatePayload {
  id: string;
  extensionNumber?: string;
}
