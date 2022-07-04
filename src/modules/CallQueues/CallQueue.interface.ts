import {
  DataFetcherV2ConsumerBaseDeps,
  DataSourceBaseProps,
} from '@ringcentral-integration/commons/modules/DataFetcherV2';

import { ExtensionFeatures } from '@ringcentral-integration/commons/modules/ExtensionFeatures';
import { DataFetcherV2 } from '@ringcentral-integration/commons/modules/DataFetcherV2';

export interface CallQueuesOptions extends DataSourceBaseProps {}

export interface Deps extends DataFetcherV2ConsumerBaseDeps {
  client: any;
  callQueuesOptions?: CallQueuesOptions;
  extensionFeatures: ExtensionFeatures;
  dateFetcherV2: DataFetcherV2;
}
