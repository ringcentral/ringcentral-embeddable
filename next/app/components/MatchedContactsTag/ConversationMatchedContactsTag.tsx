import React from 'react';

import {
  MatchedContactsTag,
  type MatchedContactOption,
} from './MatchedContactsTag';
import { getConversationTagProps } from './useDisplayNameWithMatches';

export interface ConversationMatchedContactsTagProps {
  /** Typed structurally — only these three fields are needed. */
  conversation: {
    conversationId?: string;
    correspondents?: unknown[];
    correspondentMatchesList?: MatchedContactOption[][];
  };
}

/** Standalone tag for a conversation, for surfaces that render it directly. */
export const ConversationMatchedContactsTag: React.FC<
  ConversationMatchedContactsTagProps
> = ({ conversation }) => (
  <MatchedContactsTag {...getConversationTagProps(conversation)} />
);
