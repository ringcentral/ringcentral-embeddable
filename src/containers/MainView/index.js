import React from 'react';
import { connect } from 'react-redux';
import withPhone from 'ringcentral-widgets/lib/withPhone';

import TabNavigationView from 'ringcentral-widgets/components/TabNavigationView';

import DialPadIcon from 'ringcentral-widgets/assets/images/DialPadNav.svg';
import CallHistoryIcon from 'ringcentral-widgets/assets/images/CallHistory.svg';
import MessageIcon from 'ringcentral-widgets/assets/images/Messages.svg';
import SettingsIcon from 'ringcentral-widgets/assets/images/Settings.svg';
import MoreMenuIcon from 'ringcentral-widgets/assets/images/MoreMenu.svg';
import GlipIcon from 'ringcentral-widgets/assets/images/Glip.svg';

import DialPadHoverIcon from 'ringcentral-widgets/assets/images/DialPadHover.svg';
import CallHistoryHoverIcon from 'ringcentral-widgets/assets/images/CallHistoryHover.svg';
import MessageHoverIcon from 'ringcentral-widgets/assets/images/MessagesHover.svg';
import SettingsHoverIcon from 'ringcentral-widgets/assets/images/SettingsHover.svg';
import MoreMenuHoverIcon from 'ringcentral-widgets/assets/images/MoreMenuHover.svg';

import GlipHoverIcon from 'ringcentral-widgets/assets/images/GlipHover.svg';
import SettingsNavIcon from 'ringcentral-widgets/assets/images/SettingsNavigation.svg';

import ContactHoverIcon from 'ringcentral-widgets/assets/images/ContactHover.svg';
import ContactIcon from 'ringcentral-widgets/assets/images/Contact.svg';
import ContactNavIcon from 'ringcentral-widgets/assets/images/ContactsNavigation.svg';

import ConferenceIcon from 'ringcentral-widgets/assets/images/Conference.svg';
import ConferenceHoverIcon from 'ringcentral-widgets/assets/images/ConferenceHover.svg';
import ConferenceNavIcon from 'ringcentral-widgets/assets/images/ConferenceNavigation.svg';

import MeetingIcon from 'ringcentral-widgets/assets/images/Meeting.svg';
import MeetingHoverIcon from 'ringcentral-widgets/assets/images/MeetingHover.svg';
import MeetingNavIcon from 'ringcentral-widgets/assets/images/MeetingNavigation.svg';

import i18n from './i18n';

function getTabs({
  currentLocale,
  showMessages,
  unreadCounts,
  showConference,
  showMeeting,
  showCall,
  showContacts,
  showGlip,
  glipUnreadCounts,
  isRCV,
}) {
  let tabs = [
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
    showCall && {
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
    showConference && {
      icon: ConferenceIcon,
      activeIcon: ConferenceHoverIcon,
      moreMenuIcon: ConferenceNavIcon,
      label: i18n.getString('conferenceLabel', currentLocale),
      path: '/conference',
      isActive: (currentPath) => (
        currentPath.substr(0, 11) === '/conference'
      ),
    },
    showMeeting && {
      icon: MeetingIcon,
      activeIcon: MeetingHoverIcon,
      moreMenuIcon: MeetingNavIcon,
      label: isRCV ? 'RingCentral Video' : i18n.getString('meetingLabel', currentLocale),
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
  ].filter(x => !!x);
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
  return tabs;
}

function mapToProps(_, {
  phone: {
    locale,
    messageStore,
    rolesAndPermissions,
    routerInteraction,
    conference,
    glipGroups,
    glipCompany,
    genericMeeting,
  },
}) {
  const unreadCounts = messageStore.unreadCounts || 0;
  const showCall = rolesAndPermissions.ready && rolesAndPermissions.callingEnabled;
  const showMessages = rolesAndPermissions.ready && rolesAndPermissions.messagesEnabled;
  const showConference = (
    rolesAndPermissions.ready &&
    rolesAndPermissions.organizeConferenceEnabled &&
    conference.data
  );
  const showMeeting = (
    rolesAndPermissions.ready &&
    rolesAndPermissions.hasMeetingsPermission
  );

  const { currentLocale } = locale;
  const showContacts = rolesAndPermissions.ready && rolesAndPermissions.contactsEnabled;
  const tabs = getTabs({
    currentLocale,
    unreadCounts,
    showCall,
    showMessages,
    showConference,
    showMeeting,
    isRCV: genericMeeting.isRCV,
    showContacts,
    showGlip: (rolesAndPermissions.hasGlipPermission && !!glipCompany.name),
    glipUnreadCounts: glipGroups.unreadCounts,
  });
  return {
    tabs,
    unreadCounts,
    currentPath: routerInteraction.currentPath,
  };
}
function mapToFunctions(_, {
  phone: {
    routerInteraction,
  }
}) {
  return {
    goTo: (path) => {
      if (path) {
        routerInteraction.push(path);
      }
    },
  };
}

const MainView = withPhone(connect(
  mapToProps,
  mapToFunctions
)(TabNavigationView));

export default MainView;
