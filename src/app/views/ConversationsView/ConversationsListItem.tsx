import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import type { FormattedConversation } from '@ringcentral-integration/micro-message/src/app/services';
import type { ConversationsPanelSpringProps } from '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring/Conversations.view.interface';
import { useThreadInfoDisplay } from '@ringcentral-integration/micro-message/src/app/views/MessageThreadsView/useThreadInfoDisplay';
import { ListItem, ListItemText } from '@ringcentral/spring-ui';
import clsx from 'clsx';
import React, { memo } from 'react';

import { createRefreshContactActionButton } from '../../components/RefreshContactActionButton';

import i18n from './i18n';
import { useAdditionalMessageButtons } from './useAdditionalMessageButtons';
import { useConversationActionButtons } from './useConversationActionButtons';

interface ConversationsListItemProps
  extends Pick<
    ConversationsPanelSpringProps,
    | 'createNewEntityTooltip'
    | 'disableLinks'
    | 'showLogPopover'
    | 'typeFilter'
    | 'useActionsHandler'
    | 'useConversationItemInfo'
    | 'useItemRender'
  > {
  conversation: FormattedConversation;
  index: number;
  onRefreshContact?: (phoneNumber: string) => Promise<void> | void;
}

const ConversationsListItemComponent: React.FC<ConversationsListItemProps> = ({
  conversation,
  createNewEntityTooltip,
  disableLinks,
  index,
  onRefreshContact,
  showLogPopover,
  typeFilter,
  useActionsHandler,
  useConversationItemInfo,
  useItemRender,
}) => {
  const { t } = useLocale(i18n);
  const { actions, extensionId, info, threadInfo } =
    useConversationItemInfo(conversation);
  const onAction = useActionsHandler(
    conversation,
    info,
    typeFilter === 'Text'
      ? 'Text list'
      : typeFilter === 'Fax'
      ? 'Fax list'
      : 'Voicemail list',
  );
  useItemRender?.(conversation, index);
  const {
    Avatar,
    DisplayName,
    Unread,
    creationTime,
    displayDescription,
    displayType,
    isFax,
    logged,
    unreadCounts,
  } = info;
  const { ThreadStatus, queueName } = useThreadInfoDisplay({
    extensionId,
    info: threadInfo,
    onAction,
  });
  const phoneNumber =
    info.signalSourceInfo?.phoneNumber ||
    info.signalSourceInfo?.extensionNumber;
  const refreshContactButton = createRefreshContactActionButton({
    disabled: disableLinks,
    label: t('refreshContact'),
    onRefreshContact,
    phoneNumber,
  });
  const additionalButtons = useAdditionalMessageButtons(
    conversation,
    disableLinks,
  );
  const buttons = useConversationActionButtons({
    actions,
    additionalButtons,
    conversation,
    createNewEntityTooltip,
    onAction,
    refreshContactButton,
    showLogPopover,
  });

  return (
    <ListItem
      className="group"
      clickable={!isFax}
      classes={{ content: 'bg-inherit !px-3 !py-2' }}
      data-sign="conversationItem"
      onClick={() => onAction('viewDetail')}
      size="auto"
    >
      <Unread className="mr-1 -ml-3" data-sign="unread-conversationItem" />
      <Avatar />
      <ListItemText
        primary={
          <div
            className={clsx('flex items-center gap-1 truncate', {
              'typography-subtitleBold': unreadCounts > 0,
            })}
            data-display-type={displayType}
            data-sign="currentName"
          >
            <DisplayName displayControl={{ matchCounts: true, maybe: true }} />
          </div>
        }
        secondary={
          queueName ? (
            <div>
              {displayDescription}
              {queueName}
            </div>
          ) : (
            displayDescription
          )
        }
      />
      <div className="min-h-11 text-right">
        <div className="flex items-center gap-1">
          <Unread color="secondary" size="small" type="standard" />
          <ThreadStatus />
          <span
            className="typography-descriptor text-neutral-b2"
            data-sign="conversationItemTime"
          >
            {creationTime}
          </span>
        </div>
        {logged}
      </div>
      {buttons}
    </ListItem>
  );
};

export const ConversationsListItem = memo(ConversationsListItemComponent);
