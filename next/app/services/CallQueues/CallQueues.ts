import {
  Client,
  DataFetcher,
  ExtensionFeatures,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { CallQueues as CallQueuesBase } from '@ringcentral-integration/micro-phone/src/app/services';
import { injectable, StoragePlugin } from '@ringcentral-integration/next-core';

@injectable({
  name: 'CallQueues',
})
export class CallQueues extends CallQueuesBase {
  constructor(
    client: Client,
    extensionFeatures: ExtensionFeatures,
    storage: StoragePlugin,
    dataFetcher: DataFetcher,
  ) {
    super(client, extensionFeatures, storage, dataFetcher);
  }
}
