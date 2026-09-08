import type {
  ConversationViewSpringOptions,
  ConversationViewSpringPanelProps,
} from '@ringcentral-integration/micro-message/src/app/views/ConversationViewSpring/Conversation.view.interface';
import { ConversationPanel } from '@ringcentral-integration/micro-message/src/app/views/ConversationViewSpring/ConversationPanel';
import type { RouterPlugin } from '@ringcentral-integration/next-core';
import type { FunctionComponent } from 'react';
import React, { useEffect, useRef } from 'react';

import type { SmsTypingTimeTracker } from '../../services/SmsTypingTimeTracker';

/**
 * Creates a conversation panel whose routed-side-widget back action bypasses
 * the legacy full-page view transition.
 */
export function createConversationPanel(
  router: RouterPlugin,
  smsTypingTimeTracker?: SmsTypingTimeTracker,
): NonNullable<ConversationViewSpringOptions['component']> {
  const RoutedConversationPanel: FunctionComponent<
    ConversationViewSpringPanelProps
  > = (props) => {
    const latestMessageText = useRef(props.messageText);
    latestMessageText.current = props.messageText;
    const conversationId = props.conversation?.conversationId;
    useEffect(
      () => () => {
        if (!conversationId || !smsTypingTimeTracker) {
          return;
        }
        if (latestMessageText.current) {
          void smsTypingTimeTracker.pauseTyping(conversationId);
          return;
        }
        void smsTypingTimeTracker.clearTyping(conversationId);
      },
      [conversationId],
    );
    return (
      <ConversationPanel
        {...props}
        updateMessageText={(text) => {
          if (conversationId && smsTypingTimeTracker) {
            if (text) {
              void smsTypingTimeTracker.startTyping(conversationId);
            } else {
              void smsTypingTimeTracker.clearTyping(conversationId);
            }
          }
          props.updateMessageText?.(text);
        }}
        goBack={() => {
          void router.push('/messages');
        }}
      />
    );
  };
  return RoutedConversationPanel;
}
