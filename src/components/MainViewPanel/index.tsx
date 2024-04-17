import React from 'react';
import type { ReactNode } from 'react';
import {
  Phone,
  PhoneBorder,
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
  FaxBorder,
  Fax,
  SmsBorder,
  Sms,
} from '@ringcentral/juno-icon';
import { TabNavigationView } from '../TabNavigationView';

import i18n from './i18n';

type Tab = {
  icon?: ReactNode,
  activeIcon?: ReactNode,
  iconUri?: string,
  activeIconUri?: string,
  label: string,
  path: string,
  noticeCounts?: number,
  isActive: (currentPath: string) => boolean,
  showHeader: (currentPath: string) => boolean,
  actionsInHeaderRight?: Array<{
    icon: ReactNode,
    title: string,
    onClick: () => void,
  }>,
  showHeaderBorder?: boolean,
  priority?: number,
  childTabs?: Tab[],
};

export const MainViewPanel = (props) => {
  const {
    currentLocale,
    showText,
    showMeeting,
    showPhone,
    showContacts,
    showGlip,
    glipUnreadCounts,
    isRCV,
    settingsUnreadCount,
    showNewComposeText,
    phoneTabPath,
    showFax,
    faxUnreadCounts,
    smsUnreadCounts,
    voiceUnreadCounts,
    customizedTabs,
  } = props;
  const tabList: Tab[] = [];
  if (showPhone) {
    tabList.push({
      icon: PhoneBorder,
      activeIcon: Phone,
      label: i18n.getString('phoneLabel', currentLocale),
      path: phoneTabPath,
      noticeCounts: voiceUnreadCounts,
      priority: 10,
      isActive: (currentPath) => (
        currentPath === '/dialer' ||
        currentPath === '/history' ||
        currentPath === '/history/recordings' ||
        currentPath === '/messages/voicemail'
      ),
      showHeader: (currentPath) => {
        return (
          currentPath === '/history' ||
          currentPath === '/history/recordings' ||
          currentPath === '/dialer' ||
          currentPath === '/messages/voicemail'
        );
      },
      actionsInHeaderRight: [{
        icon: SettingsBorder,
        title: i18n.getString('settingsLabel', currentLocale),
        onClick: () => {
          props.goTo('/settings');
        },
      }]
    });
  }
  if (showText) {
    tabList.push({
      icon: SmsBorder,
      activeIcon: Sms,
      label: i18n.getString('textLabel', currentLocale),
      path: '/messages',
      noticeCounts: smsUnreadCounts,
      priority: 20,
      isActive: (currentPath) => (
        currentPath === '/messages'
      ),
      showHeader: (currentPath) => {
        return (
          currentPath === '/messages'
        );
      },
      showHeaderBorder: true,
      actionsInHeaderRight: showNewComposeText ? [{
        icon: SmsInviteBorder,
        title: i18n.getString('composeText', currentLocale),
        onClick: () => {
          props.goTo('/composeText');
        },
      }] : [],
    });
  }
  if (showFax) {
    tabList.push({
      icon: FaxBorder,
      activeIcon: Fax,
      label: i18n.getString('faxLabel', currentLocale),
      path: '/messages/fax',
      noticeCounts: faxUnreadCounts,
      priority: 30,
      isActive: (currentPath) => (
        currentPath === '/messages/fax'
      ),
      showHeaderBorder: true,
      showHeader: () => {
        return true;
      },
    });
  }
  if (showGlip) {
    tabList.push({
      icon: BubbleLinesBorder,
      activeIcon: BubbleLines,
      label: i18n.getString('glipLabel', currentLocale),
      path: '/glip',
      noticeCounts: glipUnreadCounts,
      priority: 40,
      isActive: currentPath => (
        currentPath === '/glip' ||
        currentPath.indexOf('/glip/') !== -1
      ),
      showHeader: (currentPath) => {
        return (
          currentPath === '/glip'
        );
      },
    });
  }
  if (showContacts) {
    tabList.push({
      icon: ContactsBorder,
      activeIcon: Contacts,
      label: i18n.getString('contactsLabel', currentLocale),
      path: '/contacts',
      priority: 50,
      isActive: (currentPath) => (
        currentPath.substr(0, 9) === '/contacts'
      ),
      showHeader: (currentPath) => {
        return (
          currentPath === '/contacts'
        );
      },
    });
  }
  if (showMeeting) {
    tabList.push({
      icon: VideocamBorder,
      activeIcon: Videocam,
      label: i18n.getString('meetingLabel', currentLocale),
      path: isRCV ? '/meeting/home' : '/meeting/schedule',
      priority: 60,
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
    });
  }
  tabList.push({
    icon: SettingsBorder,
    activeIcon: Settings,
    label: i18n.getString('settingsLabel', currentLocale),
    path: '/settings',
    noticeCounts: settingsUnreadCount,
    priority: 70,
    isActive: currentPath => (
      currentPath.substr(0, 9) === '/settings'
    ),
    showHeader: (currentPath) => {
      return (
        currentPath === '/settings'
      );
    },
    showHeaderBorder: false,
  });
  customizedTabs.forEach((customTab) => {
    tabList.push({
      label: customTab.label,
      path: customTab.path,
      noticeCounts: customTab.unreadCount,
      isActive: (currentPath) => currentPath === customTab.path,
      showHeader: () => true,
      showHeaderBorder: true,
      priority: customTab.priority,
      iconUri: customTab.iconUri,
      activeIconUri: customTab.activeIconUri,
    });
  });

  let tabs = tabList.sort((a, b) => {
    return (a.priority || 100) - (b.priority || 100);
  });
  if (tabs.length > 5) {
    const childTabs = tabs.slice(4, tabs.length);
    tabs = tabs.slice(0, 4);
    tabs.push({
      icon: MoreHoriz,
      activeIcon: MoreHoriz,
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
