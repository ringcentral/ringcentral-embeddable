import type { Message } from '@ringcentral-integration/commons/interfaces/MessageStore.model';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import type {
  MessageThread,
  QueueConversations,
} from '@ringcentral-integration/micro-message/src/app/services';
import type { ConversationViewSpringPanelProps } from '@ringcentral-integration/micro-message/src/app/views/ConversationViewSpring/Conversation.view.interface';
import { useConnector } from '@ringcentral-integration/next-core';
import { CircleCheckFilledSm } from '@ringcentral/spring-icon';
import { Checkbox, IconButton } from '@ringcentral/spring-ui';
import type { ReactNode } from 'react';
import React, { useEffect, useRef, useState } from 'react';

import type { ConversationLogger } from '../../services/ConversationLogger';
import type { ThirdParty } from '../../services/ThirdParty';
import { insertConversationLogAction } from '../ConversationsView/ConversationLogAction';
import i18n from './i18n';

/**
 * How long a message's logged state stays fresh before it is matched again.
 */
const MESSAGE_LOG_STATE_CHECK_TTL = 60 * 1000;

export type MessageLogSelectionServices = {
  thirdParty: ThirdParty;
  conversationLogger: ConversationLogger;
  messageThread: MessageThread;
  queueConversations: QueueConversations;
};

type MessageLogSelectionProps = Pick<
  ConversationViewSpringPanelProps,
  | 'conversation'
  | 'messages'
  | 'renderLogIndicator'
  | 'useConversationItemInfo'
  | 'useActionsHandler'
>;

type MessageLogSelection = Pick<
  ConversationViewSpringPanelProps,
  'renderLogIndicator' | 'useConversationItemInfo' | 'useActionsHandler'
>;

function isSelectableMessage(message: Message): boolean {
  return Boolean(message.id) && message.messageType !== 'info';
}

function getIndicatorCheckbox(indicator: Element): HTMLInputElement | null {
  return indicator.querySelector<HTMLInputElement>('input[type="checkbox"]');
}

/** Unlogged message checkboxes in on-screen order. */
function getAllIndicatorCheckboxes(): HTMLInputElement[] {
  return Array.from(
    document.querySelectorAll<HTMLInputElement>(
      '[data-message-log-id] input[type="checkbox"]',
    ),
  );
}

function getIndicatorMessageId(checkbox: HTMLInputElement): string {
  return (
    checkbox.closest<HTMLElement>('[data-message-log-id]')?.dataset
      .messageLogId ?? ''
  );
}

/**
 * Granular per-message SMS logging: lets the user check the messages of a
 * personal conversation and log only those, when the third-party service
 * enables it and SMS logging is manual. Falls back to the given props
 * otherwise.
 */
