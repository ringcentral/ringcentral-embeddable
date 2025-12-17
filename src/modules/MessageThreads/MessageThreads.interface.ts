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

export interface MessageThreadsOptions extends DataSourceBaseProps {}

export interface Deps extends DataFetcherV2ConsumerBaseDeps {
  client: any;
  messageThreadsOptions?: MessageThreadsOptions;
  appFeatures: AppFeatures;
  dataFetcherV2: DataFetcherV2;
  subscription?: Subscription;
  auth: Auth;
}

export interface MessageThread {
  id: string;
  label: string;
  status: 'Open' | 'Resolved';
  statusReason: 'Manual' | 'ThreadExpired' | 'OwnerDeleted' | 'OwnerPhoneNumberDeleted';
  availability: 'Alive' | 'Deleted';
  owner: {
    name: string;
    extensionType: string;
    extensionId: string;
  };
  ownerParty: {
    phoneNumber: string;
  };
  guestParty: {
    phoneNumber: string;
  };
  assignee: {
    extensionId: string;
    name: string;
  };
  creationTime: string;
  lastModifiedTime: string;
}

export type MessageThreadSavedItem = Omit<MessageThread, 'creationTime' | 'lastModifiedTime'> & {
  creationTime: number;
  lastModifiedTime: number;
};

export interface MessageThreadsData {
  records: MessageThread[];
  syncInfo: {
    syncToken: string;
    syncTime: string;
    syncType: string;
  }
}

export interface MessageThreadsSavedData {
  records: MessageThreadSavedItem[];
  syncInfo: {
    syncToken: string;
    syncTime: string;
    syncType: string;
  }
}

export interface MessageThreadsSubscriptionMessage {
  event: string;
  body?: MessageThread;
}
