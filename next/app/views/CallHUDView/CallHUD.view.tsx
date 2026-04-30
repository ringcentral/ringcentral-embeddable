import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import {
  Auth,
  ExtensionInfo,
  NumberFormatter,
} from '@ringcentral-integration/micro-auth/src/app/services';
import {
  ModalView,
  type NonJSXModalItemProps,
} from '@ringcentral-integration/micro-core/src/app/views';
import { ComposeText } from '@ringcentral-integration/micro-message/src/app/services';
import {
  Call,
  CallingSettings,
  CallQueues,
  Webphone,
} from '@ringcentral-integration/micro-phone/src/app/services';
import {
  CompanyContacts,
} from '@ringcentral-integration/micro-contacts/src/app/services';
import {
  action,
  computed,
  injectable,
  optional,
  portal,
  RcViewModule,
  Root,
  RouterPlugin,
  state,
  useConnector,
} from '@ringcentral-integration/next-core';
import React, { useRef } from 'react';

import { AppFeatures } from '@ringcentral-integration/micro-auth/src/app/services/AppFeatures';
import type { AppFeatures as EmbeddableAppFeatures } from '../../services/AppFeatures';
import { MonitoredExtensions } from '../../services/MonitoredExtensions';
import type {
  MonitoredExtensionItem,
  PresenceActiveCall,
} from '../../services/MonitoredExtensions/MonitoredExtensions.interface';
import type {
  AvailableExtension,
  CallHUDPanelProps,
  TypeListItem,
} from './CallHUD.view.interface';
import { AddExtensionContent } from './AddExtensionDialog';
import { CallHUDPanel } from './CallHUDPanel';
import { t } from './i18n';
import { ExpandedView } from '../ExpandedView';

type SpringModalBodyClasses = {
  root?: string;
};

type CallHUDModalProps = Omit<NonJSXModalItemProps, 'onExited'> & {
  classes?: SpringModalBodyClasses;
  'data-sign'?: string;
};

const expandedCompactModalClasses: SpringModalBodyClasses = {
  root: '!left-auto !right-auto',
};

@injectable({
  name: 'CallHUDView',
})
export class CallHUDView extends RcViewModule {
  constructor(
    private _root: Root,
    private _monitoredExtensions: MonitoredExtensions,
    private _webphone: Webphone,
    private _call: Call,
    private _numberFormatter: NumberFormatter,
    private _appFeatures: AppFeatures,
    private _callingSettings: CallingSettings,
    private _companyContacts: CompanyContacts,
    private _auth: Auth,
    private _extensionInfo: ExtensionInfo,
    private _router: RouterPlugin,
    private _modalView: ModalView,
    private _expandedView: ExpandedView,
    @optional() private _composeText?: ComposeText,
    @optional() private _callQueues?: CallQueues,
  ) {
    super();
  }

  private get _embeddableAppFeatures() {
    return this._appFeatures as EmbeddableAppFeatures;
  }

  private get _expandedCompactModalClasses():
    | SpringModalBodyClasses
    | undefined {
    return this._root.expanded ? expandedCompactModalClasses : undefined;
  }

  @state
  showCallHUD = false;

  @state
  type = 'All';

  @state
  searchInput = '';

  @state
  extensionAddFilter = '';

  @portal
  private _removeConfirmModal = this._modalView.create<{
    extensionId: string;
    extensionName: string;
    isParkLocation: boolean;
  }>({
    props: (data): CallHUDModalProps => ({
      header: t('remove'),
      variant: 'confirm' as const,
      confirmButtonText: t('remove'),
      cancelButtonText: t('cancel'),
      content: data.isParkLocation
        ? t('removeParkLocationConfirm', { name: data.extensionName })
        : t('removeExtensionConfirm', { name: data.extensionName }),
      ['data-sign']: 'removeExtensionModal',
      classes: this._expandedCompactModalClasses,
      onConfirm: async () => {
        await this._monitoredExtensions.removeExtension(data.extensionId);
      },
    }),
  });

