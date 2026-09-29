export interface CxAgentAssistantOptions {
  disabled?: boolean;
  /**
   * RingCentral client id of the Agent Assistant app. The RC interop code is
   * minted for this client id, so it has to match the client id the assistant
   * authenticates with.
   */
  clientId?: string;
  /**
   * Separately hosted page of the Agent Assistant bundle
   * (`AGENT_ASSISTANT_PAGE_URL`). The widget stays hidden when it is empty.
   */
  pageUrl?: string;
}

/**
 * Everything the Agent Assistant frame needs for one call.
 *
 * `query` is passed to the hosting page verbatim - the assistant reads its whole
 * configuration from `window.location.search`, so the key names are its API and
 * must not be renamed. `dialogId` and `kbContextIds` are repeated outside of it
 * because the auto-suggestion handshake sends them over `postMessage`.
 */
export interface CxAgentAssistantFrameParams {
  pageUrl: string;
  dialogId: string;
  kbContextIds: string[];
  query: Record<string, string>;
}
