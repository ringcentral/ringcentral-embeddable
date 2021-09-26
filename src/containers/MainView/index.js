import React from 'react';
import { connect } from 'react-redux';
import withPhone from '@ringcentral-integration/widgets/lib/withPhone';

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

import ConferenceIcon from '@ringcentral-integration/widgets/assets/images/Conference.svg';
import ConferenceHoverIcon from '@ringcentral-integration/widgets/assets/images/ConferenceHover.svg';
import ConferenceNavIcon from '@ringcentral-integration/widgets/assets/images/ConferenceNavigation.svg';

import MeetingIcon from '@ringcentral-integration/widgets/assets/images/Meeting.svg';
import MeetingHoverIcon from '@ringcentral-integration/widgets/assets/images/MeetingHover.svg';
import MeetingNavIcon from '@ringcentral-integration/widgets/assets/images/MeetingNavigation.svg';

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
    appFeatures,
    routerInteraction,
    conference,
    glipGroups,
    glipCompany,
    genericMeeting,
  },
}) {
  const unreadCounts = messageStore.unreadCounts || 0;
  const showCall = appFeatures.ready && appFeatures.isCallingEnabled;
  const showMessages = appFeatures.ready && appFeatures.hasReadMessagesPermission;
  const showConference = (
    appFeatures.ready &&
    appFeatures.hasConferencing &&
    conference.data
  );
  const showMeeting = (
    appFeatures.ready &&
    appFeatures.hasMeetingsPermission
  );

  const { currentLocale } = locale;
  const showContacts = appFeatures.ready && appFeatures.isContactsEnabled;
  const tabs = getTabs({
    currentLocale,
    unreadCounts,
    showCall,
    showMessages,
    showConference,
    showMeeting,
    isRCV: genericMeeting.isRCV,
    showContacts,
    showGlip: (appFeatures.hasGlipPermission && !!glipCompany.name),
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
