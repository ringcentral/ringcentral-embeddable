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

  useEffect(() => {
    setSelectedMessageIds(new Set());
    checkedAtRef.current.clear();
    inFlightRef.current.clear();
  }, [conversationId, active]);

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
    if (logState) {
      return (
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
      );
    }
    return (
      <Checkbox
        data-sign="messageSelectCheckbox"
        checked={selectedMessageIds.has(messageId)}
        inputProps={{ 'aria-label': t('selectMessage') }}
        onChange={(event) => {
          setMessageSelected(messageId, event.target.checked);
        }}
      />
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
