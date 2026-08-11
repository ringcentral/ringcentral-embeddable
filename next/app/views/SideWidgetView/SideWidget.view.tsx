import type { NormalizedSession } from '@ringcentral-integration/commons/interfaces/Webphone.interface';
import { Theme } from '@ringcentral-integration/micro-core/src/app/services';
import {
  action,
  injectable,
  optional,
  RcViewModule,
  state,
  useConnector,
} from '@ringcentral-integration/next-core';
import React, { useRef } from 'react';

import {
  ThirdParty,
  type LoadAppPageParams,
  type ThirdPartyApp,
  type ThirdPartyWidgetContact,
} from '../../services/ThirdParty';
import { ExpandedView } from '../ExpandedView';

import {
  getSideWidgetAppTabId,
  getSideWidgetContact,
  isSameSideWidgetContact,
  SIDE_WIDGET_APP_TAB_PREFIX,
  SIDE_WIDGET_APPS_TAB_ID,
} from './SideWidget.helper';
import {
  SideWidgetContentHandle,
  type SideWidgetContentOptions,
  type SideWidgetOpenContentOptions,
  type SideWidgetOptions,
  type SideWidgetTab,
} from './SideWidget.view.interface';
import { SideWidgetPanel } from './SideWidgetPanel';

function createAppsTab(): SideWidgetTab {
  return {
    id: SIDE_WIDGET_APPS_TAB_ID,
    name: 'Apps',
  };
}

@injectable({
  name: 'SideWidgetView',
})
export class SideWidgetView extends RcViewModule {
  constructor(
    private _expandedView: ExpandedView,
    private _thirdParty: ThirdParty,
    private _theme: Theme,
    @optional('SideWidgetOptions')
    private _sideWidgetOptions?: SideWidgetOptions,
  ) {
    super();
  }

  @state
  tabs: SideWidgetTab[] = [createAppsTab()];

  @state
  currentTabId = SIDE_WIDGET_APPS_TAB_ID;

  @state
  selectedAppId: string | null = null;

  @state
  currentContact: ThirdPartyWidgetContact | null = null;

  private readonly _contentHandles = new Map<
    string,
    SideWidgetContentHandle
  >();

  get enabled(): boolean {
    return this._sideWidgetOptions?.enableSideWidget ?? false;
  }

  get isOpen(): boolean {
    return this._expandedView.activeContentId === 'side-widget';
  }

  createContent(options: SideWidgetContentOptions): SideWidgetContentHandle {
    if (
      options.id === SIDE_WIDGET_APPS_TAB_ID ||
      options.id.startsWith(SIDE_WIDGET_APP_TAB_PREFIX)
    ) {
      throw new Error(`Side widget content id is reserved: ${options.id}`);
    }
    if (this._contentHandles.has(options.id)) {
      throw new Error(
        `Side widget content id is already registered: ${options.id}`,
      );
    }
    const handle = new SideWidgetContentHandle(options);
    this._contentHandles.set(options.id, handle);
    return handle;
  }

  openContent(
    handle: SideWidgetContentHandle,
    { activate = true }: SideWidgetOpenContentOptions = {},
  ): void {
    const { id, name } = handle.options;
    if (this._contentHandles.get(id) !== handle) {
      throw new Error(`Side widget content handle is not registered: ${id}`);
    }
    this._openContentTab({ id, name }, activate);
    this._expandedView.open(this._expandedHandle);
  }

  closeContent(handle: SideWidgetContentHandle): void {
    if (this._contentHandles.get(handle.options.id) !== handle) {
      return;
    }
    this.closeTab(handle.options.id);
  }

  @action
  private _openContentTab(tab: SideWidgetTab, activate: boolean): void {
    const tabs =
      this.enabled && this._thirdParty.apps.length > 0
        ? this.tabs
        : this.tabs.filter(({ id }) => id !== SIDE_WIDGET_APPS_TAB_ID);
    this.tabs = tabs.some(({ id }) => id === tab.id)
      ? tabs.map((item) => (item.id === tab.id ? tab : item))
      : tabs.concat(tab);
    if (activate) {
      this.currentTabId = tab.id;
      this.selectedAppId = null;
    }
  }

  @action
  openApps(contact: ThirdPartyWidgetContact): void {
    if (!this.enabled || this._thirdParty.apps.length === 0) {
      return;
    }
    this._setContact(contact);
    this._ensureAppsTab();
    this.currentTabId = SIDE_WIDGET_APPS_TAB_ID;
    this.selectedAppId = null;
    this._expandedView.open(this._expandedHandle);
  }

  @action
  openAppTab(
    app: ThirdPartyApp,
    contact: ThirdPartyWidgetContact | null,
  ): void {
    if (!this.enabled) {
      return;
    }
    if (contact) {
      this._setContact(contact);
    }
    this._ensureAppsTab();
    const tabId = getSideWidgetAppTabId(app.id);
    const tab: SideWidgetTab = {
      id: tabId,
      appId: app.id,
      name: app.name || app.id,
    };
    this.tabs = this.tabs.some(({ id }) => id === tabId)
      ? this.tabs.map((item) => (item.id === tabId ? tab : item))
      : this.tabs.concat(tab);
    this.currentTabId = tabId;
    this.selectedAppId = null;
  }

  @action
  selectTab(tabId: string): void {
    if (!this.tabs.some(({ id }) => id === tabId)) {
      return;
    }
    this.currentTabId = tabId;
  }

