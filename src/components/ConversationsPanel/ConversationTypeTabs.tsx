import React from 'react';
import messageTypes from '@ringcentral-integration/commons/enums/messageTypes';
import i18n from '@ringcentral-integration/widgets/components/ConversationsPanel/i18n';
import { SubTabs } from '../SubTabs';

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
  const tabs = [{
    label: i18n.getString(messageTypes.all, currentLocale),
    value: messageTypes.all,
    unreadCounts: voiceUnreadCounts + faxUnreadCounts + textUnreadCounts,
  }];
  if (readVoicemailPermission) {
    tabs.push({
      label: i18n.getString(messageTypes.voiceMail, currentLocale),
      value: messageTypes.voiceMail,
      unreadCounts: voiceUnreadCounts,
    });
  }
  if (readTextPermission) {
    tabs.push({
      label: i18n.getString(messageTypes.text, currentLocale),
      value: messageTypes.text,
      unreadCounts: textUnreadCounts,
    });
  }
  if (readFaxPermission) {
    tabs.push({
      label: i18n.getString(messageTypes.fax, currentLocale),
      value: messageTypes.fax,
      unreadCounts: faxUnreadCounts,
    });
  }
  return (
    <SubTabs
      onChange={onTabChange}
      value={currentTab}
      tabs={tabs}
    />
  );
}
