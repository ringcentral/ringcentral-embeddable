import type {
  ConnectivityMonitor,
  RateLimiter,
} from '@ringcentral-integration/micro-auth/src/app/services';
import type {
  MessageThread,
  QueueConversations,
} from '@ringcentral-integration/micro-message/src/app/services';
import type {
  ConversationViewSpringOptions,
  ConversationViewSpringPanelProps,
} from '@ringcentral-integration/micro-message/src/app/views/ConversationViewSpring/Conversation.view.interface';
import { ConversationPanel } from '@ringcentral-integration/micro-message/src/app/views/ConversationViewSpring/ConversationPanel';
import {
  type RouterPlugin,
  useConnector,
} from '@ringcentral-integration/next-core';
import { CircularProgressIndicator } from '@ringcentral/spring-ui';
import type { FunctionComponent } from 'react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { SmsToolbarButtons } from '../../components/SmsToolbarButtons';
import type { Conversations } from '../../services/Conversations';
import type { SmsTypingTimeTracker } from '../../services/SmsTypingTimeTracker';
import type { DoNotContact } from '../../services/DoNotContact';
import { TypingDuration } from './TypingDuration';
import {
  type MessageLogSelectionServices,
  useMessageLogSelection,
} from './useMessageLogSelection';

type ConversationPanelServices = MessageLogSelectionServices & {
  conversations: Conversations;
  messageThread: MessageThread;
  queueConversations: QueueConversations;
  connectivityMonitor: ConnectivityMonitor;
  rateLimiter: RateLimiter;
};

type PanelMessage = ConversationViewSpringPanelProps['messages'][number];

/**
 * Distance from the top of the message list, in pixels, that loads older
 * messages.
 */
const LOAD_OLDER_MESSAGES_THRESHOLD = 40;

/**
 * Oldest first, matching the order the upstream conversation view renders.
 */
function sortByCreationTime(a: PanelMessage, b: PanelMessage): number {
  const aTime = new Date(a.creationTime ?? 0).getTime();
  const bTime = new Date(b.creationTime ?? 0).getTime();
  return aTime - bTime;
}

/**
 * Finds the scrolling message list rendered inside the upstream panel; it is
 * the panel's last child, after the optional sending spinner.
 */
function findMessageListScroller(
  container: HTMLElement | null,
): HTMLElement | null {
  const scroller = container?.querySelector(
    '[data-sign="conversationPanel"]',
  )?.lastElementChild;
  return scroller instanceof HTMLElement ? scroller : null;
}

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

    const messageLogSelection = useMessageLogSelection(services, props);

    // Older messages page only for personal conversations, which the
    // Conversations service has loaded; message threads and queue
    // conversations keep their own stores.
    const panelContainerRef = useRef<HTMLDivElement>(null);
    const isPersonalConversation = Boolean(
      conversationId &&
        !services.messageThread.isThreadId(conversationId) &&
        !services.queueConversations.formattedConversationsMap.has(
          conversationId,
        ),
    );
    const { isCurrentConversation, loadingOldMessages, oldMessages } =
      useConnector(() => ({
        isCurrentConversation:
          services.conversations.currentConversationId === conversationId,
        loadingOldMessages: services.conversations.loadingOldMessages,
        oldMessages: services.conversations.oldMessages,
      }));
    // The panel renders nothing, so has no list to watch, until the
    // conversation resolves.
    const canLoadOlderMessages =
      Boolean(conversation) && isPersonalConversation && isCurrentConversation;
    // The upstream view leaves fetched older messages out of the thread.
    const messages = useMemo(() => {
      if (!canLoadOlderMessages || !conversationId || !oldMessages?.length) {
        return props.messages;
      }
      return services.conversations
        .getMessages(conversationId, true)
        .sort(sortByCreationTime);
    }, [canLoadOlderMessages, conversationId, oldMessages, props.messages]);

    const loadOlderMessages = (): void => {
      if (!canLoadOlderMessages || services.conversations.loadingOldMessages) {
        return;
      }
      void services.conversations.fetchOlderMessages();
    };

    useEffect(() => {
      const container = panelContainerRef.current;
      if (!canLoadOlderMessages || !container) {
        return;
      }
      // Scroll events do not bubble, so listen in the capture phase.
      const onScroll = (event: Event): void => {
        const scroller = findMessageListScroller(container);
        if (
          scroller &&
          event.target === scroller &&
          scroller.scrollTop < LOAD_OLDER_MESSAGES_THRESHOLD
        ) {
          loadOlderMessages();
        }
      };
      container.addEventListener('scroll', onScroll, {
        capture: true,
        passive: true,
      });
      return () => {
        container.removeEventListener('scroll', onScroll, { capture: true });
      };
      // The handler only reads the stable services and the flag below.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canLoadOlderMessages]);

    // A thread too short to scroll can never reach the top, so keep loading
    // until it fills the list or the server has no older messages. As in the
    // legacy app, this includes an empty thread: a conversation opened from
    // older list pages has no messages in the synced message store.
    // The shared conversation view omits `messages` until its thread loads.
    const messageCount = messages?.length ?? 0;
    useEffect(() => {
      if (!canLoadOlderMessages || loadingOldMessages) {
        return;
      }
      const scroller = findMessageListScroller(panelContainerRef.current);
      if (
        messageCount === 0 ||
        (scroller && scroller.scrollHeight <= scroller.clientHeight)
      ) {
        loadOlderMessages();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canLoadOlderMessages, loadingOldMessages, messageCount]);

    if (!conversation) {
      return null;
    }

    const hasDraft = draft.length > 0 || (props.attachments?.length ?? 0) > 0;
    const sendButtonDisabled =
      Boolean(props.sending) ||
      !services.connectivityMonitor.connectivity ||
      services.rateLimiter.restricted ||
      !hasDraft;

    return (
      <div className="relative h-full" ref={panelContainerRef}>
        {canLoadOlderMessages && loadingOldMessages ? (
          <div
            className="absolute left-1/2 top-2 z-10 -translate-x-1/2"
            data-sign="loadingOlderMessages"
          >
            <CircularProgressIndicator size="xsmall" />
          </div>
        ) : null}
        <ConversationPanel
          {...props}
          messages={messages}
          conversation={conversation}
          sendButtonDisabled={sendButtonDisabled}
          {...messageLogSelection}
          toolbar={
            <>
              {props.toolbar}
              <SmsToolbarButtons />
            </>
          }
          endAdornment={
            smsTypingTimeTracker && conversationId ? (
              <>
                {props.endAdornment}
                <TypingDuration
                  tracker={smsTypingTimeTracker}
                  contextKey={conversationId}
                />
              </>
            ) : (
              props.endAdornment
            )
          }
          replyToReceivers={async (text, attachments) => {
            const recipients = (props.conversation?.correspondents || []).map(
              (correspondent) => ({ phoneNumber: correspondent.phoneNumber }),
            );
            if (conversationId) {
              // Stop counting while sending; the sent message completes the
              // typing session, and a blocked or failed send leaves it paused.
              await smsTypingTimeTracker?.pauseTyping(conversationId);
            }
            const canSend = doNotContact
              ? await doNotContact.verifySmsRecipients(recipients)
              : true;
            if (canSend) {
              await props.replyToReceivers(text, attachments);
            }
          }}
          updateMessageText={async (text) => {
            setDraft(text);
            if (conversationId && text) {
              void smsTypingTimeTracker?.startTyping(conversationId);
            }
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
      </div>
    );
  };
  return RoutedConversationPanel as unknown as NonNullable<
    ConversationViewSpringOptions['component']
  >;
}