  @action
  selectApp(appId: string): void {
    const app = this._thirdParty.apps.find(({ id }) => id === appId);
    if (!app) {
      return;
    }
    if (this._thirdParty.pinAppIds.includes(appId)) {
      this.openAppTab(app, this.currentContact);
      return;
    }
    this.selectedAppId = appId;
  }

  @action
  showApps(): void {
    this.currentTabId = SIDE_WIDGET_APPS_TAB_ID;
    this.selectedAppId = null;
  }

  closeTab(tabId: string): void {
    const tabIndex = this.tabs.findIndex(({ id }) => id === tabId);
    if (tabIndex < 0) {
      return;
    }
    const contentHandle = this._contentHandles.get(tabId);
    if (this.tabs.length === 1) {
      this._resetTabs();
      contentHandle?.options.onClose?.();
      this.close();
      return;
    }
    this._removeTab(tabId, tabIndex);
    contentHandle?.options.onClose?.();
  }

  @action
  private _removeTab(tabId: string, tabIndex: number): void {
    const nextTabs = this.tabs.filter(({ id }) => id !== tabId);
    this.tabs = nextTabs;
    if (this.currentTabId === tabId) {
      this.currentTabId =
        nextTabs[Math.min(tabIndex, nextTabs.length - 1)]?.id ??
        SIDE_WIDGET_APPS_TAB_ID;
    }
    if (tabId === SIDE_WIDGET_APPS_TAB_ID) {
      this.selectedAppId = null;
    }
  }

  toggleAppPin(appId: string): void {
    const app = this._thirdParty.apps.find(({ id }) => id === appId);
    if (!app) {
      return;
    }
    const wasPinned = this._thirdParty.pinAppIds.includes(appId);
    this._thirdParty.toggleAppPin(appId);
    if (!wasPinned) {
      this.openAppTab(app, this.currentContact);
    }
  }

  close(): void {
    this._expandedView.close(this._expandedHandle);
  }

  private _handleExpandedClose(): void {
    const contentHandles = this.tabs.reduce<SideWidgetContentHandle[]>(
      (handles, { id }) => {
        const handle = this._contentHandles.get(id);
        if (handle) {
          handles.push(handle);
        }
        return handles;
      },
      [],
    );
    this._resetTabs();
    contentHandles.forEach(({ options }) => options.onClose?.());
  }

  @action
  private _resetTabs(): void {
    this.tabs = [createAppsTab()];
    this.currentTabId = SIDE_WIDGET_APPS_TAB_ID;
    this.selectedAppId = null;
  }

  onCallRing(session: NormalizedSession): void {
    this.openApps(getSideWidgetContact(session, 'from'));
  }

  onCallInit(session: NormalizedSession): void {
    const contact = getSideWidgetContact(session, 'to');
    this.openApps(contact);
    this._thirdParty.pinAppIds.forEach((appId) => {
      const app = this._thirdParty.apps.find(({ id }) => id === appId);
      if (app) {
        this.openAppTab(app, contact);
      }
    });
  }

  private _setContact(contact: ThirdPartyWidgetContact): void {
    if (!isSameSideWidgetContact(this.currentContact, contact)) {
      const contentTabs = this.tabs.filter(
        ({ id, appId }) => id !== SIDE_WIDGET_APPS_TAB_ID && !appId,
      );
      this.tabs = [createAppsTab(), ...contentTabs];
      this.selectedAppId = null;
    }
    this.currentContact = contact;
  }

  private _ensureAppsTab(): void {
    if (this.tabs.some(({ id }) => id === SIDE_WIDGET_APPS_TAB_ID)) {
      return;
    }
    this.tabs = [createAppsTab(), ...this.tabs];
  }

  private _renderContent(
    tabId: string,
    showCloseButton: boolean,
  ): React.ReactNode {
    const ContentView = this._contentHandles.get(tabId)?.options.view;
    return ContentView ? (
      <ContentView showCloseButton={showCloseButton} />
    ) : null;
  }

  private _expandedHandle = this._expandedView.create({
    id: 'side-widget',
    onClose: () => this._handleExpandedClose(),
    view: () => {
      const uiProps = useConnector(() => ({
        apps: this._thirdParty.apps.map((app) => {
          // Track the fields rendered by the panel without changing app identity.
          void app.name;
          void app.description;
          void app.iconUri;
          return app;
        }),
        tabs: this.tabs,
        currentTabId: this.currentTabId,
        selectedAppId: this.selectedAppId,
        currentContact: this.currentContact,
        pinAppIds: this._thirdParty.pinAppIds.slice(),
      }));
      const { current: uiFunctions } = useRef({
        onTabChange: (tabId: string) => this.selectTab(tabId),
        onSelectApp: (appId: string) => this.selectApp(appId),
        onBack: () => this.showApps(),
        onClose: () => this.close(),
        onCloseTab: (tabId: string) => this.closeTab(tabId),
        onTogglePin: (appId: string) => this.toggleAppPin(appId),
        renderContent: (tabId: string, showCloseButton: boolean) =>
          this._renderContent(tabId, showCloseButton),
        onLoadApp: (params: LoadAppPageParams) =>
          this._thirdParty.loadAppPage({
            ...params,
            theme: this._theme.themeType,
          }),
      });
      return (
        <SideWidgetPanel
          apps={uiProps.apps}
          tabs={uiProps.tabs}
          currentTabId={uiProps.currentTabId}
          selectedAppId={uiProps.selectedAppId}
          contact={uiProps.currentContact}
          pinAppIds={uiProps.pinAppIds}
          {...uiFunctions}
        />
      );
    },
  });

  component() {
    return null;
  }
}
