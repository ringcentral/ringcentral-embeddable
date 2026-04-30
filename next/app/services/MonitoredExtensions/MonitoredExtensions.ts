import { batchGetApi } from '@ringcentral-integration/commons/lib/batchApiHelper';
import {
  Auth,
  Client,
  DataFetcher,
  DataFetcherConsumer,
  DataSource,
  ExtensionFeatures,
  ExtensionInfo,
  type WebSocketSubscription as Subscription,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { CompanyContacts } from '@ringcentral-integration/micro-contacts/src/app/services';
import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import {
  action,
  computed,
  delegate,
  injectable,
  optional,
  PortManager,
  state,
  storage,
  StoragePlugin,
  watch,
} from '@ringcentral-integration/next-core';
import type { Unsubscribe } from 'redux';

import { AppFeatures } from '@ringcentral-integration/micro-auth/src/app/services/AppFeatures';
import type { AppFeatures as EmbeddableAppFeatures } from '../AppFeatures';

import { t } from './i18n';
import type {
  MonitoredExtensionData,
  MonitoredExtensionItem,
  MonitoredExtensionSubscriptionMessage,
  MonitoredExtensionUpdatePayload,
  MonitoredExtensionsOptions,
  PresenceData,
} from './MonitoredExtensions.interface';

const MONITORED_LINE_URL =
  '/restapi/v1.0/account/~/extension/~/presence/line';
const MONITORED_LINE_QUERY = '?page=1&perPage=1000';
const PRESENCE_EVENT_URL =
  '/restapi/v1.0/account/~/extension/~/presence/line/presence?detailedTelephonyState=true&sipData=true';
const PRESENCE_SUBSCRIPTION_FILTERS = [
  MONITORED_LINE_URL,
  PRESENCE_EVENT_URL,
];
const DEFAULT_LIMIT_KEY = 'HUD';
const BATCH_SIZE = 30;

type CompanyContact = {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  status?: string;
  profileImage?: {
    uri?: string;
  };
};

@injectable({
  name: 'MonitoredExtensions',
})
export class MonitoredExtensions extends DataFetcherConsumer<MonitoredExtensionData> {
  private _stopWatchingSubscription: Unsubscribe | null = null;

  constructor(
    protected _auth: Auth,
    protected _client: Client,
    protected override _dataFetcher: DataFetcher,
    protected _appFeatures: AppFeatures,
    protected _extensionFeatures: ExtensionFeatures,
    protected _extensionInfo: ExtensionInfo,
    protected _companyContacts: CompanyContacts,
    protected _toast: Toast,
    protected _storage: StoragePlugin,
    protected _portManager: PortManager,
    @optional('Subscription') protected _subscription?: Subscription,
    @optional('MonitoredExtensionsOptions')
    protected _options?: MonitoredExtensionsOptions,
  ) {
    super(_dataFetcher);
    this._storage.enable(this);

    this._source = new DataSource({
      ...this._options,
      key: 'monitoredExtensions',
      cleanOnReset: true,
      fetchFunction: async () => {
        const response = await this._client.service
          .platform()
          .get(`${MONITORED_LINE_URL}${MONITORED_LINE_QUERY}`);
        return response.json();
      },
      readyCheckFunction: () => this._appFeatures.ready,
      permissionCheckFunction: () => this.hasPermission,
    });
    this._dataFetcher.register(this._source);

    this._subscription?.register(this, {
      filters: PRESENCE_SUBSCRIPTION_FILTERS,
    });
  }

  private get _embeddableAppFeatures() {
    return this._appFeatures as EmbeddableAppFeatures;
  }

  override onInit() {
    if (!this.hasPermission) {
      return;
    }
    if (this._subscription) {
      this._stopWatchingSubscription = watch(
        this,
        () => this._subscription!.message,
        (message) =>
          this._handleSubscription(
            message as MonitoredExtensionSubscriptionMessage | undefined,
          ),
      );
    }
    this._fetchInitialPresences();
  }

  override onReset() {
    this._stopWatchingSubscription?.();
    this._stopWatchingSubscription = null;
  }

  private _fetchInitialPresences() {
    const monitored = this._getMonitoredRecords();
    const extensionIds = monitored.map((item) => item.extension.id);
    if (extensionIds.length > 0) {
      void this.fetchPresences(extensionIds);
    }
  }

  private _getMonitoredRecords() {
    return (this.data?.records ?? []).filter(
      (item) => item.extension.id !== String(this._extensionInfo.id),
    );
  }

  private _handleSubscription(
    message?: MonitoredExtensionSubscriptionMessage,
  ) {
    if (!message?.event) {
      return;
    }
    if (
      message.event.indexOf('/presence?detailedTelephonyState=true') !== -1 &&
      message.body
    ) {
      this.setPresences([message.body]);
      return;
    }
    if (message.event.indexOf('/presence/line') !== -1) {
      void this.sync();
    }
  }

  @delegate('server')
  async sync() {
    if (!this.hasPermission) {
      return;
    }
    try {
      await this._dataFetcher.fetchData(this._source);
      const newExtensionIds: string[] = [];
      const monitored = this._getMonitoredRecords();
      monitored.forEach((item) => {
        if (!this.presences[item.extension.id]) {
          newExtensionIds.push(item.extension.id);
        }
      });
      this.clearPresences();
      await this.fetchPresences(newExtensionIds);
    } catch (e) {
      this.logger.error('sync monitored extensions failed', e);
      this._toast.danger({
        message: t('callHUDSyncExtensionsFailed'),
      });
    }
  }

  @storage
  @state
  presences: Record<string, PresenceData> = {};

  @action
  setPresences(newPresences: PresenceData[]) {
    newPresences.forEach((presence) => {
      const extensionId = String(
        presence.extensionId || presence.extension?.id || '',
      );
      if (!extensionId) return;
      const activeCalls = (presence.activeCalls ?? []).filter(
        (call) =>
          !(
            call.telephonyStatus === 'NoCall' &&
            call.terminationType === 'final'
          ),
      );
      const {
        extension: _extensionRef,
        extensionId: _extensionIdRef,
        uri: _uriRef,
        ...rest
      } = presence;
      this.presences[extensionId] = {
        ...rest,
        activeCalls,
      };
    });
  }

  @action
  private _clearPresences(extensionIds: string[]) {
    extensionIds.forEach((extensionId) => {
      delete this.presences[extensionId];
    });
  }

  clearPresences() {
    const presenceExtensionIds = Object.keys(this.presences);
    const monitoredExtensionIds = this._getMonitoredRecords().map(
      (item) => item.extension.id,
    );
    const extensionIdsToClear = presenceExtensionIds.filter(
      (extensionId) => !monitoredExtensionIds.includes(extensionId),
    );
    if (extensionIdsToClear.length > 0) {
      this._clearPresences(extensionIdsToClear);
    }
  }

  @storage
  @state
  enabled = true;

  @action
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  @delegate('server')
  async toggleEnabled() {
    const newEnabled = !this.enabled;
    this.setEnabled(newEnabled);
    if (!newEnabled) {
      this.onReset();
    } else {
      await this._dataFetcher.fetchData(this._source);
      this.onInit();
    }
  }

  async fetchPresences(extensionIds: string[]) {
    if (extensionIds.length === 0) {
      return;
    }
    if (this._portManager.shared && !this._portManager.isServer) {
      return;
    }
    try {
      let presences: PresenceData[] = [];
      if (extensionIds.length > 1) {
        const batchedExtensionIds = extensionIds.reduce<string[][]>(
          (acc, _id, index) => {
            if (index % BATCH_SIZE === 0) {
              acc.push(extensionIds.slice(index, index + BATCH_SIZE));
            }
            return acc;
          },
          [],
        );
        for (const group of batchedExtensionIds) {
          const responses = await batchGetApi({
            platform: this._client.service.platform(),
            url: `/restapi/v1.0/account/~/extension/${group.join(',')}/presence?detailedTelephonyState=true&sipData=true`,
          });
          const parsed = await Promise.all(
            responses.map((response: Response) => response.json()),
          );
          presences = presences.concat(parsed as PresenceData[]);
        }
      } else {
        const response = await this._client.service
          .platform()
          .get(
            `/restapi/v1.0/account/~/extension/${extensionIds[0]}/presence?detailedTelephonyState=true&sipData=true`,
          );
        const presence = (await response.json()) as PresenceData;
        presences = [presence];
      }
      this.setPresences(presences);
    } catch (e) {
      this.logger.error('fetch presences failed', e);
    }
  }

  private async _updateExtensions(
    extensions: MonitoredExtensionUpdatePayload[],
  ) {
    try {
      await this._client.service
        .platform()
        .put(
          MONITORED_LINE_URL,
          JSON.stringify(extensions),
          null,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );
    } catch (e) {
      this.logger.error('update monitored extensions failed', e);
      this._toast.danger({
        message: t('callHUDUpdateExtensionsFailed'),
      });
    }
  }

  @delegate('mainClient')
  async addExtensions(
    extensions: { id: string | number }[],
  ) {
    const feature = this._extensionFeatures.features?.[DEFAULT_LIMIT_KEY];
    const limit = feature?.params?.find((p) => p.name === 'limitMax')?.value;
    if (
      limit &&
      extensions.length + this.monitoredExtensions.length >
        Number.parseInt(limit, 10)
    ) {
      this._toast.warning({
        message: t('callHUDAddExtensionsLimitExceeded'),
      });
      return;
    }
    const currentList = this.data?.records ?? [];
    const lastId = Number.parseInt(
      currentList[currentList.length - 1]?.id || '3',
      10,
    );
    const newList = currentList
      .map((item) => ({
        id: item.id,
        extension: {
          id: String(item.extension.id),
        },
      }))
      .concat(
        extensions.map((extension, index) => ({
          id: String(lastId + index + 1),
          extension: {
            id: String(extension.id),
          },
        })),
      );
    await this._updateExtensions(newList as MonitoredExtensionUpdatePayload[]);
    await this.sync();
  }

  @delegate('mainClient')
  async removeExtension(extensionId: string | number) {
    const currentList = this.data?.records ?? [];
    const newList = currentList
      .filter((item) => item.extension?.id !== String(extensionId))
      .map((item) => ({
        id: item.id,
        extension: {
          id: String(item.extension.id),
        },
      }));
    await this._updateExtensions(newList as MonitoredExtensionUpdatePayload[]);
    await this.sync();
  }

  @computed((that: MonitoredExtensions) => [
    that.data,
    that._companyContacts.data,
    that._extensionInfo.id,
    that.presences,
    that._auth.accessToken,
  ])
  get monitoredExtensions(): MonitoredExtensionItem[] {
    const monitored = this._getMonitoredRecords();
    const extensionIdMaps = monitored.reduce<Record<string, number>>(
      (acc, item) => {
        acc[item.extension.id] = 1;
        return acc;
      },
      {},
    );
    const companyContacts = Array.isArray(this._companyContacts.data)
      ? (this._companyContacts.data as CompanyContact[])
      : [];
    const companyContactsMap = companyContacts.reduce<
      Record<string, CompanyContact>
    >(
      (acc, item) => {
        if (extensionIdMaps[item.id]) {
          acc[item.id] = item;
        }
        return acc;
      },
      {},
    );
    return monitored.map((item) => {
      const contact = companyContactsMap[item.extension.id];
      let name = contact?.name as string | undefined;
      if (!name && (contact?.firstName || contact?.lastName)) {
        name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
      }
      return {
        id: item.id,
        extension: {
          id: item.extension.id,
          extensionNumber: item.extension.extensionNumber,
          type: item.extension.type,
          name,
          status: contact?.status,
          profileImageUrl: contact?.profileImage?.uri
            ? `${contact.profileImage.uri}?access_token=${this._auth.accessToken}`
            : undefined,
        },
        presence: this.presences[item.extension.id],
      };
    });
  }

  @computed(({ monitoredExtensions }: MonitoredExtensions) => [
    monitoredExtensions,
  ])
  get groupCallPickupList() {
    return this.monitoredExtensions.filter(
      (extension) => extension.extension.type === 'GroupCallPickup',
    );
  }

  @computed(({ monitoredExtensions }: MonitoredExtensions) => [
    monitoredExtensions,
  ])
  get callQueuePickupList() {
    return this.monitoredExtensions.filter(
      (extension) => extension.extension.type === 'Department',
    );
  }

  @computed(({ monitoredExtensions }: MonitoredExtensions) => [
    monitoredExtensions,
  ])
  get parkLocations() {
    return this.monitoredExtensions.filter(
      (extension) => extension.extension.type === 'ParkLocation',
    );
  }

  @computed(({ monitoredExtensions }: MonitoredExtensions) => [
    monitoredExtensions,
  ])
  get activeExtensionLength() {
    return this.monitoredExtensions.filter(
      (extension) =>
        extension.extension.type !== 'User' &&
        (extension.presence?.activeCalls?.length ?? 0) > 0,
    ).length;
  }

  get hasPermission() {
    return this._embeddableAppFeatures.hasHUDPermission && this.enabled;
  }
}
