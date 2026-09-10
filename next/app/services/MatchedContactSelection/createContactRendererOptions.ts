import type { Entity } from '@ringcentral-integration/commons/interfaces/Entity.interface';
import type { ContactRendererOptions } from '@ringcentral-integration/micro-phone/src/app/hooks/useContactRenderInfo';

import type { ThirdParty } from '../ThirdParty';

import {
  getConversationMatches,
  type ConversationWithMatches,
} from './conversationMatches';
import { getLoggedContact } from './getLoggedContact';
import type { MatchedContactSelection } from './MatchedContactSelection';

interface ConversationsLookup {
  formattedConversationsMap: Map<string, ConversationWithMatches>;
  currentConversation?: ConversationWithMatches;
}

/**
 * The framework's extension point for rendering a number that matched several
 * contacts.
 *
 * Only `getDisplayedSelectedEntity` and `getDefaultCrmMatch` are implemented —
 * the type also declares `onSelectContact`, but nothing in the framework calls
 * it, so providing it would be dead code.
 *
 * Note that `getDisplayedSelectedEntity` is consulted for conversations only.
 * Calls and call history resolve their pick through `callSelectionInfo`, which
 * the local `CallViewState` merges in.
 */
export function createContactRendererOptions(
  matchedContactSelection: MatchedContactSelection,
  thirdParty: ThirdParty,
  conversations: ConversationsLookup
): ContactRendererOptions {
  return {
    getDisplayedSelectedEntity: (_matches, conversationId) => {
      if (!conversationId) {
        return undefined;
      }
      // The `matches` argument is deliberately ignored: the framework passes
      // the conversation's CRM log records, not the contact matches the pick
      // was made from, and those are empty without a message logger.
      const conversation =
        conversations.formattedConversationsMap.get(conversationId) ??
        conversations.currentConversation;
      const contactMatches = getConversationMatches(conversation);
      const loggedContact = getLoggedContact(
        conversation?.conversationMatches,
        contactMatches,
      );
      if (loggedContact) {
        return loggedContact as Entity;
      }
      const selectedContact = matchedContactSelection.resolveSelection(
        'conversation',
        conversationId,
        contactMatches,
      )?.displayedSelection;
      if (selectedContact) {
        return selectedContact as Entity;
      }
      const lastMatchedContactId =
        conversation?.lastMatchedCorrespondentEntity?.id;
      return contactMatches?.find(({ id }) => id === lastMatchedContactId) as
        | Entity
        | undefined;
    },
    getDefaultCrmMatch: (matches) => {
      if (!matches?.length) {
        return undefined;
      }
      const sourceName = thirdParty.sourceName;
      // Prefer the registered third-party service, so the guess is stable when
      // several providers matched, then any CRM match, then the first match.
      return (
        (sourceName &&
          matches.find(
            (match) => (match as Entity)?.resourceType === sourceName
          )) ||
        matches.find((match) => !!(match as Entity)?.resourceType) ||
        matches[0]
      );
    },
  };
}
