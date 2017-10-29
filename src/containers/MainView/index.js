import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import TabNavigationView from 'ringcentral-widget/components/TabNavigationView';
import RouterInteraction from 'ringcentral-widget/modules/RouterInteraction';

import DialPadIcon from 'ringcentral-widget/assets/images/DialPadNav.svg';
import CallsIcon from 'ringcentral-widget/assets/images/Calls.svg';
import HistoryIcon from 'ringcentral-widget/assets/images/CallHistory.svg';
import MessageIcon from 'ringcentral-widget/assets/images/Messages.svg';
import ComposeTextIcon from 'ringcentral-widget/assets/images/ComposeText.svg';
import ConferenceIcon from 'ringcentral-widget/assets/images/Conference.svg';
import SettingsIcon from 'ringcentral-widget/assets/images/Settings.svg';
import MoreMenuIcon from 'ringcentral-widget/assets/images/MoreMenu.svg';

import DialPadHoverIcon from 'ringcentral-widget/assets/images/DialPadHover.svg';
import CallsHoverIcon from 'ringcentral-widget/assets/images/CallsHover.svg';
import HistoryHoverIcon from 'ringcentral-widget/assets/images/CallHistoryHover.svg';
import MessageHoverIcon from 'ringcentral-widget/assets/images/MessagesHover.svg';
import ComposeTextHoverIcon from 'ringcentral-widget/assets/images/ComposeTextHover.svg';
import ConferenceHoverIcon from 'ringcentral-widget/assets/images/ConferenceHover.svg';
import SettingsHoverIcon from 'ringcentral-widget/assets/images/SettingsHover.svg';
import MoreMenuHoverIcon from 'ringcentral-widget/assets/images/MoreMenuHover.svg';

import ConferenceNavIcon from 'ringcentral-widget/assets/images/ConferenceNavigation.svg';
import SettingsNavIcon from 'ringcentral-widget/assets/images/SettingsNavigation.svg';

function getTabs({
  showMessages,
  showComposeText,
  unreadCounts,
  showConference,
}) {
  return [
    {
      icon: DialPadIcon,
      activeIcon: DialPadHoverIcon,
      label: 'Dial Pad',
      path: '/dialer',
    },
    {
      icon: CallsIcon,
      activeIcon: CallsHoverIcon,
      label: 'Calls',
      path: '/calls',
      isActive: currentPath => (
        currentPath === '/calls' || currentPath === '/calls/active'
      ),
    },
    {
      icon: HistoryIcon,
      activeIcon: HistoryHoverIcon,
      label: 'History',
      path: '/history',
    },
    showMessages && {
      icon: MessageIcon,
      activeIcon: MessageHoverIcon,
      label: 'Messages',
      path: '/messages',
      noticeCounts: unreadCounts,
      isActive: currentPath => (
        currentPath === '/messages' || currentPath.indexOf('/conversations/') !== -1
      ),
    },
    showComposeText && {
      icon: ComposeTextIcon,
      activeIcon: ComposeTextHoverIcon,
      label: 'Compose Text',
      path: '/composeText',
    },
    showConference && {
      icon: ConferenceIcon,
      activeIcon: ConferenceHoverIcon,
      label: 'Conference',
      path: '/conference',
    },
    {
      icon: ({ currentPath }) => {
        if (currentPath.substr(0, 9) === '/settings') {
          return <SettingsNavIcon />;
        } else if (currentPath === '/conference') {
          return <ConferenceNavIcon />;
        }
        return <MoreMenuIcon />;
      },
      activeIcon: MoreMenuHoverIcon,
      label: 'More Menu',
      virtualPath: '!moreMenu',
      isActive: (currentPath, currentVirtualPath) => (
        currentVirtualPath === '!moreMenu'
      ),
      childTabs: [
        showConference && {
          icon: ConferenceIcon,
          activeIcon: ConferenceHoverIcon,
          label: 'Schedule Conference',
          path: '/conference',
        },
        {
          icon: SettingsIcon,
          activeIcon: SettingsHoverIcon,
          label: 'Settings',
          path: '/settings',
          isActive: currentPath => (
            currentPath.substr(0, 9) === '/settings'
          ),
        },
      ].filter(x => !!x),
    },
  ].filter(x => !!x);
}

function mapToProps(_, {
  messageStore,
  rolesAndPermissions,
  router,
}) {
  const unreadCounts = messageStore.unreadCounts || 0;
  const serviceFeatures = rolesAndPermissions.serviceFeatures;
  const showComposeText = (
    rolesAndPermissions.ready &&
    (
      (serviceFeatures.Pager && serviceFeatures.Pager.enabled) ||
      (serviceFeatures.SMS && serviceFeatures.SMS.enabled)
    )
  );
  const showMessages = (
    rolesAndPermissions.ready &&
    (
      (
        serviceFeatures.PagerReceiving &&
        serviceFeatures.PagerReceiving.enabled
      ) ||
      (
        serviceFeatures.SMSReceiving &&
        serviceFeatures.SMSReceiving.enabled
      )
    )
  );
  const showConference = false;
  const tabs = getTabs({
    unreadCounts,
    showComposeText,
    showMessages,
    showConference,
  });
  return {
    tabs,
    unreadCounts,
    currentPath: router.currentPath,
  };
}
function mapToFunctions(_, {
  router,
}) {
  return {
    goTo: (path) => {
      if (path) {
        router.push(path);
      }
    },
  };
}

const MainView = connect(
  mapToProps,
  mapToFunctions
)(TabNavigationView);

MainView.propTypes = {
  router: PropTypes.instanceOf(RouterInteraction).isRequired,
  tabs: TabNavigationView.propTypes.tabs,
};

export default MainView;
