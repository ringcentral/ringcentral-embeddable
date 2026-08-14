import type {
  ConversationViewSpringOptions,
  ConversationViewSpringPanelProps,
} from '@ringcentral-integration/micro-message/src/app/views/ConversationViewSpring/Conversation.view.interface';
import { ConversationPanel } from '@ringcentral-integration/micro-message/src/app/views/ConversationViewSpring/ConversationPanel';
import type { RouterPlugin } from '@ringcentral-integration/next-core';
import type { FunctionComponent } from 'react';
import React from 'react';

/**
 * Creates a conversation panel whose routed-side-widget back action bypasses
 * the legacy full-page view transition.
 */
export function createConversationPanel(
  router: RouterPlugin,
): NonNullable<ConversationViewSpringOptions['component']> {
  const RoutedConversationPanel: FunctionComponent<
    ConversationViewSpringPanelProps
  > = (props) => (
    <ConversationPanel
      {...props}
      goBack={() => {
        void router.push('/messages');
      }}
    />
  );
  return RoutedConversationPanel;
}
