import {
  DataFetcherV2ConsumerBaseDeps,
  DataSourceBaseProps,
} from '@ringcentral-integration/commons/modules/DataFetcherV2';

import { DataFetcherV2 } from '@ringcentral-integration/commons/modules/DataFetcherV2';
import { AppFeatures } from '../AppFeatures';

export interface GrantExtensionsOptions extends DataSourceBaseProps {}

export interface Deps extends DataFetcherV2ConsumerBaseDeps {
  client: any;
  grantExtensionsOptions?: GrantExtensionsOptions;
  appFeatures: AppFeatures;
  dateFetcherV2: DataFetcherV2;
}

export interface GrantExtensionRecordRaw {
  extension: {
    id: string;
    extensionNumber?: string;
    type?: string;
    name?: string;
  };
}

export interface GrantExtensionRecord extends GrantExtensionRecordRaw {
  extension: GrantExtensionRecordRaw['extension'] & {
    name?: string;
    status?: string;
  };
  callQueueSmsRecipient: boolean;
  sharedVoicemails: boolean;
  callPickup: boolean;
}

export interface GrantExtensionsResponse {
  records: GrantExtensionRecordRaw[];
}


