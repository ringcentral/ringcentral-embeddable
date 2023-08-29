import React from 'react';

import TabNavigationView from '@ringcentral-integration/widgets/components/TabNavigationView';

import DialPadIcon from '@ringcentral-integration/widgets/assets/images/DialPadNav.svg';
import CallHistoryIcon from '@ringcentral-integration/widgets/assets/images/CallHistory.svg';
import MessageIcon from '@ringcentral-integration/widgets/assets/images/Messages.svg';
import SettingsIcon from '@ringcentral-integration/widgets/assets/images/Settings.svg';
import MoreMenuIcon from '@ringcentral-integration/widgets/assets/images/MoreMenu.svg';
import GlipIcon from '@ringcentral-integration/widgets/assets/images/Glip.svg';

import DialPadHoverIcon from '@ringcentral-integration/widgets/assets/images/DialPadHover.svg';
import CallHistoryHoverIcon from '@ringcentral-integration/widgets/assets/images/CallHistoryHover.svg';
import MessageHoverIcon from '@ringcentral-integration/widgets/assets/images/MessagesHover.svg';
import SettingsHoverIcon from '@ringcentral-integration/widgets/assets/images/SettingsHover.svg';
import MoreMenuHoverIcon from '@ringcentral-integration/widgets/assets/images/MoreMenuHover.svg';

import GlipHoverIcon from '@ringcentral-integration/widgets/assets/images/GlipHover.svg';
import SettingsNavIcon from '@ringcentral-integration/widgets/assets/images/SettingsNavigation.svg';

import ContactHoverIcon from '@ringcentral-integration/widgets/assets/images/ContactHover.svg';
import ContactIcon from '@ringcentral-integration/widgets/assets/images/Contact.svg';
import ContactNavIcon from '@ringcentral-integration/widgets/assets/images/ContactsNavigation.svg';

import MeetingIcon from '@ringcentral-integration/widgets/assets/images/Meeting.svg';
import MeetingHoverIcon from '@ringcentral-integration/widgets/assets/images/MeetingHover.svg';
import MeetingNavIcon from '@ringcentral-integration/widgets/assets/images/MeetingNavigation.svg';

import i18n from './i18n';

export const MainViewPanel = (props) => {
  const {
    currentLocale,
    showMessages,
    unreadCounts,
    showMeeting,
    showCall,
    showHistory,
    showContacts,
    showGlip,
    glipUnreadCounts,
    isRCV,
    rcvProductName,
  } = props;
  const tabList = [
    showCall && {
      icon: DialPadIcon,
      activeIcon: DialPadHoverIcon,
      label: i18n.getString('dialpadLabel', currentLocale),
      path: '/dialer',
      isActive: (currentPath) => (
        currentPath === '/dialer' ||
        currentPath === '/calls' ||
        currentPath.indexOf('/calls/active') !== -1
      ),
    },
    showCall && showHistory && {
      icon: CallHistoryIcon,
      activeIcon: CallHistoryHoverIcon,
      label: i18n.getString('historyLabel', currentLocale),
      path: '/history',
      isActive: (currentPath) => (
        currentPath === '/history'
      ),
    },
    showMessages && {
      icon: MessageIcon,
      activeIcon: MessageHoverIcon,
      label: i18n.getString('messagesLabel', currentLocale),
      path: '/messages',
      noticeCounts: unreadCounts,
      isActive: (currentPath) => (
        currentPath === '/messages' ||
        currentPath === '/composeText' ||
        currentPath.indexOf('/conversations/') !== -1
      ),
    },
    showGlip && {
      icon: GlipIcon,
      activeIcon: GlipHoverIcon,
      label: i18n.getString('glipLabel', currentLocale),
      path: '/glip',
      noticeCounts: glipUnreadCounts,
      isActive: currentPath => (
        currentPath === '/glip' ||
        currentPath.indexOf('/glip/') !== -1
      ),
    },
    showContacts && {
      icon: ContactIcon,
      activeIcon: ContactHoverIcon,
      moreMenuIcon: ContactNavIcon,
      label: i18n.getString('contactsLabel', currentLocale),
      path: '/contacts',
      isActive: (currentPath) => (
        currentPath.substr(0, 9) === '/contacts'
      ),
    },
    showMeeting && {
      icon: MeetingIcon,
      activeIcon: MeetingHoverIcon,
      moreMenuIcon: MeetingNavIcon,
      label: isRCV ? rcvProductName : i18n.getString('meetingLabel', currentLocale),
      path: isRCV ? '/meeting/home' : '/meeting/schedule',
      isActive: (currentPath) => (
        currentPath.indexOf('/meeting') === 0
      ),
    },
    {
      icon: SettingsIcon,
      activeIcon: SettingsHoverIcon,
      moreMenuIcon: SettingsNavIcon,
      label: i18n.getString('settingsLabel', currentLocale),
      path: '/settings',
      isActive: currentPath => (
        currentPath.substr(0, 9) === '/settings'
      ),
    }
  ];
  let tabs = tabList.filter((x) => !!x);
  if (tabs.length > 5) {
    const childTabs = tabs.slice(4, tabs.length);
    tabs = tabs.slice(0, 4);
    tabs.push({
      icon: ({ currentPath }) => {
        const childTab = childTabs.filter(childTab => (
          (currentPath === childTab.path || childTab.isActive(currentPath))
            && childTab.moreMenuIcon
        ));
        if (childTab.length > 0) {
          const Icon = childTab[0].moreMenuIcon;
          return <Icon />;
        }
        return <MoreMenuIcon />;
      },
      activeIcon: ({ currentPath }) => {
        const childTab = childTabs.filter(childTab => (
          (currentPath === childTab.path || childTab.isActive(currentPath))
            && childTab.moreMenuIcon
        ));
        if (childTab.length > 0) {
          const Icon = childTab[0].moreMenuIcon;
          return <Icon />;
        }
        return <MoreMenuHoverIcon />;
      },
      label: i18n.getString('moreMenuLabel', currentLocale),
      virtualPath: '!moreMenu',
      isActive: (currentPath, currentVirtualPath) => (
        currentVirtualPath === '!moreMenu'
      ),
      childTabs
    });
  }
  return <TabNavigationView {...props} tabs={tabs} />;
}