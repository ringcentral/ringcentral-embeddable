import type { ConnectivityMonitor, RateLimiter } from '@ringcentral-integration/micro-auth/src/app/services';
import type {
  Conversations,
  MessageThread,
  QueueConversations,
} from '@ringcentral-integration/micro-message/src/app/services';
import type {
  ConversationViewSpringOptions,
  ConversationViewSpringPanelProps,
} from '@ringcentral-integration/micro-message/src/app/views/ConversationViewSpring/Conversation.view.interface';
import { ConversationPanel } from '@ringcentral-integration/micro-message/src/app/views/ConversationViewSpring/ConversationPanel';
import type { RouterPlugin } from '@ringcentral-integration/next-core';
import type { FunctionComponent } from 'react';
import React, { useEffect, useRef, useState } from 'react';

import type { SmsTypingTimeTracker } from '../../services/SmsTypingTimeTracker';
import type { DoNotContact } from '../../services/DoNotContact';

type ConversationPanelServices = {
  conversations: Conversations;
  messageThread: MessageThread;
  queueConversations: QueueConversations;
  connectivityMonitor: ConnectivityMonitor;
  rateLimiter: RateLimiter;
};

/**
 * Creates a conversation panel whose routed-side-widget back action bypasses
 * the legacy full-page view transition.
 */
export function createConversationPanel(
  router: RouterPlugin,
  smsTypingTimeTracker: SmsTypingTimeTracker | undefined,
  doNotContact: DoNotContact | undefined,
  services: ConversationPanelServices,
): NonNullable<ConversationViewSpringOptions['component']> {
  const RoutedConversationPanel: FunctionComponent<
    ConversationViewSpringPanelProps
  > = (props) => {
    const conversation = props.conversation;
    const conversationId = conversation?.conversationId;
    const [draft, setDraft] = useState(props.messageText ?? '');
    const loadedConversationIds = useRef(new Set<string>());
    const latestMessageText = useRef(props.messageText);
    latestMessageText.current = draft;

    useEffect(() => {
      setDraft(props.messageText ?? '');
    }, [props.messageText]);

    const ensureServerConversation = async (id: string): Promise<void> => {
      if (loadedConversationIds.current.has(id)) {
        return;
      }
      if (services.messageThread.isThreadId(id)) {
        loadedConversationIds.current.add(id);
        return;
      }
      if (services.queueConversations.formattedConversationsMap.has(id)) {
        await services.queueConversations.loadConversation(id);
      } else {
        await services.conversations.loadConversation(id);
      }
      loadedConversationIds.current.add(id);
    };

    useEffect(() => {
      if (!conversationId) {
        return;
      }
      void ensureServerConversation(conversationId).catch(() => undefined);
      // Load once per conversation; the helper identity is intentionally omitted.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId]);

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

    if (!conversation) {
      return null;
    }

    const hasDraft =
      draft.length > 0 || (props.attachments?.length ?? 0) > 0;
    const sendButtonDisabled =
      Boolean(props.sending) ||
      !services.connectivityMonitor.connectivity ||
      services.rateLimiter.restricted ||
      !hasDraft;

    return (
      <ConversationPanel
        {...props}
        conversation={conversation}
        sendButtonDisabled={sendButtonDisabled}
        replyToReceivers={async (text, attachments) => {
          const recipients = (props.conversation?.correspondents || []).map(
            (correspondent) => ({ phoneNumber: correspondent.phoneNumber }),
          );
          const canSend = doNotContact
            ? await doNotContact.verifySmsRecipients(recipients)
            : true;
          if (canSend) {
            await props.replyToReceivers(text, attachments);
          }
        }}
        updateMessageText={async (text) => {
          setDraft(text);
          if (conversationId) {
            await ensureServerConversation(conversationId);
            const resolvedId = props.conversation?.conversationId;
            if (
              resolvedId &&
              resolvedId !== conversationId &&
              services.messageThread.isThreadId(resolvedId)
            ) {
              await services.messageThread.setInputValue(resolvedId, text);
            }
          }
          await props.updateMessageText?.(text);
        }}
        goBack={() => {
          void router.push('/messages');
        }}
      />
    );
  };
  return RoutedConversationPanel as unknown as NonNullable<
    ConversationViewSpringOptions['component']
  >;
}
