import {
  computed,
  injectable,
  optional,
  RcModule,
  PortManager,
  delegate,
} from '@ringcentral-integration/next-core';

import { CxClient } from '../CxClient';
import { CxAgentSession } from '../CxAgentSession';
import { CxPresence } from '../CxPresence';
import type { CxSettingsOptions, OffhookState } from './CxSettings.interface';

/**
 * CxSettings module - Application settings management
 * Facade over CxPresence for offhook state and CxAgentSession for login type.
 * All offhook state is managed reactively by CxPresence (@state + @action).
 */
@injectable({
  name: 'CxSettings',
})
class CxSettings extends RcModule {
  private readonly _agentOffhookEndListeners = new Set<() => void>();

  constructor(
    private cxClient: CxClient,
    private cxAgentSession: CxAgentSession,
    private cxPresence: CxPresence,
    private portManager: PortManager,
    @optional('CxSettingsOptions') private evSettingsOptions?: CxSettingsOptions,
  ) {
    super();
    if (this.portManager?.shared) {
      this.portManager.onServer(() => {
        this.initialize();
      });
    } else {
      this.initialize();
    }
  }

  initialize() {
    this.cxAgentSession.onTriggerConfig(() => {
      this.cxPresence.setOffhookTerm();
    });
  }

  /**
   * Notifies when the agent disconnects the offhook line with the offhook
   * button, as opposed to the server ending it.
   */
  onAgentOffhookEnd(listener: () => void): () => void {
    this._agentOffhookEndListeners.add(listener);
    return () => {
      this._agentOffhookEndListeners.delete(listener);
    };
  }

  get loginType() {
    return this.cxAgentSession.loginType;
  }

  get isOffhook(): boolean {
    return this.cxPresence.isOffhook;
  }

  get isOffhooking(): boolean {
    return this.cxPresence.isOffhooking;
  }

  get isManualOffhook(): boolean {
    return this.cxPresence.isManualOffhook;
  }

  @computed((that: CxSettings) => [
    that.cxPresence.isOffhooking,
    that.cxPresence.isOffhook,
  ])
  get offhookState(): OffhookState {
    if (this.isOffhooking) {
      return this.isOffhook ? 'disconnecting' : 'connecting';
    }
    return this.isOffhook ? 'connected' : 'disconnected';
  }

  /**
   * Toggle offhook state - delegates state management to CxPresence
   * and sends offhook commands via CxClient
   */
  @delegate('server')
  async offHook(): Promise<void> {
    await this.cxPresence.setOffhooking(true);
    if (this.isOffhook) {
      this._agentOffhookEndListeners.forEach((listener) => listener());
      await this.cxPresence.setIsManualOffhook(false);
      await this.cxClient.offhookTerm();
    } else {
      await this.cxPresence.setIsManualOffhook(true);
      await this.cxClient.offhookInit();
    }
  }
}

export { CxSettings };
