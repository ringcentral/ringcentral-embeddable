import { EventEmitter } from 'events';

import {
  action,
  delegate,
  injectable,
  optional,
  PortManager,
  RcModule,
  state,
  watch,
} from '@ringcentral-integration/next-core';

import type {
  TabManagerEvent,
  TabManagerOptions,
} from './TabManager.interface';

/**
 * Coordinates compatibility tab state and popup main-client handoff.
 */
@injectable({
  name: 'TabManager',
})
export class TabManager extends RcModule {
  private readonly _eventEmitter = new EventEmitter();
  private _clientInitialized = false;

  constructor(
    protected _portManager: PortManager,
    @optional('TabManagerOptions')
    protected _tabManagerOptions?: TabManagerOptions
  ) {
    super();
    if (this._portManager.shared) {
      this._portManager.onClient(() => this._initializeClient());
      return;
    }
    this._initializeClient();
  }

  @state
  popupTabId = '';

  @state
  popupIsBecomingMain = false;

  @state
  event: TabManagerEvent | null = null;

  get id(): string {
    return this._portManager.clientId ?? this._portManager.mainClientId ?? '';
  }

  get active(): boolean {
    if (this._portManager.isServer || !this._portManager.shared) {
      return true;
    }
    return this.autoMainTab
      ? this._portManager.isActiveTab
      : this._portManager.isMainTab;
  }

  get interactingTabId(): string | null {
    return this._portManager.activeTabId;
  }

  get interacting(): boolean {
    return this._portManager.isServer || this._portManager.isActiveTab;
  }

  get autoMainTab(): boolean {
    return this._tabManagerOptions?.autoMainTab !== false;
  }

  get fromPopup(): boolean {
    return this._tabManagerOptions?.fromPopup ?? false;
  }

  get isPopupWindowOpened(): boolean {
    return this.popupTabId !== '';
  }

  get isFirstTab(): boolean {
    if (this.fromPopup || this._portManager.isServer) {
      return true;
    }
    if (this.isPopupWindowOpened) {
      return false;
    }
    return !this._portManager.shared || this._portManager.isMainTab;
  }

  get actualTabIds(): string[] {
    return Array.from(
      new Set(
        [
          this.id,
          this._portManager.mainClientId,
          this._portManager.activeTabId,
          this._portManager.activeNonMainTabId,
        ].filter((tabId): tabId is string => Boolean(tabId))
      )
    );
  }

  get tabs(): string[] {
    return this.actualTabIds;
  }

  get hasMultipleTabs(): boolean {
    return this.actualTabIds.length > 1;
  }

  get enable(): boolean {
    return true;
  }

  private get _canBecomeMainClient(): boolean {
    return (
      this.fromPopup ||
      this.autoMainTab ||
      this._tabManagerOptions?.isMainTab === true
    );
  }

  private _initializeClient(): () => void {
    if (this._clientInitialized || !globalThis.window) {
      return () => {};
    }
    this._clientInitialized = true;
    if (this.fromPopup) {
      return this._initializePopup();
    }
    return this._initializeNonPopup();
  }

  private _initializePopup(): () => void {
    const removeMainTabListener = this._portManager.onMainTab(() => {
      void this.setPopupIsBecomingMain(false);
    });
    const handlePageHide = (): void => {
      if (this.popupTabId === this.id) {
        void this.setPopupTabId('');
      }
    };
    window.addEventListener('pagehide', handlePageHide);
    void this._preparePopupMainClient();
    return () => {
      removeMainTabListener();
      window.removeEventListener('pagehide', handlePageHide);
    };
  }

  private async _preparePopupMainClient(): Promise<void> {
    this._portManager.initMainClient$.next(true);
    if (!this._portManager.isMainTab) {
      await this.setPopupIsBecomingMain(true);
    }
    await this.setPopupTabId(this.id);
  }

  private _initializeNonPopup(): () => void {
    if (!this.popupIsBecomingMain && !this.isPopupWindowOpened) {
      this._requestMainClient();
    }
    const unwatchPopupHandoff = watch(
      this,
      () => this.popupIsBecomingMain,
      (isBecoming) => {
        if (isBecoming) {
          globalThis.location.reload();
          return;
        }
        this._requestMainClient();
      }
    );
    return () => unwatchPopupHandoff?.();
  }

  private _requestMainClient(): void {
    if (this._canBecomeMainClient) {
      this._portManager.initMainClient$.next(true);
    }
  }

  @action
  private _setPopupTabId(tabId: string): void {
    this.popupTabId = tabId;
  }

  @action
  private _setPopupIsBecomingMain(value: boolean): void {
    this.popupIsBecomingMain = value;
  }

  @action
  private _setEvent(event: TabManagerEvent): void {
    this.event = event;
  }

  @delegate('server')
  async setPopupTabId(tabId: string): Promise<void> {
    this._setPopupTabId(tabId);
  }

  @delegate('server')
  async setPopupIsBecomingMain(value: boolean): Promise<void> {
    this._setPopupIsBecomingMain(value);
  }

  /**
   * Publishes a serializable event to the shared state and other clients.
   */
  async send(eventName: string, ...args: unknown[]): Promise<void> {
    await this._publishEvent(this.id, {
      name: eventName,
      args,
    });
  }

  @delegate('server')
  private async _publishEvent(
    senderId: string,
    event: TabManagerEvent
  ): Promise<void> {
    this._setEvent(event);
    await this._emitEventInClients(senderId, event);
  }

  @delegate('clients')
  private async _emitEventInClients(
    senderId: string,
    event: TabManagerEvent
  ): Promise<void> {
    if (senderId === this.id) {
      return;
    }
    this._eventEmitter.emit(event.name, ...event.args);
    this._eventEmitter.emit('tabEvent', event);
  }

  /**
   * Subscribes to a named event received from another browser client.
   */
  on<TArgs extends unknown[]>(
    eventName: string,
    listener: (...args: TArgs) => void
  ): () => void {
    this._eventEmitter.on(eventName, listener);
    return () => this._eventEmitter.off(eventName, listener);
  }

  /**
   * Subscribes to all events received from other browser clients.
   */
  onTabEvent(listener: (event: TabManagerEvent) => void): () => void {
    this._eventEmitter.on('tabEvent', listener);
    return () => this._eventEmitter.off('tabEvent', listener);
  }

  async checkIsMain(): Promise<boolean> {
    return this.active;
  }

  @delegate('server')
  async checkTabAliveById(tabId: string): Promise<boolean> {
    return this.actualTabIds.includes(tabId);
  }
}
