import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import loginStatus from 'ringcentral-integration/modules/Auth/loginStatus';
import SpinnerOverlay from 'ringcentral-widget/components/SpinnerOverlay';
import OfflineModeBadge from 'ringcentral-widget/components/OfflineModeBadge';
import Environment from '../../components/Environment';

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
        appKey={props.appKey}
        appSecret={props.appSecret}
        onSetData={props.onSetData}
        hostingUrl={props.hostingUrl}
        recordingHost={''}
      />
    </div>
  );
}

AppView.propTypes = {
  children: PropTypes.node,
  showSpinner: PropTypes.bool.isRequired,
  server: PropTypes.string,
  appKey: PropTypes.string,
  appSecret: PropTypes.string,
  enabled: PropTypes.bool,
  onSetData: PropTypes.func,
  currentLocale: PropTypes.string.isRequired,
  offline: PropTypes.bool.isRequired,
  showOfflineAlert: PropTypes.func.isRequired,
  hostingUrl: PropTypes.string,
};

AppView.defaultProps = {
  children: null,
  server: null,
  appSecret: null,
  appKey: null,
  enabled: false,
  onSetData: undefined,
  hostingUrl: '',
};

export default connect((state, {
  locale,
  auth,
  environment,
  callingSettings,
  connectivityMonitor,
  rateLimiter,
  hostingUrl,
}) => ({
  currentLocale: locale.currentLocale,
  showSpinner: (
    (auth.loginStatus !== loginStatus.loggedIn &&
      auth.loginStatus !== loginStatus.notLoggedIn) ||
    (auth.loginStatus === loginStatus.loggedIn &&
      !callingSettings.ready)
  ),
  server: environment.server,
  appKey: environment.appKey,
  appSecret: environment.appSecret,
  enabled: environment.enabled,
  offline: (
    !connectivityMonitor.connectivity ||
    auth.proxyRetryCount > 0 ||
    rateLimiter.throttling
  ),
  hostingUrl,
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
