import type { CxAgentData, CxTokenType } from '../CxClient/interfaces';

/**
 * State interface for CxAuth
 */
export interface CxAuthState {
  agent: CxAgentData | null;
}

/**
 * Parameters for authenticateWithToken
 */
export interface AuthenticateWithTokenParams {
  rcAccessToken?: string;
  tokenType?: CxTokenType;
  shouldEmitAuthSuccess?: boolean;
}

/**
 * Parameters for openSocketWithSelectedAgentId
 */
export interface OpenSocketParams {
  syncOtherTabs?: boolean;
  retryOpenSocket?: boolean;
}

/**
 * Parameters for startAgentLogin
 */
export interface StartAgentLoginOptions {
  /**
   * The user asked for this session, so the setup flow may route the app to
   * its pages. Leave it off for a session restored in the background.
   */
  requestedByUser?: boolean;
}

/**
 * Parameters for loginAgent
 */
export interface LoginAgentParams {
  /**
   * Resume the session the server already holds for this agent, instead of
   * starting a new one, so an in-flight call or pending disposition is handed
   * back rather than orphaned. Only effective on an SDK instance that has
   * already completed a login in this page.
   */
  tryRejoin?: boolean;
  /**
   * On a failed socket open, re-authenticate and retry the open once instead
   * of logging the agent out immediately.
   */
  retryOpenSocket?: boolean;
}
