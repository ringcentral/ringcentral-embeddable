import React from 'react';
import {
  RcListItem,
  RcListItemText,
  RcListItemIcon,
  RcListItemSecondaryAction,
  RcTypography,
  styled,
  palette2,
  shadows,
} from '@ringcentral/juno';
import messageDirection from '@ringcentral-integration/commons/enums/messageDirection';
import messageTypes from '@ringcentral-integration/commons/enums/messageTypes';
import i18n from '@ringcentral-integration/widgets/components/MessageItem/i18n';
import { formatDuration } from '@ringcentral-integration/commons/lib/formatDuration';

import { ConversationIcon } from '../ConversationItem/ConversationIcon';

const StyledItem = styled(RcListItem)`
  width: 100%;
  background: ${palette2('neutral', 'b03')};
  user-select: auto;
  cursor: auto;
  box-shadow: ${shadows('3')};

  .RcListItemText-primary {
    font-size: 1rem;
    margin-bottom: 3px;
  }
`;

const StyledItemIcon = styled(RcListItemIcon)`
  .icon {
    font-size: 26px;
  }
`;

const StyledSecondary = styled(RcListItemSecondaryAction)`
  display: flex;
  flex-direction: column;
`;

const TimeInfo = styled(RcTypography)`
  margin: 0;
  line-height: 22px;
  min-height: 22px;
`;

function getInfo({
  type,
  messages,
  allMessagesCount,
  currentLocale,
}) {
  const message = messages[0];
  if (type === messageTypes.voiceMail) {
    if (!message) {
      return null;
    }
    const attachments = message.attachments || [];
    const attachment = attachments[0];
    return `${i18n.getString(
      'voiceMessage',
      currentLocale,
    )} (${formatDuration(attachment ? attachment.vmDuration : 0)})`;
  }
  if (type === messageTypes.fax) {
    if (!message) {
      return null;
    }
    const pageCount = +message.faxPageCount;
    const nameKey = pageCount === 1 ? 'page' : 'pages';
    if (message.direction === messageDirection.inbound) {
      return `${i18n.getString(
        'faxReceived',
        currentLocale,
      )}(${pageCount} ${i18n.getString(nameKey, currentLocale)})`;
    }
  }
  return `Total ${allMessagesCount} messages`;
}
export function ConversationInfo({
  formatPhone,
  conversationLog,
  dateTimeFormatter,
  currentLocale,
}) {
  const logKeys = Object.keys(conversationLog);
  if (logKeys.length === 0) {
    return null;
  }
  const conversation = conversationLog[logKeys[0]];
  if (!conversation) {
    return null;
  }
  const {
    correspondents,
    type,
    direction,
    creationTime,
  } = conversation;
  const phoneNumbers = (
    correspondents.map(
      (correspondent) =>
        correspondent.phoneNumber ||
        correspondent.extensionNumber
    )
  );
  const messageCount = logKeys.reduce(
    (acc, key) => acc + conversationLog[key].messages.length,
    0
  );
  return (
    <StyledItem
      disableTouchRipple
      component="div"
    >
      <StyledItemIcon>
        <ConversationIcon
          group={correspondents && correspondents.length > 1}
          currentLocale={currentLocale}
          direction={direction}
          type={type}
          color="neutral.f06"
        />
      </StyledItemIcon>
      <RcListItemText
        primary={phoneNumbers.map(formatPhone).join(', ')}
        secondary={
          getInfo({
            type,
            messages: conversation.messages,
            allMessagesCount: messageCount,
            currentLocale,
          })
        }
      />
      <StyledSecondary>
        <TimeInfo variant="caption1">
          {
            logKeys.length > 1 ? logKeys[logKeys.length - 1] : ''
          }
        </TimeInfo>
        <TimeInfo variant="caption1">
          {
          (
            type === messageTypes.voiceMail || type === messageTypes.fax) ?
              dateTimeFormatter({
                utcTimestamp: creationTime,
                locale: currentLocale,
              }) : logKeys[0]
          }
        </TimeInfo>
      </StyledSecondary>
    </StyledItem>
  );
}