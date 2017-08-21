import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import dynamicsFont from 'ringcentral-widget/assets/DynamicsFont/DynamicsFont.scss';
import TabNavigationView from 'ringcentral-widget/components/TabNavigationView';
import RouterInteraction from 'ringcentral-widget/modules/RouterInteraction';


function getTabs({
  showMessages,
  showComposeText,
  unreadCounts,
  showConference,
}) {
  return [
    {
      icon: <span className={dynamicsFont.dial} />,
      activeIcon: <span className={dynamicsFont.dialHover} />,
      label: 'Dial Pad',
      path: '/dialer',
    },
    {
      icon: <span className={dynamicsFont.active} />,
      activeIcon: <span className={dynamicsFont.activeHover} />,
      label: 'Calls',
      path: '/calls',
      isActive: currentPath => (
        currentPath === '/calls' || currentPath === '/calls/active'
      ),
    },
    {
      icon: <span className={dynamicsFont.history} />,
      activeIcon: <span className={dynamicsFont.historyHover} />,
      label: 'History',
      path: '/history',
    },
    showMessages && {
      icon: <span className={dynamicsFont.message} />,
      activeIcon: <span className={dynamicsFont.messageHover} />,
      label: 'Messages',
      path: '/messages',
      noticeCounts: unreadCounts,
      isActive: currentPath => (
        currentPath === '/messages' || currentPath.indexOf('/conversations/') !== -1
      ),
    },
    showComposeText && {
      icon: <span className={dynamicsFont.composeText} />,
      activeIcon: <span className={dynamicsFont.composeTextHover} />,
      label: 'Compose Text',
      path: '/composeText',
    },
    showConference && {
      icon: <span className={dynamicsFont.conference} />,
      activeIcon: <span className={dynamicsFont.conferenceHover} />,
      label: 'Conference',
      path: '/conference',
    },
    {
      icon: <span className={dynamicsFont.setting} />,
      activeIcon: <span className={dynamicsFont.settingHover} />,
      label: 'Settings',
      path: '/settings',
      isActive: currentPath => (
        currentPath.substr(0, 9) === '/settings'
      ),
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
      router.push(path);
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
