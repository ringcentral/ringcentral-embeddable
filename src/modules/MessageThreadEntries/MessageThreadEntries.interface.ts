import {
  DataFetcherV2ConsumerBaseDeps,
  DataSourceBaseProps,
} from '@ringcentral-integration/commons/modules/DataFetcherV2';

import { DataFetcherV2 } from '@ringcentral-integration/commons/modules/DataFetcherV2';
import {
  WebSocketSubscription as Subscription,
} from '@ringcentral-integration/commons/modules/WebSocketSubscription';
import { AppFeatures } from '../AppFeatures';
import { Auth } from '../Auth';

export interface MessageThreadEntriesOptions extends DataSourceBaseProps {}

export interface Deps extends DataFetcherV2ConsumerBaseDeps {
  client: any;
  messageThreadEntriesOptions?: MessageThreadEntriesOptions;
  appFeatures: AppFeatures;
  dataFetcherV2: DataFetcherV2;
  subscription?: Subscription;
  auth: Auth;
}

export interface AliveMessage {
  id: string;
  recordType: 'AliveMessage';
  threadId: string;
  availability: 'Alive' | 'Deleted';
  creationTime: string;
  direction: 'Inbound' | 'Outbound';
  lastModifiedTime: string;
  messageStatus: 'Queued' | 'Sent' | 'Delivered' | 'DeliveryFailed' | 'SendingFailed' | 'Received';
  text: string;
  author?: {
    extensionId: string;
    name: string;
  };
}

export interface DeletedMessage {
  id: string;
  recordType: 'DeletedMessage';
  threadId: string;
  availability: 'Deleted';
  lastModifiedTime: string;
}

export interface AliveNote {
  id: string;
  recordType: 'AliveNote';
  threadId: string;
  availability: 'Alive' | 'Deleted';
  creationTime: string;
  lastModifiedTime: string;
  text: string;
  author: {
    extensionId: string;
    name: string;
  };
}

export interface DeletedNote {
  id: string;
  recordType: 'DeletedNote';
  threadId: string;
  availability: 'Deleted';
  lastModifiedTime: string;
}

export interface ThreadSystemHint {
  id: string;
  recordType: 'ThreadCreatedHint' | 'ThreadResolvedHint' | 'ThreadDeletedHint' | 'ThreadAssignedHint';
  threadId: string;
  lastModifiedTime: string;
  initiator?: {
    extensionId: string;
    name: string;
  };
}

export interface ThreadAssignmentSystemHit {
  id: string;
  recordType: 'ThreadCreatedHint' | 'ThreadResolvedHint' | 'ThreadDeletedHint' | 'ThreadAssignedHint';
  threadId: string;
  lastModifiedTime: string;
  initiator?: {
    extensionId: string;
    name: string;
  };
  assignee: {
    extensionId: string;
    name: string;
  };
  previousAssignee?: {
    extensionId: string;
    name: string;
  };
}

export type MessageThreadEntry = AliveMessage | DeletedMessage | AliveNote | DeletedNote | ThreadSystemHint | ThreadAssignmentSystemHit;

export type MessageThreadEntriesStoreItem = Omit<MessageThreadEntry, 'lastModifiedTime' | 'creationTime'> & {
  lastModifiedTime: number;
  creationTime: number;
};

export type MessageThreadEntriesStore = Record<string, MessageThreadEntriesStoreItem[]>;

export interface MessageThreadEntriesStoreData {
  store: MessageThreadEntriesStore;
  syncInfo: {
    syncToken: string;
    syncTime: string;
    syncType: string;
  };
}

export interface MessageThreadEntriesData {
  records: MessageThreadEntry[];
  syncInfo?: {
    syncToken: string;
    syncTime: string;
    syncType: string;
  };
}

export interface MessageThreadEntriesSubscriptionMessage {
  event: string;
  body?: MessageThreadEntry;
}

