import {
  DataFetcherV2ConsumerBaseDeps,
  DataSourceBaseProps,
} from '@ringcentral-integration/commons/modules/DataFetcherV2';

import { DataFetcherV2 } from '@ringcentral-integration/commons/modules/DataFetcherV2';
import { AppFeatures } from '../AppFeatures';
import { Subscription } from '../Subscription';

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
}
