import React from 'react';
import { connect } from 'react-redux';

import callingOptions from 'ringcentral-integration/modules/CallingSettings/callingOptions';
import withPhone from 'ringcentral-widgets/lib/withPhone';

import TabNavigationView from 'ringcentral-widgets/components/TabNavigationView';

import DialPadIcon from 'ringcentral-widgets/assets/images/DialPadNav.svg';
import CallsIcon from 'ringcentral-widgets/assets/images/Calls.svg';
import HistoryIcon from 'ringcentral-widgets/assets/images/CallHistory.svg';
import MessageIcon from 'ringcentral-widgets/assets/images/Messages.svg';
import ComposeTextIcon from 'ringcentral-widgets/assets/images/ComposeText.svg';
import SettingsIcon from 'ringcentral-widgets/assets/images/Settings.svg';
import MoreMenuIcon from 'ringcentral-widgets/assets/images/MoreMenu.svg';
import ContactIcon from 'ringcentral-widgets/assets/images/Contact.svg';

import DialPadHoverIcon from 'ringcentral-widgets/assets/images/DialPadHover.svg';
import CallsHoverIcon from 'ringcentral-widgets/assets/images/CallsHover.svg';
import HistoryHoverIcon from 'ringcentral-widgets/assets/images/CallHistoryHover.svg';
import MessageHoverIcon from 'ringcentral-widgets/assets/images/MessagesHover.svg';
import ComposeTextHoverIcon from 'ringcentral-widgets/assets/images/ComposeTextHover.svg';
import SettingsHoverIcon from 'ringcentral-widgets/assets/images/SettingsHover.svg';
import MoreMenuHoverIcon from 'ringcentral-widgets/assets/images/MoreMenuHover.svg';
import ContactHoverIcon from 'ringcentral-widgets/assets/images/ContactHover.svg';

import SettingsNavIcon from 'ringcentral-widgets/assets/images/SettingsNavigation.svg';

import styles from './styles.scss';

function getTabs({
  showMessages,
  showComposeText,
  unreadCounts,
  showCalls,
}) {
  return [
    {
      icon: DialPadIcon,
      activeIcon: DialPadHoverIcon,
      label: 'Dial Pad',
      path: '/dialer',
    },
    showCalls && {
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
    {
      icon: () => <ContactIcon className={styles.contactIcon} />,
      activeIcon: () => <ContactHoverIcon className={styles.contactHoverIcon} />,
      label: 'Contacts',
      path: '/contacts',
      isActive: currentPath => (
        currentPath.substr(0, 9) === '/contacts'
      ),
    },
    {
      icon: ({ currentPath }) => {
        if (currentPath.substr(0, 9) === '/settings') {
          return <SettingsNavIcon />;
        }
        return <MoreMenuIcon />;
      },
      activeIcon: ({ currentPath }) => {
        if (currentPath.substr(0, 9) === '/settings') {
          return <SettingsNavIcon />;
        }
        return <MoreMenuHoverIcon />;
      },
      label: 'More Menu',
      virtualPath: '!moreMenu',
      isActive: (currentPath, currentVirtualPath) => (
        currentVirtualPath === '!moreMenu'
      ),
      childTabs: [
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
  phone: {
    messageStore,
    rolesAndPermissions,
    routerInteraction,
    callingSettings,
  },
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
  const showCalls = callingSettings.ready &&
    callingSettings.callWith !== callingOptions.browser;
  const tabs = getTabs({
    unreadCounts,
    showComposeText,
    showMessages,
    showCalls,
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
