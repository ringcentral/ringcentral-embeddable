import type { ModuleOptions } from 'reactant';
import type { ComponentType } from 'react';

export type CxLoginStatus =
  | 'noAuth'
  | 'authing'
  | 'authSuccess'
  | 'reauthing'
  | 'unauthing'
  | 'authFailure';

export interface StartAgentSessionOptions {
  readonly requestedByUser?: boolean;
}

export interface CxAuthModule {
  readonly agentId?: string;
  readonly isOnlyOneAgent: boolean;
  readonly loginStatus: CxLoginStatus;
  logout(): Promise<void>;
  logoutForUserSignOut(): Promise<void>;
  startAgentLogin(options?: StartAgentSessionOptions): Promise<void>;
}

export interface CxAgentSessionModule {
  /** A stored configuration exists, so a session can be restored. */
  readonly configured: boolean;
  /** The agent is configured with the RingCX server in this run. */
  readonly configSuccess: boolean;
}

export interface CxViewModule {
  readonly component: ComponentType<Record<string, never>>;
}

export interface RingCXOptions {
  readonly enableAgentScript?: boolean;
  readonly evServer?: string;
  readonly hideCallNote?: boolean;
}

/**
 * Directory member a CX outbound is targeting. RingEX telephony sessions
 * expose this as `to.extensionId`; presence active calls expose `toName`.
 */
export interface CxExBridgeDirectory {
  readonly extensionId: string;
  readonly name: string;
  readonly mainNumber: string;
}

/**
 * The host modules the RingCX chunk needs, wrapped in a plain object.
 * A host module cannot be bound under a second DI token, because the store
 * registers one module state per token, so the chunk gets this instead.
 */
export interface CxHostIntegration {
  /** Whether the host RingEX call module has no call in progress. */
  readonly isCallIdle: boolean;
  /** Open the host widget if it is closed or minimized. */
  showClientWindow(): void;
  /**
   * Remember the directory member a CX outbound is targeting so RingEX can
   * hide the ghost session that may arrive before IQ NEW-CALL.
   */
  registerExBridgeDestination(
    destination: string,
    directory: CxExBridgeDirectory,
  ): void;
  /** Drop a previously registered CX directory destination. */
  clearExBridgeDestination(destination: string): void;
  /**
   * Close leftover RingEX post-call UI (Available Apps, post-call view)
   * so a CX call does not inherit it.
   */
  dismissExCallUiForCxCall(): void;
}

export interface CxRuntimeOptions {
  readonly agentAssistantPageUrl: string;
  readonly authHost: string;
  readonly clientAppType: string;
  readonly clientAppVersion: string;
  readonly currentLocale: string;
  readonly enableAgentScript: boolean;
  readonly hideCallNote: boolean;
}

export interface CxChunk {
  getRingCXModules(options: CxRuntimeOptions): ModuleOptions[];
}
