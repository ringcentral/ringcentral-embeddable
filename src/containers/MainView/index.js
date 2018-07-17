import React from 'react';
import { connect } from 'react-redux';
import withPhone from 'ringcentral-widgets/lib/withPhone';

import TabNavigationView from 'ringcentral-widgets/components/TabNavigationView';

import DialPadIcon from 'ringcentral-widgets/assets/images/DialPadNav.svg';
import CallsIcon from 'ringcentral-widgets/assets/images/Calls.svg';
import MessageIcon from 'ringcentral-widgets/assets/images/Messages.svg';
import SettingsIcon from 'ringcentral-widgets/assets/images/Settings.svg';
import MoreMenuIcon from 'ringcentral-widgets/assets/images/MoreMenu.svg';
import ContactIcon from 'ringcentral-widgets/assets/images/Contact.svg';

import DialPadHoverIcon from 'ringcentral-widgets/assets/images/DialPadHover.svg';
import CallsHoverIcon from 'ringcentral-widgets/assets/images/CallsHover.svg';
import MessageHoverIcon from 'ringcentral-widgets/assets/images/MessagesHover.svg';
import SettingsHoverIcon from 'ringcentral-widgets/assets/images/SettingsHover.svg';
import MoreMenuHoverIcon from 'ringcentral-widgets/assets/images/MoreMenuHover.svg';
import ContactHoverIcon from 'ringcentral-widgets/assets/images/ContactHover.svg';

import SettingsNavIcon from 'ringcentral-widgets/assets/images/SettingsNavigation.svg';

import ConferenceIcon from 'ringcentral-widgets/assets/images/Conference.svg';
import ConferenceHoverIcon from 'ringcentral-widgets/assets/images/ConferenceHover.svg';
import ConferenceNavIcon from 'ringcentral-widgets/assets/images/ConferenceNavigation.svg';

function getTabs({
  showMessages,
  unreadCounts,
  showConference,
  showCall,
  showContacts,
}) {
  let tabs = [
    showCall && {
      icon: DialPadIcon,
      activeIcon: DialPadHoverIcon,
      label: 'Dial Pad',
      path: '/dialer',
    },
    showCall && {
      icon: CallsIcon,
      activeIcon: CallsHoverIcon,
      label: 'Calls',
      path: '/calls',
      isActive: currentPath => (
        currentPath === '/calls' || currentPath === '/calls/active'
      ),
    },
    showMessages && {
      icon: MessageIcon,
      activeIcon: MessageHoverIcon,
      label: 'Messages',
      path: '/messages',
      noticeCounts: unreadCounts,
      isActive: currentPath => (
        currentPath === '/messages' ||
        currentPath === '/composeText' ||
        currentPath.indexOf('/conversations/') !== -1
      ),
    },
    showContacts && {
      icon: ContactIcon,
      activeIcon: ContactHoverIcon,
      label: 'Contacts',
      path: '/contacts',
      isActive: currentPath => (
        currentPath.substr(0, 9) === '/contacts'
      ),
    },
    showConference && {
      icon: ConferenceIcon,
      activeIcon: ConferenceHoverIcon,
      moreMenuIcon: ConferenceNavIcon,
      label: 'Schedule Conference',
      path: '/conference',
      isActive: currentPath => (
        currentPath.substr(0, 11) === '/conference'
      ),
    },
    {
      icon: SettingsIcon,
      activeIcon: SettingsHoverIcon,
      moreMenuIcon: SettingsNavIcon,
      label: 'Settings',
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
          (currentPath === childTab.path || currentPath.substr(0, 9) === childTab.path)
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
          (currentPath === childTab.path || currentPath.substr(0, 9) === childTab.path)
            && childTab.moreMenuIcon
        ));
        if (childTab.length > 0) {
          const Icon = childTab[0].moreMenuIcon;
          return <Icon />;
        }
        return <MoreMenuHoverIcon />;
      },
      label: 'More Menu',
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
    messageStore,
    rolesAndPermissions,
    routerInteraction,
    conference,
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
  const showContacts = rolesAndPermissions.ready && rolesAndPermissions.contactsEnabled
  const tabs = getTabs({
    unreadCounts,
    showCall,
    showMessages,
    showConference,
    showContacts,
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
