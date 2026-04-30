import type { WebSocketSubscription as Subscription } from '@ringcentral-integration/micro-auth/src/app/services';
import {
  Client,
  DataFetcher,
  ExtensionFeatures,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { CallQueues as CallQueuesBase } from '@ringcentral-integration/micro-phone/src/app/services';
import {
  delegate,
  injectable,
  optional,
  StoragePlugin,
} from '@ringcentral-integration/next-core';

type ExtensionGrantSourcePatch = {
  _grantSource?: {
    props: {
      permissionCheckFunction?: () => boolean;
    };
  };
};

@injectable({
  name: 'CallQueues',
})
export class CallQueues extends CallQueuesBase {
  private _extensionFeaturesForGrants: ExtensionFeatures;

  constructor(
    client: Client,
    extensionFeatures: ExtensionFeatures,
    storage: StoragePlugin,
    dataFetcher: DataFetcher,
    @optional('Subscription') subscription?: Subscription,
  ) {
    super(client, extensionFeatures, storage, dataFetcher, subscription);
    this._extensionFeaturesForGrants = extensionFeatures;
    const grantSource = (this as unknown as ExtensionGrantSourcePatch)
      ._grantSource;
    if (grantSource) {
      grantSource.props.permissionCheckFunction = () =>
        this._hasExtensionGrantPermission;
    }
  }

  @delegate('server')
  override refetchGrants() {
    return super.refetchGrants();
  }

  private get _hasExtensionGrantPermission() {
    return (
      this._extensionFeaturesForGrants.features?.ReadExtensions?.available ??
      false
    );
  }
}
