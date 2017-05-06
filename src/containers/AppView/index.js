import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import loginStatus from 'ringcentral-integration/modules/Auth/loginStatus';
import SpinnerOverlay from 'ringcentral-widget/components/SpinnerOverlay';
import OfflineModeBadge from 'ringcentral-widget/components/OfflineModeBadge';
import Environment from 'ringcentral-widget/components/Environment';

import styles from './styles.scss';

function AppView(props) {
  const spinner = props.showSpinner ?
    <SpinnerOverlay /> :
    null;

  return (
    <div className={styles.root}>
      {props.children}
      {spinner}

      <OfflineModeBadge
        offline={props.offline}
        showOfflineAlert={props.showOfflineAlert}
        currentLocale={props.currentLocale}
      />
      <Environment
        server={props.server}
        enabled={props.enabled}
        onSetData={props.onSetData}
        recordingHost={''}
      />
    </div>
  );
}

AppView.propTypes = {
  children: PropTypes.node,
  showSpinner: PropTypes.bool.isRequired,
  server: PropTypes.string,
  enabled: PropTypes.bool,
  onSetData: PropTypes.func,
  currentLocale: PropTypes.string.isRequired,
  offline: PropTypes.bool.isRequired,
  showOfflineAlert: PropTypes.func.isRequired,
};

AppView.defaultProps = {
  children: null,
  server: null,
  enabled: false,
  onSetData: undefined,
};

export default connect((state, {
  locale,
  auth,
  environment,
  callingSettings,
  connectivityMonitor,
  rateLimiter,
}) => ({
  currentLocale: locale.currentLocale,
  showSpinner: (
    (auth.loginStatus !== loginStatus.loggedIn &&
      auth.loginStatus !== loginStatus.notLoggedIn) ||
    (auth.loginStatus === loginStatus.loggedIn &&
      !callingSettings.ready)
  ),
  server: environment.server,
  enabled: environment.enabled,
  offline: (
    !connectivityMonitor.connectivity ||
    auth.proxyRetryCount > 0 ||
    rateLimiter.throttling
  ),
}), (dispatch, {
  environment,
  connectivityMonitor,
  rateLimiter,
}) => ({
  onSetData: (options) => {
    environment.setData(options);
  },
  showOfflineAlert: () => {
    rateLimiter.showAlert();
    connectivityMonitor.showAlert();
  },
}))(AppView);