  @portal
  private _addExtensionModal = this._modalView.create({
    view: () => {
      const { allExtensions, filterInput } = useConnector(
        () => ({
          allExtensions: this.availableExtensions,
          filterInput: this.extensionAddFilter,
        }),
      );
      return (
        <AddExtensionContent
          allExtensions={allExtensions}
          filterInput={filterInput}
          type={this._addModalType}
          onFilterChange={(value) => this.setExtensionAddFilter(value)}
          onAdd={async (exts) => {
            if (exts.length > 0) {
              await this._monitoredExtensions.addExtensions(
                exts.map((ext) => ({ id: ext.id })),
              );
            }
            this.resetAddExtensionModal();
          }}
          onCancel={() => this.resetAddExtensionModal()}
        />
      );
    },
    props: (): CallHUDModalProps => ({
      header:
        this._addModalType === 'User'
          ? t('addExtensions')
          : t('addParkLocations'),
      ['data-sign']: 'addExtensionModal',
      classes: this._expandedCompactModalClasses,
      onCancel: () => {
        this.resetAddExtensionModal();
      },
    }),
  });

  private _addModalType = 'User';

  openRemoveConfirmModal(
    extensionId: string,
    extensionName: string,
    isParkLocation: boolean,
  ) {
    this._modalView.open(this._removeConfirmModal, {
      extensionId,
      extensionName,
      isParkLocation,
    });
  }

  openAddExtensionModal() {
    this._addModalType = this.type === 'All' ? 'User' : this.type;
    this.resetAddExtensionModal();
    this._modalView.open(this._addExtensionModal);
  }

  openAddExtensionModalForType(forType: string) {
    this._addModalType = forType;
    this.resetAddExtensionModal();
    this._modalView.open(this._addExtensionModal);
  }

  @action
  setShowCallHUD(show: boolean) {
    this.showCallHUD = show;
  }

  @action
  setType(type: string) {
    this.type = type;
    this.searchInput = '';
    this.extensionAddFilter = '';
  }

  @action
  setSearchInput(value: string) {
    this.searchInput = value;
  }

  @action
  setExtensionAddFilter(value: string) {
    this.extensionAddFilter = value;
  }

  @action
  private resetAddExtensionModal() {
    this.extensionAddFilter = '';
  }

  toggleCallHUD() {
    if (this.showCallHUD) {
      this.setShowCallHUD(false);
      this._expandedView.close();
    } else {
      this.setShowCallHUD(true);
      this._expandedView.open(this._expandedHandle);
    }
  }

  @computed((that: CallHUDView) => [
    that.type,
    that.searchInput,
    that._monitoredExtensions.monitoredExtensions,
  ])
  get extensions(): MonitoredExtensionItem[] {
    let list = this._monitoredExtensions.monitoredExtensions;
    if (this.type !== 'All') {
      list = list.filter((item) => item.extension.type === this.type);
    }
    if (this.searchInput) {
      const search = this.searchInput.toLowerCase();
      list = list.filter(
        (item) =>
          item.extension.name?.toLowerCase().includes(search) ||
          item.extension.extensionNumber?.toLowerCase().includes(search),
      );
    }
    return list;
  }

  @computed((that: CallHUDView) => [
    that.extensions,
    that.typeList,
    that.type,
  ])
  get groupedExtensions(): Record<string, MonitoredExtensionItem[]> {
    if (this.type !== 'All') return {};
    const groups: Record<string, MonitoredExtensionItem[]> = {};
    for (const typeItem of this.typeList) {
      if (typeItem.id === 'All') continue;
      groups[typeItem.id] = [];
    }
    for (const item of this.extensions) {
      const key = item.extension.type;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    }
    return groups;
  }

  @computed((that: CallHUDView) => [that.typeList])
  get typeFilterSelections(): { label: string; value: string }[] {
    return this.typeList.map((item) => {
      const label =
        item.unreadCount > 0
          ? `${t(item.id as any)} (${item.unreadCount})`
          : t(item.id as any);
      return { label, value: item.id };
    });
  }

