import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import OfflineModeBadge from 'ringcentral-widget/components/OfflineModeBadge';
import Environment from '../../components/Environment';

import styles from './styles.scss';

function AppView(props) {
  return (
    <div className={styles.root}>
      {props.children}

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
  connectivityMonitor,
  rateLimiter,
  hostingUrl,
}) => ({
  currentLocale: locale.currentLocale,
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
