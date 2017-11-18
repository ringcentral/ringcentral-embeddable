import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import withPhone from 'ringcentral-widgets/lib/withPhone';
import OfflineModeBadge from 'ringcentral-widgets/components/OfflineModeBadge';
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
};

AppView.defaultProps = {
  children: null,
  server: null,
  appSecret: null,
  appKey: null,
  enabled: false,
  onSetData: undefined,
};

export default withPhone(connect((_, {
  phone: {
    locale,
    auth,
    environment,
    connectivityMonitor,
    rateLimiter,
  }
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
  redirectUri: auth.redirectUri
}), (_, {
  phone: {
    environment,
    connectivityMonitor,
    rateLimiter,
  },
}) => ({
  onSetData: (options) => {
    environment.setData(options);
  },
  showOfflineAlert: () => {
    rateLimiter.showAlert();
    connectivityMonitor.showAlert();
  },
}))(AppView));
