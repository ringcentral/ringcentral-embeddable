import React from 'react';
import { styled, palette2 } from '@ringcentral/juno/foundation';
import {
  RcTabs,
  RcTab,
} from '@ringcentral/juno';
import messageTypes from '@ringcentral-integration/commons/enums/messageTypes';

import i18n from '@ringcentral-integration/widgets/components/ConversationsPanel/i18n';

const StyledTabLabel = styled.span`
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 400;

  > span:first-child {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-grow: 1;
  }

  > span:not(:last-child) {
    margin-right: 4px;
  }
`;

const UnreadCount = styled.span`
  display: inline-block;
  box-sizing: content-box;
  font-size: 0.75rem;
  font-weight: 400;
  text-align: center;
  color: ${palette2('neutral', 'f03')};
`;

const StyledRcTabs = styled(RcTabs)`
  border-bottom: 1px solid ${palette2('neutral', 'l02')};

  .RcTab-selected .sms-tab-unread {
    color: ${palette2('tab', 'selected')};
    font-weight: 700;
  }
`;

function TabLabel({
  label,
  unreadCounts,
  currentLocale,
}) {
  return (
    <StyledTabLabel>
      <span>
        {i18n.getString(label, currentLocale)}
      </span>
      {
        unreadCounts > 0 && (
          <UnreadCount className="sms-tab-unread">
            ({unreadCounts})
          </UnreadCount>
        )
      }
    </StyledTabLabel>
  )
}

export function ConversationTypeTabs({
  onTabChange,
  currentTab,
  currentLocale,
  readVoicemailPermission,
  voiceUnreadCounts,
  readFaxPermission,
  faxUnreadCounts,
  readTextPermission,
  textUnreadCounts,
}) {
  return (
    <StyledRcTabs
      value={currentTab}
      onChange={(_, value) => {
        onTabChange(value);
      }}
      variant="fullWidth"
    >
      <RcTab
        label={
          <TabLabel
            currentLocale={currentLocale}
            label={messageTypes.all}
            unreadCounts={voiceUnreadCounts + faxUnreadCounts + textUnreadCounts}
          />
        }
        value={messageTypes.all}
      />
      {
        readVoicemailPermission && (
          <RcTab
            label={
              <TabLabel
                currentLocale={currentLocale}
                label={messageTypes.voiceMail}
                unreadCounts={voiceUnreadCounts}
              />
            }
            value={messageTypes.voiceMail}
          />
        )
      }
      {
        readTextPermission && (
          <RcTab
            label={
              <TabLabel
                currentLocale={currentLocale}
                label={messageTypes.text}
                unreadCounts={textUnreadCounts}
              />
            }
            value={messageTypes.text}
          />
        )
      }
      {
        readFaxPermission && (
          <RcTab
            label={
              <TabLabel
                currentLocale={currentLocale}
                label={messageTypes.fax}
                unreadCounts={faxUnreadCounts}
              />
            }
            value={messageTypes.fax}
          />
        )
      }
    </StyledRcTabs>
  );
}
