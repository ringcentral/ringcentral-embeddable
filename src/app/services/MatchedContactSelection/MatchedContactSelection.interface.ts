/**
 * A record a match selection can be attached to.
 *
 * `call` entries are keyed by `sessionId` so they line up with
 * `CallLogTasks.callSelectionMap`, which the framework reads through
 * `CallViewState.getExtraLogData`.
 *
 * `conversation` entries are keyed by `conversationId` — the id
 * `ContactRendererOptions.getDisplayedSelectedEntity` is handed. CRM apps key
 * their own log state by `conversationLogId`, but that rolls over daily; which
 * contact a thread belongs to should not.
 *
 * `cxCall` entries are RingCX calls, keyed by the interaction id (`uii`, see
 * `ringCXLogId`). It is shared by the live call, every leg of it and its
 * history rows, whose own ids differ.
 */
export type MatchedContactSelectionScope = 'call' | 'conversation' | 'cxCall';

/** The scopes a pending outbound pick can be claimed in. */
export type OutboundCallSelectionScope = Extract<
  MatchedContactSelectionScope,
  'call' | 'cxCall'
>;

export interface MatchedContactSelectionEntry {
  scope: MatchedContactSelectionScope;
  /**
   * `sessionId` for calls, `conversationId` for conversations, `uii` for
   * RingCX calls.
   */
  key: string;
  /**
   * The entity the user picked. Only the id is persisted — it is resolved
   * against the live match list on read, so a contact that stopped matching
   * falls back to the framework's guess instead of showing stale data.
   */
  entityId: string;
}

export interface SelectMatchedContactOptions extends MatchedContactSelectionEntry {}

export interface ClearMatchedContactOptions {
  scope: MatchedContactSelectionScope;
  key: string;
}

export interface PendingOutboundSelection {
  entityId: string;
  /** The number that was dialled, as the record displayed it. */
  phoneNumber: string;
  /**
   * Which product the call is placed in, so a RingEX call can never claim a
   * pick made for a RingCX dial, or the reverse.
   *
   * @default 'call'
   */
  scope?: OutboundCallSelectionScope;
}

export interface MatchedContactSelectionInfo<T> {
  displayedSelection: T;
  selections: T[];
}
