import { computed, watch, state, action, storage } from '@ringcentral-integration/core';
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
    'ExtensionFeatures',
    'Subscription',
    'CompanyContacts',
    'ExtensionInfo',
    'Auth',
    'Storage',
    'Alert',
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
      storageKey: 'MonitoredExtensions',
      enableCache: true,
    });
    this._source = new DataSource({
      ...deps.monitoredExtensionsOptions,
      key: 'monitoredExtensions',
      cleanOnReset: true,
      permissionCheckFunction: () =>
        this.hasPermission,
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
    if (!this.hasPermission) {
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
    if (!this.hasPermission) {
      return;
    }
    try {
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
      this.clearPresences();
      await this.fetchPresences(newExtensionIds);
    } catch (e) {
      console.error(e);
      this._deps.alert.danger({
        message: 'callHUDSyncExtensionsFailed',
      });
    }
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

  @action
  _clearPresences(extensionIds: string[]) {
    extensionIds.forEach((extensionId) => {
      delete this.presences[extensionId];
    });
  }

  clearPresences() {
    const presenceExtensionIds = Object.keys(this.presences);
    const monitoredExtensionIds = (this.data?.records ?? []).filter((item) =>
      item.extension.id !== String(this._deps.extensionInfo.id)
    ).map((item) => item.extension.id);
    const extensionIdsToClear = presenceExtensionIds.filter((extensionId) => !monitoredExtensionIds.includes(extensionId));
    this._clearPresences(extensionIdsToClear);
  }

  @storage
  @state
  enabled = false;

  @action
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  async toggleEnabled() {
    let newEnabled = !this.enabled;
    this.setEnabled(newEnabled);
    if (!newEnabled) {
      this.onReset();
    } else {
      await this._deps.dataFetcherV2.fetchData(this._source);
      this.onInit();
    }
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
        const response = await this._deps.client.service.platform().get(`/restapi/v1.0/account/~/extension/${extensionIds[0]}/presence?detailedTelephonyState=true&sipData=true`);
        const presence = await response.json();
        presences = [presence];
      }
      this.setPresences(presences as [PresenceData]);
    } catch (e) {
      console.error(e);
    }
  }

  async _updateExtensions(extensions) {
    try {
      await this._deps.client.service.platform().put(
        '/restapi/v1.0/account/~/extension/~/presence/line',
        JSON.stringify(extensions),
        null,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (e) {
      console.error(e);
      this._deps.alert.danger({
        message: 'callHUDUpdateExtensionsFailed',
      });
    }
  }

  async addExtensions(extensions) {
    const feature = this._deps.extensionFeatures.features['HUD'];
    const limit = feature?.params?.find(p => p.name === 'limitMax')?.value;
    if (
      limit &&
      extensions.length + this.monitoredExtensions.length > Number.parseInt(limit, 10)
    ) {
      this._deps.alert.warning({
        message: 'callHUDAddExtensionsLimitExceeded',
      });
      return;
    }
    const currentList = (this.data?.records ?? []);
    const lastId = Number.parseInt(currentList[currentList.length - 1]?.id || '3', 10);
    const newList = currentList.map((item) => ({
      id: item.id,
      extension: {
        id: String(item.extension.id),
      },
    })).concat(extensions.map((extension, index) => ({
      id: String(lastId + index + 1),
      extension: {
        id: String(extension.id),
      },
    })));
    await this._updateExtensions(newList);
    await this.sync();
  }

  async removeExtension(extensionId) {
    const currentList = (this.data?.records ?? []);
    const newList = currentList.filter((item) => item.extension?.id !== String(extensionId));
    await this._updateExtensions(newList);
    await this.sync();
  }

  @computed((that: MonitoredExtensions) => [
    that.data,
    that._deps.companyContacts.data,
    that._deps.extensionInfo.id,
    that.presences,
    that._deps.auth.accessToken,
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
          profileImageUrl: (
            contact?.profileImage?.uri ? 
              `${contact.profileImage.uri}?access_token=${this._deps.auth.accessToken}` :
              undefined
          ),
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
  get callQueuePickupList() {
    return this.monitoredExtensions.filter((extension) => extension.extension.type === 'Department');
  }

  @computed(({ monitoredExtensions }: MonitoredExtensions) => [monitoredExtensions])
  get parkLocations() {
    return this.monitoredExtensions.filter((extension) => extension.extension.type === 'ParkLocation');
  }

  @computed(({ monitoredExtensions }: MonitoredExtensions) => [monitoredExtensions])
  get activeExtensionLength() {
    return this.monitoredExtensions.filter(
      (extension) =>
        extension.extension.type !== 'User' &&
        extension.presence?.activeCalls?.length > 0
    ).length;
  }

  get hasPermission() {
    return this._deps.appFeatures.hasHUDPermission && this.enabled;
  }
}