  @computed((that: CallHUDView) => [
    that._monitoredExtensions.monitoredExtensions,
    that._callQueues?.grants,
  ])
  get typeList(): TypeListItem[] {
    const list: TypeListItem[] = [
      { id: 'All', unreadCount: 0 },
      { id: 'User', unreadCount: 0 },
    ];

    const parkLocations = this._monitoredExtensions.parkLocations;
    const hasParkGrants =
      this._callQueues?.grants?.some(
        (g) => g.extension.type === 'ParkLocation',
      ) ?? false;
    if (parkLocations.length > 0 || hasParkGrants) {
      const unreadCount = parkLocations.reduce(
        (acc, item) =>
          acc + ((item.presence?.activeCalls?.length ?? 0) > 0 ? 1 : 0),
        0,
      );
      list.push({ id: 'ParkLocation', unreadCount });
    }

    const groupPickups = this._monitoredExtensions.groupCallPickupList;
    if (groupPickups.length > 0) {
      const unreadCount = groupPickups.reduce(
        (acc, item) =>
          acc + ((item.presence?.activeCalls?.length ?? 0) > 0 ? 1 : 0),
        0,
      );
      list.push({ id: 'GroupCallPickup', unreadCount });
    }

    const callQueues = this._monitoredExtensions.callQueuePickupList;
    if (callQueues.length > 0) {
      const unreadCount = callQueues.reduce(
        (acc, item) =>
          acc + ((item.presence?.activeCalls?.length ?? 0) > 0 ? 1 : 0),
        0,
      );
      list.push({ id: 'Department', unreadCount });
    }

    return list;
  }

  @computed((that: CallHUDView) => [
    that._companyContacts.data,
    that._auth.accessToken,
    that.extensionAddFilter,
    that._monitoredExtensions.monitoredExtensions,
    that._callQueues?.grants,
    that._extensionInfo.id,
  ])
  get availableExtensions(): AvailableExtension[] {
    if (!this.extensionAddFilter?.trim()) {
      return [];
    }
    const search = this.extensionAddFilter.toLowerCase();
    const addedMap: Record<string, boolean> = {};
    for (const item of this._monitoredExtensions.monitoredExtensions) {
      addedMap[item.extension.id] = true;
    }
    addedMap[String(this._extensionInfo.id)] = true;

    if (this._addModalType === 'ParkLocation') {
      const parkGrants = (this._callQueues?.grants ?? []).filter(
        (g) => g.extension.type === 'ParkLocation',
      );
      return parkGrants
        .filter(
          (item) =>
            !addedMap[item.extension.id] &&
            (item.extension.extensionNumber?.toLowerCase().includes(search) ||
              item.extension.name?.toLowerCase().includes(search)),
        )
        .slice(0, 10)
        .map((item) => ({
          id: item.extension.id,
          name: item.extension.name,
          extensionNumber: item.extension.extensionNumber,
        }));
    }

    const contacts = this._companyContacts.data ?? [];
    return (contacts as any[])
      .filter(
        (item) =>
          item.type === 'User' &&
          !addedMap[item.id] &&
          (item.extensionNumber?.toLowerCase().includes(search) ||
            item.name?.toLowerCase().includes(search) ||
            item.firstName?.toLowerCase().includes(search) ||
            item.lastName?.toLowerCase().includes(search) ||
            `${item.firstName || ''} ${item.lastName || ''}`
              .toLowerCase()
              .includes(search)),
      )
      .slice(0, 10)
      .map((item) => {
        let name = item.name as string | undefined;
        if (!name && (item.firstName || item.lastName)) {
          name = `${item.firstName || ''} ${item.lastName || ''}`.trim();
        }
        return {
          id: item.id,
          name: name || item.extensionNumber,
          extensionNumber: item.extensionNumber,
          profileImageUrl: item.profileImage?.uri
            ? `${item.profileImage.uri}?access_token=${this._auth.accessToken}`
            : undefined,
        };
      });
  }

  get hasPermission() {
    return this._embeddableAppFeatures.hasHUDPermission;
  }

