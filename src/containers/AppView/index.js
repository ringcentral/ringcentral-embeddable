import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import callingModes from 'ringcentral-integration/modules/CallingSettings/callingModes';
import withPhone from 'ringcentral-widgets/lib/withPhone';
import OfflineModeBadge from 'ringcentral-widgets/components/OfflineModeBadge';
import WebphoneBadge from 'ringcentral-widgets/components/WebphoneBadge';
import Environment from '../../components/Environment';

import styles from './styles.scss';

function AppView(props) {
  const {
    offline,
    webphoneUnavailable,
    onWebphoneBadgeClicked,
    currentLocale,
    showOfflineAlert,
    survivalModeActivated,
  } = props;
  let badge = null;
  if (offline) {
    badge = (
      <OfflineModeBadge
        offline={props.offline}
        showOfflineAlert={props.showOfflineAlert}
        currentLocale={props.currentLocale}
      />
    );
  } else if (webphoneUnavailable) {
    badge = (
      <WebphoneBadge
        currentLocale={props.currentLocale}
        onClick={onWebphoneBadgeClicked}
        isConnecting={props.webphoneConnecting}
      />
    );
  } else if (survivalModeActivated) {
    badge = (
      <OfflineModeBadge
        offline
        badgeTitle="limitedMode"
        showOfflineAlert={showOfflineAlert}
        currentLocale={currentLocale}
      />
    );
  }
  return (
    <div className={styles.root}>
      {props.children}
      {badge}
      <Environment
        server={props.server}
        enabled={props.enabled}
        appKey={props.appKey}
        appSecret={props.appSecret}
        onSetData={props.onSetData}
        redirectUri={props.redirectUri}
        recordingHost={''}
      />
    </div>
  );
}

AppView.propTypes = {
  children: PropTypes.node,
  server: PropTypes.string,
  appKey: PropTypes.string,
  appSecret: PropTypes.string,
  enabled: PropTypes.bool,
  onSetData: PropTypes.func,
  currentLocale: PropTypes.string.isRequired,
  offline: PropTypes.bool.isRequired,
  showOfflineAlert: PropTypes.func.isRequired,
  redirectUri: PropTypes.string.isRequired,
  webphoneUnavailable: PropTypes.bool.isRequired,
  onWebphoneBadgeClicked: PropTypes.func.isRequired,
  webphoneConnecting: PropTypes.bool,
  survivalModeActivated: PropTypes.bool,
};

AppView.defaultProps = {
  children: null,
  server: null,
  appSecret: null,
  appKey: null,
  enabled: false,
  onSetData: undefined,
  webphoneConnecting: false,
  survivalModeActivated: false,
};

export default withPhone(connect((_, {
  phone: {
    locale,
    oAuth,
    audioSettings,
    callingSettings,
    webphone,
    environment,
    connectivityMonitor,
    auth,
    availabilityMonitor,
  }
}) => ({
  currentLocale: locale.currentLocale,
  server: environment.server,
  appKey: environment.appKey,
  appSecret: environment.appSecret,
  enabled: environment.enabled,
  offline: (
    !connectivityMonitor.connectivity
    || oAuth.proxyRetryCount > 0
  ),
  webphoneUnavailable: (
    auth.ready &&
    audioSettings.ready &&
    webphone.ready &&
    callingSettings.ready &&
    auth.loggedIn &&
    callingSettings.isWebphoneMode &&
    (
      !audioSettings.userMedia ||
      (webphone.reconnecting || webphone.connectError)
    )
  ),
  webphoneConnecting: (webphone.ready && webphone.reconnecting),
  redirectUri: oAuth.redirectUri,
  survivalModeActivated:
      !!availabilityMonitor && availabilityMonitor.isLimitedAvailabilityMode,
}), (_, {
  phone: {
    environment,
    callingSettings,
    connectivityMonitor,
    rateLimiter,
    audioSettings,
    webphone,
  },
}) => ({
  onSetData: (options) => {
    environment.setData(options);
  },
  showOfflineAlert: () => {
    rateLimiter.showAlert();
    connectivityMonitor.showAlert();
  },
  onWebphoneBadgeClicked: () => {
    // Only works for webphone mode
    if (callingSettings.callingMode !== callingModes.webphone) {
      return;
    }
    if (audioSettings && audioSettings.ready) {
      audioSettings.showAlert();
      audioSettings.getUserMedia();
    }
    if (webphone && webphone.ready) {
      // Trigger reconnect
      webphone.connect();
    }
  },
}))(AppView));
