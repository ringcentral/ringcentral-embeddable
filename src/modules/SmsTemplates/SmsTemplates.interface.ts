import {
  DataFetcherV2ConsumerBaseDeps,
  DataSourceBaseProps,
} from '@ringcentral-integration/commons/modules/DataFetcherV2';

import { ExtensionFeatures } from '@ringcentral-integration/commons/modules/ExtensionFeatures';
import { DataFetcherV2 } from '@ringcentral-integration/commons/modules/DataFetcherV2';

import { AppFeatures } from '../AppFeatures';

export interface SmsTemplateOptions extends DataSourceBaseProps {}

export interface Deps extends DataFetcherV2ConsumerBaseDeps {
  client: any;
  smsTemplateOptions?: SmsTemplateOptions;
  extensionFeatures: ExtensionFeatures;
  appFeatures: AppFeatures;
  dateFetcherV2: DataFetcherV2;
}

export interface SmsTemplateRecord {
  id: string;
  displayName: string;
  body: {
    text: string;
  },
  scope: 'Company' | 'Personal';
  site: {
    id: string;
    name: string;
  };
}

export interface SmsTemplateList {
  records: SmsTemplateRecord[];
}