  private _getUIProps(): Omit<
    CallHUDPanelProps,
    | 'onSearchInputChange'
    | 'onTypeChange'
    | 'formatPhone'
    | 'onClickToDial'
    | 'onPark'
    | 'onText'
    | 'pickParkLocation'
    | 'pickGroupCall'
    | 'pickCallQueueCall'
    | 'onAddExtension'
    | 'onAddExtensionForType'
    | 'onRemoveExtension'
  > {
    const activeSession = this._webphone.activeSession;
    const hasActiveSession = !!(
      activeSession &&
      activeSession.callStatus === 'connected' &&
      !activeSession.isOnHold
    );
    return {
      type: this.type,
      typeList: this.typeList,
      typeFilterSelections: this.typeFilterSelections,
      searchInput: this.searchInput,
      extensions: this.extensions,
      groupedExtensions: this.groupedExtensions,
      disableClickToDial: !(this._call && this._call.isIdle),
      canPark: hasActiveSession,
      canEdit: this._embeddableAppFeatures.hasEditMonitoredExtensionsPermission,
    };
  }

  private _getUIFunctions(): Pick<
    CallHUDPanelProps,
    | 'onSearchInputChange'
    | 'onTypeChange'
    | 'formatPhone'
    | 'onClickToDial'
    | 'onPark'
    | 'onText'
    | 'pickParkLocation'
    | 'pickGroupCall'
    | 'pickCallQueueCall'
    | 'onAddExtension'
    | 'onAddExtensionForType'
    | 'onRemoveExtension'
  > {
    return {
      onTypeChange: (type: string) => this.setType(type),
      onSearchInputChange: (value: string) => this.setSearchInput(value),
      formatPhone: (phoneNumber: string) =>
        this._numberFormatter.formatNumber(phoneNumber),
      onClickToDial: (recipient) => {
        if (this._call?.isIdle) {
          void this._router.push('/dialer');
          this._call.call({
            phoneNumber: recipient.phoneNumber,
            recipient,
            fromNumber: this._callingSettings.fromNumber,
          });
        }
      },
      onPark: async (extension) => {
        const activeSession = this._webphone.activeSession;
        if (activeSession) {
          await (this._webphone as any).parkToLocation(
            activeSession.id,
            extension,
          );
        }
      },
      onText: async (text: string) => {
        if (text && this._composeText) {
          await this._composeText.clean();
          await this._router.push('/composeText');
          await this._composeText.updateMessageText(text);
        }
      },
      pickParkLocation: async (
        extension: { id: string },
        activeCall: PresenceActiveCall,
      ) => {
        await (this._webphone as any).pickParkLocation(
          extension.id,
          activeCall,
          this._callingSettings.fromNumber,
        );
      },
      pickGroupCall: async (
        extension: { id: string },
        activeCall: PresenceActiveCall,
      ) => {
        await (this._webphone as any).pickGroupCall(
          extension.id,
          activeCall,
          this._callingSettings.fromNumber,
          'gcp',
        );
      },
      pickCallQueueCall: async (
        extension: { id: string },
        activeCall: PresenceActiveCall,
      ) => {
        await (this._webphone as any).pickGroupCall(
          extension.id,
          activeCall,
          this._callingSettings.fromNumber,
          'qpk',
        );
      },
      onAddExtension: () => this.openAddExtensionModal(),
      onAddExtensionForType: (forType: string) =>
        this.openAddExtensionModalForType(forType),
      onRemoveExtension: (
        extensionId: string,
        extensionName: string,
        isParkLocation: boolean,
      ) => this.openRemoveConfirmModal(extensionId, extensionName, isParkLocation),
    };
  }

  private _expandedHandle = this._expandedView.create({
    header: () => t('callHUD'),
    view: () => {
      const { current: uiFunctions } = useRef(this._getUIFunctions());
      const uiProps = useConnector(() => this._getUIProps());
      return <CallHUDPanel {...uiProps} {...uiFunctions} />;
    },
    onClose: () => this.setShowCallHUD(false),
  });

  component() {
    return null;
  }
}
