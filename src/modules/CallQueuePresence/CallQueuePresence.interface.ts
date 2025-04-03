import {
  DataFetcherV2ConsumerBaseDeps,
  DataSourceBaseProps,
} from '@ringcentral-integration/commons/modules/DataFetcherV2';

import { DataFetcherV2 } from '@ringcentral-integration/commons/modules/DataFetcherV2';
import { AppFeatures } from '../AppFeatures';

export interface CallQueuesPresenceOptions extends DataSourceBaseProps {}

export interface Deps extends DataFetcherV2ConsumerBaseDeps {
  client: any;
  callQueuePresenceOptions?: CallQueuesPresenceOptions;
  extensionFeatures: AppFeatures;
  dateFetcherV2: DataFetcherV2;
}

