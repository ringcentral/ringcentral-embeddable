import type { NormalizedSession } from '@ringcentral-integration/commons/interfaces/Webphone.interface';
import {
  AppProvider,
  useAppFooter,
  useAppHeader,
} from '@ringcentral-integration/micro-core/src/app/components';
import { Theme } from '@ringcentral-integration/micro-core/src/app/services';
import {
  action,
  injectable,
  optional,
  RcViewModule,
  state,
  useConnector,
} from '@ringcentral-integration/next-core';
import React, { type ReactNode, useRef } from 'react';

import {
  ThirdParty,
  type LoadAppPageParams,
  type ThirdPartyApp,
  type ThirdPartyWidgetContact,
} from '../../services/ThirdParty';
import { ExpandedView } from '../ExpandedView';

import { describeContact, sideWidgetDebug } from './SideWidget.debug';
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

function isPromiseLike(value: unknown): value is PromiseLike<void> {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'then' in value &&
      typeof value.then === 'function',
  );
}

function SideWidgetContentPage({
  children,
  showCloseButton,
}: {
  children: ReactNode;
  showCloseButton: boolean;
}): React.ReactElement {
  const { nav } = useAppHeader({ defaultNav: null });
  const { footer } = useAppFooter({
    defaultFooter: null,
    calculateHeight: false,
  });
  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-neutral-base">
      <header
        className={
          showCloseButton
            ? 'flex-none'
            : 'flex-none [&_[data-sign=backButton]]:hidden'
        }
      >
        {nav}
      </header>
      <div className="flex min-h-0 flex-auto flex-col overflow-hidden">
        {children}
      </div>
      <footer className="flex-none">{footer}</footer>
    </div>
  );
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
    private _sideWidgetOptions?: SideWidgetOptions
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

  private readonly _contentHandles = new Map<string, SideWidgetContentHandle>();

  private readonly _liveCallIds = new Set<string>();

  private _appsOpenedForCall = false;

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
        `Side widget content id is already registered: ${options.id}`
      );
    }
    const handle = new SideWidgetContentHandle(options);
    this._contentHandles.set(options.id, handle);
    return handle;
  }

  createOrUpdateContent(
    options: SideWidgetContentOptions
  ): SideWidgetContentHandle {
    const existingHandle = this._contentHandles.get(options.id);
    if (existingHandle) {
      existingHandle.options = options;
      return existingHandle;
    }
    return this.createContent(options);
  }

  updateContent(
    handle: SideWidgetContentHandle,
    options: SideWidgetContentOptions
  ): void {
    if (this._contentHandles.get(handle.options.id) !== handle) {
      throw new Error(
        `Side widget content handle is not registered: ${handle.options.id}`
      );
    }
    if (options.id !== handle.options.id) {
      throw new Error('Side widget content id cannot be changed');
    }
    handle.options = options;
  }

  openContent(
    handle: SideWidgetContentHandle,
    {
      activate = true,
      contact,
      expand = true,
    }: SideWidgetOpenContentOptions = {}
  ): void {
    const { id, name } = handle.options;
    if (this._contentHandles.get(id) !== handle) {
      throw new Error(`Side widget content handle is not registered: ${id}`);
    }
    const tab: SideWidgetTab = {
      id,
      name,
      scope: handle.options.scope === 'global' ? 'global' : undefined,
    };
    const nextContact = contact === undefined ? this.currentContact : contact;
    const preserveTabs =
      contact === undefined ||
      isSameSideWidgetContact(this.currentContact, nextContact);
    const closedTabIds = this._getClosedTabIds(tab.id, preserveTabs);
    sideWidgetDebug('widget:openContent', {
      tabId: id,
      scope: handle.options.scope,
      showAppsTab: handle.options.showAppsTab,
      contactArg: describeContact(contact),
      currentContact: describeContact(this.currentContact),
      nextContact: describeContact(nextContact),
      preserveTabs,
      closedTabIds,
      tabsBefore: this.tabs.map(({ id: tabId }) => tabId),
    });
    const previousTabId = this.currentTabId;
    this._openTab(
      tab,
      nextContact,
      activate,
      preserveTabs,
      handle.options.showAppsTab,
    );
    this._notifyClosedTabs(closedTabIds);
    if (activate) {
      this._notifyTabActivation(previousTabId, tab.id);
    }
    if (expand) {
      this._expandedView.open(this._expandedHandle);
    } else {
      this._expandedView.open(this._expandedHandle, { expand: false });
    }
  }

  closeContent(handle: SideWidgetContentHandle): void {
    if (this._contentHandles.get(handle.options.id) !== handle) {
      return;
    }
    this.closeTab(handle.options.id);
  }

  @action
  private _openTab(
    tab: SideWidgetTab,
    contact: ThirdPartyWidgetContact | null,
    activate: boolean,
    preserveTabs: boolean,
    showAppsTab = false
  ): void {
    const shouldShowAppsTab =
      showAppsTab && this.enabled && this._thirdParty.apps.length > 0;
    const previousTabs =
      shouldShowAppsTab &&
      !this.tabs.some(({ id }) => id === SIDE_WIDGET_APPS_TAB_ID)
        ? [...this.tabs, createAppsTab()]
        : this.tabs;
    const availableTabs = this.enabled
      ? previousTabs.filter(
          ({ id }) =>
            id !== SIDE_WIDGET_APPS_TAB_ID ||
            this._appsOpenedForCall ||
            shouldShowAppsTab,
        )
      : previousTabs.filter(({ id }) => id !== SIDE_WIDGET_APPS_TAB_ID);
    const retainedTabs = preserveTabs
      ? availableTabs
      : availableTabs.filter(({ scope }) => scope === 'global');
    sideWidgetDebug('widget:openTab', {
      tabId: tab.id,
      activate,
      preserveTabs,
      showAppsTab,
      shouldShowAppsTab,
      appsOpenedForCall: this._appsOpenedForCall,
      liveCallIds: Array.from(this._liveCallIds),
      tabsBefore: this.tabs.map(({ id }) => id),
      availableTabs: availableTabs.map(({ id }) => id),
      retainedTabs: retainedTabs.map(({ id }) => id),
      contact: describeContact(contact),
    });
    const existingTabIndex = retainedTabs.findIndex(({ id }) => id === tab.id);
    this.tabs =
      existingTabIndex < 0
        ? [tab, ...retainedTabs]
        : retainedTabs.map((item, index) =>
            index === existingTabIndex ? tab : item
          );
    this.currentContact = contact;
    if (!preserveTabs) {
      this.selectedAppId = null;
    }
    if (activate) {
      this.currentTabId = tab.id;
      this.selectedAppId = null;
    } else if (!this.tabs.some(({ id }) => id === this.currentTabId)) {
      this.currentTabId = tab.id;
    }
  }

  openApps(contact: ThirdPartyWidgetContact): void {
    sideWidgetDebug('widget:openApps', {
      enabled: this.enabled,
      appCount: this._thirdParty.apps.length,
      contact: describeContact(contact),
      liveCallIds: Array.from(this._liveCallIds),
    });
    if (!this.enabled || this._thirdParty.apps.length === 0) {
      return;
    }
    this._appsOpenedForCall = true;
    const tab = createAppsTab();
    const preserveTabs = isSameSideWidgetContact(this.currentContact, contact);
    const closedTabIds = this._getClosedTabIds(tab.id, preserveTabs);
    const previousTabId = this.currentTabId;
    this._openTab(tab, contact, true, preserveTabs);
    this._notifyClosedTabs(closedTabIds);
    this._notifyTabActivation(previousTabId, tab.id);
    this._expandedView.open(this._expandedHandle);
  }

  openAppTab(
    app: ThirdPartyApp,
    contact: ThirdPartyWidgetContact | null
  ): void {
    if (!this.enabled) {
      return;
    }
    const nextContact = contact ?? this.currentContact;
    const tabId = getSideWidgetAppTabId(app.id);
    const tab: SideWidgetTab = {
      id: tabId,
      appId: app.id,
      name: app.name || app.id,
    };
    const preserveTabs = isSameSideWidgetContact(
      this.currentContact,
      nextContact
    );
    const closedTabIds = this._getClosedTabIds(tab.id, preserveTabs);
    const previousTabId = this.currentTabId;
    this._openTab(tab, nextContact, true, preserveTabs);
    this._notifyClosedTabs(closedTabIds);
    this._notifyTabActivation(previousTabId, tab.id);
    this._expandedView.open(this._expandedHandle);
  }

  selectTab(tabId: string): void {
    sideWidgetDebug('widget:selectTab', {
      tabId,
      known: this.tabs.some(({ id }) => id === tabId),
      currentTabId: this.currentTabId,
      tabs: this.tabs.map(({ id }) => id),
    });
    if (!this.tabs.some(({ id }) => id === tabId)) {
      return;
    }
    const previousTabId = this.currentTabId;
    this._selectTab(tabId);
    this._notifyTabActivation(previousTabId, tabId);
  }

  @action
  private _selectTab(tabId: string): void {
    this.currentTabId = tabId;
  }

  selectApp(appId: string): void {
    const app = this._thirdParty.apps.find(({ id }) => id === appId);
    if (!app) {
      return;
    }
    if (this._thirdParty.pinAppIds.includes(appId)) {
      this.openAppTab(app, this.currentContact);
      return;
    }
    this._selectApp(appId);
  }

  @action
  private _selectApp(appId: string): void {
    this.selectedAppId = appId;
  }

  showApps(): void {
    const previousTabId = this.currentTabId;
    this._showApps();
    this._notifyTabActivation(previousTabId, SIDE_WIDGET_APPS_TAB_ID);
  }

  @action
  private _showApps(): void {
    this.currentTabId = SIDE_WIDGET_APPS_TAB_ID;
    this.selectedAppId = null;
  }

  closeTab(tabId: string): void {
    const tabIndex = this.tabs.findIndex(({ id }) => id === tabId);
    if (tabIndex < 0) {
      return;
    }
    const contentHandle = this._contentHandles.get(tabId);
    const wasActive = this.currentTabId === tabId;
    if (this.tabs.length === 1) {
      this._removeTab(tabId, tabIndex);
      const closeResult = contentHandle?.options.onClose?.(null);
      if (isPromiseLike(closeResult)) {
        void this._completeLastTabClose(contentHandle, closeResult);
      } else {
        const collapseResult = this.close();
        void this._completeCollapsedTabClose(
          contentHandle,
          collapseResult,
        );
      }
      return;
    }
    this._removeTab(tabId, tabIndex);
    const nextTabId = this.currentTabId;
    const closeResult = contentHandle?.options.onClose?.(nextTabId);
    const activateNextTab = () =>
      wasActive
        ? this._contentHandles.get(nextTabId)?.options.onActivate?.()
        : undefined;
    if (isPromiseLike(closeResult)) {
      void Promise.resolve(closeResult)
        .then(activateNextTab)
        .catch((error: unknown) => {
          this.logger.error(
            '[SideWidget] failed to switch routed tab',
            error,
          );
        });
    } else {
      const activationResult = activateNextTab();
      if (isPromiseLike(activationResult)) {
        void Promise.resolve(activationResult).catch((error: unknown) => {
          this.logger.error(
            '[SideWidget] failed to activate routed tab',
            error,
          );
        });
      }
    }
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
    if (nextTabs.length === 0) {
      this.currentContact = null;
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

  private async _completeLastTabClose(
    contentHandle: SideWidgetContentHandle | undefined,
    closeResult: void | Promise<void>,
  ): Promise<void> {
    try {
      await closeResult;
    } catch (error: unknown) {
      this.logger.error('[SideWidget] failed to close routed tab', error);
    }
    await this._completeCollapsedTabClose(contentHandle, this.close());
  }

  private async _completeCollapsedTabClose(
    contentHandle: SideWidgetContentHandle | undefined,
    collapseResult: void | Promise<void>,
  ): Promise<void> {
    await collapseResult;
    try {
      await contentHandle?.options.onCloseComplete?.();
    } catch (error: unknown) {
      this.logger.error(
        '[SideWidget] failed to complete routed tab close',
        error,
      );
    }
  }

  close(): Promise<void> {
    return this._expandedView.close(this._expandedHandle);
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
      []
    );
    this._resetTabs();
    contentHandles.forEach(({ options }) => options.onClose?.(null));
  }

  @action
  private _resetTabs(): void {
    this.tabs = [createAppsTab()];
    this.currentTabId = SIDE_WIDGET_APPS_TAB_ID;
    this.selectedAppId = null;
    this.currentContact = null;
  }

  onCallRing(session: NormalizedSession): void {
    this._liveCallIds.add(session.id);
    this.openApps(getSideWidgetContact(session, 'from'));
  }

  onCallInit(session: NormalizedSession): void {
    this._liveCallIds.add(session.id);
    const contact = getSideWidgetContact(session, 'to');
    this.openApps(contact);
    this._thirdParty.pinAppIds.forEach((appId) => {
      const app = this._thirdParty.apps.find(({ id }) => id === appId);
      if (app) {
        this.openAppTab(app, contact);
      }
    });
  }

  onCallEnd(session: NormalizedSession): void {
    this._liveCallIds.delete(session.id);
    if (this._liveCallIds.size === 0) {
      this._appsOpenedForCall = false;
    }
    sideWidgetDebug('widget:onCallEnd', {
      sessionId: session.id,
      liveCallIds: Array.from(this._liveCallIds),
      appsOpenedForCall: this._appsOpenedForCall,
    });
  }

  private _notifyClosedTabs(tabIds: string[]): void {
    if (tabIds.length > 0) {
      sideWidgetDebug('widget:notifyClosedTabs', {
        tabIds,
        currentTabId: this.currentTabId,
      });
    }
    tabIds.forEach((tabId) => {
      this._contentHandles.get(tabId)?.options.onClose?.(this.currentTabId);
    });
  }

  private _notifyTabActivation(previousTabId: string, nextTabId: string): void {
    if (previousTabId === nextTabId) {
      return;
    }
    this._contentHandles.get(previousTabId)?.options.onDeactivate?.(nextTabId);
    this._contentHandles.get(nextTabId)?.options.onActivate?.();
  }

  private _getClosedTabIds(nextTabId: string, preserveTabs: boolean): string[] {
    if (preserveTabs) {
      return [];
    }
    return this.tabs
      .filter(
        ({ id, scope }) =>
          id !== nextTabId &&
          id !== SIDE_WIDGET_APPS_TAB_ID &&
          scope !== 'global'
      )
      .map(({ id }) => id);
  }

  private _renderContent(
    tabId: string,
    showCloseButton: boolean
  ): React.ReactNode {
    if (tabId !== this.currentTabId) {
      return null;
    }
    const ContentView = this._contentHandles.get(tabId)?.options.view;
    return ContentView ? (
      <AppProvider>
        <SideWidgetContentPage showCloseButton={showCloseButton}>
          <ContentView showCloseButton={showCloseButton} />
        </SideWidgetContentPage>
      </AppProvider>
    ) : null;
  }

  private _expandedHandle = this._expandedView.create({
    id: 'side-widget',
    onClose: () => this._handleExpandedClose(),
    showOverlayHeader: false,
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
      sideWidgetDebug('widget:renderPanel', {
        tabs: uiProps.tabs.map(({ id }) => id),
        currentTabId: uiProps.currentTabId,
        selectedAppId: uiProps.selectedAppId,
        currentContact: describeContact(uiProps.currentContact),
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
