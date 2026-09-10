import clsx from 'clsx';
import React, { useRef, type FunctionComponent } from 'react';

import {
  getConversationMatches,
  getLoggedContact,
} from '../../services/MatchedContactSelection';

import type { ConversationMatchedContactsTagProps } from './ConversationMatchedContactsTag';
import {
  MatchedContactsTag,
  type MatchedContactOption,
  type MatchedContactsTagProps,
} from './MatchedContactsTag';

type DisplayControl = {
  viewable?: boolean;
  maybe?: boolean;
  matchCounts?: boolean;
  align?: 'left' | 'center';
};

export type DisplayNameComponent = FunctionComponent<{
  displayControl?: DisplayControl;
}>;

/**
 * Wraps a record's `DisplayName` so the match count becomes a picker.
 *
 * Framework pages take `DisplayName` off the `info` object returned by
 * `useCallHistoryItemInfo` / `useConversationItemInfo`, so decorating those
 * instance fields on the view reaches every surface at once — including pages
 * we do not own, like the post-call screen and the voicemail detail page.
 *
 * The returned component keeps a stable identity for the life of the item. The
 * framework rebuilds its own `DisplayName` on every render, and React would
 * treat a new function as a new element type and remount the subtree — which
 * would drop the open menu's anchor state mid-interaction.
 */
export function useDisplayNameWithMatches(
  BaseDisplayName: DisplayNameComponent,
  tagProps: MatchedContactsTagProps
): DisplayNameComponent {
  const latest = useRef({ BaseDisplayName, tagProps });
  latest.current = { BaseDisplayName, tagProps };

  const componentRef = useRef<DisplayNameComponent | null>(null);
  if (!componentRef.current) {
    componentRef.current = ({ displayControl }) => {
      const { BaseDisplayName: Base, tagProps: currentTagProps } =
        latest.current;
      const align = displayControl?.align ?? 'left';

      return (
        <span
          className={clsx(
            'inline-flex flex-col min-w-0 max-w-full',
            align === 'center' ? 'items-center' : 'items-start'
          )}
        >
          {/* The framework's own count tag is inert, so ours replaces it. */}
          <Base displayControl={{ ...displayControl, matchCounts: false }} />
          <MatchedContactsTag {...currentTagProps} />
        </span>
      );
    };
  }

  return componentRef.current;
}

/**
 * The offered matches come from the same helper the resolver uses, so the list
 * shown can never drift from the list a pick is resolved against.
 *
 * Fax and voicemail are selectable — only `selections` is suppressed for them,
 * and `displaySelection` is still honoured ahead of the `Maybe:` guess. Group
 * threads are not: the helper returns nothing for them.
 */
export function getConversationTagProps(
  conversation: ConversationMatchedContactsTagProps['conversation']
): MatchedContactsTagProps {
  const matches = getConversationMatches(conversation);
  const loggedContact =
    getLoggedContact(conversation.conversationMatches, matches) ??
    matches?.find(
      ({ id }) => id === conversation.lastMatchedCorrespondentEntity?.id,
    );
  return {
    scope: 'conversation',
    recordKey: conversation.conversationId,
    matches: loggedContact ? [loggedContact] : matches,
    selectable: Boolean(matches) && !loggedContact,
  };
}

export function useConversationDisplayNameWithMatches(
  BaseDisplayName: DisplayNameComponent,
  conversation: ConversationMatchedContactsTagProps['conversation']
): DisplayNameComponent {
  return useDisplayNameWithMatches(
    BaseDisplayName,
    getConversationTagProps(conversation)
  );
}

export function useCallDisplayNameWithMatches(
  BaseDisplayName: DisplayNameComponent,
  sessionId: string | null | undefined,
  matches: MatchedContactOption[] | undefined,
  logMatches?: readonly unknown[],
): DisplayNameComponent {
  const loggedContact = getLoggedContact(logMatches, matches);
  return useDisplayNameWithMatches(BaseDisplayName, {
    scope: 'call',
    recordKey: sessionId,
    matches: loggedContact ? [loggedContact] : matches,
    selectable: !loggedContact,
  });
}
