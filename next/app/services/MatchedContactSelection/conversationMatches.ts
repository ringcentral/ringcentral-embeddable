export interface ConversationMatchOption {
  id?: string;
  name?: string;
  type?: string;
}

export interface ConversationWithMatches {
  conversationId?: string;
  correspondents?: unknown[];
  /** Per-correspondent matches, populated for list items. */
  correspondentMatchesList?: ConversationMatchOption[][];
  /** Flattened matches; the only one `currentConversation` populates. */
  correspondentMatches?: ConversationMatchOption[];
}

/**
 * The matches a conversation offers for selection.
 *
 * Shared by the picker and by `getDisplayedSelectedEntity` so the list the user
 * chooses from is always the list the pick is resolved against. They must not
 * drift: the framework hands `getDisplayedSelectedEntity` its
 * `conversationMatches` instead, which comes from `ConversationLogger` (CRM log
 * records) rather than `ContactMatcher`, and is empty unless a message logger
 * is registered.
 *
 * Group threads return nothing: `getDisplayedSelectedEntity` is called once per
 * correspondent with the same conversation id, so one pick would rename them
 * all.
 */
export function getConversationMatches(
  conversation: ConversationWithMatches | undefined
): ConversationMatchOption[] | undefined {
  if (conversation?.correspondents?.length !== 1) {
    return undefined;
  }
  return (
    conversation.correspondentMatchesList?.[0] ??
    conversation.correspondentMatches
  );
}
