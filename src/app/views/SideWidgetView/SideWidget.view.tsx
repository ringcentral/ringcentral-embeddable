import type { NormalizedSession } from '@ringcentral-integration/commons/interfaces/Webphone.interface';
import { AppProvider } from '@ringcentral-integration/micro-core/src/app/components';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { Theme } from '@ringcentral-integration/micro-core/src/app/services';
import {
  SyncTabId,
  SyncTabView,
} from '@ringcentral-integration/micro-core/src/app/views/SyncTabView';
import {
  action,
  delegate,
  injectable,
  optional,
  RcViewModule,
  Root,
  state,
  useConnector,
  watch,
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
  getSideWidgetBlankInfo,
  type SideWidgetBlankInfo,
} from './getSideWidgetBlankInfo';
import {
  getSideWidgetAppTabId,
  getSideWidgetContact,
  isSameSideWidgetContact,
  SIDE_WIDGET_APP_TAB_PREFIX,
  SIDE_WIDGET_APPS_TAB_ID,
} from './SideWidget.helper';
import {
  SideWidgetContentHandle,
  type SideWidgetCloseTabOptions,
  type SideWidgetContentOptions,
  type SideWidgetOpenAppsOptions,
  type SideWidgetOpenContentOptions,
  type SideWidgetOptions,
  type SideWidgetTab,
} from './SideWidget.view.interface';
import { SideWidgetContentPage } from './SideWidgetContentPage';
import { SideWidgetPanel } from './SideWidgetPanel';
import {
  createAppsTab,
  getClosedSideWidgetTabIds,
  getSideWidgetMinExpandedWidth,
  isPromiseLike,
  openSideWidgetTab,
  removeSideWidgetTab,
  type SideWidgetTabsState,
} from './SideWidgetTabs.helper';
import { SideWidgetTabsShownContext } from './SideWidgetTabsShownContext';
import i18n, { t } from './i18n';

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
    private _root?: Root,
    @optional()
    private _syncTabView?: SyncTabView,
  ) {
    super();
  }

  @state
  tabs: SideWidgetTab[] = [];

  @state
  currentTabId = SIDE_WIDGET_APPS_TAB_ID;

  @state
  selectedAppId: string | null = null;

  @state
  currentContact: ThirdPartyWidgetContact | null = null;

  private readonly _contentHandles = new Map<string, SideWidgetContentHandle>();

  private _resolveMainPath: (() => string | null) | null = null;

  /** The page closes of the tabs the last drawer close removed. */
  private _pendingTabsClose: Promise<unknown> = Promise.resolve();

  /**
   * The `enableSideWidget` param, as in the legacy side drawer: it shows the
   * Phone tab's drawer toggle and lets calls open third-party app tabs.
   * Content tabs, such as HUD or a call's details, open either way.
   */
  get enabled(): boolean {
    return this._sideWidgetOptions?.enableSideWidget ?? false;
  }

  get isOpen(): boolean {
    return this._expandedView.activeContentId === 'side-widget';
  }

  /**
   * The widest `minExpandedWidth` among the open tabs, active or not, so the
   * frame does not resize on every tab switch.
   */
  get minExpandedWidth(): number | null {
    return this.isOpen ? getSideWidgetMinExpandedWidth(this.tabs) : null;
  }

  private get _tabsState(): SideWidgetTabsState {
    return {
      tabs: this.tabs,
      currentTabId: this.currentTabId,
      selectedAppId: this.selectedAppId,
    };
  }

  /** Applies a tab-list change; only called from inside an action. */
  private _assignTabsState({
    tabs,
    currentTabId,
    selectedAppId,
  }: SideWidgetTabsState): void {
    this.tabs = tabs;
    this.currentTabId = currentTabId;
    this.selectedAppId = selectedAppId;
  }

  /**
   * Provides the route shown in the main column, so the blank drawer can
   * describe what selecting an item on the left will open.
   */
  setMainPathResolver(resolver: () => string | null): void {
    this._resolveMainPath = resolver;
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
    const { id, name, minExpandedWidth } = handle.options;
    if (this._contentHandles.get(id) !== handle) {
      throw new Error(`Side widget content handle is not registered: ${id}`);
    }
    const tab: SideWidgetTab = {
      id,
      name,
      scope: handle.options.scope === 'global' ? 'global' : undefined,
      ...(minExpandedWidth ? { minExpandedWidth } : {}),
    };
    const nextContact = contact === undefined ? this.currentContact : contact;
    const preserveTabs =
      contact === undefined ||
      isSameSideWidgetContact(this.currentContact, nextContact);
    const closedTabIds = getClosedSideWidgetTabIds(
      this.tabs,
      tab.id,
      preserveTabs,
    );
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

  closeContent(
    handle: SideWidgetContentHandle,
    options?: SideWidgetCloseTabOptions
  ): void {
    if (this._contentHandles.get(handle.options.id) !== handle) {
      return;
    }
    void this.closeTab(handle.options.id, options);
  }

  @action
  private _openTab(
    tab: SideWidgetTab,
    contact: ThirdPartyWidgetContact | null,
    activate: boolean,
    preserveTabs: boolean,
    showAppsTab = false
  ): void {
    this._assignTabsState(
      openSideWidgetTab(this._tabsState, {
        tab,
        activate,
        preserveTabs,
        enabled: this.enabled,
        showAppsTab:
          showAppsTab && this.enabled && this._thirdParty.apps.length > 0,
      }),
    );
    this.currentContact = contact;
  }

  openApps(
    contact: ThirdPartyWidgetContact,
    { activate = true }: SideWidgetOpenAppsOptions = {},
  ): void {
    if (!this.enabled || this._thirdParty.apps.length === 0) {
      return;
    }
    const tab = createAppsTab();
    const preserveTabs = isSameSideWidgetContact(this.currentContact, contact);
    const closedTabIds = getClosedSideWidgetTabIds(
      this.tabs,
      tab.id,
      preserveTabs,
    );
    const previousTabId = this.currentTabId;
    this._openTab(tab, contact, activate, preserveTabs);
    this._notifyClosedTabs(closedTabIds);
    this._notifyTabActivation(previousTabId, this.currentTabId);
    this._expandedView.open(this._expandedHandle);
  }

  openAppTab(
    app: ThirdPartyApp,
    contact: ThirdPartyWidgetContact | null,
    { activate = true }: SideWidgetOpenAppsOptions = {},
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
    const closedTabIds = getClosedSideWidgetTabIds(
      this.tabs,
      tab.id,
      preserveTabs,
    );
    const previousTabId = this.currentTabId;
    this._openTab(tab, nextContact, activate, preserveTabs);
    this._notifyClosedTabs(closedTabIds);
    this._notifyTabActivation(previousTabId, this.currentTabId);
    this._expandedView.open(this._expandedHandle);
  }

  /**
   * Selects a tab. Resolves once the selected page has finished activating,
   * such as a routed page navigating to its path.
   */
  selectTab(tabId: string): Promise<void> {
    if (!this.tabs.some(({ id }) => id === tabId)) {
      return Promise.resolve();
    }
    const previousTabId = this.currentTabId;
    this._selectTab(tabId);
    return Promise.resolve(this._notifyTabActivation(previousTabId, tabId));
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

  /**
   * Closes a tab. Resolves once the closed page, and the page activated in its
   * place, have finished their navigation.
   */
  closeTab(
    tabId: string,
    {
      collapseWhenLast = !this._root?.expanded,
    }: SideWidgetCloseTabOptions = {}
  ): Promise<void> {
    if (!this.tabs.some(({ id }) => id === tabId)) {
      return Promise.resolve();
    }
    const contentHandle = this._contentHandles.get(tabId);
    const wasActive = this.currentTabId === tabId;
    if (this.tabs.length === 1) {
      this._removeTab(tabId);
      const closeResult = contentHandle?.options.onClose?.(null);
      if (!collapseWhenLast) {
        // The docked drawer stays open and shows its blank view; the Apps tab
        // does not take the closed tab's place, since it only opens with a
        // new call.
        return this._awaitTabClose(contentHandle, closeResult);
      }
      if (isPromiseLike(closeResult)) {
        return this._completeLastTabClose(contentHandle, closeResult);
      }
      const collapseResult = this.close();
      return this._completeCollapsedTabClose(contentHandle, collapseResult);
    }
    this._removeTab(tabId);
    const nextTabId = this.currentTabId;
    const closeResult = contentHandle?.options.onClose?.(nextTabId);
    const activateNextTab = () =>
      wasActive
        ? this._contentHandles.get(nextTabId)?.options.onActivate?.()
        : undefined;
    if (isPromiseLike(closeResult)) {
      return Promise.resolve(closeResult)
        .then(activateNextTab)
        .catch((error: unknown) => {
          this.logger.error(
            '[SideWidget] failed to switch routed tab',
            error,
          );
        });
    }
    const activationResult = activateNextTab();
    if (isPromiseLike(activationResult)) {
      return Promise.resolve(activationResult).catch((error: unknown) => {
        this.logger.error(
          '[SideWidget] failed to activate routed tab',
          error,
        );
      });
    }
    return Promise.resolve();
  }

  @action
  private _removeTab(tabId: string): void {
    this._assignTabsState(removeSideWidgetTab(this._tabsState, tabId));
    if (this.tabs.length === 0) {
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

  /**
   * Resolves a routed tab close when the drawer stays open, so the page can
   * finish its own cleanup without being collapsed away.
   */
  private async _awaitTabClose(
    contentHandle: SideWidgetContentHandle | undefined,
    closeResult: void | Promise<void>,
  ): Promise<void> {
    try {
      await closeResult;
    } catch (error: unknown) {
      this.logger.error('[SideWidget] failed to close routed tab', error);
    }
    try {
      await contentHandle?.options.onCloseComplete?.();
    } catch (error: unknown) {
      this.logger.error(
        '[SideWidget] failed to complete routed tab close',
        error,
      );
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

  /**
   * Applies a panel action on the server port, which owns the tabs; clients
   * follow the synced state. Applied only on a client, the server's next tab
   * update would hand the old tabs back, and applied on both ports, the tabs'
   * close and activate hooks, and the router navigation they do, ran twice.
   */
  private async _runPanelAction(action: () => Promise<void>): Promise<void> {
    try {
      await action();
    } catch (error: unknown) {
      this.logger.error('[SideWidget] failed to apply panel action', error);
    }
  }

  private _closeFromPanel(): Promise<void> {
    return this._runPanelAction(() => this._closeOnServer());
  }

  /**
   * Closes a tab the user dismissed from its page, such as a routed page's
   * back button, the same way as the tab's close button.
   */
  closeTabFromPanel(tabId: string): Promise<void> {
    return this._runPanelAction(() => this._closeTabOnServer(tabId));
  }

  private _selectTabFromPanel(tabId: string): Promise<void> {
    return this._runPanelAction(() => this._selectTabOnServer(tabId));
  }

  private _selectAppFromPanel(appId: string): Promise<void> {
    return this._runPanelAction(() => this._selectAppOnServer(appId));
  }

  private _showAppsFromPanel(): Promise<void> {
    return this._runPanelAction(() => this._showAppsOnServer());
  }

  private _toggleAppPinFromPanel(appId: string): Promise<void> {
    return this._runPanelAction(() => this._toggleAppPinOnServer(appId));
  }

  @delegate('server')
  private async _closeOnServer(): Promise<void> {
    await this.close();
    await this._pendingTabsClose;
  }

  @delegate('server')
  private async _closeTabOnServer(tabId: string): Promise<void> {
    await this.closeTab(tabId);
  }

  @delegate('server')
  private async _selectTabOnServer(tabId: string): Promise<void> {
    await this.selectTab(tabId);
  }

  @delegate('server')
  private async _selectAppOnServer(appId: string): Promise<void> {
    this.selectApp(appId);
  }

  @delegate('server')
  private async _showAppsOnServer(): Promise<void> {
    this.showApps();
  }

  @delegate('server')
  private async _toggleAppPinOnServer(appId: string): Promise<void> {
    this.toggleAppPin(appId);
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
    this._pendingTabsClose = Promise.all(
      contentHandles.map(({ options }) => options.onClose?.(null)),
    );
  }

  @action
  private _resetTabs(): void {
    this.tabs = [];
    this.currentTabId = SIDE_WIDGET_APPS_TAB_ID;
    this.selectedAppId = null;
    this.currentContact = null;
  }

  onCallRing(session: NormalizedSession): void {
    this.openCallApps(getSideWidgetContact(session, 'from'));
  }

  onCallInit(session: NormalizedSession): void {
    this.openCallApps(getSideWidgetContact(session, 'to'), true);
  }

  /**
   * Shows the available apps for a new call. Outgoing calls also open every
   * pinned app in its own tab.
   *
   * The apps open behind an open `keepActiveOnCallApps` tab, such as the
   * RingCX Agent script, which the call itself has just opened.
   */
  openCallApps(
    contact: ThirdPartyWidgetContact,
    openPinnedApps = false,
  ): void {
    const activate = !this.tabs.some(
      ({ id }) => this._contentHandles.get(id)?.options.keepActiveOnCallApps,
    );
    this.openApps(contact, { activate });
    if (!openPinnedApps) {
      return;
    }
    this._thirdParty.pinAppIds.forEach((appId) => {
      const app = this._thirdParty.apps.find(({ id }) => id === appId);
      if (app) {
        this.openAppTab(app, contact, { activate });
      }
    });
  }

  private _notifyClosedTabs(tabIds: string[]): void {
    tabIds.forEach((tabId) => {
      this._contentHandles.get(tabId)?.options.onClose?.(this.currentTabId);
    });
  }

  private _notifyTabActivation(
    previousTabId: string,
    nextTabId: string,
  ): void | Promise<void> {
    if (previousTabId === nextTabId) {
      return;
    }
    this._contentHandles.get(previousTabId)?.options.onDeactivate?.(nextTabId);
    return this._contentHandles.get(nextTabId)?.options.onActivate?.();
  }

  private _renderContent(
    tabId: string,
    showCloseButton: boolean
  ): React.ReactNode {
    const options = this._contentHandles.get(tabId)?.options;
    if (tabId !== this.currentTabId && !options?.keepMounted) {
      return null;
    }
    const ContentView = options?.view;
    return ContentView ? (
      <AppProvider>
        <SideWidgetContentPage
          showCloseButton={showCloseButton}
          onBack={options.onBack}
        >
          <SideWidgetTabsShownContext.Provider value={!showCloseButton}>
            <ContentView showCloseButton={showCloseButton} />
          </SideWidgetTabsShownContext.Provider>
        </SideWidgetContentPage>
      </AppProvider>
    ) : null;
  }

  /** The tab's name in the current locale. */
  private _getTabName(tab: SideWidgetTab): string {
    if (tab.id === SIDE_WIDGET_APPS_TAB_ID) {
      return t('apps');
    }
    return this._contentHandles.get(tab.id)?.options.getName?.() || tab.name;
  }

  private _getBlankInfo(): SideWidgetBlankInfo {
    return getSideWidgetBlankInfo(
      this._resolveMainPath?.() ?? null,
      this._syncTabView?.getActive(SyncTabId.DIALPAD) ?? null,
    );
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
        ...this._getBlankInfo(),
      }));
      // Subscribes to the locale, so a locale change renames open tabs.
      useLocale(i18n);
      const tabs = uiProps.tabs.map((tab) => ({
        ...tab,
        name: this._getTabName(tab),
      }));
      const { current: uiFunctions } = useRef({
        // Panel actions also reach the server port, which keeps the tabs.
        onTabChange: (tabId: string) => this._selectTabFromPanel(tabId),
        onSelectApp: (appId: string) => this._selectAppFromPanel(appId),
        onBack: () => this._showAppsFromPanel(),
        onClose: () => this._closeFromPanel(),
        onCloseTab: (tabId: string) => this.closeTabFromPanel(tabId),
        onTogglePin: (appId: string) => this._toggleAppPinFromPanel(appId),
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
          tabs={tabs}
          currentTabId={uiProps.currentTabId}
          selectedAppId={uiProps.selectedAppId}
          contact={uiProps.currentContact}
          pinAppIds={uiProps.pinAppIds}
          blankInfo={{
            titleKey: uiProps.titleKey,
            descriptionKey: uiProps.descriptionKey,
          }}
          {...uiFunctions}
        />
      );
    },
  });

  private _stopWatchingLayout: (() => void) | null = null;

  private _stopWatchingExpand: (() => void) | null = null;

  override onInit(): void {
    this._stopWatchingExpand = watch(
      this,
      () => Boolean(this._root?.expanded),
      (expanded) => {
        if (!expanded || this._expandedView.activeContentId !== null) {
          return;
        }
        // Expanding with nothing to show (the expand button or the host) opens
        // the blank drawer, so the new column explains itself and can be
        // closed instead of staying an empty area.
        this._expandedView.open(this._expandedHandle, { expand: false });
      },
    );
    this._stopWatchingLayout = watch(
      this,
      () => [Boolean(this._root?.expanded), this.tabs.length] as const,
      ([expanded, tabCount]) => {
        if (!this._root || expanded || tabCount > 0) {
          return;
        }
        // Folded, the drawer renders as an overlay over the main column. With
        // no tabs that overlay is an opaque blank page that hides the app, so
        // an empty drawer closes instead of staying open.
        void this.close();
      },
      { multiple: true }
    );
  }

  override onReset(): void {
    this._stopWatchingLayout?.();
    this._stopWatchingLayout = null;
    this._stopWatchingExpand?.();
    this._stopWatchingExpand = null;
    // Tabs belong to the signed-in session, such as a global HUD tab, so the
    // next one starts without them.
    void this.close();
    this._resetTabs();
  }

  component() {
    return null;
  }
}
