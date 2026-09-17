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