export function useMessageLogSelection(
  services: MessageLogSelectionServices,
  props: MessageLogSelectionProps,
): MessageLogSelection {
  const { thirdParty, conversationLogger, messageThread, queueConversations } =
    services;
  const { conversation, messages } = props;
  const conversationId = (
    conversation as { conversationId?: string } | undefined
  )?.conversationId;
  const { t } = useLocale(i18n);

  const {
    active,
    logStateMap,
    logButtonTitle,
    matcherRegistered,
  } = useConnector(() => ({
    active: Boolean(
      conversationId &&
        thirdParty.messageLoggerGranularSelectionEnabled &&
        thirdParty.messageLoggerRegistered &&
        !conversationLogger.autoLog &&
        !messageThread.isThreadId(conversationId) &&
        !queueConversations.formattedConversationsMap.has(conversationId),
    ),
    logStateMap: thirdParty.messageLogStateMap,
    logButtonTitle: thirdParty.messageLoggerTitle,
    matcherRegistered: thirdParty.messageLogEntityMatcherRegistered,
  }));

  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isLogging, setIsLogging] = useState(false);
  const checkedAtRef = useRef(new Map<string, number>());
  const inFlightRef = useRef(new Set<string>());
  const latestRef = useRef({ active, selectedMessageIds, messages });
  latestRef.current = { active, selectedMessageIds, messages };
  const dragRef = useRef<{ select: boolean; moved: boolean } | null>(null);

  useEffect(() => {
    setSelectedMessageIds(new Set());
    checkedAtRef.current.clear();
    inFlightRef.current.clear();
  }, [conversationId, active]);

  useEffect(() => {
    const endDrag = (): void => {
      if (!dragRef.current) {
        return;
      }
      // Clear after the click that follows `pointerup`, so the checkbox the
      // drag ends on is not toggled back.
      setTimeout(() => {
        dragRef.current = null;
      });
    };
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    return () => {
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
    };
  }, []);

  useEffect(() => {
    setSelectedMessageIds((selected) => {
      const unlogged = [...selected].filter((id) => !logStateMap[id]);
      return unlogged.length === selected.size ? selected : new Set(unlogged);
    });
  }, [logStateMap]);

  const selectableIdsKey = active
    ? messages
        .filter(isSelectableMessage)
        .map(({ id }) => String(id))
        .join(',')
    : '';

  useEffect(() => {
    if (!conversationId || !matcherRegistered || !selectableIdsKey) {
      return;
    }
    const now = Date.now();
    const messageIds = selectableIdsKey.split(',').filter((id) => {
      const checkedAt = checkedAtRef.current.get(id);
      return (
        !logStateMap[id] &&
        !inFlightRef.current.has(id) &&
        (!checkedAt || now - checkedAt > MESSAGE_LOG_STATE_CHECK_TTL)
      );
    });
    if (messageIds.length === 0) {
      return;
    }
    messageIds.forEach((id) => inFlightRef.current.add(id));
    void thirdParty
      .matchMessagesLogState({ conversationId, messageIds })
      .catch(() => undefined)
      .finally(() => {
        const checkedAt = Date.now();
        messageIds.forEach((id) => {
          inFlightRef.current.delete(id);
          checkedAtRef.current.set(id, checkedAt);
        });
      });
    // Logged state changes are already reflected by `logStateMap` filtering.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, matcherRegistered, selectableIdsKey]);

  if (!active || !conversationId) {
    return {
      renderLogIndicator: props.renderLogIndicator,
      useConversationItemInfo: props.useConversationItemInfo,
      useActionsHandler: props.useActionsHandler,
    };
  }

  const setMessageSelected = (messageId: string, selected: boolean): void => {
    setSelectedMessageIds((current) => {
      const next = new Set(current);
      if (selected) {
        next.add(messageId);
      } else {
        next.delete(messageId);
      }
      return next;
    });
  };

  const logSelectedMessages = async (
    correspondentEntity?: Parameters<
      ConversationLogger['logSelectedMessages']
    >[0]['correspondentEntity'],
  ): Promise<void> => {
    // Snapshot at click time so messages arriving mid-request are excluded.
    const selectedIds = new Set(latestRef.current.selectedMessageIds);
    const selectedMessages = latestRef.current.messages.filter((message) =>
      selectedIds.has(String(message.id)),
    );
    if (selectedMessages.length === 0) {
      return;
    }
    setIsLogging(true);
    try {
      await conversationLogger.logSelectedMessages({
        conversationId,
        messages: selectedMessages,
        correspondents: conversation?.correspondents,
        correspondentEntity,
      });
    } finally {
      setIsLogging(false);
    }
  };

  const renderLogIndicator = (message: Message): ReactNode => {
    if (!isSelectableMessage(message)) {
      return null;
    }
    const messageId = String(message.id);
    const logState = logStateMap[messageId];
    const checked = selectedMessageIds.has(messageId);
    return (
      // Read by `main.global.scss` to keep every indicator on the right edge.
      <span
        className="inline-flex"
        data-message-log-indicator={message.direction}
        data-message-log-id={messageId}
        onPointerDown={(event) => {
          if (logState || isLogging || event.button !== 0) {
            return;
          }
          // Prevents text selection while dragging across messages.
          event.preventDefault();
          getIndicatorCheckbox(event.currentTarget)?.focus();
          dragRef.current = { select: !checked, moved: false };
        }}
        onPointerEnter={() => {
          const drag = dragRef.current;
          if (!drag || logState || isLogging) {
            return;
          }
          drag.moved = true;
          setMessageSelected(messageId, drag.select);
        }}
        onPointerLeave={() => {
          // Applies the drag to the starting checkbox once the pointer leaves it.
          const drag = dragRef.current;
          if (drag && !drag.moved && !logState && !isLogging) {
            drag.moved = true;
            setMessageSelected(messageId, drag.select);
          }
        }}
        onKeyDown={(event) => {
          if (
            logState ||
            isLogging ||
            (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')
          ) {
            return;
          }
          event.preventDefault();
          const checkboxes = getAllIndicatorCheckboxes();
          const index = checkboxes.indexOf(
            getIndicatorCheckbox(event.currentTarget)!,
          );
          if (event.key === 'ArrowDown') {
            const next = checkboxes[index + 1];
            setMessageSelected(messageId, true);
            if (next) {
              setMessageSelected(getIndicatorMessageId(next), true);
              next.focus();
            }
          } else {
            setMessageSelected(messageId, false);
            checkboxes[index - 1]?.focus();
          }
        }}
      >
        {logState ? (
          <IconButton
            data-sign="messageLoggedIcon"
            symbol={CircleCheckFilledSm}
            variant="icon"
            color="success"
            size="small"
            TooltipProps={{ title: t('logged') }}
            onClick={() => {
              void thirdParty.openMessageLog({
                logId: logState.logId,
                messageId,
                conversationId,
              });
            }}
          />
        ) : (
          <Checkbox
            data-sign="messageSelectCheckbox"
            checked={checked}
            disabled={isLogging}
            inputProps={{ 'aria-label': t('selectMessage') }}
            onChange={(event) => {
              if (dragRef.current?.moved) {
                return;
              }
              setMessageSelected(messageId, event.target.checked);
            }}
          />
        )}
      </span>
    );
  };

  const selectedCount = selectedMessageIds.size;
  const useConversationItemInfo: ConversationViewSpringPanelProps['useConversationItemInfo'] =
    (itemConversation, options) => {
      const result = props.useConversationItemInfo(itemConversation, options);
      return {
        ...result,
        actions: insertConversationLogAction(result.actions, {
          type: 'createLog',
          label: `${logButtonTitle || t('logMessages')} (${selectedCount})`,
          disabled: selectedCount === 0 || isLogging,
        }),
      };
    };

  const useActionsHandler: ConversationViewSpringPanelProps['useActionsHandler'] =
    (itemConversation, info, location) => {
      const baseHandler = props.useActionsHandler(
        itemConversation,
        info,
        location,
      );
      return async (actionType, data) => {
        if (
          latestRef.current.active &&
          (actionType === 'createLog' || actionType === 'viewLog')
        ) {
          await logSelectedMessages(info.matchedContact);
          return;
        }
        await baseHandler(actionType, data);
      };
    };

  return { renderLogIndicator, useConversationItemInfo, useActionsHandler };
}
