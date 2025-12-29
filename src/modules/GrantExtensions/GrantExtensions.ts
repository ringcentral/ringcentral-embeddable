import { computed, watch } from '@ringcentral-integration/core';

import { Module } from '@ringcentral-integration/commons/lib/di';
import { DataFetcherV2Consumer, DataSource } from '@ringcentral-integration/commons/modules/DataFetcherV2';

import type {
  Deps,
  GrantExtensionsResponse,
  GrantExtensionRecord,
} from './GrantExtensions.interface';

@Module({
  name: 'GrantExtensions',
  deps: [
    'Client',
    'DataFetcherV2',
    'ExtensionFeatures',
    'CompanyContacts',
    'Subscription',
    'TabManager',
    { dep: 'GrantExtensionsOptions', optional: true }
  ],
})
export class GrantExtensions extends DataFetcherV2Consumer<
  Deps,
  GrantExtensionsResponse
> {
  private _stopWatching: any;
  private _source: DataSource<GrantExtensionsResponse>;

  constructor(deps: Deps) {
    super({
      deps,
    });
    this._source = new DataSource({
      ...deps.grantExtensionsOptions,
      key: 'grantExtensions',
      cleanOnReset: true,
      permissionCheckFunction: () => this._hasPermission,
      fetchFunction: async (): Promise<GrantExtensionsResponse> => {
        const response = await this._deps.client.service
          .platform()
          .get('/restapi/v1.0/account/~/extension/~/grant?page=1&perPage=1000');
        return response.json();
      },
      readyCheckFunction: () => this._deps.extensionFeatures.ready,
    });
    this._deps.dataFetcherV2.register(this._source);
  }

  override onInit() {
    if (!this._hasPermission) {
      return;
    }
    if (this._deps.subscription) {
      this._deps.subscription.subscribe([
        '/restapi/v1.0/account/~/extension/~/grant',
      ]);
      this._stopWatching = watch(
        this,
        () => this._deps.subscription!.message,
        (message) => this._handleSubscription(message),
      );
    }
  }

  override onReset() {
    this._stopWatching?.();
    this._stopWatching = null;
  }

  _handleSubscription(message: any) {
    if (!message || !message.event) {
      return;
    }
    if (message.event.indexOf('/grant') !== -1) {
      this.sync();
    }
  }

  @computed(({ data }: GrantExtensions) => [data])
  get grantExtensions(): GrantExtensionRecord[] {
    const records = this.data?.records ?? [];
    const extensionIdMaps = records.reduce((acc, item) => {
      acc[item.extension.id] = 1;
      return acc;
    }, {} as Record<string, 1>);
    const companyContacts = this._deps.companyContacts.data ?? [];
    const companyContactsMap = companyContacts.reduce((acc, item) => {
      if (extensionIdMaps[item.id]) {
        acc[item.id] = item;
      }
      return acc;
    }, {} as Record<string, any>);
    return records.map((item) => {
      const contact = companyContactsMap[item.extension.id];
      let name = item.name || contact?.name;
      if (!name && (contact?.firstName || contact?.lastName)) {
        name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
      }
      return {
        ...item,
        extension: {
          id: item.extension.id,
          extensionNumber: item.extension.extensionNumber,
          type: item.extension.type,
          name,
          status: contact?.status,
        },
      } as GrantExtensionRecord;
    });
  }

  get _hasPermission() {
    return this._deps.extensionFeatures.features?.ReadExtensions?.available ?? false;
  }

  async sync() {
    if (!this._hasPermission) {
      return;
    }
    if (this._deps.tabManager && !this._deps.tabManager.active) {
      // do not sync when the tab is not active
      return;
    }
    await this._deps.dataFetcherV2.fetchData(this._source);
  }

  @computed(({ grantExtensions }: GrantExtensions) => [grantExtensions])
  get grantParkLocations() {
    return this.grantExtensions.filter((item) => item.extension.type === 'ParkLocation');
  }

  @computed(({ grantExtensions }: GrantExtensions) => [grantExtensions])
  get callQueueSmsRecipients() {
    return this.grantExtensions.filter((item) => item.callQueueSmsRecipient);
  }
}
