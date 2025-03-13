import React, { useEffect } from 'react';
import {
  RcList,
  RcListItem,
  RcListItemText,
  RcLoading,
  styled,
} from '@ringcentral/juno';
import i18n from '@ringcentral-integration/widgets/components/RecentActivityMessages/i18n';

const Container = styled(RcList) `
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const StyledItem = styled(RcListItem)`
  cursor: pointer;
`;

function MessageItem({ message, dateTimeFormatter, navigateTo }) {
  const { subject, creationTime, readStatus, conversationId, fromRemote } = message;
  const isUnread = readStatus !== 'Read';
  const time = dateTimeFormatter({ utcTimestamp: creationTime });
  return (
    <StyledItem
      key={message.id}
      button
      onClick={() => {
        if (fromRemote) {
          return;
        }
        navigateTo(`/conversations/${conversationId}`);
      }}
    >
      <RcListItemText
        primary={subject}
        secondary={time}
        primaryTypographyProps={{
          title: subject,
          color: isUnread ? 'interactive.f01' : 'neutral.f06',
        }}
      />
    </StyledItem>
  );
}

export function Messages({
  messages,
  loaded,
  loadMessages,
  clearMessages,
  navigateTo,
  dateTimeFormatter,
  currentLocale,
}) {
  useEffect(() => {
    loadMessages();
    return () => clearMessages();
  }, []);

  return (
    <RcLoading loading={!loaded}>
      <Container>
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            dateTimeFormatter={dateTimeFormatter}
            navigateTo={navigateTo}
          />
        ))}
        {
          loaded && messages.length === 0 && (
            <RcListItem>
              <RcListItemText
                primary={i18n.getString('noRecords', currentLocale)}
              />
            </RcListItem>
          )
        }
      </Container>
    </RcLoading>
  );
}