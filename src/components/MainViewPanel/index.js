import React from 'react';

import {
  Phone,
  PhoneBorder,
  PhoneInbox,
  PhoneInboxBorder,
  BubbleLines,
  BubbleLinesBorder,
  Contacts,
  ContactsBorder,
  Videocam,
  VideocamBorder,
  MoreHoriz,
  Settings,
  SettingsBorder,
  SmsInviteBorder,
} from '@ringcentral/juno-icon';
import { RcIcon } from '@ringcentral/juno';
import { TabNavigationView } from '../TabNavigationView';

import i18n from './i18n';

const getIconRenderer = ({ Icon }) => {
  return ({ active }) => {
    const color = active ? 'nav.iconSelected' : 'nav.iconDefault';
    return (
      <RcIcon
        symbol={Icon}
        size="medium"
        color={color}
      />
    )
  }
}

export const MainViewPanel = (props) => {
  const {
    currentLocale,
    showMessages,
    unreadCounts,
    showMeeting,
    showCall,
    showContacts,
    showGlip,
    glipUnreadCounts,
    isRCV,
    settingsUnreadCount,
    showNewComposeText,
    phoneTabPath,
  } = props;
  const tabList = [
    showCall && {
      icon: getIconRenderer({ Icon: PhoneBorder }),
      activeIcon: getIconRenderer({ Icon: Phone }),
      label: i18n.getString('phoneLabel', currentLocale),
      path: phoneTabPath,
      isActive: (currentPath) => (
        currentPath === '/dialer' ||
        currentPath === '/history'
      ),
      showHeader: (currentPath) => {
        return (
          currentPath === '/history' ||
          currentPath === '/dialer'
        );
      },
      actionsInHeaderRight: [{
        icon: SettingsBorder,
        title: i18n.getString('settingsLabel', currentLocale),
        onClick: () => {
          props.goTo('/settings');
        },
      }]
    },
    showMessages && {
      icon: getIconRenderer({ Icon: PhoneInboxBorder }),
      activeIcon: getIconRenderer({ Icon: PhoneInbox }),
      label: i18n.getString('inboxLabel', currentLocale),
      path: '/messages',
      noticeCounts: unreadCounts,
      isActive: (currentPath) => (
        currentPath === '/messages' ||
        currentPath === '/composeText' ||
        currentPath.indexOf('/conversations/') !== -1
      ),
      showHeader: (currentPath) => {
        return (
          currentPath === '/messages'
        );
      },
      actionsInHeaderRight: showNewComposeText ? [{
        icon: SmsInviteBorder,
        title: i18n.getString('composeText', currentLocale),
        onClick: () => {
          props.goTo('/composeText');
        },
      }] : [],
    },
    showGlip && {
      icon: getIconRenderer({ Icon: BubbleLinesBorder }),
      activeIcon: getIconRenderer({ Icon: BubbleLines }),
      label: i18n.getString('glipLabel', currentLocale),
      path: '/glip',
      noticeCounts: glipUnreadCounts,
      isActive: currentPath => (
        currentPath === '/glip' ||
        currentPath.indexOf('/glip/') !== -1
      ),
      showHeader: (currentPath) => {
        return (
          currentPath === '/glip'
        );
      },
    },
    showContacts && {
      icon: getIconRenderer({ Icon: ContactsBorder }),
      activeIcon: getIconRenderer({ Icon: Contacts }),
      moreMenuIcon: getIconRenderer({ Icon: MoreHoriz }),
      label: i18n.getString('contactsLabel', currentLocale),
      path: '/contacts',
      isActive: (currentPath) => (
        currentPath.substr(0, 9) === '/contacts'
      ),
      showHeader: (currentPath) => {
        return (
          currentPath === '/contacts'
        );
      },
    },
    showMeeting && {
      icon: getIconRenderer({ Icon: VideocamBorder }),
      activeIcon: getIconRenderer({ Icon: Videocam }),
      moreMenuIcon: getIconRenderer({ Icon: MoreHoriz }),
      label: i18n.getString('meetingLabel', currentLocale),
      path: isRCV ? '/meeting/home' : '/meeting/schedule',
      isActive: (currentPath) => (
        currentPath.indexOf('/meeting') === 0
      ),
      showHeader: (currentPath) => {
        return (
          currentPath === '/meeting/home' ||
          currentPath === '/meeting/history' ||
          currentPath === '/meeting/history/recordings'
        );
      },
    },
    {
      icon: getIconRenderer({ Icon: SettingsBorder }),
      activeIcon: getIconRenderer({ Icon: Settings }),
      moreMenuIcon: getIconRenderer({ Icon: MoreHoriz }),
      label: i18n.getString('settingsLabel', currentLocale),
      path: '/settings',
      noticeCounts: settingsUnreadCount,
      isActive: currentPath => (
        currentPath.substr(0, 9) === '/settings'
      ),
      showHeader: (currentPath) => {
        return (
          currentPath === '/settings'
        );
      },
      showHeaderBorder: false,
    }
  ];
  let tabs = tabList.filter((x) => !!x);
  if (tabs.length > 5) {
    const childTabs = tabs.slice(4, tabs.length);
    tabs = tabs.slice(0, 4);
    tabs.push({
      icon: ({ currentPath, active }) => {
        const childTab = childTabs.filter(childTab => (
          (currentPath === childTab.path || childTab.isActive(currentPath))
            && childTab.moreMenuIcon
        ));
        if (childTab.length > 0) {
          const Icon = childTab[0].moreMenuIcon;
          return <Icon active={active} />;
        }
        return (
          <RcIcon
            symbol={MoreHoriz}
            size="medium"
            color="nav.iconDefault"
          />
        )
      },
      activeIcon: ({ currentPath, active }) => {
        const childTab = childTabs.filter(childTab => (
          (currentPath === childTab.path || childTab.isActive(currentPath))
            && childTab.moreMenuIcon
        ));
        if (childTab.length > 0) {
          const Icon = childTab[0].moreMenuIcon;
          return <Icon active={active} />;
        }
        return (
          <RcIcon
            symbol={MoreHoriz}
            size="medium"
            color="nav.iconSelected"
          />
        );
      },
      label: i18n.getString('moreMenuLabel', currentLocale),
      path: '!moreMenu',
      isActive: (currentPath) => {
        return childTabs.some(childTab => (
          childTab.isActive(currentPath)
        ))
      },
      childTabs,
      noticeCounts: childTabs.reduce((acc, childTab) => {
        if (childTab.noticeCounts) {
          acc += childTab.noticeCounts;
        }
        return acc;
      }, 0),
      showHeader: () => {
        return false;
      }
    });
  }
  return <TabNavigationView {...props} tabs={tabs} />;
}