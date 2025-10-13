import { computed, watch, state, action } from '@ringcentral-integration/core';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { DataFetcherV2Consumer, DataSource } from '@ringcentral-integration/commons/modules/DataFetcherV2';
import { batchGetApi } from '@ringcentral-integration/commons/lib/batchApiHelper';

import type {
  Deps,
  MonitoredExtensionData,
  MonitoredExtensionSubscriptionMessage,
  PresenceData,
} from './MonitoredExtensions.interface';

@Module({
  name: 'MonitoredExtensions',
  deps: [
    'Client',
    'DataFetcherV2',
    'AppFeatures',
    'Subscription',
    'CompanyContacts',
    'ExtensionInfo',
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
          .get('/restapi/v1.0/account/~/extension/~/presence/line?page=1&perPage=1000');
        return response.json();
      },
      readyCheckFunction: () => this._deps.appFeatures.ready,
    });
    this._deps.dataFetcherV2.register(this._source);
  }

  override onInit() {
    if (!this._hasPermission) {
      return;
    }
    if (this._deps.subscription) {
      this._deps.subscription.subscribe([
        '/restapi/v1.0/account/~/extension/~/presence/line',
        '/restapi/v1.0/account/~/extension/~/presence/line/presence?detailedTelephonyState=true&sipData=true'
      ]);
      this._stopWatching = watch(
        this,
        () => this._deps.subscription!.message,
        (message) => this._handleSubscription(message),
      );
    }
    const monitored = (this.data?.records ?? []).filter((item) =>
      item.extension.id !== String(this._deps.extensionInfo.id)
    );
    const extensionIds = monitored.map((item) => item.extension.id);
    this.fetchPresences(extensionIds);
  }

  _handleSubscription(message: MonitoredExtensionSubscriptionMessage) {
    if (!message || !message.event) {
      return;
    }
    if (message.event.indexOf('/presence?detailedTelephonyState=true') !== -1 && message.body) {
      // presence changed event
      this.setPresences([message.body]);
      return;
    }
    if ( message.event.indexOf('/presence/line') !== -1 ) {
      // monitored extensions changed event
      this.sync();
    }
  }

  async sync() {
    if (!this._hasPermission) {
      return;
    }
    await this._deps.dataFetcherV2.fetchData(this._source);
    const newExtensionIds = [];
    const monitored = (this.data?.records ?? []).filter((item) =>
      item.extension.id !== String(this._deps.extensionInfo.id)
    );
    monitored.forEach((item) => {
      if (!this.presences[item.extension.id]) {
        newExtensionIds.push(item.extension.id);
      }
    });
    this.fetchPresences(newExtensionIds);
  }

  override onReset() {
    this._stopWatching?.();
    this._stopWatching = null;
  }

  @state
  presences: {
    [key: string]: PresenceData;
  } = {};

  @action
  setPresences(newPresences: [PresenceData]) {
    newPresences.forEach((presence) => {
      const extensionId = String(presence.extensionId || presence.extension.id);
      const newPresence = {
        ...presence,
        activeCalls:
          presence.activeCalls ?
            presence.activeCalls.filter((call) => !(call.telephonyStatus === 'NoCall' && call.terminationType === 'final'))
            : [],
      };
      // reduce the presence data
      delete newPresence.extension;
      delete newPresence.extensionId;
      delete newPresence.uri;
      this.presences[extensionId] = newPresence;
    });
  }

  async fetchPresences(extensionIds) {
    if (extensionIds.length === 0) {
      return;
    }
    try {
      let presences = [];
      if (extensionIds.length > 1) {
        // batch by 30 per group
        const batchedExtensionIds = extensionIds.reduce((acc, id, index) => {
          if (index % 30 === 0) {
            acc.push(extensionIds.slice(index, index + 30));
          }
          return acc;
        }, []);
        for (const group of batchedExtensionIds) {
          const responses = await batchGetApi({
            platform: this._deps.client.service.platform(),
            url: `/restapi/v1.0/account/~/extension/${group.join(',')}/presence?detailedTelephonyState=true&sipData=true`,
          });
          presences = await Promise.all(responses.map((response) => response.json()));
        }
      } else {
        const response = await this._deps.client.service.platform().get(`/restapi/v1.0/account/~/extension/${extensionIds[0]}/presence/line/presence?detailedTelephonyState=true&sipData=true`);
        const presence = await response.json();
        presences = [presence];
      }
      this.setPresences(presences as [PresenceData]);
    } catch (e) {
      console.error(e);
    }
  }

  @computed((that: MonitoredExtensions) => [
    that.data,
    that._deps.companyContacts.data,
    that._deps.extensionInfo.id,
    that.presences,
  ])
  get monitoredExtensions() {
    const monitored = (this.data?.records ?? []).filter((item) =>
      item.extension.id !== String(this._deps.extensionInfo.id)
    );
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
      const contact = companyContactsMap[item.extension.id];
      let name = contact?.name;
      if (!name && (contact?.firstName || contact?.lastName)) {
        name = `${contact.firstName || ''} ${contact.lastName || ''}`;
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
        presence: this.presences[item.extension.id],
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

  get activeExtensionLength() {
    return this.monitoredExtensions.filter(
      (extension) => extension.presence?.activeCalls?.length > 0
    ).length;
  }

  get _hasPermission() {
    return this._deps.appFeatures.hasHUDPermission;
  }
}
