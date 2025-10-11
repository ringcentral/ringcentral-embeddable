import { computed, watch } from '@ringcentral-integration/core';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { DataFetcherV2Consumer, DataSource } from '@ringcentral-integration/commons/modules/DataFetcherV2';

import {
  Deps,
  MonitoredExtensionData,
  MonitoredExtensionSubscriptionMessage,
} from './MonitoredExtensions.interface';

@Module({
  name: 'MonitoredExtensions',
  deps: [
    'Client',
    'DataFetcherV2',
    'AppFeatures',
    'Subscription',
    'CompanyContacts',
    { dep: 'MonitoredExtensionsOptions', optional: true }
  ],
})
export class MonitoredExtensions extends DataFetcherV2Consumer<
  Deps,
  MonitoredExtensionData
> {
  private _stopWatching: any;
  private _source: DataSource<MonitoredExtensionData>;

  constructor(deps: Deps) {
    super({
      deps,
    });
    this._source = new DataSource({
      ...deps.monitoredExtensionsOptions,
      key: 'monitoredExtensions',
      cleanOnReset: true,
      permissionCheckFunction: () =>
        this._hasPermission,
      fetchFunction: async (): Promise<MonitoredExtensionData> => {
        const response = await this._deps.client.service
          .platform()
          .get('/restapi/v1.0/account/~/extension/~/presence/line');
        return response.json();
      },
      readyCheckFunction: () => this._deps.appFeatures.ready,
    });
    this._deps.dataFetcherV2.register(this._source);
  }

  override onInit() {
    if (this._deps.subscription && this._hasPermission) {
      this._deps.subscription.subscribe([
        '/restapi/v1.0/account/~/extension/~/presence/line'
      ]);
      this._stopWatching = watch(
        this,
        () => this._deps.subscription!.message,
        (message) => this._handleSubscription(message),
      );
    }
  }

  _handleSubscription(message: MonitoredExtensionSubscriptionMessage) {
    if (message && message.event && message.event.indexOf('/presence/line') !== -1) {
      this.sync();
    }
  }

  async sync() {
    if (!this._hasPermission) {
      return;
    }
    await this._deps.dataFetcherV2.fetchData(this._source);
  }

  override onReset() {
    this._stopWatching?.();
    this._stopWatching = null;
  }

  @computed((that: MonitoredExtensions) => [
    that.data,
    that._deps.companyContacts.data,
  ])
  get monitoredExtensions() {
    const monitored = this.data?.records ?? [];
    const extensionIdMaps = monitored.reduce((acc, item) => {
      acc[item.extension.id] = 1;
      return acc;
    }, {});
    const companyContacts = this._deps.companyContacts.data ?? [];
    const companyContactsMap = companyContacts.reduce((acc, item) => {
      if (extensionIdMaps[item.id]) {
        acc[item.id] = item;
      }
      return acc;
    }, {});
    return monitored.map((item) => {
      return {
        ...item,
        extension: {
          id: item.extension.id,
          extensionNumber: item.extension.extensionNumber,
          type: item.extension.type,
          name: companyContactsMap[item.extension.id]?.name,
          status: companyContactsMap[item.extension.id]?.status,
        },
      };
    });
  }

  @computed(({ monitoredExtensions }: MonitoredExtensions) => [monitoredExtensions])
  get groupCallPickupList() {
    return this.monitoredExtensions.filter((extension) => extension.extension.type === 'GroupCallPickup');
  }

  @computed(({ monitoredExtensions }: MonitoredExtensions) => [monitoredExtensions])
  get parkLocations() {
    return this.monitoredExtensions.filter((extension) => extension.extension.type === 'ParkLocation');
  }

  get _hasPermission() {
    return this._deps.appFeatures.hasHUDPermission;
  }
}
