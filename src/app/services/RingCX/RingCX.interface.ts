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
  /** Authenticated with several agent accounts and none picked yet. */
  readonly isAgentSelectionPending: boolean;
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
 * The signed-in RingEX extension, as the RingCX chunk needs it to build an
 * `<mainNumber>*<extension>@RC_EXT` destination.
 */
export interface CxHostExtension {
  readonly extensionId: string;
  readonly extensionNumber: string;
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
  /**
   * The signed-in RingEX extension, or `null` before extension and account
   * info are ready.
   */
  readonly currentExtension: CxHostExtension | null;
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
  /** Whether the user may drop pre-recorded voicemail messages. */
  readonly hasVoicemailDropPermission: boolean;
  /** Open the host voicemail-drop picker for a CX call. */
  openVoicemailDropForCxCall(cxCallId: string): Promise<void>;
  /** Close the picker if it is open for this CX call. */
  closeVoicemailDropForCxCall(cxCallId: string): Promise<void>;
  /**
   * Run picks made for CX calls through `handler`. Per port: call it on every
   * port the chunk loads on.
   */
  setVoicemailDropHandler(
    handler: (
      cxCallId: string,
      messageId: string,
    ) => Promise<CxVoicemailDropResult>,
  ): void;
  /**
   * Whether `disableBusyState` can succeed: the account has no busy state, or
   * the user may edit their own call handling.
   */
  readonly canDisableBusyState: boolean;
  /**
   * Turn off the RingEX busy state RingCX sets during a CX call, so RingEX
   * rings the transferred call instead of sending it to voicemail.
   */
  disableBusyState(): Promise<CxBusyStateResult>;
  /**
   * Make the RingEX webphone keep the next matching transferred call for a
   * silent voicemail drop. Resolves to the hint id.
   */
  registerVoicemailDropHint(hint: {
    customerNumber: string;
    extensionNumber: string;
    messageId: string;
  }): Promise<string>;
  /** Drop a hint whose transfer failed. */
  clearVoicemailDropHint(hintId: string): Promise<void>;
}

/**
 * Outcome of turning off the RingEX busy state:
 * - `disabled`: the busy state is off.
 * - `notApplicable`: the account has no busy state to turn off, because it is
 *   not on new call handling.
 * - `failed`: the request failed, so RingEX may still send calls to voicemail.
 */
export type CxBusyStateResult = 'disabled' | 'notApplicable' | 'failed';

/**
 * Outcome of a RingCX voicemail drop request:
 * - `transferred`: the call went to the agent's RingEX extension.
 * - `busyStateFailed`: the busy state could not be turned off; the call was
 *   not transferred.
 * - `failed`: the drop could not start; the call was not transferred.
 */
export type CxVoicemailDropResult =
  | 'transferred'
  | 'busyStateFailed'
  | 'failed';

export interface CxRuntimeOptions {
  /**
   * Client id of the Agent Assistant app. Its interop code is minted for this
   * id, not for the host app's own client id.
   */
  readonly agentAssistantClientId: string;
  readonly agentAssistantPageUrl: string;
  readonly agentScriptPageUrl: string;
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
