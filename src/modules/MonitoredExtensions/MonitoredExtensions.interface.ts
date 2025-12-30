import {
  DataFetcherV2ConsumerBaseDeps,
  DataSourceBaseProps,
} from '@ringcentral-integration/commons/modules/DataFetcherV2';

import { DataFetcherV2 } from '@ringcentral-integration/commons/modules/DataFetcherV2';
import {
  WebSocketSubscription as Subscription,
} from '@ringcentral-integration/commons/modules/WebSocketSubscription';
import { AppFeatures } from '../AppFeatures';

export interface MonitoredExtensionsOptions extends DataSourceBaseProps {}

export interface Deps extends DataFetcherV2ConsumerBaseDeps {
  client: any;
  monitoredExtensionsOptions?: MonitoredExtensionsOptions;
  extensionFeatures: AppFeatures;
  dateFetcherV2: DataFetcherV2;
  subscription: Subscription;
}

interface MonitoredExtensionRecord {
  id: string;
  uri: string;
  notEditableOnHud: boolean;
  extension: {
    id: string;
    uri: string;
    extensionNumber: string;
    type: string;
  }
}

export interface MonitoredExtensionData {
  records: MonitoredExtensionRecord[];
}

export interface MonitoredExtensionSubscriptionMessage {
  event: string;
  body?: PresenceData;
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
  },
  uri?: string;
}
